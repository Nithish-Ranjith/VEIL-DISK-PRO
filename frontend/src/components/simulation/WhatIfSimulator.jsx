/**
 * WhatIfSimulator — Interactive Sandbox ("Tactical Edition")
 * Allows users to adjust SMART values and see how they affect health score & life expectancy.
 * Uses real current SMART data as baseline.
 */
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { RefreshCw, Play, RotateCcw, Activity, AlertTriangle } from 'lucide-react';

const SMART_ATTRIBUTES = [
    { id: 'smart_5', name: 'Reallocated Sectors', min: 0, max: 200, unit: '' },
    { id: 'smart_187', name: 'Reported Uncorrectable', min: 0, max: 50, unit: '' },
    { id: 'smart_188', name: 'Command Timeout', min: 0, max: 20, unit: '' },
    { id: 'smart_197', name: 'Current Pending Sector', min: 0, max: 50, unit: '' },
    { id: 'smart_198', name: 'Offline Uncorrectable', min: 0, max: 50, unit: '' },
    { id: 'smart_194', name: 'Temperature', min: 10, max: 80, unit: '°C' },
    { id: 'smart_9', name: 'Power-On Hours', min: 0, max: 100000, unit: 'hrs' },
    { id: 'smart_12', name: 'Power Cycle Count', min: 0, max: 10000, unit: '' },
];

const calculateHealth = (smartValues) => {
    let health = 100;
    health -= (smartValues.smart_5 || 0) * 0.5;
    health -= (smartValues.smart_187 || 0) * 2;
    health -= (smartValues.smart_197 || 0) * 1.5;
    health -= (smartValues.smart_198 || 0) * 1.5;
    const temp = smartValues.smart_194 || 25;
    if (temp > 60) health -= (temp - 60) * 0.5;
    if (temp > 70) health -= (temp - 70) * 1.0;
    return Math.max(0, Math.min(100, Math.round(health)));
};

const calculateDaysToFailure = (health) => {
    if (health > 80) return 365 + Math.round((health - 80) * 10);
    if (health > 60) return 180 + Math.round((health - 60) * 5);
    if (health > 40) return 90;
    if (health > 20) return 30;
    return Math.max(1, Math.round(health * 0.5));
};

const calculateLifeExtension = (baselineDays, writeReductionPct) => {
    const bonus = baselineDays * (writeReductionPct * 0.4);
    return Math.round(bonus);
};

