import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/geminiService';
import { Restaurant } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (restaurant: Restaurant) => void;
}

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({ isOpen, onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Data = preview.split(',')[1];
      const result = await analyzeImage(base64Data);
      
      const newRestaurant: Restaurant = {
        id: uuidv4(),
        ...result,
        originalImage: preview,
        createdAt: Date.now()
      };

      onSave(newRestaurant);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Add New Spot</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {!preview ? (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-brand-accent hover:bg-slate-50 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-brand-accent group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <p className="text-slate-700 font-medium">Upload Screenshot</p>
              <p className="text-slate-400 text-sm mt-1">From Instagram Reels or YouTube Shorts</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                <img src={preview} alt="Preview" className="w-full h-full object-contain opacity-80" />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-slate-700 font-medium animate-pulse">Analyzing Screenshot...</p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                 <button 
                  onClick={() => { setPreview(null); setFile(null); }}
                  className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                  disabled={isAnalyzing}
                >
                  Retake
                </button>
                <button 
                  onClick={handleAnalyze}
                  className="flex-1 py-3 rounded-lg bg-brand-accent text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-brand-accent/20"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Processing...' : 'Extract Info'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Instructions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          We use AI to find the restaurant name and location from your image.
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;