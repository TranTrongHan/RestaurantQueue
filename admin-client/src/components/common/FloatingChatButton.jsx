import React from "react";
import { Bot, Sparkles } from "lucide-react";

/**
 * FloatingChatButton - A premium, animated button to toggle the Chatbot Drawer.
 * Features a subtle pulse animation and a secondary sparkle icon for a "Smart" feel.
 */
const FloatingChatButton = ({ onClick, isOpen }) => {
    if (isOpen) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-8 md:bottom-10 md:right-10 z-40 group"
            aria-label="Mở bot hỗ trợ"
        >
            {/* Background Pulse Animation */}
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>

            {/* Main Button Body */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:-translate-y-1 transition-all duration-300 ring-4 ring-white">
                <Bot size={32} className="group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />

                {/* Small indicator badge or sparkle */}
                <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce-slow">
                    <Sparkles size={12} fill="currentColor" />
                </div>
            </div>

            {/* Tooltip Label */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 text-white text-xs font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-sm border border-white/10 hidden md:block">
                Hỏi bot
            </div>
        </button>
    );
};

export default FloatingChatButton;
