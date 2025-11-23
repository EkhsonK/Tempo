import React, { useRef, useState } from 'react';
import { DownloadIcon, UploadIcon, DatabaseIcon, PhotoIcon, ListCheckIcon, PlusIcon, TrashIcon, ClockIcon, UserIcon, GitHubIcon } from './IconComponents';
import { AppBackup, Theme, ToDoItem, TimeFormat } from '../types';
import WallpaperGalleryModal from './WallpaperGalleryModal';
import { api } from '../services/api';

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
);

interface SettingsProps {
    theme: Theme; setTheme: (theme: Theme) => void; timeFormat: TimeFormat; setTimeFormat: (format: TimeFormat) => void;
    backupData: Omit<AppBackup, 'taskChatHistories'>; onRestore: (backup: AppBackup) => void;
    setCustomBackground: (url: string | null) => void; categories: string[]; setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    todos: ToDoItem[]; setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>; onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, timeFormat, setTimeFormat, backupData, onRestore, setCustomBackground, categories, setCategories, todos, setTodos, onLogout }) => {
    const importInputRef = useRef<HTMLInputElement>(null);
    const bgUploadRef = useRef<HTMLInputElement>(null);
    const [newCategory, setNewCategory] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const syncSetting = async (key: string, value: string | null) => { try { await api.updateUserSettings({ [key]: value }); } catch (e) { console.error(`Sync error ${key}`, e); } };
    const handleThemeChange = (t: Theme) => { setTheme(t); syncSetting('theme', t); };
    const handleBackgroundChange = (url: string | null) => { setCustomBackground(url); syncSetting('background_url', url); };
    const handleAddCategory = async () => { if (newCategory.trim() && !categories.includes(newCategory.trim())) { setCategories(p => [...p, newCategory.trim()]); setNewCategory(''); try { await api.addCategory(newCategory.trim()); } catch(e){} } };
    const executeDeleteCategory = async (cat: string) => { setTodos(todos.filter(t => t.category !== cat)); setCategories(p => p.filter(c => c !== cat)); setConfirmingDelete(null); try{ await api.deleteCategory(cat); }catch(e){} };
    
    const handleExport = () => { const link = document.createElement("a"); link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...backupData, taskChatHistories: JSON.parse(localStorage.getItem('taskChatHistories')||'{}') }, null, 2))}`; link.download = `tempo-backup.json`; link.click(); };
    const handleImportClick = () => importInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; if (!file) return;
        if (!window.confirm("Импорт перезапишет данные. Продолжить?")) return;
        const r = new FileReader(); r.onload = (ev) => { try { onRestore(JSON.parse(ev.target?.result as string)); } catch(e){ alert('Ошибка файла'); } }; r.readAsText(file); e.target.value='';
    };
    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0]; if(!file) return;
         const formData = new FormData(); formData.append('file', file);
         try { const res = await fetch('http://127.0.0.1:5000/api/upload', { method: 'POST', body: formData }); if(res.ok) { const d = await res.json(); handleBackgroundChange(`url(${d.url})`); } } catch(e){ console.error(e); }
         e.target.value = '';
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-brand-text-primary pl-2">Настройки</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* THEME SELECTOR */}
                <div className="glass-panel p-6 rounded-3xl md:col-span-2">
                    <div className="flex items-center gap-3 mb-4 text-brand-text-primary">
                        <PaintBrushIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="text-xl font-bold">Тема оформления</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { id: 'light', name: 'Pro Light', bg: 'bg-white', border: 'border-gray-200' },
                            { id: 'dark', name: 'Deep Dark', bg: 'bg-gray-900', border: 'border-gray-700' },
                            { id: 'midnight', name: 'Midnight', bg: 'bg-indigo-950', border: 'border-indigo-800' },
                            { id: 'sunset', name: 'Sunset', bg: 'bg-orange-900', border: 'border-orange-800' },
                            { id: 'neon', name: 'Neon', bg: 'bg-black', border: 'border-lime-400' }
                        ].map(t => (
                            <button key={t.id} onClick={() => handleThemeChange(t.id as Theme)} className={`relative h-20 rounded-2xl border-2 transition-all overflow-hidden group ${theme === t.id ? 'border-brand-primary shadow-glow scale-[1.05]' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]'}`}>
                                <div className={`absolute inset-0 ${t.bg}`}></div>
                                <span className={`absolute bottom-2 left-3 font-bold text-sm ${t.id === 'light' ? 'text-gray-800' : 'text-white'} ${t.id === 'neon' ? 'text-lime-400' : ''}`}>{t.name}</span>
                                {theme === t.id && <div className="absolute top-2 right-2 bg-brand-primary text-white p-1 rounded-full"><svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--brand-text-on-primary)' }}><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CATEGORY MANAGER */}
                <div className="glass-panel p-6 rounded-3xl row-span-2 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <ListCheckIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="text-xl font-bold">Категории</h3>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Новая категория..." 
                            className="flex-grow bg-brand-surface border border-brand-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors text-brand-text-primary"
                        />
                        <button onClick={handleAddCategory} className="bg-brand-primary p-2 rounded-xl hover:bg-brand-secondary transition-colors" style={{ color: 'var(--brand-text-on-primary)' }}><PlusIcon className="w-5 h-5"/></button>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[400px]">
                        {categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center p-3 rounded-xl bg-brand-surface hover:bg-brand-surface-solid/20 transition-colors border border-brand-gray-700/30">
                                {confirmingDelete === cat ? (
                                    <div className="flex justify-between w-full items-center animate-fade-in">
                                        <span className="text-xs text-red-400 font-bold">Удалить?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => executeDeleteCategory(cat)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Да</button>
                                            <button onClick={() => setConfirmingDelete(null)} className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Нет</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-brand-text-primary text-sm">{cat}</span>
                                        {cat !== 'Общее' && cat !== 'General' && <button onClick={() => setConfirmingDelete(cat)} className="text-brand-text-secondary hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* WALLPAPER & TIME */}
                <div className="glass-panel p-6 rounded-3xl space-y-6">
                     <div>
                        <div className="flex items-center gap-3 mb-4">
                            <PhotoIcon className="w-6 h-6 text-brand-accent" />
                            <h3 className="text-xl font-bold">Обои</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setIsGalleryOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform col-span-3">Открыть Галерею</button>
                            <button onClick={() => bgUploadRef.current?.click()} className="bg-brand-surface border border-brand-gray-700 text-brand-text-primary py-2 rounded-xl text-xs font-medium hover:bg-brand-gray-700 transition-colors">Загрузить</button>
                            <button onClick={() => handleBackgroundChange(null)} className="bg-brand-surface border border-brand-gray-700 text-brand-text-primary py-2 rounded-xl text-xs font-medium hover:bg-brand-gray-700 transition-colors col-span-2">Сбросить</button>
                        </div>
                     </div>
                     
                     {/* IMPROVED TIME FORMAT UI */}
                     <div className="pt-4 border-t border-brand-gray-700">
                        <div className="flex items-center gap-3 mb-4 text-brand-text-secondary">
                            <ClockIcon className="w-5 h-5 text-brand-accent"/> <span className="font-medium text-sm">Формат времени</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => { setTimeFormat('12h'); syncSetting('time_format', '12h'); }} 
                                className={`
                                    relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 overflow-hidden
                                    ${timeFormat === '12h' 
                                        // Selected State: Brand Primary BG + White Text (ensured via style)
                                        ? 'border-brand-primary bg-brand-primary shadow-glow scale-[1.02]' 
                                        // Unselected State: Surface BG + Secondary Text
                                        : 'border-brand-gray-700 bg-brand-surface text-brand-text-secondary hover:border-brand-text-primary hover:bg-brand-surface-solid/20'}
                                `}
                                // FORCE TEXT COLOR for Selected State to avoid theme conflicts
                                style={timeFormat === '12h' ? { color: 'var(--brand-text-on-primary)' } : {}}
                            >
                                <span className="text-2xl font-bold">12H</span>
                                <span className="text-xs opacity-80">1:30 PM</span>
                                {timeFormat === '12h' && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>}
                            </button>
                            
                            <button 
                                onClick={() => { setTimeFormat('24h'); syncSetting('time_format', '24h'); }} 
                                className={`
                                    relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 overflow-hidden
                                    ${timeFormat === '24h' 
                                        ? 'border-brand-primary bg-brand-primary shadow-glow scale-[1.02]' 
                                        : 'border-brand-gray-700 bg-brand-surface text-brand-text-secondary hover:border-brand-text-primary hover:bg-brand-surface-solid/20'}
                                `}
                                style={timeFormat === '24h' ? { color: 'var(--brand-text-on-primary)' } : {}}
                            >
                                <span className="text-2xl font-bold">24H</span>
                                <span className="text-xs opacity-80">13:30</span>
                                {timeFormat === '24h' && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>}
                            </button>
                        </div>
                     </div>
                </div>

                {/* DATA & ACCOUNT */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <DatabaseIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="text-xl font-bold">Данные</h3>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-brand-surface hover:bg-brand-gray-700 border border-brand-gray-700 py-2 rounded-xl text-sm font-medium transition-colors"><DownloadIcon className="w-4 h-4"/> Экспорт</button>
                        <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 bg-brand-surface hover:bg-brand-gray-700 border border-brand-gray-700 py-2 rounded-xl text-sm font-medium transition-colors"><UploadIcon className="w-4 h-4"/> Импорт</button>
                    </div>
                     <div className="pt-4 border-t border-brand-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-red-400"><UserIcon className="w-5 h-5"/> <span className="text-sm font-bold">Аккаунт</span></div>
                        <button onClick={onLogout} className="text-xs bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors font-bold">Выйти</button>
                    </div>
                </div>
            </div>

            {/* COMPACT DEVELOPER CARD */}
            <div className="flex justify-center pb-6">
                <a 
                    href="https://github.com/EkhsonK/Tempo-Task-Manager" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 bg-brand-surface/50 hover:bg-brand-surface border border-brand-gray-700/50 rounded-full px-4 py-2 transition-all duration-300 hover:scale-105 group"
                >
                    <GitHubIcon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary transition-colors"/>
                    <span className="text-xs font-bold text-brand-text-secondary group-hover:text-brand-primary">EkhsonK</span>
                    <span className="w-1 h-1 rounded-full bg-brand-gray-700"></span>
                    <span className="text-[10px] text-brand-text-secondary/70 font-medium">v3.0.0</span>
                </a>
            </div>

            <WallpaperGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={(url) => { handleBackgroundChange(url); setIsGalleryOpen(false); }} currentBackground={document.body.style.backgroundImage} />
            <input type="file" ref={importInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            <input type="file" ref={bgUploadRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
        </div>
    );
};

export default Settings;