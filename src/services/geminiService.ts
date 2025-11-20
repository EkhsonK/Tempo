import { GoogleGenAI, Chat } from "@google/genai";
// FIX: Add missing type imports for new service functions.
import { ChatMessage, GroundingChunk, AspectRatio } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const taskChats = new Map<number, Chat>();

function getTaskChatSession(taskId: number): Chat {
    if (!taskChats.has(taskId)) {
        const chat = ai.chats.create({ 
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a helpful assistant. The user is asking questions about a specific task they are working on. Be concise, helpful, and focus on solving the task."
            }
        });
        taskChats.set(taskId, chat);
    }
    return taskChats.get(taskId)!;
}

export async function* streamTaskChat(taskId: number, history: ChatMessage[], newMessage: string) {
    const chat = getTaskChatSession(taskId);
    
    const stream = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of stream) {
        yield chunk.text;
    }
}

// FIX: Add missing getGroundedResponse function for the Search component.
export async function getGroundedResponse(query: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, sources: sources as GroundingChunk[] };
}

// FIX: Add missing generateImage function for the ImageGenerator component.
export async function generateImage(prompt: string, aspectRatio: AspectRatio): Promise<string | null> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
}
