import React, { useState, useEffect, useCallback } from 'react';
import ToDoList from './components/ToDoList';
import Chatbot from './components/Chatbot';
import Settings from './components/Settings';
import Me from './components/Me';
import Navigation from './components/Navigation';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { ActiveTab, ToDoItem, Priority, AppBackup, Theme, TimeFormat, SubTask, TaskUpdateAction } from './types';
import { api, setApiUserId } from './services/api';

const App: React.FC = () => {
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

    const handleUserLogin = (id: number, name: string) => { 
        localStorage.setItem('tempo_auth_token', 'true'); 
        localStorage.setItem('tempo_username', name); 
        localStorage.setItem('tempo_user_id', id.toString()); 
        localStorage.removeItem('tempo_is_guest'); 
        setUserId(id); 
        setUsername(name); 
        setApiUserId(id); 
        setIsAuthenticated(true); 
        setActiveTab('tasks'); 
        setIsDataLoaded(false); 
    };

    const handleGuestLogin = () => { localStorage.setItem('tempo_is_guest', 'true'); localStorage.removeItem('tempo_auth_token'); localStorage.removeItem('tempo_username'); setUserId(null); setUsername(null); setApiUserId(null); setIsAuthenticated(true); setActiveTab('tasks'); setIsDataLoaded(false); };
    const handleLogout = () => { localStorage.clear(); setIsAuthenticated(false); setUserId(null); setUsername(null); setApiUserId(null); setTodos([]); setCategories([]); setActiveTab('tasks'); setIsDataLoaded(false); };

    useEffect(() => { setApiUserId(userId); }, [userId]);

    const fetchData = useCallback(async () => {
        if (userId) {
            try {
                setApiUserId(userId); 
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
                
                const processedTodos = fetchedTodos.map((t: ToDoItem) => ({ 
                    ...t, 
                    priority: t.priority || Priority.NONE,
                    attachments: t.attachments || [],
                    chat_history: t.chat_history || [] // [CRITICAL] Ensure array exists
                }));

                setTodos(prev => {
                    if (prev.length === processedTodos.length && JSON.stringify(prev) === JSON.stringify(processedTodos)) return prev;
                    return processedTodos;
                });

                setCategories(prev => {
                    if (prev.length === fetchedCategories.length && JSON.stringify(prev) === JSON.stringify(fetchedCategories)) return prev;
                    return fetchedCategories.length > 0 ? fetchedCategories : ["Общее", "Работа", "Личное"];
                });

            } catch (e) { 
                console.warn("Fetch error", e); 
            } finally { 
                setIsDataLoaded(true); 
            }
        } else if (isAuthenticated) {
            setTodos(JSON.parse(localStorage.getItem('guest_todos') || '[]'));
            setCategories(JSON.parse(localStorage.getItem('guest_categories') || '["Общее", "Работа", "Личное"]'));
            setIsDataLoaded(true);
        }
    }, [isAuthenticated, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (!userId) return; 
        const interval = setInterval(() => { fetchData(); }, 10000); 
        return () => clearInterval(interval);
    }, [userId, fetchData]);

    useEffect(() => { if (activeTab === 'tasks') fetchData(); }, [activeTab, fetchData]);

    const handleAddTodo = async (task: any) => {
        const tempId = Date.now();
        const newTodo: ToDoItem = { 
            ...task, 
            id: tempId, 
            completed: false, 
            subtasks: [], 
            attachments: task.attachments || [],
            chat_history: [],
            lastModified: new Date().toISOString() 
        };
        
        setTodos(prev => [...prev, newTodo]);

        if (userId) {
            try { 
                await api.addTodo(newTodo); 
                fetchData(); 
            } catch (e) { console.error("Add failed", e); }
        }
    };

    const handleUpdateTodo = async (id: number, updates: Partial<ToDoItem>) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        if (userId) {
            try { await api.updateTodo(id, updates); } catch (e) { console.error("Update failed", e); }
        }
    };

    const handleDeleteTodo = async (id: number) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        if (userId) {
            try { await api.deleteTodo(id); } catch (e) { console.error("Delete failed", e); }
        }
    };

    // [MODIFIED] Handle AI Commands AND Chat History
    const handleAiTaskUpdate = (taskId: number, action: TaskUpdateAction, value: any) => {
        const task = todos.find(t => t.id === taskId);
        if (!task) return;
        let updates: Partial<ToDoItem> = {};
        switch (action) {
            case 'ADD_SUBTASK':
                const newSub: SubTask = { id: Date.now(), text: value, completed: false };
                updates = { subtasks: [...(task.subtasks || []), newSub] };
                break;
            case 'SET_STATUS': updates = { completed: value.toString().toLowerCase() === 'completed' }; break;
            case 'SET_PRIORITY': if(['high','medium','low'].includes(value)) updates = { priority: value as Priority }; break;
            case 'ADD_NOTE': updates = { notes: value }; break;
            case 'SET_TITLE': updates = { text: value }; break;
            case 'SAVE_CHAT': updates = { chat_history: value }; break; // [NEW] Sync chat
        }
        handleUpdateTodo(taskId, updates);
    };

    useEffect(() => { if (userId && isDataLoaded) { const t = setTimeout(() => api.updateUserSettings({ theme, time_format: timeFormat, background_url: customBackground }).catch(console.error), 1000); return () => clearTimeout(t); } }, [theme, timeFormat, customBackground, userId, isDataLoaded]);
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_todos', JSON.stringify(todos)); }, [todos, userId, isAuthenticated]);
    useEffect(() => { if (!userId && isAuthenticated) localStorage.setItem('guest_categories', JSON.stringify(categories)); }, [categories, userId, isAuthenticated]);
    useEffect(() => { localStorage.setItem('selectedTaskForChat', JSON.stringify(selectedTaskForChat)); }, [selectedTaskForChat]);
    
    useEffect(() => { 
        localStorage.setItem('theme', theme);
        const root = document.documentElement;
        root.classList.remove('dark', 'midnight', 'sunset', 'light', 'neon', 'mint');
        if (theme !== 'light') root.classList.add(theme);
    }, [theme]);
    
    useEffect(() => { localStorage.setItem('timeFormat', timeFormat); }, [timeFormat]);

    useEffect(() => {
        const root = document.documentElement;
        if (customBackground) {
            root.style.setProperty('--custom-bg', `${customBackground} center/cover fixed no-repeat`);
            root.style.setProperty('--main-panel-bg', 'transparent');
            root.style.setProperty('--glass-border-opacity', '0'); 
        } else {
            root.style.removeProperty('--custom-bg');
            root.style.setProperty('--main-panel-bg', 'var(--brand-surface-solid)');
            root.style.removeProperty('--glass-border-opacity'); 
        }
    }, [customBackground]);

    const handleRestoreBackup = (backup: AppBackup) => { if (!backup.todos) return; setTodos(backup.todos); setCategories(backup.categories); setTheme(backup.theme); alert("Restored."); };
    const handleLocateTask = (taskId: number) => { setActiveTab('tasks'); setScrollToTaskId(taskId); setTimeout(() => setScrollToTaskId(null), 1000); };

    if (!isAuthenticated) return <Auth onGuestLogin={handleGuestLogin} onUserLogin={handleUserLogin} />;

    const renderContent = () => {
        switch (activeTab) {
            case 'chat': return <Chatbot selectedTaskId={selectedTaskForChat} tasks={todos} onTaskUpdate={handleAiTaskUpdate} />;
            case 'calendar': return <CalendarView todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} isGuest={!userId} categories={categories} />;
            case 'me': return <Me todos={todos} setTodos={setTodos} onLocateTask={handleLocateTask} timeFormat={timeFormat} username={username} isGuest={!userId} onLogout={handleLogout} categories={categories} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} timeFormat={timeFormat} setTimeFormat={setTimeFormat} backupData={{ todos, categories, theme }} onRestore={handleRestoreBackup} setCustomBackground={setCustomBackground} categories={categories} setCategories={setCategories} todos={todos} setTodos={setTodos} onLogout={handleLogout} />;
            case 'tasks': default: return <ToDoList 
                todos={todos} 
                setTodos={setTodos} 
                categories={categories} 
                setCategories={setCategories} 
                setActiveTab={setActiveTab} 
                setSelectedTaskForChat={setSelectedTaskForChat} 
                scrollToTaskId={scrollToTaskId} 
                timeFormat={timeFormat} 
                isGuest={!userId} 
                onRefresh={fetchData} 
                onAddTodo={handleAddTodo} 
                onUpdateTodo={handleUpdateTodo} 
                onDeleteTodo={handleDeleteTodo} 
            />;
        }
    };
    
    const textClass = customBackground ? 'text-white' : 'text-brand-text-primary';
    const appContainerClass = `min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${textClass}`;

    return (
        <div className={appContainerClass}>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={fetchData} />
            <div className="flex-1 flex flex-col w-full lg:pl-24 h-[100dvh]">
                <main 
                    className="flex-grow backdrop-blur-md border-none sm:border sm:border-gray-700/20 sm:rounded-xl shadow-lg p-2 sm:p-6 overflow-y-auto mb-16 lg:mb-0 transition-colors duration-300 glass-panel"
                    style={{ backgroundColor: 'var(--main-panel-bg, var(--brand-surface-solid))' }}
                >
                    <div key={activeTab} className="animate-fade-in h-full">{renderContent()}</div>
                </main>
            </div>
        </div>
    );
};

export default App;