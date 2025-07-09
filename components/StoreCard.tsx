import React from 'react';
import { Store } from '../types';
import { getCategoryInfo } from '../constants';

interface StoreCardProps {
  store: Store & { distance?: number };
  onSelectStore: (store: Store) => void;
  onToggleFavorite: (storeId: string) => void;
  isFavorite: boolean;
  showDistance?: boolean;
  distance?: number;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onSelectStore, onToggleFavorite, isFavorite, showDistance, distance }) => {
  const categoryInfo = getCategoryInfo(store.category);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col transform transition-transform duration-300 hover:-translate-y-2">
      <div className="relative">
        <img 
          className="w-full h-48 object-cover" 
          src={store.imageUrl || `https://picsum.photos/seed/${store.id}/400/300`} 
          alt={store.name} 
        />
        <div className="absolute top-3 right-3">
            <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(store.id); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isFavorite ? 'bg-red-500/80' : 'glass-panel bg-black/20 hover:bg-red-500/50'}`}
                aria-label={isFavorite ? '찜 해제' : '찜하기'}
            >
                <i className={`fas fa-heart text-lg ${isFavorite ? 'text-white' : 'text-white/70'}`}></i>
            </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow text-white">
        <span className={`self-start px-3 py-1 mb-2 text-xs font-semibold rounded-full bg-white/10 text-white/90`}>
           <i className={`mr-1 ${categoryInfo.icon} ${categoryInfo.color}`}></i>
           <span>{store.category}</span>
        </span>
        
        <h3 className="text-lg font-bold text-white mb-1 truncate" title={store.name}>{store.name}</h3>
        
        {store.rating && (
          <div className="flex items-center text-sm text-yellow-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`fa-star ${i < Math.round(store.rating!) ? 'fas' : 'far'}`}></i>
            ))}
            <span className="ml-1 text-white/80">({store.rating.toFixed(1)})</span>
          </div>
        )}

        <p className="text-sm text-white/70 truncate mb-1" title={store.address}>
          <i className="fas fa-map-marker-alt mr-1 text-white/50"></i>{store.address}
        </p>

        {showDistance && typeof distance === 'number' && distance !== Infinity && (
          <p className="text-xs text-blue-300 mb-2">
            <i className="fas fa-route mr-1 text-blue-300/80"></i>약 {distance.toFixed(1)}km
          </p>
        )}

        <div className="my-3 space-y-1 mt-auto pt-3 border-t border-white/10">
          {store.discounts.slice(0, 1).map(discount => (
            <div key={discount.id} className="p-2 bg-black/10 rounded-md">
              <p className="text-sm font-medium text-indigo-200 truncate" title={discount.description}>
                <i className="fas fa-tag mr-2"></i>{discount.description}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSelectStore(store)}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
        >
          상세보기
        </button>
      </div>
    </div>
  );
};

export default StoreCard;