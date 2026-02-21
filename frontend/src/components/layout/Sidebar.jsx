import React from 'react';

const Sidebar = ({ currentTab, onTabChange, drives, selectedDriveId, onDriveChange, optimizing }) => {
    const TABS = [
        {
            id: 'health', name: 'Health Monitor', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        },
        {
            id: 'compression', name: 'Compression', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            )
        },
        {
            id: 'life', name: 'Life Extension', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'whatif', name: 'What-If Simulator', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
    ];

    return (
        <aside className="w-[220px] bg-[#0F1419] border-r border-gray-800 flex flex-col h-full flex-shrink-0 z-20 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                        S
                    </div>
                    <h1 className="text-lg font-semibold tracking-wide text-gray-100">SENTINEL-DISK</h1>
                </div>
                <div className="h-px bg-gray-800 mt-6 mb-2"></div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {TABS.map(tab => {
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                                }`}
                        >
                            <span className={`transition-colors ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                {tab.icon}
                            </span>
                            {tab.name}
                        </button>
                    );
                })}
            </nav>

            {/* Drive Selector area */}
            <div className="p-4 border-t border-gray-800 bg-[#0F1419]">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block pl-1">
                    Monitored Drive
                </label>
                <div className="relative">
                    <select
                        value={selectedDriveId}
                        onChange={(e) => onDriveChange(e.target.value)}
                        disabled={optimizing}
                        className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 text-xs rounded-lg p-2.5 pr-8 appearance-none outline-none focus:border-blue-500 hover:border-gray-600 transition-colors cursor-pointer"
                    >
                        {drives.map(drive => (
                            <option key={drive.drive_id} value={drive.drive_id}>
                                {drive.drive_id === 'REAL_DRIVE' ? 'Local Disk (Real-Time)' : `${drive.drive_id.split('_')[1]} - ${drive.health_score}%`}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* System Status */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 border-t border-gray-800 pt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                    System Online
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
