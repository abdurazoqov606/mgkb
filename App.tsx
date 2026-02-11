
import React, { useState, useCallback, useRef } from 'react';
import { ImageFile } from './types';
import { compressImage, formatSize } from './utils/imageProcessor';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const processingQueue = useRef<Set<string>>(new Set());

  const processOne = useCallback(async (image: ImageFile) => {
    if (processingQueue.current.has(image.id)) return;
    processingQueue.current.add(image.id);

    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, status: 'compressing' } : img
    ));

    try {
      const compressedBlob = await compressImage(image.original, 800);
      const compressedUrl = URL.createObjectURL(compressedBlob);
      
      analyzeImage(compressedBlob).then(aiResponse => {
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, aiAnalysis: aiResponse } : img
        ));
      });

      setImages(prev => prev.map(img => 
        img.id === image.id ? { 
          ...img, 
          status: 'done', 
          compressed: compressedBlob, 
          compressedUrl,
          compressedSize: compressedBlob.size
        } : img
      ));
    } catch (err: any) {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'error', error: err.message } : img
      ));
    } finally {
      processingQueue.current.delete(image.id);
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      original: file,
      originalUrl: URL.createObjectURL(file),
      status: 'pending',
      originalSize: file.size,
    }));

    setImages((prev) => [...prev, ...newImages]);
    
    for (const img of newImages) {
      processOne(img);
    }
  }, [processOne]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed?.originalUrl) URL.revokeObjectURL(removed.originalUrl);
      if (removed?.compressedUrl) URL.revokeObjectURL(removed.compressedUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-2xl border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-5 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 transform transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                <i className="fas fa-bolt-lightning text-2xl"></i>
              </div>
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-sm text-yellow-900">
                PRO
              </div>
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight text-slate-900 flex items-center gap-2">
                SqueezeIt 
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs">2026</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Abdurazoqov Abbos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tizim Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section & Upload Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6">
            Rasmlarni <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">lahzada</span> siqing.
          </h2>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Abdurazoqov Abbos tomonidan yaratilgan yuqori tezlikdagi AI-siqish texnologiyasi. 
            Sifatni yo'qotmasdan hajmni <span className="text-indigo-600 font-bold">800KB</span> gacha tushiramiz.
          </p>
        </div>
        
        {/* Drop Zone */}
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative group border-4 border-dashed rounded-[3.5rem] p-12 md:p-32 flex flex-col items-center justify-center transition-all duration-700 shadow-2xl ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50 scale-[0.98] shadow-indigo-100' 
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-indigo-50 shadow-slate-200/50'
          }`}
        >
          <input 
            type="file" 
            multiple 
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="relative mb-10">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
              <i className="fas fa-plus text-5xl text-white"></i>
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 animate-bounce">
              <i className="fas fa-cloud-arrow-up text-indigo-600"></i>
            </div>
          </div>
          <h3 className="text-3xl font-black mb-4 text-slate-900 text-center tracking-tight">Fayllarni bu yerga tashlang</h3>
          <p className="text-slate-400 text-center max-w-xs text-lg font-bold uppercase tracking-widest opacity-60">
            yoki ustiga bosing
          </p>
          
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            {['AI Powered', '800KB Target', 'Web Ready'].map(feature => (
              <div key={feature} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-2xl border border-indigo-100">
                <i className="fas fa-check-circle opacity-50"></i>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col group animate-in zoom-in-95 duration-500 hover:shadow-indigo-100 transition-all">
              <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img 
                  src={image.compressedUrl || image.originalUrl} 
                  alt={image.original.name}
                  className={`w-full h-full object-contain p-6 transition-all duration-1000 ${image.status === 'compressing' ? 'scale-110 blur-2xl opacity-20' : 'scale-100 opacity-100'}`}
                />
                
                <button 
                  onClick={() => removeImage(image.id)}
                  className="absolute top-6 right-6 w-14 h-14 bg-white/95 hover:bg-red-500 hover:text-white text-slate-900 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl backdrop-blur-xl border border-white/50 z-20"
                >
                  <i className="fas fa-xmark text-xl"></i>
                </button>

                {image.status === 'compressing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl z-10">
                    <div className="relative">
                      <div className="w-20 h-20 border-[8px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-bolt text-indigo-600 animate-pulse"></i>
                      </div>
                    </div>
                    <span className="text-indigo-600 font-black text-sm uppercase tracking-[0.4em] mt-8">Siquvda...</span>
                  </div>
                )}

                {image.status === 'done' && (
                  <div className="absolute top-6 left-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black rounded-2xl shadow-2xl shadow-indigo-200 uppercase tracking-[0.2em] z-10">
                    Sifatli Siqildi
                  </div>
                )}
              </div>

              <div className="p-10 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-10">
                  <div className="max-w-[60%]">
                    <h4 className="font-black text-slate-900 truncate text-2xl tracking-tighter" title={image.original.name}>
                      {image.original.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                        Asli: {formatSize(image.originalSize)}
                       </span>
                    </div>
                  </div>
                  {image.status === 'done' && image.compressedSize && (
                    <div className="text-right">
                      <div className="text-indigo-600 font-black text-3xl leading-none tracking-tighter">
                        {formatSize(image.compressedSize)}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-green-100">
                        <i className="fas fa-arrow-down-long"></i>
                        {Math.round((1 - image.compressedSize / image.originalSize) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {image.aiAnalysis && (
                  <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group/ai">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-500"></div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-robot text-indigo-500 text-[8px]"></i>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abbos AI Izohi</span>
                    </div>
                    <p className="text-base text-slate-700 leading-relaxed font-bold italic tracking-tight">"{image.aiAnalysis}"</p>
                  </div>
                )}

                <div className="mt-auto">
                  {image.status === 'done' && image.compressedUrl ? (
                    <a 
                      href={image.compressedUrl} 
                      download={`abbos-squeeze-${image.original.name}`}
                      className="block w-full py-6 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-indigo-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white rounded-[1.75rem] text-sm font-black transition-all shadow-2xl shadow-slate-200 text-center uppercase tracking-[0.2em]"
                    >
                      <i className="fas fa-download mr-3 opacity-50"></i>
                      Yuklab olish
                    </a>
                  ) : image.status === 'error' ? (
                    <div className="w-full py-6 bg-red-50 text-red-600 rounded-[1.75rem] text-sm font-black text-center border-2 border-red-100 uppercase tracking-widest">
                      Xatolik yuz berdi
                    </div>
                  ) : (
                    <div className="w-full py-6 bg-slate-100 text-slate-400 rounded-[1.75rem] text-sm font-black text-center uppercase tracking-widest cursor-wait border border-slate-200/50">
                      Abbos AI ishlamoqda...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="mt-32 flex flex-col items-center justify-center text-slate-200 py-20 animate-pulse">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
               <i className="fas fa-images text-[12rem] relative opacity-5 transform -rotate-6"></i>
            </div>
            <p className="text-3xl font-black uppercase tracking-[0.6em] opacity-20">Rasm kutilyapti</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-16 mt-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-16 inline-flex flex-col items-center group">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <i className="fas fa-user-tie text-3xl"></i>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white">
                <i className="fas fa-check text-xs"></i>
              </div>
            </div>
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Loyiha asoschisi</h4>
            <div className="h-1 w-12 bg-indigo-600 rounded-full my-4 mx-auto group-hover:w-32 transition-all duration-700"></div>
            <p className="text-indigo-600 font-black text-4xl tracking-tighter uppercase">
              Abdurazoqov Abbos 2026
            </p>
            <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-[0.4em]">Full Stack Engineer • AI Enthusiast</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-3xl mx-auto">
             {[
               { icon: 'bolt', label: 'Tezkor' },
               { icon: 'shield-halved', label: 'Xavfsiz' },
               { icon: 'wand-magic-sparkles', label: 'AI Sifat' },
               { icon: 'code', label: 'Zamonaviy' }
             ].map(item => (
               <div key={item.label} className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors border border-slate-100">
                   <i className={`fas fa-${item.icon}`}></i>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
               </div>
             ))}
          </div>
          
          <div className="flex justify-center space-x-12 text-slate-300">
            <a href="#" className="hover:text-indigo-600 transition-all transform hover:scale-150 hover:-rotate-12"><i className="fab fa-github text-3xl"></i></a>
            <a href="#" className="hover:text-indigo-600 transition-all transform hover:scale-150 hover:rotate-12"><i className="fab fa-telegram text-3xl"></i></a>
            <a href="#" className="hover:text-indigo-600 transition-all transform hover:scale-150 hover:-rotate-12"><i className="fab fa-instagram text-3xl"></i></a>
            <a href="#" className="hover:text-indigo-600 transition-all transform hover:scale-150 hover:rotate-12"><i className="fab fa-linkedin text-3xl"></i></a>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">
              © 2024 SqueezeIt Abbos Edition • Made with Passion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
