import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { checkSmartctl } from '../../api/client';

const SetupWizard = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [platform, setPlatform] = useState('unknown');
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        // Detect platform for instructions
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf("Mac") !== -1) setPlatform("mac");
        else if (userAgent.indexOf("Linux") !== -1) setPlatform("linux");
        else if (userAgent.indexOf("Win") !== -1) setPlatform("windows");

        if (isOpen) {
            verifyInstallation();
        }
    }, [isOpen]);

    const verifyInstallation = async () => {
        setChecking(true);
        try {
            const res = await checkSmartctl();
            setStatus(res);
            if (res.available) {
                setStep(3); // Success step
                if (onComplete) onComplete();
            } else {
                setStep(2); // Instruction step
            }
        } catch (err) {
            console.error("Check failed", err);
        } finally {
            setChecking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[#0B101B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-[#111827] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">System Setup</h3>
                            <p className="text-xs text-slate-500">Dependency Installation Wizard</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto">

                    {/* Step 1: Checking */}
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm">Verifying system dependencies...</p>
                        </div>
                    )}

                    {/* Step 2: Instructions */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-400 mb-1">Missing Component: smartctl</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Sentinel Pro requires <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">smartmontools</code> to read low-level drive health data.
                                        Without it, the app will run in <b>Simulated Mode</b>.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">1</span>
                                    Install Command
                                </h4>

                                <div className="bg-[#050914] rounded-lg border border-white/10 p-4 font-mono text-sm relative group">
                                    {platform === 'mac' && (
                                        <span className="text-emerald-400">brew install smartmontools</span>
                                    )}
                                    {platform === 'linux' && (
                                        <span className="text-emerald-400">sudo apt-get install smartmontools</span>
                                    )}
                                    {platform === 'windows' && (
                                        <div className="space-y-3">
                                            <p className="text-xs text-slate-400 mb-2">Choose your preferred installer:</p>
                                            {/* Option A: winget */}
                                            <div className="bg-[#050914] rounded-lg border border-white/10 p-3">
                                                <p className="text-[10px] text-slate-500 mb-1">Option A — Windows Package Manager (recommended)</p>
                                                <span className="text-emerald-400 font-mono text-sm">winget install smartmontools</span>
                                            </div>
                                            {/* Option B: chocolatey */}
                                            <div className="bg-[#050914] rounded-lg border border-white/10 p-3">
                                                <p className="text-[10px] text-slate-500 mb-1">Option B — Chocolatey</p>
                                                <span className="text-emerald-400 font-mono text-sm">choco install smartmontools</span>
                                            </div>
                                            {/* Option C: manual */}
                                            <div className="bg-[#050914] rounded-lg border border-white/10 p-3">
                                                <p className="text-[10px] text-slate-500 mb-1">Option C — Manual installer (.exe)</p>
                                                <a href="https://www.smartmontools.org/wiki/Download" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono text-sm">
                                                    smartmontools.org/wiki/Download ↗
                                                </a>
                                            </div>
                                            {/* Admin warning */}
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 mt-2">
                                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-400">Run as Administrator</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        After installing, restart the backend in an <strong className="text-white">elevated (Admin) terminal</strong>.
                                                        Windows blocks raw disk access without admin rights.
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Docker WSL2 tip */}
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                                                <span className="text-blue-400 text-sm flex-shrink-0">🐳</span>
                                                <p className="text-[10px] text-slate-400">
                                                    <strong className="text-blue-400">Using Docker?</strong> Run{' '}
                                                    <code className="text-white bg-black/30 px-1 rounded">windows_setup\setup-windows.ps1</code>{' '}
                                                    as Administrator to automatically mount your drives into WSL2.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {platform === 'unknown' && (
                                        <span className="text-slate-400"># Please install smartmontools for your OS</span>
                                    )}
                                </div>

                                {platform === 'mac' && (
                                    <p className="text-xs text-slate-500 pl-7">
                                        Note: You may need to run the backend with <code className="text-slate-400">sudo</code> to access physical drives.
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Skip for Now
                                </button>
                                <button
                                    onClick={verifyInstallation}
                                    disabled={checking}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                                >
                                    {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Check Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">System Ready</h3>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                    Dependencies verified. Sentinel Pro can now access real drive diagnostics.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-8 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all"
                            >
                                Launch Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