const WhatIfSimulator = ({ currentSmart }) => {
    const [values, setValues] = useState({});
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (currentSmart) {
            handleReset();
        }
    }, [currentSmart]);

    const handleSliderChange = (id, val) => {
        const newValues = { ...values, [id]: parseFloat(val) };
        setValues(newValues);
        runSimulation(newValues);
    };

    const runSimulation = (simValues) => {
        const health = calculateHealth(simValues);
        const baselineDays = calculateDaysToFailure(health);
        const reductionPct = simValues.write_reduction || 0;
        const daysGained = calculateLifeExtension(baselineDays, reductionPct);

        setResult({
            health_score: health,
            days_to_failure: baselineDays,
            days_gained: daysGained,
            total_days: baselineDays + daysGained,
            risk_level: health < 40 ? 'Critical' : health < 70 ? 'Moderate' : 'Low'
        });
    };

    const handleReset = () => {
        if (!currentSmart) return;
        const initial = {};
        SMART_ATTRIBUTES.forEach(attr => {
            initial[attr.id] = currentSmart[attr.id] || 0;
        });
        initial['write_reduction'] = 0; // Default 0%
        setValues(initial);
        runSimulation(initial);
    };

    if (!result) return <div className="p-12 text-center text-gray-500 animate-pulse font-mono">INITIALIZING TACTICAL SIMULATOR...</div>;

    const isCritical = result.health_score < 40;
    const isWarning = result.health_score >= 40 && result.health_score < 70;

    const gaugeData = [
        { name: 'Score', value: result.health_score, color: isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981' },
        { name: 'Rest', value: 100 - result.health_score, color: 'rgba(255, 255, 255, 0.05)' },
    ];

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 min-h-[600px] transition-all duration-1000 animate-fade-in ${isCritical ? 'bg-red-950/10' : ''}`}>
            {/* ── Left: Controls ── */}
            <div className={`glass-panel lg:col-span-2 p-8 flex flex-col relative overflow-hidden transition-all duration-500 delay-100 animate-fade-in ${isCritical ? 'border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.1)]' : 'border-white/5'}`}>
                {/* Critical Mode Warning Overlay */}
                {isCritical && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"></div>
                )}

                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
                            <div className={`p-2 rounded-lg border ${isCritical ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                                {isCritical ? <AlertTriangle size={20} /> : <Activity size={20} />}
                            </div>
                            Tactical Simulation
                        </h3>
                        <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-wide">Adjust vectors to predict failure horizons</p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-600/20 px-4 py-2 rounded uppercase tracking-widest transition-all"
                    >
                        <RotateCcw size={12} />
                        Reset Data
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 relative z-10">
                    {SMART_ATTRIBUTES.map(attr => (
                        <div key={attr.id} className="group relative">
                            <div className="flex justify-between text-sm mb-3 items-end">
                                <span className={`font-bold text-[10px] uppercase tracking-widest transition-colors ${values[attr.id] > attr.max * 0.8 ? 'text-red-400' : 'text-slate-400 group-hover:text-blue-400'}`}>
                                    {attr.name}
                                </span>
                                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${values[attr.id] > attr.max * 0.8
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                    : 'bg-slate-800/50 text-slate-300 border-white/5'
                                    }`}>
                                    {values[attr.id]} {attr.unit}
                                </span>
                            </div>

                            <div className="relative h-6 flex items-center">
                                {/* Track decorations */}
                                <div className="absolute left-0 right-0 h-px bg-white/10 top-1/2 -translate-y-1/2"></div>
                                <div className="absolute left-0 h-1.5 w-px bg-white/20 top-1/2 -translate-y-1/2"></div>
                                <div className="absolute right-0 h-1.5 w-px bg-white/20 top-1/2 -translate-y-1/2"></div>
                                <div className="absolute left-1/2 h-1 w-px bg-white/10 top-1/2 -translate-y-1/2"></div>

                                <input
                                    type="range"
                                    min={attr.min}
                                    max={attr.max}
                                    step={attr.id === 'smart_194' ? 1 : 1}
                                    value={values[attr.id] || 0}
                                    onChange={(e) => handleSliderChange(attr.id, e.target.value)}
                                    className={`simulator-slider ${values[attr.id] > attr.max * 0.8 ? 'simulator-slider-critical' : ''}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                    <div className="bg-gradient-to-r from-emerald-900/10 to-transparent p-6 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-colors group relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>

                        <div className="flex justify-between text-sm mb-6">
                            <span className="text-emerald-400 font-bold flex items-center gap-2 uppercase tracking-wide text-xs">
                                <RefreshCw className="w-4 h-4" />
                                AI Intervention Factor
                            </span>
                            <span className="text-emerald-400 font-mono font-bold text-xl drop-shadow-lg">{(values['write_reduction'] * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={values['write_reduction'] || 0}
                            onChange={(e) => handleSliderChange('write_reduction', e.target.value)}
                            className="simulator-slider [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        />
                        <div className="flex justify-between mt-2 text-[9px] text-emerald-500/40 font-mono uppercase tracking-widest">
                            <span>Passive</span>
                            <span>Aggressive Optimization</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right: Results Hologram ── */}
            <div className={`card lg:col-span-1 p-0 overflow-hidden flex flex-col relative transition-all duration-500 delay-200 animate-fade-in ${isCritical ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] scale-[1.02]' : 'border-white/10'}`}>
                {/* Status Line */}
                <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${isCritical ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                <div className="p-8 flex-1 flex flex-col items-center justify-center bg-[#080C14] relative overflow-hidden">
                    {/* Holographic Background Glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${isCritical ? 'bg-red-600/20' : isWarning ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                        }`}></div>

                    <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-[0.3em] relative z-10 opacity-70">Prediction Output</h3>

                    <div className="relative w-64 h-64 my-6 z-10 transition-transform duration-500 hover:scale-105">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={gaugeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={85}
                                    startAngle={180}
                                    endAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={4}
                                    paddingAngle={5}
                                >
                                    {gaugeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color})` }} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Failure Probability</div>
                            <span className={`text-6xl font-black transition-colors duration-500 font-numbers ${isCritical ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' :
                                isWarning ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                                    'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                }`}>
                                {(100 - result.health_score).toFixed(1)}%
                            </span>
                            <div className={`mt-2 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                                isWarning ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }`}>
                                {result.risk_level}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="bg-white/5 p-6 border-t border-white/5 backdrop-blur-md relative z-10">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Est. Life Remaining</span>
                        <span className={`font-mono font-bold text-lg ${isCritical ? 'text-red-400' : 'text-white'}`}>
                            {result.days_to_failure > 365 ? '> 1 Year' : `${result.days_to_failure} Days`}
                        </span>
                    </div>

                    {result.days_gained > 0 && (
                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest">AI Extension</span>
                            <span className="text-emerald-400 font-bold font-mono">+{result.days_gained} Days</span>
                        </div>
                    )}

                    {isCritical && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-xs font-medium flex items-center gap-2 animate-pulse">
                            <AlertTriangle size={14} />
                            <span>Immediate Backup Recommended</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatIfSimulator;
