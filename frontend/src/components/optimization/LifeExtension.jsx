import React from 'react';

const LifeExtension = ({ data }) => {
    if (!data) return <div className="p-4 text-gray-400">Loading life extension data...</div>;

    const { interventions, total_days_extended, baseline_remaining_days, current_remaining_days } = data;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Summary Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 flex flex-col items-center justify-center">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Baseline Life</h3>
                    <p className="text-3xl font-bold text-gray-200">{baseline_remaining_days || '?'} <span className="text-sm font-normal text-gray-500">Days</span></p>
                </div>
                <div className="card p-6 flex flex-col items-center justify-center relative overflow-hidden ring-1 ring-green-500/50">
                    <div className="absolute inset-0 bg-green-500/10 blur-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                    <h3 className="text-green-400 text-xs uppercase tracking-wider font-bold mb-2 z-10">Life Extended By</h3>
                    <div className="flex items-baseline gap-1 z-10">
                        <span className="text-4xl font-bold text-green-400">+{total_days_extended}</span>
                        <span className="text-sm font-bold text-green-500/70">Days</span>
                    </div>
                </div>
                <div className="card p-6 flex flex-col items-center justify-center">
                    <h3 className="text-white text-xs uppercase tracking-wider font-semibold mb-2">Total Projected Life</h3>
                    <p className="text-3xl font-bold text-white shadow-green-500/50 drop-shadow-sm">{current_remaining_days || '?'} <span className="text-sm font-normal text-gray-500">Days</span></p>
                </div>
            </div>

            {/* Intervention Timeline */}
            <div className="card lg:col-span-2 p-8">
                <h3 className="text-lg font-semibold text-white mb-8 border-b border-gray-700/50 pb-4">Intervention Timeline</h3>
                <div className="relative border-l-2 border-gray-700/50 ml-3 space-y-10 pb-4">
                    {interventions.length === 0 ? (
                        <div className="ml-8 py-8 text-gray-400 italic flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                                <span className="text-gray-500">i</span>
                            </div>
                            No interventions recorded yet.
                        </div>
                    ) : (
                        interventions.map((event, index) => (
                            <div key={index} className="ml-8 relative group">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[41px] bg-gray-900 border-4 border-blue-600 rounded-full w-5 h-5 mt-1.5 shadow-[0_0_10px_rgba(37,99,235,0.5)] group-hover:scale-110 transition-transform"></div>

                                <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                                        <h4 className="text-blue-400 font-bold tracking-wide text-sm">{event.type.replace('_', ' ').toUpperCase()}</h4>
                                        <span className="text-gray-400 text-xs font-mono bg-gray-900 px-2 py-1 rounded border border-gray-700">{event.date}</span>
                                    </div>
                                    <p className="text-gray-300 mb-3">{event.description}</p>

                                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 border-t border-gray-700/50 pt-3">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                            Trigger Health: {event.health_at_trigger}/100
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                            Write Reduction: {(event.write_reduction_achieved * 100).toFixed(0)}%
                                        </span>
                                        <span className="ml-auto text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                                            +{event.days_gained} Days Gained
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Impact Explanation */}
            <div className="lg:col-span-2 bg-gradient-to-r from-blue-900/20 to-gray-800/50 p-6 rounded-xl border border-blue-500/20">
                <div className="flex gap-4">
                    <div className="hidden sm:flex w-12 h-12 rounded-lg bg-blue-500/20 items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">How It Works</h3>
                        <p className="text-gray-300 leading-relaxed text-sm">
                            SENTINEL-DISK Pro monitors drive health in real-time. When degradation is detected, the <strong className="text-white">Intelligent Coordinator</strong> triggers the Compression AI to reduce write operations.
                            Fewer writes mean less mechanical wear and tear, extending the lifespan.
                        </p>
                        <div className="mt-3">
                            <code className="bg-gray-900 px-3 py-1.5 rounded border border-gray-700 text-xs text-blue-300 font-mono">
                                Extended Days = Baseline × (1 + Reduction% × 0.4)
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LifeExtension;
