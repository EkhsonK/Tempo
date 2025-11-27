/// <reference types="vite/client" />
import { ToDoItem } from '../types';

// Жесткая ссылка на сервер
const API_URL = 'https://tempo-backend-horp.onrender.com/api';

const USER_ID_KEY = 'tempo_user_id';

const getStoredUserId = (): number | null => {
    const stored = localStorage.getItem(USER_ID_KEY);
    return stored ? parseInt(stored, 10) : null;
};

let currentUserId: number | null = getStoredUserId();

export const setApiUserId = (id: number | null) => {
    console.log(`[API] Установка ID пользователя: ${id}`);
    currentUserId = id;
    if (id) {
        localStorage.setItem(USER_ID_KEY, id.toString());
    } else {
        localStorage.removeItem(USER_ID_KEY);
    }
};

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    const uid = currentUserId || getStoredUserId();
    if (uid) {
        headers['X-User-Id'] = uid.toString();
    }
    return headers;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const safeFetch = async (url: string, options?: RequestInit, retries = 2): Promise<any> => {
    try {
        const controller = new AbortController();
        // 60 секунд таймаут (достаточно для пробуждения Render)
        const id = setTimeout(() => controller.abort(), 60000);

        const finalOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                ...getHeaders(),
                ...options?.headers
            }
        };
        
        console.log(`🌐 [API Request] ${options?.method || 'GET'} ${url}`);
        const response = await fetch(url, finalOptions);
        clearTimeout(id);

        if (!response.ok) {
             // Если вернулся HTML вместо JSON (ошибка 502/503 от Render), кидаем ошибку сети
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") === -1) {
                 throw new Error("Server is restarting or unavailable");
             }

             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.error || `Server Error: ${response.status}`);
        }
        
        return await response.json();

    } catch (error: any) {
        // Если сеть упала, сервер спит или CORS ошибка - пробуем снова
        if (retries > 0) {
            console.warn(`⚠️ Ошибка API (${error.message}). Повтор через 3с...`);
            await wait(3000);
            return safeFetch(url, options, retries - 1);
        }
        console.error("❌ API Failed Final:", error);
        throw error;
    }
};

export const api = {
    initDB: () => safeFetch(`${API_URL}/init`),

    register: (username: string, password: string) => safeFetch(`${API_URL}/register`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),

    login: (username: string, password: string) => safeFetch(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),

    getUserSettings: () => safeFetch(`${API_URL}/user`),
    
    updateUserSettings: (settings: any) => safeFetch(`${API_URL}/user`, {
        method: 'PUT',
        body: JSON.stringify(settings)
    }),

    getTodos: (): Promise<ToDoItem[]> => safeFetch(`${API_URL}/todos`),
    
    addTodo: (todo: ToDoItem) => safeFetch(`${API_URL}/todos`, {
        method: 'POST',
        body: JSON.stringify(todo)
    }),

    saveTodo: (todo: ToDoItem) => safeFetch(`${API_URL}/todos/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify(todo)
    }),

    updateTodo: (id: number, todo: Partial<ToDoItem>) => safeFetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(todo)
    }),

    deleteTodo: (id: number) => safeFetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE'
    }),

    getCategories: (): Promise<string[]> => safeFetch(`${API_URL}/categories`),

    addCategory: (name: string) => safeFetch(`${API_URL}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name })
    }),

    deleteCategory: (name: string) => safeFetch(`${API_URL}/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
    }),

    uploadFile: async (file: File): Promise<{ url: string, name: string, type: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        
        const headers: Record<string, string> = {};
        const uid = currentUserId || getStoredUserId();
        if (uid) headers['X-User-Id'] = uid.toString();

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: headers, 
            body: formData 
        });
        
        if (!response.ok) throw new Error("Upload failed");
        return await response.json();
    }
};