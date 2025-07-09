import React from 'react';
import { APP_TITLE } from '../constants';

interface HeaderProps {
  onShowFavorites: () => void;
  onShowReceiptHistory: () => void;
  favoriteCount: number;
  isScrolled: boolean;
}

const Header: React.FC<HeaderProps> = ({ onShowFavorites, onShowReceiptHistory, favoriteCount, isScrolled }) => {
  return (
    <header className={`p-5 sticky top-0 z-40 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-black/25 backdrop-blur-lg shadow-lg border-b border-white/10' : 'border-b border-transparent'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white shadow-sm">
          <i className="fas fa-tags mr-2"></i>{APP_TITLE}
        </h1>
        <div className="space-x-2 flex items-center">
          <button 
            onClick={onShowFavorites} 
            className="relative glass-panel bg-white/5 hover:bg-white/20 p-2 h-10 w-10 rounded-full transition-colors"
            aria-label="찜 목록 보기"
          >
            <i className="fas fa-heart text-xl text-white/90"></i>
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white/50">
                {favoriteCount}
              </span>
            )}
          </button>
          <button 
            onClick={onShowReceiptHistory}
            className="glass-panel bg-white/5 hover:bg-white/20 p-2 h-10 w-10 rounded-full transition-colors"
            aria-label="영수증 내역 보기"
          >
            <i className="fas fa-receipt text-xl text-white/90"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;