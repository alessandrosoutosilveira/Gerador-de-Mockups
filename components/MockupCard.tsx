import React from 'react';
import { Mockup } from '../types';
import { Spinner } from './Spinner';
import { DownloadIcon, RedoIcon } from './icons';

interface MockupCardProps {
  mockup: Mockup;
  onRedo: (id: number) => void;
}

export const MockupCard: React.FC<MockupCardProps> = ({ mockup, onRedo }) => {

  const downloadImage = (base64Image: string, fileName: string = `mockup-${Date.now()}.png`) => {
    if (!base64Image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
      {mockup.isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Spinner />
        </div>
      )}
      {mockup.src && (
        <img 
          src={`data:image/png;base64,${mockup.src}`} 
          alt="Generated mockup" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      )}
      {!mockup.isLoading && mockup.src && (
        <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => downloadImage(mockup.src!)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-800 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-white transition"
          >
            <DownloadIcon className="w-5 h-5" />
            Baixar
          </button>
          <button
            onClick={() => onRedo(mockup.id)}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-800 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-white transition"
          >
            <RedoIcon className="w-5 h-5" />
            Refazer
          </button>
        </div>
      )}
    </div>
  );
};