/// <reference types="vite/client" />
import { ToDoItem } from '../types';

// Ссылка на твой сервер на Render
const API_URL = 'https://tempo-backend-horp.onrender.com/api';

const USER_ID_KEY = 'tempo_user_id';

const getStoredUserId = (): number | null => {
    const stored = localStorage.getItem(USER_ID_KEY);
    return stored ? parseInt(stored, 10) : null;
};

let currentUserId: number | null = getStoredUserId();

export const setApiUserId = (id: number | null) => {
    console.log(`[API] Auth ID: ${id}`);
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

// Функция паузы
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Функция запроса с повторами и таймаутом
const safeFetch = async (url: string, options?: RequestInit, retries = 2): Promise<any> => {
    try {
        // Анти-кэш для GET запросов
        let fetchUrl = url;
        if (!options?.method || options.method === 'GET') {
            const separator = url.includes('?') ? '&' : '?';
            fetchUrl = `${url}${separator}t=${Date.now()}`;
        }

        // 100 секунд таймаут для пробуждения Render
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 100000);

        const finalOptions = {
            ...options,
            mode: 'cors' as RequestMode, // Явно включаем CORS
            signal: controller.signal,
            headers: {
                ...getHeaders(),
                ...options?.headers
            }
        };
        
        console.log(`🌐 [REQ] ${options?.method || 'GET'} ${fetchUrl}`);
        
        const response = await fetch(fetchUrl, finalOptions);
        clearTimeout(id);

        if (!response.ok) {
             // Если сервер вернул HTML (ошибка 502/503 от nginx/render), считаем это ошибкой сети
             const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") === -1) {
                 throw new Error("Server unavailable (Sleeping or Deploying)");
             }

             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }
        
        return await response.json();

    } catch (error: any) {
        // Если ошибка сети, таймаут или сервер спит — пробуем снова
        const isNetworkError = error.name === 'AbortError' || 
                               error.message.includes('Failed to fetch') || 
                               error.message.includes('Server unavailable');

        if (retries > 0 && isNetworkError) {
            console.warn(`⚠️ Сбой сети (${error.message}). Повтор через 3 сек... Осталось попыток: ${retries}`);
            await wait(3000);
            return safeFetch(url, options, retries - 1);
        }
        
        console.error(`❌ API Error Final: ${url}`, error);
        throw error;
    }
};

export const api = {
    // Проверка
    ping: () => safeFetch(`${API_URL}/init`),

    // Auth
    register: (username: string, password: string) => safeFetch(`${API_URL}/register`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),

    login: (username: string, password: string) => safeFetch(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),

    // User Settings
    getUserSettings: () => safeFetch(`${API_URL}/user`),
    
    updateUserSettings: (settings: any) => safeFetch(`${API_URL}/user`, {
        method: 'PUT',
        body: JSON.stringify(settings)
    }),

    // Todos
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

    // Categories
    getCategories: (): Promise<string[]> => safeFetch(`${API_URL}/categories`),

    addCategory: (name: string) => safeFetch(`${API_URL}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name })
    }),

    deleteCategory: (name: string) => safeFetch(`${API_URL}/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
    }),

    // Upload
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