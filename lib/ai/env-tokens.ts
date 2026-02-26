const TOKEN_ALIASES = {
  huggingface: ["HF_API_TOKEN", "HUGGINGFACE_API_TOKEN", "HUGGING_FACE_HUB_TOKEN"],
  openai: ["OPENAI_API_KEY"],
  azureOpenai: ["AZURE_OPENAI_API_KEY"],
  github: ["GITHUB_TOKEN"],
  anthropic: ["ANTHROPIC_API_KEY"],
  groq: ["GROQ_API_KEY"],
  together: ["TOGETHER_API_KEY"],
  cohere: ["COHERE_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
} as const;

function readFirst(keys: readonly string[]) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

export function resolveHfApiToken() {
  return readFirst(TOKEN_ALIASES.huggingface);
}

export function getAiTokenConnections() {
  return {
    huggingface: Boolean(readFirst(TOKEN_ALIASES.huggingface)),
    openai: Boolean(readFirst(TOKEN_ALIASES.openai)),
    azureOpenai: Boolean(readFirst(TOKEN_ALIASES.azureOpenai)),
    github: Boolean(readFirst(TOKEN_ALIASES.github)),
    anthropic: Boolean(readFirst(TOKEN_ALIASES.anthropic)),
    groq: Boolean(readFirst(TOKEN_ALIASES.groq)),
    together: Boolean(readFirst(TOKEN_ALIASES.together)),
    cohere: Boolean(readFirst(TOKEN_ALIASES.cohere)),
    mistral: Boolean(readFirst(TOKEN_ALIASES.mistral)),
    deepseek: Boolean(readFirst(TOKEN_ALIASES.deepseek)),
  };
}
