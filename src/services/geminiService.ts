import { ChatMessage, GroundingChunk, ToDoItem, MessageAuthor, AIRole } from '../types';

// Use your Render URL (or localhost for testing)
const API_URL = 'https://tempo-backend-horp.onrender.com/api/ai'; 

export async function* streamTaskChat(
    taskId: number, 
    history: ChatMessage[], 
    newMessage: string, 
    activeTask?: ToDoItem,
    role: AIRole = 'detailed'
) {
    try {
        // 1. Prepare Context (Keep this logic on frontend for flexibility)
        let taskContext = "Задача не выбрана.";
        if (activeTask) {
            const subtasksList = activeTask.subtasks && activeTask.subtasks.length > 0
                ? activeTask.subtasks.map(s => `- ${s.text} [${s.completed ? 'x' : ' '}]`).join('\n')
                : "Нет подзадач";
            const notes = activeTask.notes || "Нет заметок";

            taskContext = `
            ОБЪЕКТ ЗАДАЧИ:
            - Название: "${activeTask.text}"
            - Приоритет: ${activeTask.priority}
            - Статус: ${activeTask.completed ? 'DONE' : 'PENDING'}
            - Заметки: "${notes}"
            - Подзадачи:\n${subtasksList}
            `;
        }

        // 2. Settings
        let roleInstruction = "";
        let maxTokens = 1000;
        let temperature = 0.6;

        if (role === 'concise') {
            maxTokens = 400; 
            temperature = 0.4;
            roleInstruction = "Отвечай четко, емко, без воды. Максимум 3-4 предложения. Сразу предлагай решение.";
        } else {
            maxTokens = 1500;
            temperature = 0.7;
            roleInstruction = "Отвечай подробно, рассуждай, предлагай планы действий. НО! Не забывай в конце ответа выполнять технические команды, если это нужно.";
        }

        const systemPrompt = `
        Ты — ИИ-ассистент в Task Manager.
        Язык общения: РУССКИЙ.
        Стиль: ${roleInstruction}
        
        ТВОЯ ЦЕЛЬ: Помогать пользователю и УПРАВЛЯТЬ записью задачи.
        
        ${taskContext}

        === ПРОТОКОЛ КОМАНД (СТРОГО ОБЯЗАТЕЛЕН) ===
        Ты имеешь "руки" для изменения задачи. Если пользователь просит (или если это логично вытекает из разговора), ты ОБЯЗАН добавить команду в САМЫЙ КОНЕЦ ответа с новой строки.

        Синтаксис:
        |||SET_TITLE:Новое название|||
        |||ADD_SUBTASK:Текст подзадачи|||
        |||SET_STATUS:completed||| (или pending)
        |||SET_PRIORITY:high||| (medium, low)
        |||ADD_NOTE:Текст заметки|||

        ВАЖНО: Команды пишутся в том же сообщении, но в конце.
        `;

        // 3. Build Messages Array
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({
                role: msg.author === MessageAuthor.USER ? "user" : "assistant",
                content: msg.text
            })),
            { role: "user", content: newMessage }
        ];

        // 4. Send to Backend (Secure Proxy)
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
        yield `⚠️ Ошибка: ${error.message}`;
    }
}

export async function getGroundedResponse(query: string) {
    // Placeholder for search via backend
    return { text: "Поиск временно недоступен.", sources: [] };
}