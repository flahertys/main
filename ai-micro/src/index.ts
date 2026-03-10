import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL_ID = process.env.HF_MODEL_ID || "Qwen/Qwen2.5-7B-Instruct";

app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "ai-micro", status: "healthy" });
});

app.post("/predict", async (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) {
        return res.status(400).json({ ok: false, error: "prompt is required" });
    }

    if (!HF_API_TOKEN) {
        return res.status(503).json({
            ok: false,
            error: "HF_API_TOKEN not configured",
        });
    }

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL_ID}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    temperature: 0.7,
                    max_new_tokens: 512,
                },
            }),
        });

        const payload = await response.json();
        return res.status(response.ok ? 200 : 502).json({
            ok: response.ok,
            model: HF_MODEL_ID,
            data: payload,
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : "Inference failed",
        });
    }
});

app.listen(PORT, () => {
    console.log(`ai-micro listening on :${PORT}`);
});
