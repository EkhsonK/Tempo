import React, { useRef, useState } from 'react';
import { 
    DownloadIcon, UploadIcon, DatabaseIcon, PhotoIcon, 
    ListCheckIcon, PlusIcon, TrashIcon, ClockIcon, 
    UserIcon, GitHubIcon, CheckIcon 
} from './IconComponents';
import { AppBackup, Theme, ToDoItem, TimeFormat } from '../types';
import WallpaperGalleryModal from './WallpaperGalleryModal';
import { api } from '../services/api';

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
);

interface SettingsProps {
    theme: Theme; setTheme: (theme: Theme) => void; 
    timeFormat: TimeFormat; setTimeFormat: (format: TimeFormat) => void;
    backupData: { todos: ToDoItem[], categories: string[], theme: Theme, timeFormat: TimeFormat, customBackground: string | null };
    onRestore: (backup: AppBackup) => void;
    setCustomBackground: (url: string | null) => void; 
    categories: string[]; setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    todos: ToDoItem[]; setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>; 
    onLogout: () => void;
    lastSyncTime?: string;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, timeFormat, setTimeFormat, backupData, onRestore, setCustomBackground, categories, setCategories, todos, setTodos, onLogout, lastSyncTime }) => {
    const importInputRef = useRef<HTMLInputElement>(null);
    const bgUploadRef = useRef<HTMLInputElement>(null);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // === DYNAMIC STYLES FOR REACT COMPONENTS ===
    const getThemeStyles = () => {
        switch (theme) {
            case 'light':
                // Pro Light: Clean Slate/Indigo palette
                return {
                    container: 'text-slate-800',
                    card: 'bg-white border-slate-200 shadow-sm',
                    input: 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500',
                    button: 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200',
                    icon: 'text-indigo-500',
                    subtext: 'text-slate-500',
                    accent: 'bg-indigo-600 text-white hover:bg-indigo-700',
                    itemBg: 'bg-white border-slate-100 hover:bg-slate-50'
                };
            case 'forest':
                // Forest: Deep Emerald palette (Matches Android)
                return {
                    container: 'text-emerald-50',
                    card: 'bg-[#022C22] border-[#065F46] shadow-lg',
                    input: 'bg-[#064E3B] border-[#065F46] text-emerald-100 placeholder-emerald-700 focus:border-emerald-500',
                    button: 'bg-[#064E3B] text-emerald-300 hover:bg-[#065F46] border-[#065F46]',
                    icon: 'text-emerald-400',
                    subtext: 'text-emerald-400/60',
                    accent: 'bg-emerald-600 text-white hover:bg-emerald-500',
                    itemBg: 'bg-[#064E3B]/50 border-[#065F46] hover:bg-[#064E3B]'
                };
            case 'midnight':
                return {
                    container: 'text-indigo-50',
                    card: 'bg-[#0f172a] border-[#1e293b] shadow-lg',
                    input: 'bg-[#020617] border-[#1e293b] text-indigo-100 placeholder-indigo-700 focus:border-indigo-500',
                    button: 'bg-[#1e293b] text-indigo-300 hover:bg-[#334155] border-[#1e293b]',
                    icon: 'text-indigo-400',
                    subtext: 'text-indigo-400/60',
                    accent: 'bg-indigo-600 text-white hover:bg-indigo-500',
                    itemBg: 'bg-[#1e293b] border-[#334155]'
                };
            case 'neon':
                return {
                    container: 'text-lime-50',
                    card: 'bg-black border-lime-900/50 shadow-[0_0_15px_rgba(132,204,22,0.1)]',
                    input: 'bg-[#111] border-lime-900/50 text-lime-400 placeholder-lime-900 focus:border-lime-500',
                    button: 'bg-[#111] text-lime-600 hover:text-lime-400 border-lime-900/30',
                    icon: 'text-lime-400',
                    subtext: 'text-lime-700',
                    accent: 'bg-lime-500 text-black hover:bg-lime-400',
                    itemBg: 'bg-[#111] border-lime-900/30'
                };
            case 'dark':
            default:
                return {
                    container: 'text-white',
                    card: 'bg-[#1E1E1E] border-white/5 shadow-lg',
                    input: 'bg-[#2C2C2C] border-white/10 text-white placeholder-gray-500 focus:border-blue-500',
                    button: 'bg-[#2C2C2C] text-gray-400 hover:bg-white/5 hover:text-white border-white/5',
                    icon: 'text-blue-500',
                    subtext: 'text-gray-400',
                    accent: 'bg-blue-600 text-white hover:bg-blue-500',
                    itemBg: 'bg-[#2C2C2C] border-white/5'
                };
        }
    };

    const styles = getThemeStyles();

    const syncSetting = async (key: string, value: string | null) => { try { await api.updateUserSettings({ [key]: value }); } catch (e) { console.error(`Sync error ${key}`, e); } };
    const handleThemeChange = (t: Theme) => { setTheme(t); syncSetting('theme', t); };
    const handleBackgroundChange = (url: string | null) => { setCustomBackground(url); syncSetting('background_url', url); };
    
    const handleAddCategory = async () => { 
        const trimmed = newCategoryName.trim();
        if (trimmed && !categories.includes(trimmed)) { 
            setCategories(p => [...p, trimmed]); 
            setNewCategoryName(''); 
            try { await api.addCategory(trimmed); } catch(e){ console.error(e); } 
        } 
    };

    const executeDeleteCategory = async (cat: string) => { 
        setCategories(p => p.filter(c => c !== cat)); 
        setConfirmingDelete(null); 
        try { await api.deleteCategory(cat); } catch(e){} 
    };
    
    const handleExport = () => {
        const link = document.createElement("a");
        // Ensure histories are included in export
        const exportObj = { 
            ...backupData, 
            taskChatHistories: JSON.parse(localStorage.getItem('taskChatHistories') || '{}') 
        };
        link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj, null, 2))}`;
        link.download = `tempo-backup-${new Date().toISOString().slice(0,10)}.json`;
        link.click();
    };

    const handleImportClick = () => importInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; if (!file) return;
        if (!window.confirm("Импорт перезапишет данные. Продолжить?")) return;
        const r = new FileReader(); 
        r.onload = (ev) => { 
            try { onRestore(JSON.parse(ev.target?.result as string)); } 
            catch(e){ alert('Ошибка файла'); } 
        }; 
        r.readAsText(file); 
        e.target.value='';
    };
    
    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0]; if(!file) return;
         try { const data = await api.uploadFile(file); handleBackgroundChange(`url(${data.url})`); } catch(e){ alert("Ошибка загрузки"); } e.target.value = '';
    };

    // Theme Previews for UI
    const themePreviews: Record<string, { bg: string, header: string, accent: string, label: string }> = {
        light: { bg: 'bg-slate-100', header: 'bg-white', accent: 'bg-indigo-500', label: 'Pro Light' },
        dark: { bg: 'bg-[#121212]', header: 'bg-[#1E1E1E]', accent: 'bg-blue-600', label: 'Deep Dark' },
        midnight: { bg: 'bg-[#020617]', header: 'bg-[#0f172a]', accent: 'bg-indigo-500', label: 'Midnight' },
        forest: { bg: 'bg-[#022C22]', header: 'bg-[#064E3B]', accent: 'bg-emerald-500', label: 'Forest' },
        neon: { bg: 'bg-black', header: 'bg-[#111]', accent: 'bg-lime-500', label: 'Neon' },
    };
    
    // REMOVED 'sunset', ADDED 'forest'
    const allThemes: Theme[] = ['light', 'dark', 'midnight', 'forest', 'neon'];

    return (
        <div className={`max-w-5xl mx-auto pb-32 space-y-5 animate-fade-in px-4 pt-6 ${styles.container}`}>
            
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Настройки</h1>
                {lastSyncTime && (
                    <div className="text-right">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.subtext}`}>Синхронизация</p>
                        <p className={`text-xs font-mono opacity-80`}>{lastSyncTime}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end mb-2">
                 <button onClick={() => { handleThemeChange('dark'); handleBackgroundChange(null); }} className="text-xs text-red-400 bg-red-500/10 px-4 py-2 rounded-xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">Сброс темы</button>
            </div>

            {/* THEME SELECTOR */}
            <div className={`border p-6 rounded-3xl ${styles.card}`}>
                <div className="flex items-center gap-2 mb-5"><PaintBrushIcon className={`w-5 h-5 ${styles.icon}`} /><h3 className="font-bold text-lg">Оформление</h3></div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {allThemes.map(t => {
                        const preview = themePreviews[t] || themePreviews.dark;
                        const isActive = theme === t;
                        return (
                            <button 
                                key={t} 
                                onClick={() => handleThemeChange(t)} 
                                className={`group relative w-full aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? `ring-2 ${styles.icon} scale-[1.02] shadow-xl` : 'ring-1 ring-white/10 hover:scale-[1.01]'}`}
                            >
                                {/* Preview Construction */}
                                <div className={`absolute inset-0 flex flex-col ${preview.bg}`}>
                                    <div className={`h-1/3 w-full ${preview.header} flex items-center px-3 gap-2`}>
                                        <div className={`w-6 h-1.5 rounded-full ${isActive ? 'bg-current opacity-100' : 'bg-current opacity-50'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ml-auto ${preview.accent}`}></div>
                                    </div>
                                    <div className="flex-1 p-3 space-y-2">
                                        <div className="w-3/4 h-1.5 rounded-full bg-current opacity-20"></div>
                                        <div className="w-1/2 h-1.5 rounded-full bg-current opacity-10"></div>
                                    </div>
                                </div>
                                {/* Label Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-2 px-3 flex justify-between items-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${t === 'neon' ? 'text-lime-400' : 'text-white'}`}>{preview.label}</span>
                                    {isActive && <CheckIcon className="w-3.5 h-3.5 text-white"/>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className={`mt-6 border-t pt-5 flex justify-between items-center ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                    <div className={`flex items-center gap-2 ${styles.subtext}`}><ClockIcon className="w-4 h-4"/> <span className="text-xs font-bold uppercase">Формат времени</span></div>
                    <div className={`flex rounded-xl p-1 border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                        <button onClick={() => { setTimeFormat('12h'); syncSetting('time_format', '12h'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${timeFormat === '12h' ? styles.accent : `${styles.subtext} hover:text-current`}`}>12h</button>
                        <button onClick={() => { setTimeFormat('24h'); syncSetting('time_format', '24h'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${timeFormat === '24h' ? styles.accent : `${styles.subtext} hover:text-current`}`}>24h</button>
                    </div>
                </div>
            </div>

            {/* CATEGORIES */}
            <div className={`border p-6 rounded-3xl ${styles.card}`}>
                <div className="flex items-center gap-2 mb-5"><ListCheckIcon className={`w-5 h-5 ${styles.icon}`} /><h3 className="font-bold text-lg">Категории</h3></div>
                
                <div className="flex flex-wrap gap-2.5 mb-6">
                    {categories.map(cat => {
                        const count = todos.filter(t => t.category === cat).length;
                        const isDeleting = confirmingDelete === cat;
                        
                        return (
                            <div key={cat} className={`flex items-center gap-2 pl-4 pr-2 py-2 rounded-2xl border transition-all ${isDeleting ? 'border-red-500/50 bg-red-500/10' : `${styles.itemBg}`}`}>
                                <span className={`text-sm font-medium ${isDeleting ? 'text-red-400' : ''}`}>{cat}</span>
                                {!isDeleting && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-gray-400'}`}>{count}</span>}
                                
                                {cat !== 'Общее' && (
                                    <button 
                                        onClick={() => isDeleting ? executeDeleteCategory(cat) : setConfirmingDelete(cat)}
                                        className={`p-1.5 rounded-lg transition-colors ${isDeleting ? 'bg-red-500 text-white animate-pulse' : `${styles.subtext} hover:text-red-400`}`}
                                    >
                                        {isDeleting ? <span className="text-xs font-bold px-1">Подтвердить</span> : <TrashIcon className="w-4 h-4"/>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3">
                    <label className={`text-xs font-bold uppercase ml-1 ${styles.subtext}`}>Добавить новую</label>
                    
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Название..."
                            className={`flex-grow border rounded-2xl px-5 py-3 text-base outline-none transition-all shadow-sm ${styles.input}`}
                        />
                        <button 
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className={`
                                px-5 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95
                                ${newCategoryName.trim() ? styles.accent : `${styles.itemBg} opacity-50 cursor-not-allowed`}
                            `}
                        >
                            <PlusIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* ACTIONS GRID */}
            <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setIsGalleryOpen(true)} className={`border p-5 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform group ${styles.card} hover:opacity-90`}>
                    <div className="p-3 bg-purple-500/10 rounded-2xl"><PhotoIcon className="w-6 h-6 text-purple-400"/></div>
                    <span className={`text-xs font-bold ${styles.subtext} group-hover:text-current`}>Обои</span>
                </button>
                <button onClick={handleExport} className={`border p-5 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform group ${styles.card} hover:opacity-90`}>
                    <div className="p-3 bg-blue-500/10 rounded-2xl"><DownloadIcon className="w-6 h-6 text-blue-400"/></div>
                    <span className={`text-xs font-bold ${styles.subtext} group-hover:text-current`}>Экспорт</span>
                </button>
                <button onClick={handleImportClick} className={`border p-5 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform group ${styles.card} hover:opacity-90`}>
                    <div className="p-3 bg-green-500/10 rounded-2xl"><UploadIcon className="w-6 h-6 text-green-400"/></div>
                    <span className={`text-xs font-bold ${styles.subtext} group-hover:text-current`}>Импорт</span>
                </button>
            </div>

            {/* DATA & LOGOUT */}
            <div className={`border p-5 rounded-3xl flex justify-between items-center ${styles.card}`}>
                <div className="flex items-center gap-3 text-red-400">
                    <div className="p-2 bg-red-500/10 rounded-xl"><UserIcon className="w-5 h-5"/></div>
                    <span className="text-sm font-bold">Управление аккаунтом</span>
                </div>
                <button onClick={onLogout} className="text-xs bg-red-500/10 text-red-400 px-5 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors font-bold">Выйти</button>
            </div>

            {/* DEVELOPER FOOTER */}
            <div className={`text-center pt-8 pb-4 opacity-40 ${styles.subtext}`}>
                <a href="https://github.com/EkhsonK/Tempo-Task-Manager" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-current transition-colors">
                    <GitHubIcon className="w-4 h-4"/> <span className="text-xs font-bold">Tempo v3.0.0</span>
                </a>
            </div>

            <WallpaperGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={(url) => { handleBackgroundChange(url); setIsGalleryOpen(false); }} currentBackground={document.body.style.backgroundImage} />
            <input type="file" ref={importInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            <input type="file" ref={bgUploadRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
        </div>
    );
};

export default Settings;