
import React, { useMemo, useState, Dispatch, SetStateAction } from 'react';
import { ToDoItem, TimeFormat } from '../types';
import DoughnutChart from './DoughnutChart';
import DailyActivityChart from './DailyActivityChart';
import TaskDetailModal from './TaskDetailModal';
import { ChartBarIcon, ClockIcon, ChevronRightIcon, UserCircleIcon } from './IconComponents';
import { api } from '../services/api';

interface MeProps {
    todos: ToDoItem[];
    setTodos: Dispatch<SetStateAction<ToDoItem[]>>;
    onLocateTask: (id: number) => void;
    timeFormat: TimeFormat;
    username?: string | null;
    isGuest?: boolean;
    onLogout?: () => void;
}

const Me: React.FC<MeProps> = ({ todos, setTodos, onLocateTask, timeFormat, username, isGuest, onLogout }) => {
    const [selectedTask, setSelectedTask] = useState<ToDoItem | null>(null);

    const stats = useMemo(() => {
        const completed = todos.filter(t => t.completed);
        const uncompleted = todos.filter(t => !t.completed);
        const categoryColors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#2dd4bf', '#fbbf24'];

        const getCategoryData = (taskList: ToDoItem[]) => {
            const categoryMap = new Map<string, number>();
            taskList.forEach(task => categoryMap.set(task.category, (categoryMap.get(task.category) || 0) + 1));
            return Array.from(categoryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([label, value], index) => ({ label, value, color: categoryColors[index % categoryColors.length] }));
        };

        return {
            completedByCategory: getCategoryData(completed),
            uncompletedByCategory: getCategoryData(uncompleted),
            totalCompleted: completed.length,
            totalUncompleted: uncompleted.length
        };
    }, [todos]);

    const upcomingTasks = useMemo(() => {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        return todos.filter(t => {
            if (t.completed || !t.deadline) return false;
            const d = new Date(t.deadline);
            return d >= now && d <= nextWeek;
        }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    }, [todos]);

    const updateTodo = async (id: number, updates: Partial<ToDoItem>) => {
        // Optimistic Update
        setTodos(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, ...updates, lastModified: new Date().toISOString() };
            }
            return t;
        }));
        setSelectedTask(prev => prev && prev.id === id ? { ...prev, ...updates } as ToDoItem : prev);

        if (!isGuest) {
            try {
                await api.updateTodo(id, updates);
            } catch (e) {
                console.error("Failed to update via API");
            }
        }
    };

    const deleteTodo = async (id: number) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        setSelectedTask(null);
        
        if (!isGuest) {
            try {
                await api.deleteTodo(id);
            } catch (e) {
                 console.error("Failed to delete via API");
            }
        }
    };

    const renderLegend = (data: { label: string, value: number, color: string }[]) => (
        <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
            {data.map(item => (
                <li key={item.label} className="flex items-center justify-between text-xs text-shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                        <span className="text-brand-text-secondary truncate max-w-[80px]">{item.label}</span>
                    </div>
                    <span className="font-bold text-brand-text-primary">{item.value}</span>
                </li>
            ))}
        </ul>
    );

    const cardClass = "bg-brand-surface-solid/80 backdrop-blur-md border border-brand-gray-700/30 p-5 rounded-2xl shadow-lg";

    return (
        <div className="animate-fade-in pb-20 max-w-5xl mx-auto text-brand-text-primary">
            
            {/* Profile Section */}
            <div className={`${cardClass} mb-6 flex flex-col sm:flex-row items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-lg">
                         <UserCircleIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{isGuest ? "Гостевой режим" : (username || "User")}</h2>
                        <p className="text-sm text-brand-text-secondary">{isGuest ? "Локальное хранилище" : "Профиль"}</p>
                    </div>
                </div>
                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="px-5 py-2 rounded-xl bg-brand-surface hover:bg-red-500/10 text-brand-text-secondary hover:text-red-500 border border-brand-gray-700 transition-colors font-medium text-sm"
                    >
                        Выйти
                    </button>
                )}
            </div>

            <h2 className="text-2xl font-bold text-shadow-sm mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-7 h-7 text-brand-accent" /> Дашборд
            </h2>

            <div className={`${cardClass} mb-6`}>
                <DailyActivityChart todos={todos} />
            </div>

            <div className={`${cardClass} mb-6`}>
                <h3 className="text-lg font-bold mb-4 text-shadow-sm flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-brand-accent" /> Предстоящие (7 дней)
                </h3>
                {upcomingTasks.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {upcomingTasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center justify-between bg-brand-surface p-3 rounded-xl border border-brand-gray-700/20 hover:bg-brand-surface-solid/50 transition-all cursor-pointer group">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium text-brand-text-primary text-shadow-sm truncate group-hover:text-brand-primary transition-colors">{task.text}</span>
                                    <div className="flex items-center gap-3 text-xs text-brand-text-secondary mt-1">
                                        <span className="flex items-center gap-1 text-brand-secondary"><ClockIcon className="w-3 h-3" />{new Date(task.deadline!).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</span>
                                        <span className="bg-brand-surface-solid/30 px-1.5 py-0.5 rounded text-[10px]">{task.category}</span>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-brand-text-secondary group-hover:text-brand-text-primary transition-colors" />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-brand-text-secondary py-8 bg-brand-surface rounded-xl border border-brand-gray-700/20 border-dashed">Нет предстоящих дедлайнов. Вы свободны!</div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-brand-surface-solid/80 backdrop-blur-md border border-brand-gray-700/30 p-5 rounded-2xl shadow-lg">
                    <h3 className="text-md font-bold mb-4 text-center text-shadow-sm text-red-400 uppercase tracking-wide text-xs">Ожидающие</h3>
                    {stats.totalUncompleted > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32 flex-shrink-0 relative"><DoughnutChart data={stats.uncompletedByCategory} /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-xl font-bold">{stats.totalUncompleted}</span></div></div>
                            <div className="flex-grow">{renderLegend(stats.uncompletedByCategory)}</div>
                        </div>
                    ) : <p className="text-center text-brand-text-secondary py-10">Нет ожидающих задач.</p>}
                </div>

                <div className="bg-brand-surface-solid/80 backdrop-blur-md border border-brand-gray-700/30 p-5 rounded-2xl shadow-lg">
                    <h3 className="text-md font-bold mb-4 text-center text-shadow-sm text-green-400 uppercase tracking-wide text-xs">Выполненные</h3>
                    {stats.totalCompleted > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32 flex-shrink-0 relative"><DoughnutChart data={stats.completedByCategory} /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-xl font-bold">{stats.totalCompleted}</span></div></div>
                            <div className="flex-grow">{renderLegend(stats.completedByCategory)}</div>
                        </div>
                     ) : <p className="text-center text-brand-text-secondary py-10">Нет выполненных задач.</p>}
                </div>
            </div>

            <TaskDetailModal 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)} 
                onUpdate={updateTodo} 
                onDelete={deleteTodo} 
                onLocate={onLocateTask}
                timeFormat={timeFormat}
            />
        </div>
    );
};

export default Me;
