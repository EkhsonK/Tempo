import React, { useState, useEffect } from 'react';
import ToDoList from './components/ToDoList';
import Chatbot from './components/Chatbot';
import Settings from './components/Settings';
import Me from './components/Me';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { ActiveTab, ToDoItem, Priority, AppBackup, Theme, TimeFormat } from './types';
import { api, setApiUserId } from '../services/api';

const App: React.FC = () => {
    // --- 1. INITIALIZATION & STATE ---
    
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('tempo_auth_token') || !!localStorage.getItem('tempo_is_guest');
    });

    const [userId, setUserId] = useState<number | null>(() => {
        const stored = localStorage.getItem('tempo_user_id');
        return stored ? parseInt(stored, 10) : null;
    });

    const [username, setUsername] = useState<string | null>(() => {
        return localStorage.getItem('tempo_username');
    });

    const [activeTab, setActiveTab] = useState<ActiveTab>('tasks');
    const [selectedTaskForChat, setSelectedTaskForChat] = useState<number | null>(() => {
        const saved = localStorage.getItem('selectedTaskForChat');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [scrollToTaskId, setScrollToTaskId] = useState<number | null>(null);
    const [todos, setTodos] = useState<ToDoItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const [theme, setTheme] = useState<Theme>(() => 
        (localStorage.getItem('theme') as Theme) || 'dark'
    );

    const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => 
        (localStorage.getItem('timeFormat') as TimeFormat) || '12h'
    );
    
    const [customBackground, setCustomBackground] = useState<string | null>(() => 
        localStorage.getItem('customBackground') || null
    );

    // --- HANDLERS ---

    const handleUserLogin = (id: number, name: string) => {
        localStorage.setItem('tempo_auth_token', 'true');
        localStorage.setItem('tempo_username', name);
        localStorage.removeItem('tempo_is_guest');
        setUserId(id); setUsername(name); setApiUserId(id); 
        setIsAuthenticated(true); setActiveTab('tasks'); setIsDataLoaded(false); 
    };

    const handleGuestLogin = () => {
        localStorage.setItem('tempo_is_guest', 'true');
        localStorage.removeItem('tempo_auth_token');
        localStorage.removeItem('tempo_username');
        setUserId(null); setUsername(null); setApiUserId(null);
        setIsAuthenticated(true); setActiveTab('tasks'); setIsDataLoaded(false);
    };
    
    const handleLogout = () => {
        localStorage.clear(); // Clear everything on logout for safety
        setIsAuthenticated(false); setUserId(null); setUsername(null); setApiUserId(null);
        setTodos([]); setCategories([]); setActiveTab('tasks'); setIsDataLoaded(false); 
    };

    // --- EFFECTS ---

    useEffect(() => { setApiUserId(userId); }, [userId]);

    // Data Loading
    useEffect(() => {
        const loadData = async () => {
            if (userId) {
                try {
                    setApiUserId(userId);
                    await api.initDB(); 
                    const [fetchedTodos, fetchedCategories, userSettings] = await Promise.all([
                        api.getTodos(),
                        api.getCategories(),
                        api.getUserSettings().catch(() => null)
                    ]);
                    
                    if (userSettings) {
                        if (userSettings.theme) { setTheme(userSettings.theme); localStorage.setItem('theme', userSettings.theme); }
                        if (userSettings.time_format) { setTimeFormat(userSettings.time_format as TimeFormat); localStorage.setItem('timeFormat', userSettings.time_format); }
                        if (userSettings.background_url !== undefined) { setCustomBackground(userSettings.background_url); if(userSettings.background_url) localStorage.setItem('customBackground', userSettings.background_url); else localStorage.removeItem('customBackground'); }
                    }

                    const sanitizedTodos = fetchedTodos.map((todo: ToDoItem) => ({ ...todo, priority: todo.priority || Priority.NONE }));
                    setTodos(sanitizedTodos);
                    setCategories(fetchedCategories.length > 0 ? fetchedCategories : ["Общее", "Работа", "Личное"]);
                } catch (e) { console.warn("Failed to fetch user data.", e); } finally { setIsDataLoaded(true); }
            } else if (isAuthenticated) {
                const savedTodos = localStorage.getItem('guest_todos');
                const savedCats = localStorage.getItem('guest_categories');
                setTodos(savedTodos ? JSON.parse(savedTodos) : []);
                setCategories(savedCats ? JSON.parse(savedCats) : ["Общее", "Работа", "Личное"]);
                setIsDataLoaded(true);
            }
        };
        if (isAuthenticated) loadData();
    }, [isAuthenticated, userId]);

    // Auto-Save Settings
    useEffect(() => {
        if (userId && isDataLoaded) {
            const timeoutId = setTimeout(() => {
                api.updateUserSettings({ theme, time_format: timeFormat, background_url: customBackground }).catch(console.error);
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [theme, timeFormat, customBackground, userId, isDataLoaded]);

    // Guest Data Saving
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_todos', JSON.stringify(todos)); }, [todos, userId, isAuthenticated]);
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_categories', JSON.stringify(categories)); }, [categories, userId, isAuthenticated]);
    useEffect(() => { localStorage.setItem('selectedTaskForChat', JSON.stringify(selectedTaskForChat)); }, [selectedTaskForChat]);
    
    // [CRITICAL FIX] Theme Application - Removes ALL known themes to prevent stuck classes
    useEffect(() => { 
        localStorage.setItem('theme', theme);
        
        // 1. Get the HTML element
        const root = document.documentElement;
        
        // 2. Remove ALL potential theme classes explicitly
        root.classList.remove('light', 'dark', 'midnight', 'sunset', 'liquid');
        
        // 3. Add the selected theme
        root.classList.add(theme);
        
        // 4. Force a repaint if necessary (hack for some browsers, usually not needed but safe)
        // window.dispatchEvent(new Event('resize')); 
    }, [theme]);
    
    useEffect(() => { localStorage.setItem('timeFormat', timeFormat); }, [timeFormat]);

    useEffect(() => {
        if (customBackground) {
            document.body.style.backgroundImage = customBackground;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            document.body.style.backgroundImage = ''; 
        }
    }, [customBackground]);

    const handleRestoreBackup = (backup: AppBackup) => {
        if (!backup.todos) { alert("Invalid backup."); return; }
        setTodos(backup.todos); setCategories(backup.categories); setTheme(backup.theme);
        localStorage.setItem('taskChatHistories', JSON.stringify(backup.taskChatHistories));
        alert("Restore successful.");
    };

    const handleLocateTask = (taskId: number) => { setActiveTab('tasks'); setScrollToTaskId(taskId); setTimeout(() => setScrollToTaskId(null), 1000); };

    if (!isAuthenticated) return <Auth onGuestLogin={handleGuestLogin} onUserLogin={handleUserLogin} />;

    const renderContent = () => {
        switch (activeTab) {
            case 'chat': return <Chatbot selectedTaskId={selectedTaskForChat} tasks={todos} />;
            case 'calendar': return <CalendarView todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} />;
            case 'me': return <Me todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} username={username} isGuest={!userId} onLogout={handleLogout} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} timeFormat={timeFormat} setTimeFormat={setTimeFormat} backupData={{ todos, categories, theme }} onRestore={handleRestoreBackup} setCustomBackground={setCustomBackground} categories={categories} setCategories={setCategories} todos={todos} setTodos={setTodos} onLogout={handleLogout} />;
            case 'tasks': default: return <ToDoList todos={todos} setTodos={setTodos} categories={categories} setCategories={setCategories} setActiveTab={setActiveTab} setSelectedTaskForChat={setSelectedTaskForChat} scrollToTaskId={scrollToTaskId} timeFormat={timeFormat} isGuest={!userId} />;
        }
    };
    
    const textClass = customBackground ? 'text-white' : 'text-brand-text-primary';
    const appContainerClass = `min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${customBackground ? 'bg-black/60' : 'bg-brand-background'} ${textClass}`;

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