import React, { useState } from 'react';
import { ToDoItem, ActivityLogEntry } from '../types';
import Loader from './Loader';
import { BrainIcon } from './IconComponents';
import ActivityLog from './ActivityLog';

interface RightPanelProps {
    breakdownTask: ToDoItem | null;
    breakdownResult: string;
    isLoading: boolean;
    activityLog: ActivityLogEntry[];
}

type ActiveTab = 'breakdown' | 'log';

const RightPanel: React.FC<RightPanelProps> = ({ breakdownTask, breakdownResult, isLoading, activityLog }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('breakdown');

    return (
        <div className="lg:w-1/2 bg-gray-800/50 rounded-lg p-4 flex flex-col">
            <div className="flex border-b border-gray-700 mb-4">
                <button
                    onClick={() => setActiveTab('breakdown')}
                    className={`py-2 px-4 text-sm font-medium ${activeTab === 'breakdown' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}
                >
                    Task Breakdown
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`py-2 px-4 text-sm font-medium ${activeTab === 'log' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary hover:text-white'}`}
                >
                    Activity Log
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'breakdown' && (
                    breakdownTask ? (
                        <div className="flex flex-col h-full">
                            <p className="mb-2 text-brand-text-secondary">Breaking down: <span className="font-semibold text-brand-text-primary">{breakdownTask.text}</span></p>
                            <div className="flex-grow overflow-y-auto bg-gray-900 rounded-lg p-3 prose prose-invert prose-sm max-w-none">
                                {isLoading ? <div className="flex justify-center items-center h-full"><Loader /></div> : <div dangerouslySetInnerHTML={{ __html: breakdownResult.replace(/\n/g, '<br />') }} />}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-brand-text-secondary">
                            <p>Select a task's <BrainIcon className="w-5 h-5 inline-block mx-1" /> icon to see a detailed breakdown.</p>
                        </div>
                    )
                )}

                {activeTab === 'log' && (
                    <ActivityLog logEntries={activityLog} />
                )}
            </div>
        </div>
    );
};

export default RightPanel;
