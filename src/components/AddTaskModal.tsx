import React, { useState, useEffect } from 'react';
import { ToDoItem, Priority, TimeFormat } from '../types';
import { CalendarIcon, FlagIcon, SendIcon } from './IconComponents';
import DateTimePickerModal from './DateTimePickerModal';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<ToDoItem, 'id' | 'lastModified' | 'completed' | 'subtasks' | 'notes' | 'attachments'>) => void;
    categories: string[];
    initialCategory?: string;
    timeFormat: TimeFormat;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, categories, initialCategory, timeFormat }) => {
    const [text, setText] = useState('');
    const [deadline, setDeadline] = useState('');
    const [category, setCategory] = useState('Общее');
    const [priority, setPriority] = useState<Priority>(Priority.NONE);
    const [reminder, setReminder] = useState('Нет');
    const [repeat, setRepeat] = useState('Никогда');
    const [isDateTimePickerOpen, setDateTimePickerOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialCategory && initialCategory !== 'Все' && categories.includes(initialCategory)) {
                setCategory(initialCategory);
            } else {
                setCategory(categories[0] || 'Общее');
            }
            setText('');
            setDeadline('');
            setPriority(Priority.NONE);
            setReminder('Нет');
            setRepeat('Никогда');
        }
    }, [isOpen, initialCategory, categories]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleSave = () => {
        if (!text.trim()) return;
        onSave({
            text: text.trim(),
            deadline: deadline || undefined,
            category,
            priority,
            reminder,
            repeat
        });
        handleClose();
    };

    const cyclePriority = () => {
        const levels = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
        const idx = levels.indexOf(priority);
        setPriority(levels[(idx + 1) % levels.length]);
    };
    
    if (!isOpen && !isClosing) return null;
    
    // Helper to format deadline for the button
    const deadlineDisplay = deadline 
        ? new Date(deadline).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' }) 
        : null;

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
                
                {/* Modal Card */}
                <div 
                    className={`
                        w-full sm:w-11/12 max-w-lg 
                        bg-brand-background 
                        sm:rounded-2xl rounded-t-2xl 
                        border border-brand-gray-700 
                        shadow-2xl 
                        transform transition-transform duration-300
                        ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'}
                        flex flex-col
                        overflow-hidden
                        pb-safe /* For iPhone home indicator if needed */
                    `} 
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header / Close Handle for Mobile */}
                    <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={handleClose}>
                        <div className="w-12 h-1.5 bg-brand-text-secondary/50 rounded-full"></div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4">
                         <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Введите новую задачу..."
                            className="w-full h-9 bg-transparent text-brand-text-primary text-lg placeholder-brand-text-secondary focus:outline-none resize-none font-medium"
                            autoFocus
                        />
                    </div>

                    {/* Category Chips Scroll */}
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                         {categories.map((cat: string) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                    category === cat
                                    ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                    : 'bg-brand-surface border-brand-gray-700 text-brand-text-secondary hover:text-brand-text-primary'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="px-4 pb-4 pt-2 flex items-center justify-between bg-brand-background">
                        
                        {/* Left Actions: Date, Priority */}
                        <div className="flex items-center gap-3">
                            {/* Date Button */}
                            <button 
                                onClick={() => setDateTimePickerOpen(true)}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border border-brand-gray-700 whitespace-nowrap flex-shrink-0
                                    ${deadline ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/30' : 'bg-brand-surface hover:bg-brand-surface-solid/50 text-brand-text-secondary hover:text-brand-text-primary'}
                                `}
                            >
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {deadlineDisplay || ''}
                            </button>

                            {/* Priority Toggle */}
                            <button 
                                onClick={cyclePriority}
                                className="p-2 rounded-xl bg-brand-surface hover:bg-brand-surface-solid/50 border border-brand-gray-700 transition-colors flex-shrink-0"
                                title="Priority"
                            >
                                <FlagIcon priority={priority} className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right Action: Send/Save */}
                        <button 
                            onClick={handleSave} 
                            disabled={!text.trim()}
                            className={`
                                ml-2 p-3 rounded-full transition-all duration-200 shadow-lg flex-shrink-0 flex items-center justify-center
                                ${text.trim() 
                                    ? 'bg-brand-primary text-white hover:bg-blue-600 hover:scale-105' 
                                    : 'bg-brand-gray-700 text-brand-text-secondary cursor-not-allowed'}
                            `}
                        >
                            <SendIcon className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Picker Reused */}
            <DateTimePickerModal 
                isOpen={isDateTimePickerOpen} 
                onClose={() => setDateTimePickerOpen(false)} 
                onSave={(isoString, reminder, repeat) => {
                    setDeadline(isoString);
                    if(reminder) setReminder(reminder);
                    if(repeat) setRepeat(repeat);
                    setDateTimePickerOpen(false);
                }} 
                initialValue={deadline} 
                initialReminder={reminder}
                initialRepeat={repeat}
                timeFormat={timeFormat}
            />
        </>
    );
};

export default AddTaskModal;