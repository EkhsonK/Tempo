import React, { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import { BellIcon, RepeatIcon, CalendarIcon, ClockIcon, ChevronDownIcon, CheckIcon } from './IconComponents'; 
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

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ isOpen, onClose, onSave, initialValue, initialReminder, initialRepeat, timeFormat = '12h' }) => {
    const [activeTab, setActiveTab] = useState<Tab>('date');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [hour, setHour] = useState(12); 
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
    const [reminder, setReminder] = useState(initialReminder || 'Нет');
    const [repeat, setRepeat] = useState(initialRepeat || 'Никогда');
    const [isClosing, setIsClosing] = useState(false);
    
    const [showReminderMenu, setShowReminderMenu] = useState(false);
    const [showRepeatMenu, setShowRepeatMenu] = useState(false);

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const periodRef = useRef<HTMLDivElement>(null);
    
    const ITEM_HEIGHT = 56; 

    useEffect(() => {
        if (isOpen) {
             const initial = initialValue && !isNaN(new Date(initialValue).getTime()) ? new Date(initialValue) : new Date();
             const year = initial.getFullYear();
             const month = String(initial.getMonth() + 1).padStart(2, '0');
             const day = String(initial.getDate()).padStart(2, '0');
             setSelectedDate(`${year}-${month}-${day}`);

             const rawHour = initial.getHours();
             if (timeFormat === '24h') { setHour(rawHour); } 
             else {
                 let h = rawHour; const p = h >= 12 ? 'PM' : 'AM';
                 h = h % 12 || 12; setHour(h); setPeriod(p);
             }
             setMinute(initial.getMinutes());
             setReminder(initialReminder || 'Нет');
             setRepeat(initialRepeat || 'Никогда');
             setActiveTab('date');
             setShowReminderMenu(false);
             setShowRepeatMenu(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activeTab === 'time' && isOpen) {
            setTimeout(() => {
                if (hourRef.current) {
                    const hIndex = timeFormat === '24h' ? hour : (hour === 12 ? 11 : hour - 1);
                    hourRef.current.scrollTop = hIndex * ITEM_HEIGHT;
                }
                if (minuteRef.current) {
                    minuteRef.current.scrollTop = minute * ITEM_HEIGHT;
                }
                if (periodRef.current && timeFormat === '12h') {
                    periodRef.current.scrollTop = (period === 'PM' ? 1 : 0) * ITEM_HEIGHT;
                }
            }, 100);
        }
    }, [activeTab, isOpen]);

    const handleClose = () => { setIsClosing(true); setTimeout(() => { setIsClosing(false); onClose(); }, 200); };

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'hour' | 'minute' | 'period') => {
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        
        if (type === 'hour') {
            if (timeFormat === '24h') { 
                if (index >= 0 && index <= 23) setHour(index); 
            } else { 
                if (index >= 0 && index <= 11) setHour(index + 1); 
            }
        } else if (type === 'minute') { 
            if (index >= 0 && index <= 59) setMinute(index); 
        } else if (type === 'period') { 
            setPeriod(index === 0 ? 'AM' : 'PM'); 
        }
    };

    const setQuickDate = (daysToAdd: number) => {
        const d = new Date(); d.setDate(d.getDate() + daysToAdd);
        setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        setActiveTab('time');
    };

    if (!isOpen && !isClosing) return null;
    
    const hourRange = timeFormat === '24h' ? 24 : 12;
    const hourStart = timeFormat === '24h' ? 0 : 1;

    const renderScrollItem = (isActive: boolean, text: string) => (
        <div 
            style={{ height: `${ITEM_HEIGHT}px` }}
            className={`flex items-center justify-center text-3xl font-medium snap-center transition-all duration-300 ${isActive ? 'text-brand-primary scale-110' : 'text-brand-text-secondary opacity-40 scale-90 blur-[1px]'}`}
        >
            {text}
        </div>
    );

    // Reusable Custom Select Menu
    const CustomSelect = ({ 
        icon: Icon, 
        label, 
        value, 
        options, 
        isOpen, 
        onToggle, 
        onSelect 
    }: { 
        icon: any, 
        label: string, 
        value: string, 
        options: string[], 
        isOpen: boolean, 
        onToggle: () => void, 
        onSelect: (val: string) => void 
    }) => (
        <div className="relative w-full">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-full border transition-all duration-200 ${isOpen ? 'bg-brand-surface-solid border-brand-primary shadow-md' : 'bg-brand-chip-bg border-transparent hover:bg-brand-gray-800'}`}
            >
                <div className="flex items-center gap-3 text-brand-text-secondary">
                    <Icon className={`w-5 h-5 ${value !== 'Нет' && value !== 'Никогда' ? 'text-brand-primary' : ''}`} />
                    <span className="text-xs font-bold">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${value !== 'Нет' && value !== 'Никогда' ? 'text-brand-primary' : 'text-brand-text-primary'}`}>{value}</span>
                    <ChevronDownIcon className={`w-3 h-3 text-brand-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-brand-surface-solid rounded-2xl shadow-xl border border-brand-gray-700 overflow-hidden z-50 animate-fade-in">
                    {options.map(opt => (
                        <button 
                            key={opt} 
                            onClick={() => onSelect(opt)}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-brand-text-primary hover:bg-brand-chip-bg flex justify-between items-center first:border-b-0 border-b border-brand-gray-700/30 last:border-0"
                        >
                            {opt}
                            {value === opt && <CheckIcon className="w-3 h-3 text-brand-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] transition-opacity duration-300 px-4 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
            <div className={`glass-panel w-full max-w-sm rounded-3xl shadow-2xl overflow-visible transition-all duration-300 modal-surface ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col`} onClick={e => e.stopPropagation()}>
                
                {/* Header Tabs */}
                <div className="flex p-1.5 m-4 mb-0 bg-brand-chip-bg/50 rounded-full relative">
                    <div className={`absolute top-1.5 bottom-1.5 w-[48%] bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${activeTab === 'time' ? 'left-[50%]' : 'left-[2%]'}`}></div>
                    <button onClick={() => setActiveTab('date')} className={`flex-1 py-2.5 rounded-full text-xs font-bold z-10 transition-colors duration-300 ${activeTab === 'date' ? 'text-black' : 'text-brand-text-secondary'}`}>Дата</button>
                    <button onClick={() => setActiveTab('time')} className={`flex-1 py-2.5 rounded-full text-xs font-bold z-10 transition-colors duration-300 ${activeTab === 'time' ? 'text-black' : 'text-brand-text-secondary'}`}>Время</button>
                </div>

                <div className="p-4">
                    {/* DATE TAB */}
                    {activeTab === 'date' && (
                        <div className="animate-fade-in space-y-4">
                             {/* Quick Buttons */}
                             <div className="flex justify-between gap-2">
                                 {['Сегодня', 'Завтра', 'Выходные'].map((label, i) => (
                                     <button key={label} onClick={() => setQuickDate(i === 2 ? (6 - new Date().getDay() + 7) % 7 + 1 : i)} className="flex-1 bg-brand-surface border border-brand-gray-700/20 py-2.5 rounded-xl text-[11px] font-bold text-brand-text-primary shadow-sm hover:border-brand-primary/50 hover:text-brand-primary transition-all">
                                         {label}
                                     </button>
                                 ))}
                             </div>
                             {/* Calendar Grid */}
                             <div className="rounded-2xl border border-brand-gray-700/10 p-2 bg-brand-chip-bg/20">
                                 <Calendar events={[]} selectedDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setTimeout(()=>setActiveTab('time'), 300); }} />
                             </div>
                        </div>
                    )}

                    {/* TIME TAB */}
                    {activeTab === 'time' && (
                        <div className="animate-fade-in flex flex-col items-center py-2 relative">
                            {/* Time Picker Drum */}
                            <div className="relative flex gap-6 h-[180px] w-full justify-center mask-linear-gradient mb-6 items-center">
                                {/* Selection Highlight Bar - Centered perfectly */}
                                <div 
                                    style={{ height: `${ITEM_HEIGHT}px` }}
                                    className="absolute top-1/2 -translate-y-1/2 w-full bg-brand-chip-bg/40 rounded-2xl pointer-events-none z-0"
                                ></div>
                                
                                {/* Hours */}
                                <div 
                                    ref={hourRef} 
                                    onScroll={e => handleScroll(e, 'hour')} 
                                    className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-10 text-center"
                                    style={{ paddingTop: `${(180 - ITEM_HEIGHT) / 2}px`, paddingBottom: `${(180 - ITEM_HEIGHT) / 2}px` }}
                                >
                                    {[...Array(hourRange)].map((_, i) => renderScrollItem(hour === (i + hourStart), String(i + hourStart).padStart(2, '0')))}
                                </div>
                                
                                <div className="flex items-center justify-center text-2xl font-bold text-brand-gray-700/50 z-10">:</div>
                                
                                {/* Minutes */}
                                <div 
                                    ref={minuteRef} 
                                    onScroll={e => handleScroll(e, 'minute')} 
                                    className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-10 text-center"
                                    style={{ paddingTop: `${(180 - ITEM_HEIGHT) / 2}px`, paddingBottom: `${(180 - ITEM_HEIGHT) / 2}px` }}
                                >
                                    {[...Array(60)].map((_, i) => renderScrollItem(minute === i, String(i).padStart(2, '0')))}
                                </div>
                                
                                {/* AM/PM */}
                                {timeFormat === '12h' && (
                                    <div 
                                        ref={periodRef} 
                                        onScroll={e => handleScroll(e, 'period')} 
                                        className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-10 text-center"
                                        style={{ paddingTop: `${(180 - ITEM_HEIGHT) / 2}px`, paddingBottom: `${(180 - ITEM_HEIGHT) / 2}px` }}
                                    >
                                        {['AM', 'PM'].map(p => renderScrollItem(period === p, p))}
                                    </div>
                                )}
                            </div>

                            {/* Custom Selectors - Pill Look */}
                            <div className="w-full space-y-3 relative z-20">
                                <CustomSelect 
                                    icon={BellIcon} 
                                    label="Напоминание" 
                                    value={reminder} 
                                    options={['Нет', 'В момент события', 'За 15 мин', 'За 1 час']} 
                                    isOpen={showReminderMenu} 
                                    onToggle={() => { setShowReminderMenu(!showReminderMenu); setShowRepeatMenu(false); }} 
                                    onSelect={(val) => { setReminder(val); setShowReminderMenu(false); }} 
                                />
                                
                                <CustomSelect 
                                    icon={RepeatIcon} 
                                    label="Повтор" 
                                    value={repeat} 
                                    options={['Никогда', 'Ежедневно', 'Еженедельно', 'Ежемесячно']} 
                                    isOpen={showRepeatMenu} 
                                    onToggle={() => { setShowRepeatMenu(!showRepeatMenu); setShowReminderMenu(false); }} 
                                    onSelect={(val) => { setRepeat(val); setShowRepeatMenu(false); }} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-brand-gray-700/10 flex justify-between items-center bg-brand-surface-solid">
                    <button onClick={handleClose} className="text-xs font-bold text-brand-text-secondary hover:text-brand-text-primary px-2 py-2 transition-colors">Отмена</button>
                    <button onClick={handleSave} className="bg-brand-primary text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:shadow-brand-primary/30 active:scale-95 transition-all">
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;