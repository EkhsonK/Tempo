import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor, ToDoItem } from '../types';
import { streamTaskChat } from '../services/geminiService';
import { UserIcon, SparkleIcon, SendIcon, MessageIcon, SyncIcon } from './IconComponents';

interface ChatbotProps {
    selectedTaskId: number | null;
    tasks: ToDoItem[];
}

const Chatbot: React.FC<ChatbotProps> = ({ selectedTaskId, tasks }) => {
    const [allHistories, setAllHistories] = useState<{ [key: number]: ChatMessage[] }>(() => {
        const saved = localStorage.getItem('taskChatHistories');
        return saved ? JSON.parse(saved) : {};
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeTask = tasks.find(t => t.id === selectedTaskId);
    const currentMessages = selectedTaskId ? allHistories[selectedTaskId] || [] : [];

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [currentMessages]);
    useEffect(() => localStorage.setItem('taskChatHistories', JSON.stringify(allHistories)), [allHistories]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedTaskId) return;
        
        // [CRITICAL] Check for API Key existence immediately
        if (!process.env.API_KEY && !import.meta.env.VITE_GEMINI_API_KEY) {
             alert("API Key is missing. Check .env.local file.");
             return;
        }

        const userMsg: ChatMessage = { author: MessageAuthor.USER, text: input };
        const newHistory = [...currentMessages, userMsg];
        setAllHistories(prev => ({ ...prev, [selectedTaskId]: newHistory }));
        setInput('');
        setIsLoading(true);
        setError(false);

        try {
            setAllHistories(prev => ({ ...prev, [selectedTaskId]: [...newHistory, { author: MessageAuthor.AI, text: '' }] }));
            const context = activeTask ? `Task: ${activeTask.text}. Status: ${activeTask.completed ? 'Done' : 'Pending'}. Notes: ${activeTask.notes}` : '';
            const prompt = `${context}\nUser: ${input}`;
            const stream = streamTaskChat(selectedTaskId, newHistory, prompt);
            let fullResponse = "";
            for await (const chunk of stream) {
                fullResponse += chunk;
                setAllHistories(prev => {
                    const history = prev[selectedTaskId] || [];
                    return { ...prev, [selectedTaskId]: [...history.slice(0, -1), { author: MessageAuthor.AI, text: fullResponse }] };
                });
            }
        } catch (err) {
            console.error("Chatbot Error:", err);
            setError(true);
            setAllHistories(prev => {
                 const history = prev[selectedTaskId] || [];
                 return { ...prev, [selectedTaskId]: [...history.slice(0, -1), { author: MessageAuthor.AI, text: "⚠️ Ошибка: Проверьте API ключ или лимиты." }] };
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-brand-gray-700/50 bg-brand-surface flex justify-between items-center">
                <h2 className="font-bold text-lg text-brand-text-primary truncate">{activeTask ? activeTask.text : 'AI Ассистент'}</h2>
                {activeTask && <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-lg font-medium">Gemini</span>}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-brand-background/30">
                {!activeTask ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary opacity-60 text-center">
                        <MessageIcon className="w-12 h-12 mb-3" />
                        <p>Выберите задачу для начала</p>
                    </div>
                ) : currentMessages.length === 0 ? (
                    <div className="text-center text-brand-text-secondary text-sm mt-10">
                        <p>Спросите меня о задаче!</p>
                    </div>
                ) : (
                    currentMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.author === MessageAuthor.USER ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.author === MessageAuthor.AI ? 'bg-brand-primary text-white' : 'bg-brand-gray-700 text-brand-text-secondary'}`}>
                                {msg.author === MessageAuthor.AI ? <SparkleIcon className="w-4 h-4"/> : <UserIcon className="w-4 h-4"/>}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                                msg.author === MessageAuthor.USER 
                                ? 'bg-brand-primary text-white rounded-tr-none' 
                                : 'bg-brand-surface text-brand-text-primary rounded-tl-none border border-brand-gray-700/30'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-brand-surface border-t border-brand-gray-700/30">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        disabled={!activeTask || isLoading}
                        placeholder={error ? "Ошибка..." : "Ваш вопрос..."}
                        className="w-full bg-brand-background border border-brand-gray-700 rounded-xl pl-4 pr-12 py-3 text-sm text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-50"
                    />
                    <button 
                        onClick={handleSend} 
                        disabled={!activeTask || isLoading || !input.trim()}
                        className="absolute right-2 p-2 bg-brand-primary text-white rounded-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-0"
                    >
                        {isLoading ? <SyncIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;