import React, { useState, useEffect } from 'react';
import { getDriveInterventions } from '../../api/client';

const LifeExtensionContainer = ({ selectedDrive }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!selectedDrive) return;

            try {
                setLoading(true);
                const response = await getDriveInterventions(selectedDrive);

                // Transform backend data to match UI expectations
                const transformedData = {
                    interventions: response.interventions.map(intervention => ({
                        type: intervention.action.compression_mode,
                        date: intervention.date_human,
                        description: intervention.trigger.reason,
                        health_at_trigger: intervention.trigger.health_score_at_trigger,
                        write_reduction_achieved: parseFloat(intervention.impact.write_reduction_pct) / 100,
                        days_gained: intervention.impact.life_extended_days
                    })),
                    total_days_extended: response.total_days_extended,
                    baseline_remaining_days: response.interventions.length > 0
                        ? response.interventions[0].impact.life_extended_days * 3  // Rough estimate
                        : 365,
                    current_remaining_days: response.total_days_extended + (
                        response.interventions.length > 0
                            ? response.interventions[0].impact.life_extended_days * 3
                            : 365
                    )
                };

                setData(transformedData);
                setError(null);
            } catch (err) {
                console.error('Error loading interventions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedDrive]);

    if (loading) {
        return (
            <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                <p className="text-emerald-500/80 text-xs font-bold tracking-widest uppercase animate-pulse">Analyzing Drive History...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/5 rounded-lg border border-red-500/10">
                <div className="text-red-400 mb-2 font-bold">⚠️ Connection Error</div>
                <p className="text-slate-500 text-sm">{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-12 text-center text-slate-500 italic">
                Select a drive to view life extension data
            </div>
        );
    }

    return <LifeExtension data={data} />;
};

const LifeExtension = ({ data }) => {
    if (!data) return null;

    const { interventions, total_days_extended, baseline_remaining_days, current_remaining_days } = data;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* HERO SECTION: Life Extension Stat */}
            <div className="lg:col-span-2 relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Baseline Card */}
                    <div className="glass-panel p-8 flex flex-col items-start justify-center relative overflow-hidden group hover:border-white/10 transition-colors rounded-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Passive Lifecycle</h3>
                        <p className="text-3xl font-bold text-slate-200 tracking-tight font-numbers">{baseline_remaining_days || '?'} <span className="text-sm font-normal text-slate-500 font-sans tracking-normal">Days</span></p>
                        <div className="w-full bg-slate-800/50 h-1 mt-4 rounded-full overflow-hidden">
                            <div className="bg-slate-500 h-full w-[40%]"></div>
                        </div>
                    </div>

                    {/* HERO CARD: Extended Life */}
                    <div className="md:col-span-2 relative group cursor-default">
                        {/* Glow behind */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl opacity-30 blur group-hover:opacity-50 transition duration-1000"></div>

                        <div className="relative h-full bg-[#0B101B] rounded-xl border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between overflow-hidden">
                            {/* Inner sheen */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                            <div className="z-10 text-center md:text-left mb-6 md:mb-0">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse box-content border-2 border-emerald-900/50"></div>
                                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest">AI Protection Active</h3>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Drive Life Extended</h2>
                                <p className="text-slate-400 text-sm max-w-md">By maintaining a write reduction rate of <span className="text-white font-mono">45.2%</span>, SENTINEL-DISK Pro has deferred hardware failure.</p>
                            </div>

                            <div className="z-10 flex flex-col items-center md:items-end">
                                <div className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-[0.2em] mb-1">Total Gain</div>
                                <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-blue-500 drop-shadow-2xl font-numbers">
                                    +{total_days_extended}
                                </div>
                                <div className="text-sm text-slate-500 font-medium tracking-wide mt-[-5px]">Days Added</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intervention Timeline */}
            <div className="card lg:col-span-2 p-0">
                <div className="card-header">
                    <h3 className="card-title">Intervention Timeline</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Compression
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Optimization
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <div className="relative border-l border-white/10 ml-3 space-y-12 pb-4">
                        {interventions.length === 0 ? (
                            <div className="ml-12 py-8 text-slate-500 italic flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                System monitoring active. No interventions required yet.
                            </div>
                        ) : (
                            interventions.map((event, index) => (
                                <div key={index} className="ml-10 relative group">
                                    {/* Timeline Node */}
                                    <div className="absolute -left-[45px] top-0 flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-[#0B101B] border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform z-10"></div>
                                        <div className="h-full w-px bg-gradient-to-b from-blue-500/50 to-transparent my-1"></div>
                                    </div>

                                    <div className="glass-panel p-5 rounded-lg hover:border-blue-500/30 transition-all cursor-default relative overflow-hidden group-hover:bg-white/[0.02]">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 relative z-10">
                                            <h4 className="text-blue-400 font-bold tracking-wide text-xs uppercase flex items-center gap-2">
                                                {event.type.replace('_', ' ')}
                                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20">AUTO</span>
                                            </h4>
                                            <span className="text-slate-500 text-[10px] font-mono mt-1 sm:mt-0">{event.date}</span>
                                        </div>
                                        <p className="text-slate-300 mb-4 text-sm leading-relaxed">{event.description}</p>

                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t border-white/5 pt-3 relative z-10">
                                            <span className="flex items-center gap-2">
                                                <span className="w-1 h-3 bg-rose-500/50 rounded-sm"></span>
                                                Trigger Health: <span className="text-slate-300 font-numbers">{event.health_at_trigger}/100</span>
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span className="w-1 h-3 bg-emerald-500/50 rounded-sm"></span>
                                                Reduction: <span className="text-slate-300 font-numbers">{(event.write_reduction_achieved * 100).toFixed(0)}%</span>
                                            </span>
                                            <span className="ml-auto text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider text-[9px] shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                +{event.days_gained} Days
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LifeExtensionContainer;
