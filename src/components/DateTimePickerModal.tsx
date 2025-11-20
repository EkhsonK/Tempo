import React, { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import { BellIcon, RepeatIcon, ClockIcon, CalendarIcon, ChevronLeftIcon } from './IconComponents';
import { TimeFormat } from '../types';

interface DateTimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (isoString: string, reminder?: string, repeat?: string) => void;
    initialValue?: string;
    initialReminder?: string;
    initialRepeat?: string;
    timeFormat?: TimeFormat;
}

type Tab = 'date' | 'time';
type View = 'main' | 'reminder';

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ isOpen, onClose, onSave, initialValue, initialReminder, initialRepeat, timeFormat = '12h' }) => {
    const [activeTab, setActiveTab] = useState<Tab>('date');
    const [view, setView] = useState<View>('main');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    
    // Time State
    const [hour, setHour] = useState(12); // In 24h mode, this is 0-23. In 12h mode, 1-12.
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
    
    const [isClosing, setIsClosing] = useState(false);
    const [reminder, setReminder] = useState(initialReminder || 'Нет');
    const [repeat, setRepeat] = useState(initialRepeat || 'Никогда');

    // Refs for scrolling
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const periodRef = useRef<HTMLDivElement>(null);

    const ITEM_HEIGHT = 48; // Height of each number item in pixels

    useEffect(() => {
        if (isOpen) {
             const initial = initialValue && !isNaN(new Date(initialValue).getTime()) ? new Date(initialValue) : new Date();
             
             // Date Setup
             const year = initial.getFullYear();
             const month = String(initial.getMonth() + 1).padStart(2, '0');
             const day = String(initial.getDate()).padStart(2, '0');
             setSelectedDate(`${year}-${month}-${day}`);

             // Time Setup
             const rawHour = initial.getHours();
             
             if (timeFormat === '24h') {
                 setHour(rawHour);
             } else {
                 let h = rawHour;
                 const p = h >= 12 ? 'PM' : 'AM';
                 h = h % 12 || 12;
                 if (h === 0) h = 12; // Should not happen with %12||12 but safe
                 setHour(h);
                 setPeriod(p);
             }
             
             setMinute(initial.getMinutes());
             
             setReminder(initialReminder || 'Нет');
             setRepeat(initialRepeat || 'Никогда');
             
             // Reset view
             setActiveTab('date');
             setView('main');
        }
    }, [initialValue, initialReminder, initialRepeat, isOpen, timeFormat]);

    // Auto-scroll to selected time when Time tab is opened
    useEffect(() => {
        if (isOpen && view === 'main' && activeTab === 'time') {
            // Small timeout to allow render
            setTimeout(() => {
                if (hourRef.current) {
                    if (timeFormat === '24h') {
                         hourRef.current.scrollTop = hour * ITEM_HEIGHT;
                    } else {
                         hourRef.current.scrollTop = (hour - 1) * ITEM_HEIGHT;
                    }
                }
                if (minuteRef.current) minuteRef.current.scrollTop = minute * ITEM_HEIGHT;
                if (periodRef.current && timeFormat === '12h') periodRef.current.scrollTop = (period === 'PM' ? 1 : 0) * ITEM_HEIGHT;
            }, 50);
        }
    }, [isOpen, activeTab, view, timeFormat]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleSave = () => {
        if (!selectedDate) return;
        
        let hour24 = hour;
        if (timeFormat === '12h') {
            if (period === 'PM' && hour24 < 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
        }
        
        const finalDate = new Date(selectedDate);
        finalDate.setHours(hour24, minute, 0, 0);
        onSave(finalDate.toISOString(), reminder, repeat);
        handleClose();
    };

    // --- Date Logic ---
    const setPresetDate = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
    };

    const setNextSunday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = 7 - day; 
        d.setDate(d.getDate() + diff);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${dayStr}`);
    };

    const cycleRepeat = () => {
        const options = ['Никогда', 'Ежедневно', 'Еженедельно', 'Ежемесячно', 'Ежегодно'];
        setRepeat(prev => options[(options.indexOf(prev) + 1) % options.length]);
    };

    // --- Scroll Handlers ---
    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'hour' | 'minute' | 'period') => {
        const target = e.currentTarget;
        const index = Math.round(target.scrollTop / ITEM_HEIGHT);
        
        if (type === 'hour') {
            if (timeFormat === '24h') {
                const val = index;
                if (val >= 0 && val <= 23) setHour(val);
            } else {
                const val = index + 1;
                if (val >= 1 && val <= 12) setHour(val);
            }
        } else if (type === 'minute') {
            const val = index;
            if (val >= 0 && val <= 59) setMinute(val);
        } else if (type === 'period') {
            setPeriod(index === 0 ? 'AM' : 'PM');
        }
    };

    // --- Reminder Logic ---
    const getSelectedDateObj = () => {
        if (!selectedDate) return new Date();
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        let h = hour;
        if (timeFormat === '12h') {
            if (period === 'PM' && h < 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
        }
        date.setHours(h, minute, 0, 0);
        return date;
    };

    const reminderOptions = [
        { label: 'Нет', value: 'Нет', minutes: 0 },
        { label: 'В момент события', value: 'В момент события', minutes: 0 },
        { label: 'За 5 минут', value: 'За 5 мин', minutes: 5 },
        { label: 'За 10 минут', value: 'За 10 мин', minutes: 10 },
        { label: 'За 15 минут', value: 'За 15 мин', minutes: 15 },
        { label: 'За 30 минут', value: 'За 30 мин', minutes: 30 },
        { label: 'За 1 час', value: 'За 1 час', minutes: 60 },
        { label: 'За 1 день', value: 'За 1 день', minutes: 1440 },
    ];

    const getCalculatedReminderTime = (minutes: number) => {
        if (minutes === 0) return '';
        const target = getSelectedDateObj();
        const reminderTime = new Date(target.getTime() - minutes * 60000);
        return reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' });
    };

    const handleReminderClick = () => {
        if (reminder === 'Нет') {
            setReminder('За 5 мин');
        }
        setView('reminder');
    };

    if (!isOpen && !isClosing) return null;

    // Determine ranges for sliders
    const hourRange = timeFormat === '24h' ? 24 : 12;
    const hourOffset = timeFormat === '24h' ? 0 : 1;

    return (
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
            <div className={`bg-brand-background border border-brand-gray-700 rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'} flex flex-col max-h-[500px]`} onClick={e => e.stopPropagation()}>
                
                {/* Header / Tabs */}
                {view === 'main' ? (
                    <div className="flex border-b border-brand-gray-700 bg-brand-surface flex-shrink-0">
                        <button onClick={() => setActiveTab('date')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'date' ? 'text-brand-primary bg-brand-surface-solid/10' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>
                            <CalendarIcon className="w-4 h-4" /> Дата
                        </button>
                        <button onClick={() => setActiveTab('time')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'time' ? 'text-brand-primary bg-brand-surface-solid/10' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>
                            <ClockIcon className="w-4 h-4" /> Время
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center p-4 border-b border-brand-gray-700 bg-brand-surface flex-shrink-0">
                        <button onClick={() => setView('main')} className="text-brand-text-secondary hover:text-brand-text-primary p-1 rounded-lg hover:bg-brand-surface-solid/10 mr-2">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <h3 className="text-brand-text-primary font-bold text-sm">Напоминание</h3>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-grow overflow-hidden bg-brand-background relative">
                    {view === 'main' ? (
                        <>
                            {activeTab === 'date' ? (
                                <div className="animate-fade-in h-full flex flex-col p-6">
                                     <Calendar events={[]} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                                     
                                     <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                                         <button onClick={() => setPresetDate(0)} className="bg-brand-surface hover:bg-brand-surface-solid/50 text-brand-text-secondary text-xs py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">Сегодня</button>
                                         <button onClick={() => setPresetDate(1)} className="bg-brand-surface hover:bg-brand-surface-solid/50 text-brand-text-secondary text-xs py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">Завтра</button>
                                         <button onClick={() => setPresetDate(3)} className="bg-brand-surface hover:bg-brand-surface-solid/50 text-brand-text-secondary text-xs py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">+3 Дня</button>
                                         <button onClick={setNextSunday} className="bg-brand-surface hover:bg-brand-surface-solid/50 text-brand-text-secondary text-xs py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">Вскр</button>
                                     </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in flex flex-col h-full p-6 overflow-y-auto custom-scrollbar">
                                    
                                    {/* Picker Container */}
                                    <div className="relative flex justify-center items-center mb-8 flex-shrink-0">
                                        {/* Highlight Bar */}
                                        <div className="absolute left-0 right-0 h-[48px] bg-brand-surface-solid/10 border-y border-brand-primary/30 rounded-lg pointer-events-none z-10"></div>
                                        {/* Gradients */}
                                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-brand-background to-transparent z-20 pointer-events-none"></div>
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand-background to-transparent z-20 pointer-events-none"></div>

                                        {/* Columns */}
                                        <div className="flex gap-2 h-[240px] z-0">
                                            {/* HOURS */}
                                            <div 
                                                ref={hourRef}
                                                onScroll={(e) => handleScroll(e, 'hour')}
                                                className="w-16 overflow-y-auto snap-y snap-mandatory no-scrollbar py-[96px]"
                                            >
                                                {[...Array(hourRange)].map((_, i) => {
                                                    const val = i + hourOffset;
                                                    return (
                                                        <div key={val} className={`h-[48px] flex items-center justify-center text-2xl font-bold snap-center transition-all duration-200 ${hour === val ? 'text-brand-text-primary scale-110' : 'text-brand-text-secondary scale-90 blur-[1px]'}`}>
                                                            {String(val).padStart(2, '0')}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-center pb-1"><span className="text-2xl font-bold text-brand-text-secondary">:</span></div>
                                            {/* MINUTES */}
                                            <div 
                                                ref={minuteRef}
                                                onScroll={(e) => handleScroll(e, 'minute')}
                                                className="w-16 overflow-y-auto snap-y snap-mandatory no-scrollbar py-[96px]"
                                            >
                                                {[...Array(60)].map((_, i) => {
                                                    const val = i;
                                                    return (
                                                        <div key={val} className={`h-[48px] flex items-center justify-center text-2xl font-bold snap-center transition-all duration-200 ${minute === val ? 'text-brand-text-primary scale-110' : 'text-brand-text-secondary scale-90 blur-[1px]'}`}>
                                                            {String(val).padStart(2, '0')}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* AM/PM (Only for 12h) */}
                                            {timeFormat === '12h' && (
                                                <div 
                                                    ref={periodRef}
                                                    onScroll={(e) => handleScroll(e, 'period')}
                                                    className="w-16 overflow-y-auto snap-y snap-mandatory no-scrollbar py-[96px]"
                                                >
                                                    {['AM', 'PM'].map((p) => (
                                                        <div key={p} className={`h-[48px] flex items-center justify-center text-lg font-bold snap-center transition-all duration-200 ${period === p ? 'text-brand-accent scale-110' : 'text-brand-text-secondary scale-90 blur-[1px]'}`}>
                                                            {p}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div className="space-y-2 mt-auto">
                                        <button onClick={handleReminderClick} className="w-full flex items-center justify-between text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors group p-3 rounded-xl bg-brand-surface hover:bg-brand-surface-solid/50 border border-brand-gray-700">
                                            <div className="flex items-center gap-2">
                                                <BellIcon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-accent transition-colors" />
                                                <span>Напомнить</span>
                                            </div>
                                            <span className="text-brand-primary font-medium">{reminder}</span>
                                        </button>
                                        <button onClick={cycleRepeat} className="w-full flex items-center justify-between text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors group p-3 rounded-xl bg-brand-surface hover:bg-brand-surface-solid/50 border border-brand-gray-700">
                                            <div className="flex items-center gap-2">
                                                <RepeatIcon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-accent transition-colors" />
                                                <span>Повтор</span>
                                            </div>
                                            <span className="text-brand-text-primary">{repeat}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full overflow-y-auto animate-fade-in p-2 custom-scrollbar">
                            <ul className="space-y-1">
                                {reminderOptions.map((opt) => {
                                    const isSelected = reminder === opt.value;
                                    const timeStr = getCalculatedReminderTime(opt.minutes);
                                    return (
                                        <li key={opt.value}>
                                            <button 
                                                onClick={() => { setReminder(opt.value); setView('main'); }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all ${isSelected ? 'bg-brand-primary/20 border border-brand-primary/50' : 'hover:bg-brand-surface-solid/10 border border-transparent'}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`font-medium ${isSelected ? 'text-brand-primary' : 'text-brand-text-primary'}`}>{opt.label}</span>
                                                    {timeStr && <span className="text-xs text-brand-text-secondary mt-0.5">Уведомление в: <span className="text-brand-text-primary">{timeStr}</span></span>}
                                                </div>
                                                {isSelected && <CheckIcon className="w-5 h-5 text-brand-primary" />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                 {/* Footer Actions */}
                 <div className="p-4 flex justify-between items-center bg-brand-surface border-t border-brand-gray-700 flex-shrink-0">
                    <button onClick={handleClose} className="text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary px-6 py-2 transition-colors">Отмена</button>
                    <button onClick={handleSave} className="bg-brand-primary hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-glow-primary transition-transform active:scale-95">Готово</button>
                 </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;