import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';

interface CalendarProps {
    events: string[];
    selectedDate: string | null;
    onDateSelect: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const eventDays = new Set(events.map(e => new Date(e).toISOString().split('T')[0]));

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Use local time for "Today" check
    const now = new Date();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Corrected "isToday" check using local date components instead of UTC string
        const isToday = now.getDate() === day && 
                        now.getMonth() === currentDate.getMonth() && 
                        now.getFullYear() === currentDate.getFullYear();

        const hasEvent = eventDays.has(dateStr);
        const isSelected = selectedDate === dateStr;
        
        // Improved visual logic:
        // Selected = Solid Background (Brand Primary)
        // Today = Ring/Border (Brand Accent) to distinguish if they overlap
        let dayClasses = "h-8 w-8 flex items-center justify-center rounded-full text-sm cursor-pointer transition-all ";
        
        if (isSelected) {
             dayClasses += "bg-brand-primary text-white font-bold ";
             if (isToday) dayClasses += "ring-2 ring-brand-accent ring-offset-1 ring-offset-brand-surface-solid ";
        } else if (isToday) {
             dayClasses += "border-2 border-brand-accent text-brand-accent font-bold ";
        } else if (hasEvent) {
             dayClasses += "bg-brand-secondary/30 hover:bg-brand-secondary/60 ";
        } else {
             dayClasses += "hover:bg-gray-700 ";
        }

        calendarDays.push(
            <button key={day} onClick={() => onDateSelect(dateStr)} className={dayClasses}>
                {day}
            </button>
        );
    }

    return (
        <div className="text-brand-text-primary">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-brand-text-secondary">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 mt-2 text-center">
                {calendarDays}
            </div>
        </div>
    );
};

export default Calendar;