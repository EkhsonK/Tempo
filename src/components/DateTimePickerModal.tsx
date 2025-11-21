import React, { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import { BellIcon, RepeatIcon, CalendarIcon, ClockIcon } from './IconComponents'; 
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

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const periodRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 64; 

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
        }
    }, [isOpen]);

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
        const index = Math.round(e.currentTarget.scrollTop / ITEM_HEIGHT);
        if (type === 'hour') {
            if (timeFormat === '24h') { if (index >= 0 && index <= 23) setHour(index); } 
            else { if (index >= 0 && index <= 11) setHour(index + 1); }
        } else if (type === 'minute') { if (index >= 0 && index <= 59) setMinute(index); } 
        else if (type === 'period') { setPeriod(index === 0 ? 'AM' : 'PM'); }
    };

    const setQuickDate = (daysToAdd: number) => {
        const d = new Date(); d.setDate(d.getDate() + daysToAdd);
        setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        setActiveTab('time');
    };

    if (!isOpen && !isClosing) return null;
    
    const hourRange = timeFormat === '24h' ? 24 : 12;
    const hourStart = timeFormat === '24h' ? 0 : 1;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[70] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
            <div className={`bg-brand-surface-rgb w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'} flex flex-col max-h-[80vh]`} style={{background: 'rgb(var(--brand-surface-rgb))'}} onClick={e => e.stopPropagation()}>
                
                {/* Tabs */}
                <div className="flex border-b border-brand-gray-700">
                    <button onClick={() => setActiveTab('date')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'date' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-text-secondary'}`}>
                        <CalendarIcon className="w-4 h-4" /> Дата
                    </button>
                    <button onClick={() => setActiveTab('time')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'time' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-text-secondary'}`}>
                        <ClockIcon className="w-4 h-4" /> Время
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto bg-brand-background text-brand-text-primary">
                    {/* DATE TAB */}
                    {activeTab === 'date' && (
                        <div className="p-4 flex flex-col gap-3 animate-fade-in">
                             <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                 <button onClick={() => setQuickDate(0)} className="flex-shrink-0 bg-brand-surface-rgb border border-brand-gray-700 px-3 py-2 rounded-xl text-xs font-medium">Сегодня</button>
                                 <button onClick={() => setQuickDate(1)} className="flex-shrink-0 bg-brand-surface-rgb border border-brand-gray-700 px-3 py-2 rounded-xl text-xs font-medium">Завтра</button>
                                 <button onClick={() => setQuickDate(7)} className="flex-shrink-0 bg-brand-surface-rgb border border-brand-gray-700 px-3 py-2 rounded-xl text-xs font-medium">Неделя</button>
                             </div>
                             <div className="rounded-2xl border border-brand-gray-700 p-2 bg-brand-surface-rgb">
                                 <Calendar events={[]} selectedDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setTimeout(()=>setActiveTab('time'), 200); }} />
                             </div>
                        </div>
                    )}

                    {/* TIME TAB - Simplified */}
                    {activeTab === 'time' && (
                        <div className="flex flex-col h-full animate-fade-in">
                            <div className="h-[200px] relative flex justify-center items-center bg-brand-background">
                                <div className="absolute h-[64px] w-full bg-brand-primary/10 border-y border-brand-primary/30 pointer-events-none z-10"></div>
                                <div className="flex gap-6 h-full z-20 items-center">
                                    <div ref={hourRef} onScroll={e => handleScroll(e, 'hour')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[68px]">
                                        {[...Array(hourRange)].map((_, i) => (
                                            <div key={i} className={`h-[64px] flex items-center justify-center text-4xl font-bold snap-center transition-all ${hour === (i + hourStart) ? 'text-brand-primary scale-110' : 'text-brand-text-secondary opacity-30 scale-90'}`}>{String(i + hourStart).padStart(2, '0')}</div>
                                        ))}
                                    </div>
                                    <div className="text-3xl font-bold text-brand-gray-700 pb-1">:</div>
                                    <div ref={minuteRef} onScroll={e => handleScroll(e, 'minute')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[68px]">
                                        {[...Array(60)].map((_, i) => (
                                            <div key={i} className={`h-[64px] flex items-center justify-center text-4xl font-bold snap-center transition-all ${minute === i ? 'text-brand-primary scale-110' : 'text-brand-text-secondary opacity-30 scale-90'}`}>{String(i).padStart(2, '0')}</div>
                                        ))}
                                    </div>
                                    {timeFormat === '12h' && (
                                        <div ref={periodRef} onScroll={e => handleScroll(e, 'period')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[68px]">
                                            {['AM', 'PM'].map(p => (
                                                <div key={p} className={`h-[64px] flex items-center justify-center text-2xl font-bold snap-center transition-all ${period === p ? 'text-brand-accent' : 'text-brand-text-secondary opacity-30'}`}>{p}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-brand-surface-rgb border-t border-brand-gray-700 flex justify-between items-center pb-8">
                    {activeTab === 'time' && (
                        <div className="flex items-center gap-2">
                            <BellIcon className="w-5 h-5 text-brand-text-secondary" />
                            <select value={reminder} onChange={e => setReminder(e.target.value)} className="bg-transparent text-xs font-medium text-brand-text-primary focus:outline-none">
                                <option value="Нет">Без напоминания</option>
                                <option value="В момент события">В момент</option>
                                <option value="За 15 мин">За 15 мин</option>
                            </select>
                        </div>
                    )}
                    <button onClick={handleSave} className="ml-auto bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform">
                        Готово
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;