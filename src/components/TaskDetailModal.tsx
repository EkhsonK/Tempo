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
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate, onDelete, onLocate, timeFormat = '12h' }) => {
    const [editedTask, setEditedTask] = useState<ToDoItem | null>(null);
    const [isDateTimePickerOpen, setDateTimePickerOpen] = useState(false);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    // Reads categories from local storage to display chips
    const [categories] = useState(() => JSON.parse(localStorage.getItem('categories') || '["Общее", "Работа", "Личное"]'));
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

    // --- UPDATED: Persistent File Upload Logic ---
    const handleFileAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];

        // Create FormData to send to backend
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload to the new Flask endpoint
            const response = await fetch('http://127.0.0.1:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();

            // Use the PERMANENT URL returned by the server
            const newAttachment: Attachment = {
                id: Date.now(),
                name: data.name,     
                type: file.type.startsWith('image/') ? 'image' : 'file',
                url: data.url        
            };
            
            setEditedTask({ 
                ...editedTask, 
                attachments: [...(editedTask.attachments || []), newAttachment] 
            });
        } catch (error) {
            console.error("Upload error:", error);
            alert("Не удалось загрузить файл. Убедитесь, что сервер (run.py) запущен.");
        }
        
        event.target.value = ''; 
    };
    // --------------------------------------------

    const deleteAttachment = (attId: number) => {
        setEditedTask({ ...editedTask, attachments: (editedTask.attachments || []).filter(a => a.id !== attId) });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
                <div className="bg-brand-background border border-brand-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="p-6 border-b border-brand-gray-700 flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <label className="text-xs text-brand-text-secondary font-bold uppercase tracking-wider mb-1 block">Название задачи</label>
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
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-grow bg-brand-background">
                        
                        {/* Category Chips - Horizontal Scroll */}
                        <div>
                            <p className="text-xs text-brand-text-secondary mb-2 font-bold uppercase tracking-wider">Категория</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {categories.map((cat: string) => (
                                    <button
                                        key={cat}
                                        onClick={() => setEditedTask({...editedTask, category: cat})}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap flex-shrink-0 ${
                                            editedTask.category === cat
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-glow-primary'
                                            : 'bg-brand-surface border-brand-gray-700 text-brand-text-secondary hover:border-brand-primary hover:text-brand-text-primary'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 hover:bg-brand-surface-solid/50 transition-colors cursor-pointer relative overflow-hidden" onClick={() => setDateTimePickerOpen(true)}>
                                <p className="text-xs text-brand-text-secondary mb-1 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Срок</p>
                                <p className="text-sm font-medium text-brand-primary truncate">{editedTask.deadline ? new Date(editedTask.deadline).toLocaleString('ru-RU', { hour12: timeFormat === '12h' }) : 'Установить срок'}</p>
                                {(editedTask.reminder && editedTask.reminder !== 'Нет') && <div className="absolute top-2 right-2"><BellIcon className="w-3 h-3 text-brand-text-secondary" /></div>}
                            </div>

                            {/* Priority */}
                            <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 hover:bg-brand-surface-solid/50 transition-colors cursor-pointer" onClick={cyclePriority}>
                                <p className="text-xs text-brand-text-secondary mb-1 flex items-center gap-1"><FlagIcon priority={Priority.NONE} className="w-3 h-3"/> Приоритет</p>
                                <div className="flex items-center gap-2"><FlagIcon priority={editedTask.priority} className="w-4 h-4" /><span className="text-sm font-medium text-brand-text-primary capitalize">{editedTask.priority}</span></div>
                            </div>

                             {/* Status */}
                             <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 hover:bg-brand-surface-solid/50 transition-colors cursor-pointer" onClick={() => setEditedTask({...editedTask, completed: !editedTask.completed})}>
                                <p className="text-xs text-brand-text-secondary mb-1">Статус</p>
                                <p className={`text-sm font-medium ${editedTask.completed ? 'text-green-500' : 'text-yellow-500'}`}>{editedTask.completed ? 'Выполнено' : 'В процессе'}</p>
                            </div>
                            
                             {/* Repeat (Display Only) */}
                             <div className="bg-brand-surface p-3 rounded-xl border border-brand-gray-700 flex flex-col justify-center">
                                <p className="text-xs text-brand-text-secondary mb-1 flex items-center gap-1"><RepeatIcon className="w-3 h-3"/> Повтор</p>
                                <p className="text-sm font-medium text-brand-text-primary">{editedTask.repeat || 'Никогда'}</p>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div>
                            <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><ListCheckIcon className="w-4 h-4 text-brand-accent" /> Подзадачи</h3>
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
                                <button onClick={addSubtask} className="bg-brand-surface hover:bg-brand-surface-solid text-brand-text-primary p-2 rounded-lg border border-brand-gray-700"><PlusIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                         {/* Attachments */}
                         <div>
                            <label className="text-xs uppercase font-bold text-brand-text-secondary flex items-center gap-1.5 mb-2"><PaperclipIcon className="w-4 h-4 text-brand-accent" /> Вложения</label>
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
                                <button onClick={() => alert('Запрос доступа к камере.')} className="flex-shrink-0 flex items-center gap-1 text-xs bg-brand-surface hover:bg-brand-surface-solid border border-brand-gray-700 text-brand-text-primary px-3 py-2 rounded-lg transition-all"><CameraIcon className="w-4 h-4" /> Фото</button>
                                <button onClick={() => alert('Запрос доступа к микрофону.')} className="flex-shrink-0 flex items-center gap-1 text-xs bg-brand-surface hover:bg-brand-surface-solid border border-brand-gray-700 text-brand-text-primary px-3 py-2 rounded-lg transition-all"><MicrophoneIcon className="w-4 h-4" /> Аудио</button>
                                <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 flex items-center gap-1 text-xs bg-brand-surface hover:bg-brand-surface-solid border border-brand-gray-700 text-brand-text-primary px-3 py-2 rounded-lg transition-all"><PaperclipIcon className="w-4 h-4" /> Файл</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileAttachment} className="hidden" />
                            </div>
                            <ul className="space-y-1">
                                {(editedTask.attachments || []).map(att => (
                                    <li key={att.id} className="text-xs flex items-center justify-between bg-brand-surface p-2 rounded-lg border border-brand-gray-700">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-blue-400">{att.name}</a>
                                        <button onClick={() => deleteAttachment(att.id)}><CancelIcon className="w-3.5 h-3.5 text-brand-text-secondary hover:text-red-400"/></button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><NoteIcon className="w-4 h-4 text-brand-accent" /> Заметки</h3>
                            <textarea value={editedTask.notes || ''} onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})} placeholder="Добавьте детали здесь..." className="w-full h-24 bg-brand-surface border border-brand-gray-700 rounded-xl px-4 py-3 text-sm text-brand-text-primary focus:outline-none focus:border-brand-primary resize-none placeholder-brand-text-secondary"></textarea>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col bg-brand-surface-solid/10 border-t border-brand-gray-700">
                        <div className="p-4 flex justify-between items-center">
                            {onDelete && (
                                <button 
                                    onClick={handleDeleteClick} 
                                    className={`text-sm font-medium flex items-center gap-1 transition-all duration-300 px-4 py-2 rounded-lg ${isDeleting ? 'bg-red-600 text-white shadow-lg scale-105' : 'text-red-400 hover:text-red-300 hover:bg-brand-surface-solid/20'}`}
                                >
                                    <TrashIcon className="w-4 h-4" /> 
                                    {isDeleting ? "Подтвердить?" : "Удалить"}
                                </button>
                            )}
                            <button onClick={handleSave} className="bg-brand-primary hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"><SaveIcon className="w-5 h-5" /> Сохранить</button>
                        </div>
                        
                        {/* Locate Button */}
                        {onLocate && (
                            <div className="pb-3 px-4 flex justify-center">
                                <button onClick={() => { onClose(); onLocate(editedTask.id); }} className="text-xs text-brand-text-secondary hover:text-brand-accent flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-brand-surface">
                                    <SearchIcon className="w-3.5 h-3.5" />
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
                initialReminder={editedTask.reminder}
                initialRepeat={editedTask.repeat}
                timeFormat={timeFormat}
            />
        </>
    );
};

export default TaskDetailModal;