import React, { useEffect } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <Check size={18} className="text-green-400" />,
        error: <X size={18} className="text-red-400" />,
        warning: <AlertTriangle size={18} className="text-yellow-400" />,
        info: <Info size={18} className="text-blue-400" />
    };

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <div className={`fixed top-24 right-8 z-[2000] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl animate-in slide-in-from-right-full fade-in duration-300 ${bgColors[type]} border`}>
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="text-sm font-medium text-white">{message}</p>
            <button
                onClick={onClose}
                className="ml-4 text-white/40 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default Toast;
