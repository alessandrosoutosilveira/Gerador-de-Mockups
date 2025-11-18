import React, { useState, useCallback, useMemo } from 'react';
import { generateMockup } from './services/geminiService';
import { Mockup } from './types';
import { MOCKUP_CATEGORIES } from './constants';
import { MockupCard } from './components/MockupCard';
import { UploadIcon, SparklesIcon } from './components/icons';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(MOCKUP_CATEGORIES[0]);
  const [prompt, setPrompt] = useState<string>('');
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/png') {
      setUploadedImage(file);
      setUploadedImagePreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setError('Por favor, envie uma imagem PNG válida.');
    }
  };

  const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        resolve({ mimeType, data: base64 });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateClick = useCallback(async () => {
    if (!uploadedImage) {
      setError('Por favor, envie uma imagem primeiro.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMockups(Array(4).fill({ id: 0, src: null, isLoading: true }).map((_, i) => ({ ..._, id: Date.now() + i })));

    try {
      const { mimeType, data: base64Image } = await fileToBase64(uploadedImage);

      const generationPromises = Array(4).fill(0).map(() => 
        generateMockup(base64Image, mimeType, selectedCategory, prompt)
      );

      const results = await Promise.all(generationPromises);

      setMockups(results.map((src, i) => ({ id: Date.now() + i, src, isLoading: false })));
    } catch (err) {
      console.error(err);
      setError('Falha ao gerar os mockups. Por favor, tente novamente.');
      setMockups([]);
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImage, selectedCategory, prompt]);
  
  const handleRedoOne = useCallback(async (id: number) => {
    if (!uploadedImage) return;

    setMockups(prev => prev.map(m => m.id === id ? { ...m, isLoading: true } : m));

    try {
      const { mimeType, data: base64Image } = await fileToBase64(uploadedImage);
      const newSrc = await generateMockup(base64Image, mimeType, selectedCategory, prompt);
      setMockups(prev => prev.map(m => m.id === id ? { id, src: newSrc, isLoading: false } : m));
    } catch (err) {
      console.error(err);
      setError('Falha ao gerar o mockup novamente.');
       setMockups(prev => prev.map(m => m.id === id ? { ...m, isLoading: false } : m)); // reset loading state on error
    }
  }, [uploadedImage, selectedCategory, prompt]);

  const isFormIncomplete = useMemo(() => !uploadedImage || !selectedCategory, [uploadedImage, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-500"/>
          <h1 className="text-2xl font-bold text-slate-900">Gerador de Mockups com IA</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">1. Envie seu design</h2>
              <p className="text-sm text-slate-500 mb-4">O formato PNG com fundo transparente funciona melhor.</p>
              <label htmlFor="file-upload" className="cursor-pointer group">
                <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors ${uploadedImage ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                  {uploadedImagePreview ? (
                    <img src={uploadedImagePreview} alt="Preview" className="max-h-32 object-contain rounded-md" />
                  ) : (
                    <>
                      <UploadIcon className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      <p className="mt-2 text-sm font-medium text-slate-600 group-hover:text-indigo-600">Clique para enviar ou arraste e solte</p>
                      <p className="text-xs text-slate-500">Apenas PNG</p>
                    </>
                  )}
                </div>
              </label>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png" onChange={handleImageUpload} />
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">2. Escolha um contexto</h2>
              <p className="text-sm text-slate-500 mb-4">Selecione onde seu design será aplicado.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOCKUP_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 capitalize ${selectedCategory === category ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">3. Descreva o estilo (Opcional)</h2>
              <p className="text-sm text-slate-500 mb-4">Guie a IA com mais detalhes.</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ex: 'minimalista, em uma mesa de madeira, luz externa'"
                className="w-full h-24 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating || isFormIncomplete}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <SparklesIcon className="w-5 h-5" />
              {isGenerating ? 'Gerando...' : 'Gerar 4 Mockups'}
            </button>
            {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Mockups Gerados</h2>
              {mockups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockups.map((mockup) => (
                     <MockupCard key={mockup.id} mockup={mockup} onRedo={handleRedoOne} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 pt-16">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                     <SparklesIcon className="w-12 h-12 text-slate-400"/>
                  </div>
                  <h3 className="text-lg font-medium text-slate-700">Seus mockups aparecerão aqui</h3>
                  <p className="max-w-xs mx-auto">Complete os passos à esquerda para começar a gerar seus designs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;