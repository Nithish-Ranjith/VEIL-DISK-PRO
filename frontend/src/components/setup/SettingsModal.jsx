import React, { useState, useEffect } from 'react';
import { X, HardDrive, Bell, Zap, Info, RotateCcw, Database, Clock, Activity } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    // Default settings
    const defaultSettings = {
        // Drive Settings
        autoDetectDrives: true,
        scanInterval: '12h',
        healthThreshold: 50,

        // Notification Settings
        desktopNotifications: true,
        criticalAlerts: true,

        // Advanced Settings
        dataSource: 'auto', // 'auto', 'real', 'simulated'
        compressionAggressiveness: 'balanced', // 'light', 'balanced', 'aggressive'
        apiEndpoint: 'http://localhost:8000',

        // Display Settings
        refreshInterval: 5, // seconds
        showDebugInfo: false,
    };

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('sentinelDiskSettings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const [hasChanges, setHasChanges] = useState(false);

    // Save to localStorage whenever settings change
    useEffect(() => {
        if (hasChanges) {
            localStorage.setItem('sentinelDiskSettings', JSON.stringify(settings));
        }
    }, [settings, hasChanges]);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            setSettings(defaultSettings);
            localStorage.setItem('sentinelDiskSettings', JSON.stringify(defaultSettings));
            setHasChanges(false);
        }
    };

    const handleSave = async () => {
        // Save to localStorage
        localStorage.setItem('sentinelDiskSettings', JSON.stringify(settings));

        // Save to Backend
        try {
            await fetch('http://localhost:8000/api/v1/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data_source: settings.dataSource,
                    scan_interval: settings.scanInterval,
                    health_threshold: settings.healthThreshold,
                    algorithm_active: true, // Preserve default
                    auto_adjust: true       // Preserve default
                })
            });
        } catch (e) {
            console.error("Failed to save settings to backend:", e);
        }

        setHasChanges(false);
        onClose();

        // Force reload to apply new data source immediately
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Activity size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-100">Settings</h2>
                            <p className="text-xs text-gray-400">Configure SENTINEL-DISK Pro</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4 space-y-6">

                    {/* Drive Settings Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300">
                            <HardDrive size={18} />
                            <h3 className="font-semibold">Drive Settings</h3>
                        </div>

                        <div className="space-y-3 pl-7">
                            {/* Auto-detect drives */}
                            <label className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer">
                                <div>
                                    <div className="text-sm font-medium text-gray-200">Auto-detect drives</div>
                                    <div className="text-xs text-gray-400">Automatically scan for new drives on startup</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.autoDetectDrives}
                                    onChange={(e) => handleChange('autoDetectDrives', e.target.checked)}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                />
                            </label>

                            {/* Scan interval */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">Scan Interval</div>
                                    <div className="text-xs text-gray-400 mb-3">How often to check drive health</div>
                                    <select
                                        value={settings.scanInterval}
                                        onChange={(e) => handleChange('scanInterval', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="6h">Every 6 hours</option>
                                        <option value="12h">Every 12 hours</option>
                                        <option value="24h">Every 24 hours</option>
                                    </select>
                                </label>
                            </div>

                            {/* Health threshold */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">Health Threshold</div>
                                    <div className="text-xs text-gray-400 mb-3">Trigger intervention when health drops below: {settings.healthThreshold}/100</div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="80"
                                        step="5"
                                        value={settings.healthThreshold}
                                        onChange={(e) => handleChange('healthThreshold', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>20</span>
                                        <span>50</span>
                                        <span>80</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Bell size={18} />
                            <h3 className="font-semibold">Notifications</h3>
                        </div>

                        <div className="space-y-3 pl-7">
                            <label className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer">
                                <div>
                                    <div className="text-sm font-medium text-gray-200">Desktop Notifications</div>
                                    <div className="text-xs text-gray-400">Show browser notifications for updates</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.desktopNotifications}
                                    onChange={(e) => handleChange('desktopNotifications', e.target.checked)}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer">
                                <div>
                                    <div className="text-sm font-medium text-gray-200">Critical Health Alerts</div>
                                    <div className="text-xs text-gray-400">Immediate alerts when drive health is critical</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.criticalAlerts}
                                    onChange={(e) => handleChange('criticalAlerts', e.target.checked)}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Advanced Settings Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Zap size={18} />
                            <h3 className="font-semibold">Advanced</h3>
                        </div>

                        <div className="space-y-3 pl-7">
                            {/* Data source */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">Data Source</div>
                                    <div className="text-xs text-gray-400 mb-3">Choose between real SMART data or simulated</div>
                                    <select
                                        value={settings.dataSource}
                                        onChange={(e) => handleChange('dataSource', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="auto">Auto (Real if available)</option>
                                        <option value="real">Force Real Data</option>
                                        <option value="simulated">Force Simulated</option>
                                    </select>
                                </label>
                            </div>

                            {/* Compression aggressiveness */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">Compression Level</div>
                                    <div className="text-xs text-gray-400 mb-3">Balance between performance and space savings</div>
                                    <select
                                        value={settings.compressionAggressiveness}
                                        onChange={(e) => handleChange('compressionAggressiveness', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="light">Light (Fast, less savings)</option>
                                        <option value="balanced">Balanced (Recommended)</option>
                                        <option value="aggressive">Aggressive (Slower, max savings)</option>
                                    </select>
                                </label>
                            </div>

                            {/* API endpoint */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">API Endpoint</div>
                                    <div className="text-xs text-gray-400 mb-3">Backend server URL</div>
                                    <input
                                        type="text"
                                        value={settings.apiEndpoint}
                                        onChange={(e) => handleChange('apiEndpoint', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        placeholder="http://localhost:8000"
                                    />
                                </label>
                            </div>

                            {/* Refresh interval */}
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <label className="block">
                                    <div className="text-sm font-medium text-gray-200 mb-2">Dashboard Refresh</div>
                                    <div className="text-xs text-gray-400 mb-3">Update interval: {settings.refreshInterval} seconds</div>
                                    <input
                                        type="range"
                                        min="3"
                                        max="30"
                                        step="1"
                                        value={settings.refreshInterval}
                                        onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>3s</span>
                                        <span>15s</span>
                                        <span>30s</span>
                                    </div>
                                </label>
                            </div>

                            {/* Debug info */}
                            <label className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer">
                                <div>
                                    <div className="text-sm font-medium text-gray-200">Show Debug Info</div>
                                    <div className="text-xs text-gray-400">Display technical details in console</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.showDebugInfo}
                                    onChange={(e) => handleChange('showDebugInfo', e.target.checked)}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                />
                            </label>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Info size={18} />
                            <h3 className="font-semibold">About</h3>
                        </div>

                        <div className="pl-7 space-y-2">
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <div className="text-xs text-gray-400">Version</div>
                                <div className="text-sm font-mono text-gray-200">1.0.0</div>
                            </div>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <div className="text-xs text-gray-400">Backend Status</div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-green-400">Connected</span>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <div className="text-xs text-gray-400 mb-1">License</div>
                                <div className="text-xs text-gray-300">MIT License - © 2026 SENTINEL-DISK Pro</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50 bg-gray-900/50">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-gray-100 transition-colors text-sm"
                    >
                        <RotateCcw size={16} />
                        Reset to Defaults
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-gray-100 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors text-sm shadow-lg shadow-blue-900/30"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
