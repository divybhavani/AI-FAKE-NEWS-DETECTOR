import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

let ai: GoogleGenAI | null = null;
function getAiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    const baseURL = key.startsWith("sk-or-") ? "https://openrouter.ai/api/v1" : undefined;
    openaiClient = new OpenAI({
      apiKey: key,
      baseURL
    });
  }
  return openaiClient;
}

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", upload.array("files", 3), async (req, res) => {
  try {
    const { url, text, inputType, useHighThinking } = req.body;
    const files = req.files as Express.Multer.File[];

    const openAIClient = getOpenAIClient();

    let promptStr = `Analyze this piece of information and determine if it is fake news, misinformation, manipulated, or genuine. Provide a detailed report.
Return the result strictly as a JSON object with the following schema:
{
  "verdict": "Verified" | "Likely True" | "Needs Verification" | "Misleading" | "False" | "Manipulated" | "Satire" | "AI Generated" | "Insufficient Evidence",
  "confidenceScore": number (0-100),
  "trustScore": number (0-100),
  "summary": "string",
  "reasoning": "string",
  "evidence": ["string"],
  "sources": [{"name": "string", "url": "string"}]
}`;

    let result;

    if (openAIClient && useHighThinking !== 'true') {
      let contentParts: any[] = [];
      if (inputType === 'image' && files && files.length > 0) {
        files.forEach(file => {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            }
          });
        });
        contentParts.push({ type: "text", text: promptStr });
      } else if (inputType === 'url' && url) {
        contentParts.push({ type: "text", text: `Target URL for analysis: ${url}\n\n${promptStr}` });
      } else if (inputType === 'text' && text) {
        contentParts.push({ type: "text", text: `Target text for analysis:\n"${text}"\n\n${promptStr}` });
      } else {
        return res.status(400).json({ error: "Invalid input type or missing content." });
      }

      const key = process.env.OPENAI_API_KEY || "";
      const modelId = key.startsWith("sk-or-") ? "openai/gpt-4o-mini" : "gpt-4o-mini";

      let response;
      try {
        response = await openAIClient.chat.completions.create({
          model: modelId,
          messages: [
            { role: "system", content: "You are a factual analysis AI. You always return JSON." },
            { role: "user", content: contentParts }
          ],
          response_format: { type: "json_object" }
        });
      } catch (err: any) {
        if (err.message && err.message.includes("Unexpected token '<'")) {
           throw new Error("The third-party AI provider returned an invalid HTML error page. Please try 'Deep Analysis Mode' to use Gemini instead.");
        }
        throw err;
      }
      const outputText = response.choices[0].message.content || "{}";
      try {
        result = JSON.parse(outputText);
      } catch (e: any) {
        throw new Error("Failed to parse AI response: " + e.message + "\n\nRaw output: " + outputText.substring(0, 100));
      }

    } else {
      const aiClient = getAiClient();
      let parts: any[] = [];
      if (inputType === 'image' && files && files.length > 0) {
        files.forEach(file => {
          parts.push({
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: file.mimetype,
            },
          });
        });
        parts.push({ text: promptStr });
      } else if (inputType === 'url' && url) {
        parts.push({ text: `Target URL for analysis: ${url}\n\n${promptStr}` });
      } else if (inputType === 'text' && text) {
        parts.push({ text: `Target text for analysis:\n"${text}"\n\n${promptStr}` });
      } else {
        return res.status(400).json({ error: "Invalid input type or missing content." });
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          thinkingConfig: {
            thinkingLevel: "HIGH",
          },
        },
      });

      const outputText = response.text || "{}";
      const cleanedText = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        result = JSON.parse(cleanedText);
      } catch (e: any) {
        throw new Error("Failed to parse AI response: " + e.message + "\n\nRaw output: " + cleanedText.substring(0, 100));
      }
    }

    res.json(result);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during analysis." });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: err.message || "Internal server error" });
  } else {
    next(err);
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
