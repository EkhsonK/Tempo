import { ChatMessage, GroundingChunk, ToDoItem, MessageAuthor, AIRole } from '../types';

// Points to your Render backend
const API_URL = 'https://tempo-backend-horp.onrender.com/api/ai'; 

export async function* streamTaskChat(
    taskId: number, 
    history: ChatMessage[], 
    newMessage: string, 
    activeTask?: ToDoItem,
    role: AIRole = 'detailed'
) {
    try {
        // 1. Build Task Context
        let taskContext = "Задача не выбрана.";
        if (activeTask) {
            const subtasksList = activeTask.subtasks && activeTask.subtasks.length > 0
                ? activeTask.subtasks.map(s => `- ${s.text} [${s.completed ? 'x' : ' '}]`).join('\n')
                : "Нет подзадач";
            const notes = activeTask.notes || "Нет заметок";

            taskContext = `
            CURRENT TASK CONTEXT:
            - Title: "${activeTask.text}"
            - Priority: ${activeTask.priority}
            - Status: ${activeTask.completed ? 'DONE' : 'PENDING'}
            - Notes: "${notes}"
            - Subtasks:\n${subtasksList}
            `;
        }

        // 2. Configure Role/Personality
        let roleInstruction = "";
        let maxTokens = 1000;
        let temperature = 0.6;

        if (role === 'concise') {
            maxTokens = 300; 
            temperature = 0.3; // Lower creativity for precision
            roleInstruction = "You are a concise, direct assistant. Give short answers (1-2 sentences). Focus only on the immediate solution. Do not chat casually.";
        } else {
            maxTokens = 1500;
            temperature = 0.7; // Higher creativity for discussion
            roleInstruction = "You are a detailed, helpful assistant. Explain your reasoning, offer step-by-step plans, and be encouraging. You can chat casually if appropriate.";
        }

        // 3. System Prompt (Optimized for Llama 3)
        // We explicitly tell it NOT to output the protocol text.
        const systemPrompt = `
        ${roleInstruction}
        Language: RUSSIAN (Always reply in Russian).
        
        ${taskContext}

        === SYSTEM INSTRUCTIONS (HIDDEN) ===
        1. You have access to tools to modify the task.
        2. NEVER explain or output the "COMMAND PROTOCOL" syntax to the user. It is for your internal use only.
        3. Only use a command if the user explicitly asks to change the task (e.g., "Rename this", "Mark as done").
        4. If you use a command, place it on a new line at the very end of your message.

        === COMMAND PROTOCOL ===
        |||SET_TITLE:New Title|||
        |||ADD_SUBTASK:Subtask text|||
        |||SET_STATUS:completed||| (or pending)
        |||SET_PRIORITY:high||| (medium, low)
        |||ADD_NOTE:Note text|||
        `;

        // 4. Prepare Messages for Backend
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({
                role: msg.author === MessageAuthor.USER ? "user" : "assistant",
                content: msg.text
            })),
            { role: "user", content: newMessage }
        ];

        // 5. Send to Backend
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages, 
                temperature, 
                max_tokens: maxTokens 
            })
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield decoder.decode(value, { stream: true });
        }

    } catch (error: any) {
        console.error("AI Service Error:", error);
        yield `⚠️ Error: ${error.message}`;
    }
}

export async function getGroundedResponse(query: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) throw new Error("Search failed");
        
        return await response.json();
    } catch (error) {
        console.error("AI Search Error:", error);
        return { text: "Поиск временно недоступен.", sources: [] };
    }
}