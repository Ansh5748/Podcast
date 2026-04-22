import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Loader2, Globe as GlobeIcon, Trash2, Sparkles, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InteractiveGlobe from '../components/InteractiveGlobe';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WorldEngine = () => {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    prompt: ''
  });
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [worldCharacters, setWorldCharacters] = useState([]);
  
  useEffect(() => {
    loadWorlds();
  }, []);

  useEffect(() => {
    if (selectedWorld) {
      loadWorldCharacters(selectedWorld.id);
    }
  }, [selectedWorld]);
  
  const loadWorlds = async () => {
    try {
      const res = await axios.get(`${API}/worlds`);
      setWorlds(res.data);
    } catch (error) {
      console.error('Failed to load worlds:', error);
    }
  };

  const loadWorldCharacters = async (worldId) => {
    try {
      const res = await axios.get(`${API}/characters?world_id=${worldId}`);
      setWorldCharacters(res.data);
    } catch (error) {
      console.error('Failed to load characters for world:', error);
    }
  };
  
  const handleSuggest = async () => {
    if (!formData.name && !formData.prompt) {
      alert('Provide a name or a few keywords first');
      return;
    }
    
    setSuggestLoading(true);
    try {
      const res = await axios.post(`${API}/ai/suggest`, {
        type: 'world',
        context: formData.prompt || formData.name
      });
      
      if (res.data.suggestion) {
        setFormData({ ...formData, prompt: res.data.suggestion });
      } else {
        alert('AI returned an empty suggestion. Try providing more context.');
      }
    } catch (error) {
      console.error('AI Suggestion failed:', error);
      alert('AI Suggestion failed. Please ensure the backend is running and LLM is configured.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.name && !formData.prompt) {
      alert('Please provide a world name or description');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/worlds/generate`, formData);
      setWorlds([res.data, ...worlds]);
      setSelectedWorld(res.data);
      setFormData({ name: '', prompt: '' });
    } catch (error) {
      console.error('World generation failed:', error);
      alert('Failed to generate world');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (worldId) => {
    if (!window.confirm('Delete this world?')) return;
    
    try {
      await axios.delete(`${API}/worlds/${worldId}`);
      setWorlds(worlds.filter(w => w.id !== worldId));
      if (selectedWorld?.id === worldId) setSelectedWorld(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-screen">
      {/* Left Panel - Controls */}
      <div className="md:col-span-5 border-r border-white/10 p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-bold font-heading mb-2">
            World Engine
          </h1>
          <p className="text-sm text-[#8A8A8A]">
            Create fully fictional worlds with unique cultures and geographies
          </p>
        </div>
        
        {/* Generation Form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              World Name
            </label>
            <Input
              data-testid="world-name-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aetheria"
              className="bg-[#050505] border-white/10 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]/50 rounded-none text-white"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A]">
                Description (Optional)
              </label>
              <button
                onClick={handleSuggest}
                disabled={suggestLoading}
                className="text-[10px] font-mono uppercase tracking-wider text-[#FF3B30] hover:text-[#FF574D] flex items-center gap-1 disabled:opacity-50"
              >
                {suggestLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Suggest
              </button>
            </div>
            <Textarea
              data-testid="world-prompt-input"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Describe the world you want to create..."
              rows={4}
              className="bg-[#050505] border-white/10 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]/50 rounded-none text-white resize-none"
            />
          </div>
          
          <Button
            data-testid="generate-world-button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#FF3B30] hover:bg-[#FF574D] text-white rounded-none h-12 font-medium"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating World...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Generate World</>
            )}
          </Button>
        </div>
        
        {/* World List */}
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] mb-3">
            Created Worlds ({worlds.length})
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {worlds.map((world) => (
              <div
                key={world.id}
                data-testid={`world-item-${world.id}`}
                onClick={() => setSelectedWorld(world)}
                className={`p-3 border transition-colors cursor-pointer flex items-start justify-between ${
                  selectedWorld?.id === world.id
                    ? 'bg-[#141414] border-[#FF3B30]'
                    : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2 flex-1">
                  <GlobeIcon className="w-4 h-4 mt-0.5 text-[#FF3B30]" />
                  <div>
                    <div className="text-sm font-medium">{world.name}</div>
                    <div className="text-xs text-[#8A8A8A] line-clamp-1">{world.description}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(world.id);
                  }}
                  className="text-[#8A8A8A] hover:text-[#FF3B30] transition-colors"
                  data-testid={`delete-world-${world.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Preview */}
      <div className="md:col-span-7 p-8 overflow-y-auto max-h-screen">
        {selectedWorld ? (
          <div className="space-y-6">
            {/* 3D Interactive Globe Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapIcon className="w-5 h-5 text-[#FF3B30]" />
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-white">Planetary Visualization</h3>
              </div>
              <InteractiveGlobe 
                characters={worldCharacters} 
                worldName={selectedWorld.name} 
                continents={selectedWorld.continents}
              />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl tracking-tight font-semibold font-heading mb-4">
                {selectedWorld.name}
              </h2>
              <p className="text-base leading-relaxed text-[#8A8A8A]">
                {selectedWorld.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Geography
                </div>
                <p className="text-sm">{selectedWorld.geography}</p>
              </div>
              
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Climate
                </div>
                <p className="text-sm">{selectedWorld.climate}</p>
              </div>
              
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Governance
                </div>
                <p className="text-sm">{selectedWorld.governance}</p>
              </div>
              
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Economy
                </div>
                <p className="text-sm">{selectedWorld.economy}</p>
              </div>
            </div>
            
            <div className="bg-[#0A0A0A] border border-white/10 p-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                Culture
              </div>
              <p className="text-sm">{selectedWorld.culture}</p>
            </div>
            
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A]">
                Planetary Hierarchy ({selectedWorld.continents?.length} Continents)
              </div>
              <div className="grid grid-cols-1 gap-4">
                {selectedWorld.continents?.map((continent, cIdx) => (
                  <div key={cIdx} className="bg-[#0A0A0A] border border-white/10 p-4">
                    <div className="text-sm font-bold text-white mb-2">{continent.name}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {continent.countries?.map((country, coIdx) => (
                        <div key={coIdx} className="text-xs text-[#8A8A8A] border-l border-white/10 pl-2">
                          <span className="text-white">{country.name}</span>
                          <div className="mt-1 text-[10px] opacity-50">
                            {country.states?.length} States • {country.states?.reduce((acc, s) => acc + (s.cities?.length || 0), 0)} Cities
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <GlobeIcon className="w-16 h-16 mx-auto mb-4 text-[#8A8A8A]" />
              <p className="text-[#8A8A8A]">Generate or select a world to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldEngine;
