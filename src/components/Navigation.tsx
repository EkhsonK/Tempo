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
    // Active: Solid Primary Color with correct text contrast
    const activeClasses = 'bg-brand-primary shadow-lg scale-110';
    const activeStyle = { color: 'var(--brand-text-on-primary)' };

    // Inactive: Subtle text color, subtle hover
    const inactiveClasses = 'text-brand-text-secondary hover:text-brand-primary hover:bg-brand-surface-rgb/10';
    
    return (
        <button
            onClick={onClick}
            title={title}
            className={`group w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out ${isActive ? activeClasses : inactiveClasses}`}
            style={isActive ? activeStyle : {}}
        >
            <div className="transform transition-transform duration-300">
                {icon}
            </div>
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: 'tasks', label: 'Задачи', icon: <TasksIcon className="w-6 h-6 lg:w-7 lg:h-7" /> },
        { id: 'chat', label: 'Чат', icon: <ChatIcon className="w-6 h-6 lg:w-7 lg:h-7" /> },
        { id: 'calendar', label: 'Календарь', icon: <CalendarIcon className="w-6 h-6 lg:w-7 lg:h-7" /> },
        { id: 'me', label: 'Я', icon: <UserCircleIcon className="w-6 h-6 lg:w-7 lg:h-7" /> },
        { id: 'settings', label: 'Настройки', icon: <SettingsIcon className="w-6 h-6 lg:w-7 lg:h-7" /> },
    ];

    return (
        <>
            {/* Bottom Nav for Mobile */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-gray-700 flex justify-around items-center p-3 z-[50] pb-safe shadow-[0_-5px_30px_rgba(0,0,0,0.1)]">
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
            <nav className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-brand-surface/95 backdrop-blur-xl border-r border-brand-gray-700 py-8 z-[50] w-24 items-center shadow-xl">
                <div className="mb-12">
                    <div className="p-3 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-lg">
                        {/* Fixed Logo Color */}
                        <ListCheckIcon className="w-8 h-8" style={{ color: 'var(--brand-text-on-primary)' }} />
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
            </nav>
        </>
    );
};

export default Navigation;