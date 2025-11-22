import React, { useMemo } from 'react';
import { Restaurant } from '../types';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelect: (r: Restaurant) => void;
  selectedId: string | null;
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants, onSelect, selectedId }) => {
  
  // Group by Country -> City for display structure
  const grouped = useMemo(() => {
    const g: Record<string, Record<string, Restaurant[]>> = {};
    
    restaurants.forEach(r => {
      if (!g[r.country]) g[r.country] = {};
      if (!g[r.country][r.city]) g[r.country][r.city] = [];
      g[r.country][r.city].push(r);
    });
    return g;
  }, [restaurants]);

  if (restaurants.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No saved spots yet.</p>
        <p className="text-sm mt-2">Upload a screenshot to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {Object.entries(grouped).map(([country, cities]) => (
        <div key={country} className="space-y-4">
          <h3 className="text-lg font-bold text-brand-secondary sticky top-0 bg-white/95 backdrop-blur py-2 z-10 border-b border-slate-100">
            {country}
          </h3>
          
          {Object.entries(cities).map(([city, spots]) => (
            <div key={city} className="ml-2">
              <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                {city}
              </h4>
              
              <div className="space-y-3">
                {spots.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className={`
                      group relative p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedId === r.id 
                        ? 'bg-white border-brand-accent shadow-lg shadow-brand-accent/5 ring-1 ring-brand-accent' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                    `}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-slate-100 relative border border-slate-100">
                        <img 
                          src={r.originalImage} 
                          alt={r.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-slate-800 truncate pr-2">{r.name}</h5>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 whitespace-nowrap border border-slate-200">
                            {r.district}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {r.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] text-brand-secondary bg-indigo-50 px-1.5 rounded font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default RestaurantList;