import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
    try {
        const { input } = await request.json();
        const prompt = String(input || "").trim();

        if (!prompt) {
            return Response.json({ error: "A prompt is required" }, { status: 400 });
        }

        const ai = new GoogleGenAI({});
        const interaction = await ai.interactions.create({
            model: "gemini-3.8-flash",
            input: prompt
        });

        return Response.json({ text: interaction.output_text || "Gemini did not return a response." });
    } catch (error) {
        console.error("Gemini request failed", error);
        return Response.json({ error: "Gemini is unavailable right now." }, { status: 502 });
    }
}
