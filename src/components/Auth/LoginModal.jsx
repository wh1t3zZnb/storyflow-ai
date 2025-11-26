import React from 'react';
import { X, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
    const { signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Error logging in with Google:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0a0a0a] p-0 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none opacity-50" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all z-10"
                >
                    <X size={20} />
                </button>

                <div className="relative p-8 pt-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg shadow-blue-500/25 group">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Sparkles className="text-white drop-shadow-md" size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-gray-400 text-sm max-w-[260px] mx-auto leading-relaxed">
                            Sign in to Storyboard Pro to sync your creative work across devices.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-4 text-black font-semibold hover:bg-gray-50 transition-all active:scale-[0.98] shadow-xl shadow-white/5 hover:shadow-white/10"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="text-[15px]">Continue with Google</span>
                            <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-400" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600 font-medium uppercase tracking-wider">
                            <ShieldCheck size={14} className="text-green-500/80" />
                            <span>Secure authentication via Supabase</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
