/**
 * SENTINEL-DISK Pro — API Client
 * All endpoints connect to the real FastAPI backend.
 */
import axios from 'axios';

// In Docker: nginx proxies /api → backend container, so we use a relative path.
// In local dev: Vite uses http://localhost:8000 directly.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30s — filesystem scans can take time
});

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const msg = error.response?.data?.detail || error.message;
        console.error('[API Error]', error.config?.url, msg);
        return Promise.reject(error);
    }
);

// ── Drive endpoints ────────────────────────────────────────────────────────────
export const getDrives = () => api.get('/drives');
export const getDriveStatus = (driveId) => api.get(`/drive/${driveId}/status`);
export const getDriveHealth = (driveId) => api.get(`/drive/${driveId}/health`);
export const getDriveHistory = (driveId, days = 30) => api.get(`/drive/${driveId}/history?days=${days}`);
export const getCompressionAnalysis = (driveId) => api.get(`/drive/${driveId}/compression`);
export const getDriveInterventions = (driveId) => api.get(`/drive/${driveId}/interventions`);
export const getDriveUrgency = (driveId) => api.get(`/drive/${driveId}/urgency`);

// ── Compression control (real button actions) ──────────────────────────────────
export const toggleCompression = (driveId) => api.post(`/drive/${driveId}/compression/toggle`);
export const setCompressionMode = (driveId, mode) => api.post(`/drive/${driveId}/compression/mode`, { mode });
export const toggleAutoAdjust = (driveId) => api.post(`/drive/${driveId}/compression/auto-adjust`);
export const runOptimization = (driveId) => api.post(`/drive/${driveId}/optimize`);

// ── Settings ───────────────────────────────────────────────────────────────────
export const getSettings = () => api.get('/settings');
export const updateSettings = (settings) => api.post('/settings', settings);
export const resetSettings = () => api.post('/settings/reset');

// ── System status ──────────────────────────────────────────────────────────────
export const getSystemStatus = () => api.get('/system/status');
export const checkSmartctl = () => api.get('/system/smartctl-check');

// ── Simulation ─────────────────────────────────────────────────────────────────
export const runSimulation = () => api.post('/simulate/run-cycle');

export default api;
