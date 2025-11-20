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
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCategory(initialCategory && categories.includes(initialCategory) && initialCategory !== 'Все' ? initialCategory : categories[0] || 'Общее');
            setText(''); setDeadline(''); setPriority(Priority.NONE); setReminder('Нет'); setRepeat('Никогда');
        }
    }, [isOpen, initialCategory, categories]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => { setIsClosing(false); onClose(); }, 200);
    };

    const handleSave = () => {
        if (!text.trim()) return;
        onSave({ text: text.trim(), deadline: deadline || undefined, category, priority, reminder, repeat });
        handleClose();
    };

    // Handle Enter key to submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen && !isClosing) return null;

    const deadlineDisplay = deadline ? new Date(deadline).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' }) : null;

    return (
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
                {/* COMPACT MODAL: max-w-md, less padding */}
                <div className={`w-full sm:w-full max-w-md glass-panel rounded-t-2xl sm:rounded-2xl shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'} flex flex-col overflow-hidden mb-0 sm:mb-20`} onClick={e => e.stopPropagation()}>
                    
                    {/* Input Area */}
                    <div className="p-4 pb-2">
                         <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Новая задача..."
                            className="w-full h-14 bg-transparent text-brand-text-primary text-lg placeholder-brand-text-secondary/60 focus:outline-none resize-none font-medium leading-snug"
                            autoFocus
                        />
                    </div>

                    {/* Categories */}
                    <div className="px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                             {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex-shrink-0 ${
                                        category === cat
                                        ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                        : 'bg-brand-surface border-brand-gray-700 text-brand-text-secondary hover:border-brand-text-secondary'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="px-4 py-3 bg-brand-background/50 border-t border-brand-gray-700 flex justify-between items-center gap-3">
                        <div className="flex gap-2">
                            <button onClick={() => setDateTimePickerOpen(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors border ${deadline ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/50' : 'bg-brand-surface hover:bg-brand-gray-700 border-transparent text-brand-text-secondary'}`}>
                                <CalendarIcon className="w-3.5 h-3.5" /> {deadlineDisplay || 'Дата'}
                            </button>
                            <button onClick={() => { const lvls = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH]; setPriority(lvls[(lvls.indexOf(priority) + 1) % lvls.length]); }} className="p-1.5 rounded-lg bg-brand-surface hover:bg-brand-gray-700 border border-transparent transition-colors">
                                <FlagIcon priority={priority} className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <button 
                            onClick={handleSave} 
                            disabled={!text.trim()} 
                            className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Создать
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