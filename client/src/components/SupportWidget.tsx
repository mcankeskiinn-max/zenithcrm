import React, { useState } from 'react';
import { Headphones, X } from 'lucide-react';
import { SupportChat } from './SupportChat';

export const SupportWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 animate-in fade-in slide-in-from-bottom-10">
                    <SupportChat onClose={() => setIsOpen(false)} />
                </div>
            )}

            {/* Pulsing Background for Button */}
            {!isOpen && (
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150 -z-10"></div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 group ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
            >
                <div className="relative">
                    {isOpen ? (
                        <X className="w-6 h-6 animate-in spin-in duration-300" />
                    ) : (
                        <Headphones className="w-6 h-6 group-hover:animate-bounce" />
                    )}
                    {!isOpen && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
                {!isOpen && (
                    <span className="font-semibold text-sm whitespace-nowrap">
                        Yardıma mı ihtiyacınız var?
                    </span>
                )}
            </button>
        </div>
    );
};

