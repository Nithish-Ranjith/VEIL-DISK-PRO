import React, { useState } from 'react';
import { Bell, Settings, LogOut, ShieldAlert } from 'lucide-react';
import SettingsModal from '../setup/SettingsModal';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onBackupNow, optimizing, dataSource }) => {
    const [showSettings, setShowSettings] = useState(false);
    const { user, logout } = useAuth();

    return (
        <>
            <header className="h-16 px-6 bg-[#080C14]/80 backdrop-blur-md border-b-[0.5px] border-white/[0.08] flex items-center justify-between z-50 sticky top-0">
                {/* Logo Section */}
                <div className="flex items-center gap-5">
                    <span className="text-[#ED1C24] text-xl font-bold tracking-tighter select-none">SanDisk</span>
                    <div className="h-3 w-px bg-white/10"></div>

                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-slate-800 to-black flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-white/5 group-hover:border-blue-500/30 transition-colors">
                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all"></div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <div className="leading-none flex items-baseline gap-1">
                                <span className="text-white font-semibold text-lg tracking-tight">Sentinel-DISK</span>
                                <span className="text-slate-500 font-light text-base">Pro</span>
                            </div>
                            <span className="text-[9px] text-blue-400/80 uppercase tracking-[0.2em] leading-none mt-1 font-medium">
                                Predictive Drive Health
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-5">
                    {/* Data source badge — dynamic */}
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${dataSource === 'real' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${dataSource === 'real' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {dataSource === 'real' ? 'Live System' : 'Simulated'}
                        </span>
                    </div>

                    <div className="h-3 w-px bg-white/10"></div>

                    {/* Limited Mode Indicator */}
                    {dataSource !== 'real' && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <ShieldAlert className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Limited Mode</span>
                        </div>
                    )}

                    <div className="h-3 w-px bg-white/10"></div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
                        <img
                            src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
                            alt="User"
                            className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <div className="hidden md:block text-left">
                            <div className="text-xs font-bold text-slate-200 leading-tight">{user?.name || 'User'}</div>
                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.role || 'Guest'}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        title="Logout"
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors hover:bg-white/5 rounded-full"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>

                    <button className="relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#ED1C24] rounded-full shadow-[0_0_5px_rgba(237,28,36,0.8)]"></span>
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

export default Header;
