import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0];
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-3 rounded-full p-1.5 pr-4 transition-all duration-200 border ${isOpen
                    ? 'bg-gray-100 border-gray-200 ring-2 ring-blue-500/10'
                    : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200'
                    }`}
            >
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-gray-100 transition-all"
                        />
                    ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white">
                            {displayName?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></div>
                </div>

                <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-gray-700 max-w-[100px] truncate leading-tight group-hover:text-gray-900 transition-colors">
                        {displayName}
                    </span>
                    <span className="text-[10px] font-medium text-blue-600 leading-tight bg-blue-50 px-1.5 py-0.5 rounded-md mt-0.5 border border-blue-100">
                        Free Plan
                    </span>
                </div>

                <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-gray-600' : 'group-hover:text-gray-500'}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-white/95 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-black/5 border border-gray-100 z-50 animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* User Info Header */}
                    <div className="px-4 py-4 mb-2 border-b border-gray-100 bg-gray-50/50 rounded-xl mx-1 mt-1">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {displayName?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-sm text-gray-900 font-bold truncate">{displayName}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1 px-1">
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all group"
                        >
                            <div className="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                                <LogOut size={16} />
                            </div>
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
