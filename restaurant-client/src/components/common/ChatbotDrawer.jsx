import React, { useRef, useEffect } from "react";
import { X, Send, Bot, User, MessageSquare } from "lucide-react";

/**
 * ChatbotDrawer - A premium glassmorphism sidebar for AI interaction.
 * Features:
 * - Backdrop blur and translucency.
 * - Auto-scrolling to latest message.
 * - Dynamic message bubbles.
 * - Animated typing indicator.
 * - Quick reply tags.
 */
const ChatbotDrawer = ({ 
    isOpen, 
    onClose, 
    messages, 
    onSendMessage, 
    isTyping,
    inputValue,
    onInputChange
}) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom whenever messages or typing state changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isTyping, isOpen]);

    if (!isOpen) return null;

    const quickReplies = [
        "Món nào đang hot?",
        "Tư vấn món cay",
        "Món chay có gì?",
        "Gợi ý đồ uống"
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
            {/* Backdrop with slight blur */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                onClick={onClose}
            ></div>

            {/* Chat Window - Glassmorphism */}
            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/20 dark:bg-gray-950/90 dark:border-gray-800">
                
                {/* Header */}
                <header className="p-6 border-b border-slate-100 dark:border-gray-800 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Bot size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-gray-100 tracking-tight">AI Assistant</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Đang trực tuyến</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-slate-200/50 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-gray-400 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Messages Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                >
                    {/* Welcome Message */}
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 opacity-50">
                        <div className="p-4 bg-slate-100 dark:bg-gray-800 rounded-full">
                            <MessageSquare size={32} className="text-slate-400 dark:text-gray-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-600 dark:text-gray-300">Xin chào! Tôi có thể giúp gì cho bạn?</p>
                            <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">Hỏi tôi về thực đơn, gợi ý món ăn hoặc thành phần món.</p>
                        </div>
                    </div>

                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in zoom-in-95 duration-300`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm 
                                    ${msg.role === "user" ? "bg-slate-200 text-slate-600 dark:bg-gray-800 dark:text-gray-300" : "bg-blue-600 text-white"}
                                `}>
                                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                
                                {/* Bubble */}
                                <div className={`p-4 rounded-3xl ${
                                    msg.role === "user" 
                                    ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20" 
                                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
                                }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                                    <Bot size={14} />
                                </div>
                                <div className="flex gap-1.5 px-4 py-3 bg-white border border-slate-100 rounded-3xl rounded-tl-none shadow-sm dark:bg-gray-900 dark:border-gray-800">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <footer className="p-6 border-t border-slate-100 dark:border-gray-800 space-y-4">
                    {/* Quick Replies */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-invisible">
                        {quickReplies.map((text, i) => (
                            <button
                                key={i}
                                onClick={() => onSendMessage(text)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 whitespace-nowrap hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-600"
                            >
                                {text}
                            </button>
                        ))}
                    </div>

                    {/* Text Input */}
                    <div className="relative group">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && onSendMessage(inputValue)}
                            placeholder="Nhập tin nhắn..."
                            className="w-full bg-slate-100 border border-slate-200 dark:bg-gray-900 dark:border-gray-850 dark:text-gray-100 rounded-[24px] pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                        />
                        <button
                            onClick={() => onSendMessage(inputValue)}
                            disabled={!inputValue.trim()}
                            className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-30 disabled:bg-slate-400 active:scale-90"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    
                    <p className="text-center text-[10px] text-slate-400 font-medium">
                        Công nghệ bởi Gemini AI Model
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default ChatbotDrawer;
