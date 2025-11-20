import React, { useRef, useState } from 'react';
import { DownloadIcon, UploadIcon, DatabaseIcon, PhotoIcon, ListCheckIcon, PlusIcon, TrashIcon, ClockIcon, UserIcon, GitHubIcon } from './IconComponents';
import { AppBackup, Theme, ToDoItem, TimeFormat } from '../types';
import WallpaperGalleryModal from './WallpaperGalleryModal';
import { api } from '../services/api';

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    timeFormat: TimeFormat;
    setTimeFormat: (format: TimeFormat) => void;
    backupData: Omit<AppBackup, 'taskChatHistories'>;
    onRestore: (backup: AppBackup) => void;
    setCustomBackground: (url: string | null) => void;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    todos: ToDoItem[];
    setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, timeFormat, setTimeFormat, backupData, onRestore, setCustomBackground, categories, setCategories, todos, setTodos, onLogout }) => {
    const importInputRef = useRef<HTMLInputElement>(null);
    const bgUploadRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // --- Helper to sync settings immediately to backend ---
    const syncSetting = async (key: string, value: string | null) => {
        try {
            await api.updateUserSettings({ [key]: value });
        } catch (e) {
            console.error(`Failed to sync setting ${key}`, e);
        }
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        syncSetting('theme', newTheme);
    };

    const handleTimeFormatChange = (newFormat: TimeFormat) => {
        setTimeFormat(newFormat);
        syncSetting('time_format', newFormat);
    };

    const handleBackgroundChange = (url: string | null) => {
        setCustomBackground(url);
        syncSetting('background_url', url);
    };
    // -------------------------------------------

    const handleExport = () => {
        try {
            const taskChatHistories = JSON.parse(localStorage.getItem('taskChatHistories') || '{}');
            const data: AppBackup = {
                ...backupData,
                taskChatHistories
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `tempo-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Не удалось экспортировать данные.");
        }
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Вы уверены, что хотите импортировать этот файл? Это перезапишет все текущие задачи, категории и настройки.")) {
            event.target.value = ''; 
            return;
        }

        setIsRestoring(true);

        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File is not valid text.");
                    const parsedData = JSON.parse(text) as AppBackup;
                    onRestore(parsedData);
                    
                    // Also sync restored settings to backend immediately
                    if (parsedData.theme) syncSetting('theme', parsedData.theme);
                    
                    setIsRestoring(false); 
                } catch (error) {
                    console.error("Failed to import file:", error);
                    alert("Ошибка чтения файла. Убедитесь, что это валидный JSON файл.");
                    setIsRestoring(false);
                }
            };
            reader.onerror = () => {
                alert("Ошибка чтения файла.");
                setIsRestoring(false);
            }
            reader.readAsText(file);
            event.target.value = ''; 
        }, 100);
    };

    // Upload background to server via /api/upload
    const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload to backend to get a persistent URL
            const response = await fetch('http://127.0.0.1:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            
            const bgUrl = `url(${data.url})`;
            handleBackgroundChange(bgUrl);
            
        } catch (error) {
            console.error("Background upload failed", error);
            // Fallback to local reading if backend fails
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) {
                     handleBackgroundChange(`url(${e.target.result as string})`);
                }
            };
            reader.readAsDataURL(file);
        }
        
        // Reset input
        event.target.value = '';
    };

    const handleAddCategory = async () => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory && !categories.includes(trimmedCategory)) {
            setCategories(prev => [...prev, trimmedCategory]);
            setNewCategory('');
            try {
                await api.addCategory(trimmedCategory);
            } catch (e) { console.error("API Error"); }
        }
    };

    const executeDeleteCategory = async (categoryToDelete: string) => {
         const updatedTodos = todos.filter(todo => todo.category !== categoryToDelete);
         setTodos(updatedTodos);
         setCategories(prev => prev.filter(c => c !== categoryToDelete));
         setConfirmingDelete(null);
         try {
            await api.deleteCategory(categoryToDelete);
         } catch (e) { console.error("API Error"); }
    };

    return (
        <div className="max-w-4xl mx-auto relative pb-10">
            {isRestoring && (
                <div className="fixed inset-0 z-[60] bg-brand-background/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent mb-4"></div>
                    <h2 className="text-2xl font-bold text-brand-text-primary animate-pulse">Восстановление...</h2>
                    <p className="text-brand-text-secondary mt-2">Пожалуйста, подождите...</p>
                </div>
            )}

            <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Настройки</h2>
            <div className="space-y-8">
                 {/* Categories Section */}
                 <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <ListCheckIcon className="w-8 h-8 text-brand-accent" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Управление категориями</h3>
                    </div>
                    <p className="text-brand-text-secondary mb-4">Добавляйте или удаляйте категории задач. Удаление категории приведет к удалению всех задач в ней.</p>
                    
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar bg-brand-surface-solid/20 rounded-xl p-2">
                        {categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-brand-surface p-3 rounded-lg transition-all border border-transparent hover:border-brand-gray-700">
                                {confirmingDelete === cat ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm text-red-400 font-medium">Удалить задачи в "{cat}"?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => executeDeleteCategory(cat)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors">Да</button>
                                            <button onClick={() => setConfirmingDelete(null)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded-lg transition-colors">Отмена</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-brand-text-primary">{cat}</span>
                                        {cat !== 'Общее' && cat !== 'General' && (
                                            <button onClick={() => setConfirmingDelete(cat)} className="text-brand-text-secondary hover:text-red-500 p-1 rounded transition-colors">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Название новой категории..."
                            className="flex-grow bg-brand-surface-solid/50 border border-brand-gray-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm text-brand-text-primary placeholder-brand-text-secondary"
                        />
                        <button onClick={handleAddCategory} disabled={!newCategory.trim()} className="bg-brand-primary text-white p-3 rounded-xl transition-transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            <PlusIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>

                 {/* Appearance Section */}
                <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg">
                     <div className="flex items-center gap-4 mb-4">
                        <PaintBrushIcon className="w-8 h-8 text-brand-accent" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Внешний вид</h3>
                    </div>
                    <p className="text-brand-text-secondary mb-6">Выберите тему оформления.</p>
                    <div className="flex flex-wrap gap-4">
                        {[
                            {id: 'light', name: 'Светлая'}, 
                            {id: 'dark', name: 'Темная'}, 
                            {id: 'midnight', name: 'Полночь'}, 
                            {id: 'forest', name: 'Лес'}
                        ].map((t) => (
                             <button 
                                key={t.id}
                                onClick={() => handleThemeChange(t.id as Theme)}
                                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Format Section */}
                <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <ClockIcon className="w-8 h-8 text-brand-accent" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Формат времени</h3>
                    </div>
                    <p className="text-brand-text-secondary mb-4">Выберите формат отображения времени.</p>
                    <div className="flex gap-4 bg-brand-surface-solid/30 p-1 rounded-xl w-fit">
                        <button 
                            onClick={() => handleTimeFormatChange('12h')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${timeFormat === '12h' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                        >
                            12 Ч
                        </button>
                        <button 
                            onClick={() => handleTimeFormatChange('24h')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${timeFormat === '24h' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                        >
                            24 Ч
                        </button>
                    </div>
                </div>

                {/* Custom Background Section */}
                <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg">
                     <div className="flex items-center gap-4 mb-4">
                        <PhotoIcon className="w-8 h-8 text-brand-accent" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Обои</h3>
                    </div>
                    <p className="text-brand-text-secondary mb-4">Персонализируйте рабочее пространство с помощью фона.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setIsGalleryOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:scale-[1.02]">
                            <PhotoIcon className="w-5 h-5" />
                            Галерея
                        </button>
                         <button onClick={() => bgUploadRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold transition-colors bg-brand-surface-solid/50 hover:bg-brand-surface-solid border border-brand-gray-700/50 text-brand-text-primary">
                            <UploadIcon className="w-5 h-5" />
                            Загрузить
                        </button>
                        <button onClick={() => handleBackgroundChange(null)} className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold transition-colors bg-brand-surface-solid/50 hover:bg-brand-surface-solid border border-brand-gray-700/50 text-brand-text-primary">
                            Сбросить
                        </button>
                        <input type="file" ref={bgUploadRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*"/>
                    </div>
                </div>

                {/* Local Data Backup & Restore Section */}
                <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <DatabaseIcon className="w-8 h-8 text-brand-accent" />
                        <h3 className="text-xl font-bold text-brand-text-primary">Резервное копирование</h3>
                    </div>
                    <p className="text-brand-text-secondary mb-4">
                        Сохраните все свои задачи и настройки в локальный файл .json.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleExport} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-brand-surface-solid/50 hover:bg-brand-surface-solid border border-brand-gray-700/50 text-brand-text-primary">
                            <DownloadIcon className="w-5 h-5" />
                            Экспорт
                        </button>
                        <button onClick={handleImportClick} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors bg-brand-surface-solid/50 hover:bg-brand-surface-solid border border-brand-gray-700/50 text-brand-text-primary">
                            <UploadIcon className="w-5 h-5" />
                            Импорт
                        </button>
                        <input
                            type="file"
                            ref={importInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                    </div>
                </div>

                {/* Account Logout */}
                <div className="bg-brand-surface p-6 rounded-2xl backdrop-blur-md border border-brand-gray-700/30 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <UserIcon className="w-8 h-8 text-red-500" />
                        <div>
                            <h3 className="text-xl font-bold text-brand-text-primary">Аккаунт</h3>
                            <p className="text-brand-text-secondary">Выйти из текущей сессии</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold transition-colors"
                    >
                        Выйти
                    </button>
                </div>

                {/* About Developer Card */}
                <div className="card-fast-octopus p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <h3 className="text-2xl font-bold text-brand-text-primary">Tempo Task Manager</h3>
                    <p className="text-brand-text-secondary">Создано с <span className="text-red-500 animate-pulse">♥</span> от</p>
                    
                    {/* GitHub Link Section */}
                    <a 
                        href="https://github.com/EkhsonK/Tempo-Task-Manager" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <h4 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent hover:brightness-125 transition-all">
                            EkhsonK
                        </h4>
                        <GitHubIcon className="w-6 h-6 text-brand-text-secondary group-hover:text-white transition-colors" />
                    </a>
                    
                    <p className="text-sm text-gray-500">v2.9.0 &bull; Powered by Gemini AI</p>
                </div>
            </div>

            <WallpaperGalleryModal 
                isOpen={isGalleryOpen} 
                onClose={() => setIsGalleryOpen(false)} 
                onSelect={(url) => { handleBackgroundChange(url); setIsGalleryOpen(false); }} 
                currentBackground={document.body.style.backgroundImage}
            />
        </div>
    );
};

export default Settings;