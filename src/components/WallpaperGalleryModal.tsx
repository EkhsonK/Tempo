import React from 'react';
import { CancelIcon, PhotoIcon } from './IconComponents';

interface WallpaperGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    currentBackground: string | null;
}

const wallpapers = [
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2400', name: 'Туманные Горы' },
    { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2400', name: 'Зеленая Долина' },
    { url: 'https://images.unsplash.com/photo-1552083375-1447ce886485?q=80&w=2400', name: 'Абстракция' },
    { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2400', name: 'Утренний Рассвет' },
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400', name: 'Открытый Космос' },
    { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2400', name: 'Мегаполис' },
    { url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2400', name: 'Альпийское Озеро' },
    { url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2400', name: 'Ночное Небо' },
    { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2400', name: 'Йосемити' },
    { url: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?q=80&w=2400', name: 'Осенние Листья' },
    { url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2400', name: 'Зимний Лес' },
];

const WallpaperGalleryModal: React.FC<WallpaperGalleryModalProps> = ({ isOpen, onClose, onSelect, currentBackground }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] animate-fade-in p-4" onClick={onClose}>
            <div className="bg-brand-surface-solid border border-brand-gray-700 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-gray-700 flex justify-between items-center bg-brand-surface">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/20 rounded-lg">
                            <PhotoIcon className="w-6 h-6 text-brand-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-brand-text-primary">Галерея Обоев</h2>
                    </div>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary transition-transform hover:scale-110">
                        <CancelIcon className="w-8 h-8" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-brand-background">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {wallpapers.map((paper) => {
                            const isActive = currentBackground === `url(${paper.url})`;
                            return (
                                <button 
                                    key={paper.url} 
                                    onClick={() => onSelect(`url(${paper.url})`)}
                                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-brand-primary shadow-[0_0_20px_rgba(var(--brand-primary),0.5)] scale-[1.02]' : 'border-transparent hover:border-brand-gray-600'}`}
                                >
                                    <img src={paper.url} alt={paper.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <span className="text-white font-medium text-sm">{paper.name}</span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-3 right-3 bg-brand-primary text-white p-1.5 rounded-full shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WallpaperGalleryModal;