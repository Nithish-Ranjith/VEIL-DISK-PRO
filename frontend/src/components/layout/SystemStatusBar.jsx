/**
 * SystemStatusBar — Real system metrics from backend
 * Polls GET /api/v1/system/status every 30s for real CPU, memory, drive count.
 * Falls back to browser Battery API for battery info.
 */
import React, { useState, useEffect } from 'react';
import { Laptop, Battery, BatteryCharging, BatteryLow, HardDrive, Circle, Cpu, MemoryStick } from 'lucide-react';
import { getSystemStatus } from '../../api/client';

const SystemStatusBar = ({ drivesConnected = 0, dataSource = 'simulated' }) => {
    const [systemInfo, setSystemInfo] = useState({
        deviceName: 'Loading...',
        battery: null,
        charging: false,
        lastSync: new Date(),
        cpu: null,
        memory: null,
    });

    // ── Battery (browser API) ──────────────────────────────────────────────────
    useEffect(() => {
        const getDeviceName = () => {
            const p = navigator.platform;
            if (p.includes('Mac')) return 'MacBook';
            if (p.includes('Win')) return 'Windows PC';
            if (p.includes('Linux')) return 'Linux System';
            return 'Unknown Device';
        };

        const updateBattery = async () => {
            if ('getBattery' in navigator) {
                try {
                    const b = await navigator.getBattery();
                    setSystemInfo(prev => ({
                        ...prev,
                        battery: Math.round(b.level * 100),
                        charging: b.charging,
                        deviceName: getDeviceName(),
                    }));
                    b.addEventListener('chargingchange', () =>
                        setSystemInfo(prev => ({ ...prev, charging: b.charging }))
                    );
                    b.addEventListener('levelchange', () =>
                        setSystemInfo(prev => ({ ...prev, battery: Math.round(b.level * 100) }))
                    );
                } catch {
                    setSystemInfo(prev => ({ ...prev, deviceName: getDeviceName() }));
                }
            } else {
                setSystemInfo(prev => ({ ...prev, deviceName: getDeviceName() }));
            }
        };
        updateBattery();
    }, []);

    // ── Real CPU + Memory from backend ─────────────────────────────────────────
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await getSystemStatus();
                setSystemInfo(prev => ({
                    ...prev,
                    cpu: res.cpu_percent,
                    memory: res.memory_percent,
                    lastSync: new Date(),
                }));
            } catch {
                // Backend not ready yet — silent fail
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getTimeSinceSync = () => {
        const seconds = Math.floor((new Date() - systemInfo.lastSync) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        return minutes === 1 ? '1 min ago' : `${minutes} min ago`;
    };

    const getBatteryIcon = () => {
        const p = { size: 14, className: 'text-gray-300' };
        if (systemInfo.battery === null) return <Laptop {...p} />;
        if (systemInfo.charging) return <BatteryCharging {...p} />;
        if (systemInfo.battery > 20) return <Battery {...p} />;
        return <BatteryLow {...p} />;
    };

    const dsInfo = dataSource === 'real'
        ? { icon: <Circle size={8} className="fill-green-400 text-green-400" />, text: 'Real Data', color: 'text-green-400' }
        : { icon: <Circle size={8} className="fill-yellow-400 text-yellow-400" />, text: 'Simulated', color: 'text-yellow-400' };

    return (
        <div className="bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 px-6 py-1.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
                {/* Left: Device + Drives */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Laptop size={13} className="text-gray-400" />
                        <span className="text-gray-300 font-medium">{systemInfo.deviceName}</span>
                    </div>

                    {systemInfo.battery !== null && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                            {getBatteryIcon()}
                            <span className="text-gray-300">{systemInfo.battery}%</span>
                            {systemInfo.charging && <span className="text-green-400 ml-0.5">⚡</span>}
                        </div>
                    )}

                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                        <HardDrive size={13} className="text-gray-400" />
                        <span className="text-gray-300">
                            <span className="font-semibold">{drivesConnected}</span> Drive{drivesConnected !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Real CPU */}
                    {systemInfo.cpu !== null && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                            <Cpu size={13} className={systemInfo.cpu > 80 ? 'text-red-400' : 'text-gray-400'} />
                            <span className={`font-mono ${systemInfo.cpu > 80 ? 'text-red-400' : 'text-gray-300'}`}>
                                CPU {systemInfo.cpu}%
                            </span>
                        </div>
                    )}

                    {/* Real Memory */}
                    {systemInfo.memory !== null && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                            <span className={`font-mono ${systemInfo.memory > 85 ? 'text-orange-400' : 'text-gray-300'}`}>
                                MEM {systemInfo.memory}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Data source + sync */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                        {dsInfo.icon}
                        <span className={`font-medium ${dsInfo.color}`}>{dsInfo.text}</span>
                    </div>
                    <div className="text-gray-500">
                        Synced: <span className="text-gray-400">{getTimeSinceSync()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStatusBar;
