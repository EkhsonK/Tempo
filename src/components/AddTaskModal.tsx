import React, { useState, useEffect } from 'react';
import { ToDoItem, Priority, TimeFormat } from '../types';
import { CalendarIcon, FlagIcon, PlusIcon } from './IconComponents';
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] transition-opacity duration-300" onClick={onClose} />
            
            {/* Compact Modal - reduced margin-bottom */}
            <div className={`fixed bottom-0 left-0 right-0 z-[65] glass-panel rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'} pb-safe flex flex-col sm:max-w-md sm:mx-auto sm:mb-24 sm:rounded-3xl modal-surface border border-brand-gray-700`} >
                
                {/* Handle for mobile */}
                <div className="w-10 h-1 bg-brand-gray-700/50 rounded-full mx-auto mt-2 opacity-50 sm:hidden" />
                
                <div className="p-5 pt-3 space-y-2">
                     {/* Improved Input: Absolutely borderless and clean */}
                     <div className="relative pb-2">
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Что нужно сделать?"
                            // CRITICAL FIX: Removed border classes, uses transparent background
                            className="w-full h-12 bg-transparent text-brand-text-primary text-lg font-medium placeholder-brand-text-secondary/40 focus:outline-none resize-none leading-normal border-none ring-0 p-0"
                            autoFocus
                        />
                        {/* Subtle divider line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-gray-700/20"></div>
                     </div>

                    {/* Categories Scroll - tighter padding */}
                    <div className="overflow-x-auto no-scrollbar pb-1 -mx-5 px-5 pt-1">
                        <div className="flex gap-2">
                             {categories.map((cat, index) => {
                                const isActive = category === cat;
                                const dotColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                                const dotColor = dotColors[index % dotColors.length];

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`
                                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex-shrink-0 border
                                            ${isActive 
                                                ? 'bg-brand-primary border-brand-primary text-brand-text-on-primary shadow-sm' 
                                                : 'bg-brand-chip-bg border-transparent text-brand-text-secondary hover:bg-brand-gray-800'}
                                        `}
                                        style={isActive ? { color: 'var(--brand-text-on-primary)' } : {}}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : dotColor}`}></div>
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-between items-center pt-1">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setDateTimePickerOpen(true)} 
                                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-colors border ${deadline ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' : 'bg-brand-chip-bg border-transparent text-brand-text-secondary hover:bg-brand-gray-800'}`}
                            >
                                <CalendarIcon className="w-4 h-4" /> 
                                {deadlineDisplay || 'Срок'}
                            </button>
                            
                            <button 
                                onClick={() => { const lvls = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH]; setPriority(lvls[(lvls.indexOf(priority) + 1) % lvls.length]); }} 
                                className={`p-2 rounded-full border transition-colors ${priority !== Priority.NONE ? 'bg-brand-chip-bg border-transparent' : 'border-transparent hover:bg-brand-chip-bg'}`}
                            >
                                <FlagIcon priority={priority} className="w-5 h-5" />
                            </button>
                        </div>

                        <button 
                            onClick={handleSave} 
                            disabled={!text.trim()} 
                            className="bg-brand-primary text-brand-text-on-primary w-10 h-10 rounded-full shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-brand-secondary flex items-center justify-center"
                        >
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    </div>
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