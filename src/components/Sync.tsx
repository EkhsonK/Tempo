import React from 'react';
import { SyncIcon } from './IconComponents';

const Sync: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary">
            <SyncIcon className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Account Sync</h2>
            <p>Cloud synchronization for your tasks across devices is coming soon!</p>
        </div>
    );
};

export default Sync;
