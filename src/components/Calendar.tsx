import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';

interface CalendarProps {
    events: string[];
    selectedDate: string | null;
    onDateSelect: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Синхронизация с выбранной датой при открытии
    useEffect(() => {
        if (selectedDate) {
            setCurrentDate(new Date(selectedDate));
        }
    }, [selectedDate]);

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Определяем количество дней в месяце
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Определяем день недели первого числа (0 - Вс, 1 - Пн, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Корректировка для начала недели с Понедельника (Пн=0, ..., Вс=6)
    // Если firstDayIndex = 0 (Воскресенье), то adjustedIndex должен быть 6.
    // Если firstDayIndex = 1 (Понедельник), то adjustedIndex должен быть 0.
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const renderDays = () => {
        const days = [];

        // Пустые ячейки до начала месяца
        for (let i = 0; i < startOffset; i++) {
            days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
        }

        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            
            // Проверка "Сегодня"
            const today = new Date();
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            days.push(
                <button
                    key={day}
                    onClick={() => onDateSelect(dateStr)}
                    className={`
                        h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                        ${isSelected 
                            ? 'bg-brand-primary text-brand-text-on-primary shadow-md scale-110 font-bold' 
                            : isToday 
                                ? 'text-brand-primary border border-brand-primary font-bold' 
                                : 'text-brand-text-primary hover:bg-brand-chip-bg hover:text-brand-primary'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <div className="w-full select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-bold text-brand-text-primary capitalize">
                    {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-brand-chip-bg text-brand-text-secondary transition-colors">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-brand-chip-bg text-brand-text-secondary transition-colors">
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="h-9 flex items-center justify-center text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider opacity-70">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 row-gap-2">
                {renderDays()}
            </div>
        </div>
    );
};

export default Calendar;