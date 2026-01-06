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
    { id: 'discover', label: 'Discover', icon: <Sparkles size={20} /> },
    { id: 'calendar', label: 'History', icon: <Calendar size={20} /> },
    { id: 'analyzer', label: 'Visual AI', icon: <ScanEye size={20} /> },
    { id: 'chat', label: 'Assistant', icon: <MessageSquareMore size={20} /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
    // Reset value to allow re-uploading same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-2xl">
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-lg flex items-center justify-center shadow-lg shadow-rose-900/20">
          <Youtube className="text-white" size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">StreamScope</h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              currentView === item.id
                ? 'bg-gradient-to-r from-rose-500/10 to-transparent text-rose-400 border-l-2 border-rose-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent'
            }`}
          >
            <span className={`${currentView === item.id ? 'text-rose-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
            </span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 pb-4 space-y-3">
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
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium shadow-lg text-sm ${
             isConnected 
             ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5' 
             : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20'
          }`}
         >
           {isSyncing ? (
             <RefreshCw className="animate-spin" size={16} />
           ) : isConnected ? (
             <>
                <RefreshCw size={16} />
                <span>Sync YouTube</span>
             </>
           ) : (
             <>
                <LogIn size={16} />
                <span>Connect</span>
             </>
           )}
         </button>

         <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all font-medium bg-slate-800/50 border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Import Takeout JSON"
            >
                <Upload size={16} />
                <span className="text-[10px]">Import</span>
            </button>
            <button 
                onClick={onExport}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all font-medium bg-slate-800/50 border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Export DB"
            >
                <Download size={16} />
                <span className="text-[10px]">Export</span>
            </button>
         </div>
         {lastUpdated && (
            <div className="text-[10px] text-center text-slate-600 flex items-center justify-center gap-1 pt-1">
                <Clock size={10} />
                Updated: {new Date(lastUpdated).toLocaleDateString()}
            </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
            <div className="flex flex-col">
                <p className="text-xs font-medium text-slate-300">
                    {isConnected ? 'Live Sync Active' : 'Demo Mode'}
                </p>
                <p className="text-[10px] text-slate-500">
                    {isConnected ? 'Connected to API' : 'Using Local Data'}
                </p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;