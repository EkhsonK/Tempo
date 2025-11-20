import React from 'react';
import { ActiveTab } from '../types';
import { ListCheckIcon, TasksIcon, ChatIcon, SettingsIcon, UserCircleIcon, CalendarIcon } from './IconComponents';

interface NavigationProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const NavItem: React.FC<{
    id: ActiveTab;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    title: string;
}> = ({ id, icon, isActive, onClick, title }) => {
    const activeClasses = 'bg-brand-primary text-white shadow-glow-primary scale-110';
    const inactiveClasses = 'text-brand-text-secondary hover:bg-brand-surface-solid hover:text-brand-primary hover:scale-105';
    
    return (
        <button
            onClick={onClick}
            title={title}
            className={`group w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out ${isActive ? activeClasses : inactiveClasses}`}
        >
            <div className="transform transition-transform duration-300">
                {icon}
            </div>
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: 'tasks', label: 'Задачи', icon: <TasksIcon className="w-7 h-7" /> },
        { id: 'chat', label: 'Чат', icon: <ChatIcon className="w-7 h-7" /> },
        { id: 'calendar', label: 'Календарь', icon: <CalendarIcon className="w-7 h-7" /> },
        { id: 'me', label: 'Я', icon: <UserCircleIcon className="w-7 h-7" /> },
        { id: 'settings', label: 'Настройки', icon: <SettingsIcon className="w-7 h-7" /> },
    ];

    return (
        <>
            {/* Bottom Nav for Mobile & Tablet */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-gray-700/30 flex justify-around items-center p-3 z-[50] pb-safe">
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        id={item.id}
                        icon={item.icon}
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                    />
                ))}
            </nav>

            {/* Sidebar for Desktop */}
            <nav className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-brand-surface/80 backdrop-blur-xl border-r border-brand-gray-700/30 py-8 z-[50] w-24 items-center">
                <div className="mb-12">
                    <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-lg">
                        <ListCheckIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
                
                <div className="flex flex-col gap-6 items-center flex-grow">
                    {navItems.map(item => (
                        <NavItem
                            key={item.id}
                            id={item.id}
                            icon={item.icon}
                            isActive={activeTab === item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                        />
                    ))}
                </div>

                <div className="mt-auto mb-4 opacity-50 text-[10px] font-mono text-center text-gray-500">
                    v2.9
                </div>
            </nav>
        </>
    );
};

export default Navigation;