import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Loader2, User, Trash2, CheckCircle2, Sparkles, RefreshCcw, Save, X, Globe, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [formData, setFormData] = useState({
    world_id: '',
    name: '',
    age: '', // New field for age
    profession: '',
    prompt: '',
    continent: '',
    country: '',
    state: '',
    city: '',
    is_real_person: false
  });
  const [selectedChar, setSelectedChar] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [editData, setEditData] = useState({});

  // Derived location options for Create
  const selectedWorld = worlds.find(w => w.id === formData.world_id);
  const continentOptions = selectedWorld?.continents || [];
  const countryOptions = continentOptions.find(c => c.name === formData.continent)?.countries || [];
  const stateOptions = countryOptions.find(c => c.name === formData.country)?.states || [];
  const cityOptions = stateOptions.find(s => s.name === formData.state)?.cities || [];

  // Derived location options for Edit
  const selectedEditWorld = worlds.find(w => w.id === editData.world_id);
  const editContinentOptions = selectedEditWorld?.continents || [];
  const editCountryOptions = editContinentOptions.find(c => c.name === editData.continent)?.countries || [];
  const editStateOptions = editCountryOptions.find(c => c.name === editData.country)?.states || [];
  const editCityOptions = editStateOptions.find(s => s.name === editData.state)?.cities || [];
  
  useEffect(() => {
    loadCharacters();
    loadWorlds();
  }, []);
  
  const loadCharacters = async () => {
    try {
      const res = await axios.get(`${API}/characters`);
      setCharacters(res.data);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };
  
  const loadWorlds = async () => {
    try {
      const res = await axios.get(`${API}/worlds`);
      setWorlds(res.data);
    } catch (error) {
      console.error('Failed to load worlds:', error);
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
        type: 'character',
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
    if (!formData.world_id) {
      alert('Please select a world');
      return;
    }
    
    setLoading(true);
    try {
      // Build location string
      const location = `${formData.city}, ${formData.state}, ${formData.country}, ${formData.continent}`.replace(/^, /, '');
      
      const payload = {
        ...formData,
        current_location: location
      };

      const res = await axios.post(`${API}/characters/generate`, payload);
      setCharacters([res.data, ...characters]);
      setSelectedChar(res.data);
      setFormData({ 
        world_id: '', 
        name: '', 
        profession: '', 
        prompt: '', 
        continent: '',
        country: '',
        state: '',
        city: '',
        is_real_person: false 
      });
    } catch (error) {
      console.error('Character generation failed:', error);
      alert('Failed to generate character. ' + (error.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (charId) => {
    if (!window.confirm('Delete this character?')) return;
    
    try {
      await axios.delete(`${API}/characters/${charId}`);
      setCharacters(characters.filter(c => c.id !== charId));
      if (selectedChar?.id === charId) setSelectedChar(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleUpdate = async () => {
    setEditLoading(true);
    try {
      // Build location string from dropdowns
      const location = `${editData.city}, ${editData.state}, ${editData.country}, ${editData.continent}`.replace(/^, , , /, '');
      
      const payload = {
        ...editData,
        current_location: location
      };
      
      const res = await axios.patch(`${API}/characters/${selectedChar.id}`, payload);
      setCharacters(characters.map(c => c.id === res.data.id ? res.data : c));
      setSelectedChar(res.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update character');
    } finally {
      setEditLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    setEditLoading(true);
    try {
      const res = await axios.patch(`${API}/characters/${selectedChar.id}`, { regenerate_image: true });
      setCharacters(characters.map(c => c.id === res.data.id ? res.data : c));
      setSelectedChar(res.data);
      
      if (res.data.image_url?.includes('dicebear')) {
        alert('Primary image generation services (FAL/HuggingFace) are currently unavailable or balance is exhausted. A high-quality placeholder avatar has been assigned instead.');
      }
    } catch (error) {
      console.error('Image regeneration failed:', error);
      alert('Failed to regenerate image');
    } finally {
      setEditLoading(false);
    }
  };

  const startEditing = () => {
    // Parse current location string to pre-fill dropdowns if possible
    // Format: "City, State, Country, Continent"
    const parts = selectedChar.current_location?.split(', ').reverse() || [];
    
    setEditData({
      world_id: selectedChar.world_id,
      name: selectedChar.name,
      age: selectedChar.age,
      profession: selectedChar.profession,
      continent: parts[0] || '',
      country: parts[1] || '',
      state: parts[2] || '',
      city: parts[3] || '',
      visual_description: selectedChar.visual_description
    });
    setIsEditing(true);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-screen">
      {/* Left Panel - Controls */}
      <div className="md:col-span-5 border-r border-white/10 p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-bold font-heading mb-2">
            Character Engine
          </h1>
          <p className="text-sm text-[#8A8A8A]">
            Create characters with unique personalities and backgrounds
          </p>
        </div>
        
        {/* Generation Form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Select World
            </label>
            <Select value={formData.world_id} onValueChange={(val) => setFormData({ ...formData, world_id: val })}>
              <SelectTrigger data-testid="world-select" className="bg-[#050505] border-white/10 rounded-none text-white">
                <SelectValue placeholder="Choose a world..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0A0A] border-white/10 rounded-none">
                {worlds.map((world) => (
                  <SelectItem key={world.id} value={world.id} className="text-white hover:bg-[#141414]">
                    {world.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Character Name (Optional)
            </label>
            <Input
              data-testid="character-name-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Dr. Aria Chen"
              className="bg-[#050505] border-white/10 focus:border-[#FF3B30] rounded-none text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
                Age
              </label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 28"
                className="bg-[#050505] border-white/10 focus:border-[#FF3B30] rounded-none text-white"
              />
            </div>
            <div>
              <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
                Role / Profession
              </label>
              <Input
                data-testid="character-profession-input"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="e.g., Student, Doctor"
                className="bg-[#050505] border-white/10 focus:border-[#FF3B30] rounded-none text-white"
              />
            </div>
          </div>

          {/* Location Hierarchy Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] tracking-widest uppercase font-mono text-[#8A8A8A] block mb-1">Continent</label>
              <Select value={formData.continent} onValueChange={(val) => setFormData({ ...formData, continent: val, country: '', state: '', city: '' })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-8 text-xs">
                  <SelectValue placeholder="Continent" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10">
                  {continentOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase font-mono text-[#8A8A8A] block mb-1">Country</label>
              <Select value={formData.country} onValueChange={(val) => setFormData({ ...formData, country: val, state: '', city: '' })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-8 text-xs">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10">
                  {countryOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase font-mono text-[#8A8A8A] block mb-1">State</label>
              <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val, city: '' })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-8 text-xs">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10">
                  {stateOptions.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase font-mono text-[#8A8A8A] block mb-1">City</label>
              <Select value={formData.city} onValueChange={(val) => setFormData({ ...formData, city: val })}>
                <SelectTrigger className="bg-[#050505] border-white/10 rounded-none text-white h-8 text-xs">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 max-h-60 overflow-y-auto">
                  {cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
            <label className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] block mb-2">
              Character Description (Optional)
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
              data-testid="character-prompt-input"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Describe the character or paste social links for Digital Twin..."
              rows={4}
              className="bg-[#050505] border-white/10 focus:border-[#FF3B30] rounded-none text-white resize-none"
            />
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="is_real_person" 
              checked={formData.is_real_person}
              onCheckedChange={(checked) => setFormData({ ...formData, is_real_person: checked })}
              className="border-white/20 data-[state=checked]:bg-[#FF3B30]"
            />
            <label htmlFor="is_real_person" className="text-sm text-[#8A8A8A] cursor-pointer">
              Onboard as Digital Twin (Real Person)
            </label>
          </div>
          
          <Button
            data-testid="generate-character-button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#FF3B30] hover:bg-[#FF574D] text-white rounded-none h-12 font-medium"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Character...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Generate Character</>
            )}
          </Button>
        </div>
        
        {/* Character List */}
        <div>
          <div className="text-xs tracking-[0.2em] uppercase font-mono text-[#8A8A8A] mb-3">
            Characters ({characters.length})
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {characters.map((char) => (
              <div
                key={char.id}
                data-testid={`character-item-${char.id}`}
                onClick={() => setSelectedChar(char)}
                className={`p-3 border transition-colors cursor-pointer flex items-start justify-between ${
                  selectedChar?.id === char.id
                    ? 'bg-[#141414] border-[#FF3B30]'
                    : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2 flex-1">
                  <User className="w-4 h-4 mt-0.5 text-[#FF3B30]" />
                  <div>
                    <div className="text-sm font-medium">{char.name}</div>
                    <div className="text-xs text-[#8A8A8A]">{char.profession} • {char.world_name}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(char.id);
                  }}
                  className="text-[#8A8A8A] hover:text-[#FF3B30] transition-colors"
                  data-testid={`delete-character-${char.id}`}
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
        {selectedChar ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative group">
                {selectedChar.image_url && (
                  <div className="w-32 h-32 bg-[#0A0A0A] border border-white/10 overflow-hidden relative">
                    <img 
                      src={selectedChar.image_url} 
                      alt={selectedChar.name}
                      className="w-full h-full object-cover"
                    />
                    {editLoading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#FF3B30]" />
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleRegenerateImage}
                  disabled={editLoading}
                  className="absolute -bottom-2 -right-2 bg-[#141414] border border-white/10 p-1.5 rounded-full hover:border-[#FF3B30] transition-colors shadow-lg"
                  title="Regenerate Identity / Image"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 text-[#FF3B30] ${editLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl tracking-tight font-semibold font-heading">
                      {selectedChar.name}
                    </h2>
                    {selectedChar.is_real_person && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#FF3B30]" />
                        <span className="text-[10px] font-mono text-[#FF3B30] uppercase">Digital Twin</span>
                      </div>
                    )}
                  </div>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEditing}
                      className="text-[#8A8A8A] hover:text-white"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-[#8A8A8A] hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUpdate}
                        disabled={editLoading}
                        className="text-[#FF3B30] hover:text-[#FF574D]"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">World</label>
                        <Select value={editData.world_id} onValueChange={(val) => setEditData({ ...editData, world_id: val, continent: '', country: '', state: '', city: '' })}>
                          <SelectTrigger className="bg-[#050505] border-white/10 rounded-none h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            {worlds.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">Profession</label>
                        <Input
                          value={editData.profession}
                          onChange={(e) => setEditData({ ...editData, profession: e.target.value })}
                          className="bg-[#050505] border-white/10 rounded-none h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">Age</label>
                        <Input
                          type="number"
                          value={editData.age}
                          onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                          className="bg-[#050505] border-white/10 rounded-none h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">Continent</label>
                        <Select value={editData.continent} onValueChange={(val) => setEditData({ ...editData, continent: val, country: '', state: '', city: '' })}>
                          <SelectTrigger className="bg-[#050505] border-white/10 rounded-none h-8 text-xs">
                            <SelectValue placeholder="Continent" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            {editContinentOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">Country</label>
                        <Select value={editData.country} onValueChange={(val) => setEditData({ ...editData, country: val, state: '', city: '' })}>
                          <SelectTrigger className="bg-[#050505] border-white/10 rounded-none h-8 text-xs">
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            {editCountryOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">State</label>
                        <Select value={editData.state} onValueChange={(val) => setEditData({ ...editData, state: val, city: '' })}>
                          <SelectTrigger className="bg-[#050505] border-white/10 rounded-none h-8 text-xs">
                            <SelectValue placeholder="State" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            {editStateOptions.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8A8A8A] block mb-1">City</label>
                        <Select value={editData.city} onValueChange={(val) => setEditData({ ...editData, city: val })}>
                          <SelectTrigger className="bg-[#050505] border-white/10 rounded-none h-8 text-xs">
                            <SelectValue placeholder="City" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A0A0A] border-white/10">
                            {editCityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-[#8A8A8A]">
                      {selectedChar.profession} • {selectedChar.age} years • {selectedChar.world_name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4">
                      <div className="text-[10px] font-mono text-[#FF3B30] uppercase tracking-wider">
                        Status: {selectedChar.career_status} @ {selectedChar.current_location}
                      </div>
                      <div className="text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
                        Coordinates: {selectedChar.lat?.toFixed(4)}, {selectedChar.lng?.toFixed(4)}
                      </div>
                    </div>

                    {/* Voice Testing Section (Outside Edit) */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 border border-white/5 group/voice relative overflow-hidden flex flex-col justify-between h-24">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-[#8A8A8A] mb-1 flex items-center justify-between">
                            <span>Voice Profile</span>
                            <RefreshCcw 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (loadingVoice) return;
                                setLoadingVoice(true);
                                try {
                                  const res = await axios.get(`${API}/characters/${selectedChar.id}/test-voice`);
                                  const audio = new Audio(res.data.voice_url);
                                  audio.oncanplaythrough = () => {
                                    audio.play();
                                    setLoadingVoice(false);
                                  };
                                  audio.onerror = () => {
                                    setLoadingVoice(false);
                                    alert("Voice load failed. Please try again.");
                                  };
                                } catch (err) {
                                  console.error('Voice test failed:', err);
                                  setLoadingVoice(false);
                                }
                              }}
                              className={`w-3 h-3 text-[#FF3B30] cursor-pointer transition-transform ${loadingVoice ? 'animate-spin' : 'hover:rotate-180'}`} 
                            />
                          </div>
                          <div className="text-xs font-mono text-[#FF3B30]">{selectedChar.voice_id}</div>
                        </div>
                        <Button 
                          disabled={loadingVoice}
                          onClick={async () => {
                            setLoadingVoice(true);
                            try {
                              const res = await axios.get(`${API}/characters/${selectedChar.id}/test-voice`);
                              const audio = new Audio(res.data.voice_url);
                              audio.oncanplaythrough = () => {
                                audio.play();
                                setLoadingVoice(false);
                              };
                              audio.onerror = () => {
                                setLoadingVoice(false);
                                alert("Voice source error. Please try again.");
                              };
                            } catch (err) {
                              console.error('Voice test failed:', err);
                              setLoadingVoice(false);
                              alert('Voice engine is warming up. Please try again.');
                            }
                          }}
                          size="sm"
                          className="w-full bg-[#FF3B30] hover:bg-[#FF574D] text-white text-[10px] font-bold uppercase tracking-widest rounded-none h-8"
                        >
                          {loadingVoice ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 mr-2 fill-current" />
                          )}
                          {loadingVoice ? 'Initializing...' : 'Test Voice Sample'}
                        </Button>
                      </div>
                      <div className="p-4 bg-white/5 border border-white/5 flex flex-col justify-between h-24">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-[#8A8A8A] mb-1">Voice Accent</div>
                          <div className="text-xs font-mono text-white">{selectedChar.voice_accent || 'Indian (Standard)'}</div>
                        </div>
                        <div className="text-[9px] font-mono text-[#8A8A8A] uppercase italic">
                          Age: {selectedChar.age}y Profile
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Personality & Mindset
                </div>
                <p className="text-sm mb-3">{selectedChar.personality}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedChar.personality_traits?.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#141414] border border-white/10 text-[10px] text-[#8A8A8A]">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Human Behavior Profile
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8A8A8A]">Thinking Style:</span>
                    <span>{selectedChar.thinking_style}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8A8A8A]">Humor:</span>
                    <span>{selectedChar.humor_style}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8A8A8A]">Expertise:</span>
                    <span>{selectedChar.expertise}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-3">
                Backstory & Context
              </div>
              <p className="text-sm leading-relaxed text-[#8A8A8A]">
                {selectedChar.backstory}
              </p>
            </div>

            {selectedChar.visual_description && (
              <div className="bg-[#0A0A0A] border border-white/10 p-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A] mb-2">
                  Visual Identity
                </div>
                <p className="text-xs text-[#8A8A8A] italic">
                  {selectedChar.visual_description}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <User className="w-16 h-16 mx-auto mb-4 text-[#8A8A8A]" />
              <p className="text-[#8A8A8A]">Generate or select a character to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Characters;
