# scripts/fine-tune-mistral-lora.py - Fine-tuning script for TradeHax Mistral model
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from peft import get_peft_model, LoraConfig
from huggingface_hub import login
import evaluate
import numpy as np

# Login (use env var HF_API_TOKEN)
login()

# Load dataset
dataset = load_dataset("json", data_files="data/custom-llm/tradehax-training-expanded.jsonl", split="train")
dataset = dataset.train_test_split(test_size=0.1)

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.1")

def preprocess_function(examples):
    return tokenizer(examples["text"], truncation=True, padding="max_length", max_length=512)

tokenized_datasets = dataset.map(preprocess_function, batched=True)

# Model with LoRA
model = AutoModelForCausalLM.from_pretrained(
    "mistralai/Mistral-7B-Instruct-v0.1",
    device_map="auto",
    load_in_4bit=True
)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"]
)
model = get_peft_model(model, lora_config)

# Metrics
metric = evaluate.load("perplexity")

def compute_metrics(eval_pred):
    return metric.compute(predictions=eval_pred.predictions)

# Training args
training_args = TrainingArguments(
    output_dir="./fine-tuned-tradehax-mistral",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    fp16=True,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    push_to_hub=True,
    hub_model_id="irishpride81mf/tradehax-mistral-finetuned"
)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
    compute_metrics=compute_metrics
)

trainer.train()
trainer.push_to_hub()
