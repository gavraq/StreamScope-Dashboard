import React, { useMemo } from 'react';
import { Channel, WatchedVideo } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Clock, Video, Activity } from 'lucide-react';
import ActivityHeatmap from './ActivityHeatmap';

interface DashboardProps {
  channels: Channel[];
  history: WatchedVideo[];
}

const Dashboard: React.FC<DashboardProps> = ({ channels, history }) => {
  
  const stats = useMemo(() => {
    const totalVideos = history.length;
    const uniqueChannels = new Set(history.map(h => h.channelId)).size;
    
    // Most watched category
    const categoryCounts: Record<string, number> = {};
    history.forEach(v => {
      const ch = channels.find(c => c.id === v.channelId);
      if (ch) {
        categoryCounts[ch.category] = (categoryCounts[ch.category] || 0) + 1;
      }
    });
    
    // Sort categories
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Top channels by watch count
    const channelCounts: Record<string, number> = {};
    history.forEach(v => {
      const ch = channels.find(c => c.id === v.channelId);
      if (ch) channelCounts[ch.name] = (channelCounts[ch.name] || 0) + 1;
    });
    const sortedChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { totalVideos, uniqueChannels, sortedCategories, sortedChannels };
  }, [channels, history]);

  const COLORS = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#3b82f6'];

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-24 max-w-7xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Overview</h2>
        <p className="text-slate-400">Your streaming habits at a glance.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Watched</p>
              <h3 className="text-4xl font-bold text-white mt-2 tracking-tighter">{stats.totalVideos}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <Video className="text-rose-500" size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp size={14} />
            <span>+12% this month</span>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Creators</p>
              <h3 className="text-4xl font-bold text-white mt-2 tracking-tighter">{stats.uniqueChannels}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <TrendingUp className="text-blue-500" size={24} />
            </div>
          </div>
           <div className="mt-4 text-sm text-slate-500">
            Across {channels.length} subscriptions
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Top Category</p>
              <h3 className="text-4xl font-bold text-white mt-2 truncate max-w-[150px] tracking-tighter">
                {stats.sortedCategories[0]?.name || 'N/A'}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Clock className="text-amber-500" size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Based on recent history
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-emerald-500" size={20} />
            Year in Pixels
        </h3>
        <ActivityHeatmap history={history} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Top Channels</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sortedChannels}>
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.sortedChannels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Categories Distribution</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.sortedCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.sortedCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {stats.sortedCategories.map((cat, idx) => (
               <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                  <span className="text-sm text-slate-400">{cat.name}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;