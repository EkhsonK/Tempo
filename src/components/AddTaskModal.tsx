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

// Simple Check Icon for the chips
const ChipCheck: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

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
            
            <div className={`fixed bottom-0 left-0 right-0 z-[65] glass-panel rounded-t-3xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'} pb-safe flex flex-col`} style={{maxHeight: '80vh'}}>
                
                <div className="w-10 h-1 bg-brand-text-secondary/20 rounded-full mx-auto mt-3 mb-2" />
                
                <div className="px-4 py-3">
                     <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Новая задача..."
                        className="w-full h-14 bg-transparent text-brand-text-primary text-lg placeholder-brand-text-secondary/60 focus:outline-none resize-none font-medium leading-snug"
                        autoFocus
                    />
                </div>

                {/* UPDATED CATEGORY UI: Large Scrollable Chips */}
                <div className="px-4 pb-4">
                    <div className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2 ml-1">Категория</div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                         {categories.map((cat) => {
                             const isActive = category === cat;
                             return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 border flex-shrink-0
                                        ${isActive 
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' 
                                            : 'bg-brand-surface border-brand-gray-700 text-brand-text-secondary hover:border-brand-text-secondary hover:bg-brand-background/50'}
                                    `}
                                >
                                    {isActive && <ChipCheck className="w-4 h-4" />}
                                    {cat}
                                </button>
                             );
                         })}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-4 py-3 bg-brand-background border-t border-brand-gray-700 flex justify-between items-center gap-3">
                    <div className="flex gap-2">
                        <button onClick={() => setDateTimePickerOpen(true)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${deadline ? 'bg-brand-primary/10 text-brand-primary border-brand-primary' : 'bg-brand-surface border-brand-gray-700 text-brand-text-secondary'}`}>
                            <CalendarIcon className="w-4 h-4" /> {deadlineDisplay || 'Дата'}
                        </button>
                        <button onClick={() => { const lvls = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH]; setPriority(lvls[(lvls.indexOf(priority) + 1) % lvls.length]); }} className="p-2 rounded-xl bg-brand-surface border border-brand-gray-700">
                            <FlagIcon priority={priority} className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={handleSave} disabled={!text.trim()} className="bg-brand-primary text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" /> Создать
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