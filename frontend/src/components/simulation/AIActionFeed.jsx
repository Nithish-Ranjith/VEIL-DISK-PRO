import React, { useState, useEffect } from 'react';
import { Activity, Zap, Shield, AlertTriangle, CheckCircle, Database, Server } from 'lucide-react';

const AIActionFeed = ({ interventions = [], isSimulated = false }) => {
    // Keep internal log of system events + merge with backend interventions
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Map backend interventions to feed format
        const interventionEvents = interventions.map(inv => ({
            id: inv.id || `inv-${Math.random()}`,
            icon: <Zap className="w-4 h-4 text-purple-400" />,
            text: `Intervention: ${inv.action.compression_mode} mode triggered by ${inv.trigger.reason}`,
            time: inv.date_human ? inv.date_human.split(' at ')[1] : 'Just now',
            type: 'info',
            timestamp: new Date(inv.timestamp).getTime()
        }));

        // System startup event
        const startupEvent = {
            id: 'startup',
            icon: <Server className="w-4 h-4 text-blue-400" />,
            text: `System AI Online ${isSimulated ? '(Simulation Mode)' : '(Active Monitoring)'}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'success',
            timestamp: Date.now() - 100000
        };

        // Combine and sort
        const allEvents = [startupEvent, ...interventionEvents].sort((a, b) => b.timestamp - a.timestamp);

        // If empty (besides startup), add some initial "Scanning" logs if simulated
        if (allEvents.length === 1 && isSimulated) {
            setEvents([
                { id: 'scan-1', icon: <Activity className="w-4 h-4 text-blue-400" />, text: 'Predictive Health Scan Active', time: 'Now', type: 'info', timestamp: Date.now() },
                startupEvent
            ]);
        } else {
            setEvents(allEvents.slice(0, 10)); // Keep last 10
        }

    }, [interventions, isSimulated]);

    // Format time helper
    const formatTime = (isoString) => {
        if (!isoString) return '';
        if (isoString.includes(':')) return isoString; // Already formatted
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="card w-full flex flex-col p-6 border-t font-sans animate-fade-in delay-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    AI Action Feed
                </h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Stream
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {events.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 italic">No recent AI actions recorded.</div>
                ) : (
                    events.map((action, i) => (
                        <div key={action.id || i} className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 p-3 rounded-lg border border-transparent transition-all hover:bg-white/5 ${action.type === 'warning' ? 'bg-orange-500/5 hover:bg-orange-500/10' :
                            action.type === 'success' ? 'bg-green-500/5 hover:bg-green-500/10' :
                                'bg-blue-500/5 hover:bg-blue-500/10'
                            }`}>
                            <div className={`p-2 rounded-full ${action.type === 'warning' ? 'bg-orange-500/10' :
                                action.type === 'success' ? 'bg-green-500/10' :
                                    'bg-blue-500/10'
                                }`}>
                                {action.icon}
                            </div>

                            <span className="text-sm text-gray-300 font-medium truncate">{action.text}</span>

                            <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{action.time}</span>

                            <span className={`w-2 h-2 rounded-full ${action.type === 'warning' ? 'bg-orange-500' :
                                action.type === 'success' ? 'bg-green-500' :
                                    'bg-blue-500'
                                }`}></span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AIActionFeed;
