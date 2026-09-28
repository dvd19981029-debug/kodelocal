/**
 * src/lib/miranda/gemini.ts - Conector oficial de Google Gemini para Next.js / Vercel Serverless
 */

const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-flash-lite-latest",
];

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export async function generateGeminiContent(
  contents: GeminiContent[] | string,
  options?: {
    responseJson?: boolean;
    systemInstruction?: string;
  }
): Promise<string> {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada.");
  }

  const formattedContents: GeminiContent[] =
    typeof contents === "string"
      ? [{ role: "user", parts: [{ text: contents }] }]
      : contents;

  const payload: Record<string, any> = {
    contents: formattedContents,
  };

  if (options?.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options?.responseJson) {
    payload.generationConfig = {
      responseMimeType: "application/json",
    };
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        console.warn(`[Gemini API] 429 Quota en modelo ${model}, saltando al siguiente...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} en ${model}: ${errorText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const textPart = candidate?.content?.parts?.map((p: any) => p.text || "").join("") || "";

      if (textPart.trim()) {
        return textPart.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Error en ${model}:`, err.message);
      // Continuar al siguiente modelo en caso de error
      continue;
    }
  }

  throw new Error(`Fallo en todos los modelos de Gemini: ${lastError?.message || "Desconocido"}`);
}
