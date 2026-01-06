import React, { useState, useRef } from 'react';
import { Upload, ScanEye, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';

const ImageAnalyzer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 data only
        const base64Data = result.split(',')[1]; 
        setSelectedImage(base64Data);
        setMimeType(file.type);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    const result = await analyzeImage(selectedImage, mimeType, prompt);
    setAnalysisResult(result);
    setIsLoading(false);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setMimeType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in pb-24 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
          <ScanEye className="text-rose-500" size={32} />
          Visual Intelligence
        </h2>
        <p className="text-slate-400">Analyze thumbnails with Gemini Pro Vision.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all min-h-[300px] backdrop-blur-sm ${
              selectedImage ? 'border-slate-700 bg-slate-900/50' : 'border-slate-700 hover:border-rose-500/50 hover:bg-slate-900/30 cursor-pointer bg-slate-900/20'
            }`}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={`data:${mimeType};base64,${selectedImage}`} 
                  alt="Preview" 
                  className="max-h-[400px] w-auto rounded-lg shadow-2xl border border-white/10"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute -top-4 -right-4 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/40"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-slate-800 p-4 rounded-full inline-block shadow-lg">
                  <Upload size={32} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Click to upload image</h3>
                  <p className="text-slate-500 text-sm mt-1">Supports JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Custom Prompt (Optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Is the text in this thumbnail readable?' or 'What emotions does this channel banner evoke?'"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-rose-500 h-24 resize-none shadow-inner"
            />
            <button 
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className="w-full mt-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold py-3 rounded-lg hover:from-rose-500 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Analyze Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-8 h-full min-h-[500px] flex flex-col shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ScanEye className="text-blue-500" />
            Analysis Results
          </h3>
          
          {analysisResult ? (
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar">
              {analysisResult.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
              <ImageIcon size={48} className="opacity-20" />
              <p className="text-center max-w-xs text-sm">Upload an image to see insights from Gemini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;