import React, { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { ToDoItem, TimeFormat } from '../types';
import Calendar from './Calendar';
import { ClockIcon, SearchIcon } from './IconComponents';

interface CalendarViewProps {
    todos: ToDoItem[];
    setTodos: Dispatch<SetStateAction<ToDoItem[]>>;
    onLocateTask: (id: number) => void;
    timeFormat: TimeFormat;
}

const CalendarView: React.FC<CalendarViewProps> = ({ todos, setTodos, onLocateTask, timeFormat }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const handleToggleComplete = (todoId: number) => {
        setTodos(prevTodos => 
            prevTodos.map(t => 
                t.id === todoId ? { ...t, completed: !t.completed, lastModified: new Date().toISOString() } : t
            )
        );
    };

    const tasksForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return todos
            .filter(todo => {
                if (!todo.deadline) return false;
                const d = new Date(todo.deadline);
                const taskDateLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return taskDateLocal === selectedDate;
            })
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    }, [todos, selectedDate]);
    
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in text-brand-text-primary">
            <div className="lg:w-1/2 xl:w-2/5 bg-brand-surface p-4 rounded-lg border border-brand-gray-700/30">
                <Calendar 
                    events={todos.map(t => t.deadline).filter(Boolean) as string[]}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4 sticky top-0 bg-brand-surface py-2 rounded px-2">
                    Задачи на {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Выберите дату'}
                </h2>
                {tasksForSelectedDate.length > 0 ? (
                    <ul className="space-y-3">
                        {tasksForSelectedDate.map(todo => (
                             <li key={todo.id} className={`bg-brand-surface-solid/80 p-3 rounded-lg group border border-brand-gray-700/30 ${todo.completed ? 'opacity-60' : ''}`}>
                                 <div className="flex items-start gap-3">
                                     <div className="flex-grow cursor-pointer" onClick={() => onLocateTask(todo.id)}>
                                         <span className={`${todo.completed ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'}`}>{todo.text}</span>
                                         <div className="text-xs text-brand-text-secondary flex items-center gap-2 pt-1 mt-1">
                                             <ClockIcon className="w-3 h-3"/>
                                             <span>{new Date(todo.deadline!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}</span>
                                             <span>&bull;</span>
                                             <span>{todo.category}</span>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => onLocateTask(todo.id)} className="text-brand-text-secondary hover:text-brand-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1" title="Показать в списке">
                                             <SearchIcon className="w-4 h-4"/>
                                         </button>
                                         <input 
                                            type="checkbox" 
                                            checked={todo.completed} 
                                            onChange={() => handleToggleComplete(todo.id)}
                                            className="h-5 w-5 rounded bg-brand-surface border-brand-gray-700 text-brand-primary focus:ring-brand-primary cursor-pointer" 
                                        />
                                     </div>
                                 </div>
                             </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-48 bg-brand-surface rounded-lg text-brand-text-secondary border border-brand-gray-700/30">
                        <p>{selectedDate ? 'Нет задач на этот день.' : 'Выберите день, чтобы увидеть задачи.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;