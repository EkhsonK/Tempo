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
}

const Me: React.FC<MeProps> = ({ todos, setTodos, onLocateTask, timeFormat, username, isGuest, onLogout }) => {
    const [selectedTask, setSelectedTask] = useState<ToDoItem | null>(null);

    const stats = useMemo(() => {
        const completed = todos.filter(t => t.completed);
        const uncompleted = todos.filter(t => !t.completed);
        const categoryColors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#2dd4bf', '#fbbf24'];
        
        const getCatData = (list: ToDoItem[]) => {
            const map = new Map<string, number>();
            list.forEach(t => map.set(t.category, (map.get(t.category) || 0) + 1));
            return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([l, v], i) => ({ label: l, value: v, color: categoryColors[i % categoryColors.length] }));
        };
        return { comp: getCatData(completed), uncomp: getCatData(uncompleted), totalC: completed.length, totalU: uncompleted.length };
    }, [todos]);

    const upcoming = useMemo(() => {
        const now = new Date();
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) >= now && new Date(t.deadline) <= week).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    }, [todos]);

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto text-brand-text-primary space-y-6">
            
            <div className="glass-panel p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent p-0.5 shadow-glow">
                        <div className="w-full h-full bg-brand-background rounded-full flex items-center justify-center">
                             <UserCircleIcon className="w-12 h-12 text-brand-text-primary" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{isGuest ? "Гостевой режим" : (username || "Пользователь")}</h2>
                        <p className="text-brand-text-secondary font-medium mt-1">{isGuest ? "Данные хранятся локально" : "Синхронизация активна"}</p>
                    </div>
                </div>
                {onLogout && <button onClick={onLogout} className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold">Выйти</button>}
            </div>

            <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-primary/20 rounded-lg"><ChartBarIcon className="w-6 h-6 text-brand-primary" /></div>
                    <h3 className="text-xl font-bold">Активность</h3>
                </div>
                <DailyActivityChart todos={todos} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-brand-accent/20 rounded-lg"><ClockIcon className="w-6 h-6 text-brand-accent" /></div>
                         <h3 className="text-xl font-bold">Ближайшие дедлайны</h3>
                    </div>
                    <div className="space-y-3 flex-grow">
                        {upcoming.length > 0 ? upcoming.map(task => (
                            <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center justify-between p-4 rounded-2xl bg-brand-background/40 hover:bg-brand-background/80 border border-transparent hover:border-brand-gray-700 transition-all cursor-pointer group">
                                <div>
                                    <span className="font-bold text-brand-text-primary block mb-1">{task.text}</span>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-brand-accent font-mono">{new Date(task.deadline!).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</span>
                                        <span className="text-brand-text-secondary">&bull; {task.category}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Direct Find-in-List Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onLocateTask(task.id); }}
                                        className="p-2 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-surface rounded-full transition-colors"
                                        title="Find in list"
                                    >
                                        <SearchIcon className="w-5 h-5" />
                                    </button>
                                    <ChevronRightIcon className="w-5 h-5 text-brand-text-secondary group-hover:text-brand-primary" />
                                </div>
                            </div>
                        )) : <div className="h-32 flex items-center justify-center text-brand-text-secondary">Нет задач на неделю 🎉</div>}
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl flex flex-col">
                     <h3 className="text-xl font-bold mb-6 text-center">Статистика</h3>
                     <div className="flex-grow flex flex-col items-center justify-center gap-4">
                        <div className="relative w-48 h-48">
                            <DoughnutChart data={stats.comp} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider text-brand-text-secondary bg-brand-surface px-3 py-1 rounded-full">Готово</span>
                        <div className="w-full mt-4 space-y-2 border-t border-brand-gray-700/50 pt-4">
                             <div className="flex justify-between text-sm p-3 bg-brand-background/30 rounded-xl items-center">
                                 <span className="text-brand-text-secondary">Ожидает</span>
                                 <span className="font-bold text-brand-text-primary text-lg">{stats.totalU}</span>
                             </div>
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
            />
        </div>
    );
};

export default Me;