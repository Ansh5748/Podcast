import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Loader2, FileText, Trash2, Play, RefreshCw, ChevronDown, Wand2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Scripts = () => {
  const [scripts, setScripts] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  const [rethinkIndex, setRethinkIndex] = useState(null);
  const [formData, setFormData] = useState({
    topic: '',
    host_character_id: '',
    guest_character_id: '',
    style: 'conversational',
    language: 'English'
  });

  const INDIAN_LANGUAGES = [
    "English", "Hinglish", "Hindi", "Punjabi", "Gujarati", "Kannada", "Tamil", "Telugu", "Malayalam", 
    "Marathi", "Bengali", "Odia", "Assamese", "Haryanvi", "Bhojpuri", "Rajasthani", "Kashmiri"
  ];
  
  const GLOBAL_LANGUAGES = [
    "Korean", "German", "Russian", "Spanish", "French", "Japanese", "Mandarin", "Arabic"
  ];
  const [selectedScript, setSelectedScript] = useState(null);
  
  useEffect(() => {
    loadScripts();
    loadCharacters();
  }, []);
  
  const loadScripts = async () => {
    try {
      const res = await axios.get(`${API}/scripts`);
      setScripts(res.data);
    } catch (error) {
      console.error('Failed to load scripts:', error);
    }
  };
  
  const loadCharacters = async () => {
    try {
      const res = await axios.get(`${API}/characters`);
      setCharacters(res.data);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };
  
  const handleGenerate = async () => {
    if (!formData.topic || !formData.host_character_id || !formData.guest_character_id) {
      alert('Please fill all fields');
      return;
    }
    
    if (formData.host_character_id === formData.guest_character_id) {
      alert('Host and guest must be different characters');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/scripts/generate`, formData);
      setScripts([res.data, ...scripts]);
      setSelectedScript(res.data);
      setFormData({ topic: '', host_character_id: '', guest_character_id: '', style: 'conversational' });
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('Failed to generate script. ' + (error.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (newStyle) => {
    if (!selectedScript) return;
    setExtendLoading(true);
    try {
      const res = await axios.post(`${API}/scripts/${selectedScript.id}/extend`, { style: newStyle });
      setScripts(scripts.map(s => s.id === res.data.id ? res.data : s));
      setSelectedScript(res.data);
    } catch (error) {
      console.error('Extension failed:', error);
      alert('Failed to extend script');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleRethink = async (index) => {
    if (!selectedScript) return;
    setRethinkIndex(index);
    try {
      const res = await axios.post(`${API}/scripts/${selectedScript.id}/rethink/${index}`);
      setScripts(scripts.map(s => s.id === res.data.id ? res.data : s));
      setSelectedScript(res.data);
    } catch (error) {
      console.error('Rethink failed:', error);
    } finally {
      setRethinkIndex(null);
    }
  };
  
  const handleDelete = async (scriptId) => {
    if (!window.confirm('Delete this script?')) return;
    
    try {
      await axios.delete(`${API}/scripts/${scriptId}`);
      setScripts(scripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) setSelectedScript(null);
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
            Podcast Engine
          </h1>
          <p className="text-sm text-[#8A8A8A]">
            Generate 1hr+ high-stakes conversations with elite podcast styles
          </p>
        </div>
        
        {/* Generation Form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Podcast Topic
            </label>
            <Input
              data-testid="script-topic-input"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., The Secret History of Aetheria-9"
              className="bg-[#050505] border-white/10 focus:border-[#FF3B30] rounded-none text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
                Host
              </label>
              <Select value={formData.host_character_id} onValueChange={(val) => setFormData({ ...formData, host_character_id: val })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-10">
                  <SelectValue placeholder="Host..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id} className="text-white">
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
                Guest
              </label>
              <Select value={formData.guest_character_id} onValueChange={(val) => setFormData({ ...formData, guest_character_id: val })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-10">
                  <SelectValue placeholder="Guest..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none">
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id} className="text-white">
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Initial Style / Pivot
            </label>
            <Select value={formData.style} onValueChange={(val) => setFormData({ ...formData, style: val })}>
              <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none">
                <SelectItem value="conversational" className="text-white">Conversational (Joe Rogan Style)</SelectItem>
                <SelectItem value="intense" className="text-white">Intense (PBD Podcast Style)</SelectItem>
                <SelectItem value="vulnerable" className="text-white">Vulnerable (Diary of a CEO Style)</SelectItem>
                <SelectItem value="technical" className="text-white">Deep Tech (Huberman Style)</SelectItem>
                <SelectItem value="controversial" className="text-white">Controversial (Tucker Style)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Language
            </label>
            <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
              <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none max-h-60 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] text-[#8A8A8A] uppercase font-bold">Indian & Regional</div>
                {INDIAN_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang} className="text-white">{lang}</SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] text-[#8A8A8A] uppercase font-bold mt-2">Global</div>
                {GLOBAL_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang} className="text-white">{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#FF3B30] hover:bg-[#FF574D] text-white rounded-none h-12 font-medium"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Orchestrating Script...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Generate Master Script</>
            )}
          </Button>
        </div>
        
        {/* Script List */}
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] mb-3">
            Archives ({scripts.length})
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scripts.map((script) => (
              <div
                key={script.id}
                onClick={() => setSelectedScript(script)}
                className={`p-3 border transition-colors cursor-pointer flex items-start justify-between ${
                  selectedScript?.id === script.id
                    ? 'bg-[#141414] border-[#FF3B30]'
                    : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2 flex-1">
                  <FileText className="w-4 h-4 mt-0.5 text-[#FF3B30]" />
                  <div>
                    <div className="text-sm font-medium line-clamp-1">{script.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">{script.conversation.length} exchanges • {script.host_name} & {script.guest_name}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(script.id);
                  }}
                  className="text-[#8A8A8A] hover:text-[#FF3B30] transition-colors"
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
        {selectedScript ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl tracking-tight font-bold font-heading mb-2">
                  {selectedScript.title}
                </h2>
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-[#8A8A8A]">
                  <span className="text-[#FF3B30]">{selectedScript.host_name}</span>
                  <span>vs</span>
                  <span className="text-[#FF3B30]">{selectedScript.guest_name}</span>
                  <span>•</span>
                  <span>{selectedScript.topic}</span>
                  <span>•</span>
                  <span className="text-white bg-[#FF3B30]/20 px-2 py-0.5">{selectedScript.language || 'English'}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-[#141414] border border-white/10 text-white hover:bg-white hover:text-black rounded-none"
                  onClick={() => window.location.href = '/studio?script=' + selectedScript.id}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Studio
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#FF3B30] hover:bg-[#FF574D] text-white rounded-none"
                  disabled={extendLoading}
                  onClick={() => handleExtend()}
                >
                  {extendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Extend (4+)
                </Button>
              </div>
            </div>
            
            {/* Script Content */}
            <div className="space-y-8 pb-20">
              {selectedScript.conversation.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`relative group flex flex-col ${line.character_name === selectedScript.host_name ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {line.character_name === selectedScript.host_name && (
                      <div className="w-8 h-8 bg-[#FF3B30] flex items-center justify-center text-[10px] font-bold">H</div>
                    )}
                    <div className={`flex flex-col ${line.character_name === selectedScript.host_name ? 'items-start' : 'items-end'}`}>
                      <span className="text-[10px] font-mono text-[#FF3B30] uppercase tracking-[0.2em] mb-0.5">
                        {line.character_name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-[#8A8A8A] uppercase tracking-tighter">
                        {line.emotion || 'Neutral'}
                      </span>
                    </div>
                    {line.character_name !== selectedScript.host_name && (
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-[10px] font-bold">G</div>
                    )}
                    
                    {/* Rethink Button */}
                    <button 
                      onClick={() => handleRethink(idx)}
                      disabled={rethinkIndex === idx}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:text-[#FF3B30]"
                      title="Rethink this exchange"
                    >
                      {rethinkIndex === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </button>
                  </div>
                  
                  {line.thought && (
                    <div className="mb-3 max-w-[70%] p-4 bg-[#050505] border-l border-white/10 italic text-[11px] text-[#555] font-serif leading-relaxed">
                      <span className="text-[9px] font-mono uppercase not-italic block mb-2 opacity-30 tracking-widest">Subconscious Logic</span>
                      "{line.thought}"
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] p-5 border ${
                    line.character_name === selectedScript.host_name 
                      ? 'bg-[#0A0A0A] border-white/10 text-white' 
                      : 'bg-[#141414] border-[#FF3B30]/20 text-white'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{line.text}</p>
                  </div>
                </div>
              ))}
              
              {/* Bottom Extend Trigger */}
              <div className="flex justify-center pt-8 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  className="text-[#8A8A8A] hover:text-[#FF3B30] text-xs font-mono uppercase tracking-widest gap-2"
                  onClick={() => handleExtend()}
                  disabled={extendLoading}
                >
                  {extendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  Extend Conversation Archive
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center opacity-20">
            <div>
              <FileText className="w-24 h-24 mx-auto mb-6" />
              <p className="text-xl font-heading tracking-widest uppercase">Archive Empty</p>
              <p className="text-sm font-mono mt-2">Initialize script generator to begin content orchestration</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scripts;
