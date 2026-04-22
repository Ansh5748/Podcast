import { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Globe, Users, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    worlds: 0,
    characters: 0,
    scripts: 0
  });
  const [health, setHealth] = useState(null);
  
  useEffect(() => {
    loadStats();
    checkHealth();
  }, []);
  
  const loadStats = async () => {
    try {
      const [worldsRes, charsRes, scriptsRes] = await Promise.all([
        axios.get(`${API}/worlds`),
        axios.get(`${API}/characters`),
        axios.get(`${API}/scripts`)
      ]);
      
      setStats({
        worlds: worldsRes.data.length,
        characters: charsRes.data.length,
        scripts: scriptsRes.data.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };
  
  const checkHealth = async () => {
    try {
      const res = await axios.get(`${API}/ollama/health`);
      setHealth(res.data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };
  
  const statCards = [
    { icon: Globe, label: 'Worlds Created', value: stats.worlds, color: '#FF3B30' },
    { icon: Users, label: 'Characters', value: stats.characters, color: '#00FF66' },
    { icon: FileText, label: 'Podcast Scripts', value: stats.scripts, color: '#FFCC00' }
  ];
  
  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl tracking-tighter font-black font-heading mb-4">
          Fictional World Podcast Studio
        </h1>
        <p className="text-base leading-relaxed text-[#8A8A8A] max-w-3xl">
          Multi-layered AI system for generating hyper-realistic podcast videos in fully fictional worlds.
          Create worlds, design characters, and generate cinematic conversations.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              data-testid={`stat-card-${stat.label.toLowerCase().replace(' ', '-')}`}
              className="bg-[#0A0A0A] border border-white/10 p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A]">
                  Total
                </div>
              </div>
              <div className="text-3xl font-black font-heading mb-1">{stat.value}</div>
              <div className="text-sm text-[#8A8A8A]">{stat.label}</div>
            </div>
          );
        })}
      </div>
      
      {/* System Health */}
      <div className="bg-[#0A0A0A] border border-white/10 p-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-4">
          AI Engine Status
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${health?.ollama_available ? 'bg-[#00FF66]' : 'bg-[#FF3B30]'}`}></div>
              <span className="font-mono text-sm">Ollama (Local LLM)</span>
            </div>
            <span className="text-xs text-[#8A8A8A]">
              {health?.ollama_available ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#050505] border border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${health?.gemini_available ? 'bg-[#00FF66]' : 'bg-[#FF3B30]'}`}></div>
              <span className="font-mono text-sm">Gemini (Cloud LLM)</span>
            </div>
            <span className="text-xs text-[#8A8A8A]">
              {health?.gemini_available ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Start */}
      <div className="mt-8 bg-[#0A0A0A] border border-white/10 p-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-4">
          Quick Start Guide
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center bg-[#FF3B30] text-white text-xs font-mono font-bold">
              1
            </div>
            <div>
              <div className="text-sm font-medium">Generate World Intro (1-Hour Special)</div>
              <div className="text-xs text-[#8A8A8A]">Create the foundational story video for your fictional planet</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center bg-[#FF3B30] text-white text-xs font-mono font-bold">
              2
            </div>
            <div>
              <div className="text-sm font-medium">Onboard Digital Twins</div>
              <div className="text-xs text-[#8A8A8A]">Add real people with exact behavior and thinking patterns</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center bg-[#FF3B30] text-white text-xs font-mono font-bold">
              3
            </div>
            <div>
              <div className="text-sm font-medium">Launch Content Channels</div>
              <div className="text-xs text-[#8A8A8A]">Generate podcasts, news, and movies with 100% human realism</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
