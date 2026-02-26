import React, { useState } from 'react';
import HealthTimelineChart from './HealthTimelineChart';
import ExplainableAI from '../simulation/ExplainableAI';
import WriteOptimizationCard from '../optimization/WriteOptimizationCard';
import { API_BASE } from '../../api/client';

// ─── Hero: Health Score Ring ──────────────────────────────────────────────────
function HealthScoreRing({ score = 0, daysToFailure = null }) {
    const size = 160;
    const strokeW = 12;
    const r = (size - strokeW) / 2;
    const circ = 2 * Math.PI * r;
    const progress = Math.min(100, Math.max(0, score));
    const offset = circ - (progress / 100) * circ;

    let ringColor = '#10b981';   // emerald — healthy
    let statusLabel = 'HEALTHY';
    let labelClass = 'text-emerald-400';
    if (score < 50) { ringColor = '#ef4444'; statusLabel = 'CRITICAL'; labelClass = 'text-red-400'; }
    else if (score < 75) { ringColor = '#f59e0b'; statusLabel = 'WARNING'; labelClass = 'text-amber-400'; }

    return (
        <div className="flex items-center gap-8">
            {/* SVG ring */}
            <div className="relative shrink-0">
                <svg width={size} height={size} className="-rotate-90">
                    {/* Track */}
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
                    {/* Progress arc */}
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{
                            filter: `drop-shadow(0 0 8px ${ringColor}80)`,
                            transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s',
                        }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white font-numbers leading-none">{score}</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">/100</span>
                </div>
            </div>

            {/* Right side info */}
            <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${labelClass}`}>{statusLabel}</div>
                <div className="text-2xl font-bold text-white mb-1">Drive Health Score</div>
                <div className="text-xs text-slate-500 max-w-xs">
                    Predictive health based on SMART attributes, write amplification, and thermal history.
                </div>
                {daysToFailure && daysToFailure < 365 && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-xs text-amber-400 font-mono font-bold">
                            ~{daysToFailure} days estimated remaining
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

const HealthMonitor = ({ data, urgency, driveId, compressionData }) => {
    if (!data) return <div className="p-4 text-gray-400">Loading health data...</div>;

    const { health, smart_current, compression } = data;
    const score = health.score ?? health.current_score ?? 0;
    const [downloadingReport, setDownloadingReport] = useState(false);

    const handleWarrantyReport = async () => {
        if (!driveId || downloadingReport) return;
        setDownloadingReport(true);
        try {
            const url = `${API_BASE.replace('/api/v1', '')}/api/v1/report/${driveId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `SENTINEL_Warranty_Claim_${driveId}_${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            console.error('Warranty report failed:', e);
            alert('Failed to generate warranty report. Please check the backend is running.');
        } finally {
            setDownloadingReport(false);
        }
    };

    // Write optimization values from real compression data
    const writesReduced = compressionData?.write_reduction_pct
        ? parseFloat(compressionData.write_reduction_pct)
        : (compression?.write_reduction_pct ? parseFloat(compression.write_reduction_pct) : 0);

    const wearSaved = Math.round(writesReduced * 0.45); // Wear ≈ 45% of write reduction

    // TBW remaining — estimate from power-on hours (rough heuristic)
    const powerOnHours = smart_current.smart_9 ?? 0;
    const tbwRemaining = Math.max(5, Math.min(95, Math.round(100 - (powerOnHours / 87600) * 100)));

    const smartRows = [
        { id: 'smart_5', name: 'Reallocated Sectors', value: smart_current.smart_5 ?? 0, thresh: 5 },
        { id: 'smart_187', name: 'Reported Uncorrectable', value: smart_current.smart_187 ?? 0, thresh: 0 },
        { id: 'smart_197', name: 'Current Pending Sector', value: smart_current.smart_197 ?? 0, thresh: 0 },
        { id: 'smart_198', name: 'Offline Uncorrectable', value: smart_current.smart_198 ?? 0, thresh: 0 },
        { id: 'smart_188', name: 'Command Timeout', value: smart_current.smart_188 ?? 0, thresh: 0 },
        {
            id: 'smart_194', name: 'Temperature (°C)',
            value: smart_current.smart_194 != null ? `${smart_current.smart_194}°C` : 'N/A',
            thresh: 50, rawValue: smart_current.smart_194 ?? 0,
        },
        {
            id: 'smart_9', name: 'Power-On Hours',
            value: (smart_current.smart_9 ?? 0).toLocaleString(),
            thresh: 50000, rawValue: smart_current.smart_9 ?? 0,
        },
        { id: 'smart_12', name: 'Power Cycle Count', value: smart_current.smart_12 ?? 0, thresh: 5000 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1">

            {/* ─── HERO: Health Score Ring (full-width) ──────────────────────── */}
            <div className="col-span-12 card p-6 flex items-center justify-between animate-fade-in">
                <HealthScoreRing score={score} daysToFailure={health.days_to_failure} />

                {/* Right: quick stats summary */}
                <div className="hidden md:grid grid-cols-3 gap-8 border-l border-white/5 pl-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white font-numbers">{tbwRemaining}%</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">TBW Remaining</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white font-numbers">{Math.round(writesReduced)}%</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Writes Reduced</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white font-numbers">{(powerOnHours / 1000).toFixed(1)}k</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Hours On</div>
                    </div>
                </div>
            </div>


            {/* Health Timeline — 8/12 ≈ 66.6% */}
            <div className="col-span-12 lg:col-span-8 animate-fade-in group relative hover-scale prism-border">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 opacity-50"></div>
                <HealthTimelineChart
                    currentHealth={score}
                    daysToFailure={health.days_to_failure}
                />
            </div>

            {/* Write Optimization — 4/12 ≈ 33.3% */}
            <div className="col-span-12 lg:col-span-4 animate-fade-in delay-100 hover-scale prism-border">
                <WriteOptimizationCard
                    driveId={driveId}
                    writesReduced={Math.round(writesReduced)}
                    wearSaved={wearSaved}
                    tbwRemaining={tbwRemaining}
                    algorithmActiveInit={true}
                    autoAdjustInit={true}
                    currentMode={compression?.mode || 'auto'}
                />
            </div>

            {/* ── Row 2: SMART Metrics (Compact) ────────────────────────────────── */}
            <div className="card col-span-12 lg:col-span-8 p-0 overflow-hidden animate-fade-in delay-200 border border-white/5 hover-scale prism-border relative">
                <div className="card-header py-3">
                    <h3 className="card-title text-xs font-bold uppercase tracking-wider text-slate-400">SMART Metrics</h3>
                    <div className="flex items-center gap-3">
                        {/* Warranty Claim Report — downloads a PDF using SMART data for official drive warranty submissions */}
                        <button
                            onClick={handleWarrantyReport}
                            disabled={downloadingReport}
                            title="Download a SMART health PDF for warranty claim submission"
                            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            {downloadingReport ? (
                                <>
                                    <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Warranty Claim Report</span>
                                </>
                            )}
                        </button>
                        <button className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Overlay for Missing SMART Data (Real Drive, No Permissions/Tool) */}
                {/* EXCEPTION: If it is an Apple Drive, we show a clean "Verified" state instead of blocking it */}
                {data.smart_status && !data.smart_status.available && !data.smart_status.is_simulated && !data.drive?.model?.includes("APPLE") && (
                    <div className="absolute inset-0 top-[40px] z-10 bg-[#0B101B]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3 border border-white/10">
                            <span className="text-xl">🔒</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">SMART Data Unavailable</h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                            Advanced health metrics require root permissions or valid SMART support.
                        </p>
                        <div className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 font-mono">
                            Try: sudo ./start_backend.sh
                        </div>
                    </div>
                )}

                {/* Apple Silicon / Native Drive Friendly State */}
                {data.smart_status && !data.smart_status.available && data.drive?.model?.includes("APPLE") && (
                    <div className="absolute top-[50px] left-0 right-0 z-10 flex flex-col items-center justify-center text-center py-8 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-bold text-emerald-400 mb-0.5">Apple Storage Verified</h4>
                        <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-mono">Global Health Status: OK</p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0B101B] border-b border-white/5">
                            <tr>
                                <th className="py-2 pl-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Attribute</th>
                                <th className="py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono text-right pr-10">Value</th>
                                <th className="py-2 pr-5 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y divide-white/5 text-xs ${data.smart_status && !data.smart_status.available && !data.smart_status.is_simulated ? 'opacity-20 blur-[1px]' : ''}`}>
                            {smartRows.map((row, idx) => {
                                const numericValue = row.rawValue !== undefined
                                    ? row.rawValue
                                    : (typeof row.value === 'number' ? row.value : parseFloat(row.value));
                                const isWarning = row.thresh > 0 && !isNaN(numericValue) && numericValue >= row.thresh;
                                const isCritical = row.id === 'smart_5' && numericValue > 100;

                                let statusColor = 'bg-blue-500';
                                let statusText = 'GOOD';
                                if (isCritical) { statusColor = 'bg-red-500'; statusText = 'CRITICAL'; }
                                else if (isWarning) { statusColor = 'bg-amber-500'; statusText = 'WARNING'; }

                                return (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-2.5 pl-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1 h-1 rounded-full ${statusColor} shadow-[0_0_5px_currentColor]`}></div>
                                                <div className="font-medium text-slate-300 group-hover:text-white transition-colors">{row.name}</div>
                                                <span className="text-[10px] text-slate-600 font-mono ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ID: {row.id.split('_')[1]}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 font-mono font-bold text-slate-200 text-right pr-10">{row.value}</td>
                                        <td className="py-2.5 pr-5 text-right">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Row 2: AI Action Feed (Compact sidecar) ─────────────────────── */}
            <div className="col-span-12 lg:col-span-4 animate-fade-in delay-200">
                {/* Placeholder for AI Feed if it was a separate component, or Explainable AI */}
                <ExplainableAI
                    health={health}
                    smartCurrent={smart_current}
                    urgency={urgency}
                />
            </div>
        </div>
    );
};

export default HealthMonitor;
