import React, { useState, useEffect } from 'react';
import { ToDoItem, Priority, TimeFormat } from '../types';
import { CalendarIcon, FlagIcon, PlusIcon, CheckIcon } from './IconComponents';
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

    useEffect(() => {
        if (isOpen) {
            setCategory(initialCategory && categories.includes(initialCategory) && initialCategory !== 'Все' ? initialCategory : categories[0] || 'Общее');
            setText(''); setDeadline(''); setPriority(Priority.NONE); setReminder('Нет'); setRepeat('Никогда');
        }
    }, [isOpen, initialCategory, categories]);

    const handleSave = () => {
        if (!text.trim()) return;
        onSave({ text: text.trim(), deadline: deadline || undefined, category, priority, reminder, repeat });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen) return null;

    const deadlineDisplay = deadline ? new Date(deadline).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' }) : null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60]" onClick={onClose} />
            
            <div className={`fixed bottom-0 left-0 right-0 z-[65] glass-panel rounded-t-3xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'} pb-safe flex flex-col sm:max-w-sm sm:mx-auto sm:mb-20 sm:rounded-3xl`} >
                
                <div className="w-10 h-1 bg-brand-text-secondary/20 rounded-full mx-auto mt-3 mb-1" />
                
                <div className="px-4 py-2">
                     <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Новая задача..."
                        className="w-full h-12 bg-transparent text-brand-text-primary text-lg placeholder-brand-text-secondary/60 focus:outline-none resize-none font-medium leading-snug"
                        autoFocus
                    />
                </div>

                {/* CATEGORY CHIPS WITH DOTS */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                         {categories.map((cat, index) => {
                            const isActive = category === cat;
                            // Generate consistent distinct color dot
                            const dotColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                            const dotColor = dotColors[index % dotColors.length];

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border flex-shrink-0
                                        ${isActive 
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-sm' 
                                            : 'bg-brand-chip-bg border-brand-gray-700 text-brand-text-secondary hover:border-brand-text-primary'}
                                    `}
                                    style={isActive ? { color: 'var(--brand-text-on-primary)' } : { backgroundColor: 'var(--brand-chip-bg)', borderColor: 'var(--brand-chip-border)' }}
                                >
                                    {/* The DOT */}
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotColor}`}></div>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-4 py-3 bg-brand-background/50 border-t border-brand-gray-700 flex justify-between items-center gap-3">
                    <div className="flex gap-2">
                        <button onClick={() => setDateTimePickerOpen(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors border ${deadline ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/50' : 'bg-brand-chip-bg border-brand-gray-700 text-brand-text-secondary'}`}>
                            <CalendarIcon className="w-3.5 h-3.5" /> {deadlineDisplay || 'Дата'}
                        </button>
                        <button onClick={() => { const lvls = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH]; setPriority(lvls[(lvls.indexOf(priority) + 1) % lvls.length]); }} className="p-1.5 rounded-lg bg-brand-chip-bg border border-brand-gray-700 transition-colors">
                            <FlagIcon priority={priority} className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button onClick={handleSave} disabled={!text.trim()} className="bg-brand-primary text-white px-5 py-1.5 rounded-lg font-bold text-xs shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                        <PlusIcon className="w-4 h-4" /> Создать
                    </button>
                </div>
            </div>

            <DateTimePickerModal 
                isOpen={isDateTimePickerOpen} 
                onClose={() => setDateTimePickerOpen(false)} 
                onSave={(iso, rem, rep) => { setDeadline(iso); setReminder(rem || 'Нет'); setRepeat(rep || 'Никогда'); setDateTimePickerOpen(false); }} 
                initialValue={deadline} 
                timeFormat={timeFormat}
            />
        </>
    );
};

export default AddTaskModal;