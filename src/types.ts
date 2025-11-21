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
    url: string; // For display, e.g., data URL or object URL
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

export interface AppBackup {
    todos: ToDoItem[];
    categories: string[];
    theme: Theme;
    taskChatHistories: { [key: number]: ChatMessage[] };
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

// Removed: export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface ActivityLogEntry {
    id: number;
    message: string;
    timestamp: string;
}