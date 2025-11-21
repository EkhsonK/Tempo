import React, { useState, useEffect } from 'react';
import ToDoList from './components/ToDoList';
import Chatbot from './components/Chatbot';
import Settings from './components/Settings';
import Me from './components/Me';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { ActiveTab, ToDoItem, Priority, AppBackup, Theme, TimeFormat } from './types';
import { api, setApiUserId } from './services/api';

const App: React.FC = () => {
    // --- 1. INITIALIZATION & STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('tempo_auth_token') || !!localStorage.getItem('tempo_is_guest'));
    const [userId, setUserId] = useState<number | null>(() => { const s = localStorage.getItem('tempo_user_id'); return s ? parseInt(s, 10) : null; });
    const [username, setUsername] = useState<string | null>(() => localStorage.getItem('tempo_username'));
    const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
    const [selectedTaskForChat, setSelectedTaskForChat] = useState<number | null>(() => { const s = localStorage.getItem('selectedTaskForChat'); return s ? JSON.parse(s) : null; });
    const [scrollToTaskId, setScrollToTaskId] = useState<number | null>(null);
    const [todos, setTodos] = useState<ToDoItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => (localStorage.getItem('timeFormat') as TimeFormat) || '12h');
    const [customBackground, setCustomBackground] = useState<string | null>(() => localStorage.getItem('customBackground') || null);

    // --- HANDLERS ---
    const handleUserLogin = (id: number, name: string) => { localStorage.setItem('tempo_auth_token', 'true'); localStorage.setItem('tempo_username', name); localStorage.removeItem('tempo_is_guest'); setUserId(id); setUsername(name); setApiUserId(id); setIsAuthenticated(true); setActiveTab('tasks'); setIsDataLoaded(false); };
    const handleGuestLogin = () => { localStorage.setItem('tempo_is_guest', 'true'); localStorage.removeItem('tempo_auth_token'); localStorage.removeItem('tempo_username'); setUserId(null); setUsername(null); setApiUserId(null); setIsAuthenticated(true); setActiveTab('tasks'); setIsDataLoaded(false); };
    const handleLogout = () => { localStorage.clear(); setIsAuthenticated(false); setUserId(null); setUsername(null); setApiUserId(null); setTodos([]); setCategories([]); setActiveTab('tasks'); setIsDataLoaded(false); };

    // --- EFFECTS ---
    useEffect(() => { setApiUserId(userId); }, [userId]);
    useEffect(() => {
        const loadData = async () => {
            if (userId) {
                try {
                    setApiUserId(userId); await api.initDB(); 
                    const [fetchedTodos, fetchedCategories, userSettings] = await Promise.all([api.getTodos(), api.getCategories(), api.getUserSettings().catch(() => null)]);
                    if (userSettings) {
                        if (userSettings.theme) { setTheme(userSettings.theme); localStorage.setItem('theme', userSettings.theme); }
                        if (userSettings.time_format) { setTimeFormat(userSettings.time_format as TimeFormat); localStorage.setItem('timeFormat', userSettings.time_format); }
                        if (userSettings.background_url !== undefined) { setCustomBackground(userSettings.background_url); if(userSettings.background_url) localStorage.setItem('customBackground', userSettings.background_url); else localStorage.removeItem('customBackground'); }
                    }
                    setTodos(fetchedTodos.map((t: ToDoItem) => ({ ...t, priority: t.priority || Priority.NONE })));
                    setCategories(fetchedCategories.length > 0 ? fetchedCategories : ["Общее", "Работа", "Личное"]);
                } catch (e) { console.warn("Fetch error", e); } finally { setIsDataLoaded(true); }
            } else if (isAuthenticated) {
                setTodos(JSON.parse(localStorage.getItem('guest_todos') || '[]'));
                setCategories(JSON.parse(localStorage.getItem('guest_categories') || '["Общее", "Работа", "Личное"]'));
                setIsDataLoaded(true);
            }
        };
        if (isAuthenticated) loadData();
    }, [isAuthenticated, userId]);

    useEffect(() => { if (userId && isDataLoaded) { const t = setTimeout(() => api.updateUserSettings({ theme, time_format: timeFormat, background_url: customBackground }).catch(console.error), 1000); return () => clearTimeout(t); } }, [theme, timeFormat, customBackground, userId, isDataLoaded]);
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_todos', JSON.stringify(todos)); }, [todos, userId, isAuthenticated]);
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_categories', JSON.stringify(categories)); }, [categories, userId, isAuthenticated]);
    useEffect(() => { localStorage.setItem('selectedTaskForChat', JSON.stringify(selectedTaskForChat)); }, [selectedTaskForChat]);
    
    // [FIXED THEME SWITCHER] Now includes 'mint' in removal list
    useEffect(() => { 
        localStorage.setItem('theme', theme);
        const root = document.documentElement;
        // Removed 'liquid' and 'porcelain'
        root.classList.remove('dark', 'midnight', 'sunset', 'light', 'mint');
        
        if (theme !== 'light') {
            root.classList.add(theme);
        }
    }, [theme]);
    
    useEffect(() => { localStorage.setItem('timeFormat', timeFormat); }, [timeFormat]);

    useEffect(() => {
        const root = document.documentElement;
        if (customBackground) root.style.setProperty('--custom-bg', `${customBackground} center/cover fixed no-repeat`);
        else root.style.removeProperty('--custom-bg');
    }, [customBackground]);

    const handleRestoreBackup = (backup: AppBackup) => { if (!backup.todos) return; setTodos(backup.todos); setCategories(backup.categories); setTheme(backup.theme); localStorage.setItem('taskChatHistories', JSON.stringify(backup.taskChatHistories)); alert("Restored."); };
    const handleLocateTask = (taskId: number) => { setActiveTab('tasks'); setScrollToTaskId(taskId); setTimeout(() => setScrollToTaskId(null), 1000); };

    if (!isAuthenticated) return <Auth onGuestLogin={handleGuestLogin} onUserLogin={handleUserLogin} />;

    const renderContent = () => {
        switch (activeTab) {
            case 'chat': return <Chatbot selectedTaskId={selectedTaskForChat} tasks={todos} />;
            case 'calendar': return <CalendarView todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} isGuest={!userId} />;
            case 'me': return <Me todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} username={username} isGuest={!userId} onLogout={handleLogout} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} timeFormat={timeFormat} setTimeFormat={setTimeFormat} backupData={{ todos, categories, theme }} onRestore={handleRestoreBackup} setCustomBackground={setCustomBackground} categories={categories} setCategories={setCategories} todos={todos} setTodos={setTodos} onLogout={handleLogout} />;
            case 'tasks': default: return <ToDoList todos={todos} setTodos={setTodos} categories={categories} setCategories={setCategories} setActiveTab={setActiveTab} setSelectedTaskForChat={setSelectedTaskForChat} scrollToTaskId={scrollToTaskId} timeFormat={timeFormat} isGuest={!userId} />;
        }
    };
    
    const textClass = customBackground ? 'text-white' : 'text-brand-text-primary';
    // Add overlay if image exists
    const overlayClass = customBackground ? 'bg-black/40' : '';
    const appContainerClass = `min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${overlayClass} ${textClass}`;

    return (
        <div className={appContainerClass}>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col w-full lg:pl-24 h-[100dvh]">
                <main className="flex-grow bg-brand-surface backdrop-blur-md border-none sm:border sm:border-gray-700/20 sm:rounded-xl shadow-lg p-2 sm:p-6 overflow-y-auto mb-16 lg:mb-0 transition-colors duration-300">
                    <div key={activeTab} className="animate-fade-in h-full">{renderContent()}</div>
                </main>
            </div>
        </div>
    );
};

export default App;