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
    
    // Check authentication status from storage immediately
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('tempo_auth_token') || !!localStorage.getItem('tempo_is_guest');
    });

    // Check userId from storage immediately
    const [userId, setUserId] = useState<number | null>(() => {
        const stored = localStorage.getItem('tempo_user_id');
        return stored ? parseInt(stored, 10) : null;
    });

    // Check username from storage immediately
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

    // [CRITICAL] Track if initial data load is complete to prevent overwriting server settings with defaults
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
        
        setUserId(id);
        setUsername(name);
        setApiUserId(id); 
        setIsAuthenticated(true);
        setActiveTab('tasks');
        
        // Reset data loaded state to trigger a fresh fetch
        setIsDataLoaded(false); 
    };

    const handleGuestLogin = () => {
        localStorage.setItem('tempo_is_guest', 'true');
        localStorage.removeItem('tempo_auth_token');
        localStorage.removeItem('tempo_username');

        setUserId(null);
        setUsername(null);
        setApiUserId(null);
        setIsAuthenticated(true);
        setActiveTab('tasks');
        
        // Guest mode doesn't fetch from server, so we consider data "loaded" immediately after reading LS
        setIsDataLoaded(false);
    };
    
    const handleLogout = () => {
        localStorage.removeItem('tempo_auth_token');
        localStorage.removeItem('tempo_username');
        localStorage.removeItem('tempo_is_guest');
        localStorage.removeItem('tempo_user_id');

        setIsAuthenticated(false);
        setUserId(null);
        setUsername(null);
        setApiUserId(null);
        setTodos([]);
        setCategories([]);
        setActiveTab('tasks');
        setIsDataLoaded(false); 
    };

    // --- EFFECTS ---

    // Sync API user ID
    useEffect(() => {
        setApiUserId(userId);
    }, [userId]);

    // [MODIFIED] Data Loading Effect (Fetches Todos + Settings)
    useEffect(() => {
        const loadData = async () => {
            if (userId) {
                // User Mode: Fetch from Backend
                try {
                    setApiUserId(userId);
                    await api.initDB(); 
                    
                    // Fetch Todos, Categories AND User Settings in parallel
                    const [fetchedTodos, fetchedCategories, userSettings] = await Promise.all([
                        api.getTodos(),
                        api.getCategories(),
                        api.getUserSettings().catch(() => null) // Handle potential error gracefully
                    ]);
                    
                    // Apply Settings from Server
                    if (userSettings) {
                        if (userSettings.theme) {
                            setTheme(userSettings.theme);
                            localStorage.setItem('theme', userSettings.theme);
                        }
                        if (userSettings.time_format) {
                            setTimeFormat(userSettings.time_format as TimeFormat);
                            localStorage.setItem('timeFormat', userSettings.time_format);
                        }
                        // Handles null, string, gallery URL, or uploaded file URL
                        if (userSettings.background_url !== undefined) {
                            setCustomBackground(userSettings.background_url);
                             if(userSettings.background_url) localStorage.setItem('customBackground', userSettings.background_url);
                             else localStorage.removeItem('customBackground');
                        }
                    }

                    const sanitizedTodos = fetchedTodos.map((todo: ToDoItem) => ({
                        ...todo,
                        priority: todo.priority || Priority.NONE
                    }));

                    setTodos(sanitizedTodos);
                    setCategories(fetchedCategories.length > 0 ? fetchedCategories : ["Общее", "Работа", "Личное"]);
                } catch (e) {
                    console.warn("Failed to fetch user data from backend.", e);
                } finally {
                    setIsDataLoaded(true); // [IMPORTANT] Mark load as complete
                }
            } else if (isAuthenticated) {
                // Guest Mode: Fetch from LocalStorage
                const savedTodos = localStorage.getItem('guest_todos');
                const savedCats = localStorage.getItem('guest_categories');
                
                if (savedTodos) setTodos(JSON.parse(savedTodos));
                else setTodos([]);

                if (savedCats) setCategories(JSON.parse(savedCats));
                else setCategories(["Общее", "Работа", "Личное"]);
                
                setIsDataLoaded(true);
            }
        };

        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, userId]);

    // [NEW] Auto-Save Settings: Sync to backend whenever they change locally
    // Only runs if we are logged in (userId exists) and initial data load is done.
    useEffect(() => {
        if (userId && isDataLoaded) {
            const timeoutId = setTimeout(() => {
                api.updateUserSettings({
                    theme: theme,
                    time_format: timeFormat,
                    background_url: customBackground
                }).catch(err => console.error("Failed to save settings", err));
            }, 1000); // Debounce to avoid spamming API while dragging or rapid clicking
            return () => clearTimeout(timeoutId);
        }
    }, [theme, timeFormat, customBackground, userId, isDataLoaded]);


    // Guest Data Saving (Only when guest)
    useEffect(() => {
        if (!userId && isAuthenticated) {
            localStorage.setItem('guest_todos', JSON.stringify(todos));
        }
    }, [todos, userId, isAuthenticated]);

    useEffect(() => {
        if (!userId && isAuthenticated) {
            localStorage.setItem('guest_categories', JSON.stringify(categories));
        }
    }, [categories, userId, isAuthenticated]);
    
    // Common LocalStorage settings (Theme, etc) - Still useful for caching
    useEffect(() => { localStorage.setItem('selectedTaskForChat', JSON.stringify(selectedTaskForChat)); }, [selectedTaskForChat]);
    
    // Apply Theme to DOM
    useEffect(() => { 
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('dark', 'light', 'midnight', 'forest');
        document.documentElement.classList.add(theme);
    }, [theme]);
    
    // Apply Time Format to Storage
    useEffect(() => {
        localStorage.setItem('timeFormat', timeFormat);
    }, [timeFormat]);

    // Apply Background to DOM
    useEffect(() => {
        if (customBackground) {
            localStorage.setItem('customBackground', customBackground);
            document.body.style.backgroundImage = customBackground;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            localStorage.removeItem('customBackground');
            document.body.style.backgroundImage = ''; 
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundAttachment = '';
        }
    }, [customBackground]);


    const handleRestoreBackup = (backup: AppBackup) => {
        if (!backup.todos || !backup.categories || !backup.theme || !backup.taskChatHistories) {
            alert("Файл резервной копии поврежден или недействителен.");
            return;
        }
        setTodos(backup.todos);
        setCategories(backup.categories);
        setTheme(backup.theme);
        localStorage.setItem('taskChatHistories', JSON.stringify(backup.taskChatHistories));
        alert("Данные успешно импортированы в локальное состояние.");
    };

    const handleLocateTask = (taskId: number) => {
        setActiveTab('tasks');
        setScrollToTaskId(taskId);
        setTimeout(() => setScrollToTaskId(null), 1000);
    };

    if (!isAuthenticated) {
        return <Auth onGuestLogin={handleGuestLogin} onUserLogin={handleUserLogin} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'chat': 
                return <Chatbot 
                            selectedTaskId={selectedTaskForChat} 
                            tasks={todos} 
                       />;
            case 'calendar':
                return <CalendarView 
                            todos={todos} 
                            setTodos={setTodos} 
                            onLocateTask={handleLocateTask}
                            timeFormat={timeFormat}
                       />;
            case 'me':
                return <Me 
                            todos={todos} 
                            setTodos={setTodos} 
                            onLocateTask={handleLocateTask}
                            timeFormat={timeFormat}
                            username={username}
                            isGuest={!userId}
                            onLogout={handleLogout}
                       />;
            case 'settings': 
                return <Settings 
                            theme={theme} 
                            setTheme={setTheme}
                            timeFormat={timeFormat}
                            setTimeFormat={setTimeFormat}
                            backupData={{ todos, categories, theme }}
                            onRestore={handleRestoreBackup}
                            setCustomBackground={setCustomBackground}
                            categories={categories}
                            setCategories={setCategories}
                            todos={todos}
                            setTodos={setTodos}
                            onLogout={handleLogout}
                       />;
            case 'tasks':
            default:
                return <ToDoList 
                            todos={todos} 
                            setTodos={setTodos} 
                            categories={categories}
                            setCategories={setCategories}
                            setActiveTab={setActiveTab}
                            setSelectedTaskForChat={setSelectedTaskForChat}
                            scrollToTaskId={scrollToTaskId}
                            timeFormat={timeFormat}
                            isGuest={!userId}
                       />;
        }
    };
    
    const textClass = customBackground ? 'text-white' : 'text-brand-text-primary';
    const appContainerClass = `min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${customBackground ? 'bg-black/50' : 'bg-brand-background'} ${textClass}`;

    return (
        <div className={appContainerClass}>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col w-full lg:pl-24 h-[100dvh]">
                <main className="flex-grow bg-brand-surface backdrop-blur-md border-none sm:border sm:border-gray-700/20 sm:rounded-xl shadow-lg p-2 sm:p-6 overflow-y-auto mb-16 lg:mb-0 transition-colors duration-300">
                    <div key={activeTab} className="animate-fade-in h-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;