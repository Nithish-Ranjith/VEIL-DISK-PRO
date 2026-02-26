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

    // Human-readable category labels
    const CATEGORY_LABELS = {
        text: 'Text & Code',
        documents: 'Office Docs',
        pdf: 'PDF Files',
        images_lossless: 'Lossless Images',
        databases: 'Databases',
        archives_recompressible: 'Archives',
        skip: 'Already Compressed',
    };

    // Pie: Exclude already-compressed files — they skew everything
    const pieData = by_file_type
        .filter(item => !item.type.toLowerCase().includes('skip'))
        .map(item => {
            const typeLower = item.type.toLowerCase();
            let color = '#6366f1';
            if (typeLower.includes('image')) color = '#22d3ee';
            else if (typeLower === 'databases') color = '#f472b6';
            else if (typeLower === 'documents') color = '#3b82f6';
            else if (typeLower === 'text') color = '#a855f7';
            else if (typeLower === 'pdf') color = '#f59e0b';
            else if (typeLower.includes('archive')) color = '#10b981';

            return {
                name: CATEGORY_LABELS[item.type] || item.type,
                value: item.size_gb,
                savings: item.saved_gb,
                color,
            };
        }).filter(d => d.value > 0);

    // Bar chart: savings by category (sorted by savings desc)
    const savingsData = [...by_file_type]
        .filter(item => !item.type.toLowerCase().includes('skip') && item.saved_gb > 0)
        .map(item => ({
            label: CATEGORY_LABELS[item.type] || item.type,
            savings: item.saved_gb,
            size: item.size_gb,
        }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 6);

    // Max value for bar scaling
    const maxSavings = savingsData.length > 0 ? savingsData[0].savings : 1;

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

                {/* Distribution Chart — compressible files only, skip excluded */}
                <div className="card p-5 h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">File Distribution</h3>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">compressible files only</span>
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
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={4}
                                    stroke="none"
                                    onClick={(data) => setSelectedFileType(data.name)}
                                    cursor="pointer"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} className="hover:opacity-100 transition-opacity" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0d1624', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val, name, props) => [`${val.toFixed(1)} GB  ·  saves ${(props.payload.savings || 0).toFixed(1)} GB`, props.payload.name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-medium text-slate-400 ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-bold text-white font-numbers">{total_size_gb}</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total GB</span>
                        </div>
                    </div>
                </div>

                {/* Compression Savings — horizontal bars, sorted by savings */}
                <div className="card p-5 h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Savings by Category</h3>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">top {savingsData.length} types</span>
                    </div>
                    {savingsData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest">
                            No compressible data found
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto pr-1">
                            {savingsData.map((item, idx) => {
                                const pct = maxSavings > 0 ? (item.savings / maxSavings) * 100 : 0;
                                const colors = ['#6366f1', '#3b82f6', '#22d3ee', '#10b981', '#f59e0b', '#a855f7'];
                                const col = colors[idx % colors.length];
                                return (
                                    <div key={item.label} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-200 transition-colors">{item.label}</span>
                                            <span className="text-[11px] font-mono font-bold" style={{ color: col }}>
                                                -{item.savings.toFixed(1)} GB
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, backgroundColor: col }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Active Recommendations (with scroll fade) ─────────────────────── */}
            <div className="card p-0 animate-fade-in delay-500 relative">
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
