import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChatMessage, MessageAuthor, ToDoItem, AIRole, TaskUpdateAction } from '../types';
import { streamTaskChat } from '../services/geminiService';
import { SparkleIcon, SendIcon, MessageIcon, UserIcon, SyncIcon } from './IconComponents';

interface ChatbotProps {
    selectedTaskId: number | null;
    tasks: ToDoItem[];
    // Ensure this prop handles SAVE_CHAT action in App.tsx
    onTaskUpdate: (taskId: number, action: TaskUpdateAction, value: any) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ selectedTaskId, tasks, onTaskUpdate }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentRole, setCurrentRole] = useState<AIRole>('detailed');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeTask = tasks.find(t => t.id === selectedTaskId);
    // [SYNC FIX] Read history directly from the task object (synced from DB)
    const currentMessages = activeTask?.chat_history || [];

    const scrollToBottom = (smooth = true) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        }
    };

    useLayoutEffect(() => scrollToBottom(false), [selectedTaskId]);
    useEffect(() => scrollToBottom(true), [currentMessages.length, isLoading]); 

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; 
            const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedTaskId || !activeTask) return;
        
        const userMsg: ChatMessage = { author: MessageAuthor.USER, text: input };
        const newHistory = [...currentMessages, userMsg];
        
        // 1. Save user message immediately to the task (triggers Sync in App.tsx)
        onTaskUpdate(selectedTaskId, 'SAVE_CHAT', newHistory);
        
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = '44px';
        setIsLoading(true);

        try {
            // [ROLE FEATURE] Pass currentRole to the service
            const stream = streamTaskChat(selectedTaskId, newHistory, input, activeTask, currentRole);
            
            let fullResponse = "";
            for await (const chunk of stream) {
                fullResponse += chunk;

                // Execute Commands
                if (fullResponse.includes('|||')) {
                     const commandRegex = /\|\|\|\s*([A-Z_]+)\s*:\s*(.+?)\s*\|\|\|/g;
                     let match;
                     while ((match = commandRegex.exec(fullResponse)) !== null) {
                        const action = match[1] as TaskUpdateAction;
                        const value = match[2].trim();
                        onTaskUpdate(selectedTaskId, action, value);
                     }
                }
            }
            
            const cleanText = fullResponse.replace(/\|\|\|.+?\|\|\|/g, '').trim();
            const finalHistory = [...newHistory, { author: MessageAuthor.AI, text: cleanText }];
            
            // 2. Save Final AI Response to DB
            onTaskUpdate(selectedTaskId, 'SAVE_CHAT', finalHistory);

        } catch (err) {
            console.error("Chatbot Error:", err);
        } finally {
            setIsLoading(false);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    };

    if (!activeTask) {
        return (
            <div className="flex flex-col items-center justify-center h-full glass-panel rounded-3xl p-6 text-center">
                <div className="bg-brand-surface p-6 rounded-full mb-6 border border-brand-gray-700/30">
                    <MessageIcon className="w-16 h-16 text-brand-primary opacity-80" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-brand-text-primary">AI Ассистент</h3>
                <p className="text-brand-text-secondary max-w-sm">Выберите задачу из списка слева, чтобы начать обсуждение или получить помощь.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
            
            {/* HEADER */}
            <div className="p-4 border-b border-brand-gray-700/30 bg-brand-surface/50 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white shrink-0 shadow-lg">
                        <SparkleIcon className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-base text-brand-text-primary truncate max-w-[200px]">{activeTask.text}</h2>
                        <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                             <p className="text-[10px] text-brand-text-secondary font-medium uppercase tracking-wider">Llama 3 • Online</p>
                        </div>
                    </div>
                </div>

                {/* [NEW] Role Selection Buttons */}
                <div className="flex bg-brand-surface-solid/50 rounded-lg p-1 gap-1 border border-brand-gray-700/30">
                    {(['concise', 'detailed'] as AIRole[]).map((r) => (
                        <button 
                            key={r}
                            onClick={() => setCurrentRole(r)}
                            className={`
                                px-3 py-1.5 text-[11px] rounded-md transition-all font-bold uppercase tracking-wider
                                ${currentRole === r 
                                    ? 'bg-brand-primary text-brand-text-on-primary shadow-sm' 
                                    : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray-700/30'}
                            `}
                        >
                            {r === 'concise' ? 'Кратко' : 'Подробно'}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* MESSAGES AREA */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-brand-background/40 scroll-smooth">
                {currentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <SparkleIcon className="w-12 h-12 mb-2 text-brand-primary"/>
                        <p className="text-sm text-brand-text-secondary">Я готов помочь с этой задачей.</p>
                    </div>
                ) : (
                    currentMessages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div 
                                className={`
                                    max-w-[80%] px-5 py-3 text-[15px] shadow-md whitespace-pre-wrap break-words leading-relaxed
                                    ${msg.author === MessageAuthor.USER 
                                        ? 'bg-brand-primary text-brand-text-on-primary rounded-2xl rounded-tr-sm' 
                                        : 'bg-brand-surface text-brand-text-primary rounded-2xl rounded-tl-sm border border-brand-gray-700/50'}
                                `}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                
                {isLoading && (
                    <div className="flex justify-start w-full animate-pulse">
                        <div className="bg-brand-surface px-4 py-3 rounded-2xl rounded-tl-sm border border-brand-gray-700/50 text-brand-text-secondary text-xs flex items-center gap-2">
                           <SparkleIcon className="w-3 h-3 animate-spin"/> <span>Генерирую ответ...</span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-brand-surface/80 border-t border-brand-gray-700/30 backdrop-blur-md">
                <div className="flex items-end gap-2 bg-brand-background rounded-2xl px-2 py-2 border border-brand-gray-700/50 focus-within:border-brand-primary/50 transition-colors shadow-inner">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        disabled={isLoading}
                        placeholder="Напишите сообщение..."
                        className="flex-grow bg-transparent border-none text-[15px] text-brand-text-primary placeholder-brand-text-secondary/50 focus:ring-0 resize-none py-2 px-3 max-h-32 custom-scrollbar"
                        style={{ minHeight: '44px', height: '44px' }}
                        rows={1}
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={isLoading || !input.trim()} 
                        className={`
                            w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 mb-[1px]
                            ${input.trim() && !isLoading 
                                ? 'bg-brand-primary text-brand-text-on-primary shadow-lg hover:bg-brand-secondary active:scale-95' 
                                : 'bg-transparent text-brand-gray-700 cursor-not-allowed'}
                        `}
                    >
                        {isLoading ? <SyncIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5 ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;