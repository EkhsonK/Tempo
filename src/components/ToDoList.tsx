import React, { useState, useMemo, Dispatch, SetStateAction, useRef, useEffect } from 'react';
import { ToDoItem, Priority, ActiveTab, TimeFormat } from '../types';
import { PlusIcon, ClockIcon, MessageIcon, FlagIcon, SearchIcon, NoteIcon, ListCheckIcon, CancelIcon, PaperclipIcon, SyncIcon } from './IconComponents';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';

const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const due = new Date(deadline);
    const diffMillis = due.getTime() - now.getTime();

    if (diffMillis <= 0) return { text: "Просрочено", color: "text-red-400" };

    const diffHours = diffMillis / (1000 * 60 * 60);
    if (diffHours < 1) return { text: `<1ч`, color: "text-red-400" };

    const diffDays = diffHours / 24;
    if (diffDays < 1) {
        const hours = Math.floor(diffHours);
        return { text: `${hours}ч`, color: "text-red-400" };
    }
    if (diffDays <= 3) {
        const days = Math.floor(diffDays);
        return { text: `${days}д`, color: "text-orange-400" };
    }
    return { text: "", color: "" };
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HighlightText = ({ text, query }: { text: string, query: string }) => {
    if (!query || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() 
                ? <span key={i} className="bg-brand-accent/20 text-brand-accent rounded px-0.5 font-semibold shadow-[0_0_10px_rgba(var(--brand-accent-rgb),0.3)]">{part}</span>
                : part
            )}
        </span>
    );
};

interface ToDoListProps {
    todos: ToDoItem[];
    setTodos: Dispatch<SetStateAction<ToDoItem[]>>; // Keep for local optimistic updates if needed, but props are better
    categories: string[];
    setCategories: Dispatch<SetStateAction<string[]>>;
    setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
    setSelectedTaskForChat: Dispatch<SetStateAction<number | null>>;
    scrollToTaskId?: number | null;
    timeFormat: TimeFormat;
    isGuest: boolean;
    // [FIX] Added these props to delegate logic to App.tsx
    onRefresh?: () => void;
    onAddTodo: (task: Omit<ToDoItem, 'id' | 'lastModified' | 'completed' | 'subtasks' | 'notes' | 'attachments'>) => void;
    onUpdateTodo: (id: number, updates: Partial<ToDoItem>) => void;
    onDeleteTodo: (id: number) => void;
}

