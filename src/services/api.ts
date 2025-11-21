/// <reference types="vite/client" />
import { ToDoItem } from '../types';

// [UPDATED] Dynamic URL logic
// If on Vercel (production), use the Env Variable. If local, use localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const USER_ID_KEY = 'tempo_user_id';

// Helper to get ID from storage directly if variable is lost
const getStoredUserId = (): number | null => {
    const stored = localStorage.getItem(USER_ID_KEY);
    return stored ? parseInt(stored, 10) : null;
};

// Initialize currentUserId from storage immediately
let currentUserId: number | null = getStoredUserId();

export const setApiUserId = (id: number | null) => {
    currentUserId = id;
    if (id) {
        localStorage.setItem(USER_ID_KEY, id.toString());
    } else {
        localStorage.removeItem(USER_ID_KEY);
    }
};

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    
    // Always try to get the ID from the variable, fallback to storage
    const uid = currentUserId || getStoredUserId();
    
    if (uid) {
        headers['X-User-Id'] = uid.toString();
    }
    return headers;
};

const safeFetch = async (url: string, options?: RequestInit) => {
    try {
        const finalOptions = {
            ...options,
            headers: {
                ...getHeaders(),
                ...options?.headers
            }
        };
        
        const response = await fetch(url, finalOptions);
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API connection failed:", error);
        throw error;
    }
};

export const api = {
    initDB: () => safeFetch(`${API_URL}/init`),

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
    
    updateUserSettings: (settings: { theme?: string, time_format?: string, background_url?: string | null }) => safeFetch(`${API_URL}/user`, {
        method: 'PUT',
        body: JSON.stringify(settings)
    }),

    // Todos
    getTodos: (): Promise<ToDoItem[]> => safeFetch(`${API_URL}/todos`),
    
    addTodo: (todo: ToDoItem) => safeFetch(`${API_URL}/todos`, {
        method: 'POST',
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
    })
};