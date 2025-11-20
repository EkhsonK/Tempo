import React, { useState, useEffect } from 'react';
import ToDoList from './components/ToDoList';
import Chatbot from './components/Chatbot';
import Settings from './components/Settings';
import Me from './components/Me';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { ActiveTab, ToDoItem, Priority, AppBackup, Theme, TimeFormat } from './types';
import { api, setApiUserId } from "./services/api";

const App: React.FC = () => {
    // --- 1. INITIALIZATION FIXES (Bug #1 & #2) ---
    
    // Check authentication status from storage immediately
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('tempo_auth_token') || !!localStorage.getItem('tempo_is_guest');
    });

    // Check userId from storage immediately
    const [userId, setUserId] = useState<number | null>(() => {
        const stored = localStorage.getItem('tempo_user_id');
        return stored ? parseInt(stored, 10) : null;
    });

    const [isDataLoaded, setIsDataLoaded] = useState(false); // [NEW]

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
        // Persist session
        localStorage.setItem('tempo_auth_token', 'true');
        localStorage.setItem('tempo_username', name);
        localStorage.removeItem('tempo_is_guest');
        // tempo_user_id is handled by setApiUserId
        
        setUserId(id);
        setUsername(name);
        setApiUserId(id); 
        setIsAuthenticated(true);
        setActiveTab('tasks'); // Fix Bug #3: Reset tab on login
    };

    const handleGuestLogin = () => {
        // Persist guest session
        localStorage.setItem('tempo_is_guest', 'true');
        localStorage.removeItem('tempo_auth_token');
        localStorage.removeItem('tempo_username');

        setUserId(null);
        setUsername(null);
        setApiUserId(null);
        setIsAuthenticated(true);
        setActiveTab('tasks'); // Fix Bug #3: Reset tab on login
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
    };

    // --- EFFECTS ---

    // Sync API user ID on mount/change to ensure API calls work
    useEffect(() => {
        setApiUserId(userId);
    }, [userId]);

    // Data Loading Effect
    useEffect(() => {
        const loadData = async () => {
            if (userId) {
                // User Mode: Fetch from Backend
                try {
                    // Ensure API has ID before request
                    setApiUserId(userId);
                    
                    // Optional: initDB might be redundant if backend handles it, but keeping it for safety
                    await api.initDB(); 
                    
                    const [fetchedTodos, fetchedCategories] = await Promise.all([
                        api.getTodos(),
                        api.getCategories()
                    ]);
                    
                    const sanitizedTodos = fetchedTodos.map((todo: ToDoItem) => ({
                        ...todo,
                        priority: todo.priority || Priority.NONE
                    }));

                    setTodos(sanitizedTodos);
                    setCategories(fetchedCategories.length > 0 ? fetchedCategories : ["Общее", "Работа", "Личное"]);
                } catch (e) {
                    console.warn("Failed to fetch user data from backend.", e);
                }
            } else if (isAuthenticated) {
                // Guest Mode: Fetch from LocalStorage
                const savedTodos = localStorage.getItem('guest_todos');
                const savedCats = localStorage.getItem('guest_categories');
                
                if (savedTodos) {
                    setTodos(JSON.parse(savedTodos));
                } else {
                    setTodos([]);
                }

                if (savedCats) {
                    setCategories(JSON.parse(savedCats));
                } else {
                    setCategories(["Общее", "Работа", "Личное"]);
                }
            }
        };

        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, userId]);

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
    
    // Common LocalStorage settings (Theme, etc)
    useEffect(() => { localStorage.setItem('selectedTaskForChat', JSON.stringify(selectedTaskForChat)); }, [selectedTaskForChat]);
    useEffect(() => { 
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('dark', 'light', 'midnight', 'forest');
        document.documentElement.classList.add(theme);
    }, [theme]);
    
    useEffect(() => {
        localStorage.setItem('timeFormat', timeFormat);
    }, [timeFormat]);

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