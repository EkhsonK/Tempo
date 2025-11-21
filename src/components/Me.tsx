import React, { useMemo, useState, Dispatch, SetStateAction } from 'react';
import { ToDoItem, TimeFormat } from '../types';
import DoughnutChart from './DoughnutChart';
import DailyActivityChart from './DailyActivityChart';
import TaskDetailModal from './TaskDetailModal';
import { ChartBarIcon, ClockIcon, ChevronRightIcon, UserCircleIcon, SearchIcon } from './IconComponents';
import { api } from '../services/api';

interface MeProps {
    todos: ToDoItem[];
    setTodos: Dispatch<SetStateAction<ToDoItem[]>>;
    onLocateTask: (id: number) => void;
    timeFormat: TimeFormat;
    username?: string | null;
    isGuest?: boolean;
    onLogout?: () => void;
    categories: string[];
}

const Me: React.FC<MeProps> = ({ todos, setTodos, onLocateTask, timeFormat, username, isGuest, onLogout, categories }) => {
    const [selectedTask, setSelectedTask] = useState<ToDoItem | null>(null);

    const stats = useMemo(() => {
        const completed = todos.filter(t => t.completed);
        const uncompleted = todos.filter(t => !t.completed);
        
        // Professional Palette for Chart
        const categoryColors = [
            '#3B82F6', // Blue
            '#10B981', // Emerald
            '#8B5CF6', // Violet
            '#F59E0B', // Amber
            '#EC4899', // Pink
            '#06B6D4', // Cyan
            '#6366F1'  // Indigo
        ];
        
        const getCatData = (list: ToDoItem[]) => {
            const map = new Map<string, number>();
            list.forEach(t => map.set(t.category, (map.get(t.category) || 0) + 1));
            return Array.from(map.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([l, v], i) => ({ 
                    label: l, 
                    value: v, 
                    color: categoryColors[i % categoryColors.length] 
                }));
        };
        
        const compData = getCatData(completed);
        
        // Calculate completion rate
        const totalTasks = todos.length;
        const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

        return { comp: compData, totalC: completed.length, totalU: uncompleted.length, rate: completionRate };
    }, [todos]);

    const upcoming = useMemo(() => {
        const now = new Date();
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) >= now && new Date(t.deadline) <= week).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    }, [todos]);

    const handleToggleComplete = async (todo: ToDoItem) => {
        const updated = { ...todo, completed: !todo.completed, lastModified: new Date().toISOString() };
        setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
        if (!isGuest) await api.updateTodo(todo.id, { completed: updated.completed });
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

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto text-brand-text-primary space-y-6">
            
            {/* Header Profile Card */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 border-b-4 border-brand-primary/20">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent p-0.5 shadow-glow">
                        <div className="w-full h-full bg-brand-background rounded-full flex items-center justify-center">
                             <UserCircleIcon className="w-12 h-12 text-brand-text-primary" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{isGuest ? "Гостевой режим" : (username || "Пользователь")}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isGuest ? 'bg-orange-400' : 'bg-green-500'}`}></span>
                            <p className="text-brand-text-secondary font-medium text-sm">{isGuest ? "Локальное хранилище" : "Аккаунт синхронизирован"}</p>
                        </div>
                    </div>
                </div>
                {onLogout && <button onClick={onLogout} className="px-6 py-2.5 rounded-xl border border-brand-gray-700 text-brand-text-secondary hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors font-bold text-sm">Выйти</button>}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Stats & Chart */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                            <ChartBarIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold">Продуктивность</h3>
                     </div>

                     <div className="flex-grow flex flex-col items-center justify-center py-4">
                        <div className="relative w-56 h-56">
                            <DoughnutChart data={stats.comp} />
                        </div>
                     </div>

                     <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-brand-background/50 rounded-xl border border-brand-gray-700/50">
                            <span className="text-sm text-brand-text-secondary font-medium">Выполнено</span>
                            <span className="font-bold text-brand-primary">{stats.rate}%</span>
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-brand-text-secondary mb-2">По категориям</p>
                            {stats.comp.length > 0 ? stats.comp.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        {/* [UPDATED] Integrated count into label */}
                                        <span className="text-brand-text-primary font-medium">
                                            {item.label} <span className="text-brand-text-secondary opacity-70">({item.value})</span>
                                        </span>
                                    </div>
                                </div>
                            )) : <p className="text-xs text-brand-text-secondary italic">Нет данных</p>}
                        </div>
                     </div>
                </div>

                {/* Middle & Right Col: Activity & Upcoming */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    
                    {/* Daily Activity Chart */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-bold">Активность за неделю</h3>
                        </div>
                        <DailyActivityChart todos={todos} />
                    </div>

                    {/* Upcoming Tasks List */}
                    <div className="glass-panel p-6 rounded-3xl flex-grow flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                             <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent"><ClockIcon className="w-5 h-5" /></div>
                             <h3 className="text-lg font-bold">Ближайшие дедлайны</h3>
                        </div>
                        
                        <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                            {upcoming.length > 0 ? upcoming.map(task => (
                                <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center justify-between p-3 rounded-2xl bg-brand-background/50 hover:bg-brand-background border border-brand-gray-800 hover:border-brand-primary/30 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <input 
                                            type="checkbox" 
                                            checked={task.completed} 
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => handleToggleComplete(task)}
                                            className="h-5 w-5 rounded-full border-brand-gray-700 text-brand-primary focus:ring-offset-0 focus:ring-brand-primary cursor-pointer flex-shrink-0" 
                                        />
                                        <div className="min-w-0">
                                            <span className="font-semibold text-brand-text-primary block truncate text-sm">{task.text}</span>
                                            <div className="flex gap-2 text-[11px] mt-0.5">
                                                <span className="text-brand-accent font-medium">{new Date(task.deadline!).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</span>
                                                <span className="text-brand-text-secondary opacity-70 truncate">{task.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center pl-2">
                                        <button onClick={(e) => {e.stopPropagation(); onLocateTask(task.id);}} className="p-2 hover:bg-brand-surface-solid rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                            <SearchIcon className="w-4 h-4 text-brand-text-secondary hover:text-brand-primary"/>
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-brand-text-secondary opacity-60 py-8">
                                    <ClockIcon className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm">Нет срочных задач</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <TaskDetailModal 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)} 
                onUpdate={(id, u) => { setTodos(p => p.map(t => t.id === id ? { ...t, ...u } : t)); if (!isGuest) api.updateTodo(id, u); }} 
                onDelete={(id) => { setTodos(p => p.filter(t => t.id !== id)); setSelectedTask(null); if (!isGuest) api.deleteTodo(id); }} 
                onLocate={onLocateTask} 
                timeFormat={timeFormat} 
                categories={categories}
            />
        </div>
    );
};

export default Me;