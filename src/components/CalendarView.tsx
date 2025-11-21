import React, { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { ToDoItem, TimeFormat } from '../types';
import Calendar from './Calendar';
import { ClockIcon, SearchIcon } from './IconComponents';
import TaskDetailModal from './TaskDetailModal';
import { api } from '../services/api';

interface CalendarViewProps {
    todos: ToDoItem[];
    setTodos: Dispatch<SetStateAction<ToDoItem[]>>;
    onLocateTask: (id: number) => void;
    timeFormat: TimeFormat;
    isGuest: boolean;
    categories: string[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ todos, setTodos, onLocateTask, timeFormat, isGuest, categories }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [selectedTask, setSelectedTask] = useState<ToDoItem | null>(null);

    const handleToggleComplete = (todoId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t));
        if (!isGuest) {
             const t = todos.find(i => i.id === todoId);
             if(t) api.updateTodo(todoId, { completed: !t.completed });
        }
    };

    const updateTodo = async (id: number, updates: Partial<ToDoItem>) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        if (!isGuest) await api.updateTodo(id, updates);
    };

    const deleteTodo = async (id: number) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        setSelectedTask(null);
        if (!isGuest) await api.deleteTodo(id);
    };

    const tasksForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return todos.filter(todo => {
            if (!todo.deadline) return false;
            const d = new Date(todo.deadline);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === selectedDate;
        }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    }, [todos, selectedDate]);
    
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in">
            <div className="lg:w-[400px] flex-shrink-0">
                <div className="glass-panel p-6 rounded-3xl h-full">
                     <Calendar events={todos.map(t => t.deadline).filter(Boolean) as string[]} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </div>
            </div>

            <div className="flex-1 glass-panel p-6 rounded-3xl flex flex-col overflow-hidden">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-6 flex items-center gap-3">
                    <span className="text-brand-primary">{selectedDate ? new Date(selectedDate).getDate() : ''}</span>
                    <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('ru-RU', { month: 'long', weekday: 'long' }) : 'Выберите дату'}</span>
                </h2>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {tasksForSelectedDate.length > 0 ? tasksForSelectedDate.map(todo => (
                        <div 
                            key={todo.id} 
                            onClick={() => setSelectedTask(todo)}
                            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 group cursor-pointer ${todo.completed ? 'bg-brand-background/20 border-transparent opacity-60' : 'bg-brand-surface border-brand-gray-700/50 hover:border-brand-primary/50'}`}
                        >
                             <input 
                                type="checkbox" 
                                checked={todo.completed} 
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleToggleComplete(todo.id, e)} 
                                className="mt-1 h-5 w-5 rounded border-brand-gray-700 text-brand-primary focus:ring-brand-primary cursor-pointer bg-brand-background" 
                             />
                             <div className="flex-grow">
                                 <span className={`block text-sm font-medium ${todo.completed ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'}`}>{todo.text}</span>
                                 <div className="flex items-center gap-3 mt-2 text-xs text-brand-text-secondary">
                                     <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {new Date(todo.deadline!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}</span>
                                     <span className="bg-brand-background/50 px-2 py-0.5 rounded-md border border-brand-gray-700">{todo.category}</span>
                                 </div>
                             </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-64 text-brand-text-secondary opacity-50">
                            <ClockIcon className="w-12 h-12 mb-2" />
                            <p>На этот день задач нет</p>
                        </div>
                    )}
                </div>
            </div>
            
            <TaskDetailModal 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)} 
                onUpdate={updateTodo} 
                onDelete={deleteTodo}
                onLocate={onLocateTask}
                timeFormat={timeFormat}
                categories={categories}
            />
        </div>
    );
};

export default CalendarView;