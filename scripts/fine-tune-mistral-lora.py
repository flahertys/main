"""Fine-tune Mistral with LoRA for TradeHax.

Usage:
  python scripts/fine-tune-mistral-lora.py
  python scripts/fine-tune-mistral-lora.py --push-to-hub
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import torch
from datasets import load_dataset
from huggingface_hub import login
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TradeHax Mistral LoRA fine-tune")
    parser.add_argument("--push-to-hub", action="store_true", help="Push adapter artifacts to HF Hub")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    use_cuda = torch.cuda.is_available()
    env_model_id = os.getenv("HF_MODEL_ID")
    model_id = env_model_id or ("mistralai/Mistral-7B-Instruct-v0.1" if use_cuda else "sshleifer/tiny-gpt2")
    hub_model_id = os.getenv("HF_HUB_MODEL_ID", "irishpride81mf/tradehax-mistral-finetuned")
    dataset_path = os.getenv("DATASET_PATH", "tradehax-training-expanded.jsonl")
    output_dir = os.getenv("TRAIN_OUTPUT_DIR", "./fine-tuned-tradehax-mistral")
    epochs = int(os.getenv("TRAIN_EPOCHS", "3"))
    batch_size = int(os.getenv("TRAIN_BATCH_SIZE", "2"))
    grad_accum = int(os.getenv("TRAIN_GRAD_ACCUM", "8"))
    lr = float(os.getenv("TRAIN_LR", "2e-5"))
    max_length = int(os.getenv("TRAIN_MAX_LENGTH", "512"))
    lora_r = int(os.getenv("LORA_R", "16"))
    lora_alpha = int(os.getenv("LORA_ALPHA", "32"))

    dataset_file = Path(dataset_path)
    if not dataset_file.exists():
        candidates = [
            Path("tradehax-training-expanded.jsonl"),
            Path("data/custom-llm/tradehax-training-expanded.jsonl"),
            Path("data/custom-llm/tradehax-training-expanded.json"),
        ]
        for candidate in candidates:
            if candidate.exists():
                dataset_file = candidate
                break
    if not dataset_file.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_file}")

    token = os.getenv("HF_API_TOKEN")
    should_push = args.push_to_hub or _bool_env("TRAIN_PUSH_TO_HUB", False)

    if token:
        login(token=token, add_to_git_credential=False)
    elif should_push:
        raise RuntimeError("HF_API_TOKEN is required when push-to-hub is enabled.")

    print(f"Loading dataset from: {dataset_file}")
    dataset = load_dataset("json", data_files=str(dataset_file), split="train")

    def normalize_example(example):
        if isinstance(example.get("text"), str) and example["text"].strip():
            return {"text": example["text"].strip()}

        instructions = example.get("instructions") or example.get("instruction")
        response = example.get("response") or example.get("output")
        context = example.get("input") or example.get("context")
        if isinstance(instructions, str) and isinstance(response, str):
            text = f"Instruction: {instructions.strip()}"
            if isinstance(context, str) and context.strip():
                text += f"\nContext: {context.strip()}"
            text += f"\nAnswer: {response.strip()}"
            return {"text": text}

        messages = example.get("messages")
        if isinstance(messages, list) and messages:
            lines = []
            for message in messages:
                if not isinstance(message, dict):
                    continue
                role = str(message.get("role", "user")).upper()
                content = str(message.get("content", "")).strip()
                if content:
                    lines.append(f"{role}: {content}")
            return {"text": "\n".join(lines).strip()}

        return {"text": ""}

    dataset = dataset.map(normalize_example, remove_columns=dataset.column_names)
    dataset = dataset.filter(lambda row: isinstance(row.get("text"), str) and row["text"].strip() != "")
    dataset = dataset.train_test_split(test_size=0.1, seed=42)

    print(f"Loading tokenizer: {model_id}")
    tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=False)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def preprocess_function(examples):
        tokens = tokenizer(
            examples["text"],
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )
        tokens["labels"] = tokens["input_ids"].copy()
        return tokens

    tokenized_datasets = dataset.map(
        preprocess_function,
        batched=True,
        remove_columns=dataset["train"].column_names,
    )

    use_4bit = use_cuda and os.name != "nt"

    model_kwargs = {
        "device_map": "auto" if use_cuda else None,
    }
    if use_4bit:
        model_kwargs["load_in_4bit"] = True

    print(f"Loading model: {model_id} | cuda={use_cuda} | load_in_4bit={use_4bit}")
    model = AutoModelForCausalLM.from_pretrained(model_id, **model_kwargs)

    if "gpt2" in model_id.lower():
        target_modules = ["c_attn"]
    elif "mistral" in model_id.lower() or "llama" in model_id.lower():
        target_modules = ["q_proj", "v_proj"]
    else:
        target_modules = ["q_proj", "v_proj"]

    lora_config = LoraConfig(
        r=lora_r,
        lora_alpha=lora_alpha,
        target_modules=target_modules,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        gradient_accumulation_steps=grad_accum,
        learning_rate=lr,
        fp16=use_cuda,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        logging_steps=20,
        report_to="none",
        push_to_hub=should_push,
        hub_model_id=hub_model_id,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets["train"],
        eval_dataset=tokenized_datasets["test"],
    )

    trainer.train()

    if should_push:
        trainer.push_to_hub()
        print(f"Pushed to Hugging Face Hub: {hub_model_id}")


if __name__ == "__main__":
    main()
