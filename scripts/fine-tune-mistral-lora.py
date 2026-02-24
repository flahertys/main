#!/usr/bin/env python3
"""
TradeHax LoRA Fine-Tuning Script (Mistral 7B Instruct)

- Supports JSONL with one of these shapes per row:
  1) {"text": "..."}
  2) {"messages": [{"role": "system|user|assistant", "content": "..."}, ...]}
  3) {"instruction": "...", "input": "...", "output": "..."}

- Uses 4-bit quantization + LoRA for cost-efficient training.
- Keeps secrets out of source (reads HF_API_TOKEN from environment).
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from typing import Any, Dict, List

import torch
from datasets import Dataset, DatasetDict, load_dataset
from huggingface_hub import login
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


def env_bool(name: str, fallback: bool = False) -> bool:
    raw = str(os.getenv(name, str(fallback))).strip().lower()
    return raw in {"1", "true", "yes", "on"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fine-tune Mistral with LoRA on TradeHax JSONL data")
    parser.add_argument("--dataset", default=os.getenv("HF_DATASET_PATH", "tradehax-training-expanded.jsonl"))
    parser.add_argument("--base-model", default=os.getenv("HF_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.1"))
    parser.add_argument("--hub-model-id", default=os.getenv("HF_HUB_MODEL_ID", "irishpride81mf/tradehax-mistral-finetuned"))
    parser.add_argument("--output-dir", default=os.getenv("HF_OUTPUT_DIR", "artifacts/fine-tuned-tradehax-mistral"))
    parser.add_argument("--max-length", type=int, default=512)
    parser.add_argument("--epochs", type=float, default=float(os.getenv("TRAIN_EPOCHS", "3")))
    parser.add_argument("--batch-size", type=int, default=int(os.getenv("TRAIN_BATCH_SIZE", "2")))
    parser.add_argument("--grad-accum", type=int, default=int(os.getenv("TRAIN_GRAD_ACCUM", "8")))
    parser.add_argument("--learning-rate", type=float, default=float(os.getenv("TRAIN_LR", "2e-4")))
    parser.add_argument("--eval-ratio", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--push-to-hub", action="store_true", default=env_bool("HF_PUSH_TO_HUB", False))
    return parser


def _string(value: Any, fallback: str = "") -> str:
    if isinstance(value, str):
        return value.strip()
    return fallback


def render_messages(messages: List[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for item in messages:
        role = _string(item.get("role"), "user").upper()
        content = _string(item.get("content"))
        if not content:
            continue
        lines.append(f"{role}: {content}")
    return "\n".join(lines).strip()


def to_text(example: Dict[str, Any]) -> Dict[str, str]:
    if isinstance(example.get("text"), str) and example["text"].strip():
        return {"text": example["text"].strip()}

    messages = example.get("messages")
    if isinstance(messages, list) and messages:
        rendered = render_messages(messages)
        if rendered:
            return {"text": rendered}

    instruction = _string(example.get("instruction") or example.get("instructions"))
    context = _string(example.get("input") or example.get("context"))
    output = _string(example.get("output") or example.get("response"))

    if instruction and output:
        prompt = f"Instruction: {instruction}"
        if context:
            prompt += f"\nContext: {context}"
        text = f"{prompt}\nAnswer: {output}"
        return {"text": text}

    return {"text": ""}


def normalize_dataset(path: str) -> Dataset:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    raw = load_dataset("json", data_files=path, split="train")
    normalized = raw.map(to_text, remove_columns=raw.column_names)
    normalized = normalized.filter(lambda row: isinstance(row.get("text"), str) and row["text"].strip() != "")

    if len(normalized) < 20:
        raise ValueError(f"Dataset too small after normalization ({len(normalized)} rows).")

    return normalized


def build_tokenizer(model_id: str):
    tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    return tokenizer


def tokenize_dataset(dataset: Dataset, tokenizer, max_length: int) -> Dataset:
    def _tokenize(batch: Dict[str, List[str]]) -> Dict[str, Any]:
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=max_length,
            padding="max_length",
        )

    tokenized = dataset.map(_tokenize, batched=True, remove_columns=dataset.column_names)
    return tokenized


@dataclass
class TrainArtifacts:
    trainer: Trainer
    tokenizer: Any


def build_trainer(args, tokenized: DatasetDict, tokenizer) -> TrainArtifacts:
    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        device_map="auto",
        quantization_config=quant_config,
        torch_dtype=torch.float16,
    )

    model = prepare_model_for_kbit_training(model)
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    model = get_peft_model(model, lora_config)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.learning_rate,
        fp16=True,
        logging_steps=25,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        report_to="none",
        remove_unused_columns=False,
        seed=args.seed,
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["test"],
        tokenizer=tokenizer,
        data_collator=data_collator,
    )

    return TrainArtifacts(trainer=trainer, tokenizer=tokenizer)


def main():
    args = build_parser().parse_args()

    token = os.getenv("HF_API_TOKEN", "").strip()
    if not token:
        raise RuntimeError("HF_API_TOKEN is required. Set it in your shell or .env before running.")

    login(token=token, add_to_git_credential=False)

    dataset = normalize_dataset(args.dataset)
    split = dataset.train_test_split(test_size=args.eval_ratio, seed=args.seed)

    tokenizer = build_tokenizer(args.base_model)
    tokenized = DatasetDict(
        {
            "train": tokenize_dataset(split["train"], tokenizer, args.max_length),
            "test": tokenize_dataset(split["test"], tokenizer, args.max_length),
        }
    )

    artifacts = build_trainer(args, tokenized, tokenizer)
    artifacts.trainer.train()

    adapter_dir = os.path.join(args.output_dir, "lora-adapter")
    artifacts.trainer.model.save_pretrained(adapter_dir)
    artifacts.tokenizer.save_pretrained(adapter_dir)

    if args.push_to_hub:
        artifacts.trainer.model.push_to_hub(args.hub_model_id)
        artifacts.tokenizer.push_to_hub(args.hub_model_id)
        print(f"Pushed LoRA adapter + tokenizer to: {args.hub_model_id}")

    print("\nTraining complete.")
    print(f"Adapter saved to: {adapter_dir}")
    print("To use this adapter in production, load base model + adapter with PEFT.")


if __name__ == "__main__":
    main()
