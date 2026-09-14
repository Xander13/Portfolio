import { GoogleGenAI } from "@google/genai";

// Cached across warm invocations of this route so repeat/warmup calls skip re-initialization.
let cachedClient = null;
function getClient(apiKey) {
    if (!cachedClient) cachedClient = new GoogleGenAI({ apiKey });
    return cachedClient;
}

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json({ error: "Gemini API key is not configured" }, { status: 500 });
        }

        const { input, warmup } = await request.json();

        // Warmup pings pre-initialize the client/container without calling the model, cutting first-message latency.
        if (warmup) {
            getClient(apiKey);
            return Response.json({ warmed: true });
        }

        const prompt = String(input || "").trim();

        if (!prompt) {
            return Response.json({ error: "A prompt is required" }, { status: 400 });
        }

        const ai = getClient(apiKey);
        const interaction = await ai.interactions.create({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            input: prompt
        });

        return Response.json({ text: interaction.output_text || "Gemini did not return a response." });
    } catch (error) {
        console.error("Gemini request failed", error);
        const errorMessage = String(error?.message || "");
        const isModelError = /model|not found|unsupported|invalid/i.test(errorMessage);
        return Response.json({
            error: isModelError
                ? "The configured Gemini model is unavailable. Set GEMINI_MODEL to a model enabled for your API key."
                : "Gemini is unavailable right now. Check the API key and server logs."
        }, { status: 502 });
    }
}
