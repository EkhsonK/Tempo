import React, { useMemo, useState } from 'react';
import { ToDoItem } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';

interface DailyActivityChartProps {
    todos: ToDoItem[];
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ todos }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const weekRange = useMemo(() => {
        const curr = new Date(currentDate);
        const day = curr.getDay(); // 0 = Sun, 1 = Mon ...
        
        // Calculate Monday. If Sunday (0), go back 6 days. If Mon (1), go back 0.
        const diff = curr.getDate() - (day === 0 ? 6 : day - 1);
        
        const monday = new Date(curr);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    const chartData = useMemo(() => {
        return weekRange.map(day => {
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const nextDay = new Date(dayStart);
            nextDay.setDate(dayStart.getDate() + 1);

            const count = todos.filter(t => {
                if (!t.completed) return false;
                const modDate = new Date(t.lastModified);
                return modDate >= dayStart && modDate < nextDay;
            }).length;

            return {
                label: day.toLocaleDateString(undefined, { weekday: 'short' }), // Mon, Tue
                dateStr: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), // Nov 17
                value: count,
                isToday: day.toDateString() === new Date().toDateString()
            };
        });
    }, [todos, weekRange]);

    const changeWeek = (offset: number) => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + (offset * 7));
            return d;
        });
    };

    const maxValue = Math.max(...chartData.map(d => d.value), 4);
    const yTicks = [0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), maxValue];

    return (
        <div className="w-full h-72 bg-gray-900/40 rounded-xl p-4 border border-white/5 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-bold text-gray-300">Weekly Activity</h3>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                    <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <span className="text-xs font-mono text-gray-300 w-24 text-center">
                        {chartData[0].dateStr} - {chartData[6].dateStr}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-grow flex relative pr-2">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between text-[10px] text-gray-500 py-2 pr-2 text-right w-6">
                    {[...yTicks].reverse().map((tick, i) => <span key={i}>{tick}</span>)}
                </div>
                
                {/* Chart Area */}
                <div className="flex-grow relative flex items-end justify-between border-l border-b border-gray-700 pl-2 pt-2">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pl-2 pb-0">
                         {[...yTicks].reverse().map((_, i) => (
                            <div key={i} className={`w-full border-t border-gray-700/30 h-0 ${i === yTicks.length - 1 ? 'opacity-0' : ''}`}></div>
                         ))}
                    </div>

                    {/* Bars */}
                    {chartData.map((d, i) => {
                        const heightPct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                        return (
                            <div key={i} className="flex flex-col items-center justify-end h-full flex-1 group z-10 relative">
                                <div 
                                    style={{ height: `${heightPct}%` }} 
                                    className={`w-3 sm:w-5 rounded-t-sm transition-all duration-500 ${d.isToday ? 'bg-brand-accent shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-white/10 hover:bg-brand-primary'}`}
                                ></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X-Axis */}
            <div className="flex pl-8 pt-2">
                {chartData.map((d, i) => (
                    <div key={i} className={`flex-1 text-center text-[10px] uppercase font-medium ${d.isToday ? 'text-brand-accent' : 'text-gray-500'}`}>
                        {d.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyActivityChart;