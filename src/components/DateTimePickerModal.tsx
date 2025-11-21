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
    
    // Time State
    const [hour, setHour] = useState(12); 
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
    
    const [reminder, setReminder] = useState(initialReminder || 'Нет');
    const [repeat, setRepeat] = useState(initialRepeat || 'Никогда');
    const [isClosing, setIsClosing] = useState(false);

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
             if (timeFormat === '24h') {
                 setHour(rawHour);
             } else {
                 let h = rawHour;
                 const p = h >= 12 ? 'PM' : 'AM';
                 h = h % 12 || 12;
                 if (h === 0) h = 12; 
                 setHour(h);
                 setPeriod(p);
             }
             setMinute(initial.getMinutes());
             setReminder(initialReminder || 'Нет');
             setRepeat(initialRepeat || 'Никогда');
             setActiveTab('date'); // Reset to date tab on open
        }
    }, [initialValue, initialReminder, initialRepeat, isOpen, timeFormat]);

    // Scroll to time
    useEffect(() => {
        if (isOpen && activeTab === 'time') {
            setTimeout(() => {
                const hOffset = timeFormat === '24h' ? hour : hour - 1;
                if (hourRef.current) hourRef.current.scrollTop = hOffset * ITEM_HEIGHT;
                if (minuteRef.current) minuteRef.current.scrollTop = minute * ITEM_HEIGHT;
                if (periodRef.current && timeFormat === '12h') periodRef.current.scrollTop = (period === 'PM' ? 1 : 0) * ITEM_HEIGHT;
            }, 100);
        }
    }, [isOpen, activeTab, timeFormat]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => { setIsClosing(false); onClose(); }, 200);
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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'hour' | 'minute' | 'period') => {
        const target = e.currentTarget;
        const index = Math.round(target.scrollTop / ITEM_HEIGHT);
        
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

    if (!isOpen && !isClosing) return null;
    
    const hourRange = timeFormat === '24h' ? 24 : 12;
    const hourStart = timeFormat === '24h' ? 0 : 1;

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
            <div 
                className={`bg-brand-surface-solid border border-brand-gray-700 rounded-3xl shadow-2xl w-full max-w-[350px] md:max-w-[500px] overflow-hidden transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} flex flex-col`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Tab Header */}
                <div className="flex border-b border-brand-gray-700 bg-brand-surface/50">
                    <button onClick={() => setActiveTab('date')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'date' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>
                        <CalendarIcon className="w-4 h-4" /> Дата
                    </button>
                    <button onClick={() => setActiveTab('time')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'time' ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>
                        <ClockIcon className="w-4 h-4" /> Время
                    </button>
                </div>

                {/* Content Area */}
                <div className="h-[400px] relative">
                    
                    {/* DATE TAB */}
                    {activeTab === 'date' && (
                        <div className="absolute inset-0 p-6 flex flex-col animate-fade-in bg-brand-background/50">
                             <div className="flex-grow">
                                 <Calendar events={[]} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                             </div>
                             <div className="flex gap-3 justify-center mt-2">
                                 <button onClick={() => { const d = new Date(); setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }} className="text-xs bg-brand-surface hover:bg-brand-primary hover:text-white text-brand-text-secondary px-4 py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">Сегодня</button>
                                 <button onClick={() => { const d = new Date(); d.setDate(d.getDate()+1); setSelectedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }} className="text-xs bg-brand-surface hover:bg-brand-primary hover:text-white text-brand-text-secondary px-4 py-2 rounded-lg border border-brand-gray-700 transition-colors font-medium">Завтра</button>
                             </div>
                        </div>
                    )}

                    {/* TIME TAB */}
                    {activeTab === 'time' && (
                        <div className="absolute inset-0 flex flex-col bg-brand-background animate-fade-in">
                            <div className="h-[220px] relative flex justify-center items-center flex-shrink-0 border-b border-brand-gray-700 bg-gradient-to-b from-brand-background via-transparent to-brand-background">
                                <div className="absolute h-[56px] w-full bg-brand-primary/10 border-y border-brand-primary/30 pointer-events-none z-10 backdrop-blur-[1px]"></div>
                                <div className="flex gap-4 h-full z-20 items-center">
                                    {/* HOURS */}
                                    <div ref={hourRef} onScroll={e => handleScroll(e, 'hour')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[82px]">
                                        {[...Array(hourRange)].map((_, i) => (
                                            <div key={i} className={`h-[56px] flex items-center justify-center text-3xl font-bold snap-center transition-all duration-200 ${hour === (i + hourStart) ? 'text-brand-primary scale-110' : 'text-brand-text-secondary opacity-40 scale-90'}`}>
                                                {String(i + hourStart).padStart(2, '0')}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-2xl font-bold text-brand-text-secondary pb-1">:</div>
                                    {/* MINUTES */}
                                    <div ref={minuteRef} onScroll={e => handleScroll(e, 'minute')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[82px]">
                                        {[...Array(60)].map((_, i) => (
                                            <div key={i} className={`h-[56px] flex items-center justify-center text-3xl font-bold snap-center transition-all duration-200 ${minute === i ? 'text-brand-primary scale-110' : 'text-brand-text-secondary opacity-40 scale-90'}`}>
                                                {String(i).padStart(2, '0')}
                                            </div>
                                        ))}
                                    </div>
                                    {/* AM/PM */}
                                    {timeFormat === '12h' && (
                                        <div ref={periodRef} onScroll={e => handleScroll(e, 'period')} className="w-16 h-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[82px]">
                                            {['AM', 'PM'].map(p => (
                                                <div key={p} className={`h-[56px] flex items-center justify-center text-xl font-bold snap-center transition-all duration-200 ${period === p ? 'text-brand-accent scale-110' : 'text-brand-text-secondary opacity-40 scale-90'}`}>
                                                    {p}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Settings */}
                            <div className="flex-grow p-6 space-y-4 flex flex-col justify-center">
                                 <div className="flex items-center justify-between p-2 rounded-lg hover:bg-brand-surface transition-colors">
                                     <div className="flex items-center gap-3 text-brand-text-secondary">
                                         <BellIcon className="w-5 h-5" /> <span className="text-sm font-medium">Напоминание</span>
                                     </div>
                                     <select value={reminder} onChange={e => setReminder(e.target.value)} className="bg-brand-background border border-brand-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-primary text-brand-text-primary cursor-pointer hover:border-brand-gray-600">
                                         <option value="Нет">Нет</option>
                                         <option value="В момент события">В момент события</option>
                                         <option value="За 15 мин">За 15 мин</option>
                                         <option value="За 1 час">За 1 час</option>
                                         <option value="За 1 день">За 1 день</option>
                                     </select>
                                 </div>
                                 <div className="flex items-center justify-between p-2 rounded-lg hover:bg-brand-surface transition-colors">
                                     <div className="flex items-center gap-3 text-brand-text-secondary">
                                         <RepeatIcon className="w-5 h-5" /> <span className="text-sm font-medium">Повтор</span>
                                     </div>
                                     <select value={repeat} onChange={e => setRepeat(e.target.value)} className="bg-brand-background border border-brand-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-primary text-brand-text-primary cursor-pointer hover:border-brand-gray-600">
                                         <option value="Никогда">Никогда</option>
                                         <option value="Ежедневно">Ежедневно</option>
                                         <option value="Еженедельно">Еженедельно</option>
                                         <option value="Ежемесячно">Ежемесячно</option>
                                     </select>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-brand-gray-700 bg-brand-surface flex justify-end gap-3">
                    <button onClick={handleClose} className="px-6 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-surface-solid/10 hover:text-brand-text-primary transition-colors font-medium text-sm">Отмена</button>
                    <button onClick={handleSave} className="px-8 py-2.5 rounded-xl bg-brand-primary hover:bg-blue-600 text-white font-bold shadow-glow-primary transition-all transform active:scale-95 text-sm">Готово</button>
                </div>
            </div>
        </div>
    );
};

export default DateTimePickerModal;