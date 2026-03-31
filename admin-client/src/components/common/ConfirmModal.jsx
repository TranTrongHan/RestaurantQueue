import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Xác nhận", 
    message = "Bạn có chắc chắn muốn thực hiện hành động này?", 
    confirmText = "Xác nhận", 
    cancelText = "Hủy",
    type = "info", // "info" | "danger" | "success"
    isLoading = false
}) => {
    if (!isOpen) return null;

    const getConfig = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <AlertCircle className="text-red-500" size={32} />,
                    iconBg: "bg-red-50",
                    btnBg: "bg-red-600 hover:bg-red-700 shadow-red-200",
                    accent: "border-red-100"
                };
            case "success":
                return {
                    icon: <CheckCircle2 className="text-emerald-500" size={32} />,
                    iconBg: "bg-emerald-50",
                    btnBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
                    accent: "border-emerald-100"
                };
            default:
                return {
                    icon: <AlertCircle className="text-blue-500" size={32} />,
                    iconBg: "bg-blue-50",
                    btnBg: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
                    accent: "border-blue-100"
                };
        }
    };

    const config = getConfig();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
                onClick={!isLoading ? onClose : undefined}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
                <div className="p-8 pb-10">
                    {/* Header with Icon */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 ${config.iconBg} rounded-3xl flex items-center justify-center mb-6 ring-8 ring-slate-50 transition-transform duration-500 hover:scale-110`}>
                            {config.icon}
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                            {title}
                        </h3>
                        
                        <p className="text-slate-500 font-medium leading-relaxed px-2">
                            {message}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-10 flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full py-4 ${config.btnBg} text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 h-14 disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                confirmText
                            )}
                        </button>
                        
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-100 active:scale-95 transition-all h-14 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                {/* Decorative bottom bar */}
                <div className={`h-1.5 w-full ${config.btnBg.split(' ')[0]}`}></div>
                
                {/* Close button (top right) */}
                <button 
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
