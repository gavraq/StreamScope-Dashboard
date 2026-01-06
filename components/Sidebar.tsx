import React, { useRef } from 'react';
import { LayoutDashboard, Youtube, Calendar, ScanEye, Sparkles, RefreshCw, LogIn, Upload, Clock, Download, MessageSquareMore } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onSync: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  isSyncing: boolean;
  isConnected: boolean;
  lastUpdated?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSync, onImport, onExport, isSyncing, isConnected, lastUpdated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Youtube size={20} /> },
    { id: 'discover', label: 'Discover & Trending', icon: <Sparkles size={20} /> },
    { id: 'calendar', label: 'Watch History', icon: <Calendar size={20} /> },
    { id: 'analyzer', label: 'Image Analyzer', icon: <ScanEye size={20} /> },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquareMore size={20} /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
    // Reset value to allow re-uploading same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
          <Youtube className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">StreamScope</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-red-600/10 text-red-500 font-medium'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 pb-2 space-y-2">
         {/* Hidden File Input */}
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
         />

         <button 
          onClick={onSync}
          disabled={isSyncing}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium ${
             isConnected 
             ? 'bg-gray-800 hover:bg-gray-700 text-white' 
             : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
         >
           {isSyncing ? (
             <RefreshCw className="animate-spin" size={18} />
           ) : isConnected ? (
             <>
                <RefreshCw size={18} />
                <span>Sync YouTube</span>
             </>
           ) : (
             <>
                <LogIn size={18} />
                <span>Connect YouTube</span>
             </>
           )}
         </button>

         <div className="space-y-1">
            <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 text-gray-300"
            >
                <Upload size={18} />
                <span>Import JSON</span>
            </button>
            <button 
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 text-gray-300"
            >
                <Download size={18} />
                <span>Export Data</span>
            </button>
            {lastUpdated && (
                <div className="text-[10px] text-center text-gray-600 flex items-center justify-center gap-1 mt-1">
                    <Clock size={10} />
                    Last import: {new Date(lastUpdated).toLocaleDateString()}
                </div>
            )}
         </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className="text-sm font-medium text-gray-300">
            {isConnected ? 'Connected' : 'Using Demo Data'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;