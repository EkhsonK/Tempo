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
}

export enum ToDoSort {
    DATE_DESC = 'date-desc',
    DATE_ASC = 'date-asc',
    TEXT_ASC = 'text-asc',
    TEXT_DESC = 'text-desc',
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

export type ActiveTab = 'tasks' | 'chat' | 'calendar' | 'me' | 'settings';

export type Theme = 'light' | 'dark' | 'midnight' | 'forest';
export type TimeFormat = '12h' | '24h';

// [FIX] Ensure this is exported
export type AIRole = 'concise' | 'detailed';

// [FIX] Ensure this is exported for AI commands
export type TaskUpdateAction = 'ADD_SUBTASK' | 'SET_PRIORITY' | 'SET_STATUS' | 'ADD_NOTE' | 'SET_TITLE';

export interface AppBackup {
    todos: ToDoItem[];
    categories: string[];
    theme: Theme;
    aiRole?: AIRole;
    taskChatHistories: { [key: number]: ChatMessage[] };
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