import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Database, Image, FileText, Film, HardDrive, Zap, CheckCircle, BarChart2, TrendingUp } from 'lucide-react';
import FileHistogramModal from '../health/FileHistogramModal';

const CompressionAnalytics = ({ data, driveId, onOptimize, writeOpsHistory = [] }) => {
    const [optimizing, setOptimizing] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState(null);

    if (!data) return <div className="p-8 text-gray-400 text-center animate-pulse">Initializing analytics context...</div>;

    const { total_files = 0, total_size_gb = 0, compressed_size_gb = 0, space_saved_gb = 0, by_file_type = [], recommendations = [], write_reduction_pct } = data;
    // Extract logical write_ops_history if not passed props, though typically it might be in data properties 
    // But we are sticking to the destructuring pattern we set up.

    // Ensure writeOpsHistory is populated from data if not passed as prop (fallback)
    const effectiveHistory = writeOpsHistory.length > 0 ? writeOpsHistory : (data.write_ops_history || []);

    // Data handling
    const pieData = by_file_type.map(item => {
        const typeLower = item.type.toLowerCase();
        let color = '#94a3b8'; // default slate-400
        if (typeLower.includes('image')) color = '#22d3ee';      // Cyan (Images)
        else if (typeLower.includes('data') || typeLower.includes('sql')) color = '#f472b6'; // Pink (Database)
        else if (typeLower.includes('doc') || typeLower.includes('text')) color = '#3b82f6'; // Blue (Documents)
        else if (typeLower.includes('video') || typeLower.includes('media')) color = '#a855f7'; // Purple (Media)

        return {
            name: item.type,
            value: item.size_gb,
            color
        };
    }).filter(d => d.value > 0);

    const handleOptimizeClick = async () => {
        setOptimizing(true);
        if (onOptimize) await onOptimize();
        setOptimizing(false);
    }

    return (
        <div className="space-y-5 pb-6">

            {/* ── Row 1: Key Metrics (3 Cards) ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Total Space Saved */}
                <div className="card p-5 relative overflow-hidden group animate-fade-in">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                            +33%
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Space Saved</div>
                        <div className="text-3xl font-bold text-white font-numbers mt-1">
                            {(space_saved_gb || 0).toFixed(1)} <span className="text-sm text-slate-500 font-sans">GB</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Write Reduction */}
                <div className="card p-5 relative overflow-hidden group animate-fade-in delay-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider">
                            High Efficiency
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Write Reduction</div>
                        <div className="text-3xl font-bold text-white font-numbers mt-1">
                            {parseFloat(write_reduction_pct || 0).toFixed(1)} <span className="text-sm text-slate-500 font-sans">%</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Files Processed */}
                <div className="card p-5 relative overflow-hidden group animate-fade-in delay-200">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                            Active
                        </span>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Files Processed</div>
                        <div className="text-3xl font-bold text-white font-numbers mt-1">
                            {(total_files / 1000).toFixed(1)} <span className="text-sm text-slate-500 font-sans">k</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Visual Analytics ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in delay-300">

                {/* Distribution Chart */}
                <div className="card p-5 h-[320px] flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Distribution</h3>
                    </div>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={4}
                                    stroke="none"
                                    onClick={(data) => {
                                        setSelectedFileType(data.name);
                                    }}
                                    cursor="pointer"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0B101B', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-bold text-white font-numbers">{total_size_gb}</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total GB</span>
                        </div>
                    </div>
                </div>

                {/* Compression Efficiency */}
                <div className="card p-5 h-[320px] flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Compression Efficiency</h3>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={by_file_type}
                                layout="vertical"
                                margin={{ left: 20, right: 30, top: 10, bottom: 0 }}
                                barCategoryGap={15}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        setSelectedFileType(data.activePayload[0].payload.type);
                                    }
                                }}
                                cursor="pointer"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="type" type="category" width={80} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} fontWeight={500} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[#0B101B] border border-white/10 p-2 rounded shadow-xl text-xs">
                                                    <div className="font-bold text-slate-300 mb-1">{payload[0].payload.type}</div>
                                                    <div className="text-blue-400">Compressed: {payload[0].value.toFixed(1)} GB</div>
                                                    <div className="text-slate-500">Original: {payload[1].value.toFixed(1)} GB</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="compressed_gb" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={12} name="Compressed" />
                                <Bar dataKey="original_gb" stackId="a" fill="#334155" radius={[0, 4, 4, 0]} barSize={12} name="Original Size" />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                <div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Compressed
                            </div>
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                <div className="w-2 h-2 bg-slate-700 rounded-sm"></div> Original
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 3: Active Recommendations ─────────────────────────────────── */}
            <div className="card p-0 animate-fade-in delay-500">
                <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Recommendations</h3>
                    </div>

                    {/* The NEW Optimization Button location */}
                    <button
                        onClick={handleOptimizeClick}
                        disabled={optimizing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-blue-400/20 shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
                    >
                        {optimizing ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-3 h-3" />
                                AI-Optimize
                            </>
                        )}
                    </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.length > 0 ? recommendations.map((rec, index) => (
                        <div key={index} className="p-4 rounded-lg border border-white/5 bg-slate-800/20 hover:border-blue-500/30 transition-colors group cursor-default">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${index === 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    index === 1 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                    {index === 0 ? 'Medium' : index === 1 ? 'Low' : 'High'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Suggestion</span>
                            </div>
                            <h4 className="text-sm font-medium text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">{rec.action}</h4>
                            <p className="text-xs text-slate-500 mb-4">Reduce active writes by compressing older logs.</p>
                            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                                <CheckCircle className="w-3 h-3" />
                                Save {rec.potential_savings_gb} GB
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center py-8 text-slate-500 text-xs uppercase tracking-widest">
                            System Optimized. No actions pending.
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 4: Write Reduction History ────────────────────────────────── */}
            <div className="card p-5 h-[300px] flex flex-col animate-fade-in delay-700">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Write Reduction History (Learning Curve)</h3>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={effectiveHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0B101B', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">{value}</span>}
                            />
                            <Line
                                type="monotone"
                                dataKey="writes"
                                name="Writes Saved (TB)"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#0B101B', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#3b82f6' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="reduction"
                                name="Efficiency %"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#0B101B', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#10b981' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {selectedFileType && (
                <FileHistogramModal
                    type={selectedFileType}
                    onClose={() => setSelectedFileType(null)}
                />
            )}
        </div>
    );
};

export default CompressionAnalytics;
