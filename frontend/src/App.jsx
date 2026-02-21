import React, { useState, useEffect, useCallback } from 'react';
import { getDrives, getDriveStatus, getDriveUrgency, getCompressionAnalysis, runOptimization } from './api/client';
import SystemStatusBar from './components/layout/SystemStatusBar';
import Header from './components/layout/Header';
import HealthMonitor from './components/health/HealthMonitor';
import CompressionAnalytics from './components/analytics/CompressionAnalytics';
import LifeExtensionContainer from './components/optimization/LifeExtensionContainer';
import WhatIfSimulator from './components/simulation/WhatIfSimulator';
import AIActionFeed from './components/simulation/AIActionFeed';
import { transformBackendData } from './utils/transformers';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import { Heart, Package, TrendingUp, Target } from 'lucide-react';
import SetupWizard from './components/setup/SetupWizard';


// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'health', icon: Heart, label: 'Health Monitor' },
  { id: 'compression', icon: Package, label: 'Compression Analytics' },
  { id: 'life', icon: TrendingUp, label: 'Life Extension' },
  { id: 'whatif', icon: Target, label: 'What-If Simulator' },
];

const URGENCY_CONFIG = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'AT RISK', icon: '🚨' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'HIGH RISK', icon: '⚠️' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'MONITOR', icon: '🛡️' },
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'HEALTHY', icon: '✅' },
};


