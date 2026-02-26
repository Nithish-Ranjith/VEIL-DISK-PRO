import React, { useState } from 'react';
import { Bell, Settings, LogOut, Heart, Package, TrendingUp, Target } from 'lucide-react';
import SettingsModal from '../setup/SettingsModal';
import { useAuth } from '../../context/AuthContext';

const TABS = [
    { id: 'health', icon: Heart, label: 'Health Monitor' },
    { id: 'compression', icon: Package, label: 'Compression Analytics' },
    { id: 'life', icon: TrendingUp, label: 'Life Extension' },
    { id: 'whatif', icon: Target, label: 'What-If Simulator' },
];

const Header = ({
    currentTab,
    onTabChange,
    drives,
    selectedDriveId,
    onSelect,
    urgency,
    urgencyConfig,
    onBackupNow,
    optimizing,
    dataSource
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const { user, logout } = useAuth();

    // Determine risk badge classes
    const isAtRisk = urgency?.urgency_level === 'high' || urgency?.urgency_level === 'critical';

    return (
        <>
            <div className="app-header">
                {/* Top bar */}
                <div className="top-bar">
                    <div className="brand">
                        <span className="sandisk-logo">SanDisk</span>
                        <span className="divider">|</span>
                        <div className="product-name">
                            <div className="product-name-row">
                                <span className="icon">●</span>
                                <span className="name">Sentinel-DISK <span className="pro">Pro</span></span>
                            </div>
                            <div className="tagline">PREDICTIVE DRIVE HEALTH &amp; OPTIMIZATION</div>
                        </div>
                    </div>

                    <div className="top-nav">
                        <button className="admin-btn">
                            <span className="avatar">A</span> {user?.name || 'Admin'} ▼
                        </button>
                        <button className="notification-btn">
                            🔔 <span className="badge">2</span>
                        </button>
                        <button className="settings-btn" onClick={() => setShowSettings(true)}>
                            ⚙️
                        </button>
                        <button className="settings-btn" onClick={logout} title="Logout">
                            <LogOut className="w-4 h-4 inline" />
                        </button>
                    </div>
                </div>

                {/* Tab navigation */}
                <nav className="main-tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`tab ${currentTab === tab.id ? 'active' : ''}`}
                                onClick={() => onTabChange(tab.id)}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Drive selector bar */}
                <div className="drive-bar">
                    <select
                        className="drive-selector"
                        value={selectedDriveId}
                        onChange={(e) => onSelect(e.target.value)}
                        disabled={optimizing}
                    >
                        {drives.map(d => (
                            <option key={d.drive_id} value={d.drive_id}>
                                💾 {d.model || d.drive_id.split('_')[1]} {d.health_score ? `- ${d.health_score}%` : ''}
                            </option>
                        ))}
                    </select>

                    {urgency && (
                        <span className={`risk-badge ${isAtRisk ? 'at-risk' : 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'}`}>
                            {urgencyConfig?.icon || (isAtRisk ? '🔴' : '✅')} {urgency.label || urgency.message || 'Healthy'}
                        </span>
                    )}

                    {dataSource !== 'real' && (
                        <span className="risk-badge text-amber-500 bg-amber-500/10 border border-amber-500/20">
                            Simulated Mode
                        </span>
                    )}

                    <button
                        className="backup-btn primary"
                        onClick={onBackupNow}
                        disabled={optimizing}
                    >
                        {optimizing ? 'Processing...' : 'Backup Now →'}
                    </button>
                </div>
            </div>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

export default Header;
