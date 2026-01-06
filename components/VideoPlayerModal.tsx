import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { WatchedVideo } from '../types';

interface VideoPlayerModalProps {
  video: WatchedVideo | null;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-slate-950">
          <h3 className="text-white font-medium truncate pr-4">{video.title}</h3>
          <div className="flex items-center gap-2">
            <a 
                href={`https://www.youtube.com/watch?v=${video.id}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Open in YouTube"
            >
                <ExternalLink size={20} />
            </a>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-rose-500 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Player Container */}
        <div className="relative pt-[56.25%] bg-black w-full">
            <iframe 
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>

        {/* Info Footer */}
        <div className="p-6 bg-slate-900 overflow-y-auto custom-scrollbar">
             <div className="flex items-start gap-4">
                 <div className="flex-1">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {video.description || 'No description available.'}
                    </p>
                 </div>
                 {video.aiSummary && (
                     <div className="w-72 flex-shrink-0 bg-blue-900/10 border border-blue-500/10 p-4 rounded-xl">
                         <h4 className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-2 tracking-wider">
                             AI Summary
                         </h4>
                         <p className="text-blue-200/80 text-sm italic leading-relaxed">"{video.aiSummary}"</p>
                     </div>
                 )}
             </div>
             
             {video.commentary && (
                 <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-wider">Your Notes</h4>
                    <p className="text-slate-300 text-sm">{video.commentary}</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;