// ─── Urgency Banner ───────────────────────────────────────────────────────────
function UrgencyBanner({ urgency }) {
  if (!urgency || urgency.urgency_level === 'low') return null;

  const cfg = {
    critical: { bg: 'bg-red-900/20', border: 'border-red-500/10', text: 'text-red-400', btn: 'bg-red-500/80 hover:bg-red-500' },
    high: { bg: 'bg-orange-900/20', border: 'border-orange-500/10', text: 'text-orange-400', btn: 'bg-orange-500/80 hover:bg-orange-500' },
    medium: { bg: 'bg-yellow-900/20', border: 'border-yellow-500/10', text: 'text-yellow-400', btn: 'bg-yellow-500/80 hover:bg-yellow-500' },
  }[urgency.urgency_level] || {};

  return (
    <div className={`rounded-xl border ${cfg.bg} ${cfg.border} p-4 flex items-center justify-between gap-6 mb-8 glass-panel animate-fade-in`}>
      <div className="flex items-center gap-5">
        <div className="text-2xl opacity-80">{urgency.icon}</div>
        <div>
          <div className={`font-bold text-sm ${cfg.text} tracking-wider uppercase`}>{urgency.message}</div>
          <div className="text-slate-500 text-xs mt-1 font-medium font-mono">
            Health: <span className="text-slate-300">{urgency.health_score}/100</span>
            {' · '}{urgency.days_remaining} days remaining
          </div>
        </div>
      </div>
      <button className={`${cfg.btn} text-white text-[10px] font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all uppercase tracking-widest hover:brightness-110`}>
        {urgency.recommended_action}
      </button>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
// ─── Main Content Wrapper ─────────────────────────────────────────────────────
function AuthenticatedApp() {
  const { user, isLoading: authLoading } = useAuth();
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Existing State
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [currentTab, setCurrentTab] = useState('health');
  const [driveData, setDriveData] = useState(null);
  const [compressionData, setCompressionData] = useState(null);
  const [urgencyData, setUrgencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const urgency = urgencyData ? (URGENCY_CONFIG[urgencyData.urgency_level] || URGENCY_CONFIG.low) : URGENCY_CONFIG.low;

  // Check for smartctl on mount
  useEffect(() => {
    if (user) {
      // Simple check to see if we should show wizard
      // In reality, we'd check the API.
      // For now, let's show it if we are in simulated mode but NOT explicitly dismissed (could use localStorage)
      const wizardSeen = localStorage.getItem('sentinel_wizard_seen');
      if (!wizardSeen) {
        setShowSetupWizard(true);
      }
    }
  }, [user]);

  const closeWizard = () => {
    setShowSetupWizard(false);
    localStorage.setItem('sentinel_wizard_seen', 'true');
  };

  const loadDrives = useCallback(async () => {
    try {
      setError(null);
      const response = await getDrives();
      const list = response.drives || [];
      setDrives(list);

      // If we see all drives are simulated, and we haven't shown wizard, maybe show it?
      // Logic handled by useEffect above for simplicity now.

      if (list.length > 0) {
        // Default to DRIVE_C (critical scenario) for best demo impact
        const driveC = list.find(d => d.drive_id === 'DRIVE_C');
        setSelectedDriveId(driveC ? 'DRIVE_C' : list[0].drive_id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load drives:', err);
      setError('Cannot connect to backend. Make sure the server is running on port 8000.');
      setLoading(false);
    }
  }, []);

  // ... (Rest of existing hooks)

  const loadDriveData = useCallback(async (id) => {
    try {
      const raw = await getDriveStatus(id);
      setDriveData(transformBackendData(raw));
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load drive data:', err);
      setError('Failed to load drive data.');
      setLoading(false);
    }
  }, []);

  const loadUrgency = useCallback(async (id) => {
    try {
      const data = await getDriveUrgency(id);
      setUrgencyData(data);
    } catch (err) {
      console.warn('Urgency fetch failed:', err);
    }
  }, []);

  const loadCompression = useCallback(async (id) => {
    try {
      const data = await getCompressionAnalysis(id);
      const fs = data.filesystem_analysis || {};
      const wr = data.write_reduction || {};
      const totalGb = (fs.total_size_bytes || 0) / 1e9;
      const savedGb = (fs.estimated_savings_bytes || 0) / 1e9;
      const compressedGb = (fs.compressible_size_bytes || 0) / 1e9;

      const byFileType = Object.entries(fs.category_stats || {}).map(([type, stats]) => {
        const sizeGb = parseFloat(((stats.size_bytes || 0) / 1e9).toFixed(1));
        const savedGb = parseFloat(((stats.savings_bytes || 0) / 1e9).toFixed(1));
        return {
          type,
          saved_gb: savedGb,
          size_gb: sizeGb,
          compressed_gb: sizeGb,
          original_gb: parseFloat((sizeGb + savedGb).toFixed(1)),
        };
      });

      const writeOpsHistory = (fs.write_reduction_history || []).map(entry => ({
        date: entry.date,
        writes: entry.writes_saved,
        reduction: entry.reduction
      }));

      const recs = (fs.recommendations || []).map(r => ({
        action: r.description || r.category,
        file_count: r.files_count || 0,
        potential_savings_gb: parseFloat(((r.savings_bytes || 0) / 1e9).toFixed(1)),
      }));

      setCompressionData({
        total_files: fs.total_files || 0,
        compressed_files: fs.compressible_files || 0,
        total_size_gb: parseFloat(totalGb.toFixed(1)),
        compressed_size_gb: parseFloat(compressedGb.toFixed(1)),
        space_saved_gb: parseFloat(savedGb.toFixed(1)),
        write_reduction_pct: wr.total_write_reduction_pct || '0.0%',
        by_file_type: byFileType,
        write_ops_history: writeOpsHistory,
        recommendations: recs,
      });
    } catch (err) {
      console.warn('Compression fetch failed:', err);
    }
  }, []);

  useEffect(() => { loadDrives(); }, [loadDrives]);

  useEffect(() => {
    if (!selectedDriveId) return;

    let interval = null;

    const startPolling = () => {
      loadDriveData(selectedDriveId);
      loadUrgency(selectedDriveId);
      loadCompression(selectedDriveId);
      interval = setInterval(() => {
        if (!document.hidden) {
          loadDriveData(selectedDriveId);
          loadUrgency(selectedDriveId);
        }
      }, 30000);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        loadDriveData(selectedDriveId);
        loadUrgency(selectedDriveId);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [selectedDriveId, loadDriveData, loadUrgency, loadCompression]);

  const handleBackupNow = async () => {
    if (!selectedDriveId || optimizing) return;
    setOptimizing(true);
    try {
      await runOptimization(selectedDriveId);
      await Promise.all([
        loadDriveData(selectedDriveId),
        loadUrgency(selectedDriveId),
        loadCompression(selectedDriveId),
      ]);
    } catch (err) {
      console.error('Optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#050914] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      <SetupWizard isOpen={showSetupWizard} onClose={closeWizard} onComplete={() => { closeWizard(); loadDrives(); }} />
      <SystemStatusBar
        drivesConnected={drives.length}
        dataSource={driveData?.coordinator_status?.data_source || 'simulated'}
      />

      <Header
        onBackupNow={handleBackupNow}
        optimizing={optimizing}
        dataSource={driveData?.coordinator_status?.data_source || 'simulated'}
      />

      {/* 2.2 Navigation Bar */}
      <nav className="h-14 px-8 bg-[#0B101B]/80 backdrop-blur-md border-b-[0.5px] border-white/[0.08] flex items-center gap-8 sticky top-16 z-40">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentTab(id)}
            className={`h-full flex items-center gap-3 px-2 border-b-2 text-sm font-medium transition-all duration-300 ${currentTab === id
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
              } `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* 2.3 Context Bar */}
      <div className="h-16 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="bg-[#111827] text-white text-sm border border-white/10 rounded-lg pl-3 pr-10 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none min-w-[240px] shadow-sm font-medium"
            >
              {drives.map(d => (
                <option key={d.drive_id} value={d.drive_id}>
                  💾 {d.model}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {urgencyData && (
            <div className={`px - 2 py - 1 rounded border ${urgency.bg} ${urgency.border} ${urgency.text} text - [10px] font - bold uppercase tracking - wider`}>
              {urgency.label}
            </div>
          )}
        </div>

        <button
          onClick={handleBackupNow}
          disabled={optimizing}
          className={`bg - gradient - to - r from - blue - 600 to - blue - 500 hover: from - blue - 500 hover: to - blue - 400 text - white text - sm font - medium px - 5 py - 2 rounded - lg shadow - lg shadow - blue - 900 / 20 border border - white / 10 transition - all flex items - center gap - 2 ${optimizing ? 'opacity-70 cursor-not-allowed' : ''} `}
        >
          {optimizing ? (
            <>
              <span className="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></span>
              <span>Processing...</span>
            </>
          ) : (
            'Backup Now'
          )}
        </button>
      </div>

      <main className="flex-1 px-6 pb-12">
        <div className="max-w-[1600px] mx-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="text-brand-red text-6xl opacity-20">⚠️</div>
              <p className="text-slate-400 font-medium text-lg">System Offline</p>
              <button
                onClick={() => { setLoading(true); setError(null); loadDrives(); }}
                className="px-6 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded border border-blue-500/20 text-sm transition-colors uppercase tracking-wide font-bold"
              >
                Reconnect Services
              </button>
            </div>
          ) : loading || !driveData ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm animate-pulse tracking-wide font-medium">INITIALIZING SENTINEL CORE...</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-8">
              {currentTab === 'health' && (
                <>
                  <UrgencyBanner urgency={urgencyData} />
                  <HealthMonitor
                    data={driveData}
                    urgency={urgencyData}
                    driveId={selectedDriveId}
                    compressionData={compressionData}
                  />
                </>
              )}
              {currentTab === 'compression' && (
                <CompressionAnalytics
                  data={compressionData || driveData.compression}
                  driveId={selectedDriveId}
                  onOptimize={handleBackupNow}
                />
              )}
              {currentTab === 'life' && <LifeExtensionContainer selectedDrive={selectedDriveId} />}
              {currentTab === 'whatif' && <WhatIfSimulator currentSmart={driveData.smart_current} />}

              <AIActionFeed
                interventions={driveData?.life_extension?.interventions || []}
                isSimulated={driveData?.drive_meta?.is_simulated}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
