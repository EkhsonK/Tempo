import React, { useState, useEffect, useRef } from 'react';
import { ToDoItem, Priority, SubTask, Attachment, TimeFormat } from '../types';
import { FlagIcon, ClockIcon, NoteIcon, CancelIcon, ListCheckIcon, SaveIcon, TrashIcon, PlusIcon, PaperclipIcon, CameraIcon, MicrophoneIcon, BellIcon, RepeatIcon, SearchIcon } from './IconComponents';
import DateTimePickerModal from './DateTimePickerModal';

interface TaskDetailModalProps {
    task: ToDoItem | null;
    onClose: () => void;
    onUpdate: (id: number, updates: Partial<ToDoItem>) => void;
    onDelete?: (id: number) => void;
    onLocate?: (id: number) => void;
    timeFormat?: TimeFormat;
    categories: string[]; 
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate, onDelete, onLocate, timeFormat = '12h', categories }) => {
    const [editedTask, setEditedTask] = useState<ToDoItem | null>(null);
    const [isDateTimePickerOpen, setDateTimePickerOpen] = useState(false);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (task) {
            setEditedTask({ ...task });
            setIsDeleting(false);
        }
    }, [task]);

    if (!task || !editedTask) return null;

    const handleSave = () => {
        if (editedTask) {
            onUpdate(editedTask.id, {
                text: editedTask.text,
                category: editedTask.category,
                priority: editedTask.priority,
                deadline: editedTask.deadline,
                notes: editedTask.notes,
                subtasks: editedTask.subtasks,
                attachments: editedTask.attachments,
                completed: editedTask.completed,
                reminder: editedTask.reminder,
                repeat: editedTask.repeat,
            });
            onClose();
        }
    };

    const handleDeleteClick = () => {
        if (isDeleting) {
            if (onDelete) {
                onDelete(task.id);
                onClose();
            }
        } else {
            setIsDeleting(true);
        }
    };

    const toggleSubtask = (subId: number) => {
        const updatedSubtasks = editedTask.subtasks.map(s => 
            s.id === subId ? { ...s, completed: !s.completed } : s
        );
        setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
    };

    const addSubtask = () => {
        if (!newSubtaskText.trim()) return;
        const newSub: SubTask = { id: Date.now(), text: newSubtaskText, completed: false };
        setEditedTask({ ...editedTask, subtasks: [...editedTask.subtasks, newSub] });
        setNewSubtaskText('');
    };

    const deleteSubtask = (subId: number) => {
        setEditedTask({ ...editedTask, subtasks: editedTask.subtasks.filter(s => s.id !== subId) });
    };

    const cyclePriority = () => {
        const levels = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
        const idx = levels.indexOf(editedTask.priority);
        setEditedTask({ ...editedTask, priority: levels[(idx + 1) % levels.length] });
    };

    const handleFileAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/upload', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            const newAttachment: Attachment = { id: Date.now(), name: data.name, type: file.type.startsWith('image/') ? 'image' : 'file', url: data.url };
            setEditedTask({ ...editedTask, attachments: [...(editedTask.attachments || []), newAttachment] });
        } catch (error) {
            console.error("Upload error:", error);
            alert("Не удалось загрузить файл.");
        }
        event.target.value = ''; 
    };

    const deleteAttachment = (attId: number) => {
        setEditedTask({ ...editedTask, attachments: (editedTask.attachments || []).filter(a => a.id !== attId) });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
                <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="p-6 border-b border-brand-gray-700 flex justify-between items-start gap-4 bg-brand-surface">
                        <div className="flex-grow">
                            <label className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider mb-1 block">Задача</label>
                            <input 
                                type="text" 
                                value={editedTask.text}
                                onChange={(e) => setEditedTask({...editedTask, text: e.target.value})}
                                className="w-full bg-transparent text-xl font-bold text-brand-text-primary border-b border-transparent focus:border-brand-primary focus:outline-none pb-1 placeholder-brand-text-secondary"
                            />
                        </div>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary"><CancelIcon className="w-6 h-6" /></button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-grow bg-brand-background/50">
                        
                        {/* UPDATED CATEGORY CHIPS (Matches Add Task with DOTS) */}
                        <div>
                            <p className="text-[10px] text-brand-text-secondary mb-2 font-bold uppercase tracking-wider">Категория</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {categories.map((cat, index) => {
                                    const isActive = editedTask.category === cat;
                                    const dotColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                                    const dotColor = dotColors[index % dotColors.length];
                                    
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setEditedTask({...editedTask, category: cat})}
                                            className={`
                                                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0
                                                ${isActive 
                                                    ? 'bg-brand-primary text-brand-text-on-primary shadow-md scale-105' 
                                                    : 'bg-brand-chip-bg text-brand-text-secondary hover:text-brand-text-primary'}
                                            `}
                                            style={isActive ? { color: 'var(--brand-text-on-primary)' } : { backgroundColor: 'var(--brand-chip-bg)' }}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotColor}`}></div>
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 hover:border-brand-primary transition-colors cursor-pointer relative" onClick={() => setDateTimePickerOpen(true)}>
                                <p className="text-[10px] text-brand-text-secondary mb-1 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Срок</p>
                                <p className="text-sm font-medium text-brand-primary truncate">{editedTask.deadline ? new Date(editedTask.deadline).toLocaleString('ru-RU', { hour12: timeFormat === '12h' }) : 'Установить'}</p>
                            </div>

                            {/* Priority */}
                            <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 hover:border-brand-primary transition-colors cursor-pointer" onClick={cyclePriority}>
                                <p className="text-[10px] text-brand-text-secondary mb-1 flex items-center gap-1"><FlagIcon priority={Priority.NONE} className="w-3 h-3"/> Приоритет</p>
                                <div className="flex items-center gap-2"><FlagIcon priority={editedTask.priority} className="w-4 h-4" /><span className="text-sm font-medium text-brand-text-primary capitalize">{editedTask.priority}</span></div>
                            </div>
                        </div>

                        {/* ATTACHMENTS SECTION */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-2"><PaperclipIcon className="w-4 h-4 text-brand-accent" /> Вложения</h3>
                                <button onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-primary hover:underline flex items-center gap-1 font-medium bg-brand-surface/50 px-2 py-1 rounded border border-brand-gray-700 hover:border-brand-primary transition-colors">
                                    <PlusIcon className="w-3 h-3"/> Добавить файл
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileAttachment} className="hidden" />
                            </div>
                            
                            {editedTask.attachments && editedTask.attachments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {editedTask.attachments.map(att => (
                                        <div key={att.id} className="flex items-center justify-between bg-brand-surface border border-brand-gray-700 px-3 py-2 rounded-xl group hover:border-brand-text-secondary transition-colors">
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-text-primary hover:text-brand-primary truncate flex-grow flex items-center gap-2">
                                                <PaperclipIcon className="w-3 h-3 text-brand-text-secondary"/> 
                                                {att.name}
                                            </a>
                                            <button onClick={() => deleteAttachment(att.id)} className="text-brand-text-secondary hover:text-red-400 p-1"><CancelIcon className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-brand-text-secondary/50 italic pl-1">Нет вложений</p>}
                        </div>

                        {/* Subtasks */}
                        <div>
                            <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><ListCheckIcon className="w-4 h-4 text-brand-accent" /> Подзадачи</h3>
                            <div className="space-y-2 mb-3">
                                {editedTask.subtasks.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 bg-brand-surface p-2 rounded-lg border border-brand-gray-700">
                                        <input type="checkbox" checked={sub.completed} onChange={() => toggleSubtask(sub.id)} className="h-4 w-4 rounded bg-brand-surface border-brand-text-secondary text-brand-primary focus:ring-brand-primary cursor-pointer" />
                                        <input type="text" value={sub.text} onChange={(e) => { const updated = editedTask.subtasks.map(s => s.id === sub.id ? {...s, text: e.target.value} : s); setEditedTask({...editedTask, subtasks: updated}); }} className={`flex-grow bg-transparent text-sm border-none focus:outline-none ${sub.completed ? 'text-brand-text-secondary line-through' : 'text-brand-text-primary'}`} />
                                        <button onClick={() => deleteSubtask(sub.id)} className="text-brand-text-secondary hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSubtask()} placeholder="Добавить подзадачу..." className="flex-grow bg-brand-surface border border-brand-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary text-brand-text-primary placeholder-brand-text-secondary" />
                                <button onClick={addSubtask} className="bg-brand-surface hover:bg-brand-primary hover:text-white text-brand-text-primary p-2 rounded-lg border border-brand-gray-700"><PlusIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><NoteIcon className="w-4 h-4 text-brand-accent" /> Заметки</h3>
                            <textarea value={editedTask.notes || ''} onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})} placeholder="Добавьте детали здесь..." className="w-full h-24 bg-brand-surface border border-brand-gray-700 rounded-xl px-4 py-3 text-sm text-brand-text-primary focus:outline-none focus:border-brand-primary resize-none placeholder-brand-text-secondary"></textarea>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col bg-brand-surface border-t border-brand-gray-700">
                        <div className="p-4 flex justify-between items-center">
                            {onDelete && (
                                <button 
                                    onClick={handleDeleteClick} 
                                    className={`text-sm font-medium flex items-center gap-1 transition-all duration-300 px-4 py-2 rounded-lg ${isDeleting ? 'bg-red-600 text-white shadow-lg scale-105' : 'text-red-400 hover:text-red-300 hover:bg-brand-gray-800'}`}
                                >
                                    <TrashIcon className="w-4 h-4" /> 
                                    {isDeleting ? "Подтвердить?" : "Удалить"}
                                </button>
                            )}
                            <button onClick={handleSave} className="bg-brand-primary hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"><SaveIcon className="w-5 h-5" /> Сохранить</button>
                        </div>
                        
                        {/* Find in list button */}
                        {onLocate && (
                            <div className="pb-3 px-4 flex justify-center">
                                <button onClick={() => { onClose(); onLocate(editedTask.id); }} className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary hover:text-brand-accent flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-brand-surface">
                                    <SearchIcon className="w-3 h-3" />
                                    Найти в списке
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DateTimePickerModal 
                isOpen={isDateTimePickerOpen} 
                onClose={() => setDateTimePickerOpen(false)} 
                onSave={(isoString, reminder, repeat) => { 
                    setEditedTask(prev => prev ? ({...prev, deadline: isoString, reminder, repeat}) : null); 
                    setDateTimePickerOpen(false); 
                }} 
                initialValue={editedTask.deadline} 
                timeFormat={timeFormat}
            />
        </>
    );
};

export default TaskDetailModal;