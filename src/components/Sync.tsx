import React, { useEffect, useState } from 'react';
// [FIXED] Added ClockIcon to the imports
import { SyncIcon, DatabaseIcon, CheckIcon, CloudIcon, WifiIcon, ClockIcon } from './IconComponents';

// Icons for status
const WifiOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" /></svg>
);

interface SyncProps {
    isOnline: boolean;
    lastSyncTime: string;
    onForceSync: () => Promise<void>;
    pendingUploads: number; // Count of items in localStorage sync_queue
}

const Sync: React.FC<SyncProps> = ({ isOnline, lastSyncTime, onForceSync, pendingUploads }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncClick = async () => {
        setIsSyncing(true);
        // Minimum spinner time for UX
        const minTime = new Promise(resolve => setTimeout(resolve, 1000));
        await Promise.all([onForceSync(), minTime]);
        setIsSyncing(false);
    };

    return (
        <div className="flex flex-col h-full p-6 animate-fade-in text-brand-text-primary">
            
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="relative inline-block">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto transition-colors duration-500 ${isOnline ? 'bg-brand-primary/10' : 'bg-red-500/10'}`}>
                        {isSyncing ? (
                            <SyncIcon className="w-10 h-10 text-brand-primary animate-spin" />
                        ) : isOnline ? (
                            <CloudIcon className="w-10 h-10 text-brand-primary" />
                        ) : (
                            <WifiOffIcon className="w-10 h-10 text-red-500" />
                        )}
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute bottom-4 right-0 w-5 h-5 rounded-full border-4 border-brand-surface-solid ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <h2 className="text-2xl font-bold mb-1">Синхронизация</h2>
                <p className="text-brand-text-secondary text-sm">
                    {isOnline ? "Подключено к серверу" : "Нет подключения"}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-brand-surface p-4 rounded-2xl border border-brand-gray-700/50 flex items-center gap-4">
                    <div className="p-3 bg-brand-primary/20 rounded-xl">
                        <ClockIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary font-bold uppercase tracking-wider">Последнее обновление</p>
                        <p className="text-lg font-bold">{lastSyncTime}</p>
                    </div>
                </div>

                <div className="bg-brand-surface p-4 rounded-2xl border border-brand-gray-700/50 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${pendingUploads > 0 ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                        <DatabaseIcon className={`w-6 h-6 ${pendingUploads > 0 ? 'text-orange-500' : 'text-green-500'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary font-bold uppercase tracking-wider">Очередь выгрузки</p>
                        <p className="text-lg font-bold">
                            {pendingUploads > 0 ? `${pendingUploads} изменений` : "Все сохранено"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Manual Action */}
            <div className="mt-auto">
                <button 
                    onClick={handleSyncClick}
                    disabled={isSyncing || !isOnline}
                    className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3
                        ${isOnline 
                            ? 'bg-brand-primary text-brand-text-on-primary hover:bg-brand-secondary' 
                            : 'bg-brand-gray-700 text-brand-text-secondary cursor-not-allowed opacity-50'}
                    `}
                >
                    {isSyncing ? (
                        <>
                            <SyncIcon className="w-5 h-5 animate-spin" />
                            Синхронизация...
                        </>
                    ) : (
                        <>
                            <SyncIcon className="w-5 h-5" />
                            Синхронизировать сейчас
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-brand-text-secondary mt-4 opacity-60">
                    Диалоги чат-бота и задачи синхронизируются автоматически каждые 10 секунд при наличии сети.
                </p>
            </div>
        </div>
    );
};

export default Sync;