const ToDoList: React.FC<ToDoListProps> = ({ 
    todos, 
    categories, 
    setActiveCategory: setCategories, // Assuming this maps to the setter
    setActiveTab, 
    setSelectedTaskForChat, 
    scrollToTaskId, 
    timeFormat, 
    isGuest, 
    onRefresh,
    onAddTodo,
    onUpdateTodo,
    onDeleteTodo
}) => {
    const [activeCategory, setActiveCategory] = useState('Все');
    const [collapsedSections, setCollapsedSections] = useState<{ past: boolean; today: boolean; future: boolean }>({
        past: false, today: false, future: false
    });
    const [showCompleted, setShowCompleted] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ToDoItem | null>(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
    
    const listEndRef = useRef<HTMLDivElement>(null);

    const categoryCounts = useMemo(() => {
        const counts: { [key: string]: number } = { 'Все': todos.length };
        todos.forEach(todo => {
            counts[todo.category] = (counts[todo.category] || 0) + 1;
        });
        return counts;
    }, [todos]);

    useEffect(() => {
        if (scrollToTaskId !== null && scrollToTaskId !== undefined) {
            const task = todos.find(t => t.id === scrollToTaskId);
            if (task) {
                setSearchQuery('');
                if (activeCategory !== 'Все' && task.category !== activeCategory) {
                    setActiveCategory('Все');
                }

                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const tomorrowStart = new Date(todayStart);
                tomorrowStart.setDate(todayStart.getDate() + 1);
                
                let sectionToExpand: 'past' | 'today' | 'future' = 'future';
                
                if (!task.deadline) {
                    sectionToExpand = 'today';
                } else {
                    const d = new Date(task.deadline);
                    if (d < todayStart) sectionToExpand = 'past';
                    else if (d >= todayStart && d < tomorrowStart) sectionToExpand = 'today';
                    else sectionToExpand = 'future';
                }

                setCollapsedSections(prev => ({ ...prev, [sectionToExpand]: false }));
                setHighlightedTaskId(scrollToTaskId);
                
                setTimeout(() => {
                    const el = document.getElementById(`task-${scrollToTaskId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    setTimeout(() => setHighlightedTaskId(null), 2000);
                }, 300); 
            }
        }
    }, [scrollToTaskId, todos, activeCategory]);

    // [FIX] Use prop from App.tsx
    const updateTodo = (id: number, updates: Partial<Omit<ToDoItem, 'id'>>) => {
        onUpdateTodo(id, updates);
    };

    // [FIX] Use prop from App.tsx (Fixes TS Error by delegation)
    const handleSaveNewTodo = (taskData: Omit<ToDoItem, 'id' | 'lastModified' | 'completed' | 'subtasks' | 'notes' | 'attachments'>) => {
        onAddTodo(taskData);
        setSearchQuery('');
        setTimeout(() => { if (listEndRef.current) listEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, 100);
    };
    
    // [FIX] Use prop from App.tsx
    const handleDeleteTodo = (id: number) => {
        onDeleteTodo(id);
        setSelectedTask(null);
    };
    
    const handlePriorityChange = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentTodo = todos.find(t => t.id === id);
        if (!currentTodo) return;
        const priorities = [Priority.NONE, Priority.LOW, Priority.MEDIUM, Priority.HIGH];
        const currentIndex = priorities.indexOf(currentTodo.priority);
        updateTodo(id, { priority: priorities[(currentIndex + 1) % priorities.length] });
    };

    const handleOpenChatForTask = (taskId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTaskForChat(taskId);
        setActiveTab('chat');
    };

    const toggleSection = (section: 'past' | 'today' | 'future') => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const groupedTodos = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(todayStart.getDate() + 1);
        const searchLower = searchQuery.toLowerCase();
        
        const filtered = todos.filter(todo => {
            if (!showCompleted && todo.completed) return false;
            if (activeCategory !== 'Все' && todo.category !== activeCategory) return false;
            if (searchQuery) {
                const inText = todo.text.toLowerCase().includes(searchLower);
                const inCategory = todo.category.toLowerCase().includes(searchLower);
                const inNotes = todo.notes?.toLowerCase().includes(searchLower) ?? false;
                const inSubtasks = todo.subtasks?.some(sub => sub.text.toLowerCase().includes(searchLower)) ?? false;
                if (!inText && !inCategory && !inNotes && !inSubtasks) return false;
            }
            return true;
        });

        const groups = { past: [] as ToDoItem[], today: [] as ToDoItem[], future: [] as ToDoItem[], searchResults: [] as ToDoItem[] };

        if (searchQuery) {
            groups.searchResults = [...filtered];
            groups.searchResults.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
                const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
                return aTime - bTime;
            });
            return groups;
        }

        filtered.forEach(todo => {
            if (!todo.deadline) {
                groups.today.push(todo);
                return;
            }
            const d = new Date(todo.deadline);
            if (d < todayStart) groups.past.push(todo);
            else if (d >= todayStart && d < tomorrowStart) groups.today.push(todo);
            else groups.future.push(todo);
        });

        const sortCommon = (a: ToDoItem, b: ToDoItem) => (a.completed !== b.completed ? (a.completed ? 1 : -1) : 0);
        groups.past.sort((a, b) => sortCommon(a, b) || new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
        groups.today.sort((a, b) => {
             const res = sortCommon(a, b);
             if (res !== 0) return res;
             const pWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1, [Priority.NONE]: 0 };
             if (a.priority !== b.priority) return pWeight[b.priority] - pWeight[a.priority];
             const aTime = a.deadline ? new Date(a.deadline).getTime() : 0;
             const bTime = b.deadline ? new Date(b.deadline).getTime() : 0;
             if (aTime === 0 && bTime === 0) return 0;
             if (aTime === 0) return 1;
             if (bTime === 0) return -1;
             return aTime - bTime;
        });
        groups.future.sort((a, b) => sortCommon(a, b) || (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));

        return groups;
    }, [todos, activeCategory, showCompleted, searchQuery]);

    const renderTask = (todo: ToDoItem) => (
        <li 
            key={todo.id} 
            id={`task-${todo.id}`}
            onClick={() => setSelectedTask(todo)}
            className={`group bg-brand-surface-solid/80 backdrop-blur-sm p-3.5 rounded-xl transition-all duration-500 hover:bg-brand-surface-solid border cursor-pointer select-none flex items-start sm:items-center gap-3 ${todo.completed ? 'opacity-60' : ''} ${highlightedTaskId === todo.id ? 'border-brand-accent shadow-[0_0_15px_rgba(var(--brand-accent-rgb),0.4)] bg-brand-surface-solid' : 'border-white/5'}`}
        >
            <input 
                type="checkbox" 
                checked={todo.completed} 
                onChange={() => updateTodo(todo.id, { completed: !todo.completed })} 
                onClick={(e) => e.stopPropagation()} 
                className="h-6 w-6 mt-1 sm:mt-0 rounded-full bg-black/30 border-gray-500 text-brand-primary focus:ring-brand-primary cursor-pointer flex-shrink-0" 
            />
            
            <div className="flex-grow min-w-0 flex flex-col justify-center">
                <span className={`block text-base font-medium truncate leading-tight ${todo.completed ? 'line-through text-gray-500' : 'text-brand-text-primary'}`}>
                    <HighlightText text={todo.text} query={searchQuery} />
                </span>
                
                {searchQuery && (
                    (() => {
                         const lowerQ = searchQuery.toLowerCase();
                         const matchesNotes = todo.notes?.toLowerCase().includes(lowerQ);
                         const matchingSubtask = todo.subtasks?.find(s => s.text.toLowerCase().includes(lowerQ));
                         
                         if (matchesNotes || matchingSubtask) {
                             return (
                                 <div className="mt-2 mb-1 text-xs text-brand-text-secondary bg-white/5 p-2 rounded border border-white/5 flex flex-col gap-1">
                                     {matchesNotes && (
                                         <div className="flex items-start gap-1.5">
                                             <NoteIcon className="w-3 h-3 mt-0.5 opacity-70 flex-shrink-0"/> 
                                             <span className="truncate max-w-full italic opacity-90">
                                                 ...<HighlightText text={todo.notes!.substring(Math.max(0, todo.notes!.toLowerCase().indexOf(lowerQ) - 15), todo.notes!.toLowerCase().indexOf(lowerQ) + 40)} query={searchQuery} />...
                                             </span>
                                         </div>
                                     )}
                                     {matchingSubtask && (
                                         <div className="flex items-start gap-1.5">
                                              <ListCheckIcon className="w-3 h-3 mt-0.5 opacity-70 flex-shrink-0"/>
                                              <span className="truncate max-w-full italic opacity-90">
                                                  Подзадача: <HighlightText text={matchingSubtask.text} query={searchQuery} />
                                              </span>
                                         </div>
                                     )}
                                 </div>
                             )
                         }
                         return null;
                    })()
                )}

                <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold text-brand-text-secondary">
                        <HighlightText text={todo.category} query={searchQuery} />
                    </span>
                    
                    {todo.deadline && (
                        <span className="flex items-center gap-1 text-xs text-brand-accent font-mono">
                            <ClockIcon className="w-3 h-3"/>
                            {new Date(todo.deadline).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}, 
                            {new Date(todo.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}
                            {formatTimeRemaining(todo.deadline).text && <span className={`${formatTimeRemaining(todo.deadline).color} ml-1`}>({formatTimeRemaining(todo.deadline).text})</span>}
                        </span>
                    )}

                    {todo.attachments && todo.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-brand-text-secondary ml-1">
                            <PaperclipIcon className="w-3 h-3" />
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 mt-1 sm:mt-0">
                 <button 
                    onClick={(e) => handleOpenChatForTask(todo.id, e)} 
                    className="p-2 rounded-full hover:bg-white/10 text-brand-accent transition-colors" 
                    title="Chat"
                >
                    <MessageIcon className="w-5 h-5"/>
                </button>
                 
                 <button 
                    onClick={(e) => handlePriorityChange(todo.id, e)} 
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title="Priority"
                >
                    <FlagIcon priority={todo.priority} className="w-5 h-5"/>
                </button>
            </div>
        </li>
    );

    const renderSection = (title: string, tasks: ToDoItem[], isOpen: boolean, onToggle: () => void) => {
        if (tasks.length === 0) return null;
        return (
            <div className="mb-6">
                <button onClick={onToggle} className="flex items-center gap-2 w-full text-left text-brand-text-secondary hover:text-white font-bold text-sm uppercase tracking-widest mb-3 px-2 py-1 transition-colors">
                    <span>{isOpen ? '▼' : '▶'}</span> {title} <span className="text-xs font-normal opacity-50 ml-1">({tasks.length})</span>
                </button>
                {isOpen && <ul className="space-y-2 animate-fade-in">{tasks.map(t => renderTask(t))}</ul>}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <div className="flex flex-col gap-4 p-1 pb-2">
                <div className="relative w-full flex gap-2">
                    <div className="relative flex-grow">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                        <input 
                            type="text" 
                            placeholder="Поиск задач, заметок..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm w-full focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all placeholder-gray-500" 
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                <CancelIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Manual Refresh Button */}
                    <button 
                        onClick={onRefresh} 
                        className="bg-black/20 border border-white/10 rounded-xl px-3 flex items-center justify-center hover:bg-brand-gray-700 transition-colors"
                        title="Обновить"
                    >
                        <SyncIcon className="w-5 h-5 text-brand-text-secondary" />
                    </button>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
                     <button onClick={() => setActiveCategory('Все')} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${activeCategory === 'Все' ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' : 'bg-transparent border-white/10 text-gray-400 hover:border-brand-primary hover:text-brand-primary'}`}>
                        Все ({categoryCounts['Все']})
                     </button>
                    {categories.map(c => (
                        <button key={c} onClick={() => setActiveCategory(c)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${activeCategory === c ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' : 'bg-transparent border-white/10 text-gray-400 hover:border-brand-primary hover:text-brand-primary'}`}>
                            {c} ({categoryCounts[c] || 0})
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-brand-text-secondary hover:text-white transition-colors select-none"><input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} className="h-3 w-3 rounded bg-black/30 border-gray-600 text-brand-primary focus:ring-brand-primary"/> Показать завершенные</label>
                </div>
            </div>

            <div className="overflow-y-auto flex-grow pr-1 pb-20 no-scrollbar">
                {searchQuery ? (
                     groupedTodos.searchResults.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-brand-text-secondary space-y-2">
                             <SearchIcon className="w-10 h-10 opacity-20" />
                             <p>Задачи не найдены.</p>
                             <p className="text-xs opacity-50">Попробуйте изменить запрос.</p>
                         </div>
                     ) : (
                         <div className="animate-fade-in">
                             <h3 className="text-brand-text-secondary text-xs font-bold uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                                 <SearchIcon className="w-3 h-3" /> Результаты поиска ({groupedTodos.searchResults.length})
                             </h3>
                             <ul className="space-y-2">
                                 {groupedTodos.searchResults.map(t => renderTask(t))}
                             </ul>
                         </div>
                     )
                ) : (
                    groupedTodos.past.length === 0 && groupedTodos.today.length === 0 && groupedTodos.future.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-brand-text-secondary space-y-2">
                             <ListCheckIcon className="w-12 h-12 opacity-20" />
                             <p>Задач нет.</p>
                             <button onClick={() => setAddTaskModalOpen(true)} className="text-brand-primary text-sm hover:underline">Создать первую задачу</button>
                         </div>
                    ) : (
                        <>
                            {renderSection("Прошедшие", groupedTodos.past, !collapsedSections.past, () => toggleSection('past'))}
                            {renderSection("Сегодня", groupedTodos.today, !collapsedSections.today, () => toggleSection('today'))}
                            {renderSection("Предстоящие", groupedTodos.future, !collapsedSections.future, () => toggleSection('future'))}
                        </>
                    )
                )}
                <div ref={listEndRef} />
            </div>

            <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[55] group">
                <div className="btn-glow-container"></div>
                <button 
                    onClick={() => setAddTaskModalOpen(true)} 
                    className="btn-floating-action w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center relative" 
                    title="Add New Task"
                >
                    <PlusIcon className="w-7 h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:rotate-90" />
                </button>
            </div>

            <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setAddTaskModalOpen(false)} onSave={handleSaveNewTodo} categories={categories} initialCategory={activeCategory} timeFormat={timeFormat} />
            <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={updateTodo} onDelete={(id) => handleDeleteTodo(id)} timeFormat={timeFormat} categories={categories} />
        </div>
    );
};

export default ToDoList;