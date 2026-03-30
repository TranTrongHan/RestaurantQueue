import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  className = "" 
}) => {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`
            w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all
            ${currentPage === i 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50'}
          `}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className={`flex items-center justify-between px-4 py-4 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            p-2.5 rounded-xl border transition-all
            ${currentPage === 1 
              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-500 active:bg-blue-50'}
          `}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-2">
          {renderPageButtons()}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            p-2.5 rounded-xl border transition-all
            ${currentPage === totalPages 
              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-500 active:bg-blue-50'}
          `}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      <div className="hidden md:block">
        <p className="text-sm text-slate-500 italic">
          Trang <span className="font-bold text-slate-800">{currentPage}</span> / <span className="font-bold text-slate-800">{totalPages}</span>
        </p>
      </div>
    </div>
  );
};

export default Pagination;
