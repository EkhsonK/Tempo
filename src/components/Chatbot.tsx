import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor, ToDoItem } from '../types';
import { streamTaskChat } from '../services/geminiService';
import { UserIcon, SparkleIcon, SendIcon, MessageIcon } from './IconComponents';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeTask = tasks.find(t => t.id === selectedTaskId);
    const currentMessages = selectedTaskId ? allHistories[selectedTaskId] || [] : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [currentMessages]);

    useEffect(() => {
        localStorage.setItem('taskChatHistories', JSON.stringify(allHistories));
    }, [allHistories]);

    // Function to build a detailed context string about the current state of the task
    const buildTaskContext = (task: ToDoItem) => {
        let context = `[CURRENT TASK DATA]\n`;
        context += `Title: ${task.text}\n`;
        context += `Category: ${task.category}\n`;
        context += `Priority: ${task.priority}\n`;
        context += `Status: ${task.completed ? 'Completed' : 'Pending'}\n`;
        context += `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleString() : 'None'}\n`;
        
        context += `Notes: ${task.notes ? task.notes : 'None'}\n`;
        
        if (task.subtasks && task.subtasks.length > 0) {
            context += `Subtasks:\n${task.subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.text}`).join('\n')}\n`;
        } else {
            context += `Subtasks: None\n`;
        }

        if (task.attachments && task.attachments.length > 0) {
            context += `Attachments: ${task.attachments.map(a => a.name).join(', ')}\n`;
        } else {
            context += `Attachments: None\n`;
        }

        context += `[END TASK DATA]\n\n`;
        return context;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || !selectedTaskId) return;

        const userMessage: ChatMessage = { author: MessageAuthor.USER, text: input };
        const newMessagesForTask = [...currentMessages, userMessage];
        
        setAllHistories(prev => ({...prev, [selectedTaskId]: newMessagesForTask}));
        setInput('');
        setIsLoading(true);
        
        const aiMessage: ChatMessage = { author: MessageAuthor.AI, text: '' };
        setAllHistories(prev => ({...prev, [selectedTaskId]: [...newMessagesForTask, aiMessage]}));

        try {
            // Construct the payload. 
            // We send the current task context + the user's message hidden in the prompt.
            // This ensures the AI always knows the *current* name, notes, etc., even if they changed.
            let messageToSend = input;
            
            if (activeTask) {
                const context = buildTaskContext(activeTask);
                messageToSend = `${context}User Question: ${input}\n(Answer concisely based on the Current Task Data above.)`;
            }

            const stream = streamTaskChat(selectedTaskId, newMessagesForTask, messageToSend);
            let aiResponseText = '';
            for await (const chunk of stream) {
                aiResponseText += chunk;
                setAllHistories(prev => {
                    const currentTaskHistory = prev[selectedTaskId] || [];
                    const lastMessage = currentTaskHistory[currentTaskHistory.length - 1];
                    if (lastMessage && lastMessage.author === MessageAuthor.AI) {
                        const updatedMessages = [...currentTaskHistory.slice(0, -1)];
                        updatedMessages.push({ ...lastMessage, text: aiResponseText });
                        return {...prev, [selectedTaskId]: updatedMessages};
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
             setAllHistories(prev => {
                const currentTaskHistory = prev[selectedTaskId] || [];
                const lastMessage = currentTaskHistory[currentTaskHistory.length - 1];
                if (lastMessage && lastMessage.author === MessageAuthor.AI) {
                    const updatedMessages = [...currentTaskHistory.slice(0, -1)];
                    updatedMessages.push({ ...lastMessage, text: "Извините, произошла ошибка." });
                    return {...prev, [selectedTaskId]: updatedMessages};
                }
                return prev;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4 truncate">
                {activeTask ? `Чат: ${activeTask.text}` : 'Чат задачи'}
            </h2>
            
            <div className="flex-grow overflow-y-auto bg-gray-800/50 p-4 rounded-lg mb-4">
                {!activeTask ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary">
                        <MessageIcon className="w-12 h-12 mb-4" />
                        <p>Выберите задачу и нажмите иконку чата, чтобы начать общение.</p>
                    </div>
                ) : currentMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-brand-text-secondary text-center p-4">
                         <p>Спросите меня о <strong>"{activeTask.text}"</strong>!<br/>Я вижу ваши подзадачи, заметки и вложения.</p>
                    </div>
                ) : (
                    currentMessages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 mb-4 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                            {msg.author === MessageAuthor.AI && (
                                <div className="bg-brand-primary rounded-full p-2 flex-shrink-0">
                                    <SparkleIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[85%] md:max-w-[75%] px-4 py-2 rounded-xl whitespace-pre-wrap ${msg.author === MessageAuthor.USER ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-brand-text-primary rounded-bl-none'}`}>
                               {msg.text || <span className="animate-pulse">...</span>}
                            </div>
                            {msg.author === MessageAuthor.USER && (
                                 <div className="bg-gray-600 rounded-full p-2 flex-shrink-0">
                                    <UserIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={activeTask ? 'Спросите о деталях, дедлайне...' : 'Сначала выберите задачу'}
                    className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    disabled={isLoading || !activeTask}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !activeTask}
                    className="bg-brand-primary text-white p-3 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default Chatbot;