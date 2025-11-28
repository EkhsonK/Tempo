export interface SubTask {
  id: number;
  text: string;
  completed: boolean;
}

export enum Priority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
    NONE = 'none',
}

export interface Attachment {
    id: number;
    name: string;
    type: 'image' | 'audio' | 'file';
    url: string; 
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export interface ToDoItem {
  id: number;
  text: string;
  completed: boolean;
  subtasks: SubTask[];
  deadline?: string;
  lastModified: string;
  category: string;
  priority: Priority;
  notes?: string;
  attachments?: Attachment[];
  reminder?: string;
  repeat?: string;
  chat_history?: ChatMessage[]; 
}

export enum ToDoSort {
    DATE_DESC = 'date-desc',
    DATE_ASC = 'date-asc',
    TEXT_ASC = 'text-asc',
    TEXT_DESC = 'text-desc',
}

export type ActiveTab = 'tasks' | 'chat' | 'calendar' | 'me' | 'settings';

// [FIXED] Added 'neon' to the Theme type
export type Theme = 'light' | 'dark' | 'midnight' | 'forest' | 'neon';

export type TimeFormat = '12h' | '24h';

export type AIRole = 'concise' | 'detailed';

export type TaskUpdateAction = 'ADD_SUBTASK' | 'SET_PRIORITY' | 'SET_STATUS' | 'ADD_NOTE' | 'SET_TITLE' | 'SAVE_CHAT';

export interface AppBackup {
    todos: ToDoItem[];
    categories: string[];
    theme: Theme;
    aiRole?: AIRole;
    taskChatHistories: { [key: number]: ChatMessage[] };
    timeFormat?: TimeFormat; // Added to match Settings usage
    customBackground?: string | null; // Added to match Settings usage
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

export interface ActivityLogEntry {
    id: number;
    message: string;
    timestamp: string;
}

export type SyncAction = 
    | { type: 'ADD', payload: ToDoItem }
    | { type: 'UPDATE', payload: { id: number, updates: Partial<ToDoItem> } }
    | { type: 'DELETE', payload: { id: number } };