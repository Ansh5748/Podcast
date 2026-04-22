import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Video, Loader2, Play, Layout, Mic, User, Monitor, Upload, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Studio = () => {
  const [searchParams] = useSearchParams();
  const scriptIdParam = searchParams.get('script');
  
  const [scripts, setScripts] = useState([]);
  const [studios, setStudios] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [archivedVideos, setArchivedVideos] = useState([]);
  const [currentPart, setCurrentPart] = useState(0);
  
  useEffect(() => {
    loadData();
    loadArchivedVideos();
  }, []);
  
  const loadArchivedVideos = async () => {
    try {
      const res = await axios.get(`${API}/video/list`);
      setArchivedVideos(res.data.videos);
    } catch (error) {
      console.error('Failed to load archived videos:', error);
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([
        axios.get(`${API}/scripts`),
        axios.get(`${API}/video/studios`)
      ]);
      setScripts(sRes.data);
      setStudios(stRes.data.studios);
      
      if (scriptIdParam) {
        const script = sRes.data.find(s => s.id === scriptIdParam);
        if (script) setSelectedScript(script);
      }
    } catch (error) {
      console.error('Failed to load studio data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateVideo = async () => {
    if (!selectedScript || !selectedStudio) {
      alert('Please select a script and a studio setup');
      return;
    }
    
    setGenerating(true);
    setGenerationStatus(`Initializing cinematic environment for Part ${currentPart + 1}...`);
    
    try {
      const res = await axios.post(`${API}/video/generate`, {
        script_id: selectedScript.id,
        studio_id: selectedStudio.id,
        part_index: currentPart
      });
      
      // Simulate progression of part-based generation
      setTimeout(() => setGenerationStatus('Syncing Voicebox profiles (Indian Accent)...'), 2000);
      setTimeout(() => setGenerationStatus('Generating frame-consistent character bodies...'), 5000);
      setTimeout(() => setGenerationStatus(`Rendering part ${currentPart + 1} (30s segment)...`), 8000);
      
      setTimeout(() => {
        setVideoUrl(res.data.video.video_url);
        setPosterUrl(res.data.video.poster_url);
        setGenerating(false);
        setGenerationStatus(`Part ${currentPart + 1} Rendered Successfully`);
        loadArchivedVideos();
        setCurrentPart(prev => prev + 1);
      }, 12000);
      
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Failed to start video generation');
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF3B30]" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-screen">
      {/* Left Panel - Studio Controls */}
      <div className="md:col-span-4 border-r border-white/10 p-8 bg-[#050505]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-heading mb-2 flex items-center gap-2">
            <Video className="w-6 h-6 text-[#FF3B30]" />
            Video Studio
          </h1>
          <p className="text-xs text-[#8A8A8A] uppercase tracking-widest font-mono">
            Cinematic AI Orchestration
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Script Selection */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A8A8A] block mb-2">
              1. Select Script
            </label>
            <Select 
              value={selectedScript?.id} 
              onValueChange={(val) => setSelectedScript(scripts.find(s => s.id === val))}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/10 rounded-none h-12">
                <SelectValue placeholder="Choose archived script..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none">
                {scripts.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Studio Setup */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A8A8A] block mb-2">
              2. Studio Environment
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {studios.map((studio) => (
                <div 
                  key={studio.id}
                  onClick={() => setSelectedStudio(studio)}
                  className={`aspect-video border transition-all cursor-pointer relative group overflow-hidden ${
                    selectedStudio?.id === studio.id ? 'border-[#FF3B30]' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={studio.preview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={studio.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                  <div className="absolute bottom-2 left-2 text-[9px] font-mono uppercase tracking-tighter">
                    {studio.name}
                  </div>
                  {selectedStudio?.id === studio.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-3 h-3 text-[#FF3B30]" />
                    </div>
                  )}
                </div>
              ))}
              <div className="aspect-video border border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-[#8A8A8A] mb-1" />
                <span className="text-[8px] uppercase tracking-tighter text-[#8A8A8A]">Custom Setup</span>
              </div>
            </div>
          </div>
          
          {/* AI Settings */}
          <div className="p-4 bg-[#0A0A0A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">Voice Engine</span>
              <span className="text-[10px] font-mono text-[#FF3B30]">Voicebox v1.0 (Indian)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">Consistency</span>
              <span className="text-[10px] font-mono text-[#FF3B30]">Face-Lock Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8A8A8A]">Render Mode</span>
              <span className="text-[10px] font-mono text-[#FF3B30]">Sequential Parts</span>
            </div>
          </div>
          
          <Button
            onClick={handleGenerateVideo}
            disabled={generating || !selectedScript || !selectedStudio}
            className="w-full bg-[#FF3B30] hover:bg-[#FF574D] text-white rounded-none h-14 font-bold tracking-widest uppercase text-xs"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {generationStatus}</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Initialize Render</>
            )}
          </Button>

          {/* Archived Videos */}
          {archivedVideos.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-4">
                Recently Rendered
              </h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {archivedVideos.map((vid) => (
                  <div 
                    key={vid.id}
                    onClick={() => {
                      setVideoUrl(vid.video_url);
                      setPosterUrl(vid.poster_url);
                    }}
                    className={`p-3 border transition-all cursor-pointer group flex items-center justify-between ${
                      videoUrl === vid.video_url ? 'bg-[#141414] border-[#FF3B30]' : 'bg-[#0A0A0A] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-black border border-white/5 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-[#8A8A8A] group-hover:text-[#FF3B30]" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-white truncate">{vid.title}</div>
                        <div className="text-[9px] font-mono text-[#8A8A8A] uppercase">{vid.studio_name}</div>
                      </div>
                    </div>
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this render?')) {
                          await axios.delete(`${API}/video/${vid.id}`);
                          loadArchivedVideos();
                          if (videoUrl === vid.video_url) setVideoUrl(null);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#FF3B30] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel - Viewport */}
      <div className="md:col-span-8 bg-[#000] relative overflow-hidden">
        {generating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
            {selectedStudio && (
               <img 
                 src={selectedStudio.preview} 
                 className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" 
                 alt="Environment Setup"
               />
            )}
            
            {/* Characters Mockup while generating */}
            <div className="absolute inset-0 flex items-end justify-center gap-48 pb-24 z-10 scale-75 opacity-50">
                 {/* Host Setup */}
                 <div className="flex flex-col items-center relative">
                    <div className="w-56 h-64 bg-zinc-900/90 rounded-t-[3rem] border-x-4 border-t-4 border-white/5 relative overflow-hidden shadow-2xl">
                       <div className="absolute inset-x-8 top-16 w-40 h-40 rounded-full border-2 border-[#FF3B30] overflow-hidden bg-black z-10 shadow-[0_0_30px_rgba(255,59,48,0.3)]">
                          <img src={selectedScript?.host_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedScript?.host_name}`} className="w-full h-full object-cover" alt="Host" />
                       </div>
                    </div>
                 </div>

                 {/* Guest Setup */}
                 <div className="flex flex-col items-center relative">
                    <div className="w-56 h-64 bg-zinc-900/90 rounded-t-[3rem] border-x-4 border-t-4 border-white/5 relative overflow-hidden shadow-2xl">
                       <div className="absolute inset-x-8 top-16 w-40 h-40 rounded-full border-2 border-white/20 overflow-hidden bg-black z-10">
                          <img src={selectedScript?.guest_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedScript?.guest_name}`} className="w-full h-full object-cover" alt="Guest" />
                       </div>
                    </div>
                 </div>
            </div>

            <div className="relative z-20 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-[#FF3B30] animate-spin mb-6" />
              <div className="w-64 h-1 bg-white/10 mb-4 overflow-hidden">
                <div className="h-full bg-[#FF3B30] animate-progress" style={{ width: '40%' }}></div>
              </div>
              <p className="text-[10px] font-mono text-[#FF3B30] animate-pulse tracking-[0.5em] uppercase">
                {generationStatus}
              </p>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="h-full flex flex-col relative bg-black">
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain z-20"
                poster={posterUrl || selectedStudio?.preview}
              />
              
              {/* Overlay Info */}
              <div className="absolute top-8 left-8 p-4 bg-black/60 backdrop-blur-md border border-white/10 z-40">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" />
                    <div className="text-[10px] font-mono text-[#FF3B30] uppercase tracking-[0.2em]">Live AI Render</div>
                 </div>
                 <div className="text-sm font-bold text-white tracking-tight">{selectedScript?.title}</div>
              </div>
            </div>
            
            {/* Control Bar */}
            <div className="h-24 border-t border-white/10 bg-[#050505] p-6 flex items-center justify-between">
              <div className="flex gap-4">
                 <Button variant="ghost" className="text-white hover:bg-white/5 rounded-none border border-white/10 h-10 px-6">
                    <RefreshCw className="w-4 h-4 mr-2" /> Reshoot Part
                 </Button>
                 <Button className="bg-white text-black hover:bg-[#FF3B30] hover:text-white rounded-none h-10 px-8">
                    Proceed to Part 2
                 </Button>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-widest">
                <span>00:00 / 00:30</span>
                <span>1080p AI-HQ</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <Monitor className="w-32 h-32 mb-6" />
            <h2 className="text-3xl font-heading font-bold uppercase tracking-[1em]">Viewport</h2>
            <p className="text-xs font-mono mt-4 uppercase tracking-widest">Awaiting studio initialization</p>
          </div>
        )}
        
        {/* Cinematic Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20" />
        <div className="absolute top-10 left-10 text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">Safe Area</div>
        <div className="absolute bottom-10 right-10 text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">REC • 4K</div>
      </div>
    </div>
  );
};

export default Studio;
