import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, HardDrive, Lock, User, ChevronRight } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLogin = (role) => {
        setIsAnimating(true);
        // Simulate API delay
        setTimeout(() => {
            login({
                id: role === 'admin' ? 'admin-01' : 'user-01',
                name: role === 'admin' ? 'Admin User' : 'Demo User',
                email: role === 'admin' ? 'admin@sentinel.io' : 'user@demo.com',
                role: role,
                avatar: role === 'admin'
                    ? 'https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff'
                    : 'https://ui-avatars.com/api/?name=Demo+User&background=10b981&color=fff'
            });
        }, 800);
    };

    const handleGoogleLogin = () => {
        // Simulate Google Login
        setIsAnimating(true);
        setTimeout(() => {
            login({
                id: 'google-user-01',
                name: 'Google User',
                email: 'user@gmail.com',
                role: 'user', // Default to standard user
                avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            });
        }, 1200);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050914] text-slate-200 font-sans">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className={`w-full max-w-md p-8 relative z-10 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-xl shadow-blue-900/40 mb-6">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-2">
                        Sentinel Disk Pro
                    </h1>
                    <p className="text-slate-500 text-sm">Predictive Storage Health Monitoring</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-1 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl bg-[#0B101B]/60">
                    <div className="bg-[#0B101B]/80 rounded-xl p-6 space-y-4">

                        {/* Google Login (Mock) */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full group relative flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-3 rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-1 group-hover:translate-x-0">
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-widest">Demo Access</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleLogin('user')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-medium text-slate-300">Standard User</div>
                            </button>

                            <button
                                onClick={() => handleLogin('admin')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-medium text-slate-300">Administrator</div>
                            </button>
                        </div>

                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-600">
                        By logging in, you agree to the <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span> and <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
