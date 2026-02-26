import React, { useState, useEffect } from 'react';

const AIActionFeed = ({ interventions = [], isSimulated = false }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Map backend interventions to feed format
        const interventionEvents = interventions.map(inv => ({
            id: inv.id || `inv-${Math.random()}`,
            icon: '⚡',
            message: `Intervention: ${inv.action.compression_mode} mode`,
            subtext: `Triggered by: ${inv.trigger.reason}`,
            time: inv.date_human ? inv.date_human.split(' at ')[1] : 'Just now',
            type: 'critical',
            timestamp: new Date(inv.timestamp).getTime()
        }));

        // System startup event
        const startupEvent = {
            id: 'startup',
            icon: '✓',
            message: `System AI Online ${isSimulated ? '(Simulation Mode)' : '(Active Monitoring)'}`,
            subtext: 'Core services operational.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'success',
            timestamp: Date.now() - 100000
        };

        // Combine and sort
        const allEvents = [startupEvent, ...interventionEvents].sort((a, b) => b.timestamp - a.timestamp);

        // If empty (besides startup), add some initial "Scanning" logs if simulated
        if (allEvents.length === 1 && isSimulated) {
            setEvents([
                { id: 'scan-1', icon: '🔍', message: 'Predictive Health Scan Active', subtext: 'Monitoring blocks...', time: 'Now', type: 'info', timestamp: Date.now() },
                startupEvent
            ]);
        } else {
            setEvents(allEvents.slice(0, 10)); // Keep last 10
        }

    }, [interventions, isSimulated]);

    return (
        <div className="ai-feed-container -mx-6 mt-8">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="feed-header">
                    <h3 className="feed-title">AI Action Feed</h3>
                    <span className="live-badge">
                        <span className="pulse-dot"></span> LIVE
                    </span>
                </div>

                <div className="feed-list">
                    {events.length === 0 ? (
                        <div className="text-center text-gray-500 py-4 italic">No recent AI actions recorded.</div>
                    ) : (
                        events.map(action => (
                            <div key={action.id} className={`feed-item ${action.type}`}>
                                <div className="feed-icon">{action.icon}</div>
                                <div className="feed-content">
                                    <div className="feed-message">{action.message}</div>
                                    <div className="feed-subtext">{action.subtext}</div>
                                </div>
                                <div className="feed-time">{action.time}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIActionFeed;
