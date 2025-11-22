import React, { useState, useEffect } from 'react';
import { Restaurant } from './types';
import RestaurantList from './components/RestaurantList';
import MapVisualization from './components/MapVisualization';
import AddPlaceModal from './components/AddPlaceModal';

const STORAGE_KEY = 'gourmet_snap_data';

const App: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRestaurants(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
  }, [restaurants]);

  // Handle window resize for responsive viewMode
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('list');
      } else {
        setViewMode('split');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveRestaurant = (restaurant: Restaurant) => {
    setRestaurants(prev => [restaurant, ...prev]);
    setSelectedRestaurant(restaurant);
    setMobileTab('map');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 bg-white/90 backdrop-blur z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-pink-600 rounded-lg flex items-center justify-center shadow-md shadow-pink-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            SnapMap
          </h1>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 shadow-md shadow-slate-900/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Spot
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop: Sidebar List */}
        <div className={`
          ${viewMode === 'split' ? 'w-1/3 min-w-[350px] border-r border-slate-200 bg-white' : 'hidden'}
           flex flex-col
        `}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Collection</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            <RestaurantList 
              restaurants={restaurants} 
              selectedId={selectedRestaurant?.id || null}
              onSelect={setSelectedRestaurant}
            />
          </div>
        </div>

        {/* Map Area */}
        <div className={`
          flex-1 relative bg-white
          ${viewMode === 'split' ? 'block' : (mobileTab === 'map' ? 'block' : 'hidden')}
        `}>
          <MapVisualization 
            restaurants={restaurants}
            selectedRestaurant={selectedRestaurant}
            onSelectRestaurant={setSelectedRestaurant}
          />
          
          {/* Selected Card Overlay (Floating) */}
          {selectedRestaurant && (
            <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-900">{selectedRestaurant.name}</h3>
                <button onClick={() => setSelectedRestaurant(null)} className="text-slate-400 hover:text-slate-800 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {selectedRestaurant.city}, {selectedRestaurant.district}
              </div>
              <p className="text-xs text-slate-500 mb-3">{selectedRestaurant.description}</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {selectedRestaurant.tags.map(t => (
                   <span key={t} className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">#{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: List Tab View */}
        <div className={`
          flex-1 bg-slate-50 overflow-y-auto
          ${viewMode !== 'split' && mobileTab === 'list' ? 'block' : 'hidden'}
        `}>
          <div className="p-4">
            <RestaurantList 
              restaurants={restaurants} 
              selectedId={selectedRestaurant?.id || null}
              onSelect={(r) => {
                setSelectedRestaurant(r);
                setMobileTab('map');
              }}
            />
          </div>
        </div>

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden h-16 bg-white border-t border-slate-200 grid grid-cols-2">
        <button 
          onClick={() => setMobileTab('list')}
          className={`flex flex-col items-center justify-center gap-1 ${mobileTab === 'list' ? 'text-brand-accent' : 'text-slate-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span className="text-xs font-medium">List</span>
        </button>
        <button 
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center justify-center gap-1 ${mobileTab === 'map' ? 'text-brand-accent' : 'text-slate-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
          <span className="text-xs font-medium">Map</span>
        </button>
      </div>

      <AddPlaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
      />

    </div>
  );
};

export default App;