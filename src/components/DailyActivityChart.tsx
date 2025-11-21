import React, { useMemo, useState } from 'react';
import { ToDoItem } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';

interface DailyActivityChartProps {
    todos: ToDoItem[];
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ todos }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const weekRange = useMemo(() => {
        const curr = new Date(currentDate);
        const day = curr.getDay();
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
                label: day.toLocaleDateString(undefined, { weekday: 'short' }),
                dateStr: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
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
    const yTicks = [0, Math.ceil(maxValue * 0.5), maxValue];

    return (
        // Outer Container
        <div className="w-full h-72 bg-brand-surface border border-brand-gray-700 rounded-3xl p-5 flex flex-col shadow-sm transition-colors duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-bold text-brand-text-primary">Активность</h3>
                <div className="flex items-center gap-2 bg-brand-background/50 rounded-xl p-1 border border-brand-gray-700">
                    <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-brand-surface-solid rounded-lg text-brand-text-secondary hover:text-brand-primary transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <span className="text-[10px] font-mono text-brand-text-primary w-24 text-center font-medium uppercase tracking-wider">
                        {chartData[0].dateStr} - {chartData[6].dateStr}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-brand-surface-solid rounded-lg text-brand-text-secondary hover:text-brand-primary transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-grow flex relative pr-2">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-[9px] font-bold text-brand-text-secondary py-2 pr-2 text-right w-6">
                    <span className="relative -top-1.5">{yTicks[2]}</span>
                    <span>{yTicks[1]}</span>
                    <span className="relative -bottom-1.5">{yTicks[0]}</span>
                </div>
                
                {/* Chart Area */}
                <div className="flex-grow relative flex items-end justify-between pl-2 pb-2">
                    {/* Horizontal Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-2">
                         <div className="w-full border-t border-dashed border-brand-gray-700/30 h-0"></div>
                         <div className="w-full border-t border-dashed border-brand-gray-700/30 h-0"></div>
                         <div className="w-full border-t border-brand-gray-700/50 h-0"></div>
                    </div>

                    {/* Columns */}
                    {chartData.map((d, i) => {
                        const heightPct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                        return (
                            <div 
                                key={i} 
                                className="relative flex-1 h-full flex flex-col justify-end items-center group px-1 cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Tooltip */}
                                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-text-primary text-brand-surface-solid text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg transition-all duration-200 pointer-events-none whitespace-nowrap z-30 ${hoveredIndex === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                    {d.value} задач
                                    {/* Little arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-text-primary"></div>
                                </div>

                                {/* Bar Track (Always Visible Background) */}
                                <div className="w-4 h-full absolute bottom-0 bg-gray-500/10 rounded-full z-0"></div>
                                
                                {/* The Bar Itself */}
                                <div 
                                    style={{ height: `${heightPct}%` }} 
                                    className={`w-4 min-h-[6px] rounded-full transition-all duration-700 ease-out z-10 relative shadow-sm ${
                                        d.isToday 
                                        ? 'bg-brand-accent ring-2 ring-brand-surface-rgb' 
                                        : 'bg-brand-primary opacity-90 group-hover:opacity-100 group-hover:scale-y-105 origin-bottom'
                                    }`}
                                ></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex pl-8 pt-2">
                {chartData.map((d, i) => (
                    <div key={i} className={`flex-1 text-center text-[9px] uppercase tracking-wider font-bold ${d.isToday ? 'text-brand-accent' : 'text-brand-text-secondary'}`}>
                        {d.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DailyActivityChart;