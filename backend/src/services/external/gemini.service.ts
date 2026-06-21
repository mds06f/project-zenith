import { GoogleGenAI } from "@google/genai";

export async function generateInsight(
    prompt: string
): Promise<string> {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {

        throw new Error(
            "GEMINI_API_KEY is undefined. Check your .env file."
        );

    }

    const ai = new GoogleGenAI({

        apiKey

    });

    const response =
        await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: prompt

        });

    return response.text ?? "";

}