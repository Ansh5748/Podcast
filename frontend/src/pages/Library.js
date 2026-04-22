import { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Users, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Library = () => {
  const [worlds, setWorlds] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [scripts, setScripts] = useState([]);
  
  useEffect(() => {
    loadAll();
  }, []);
  
  const loadAll = async () => {
    try {
      const [w, c, s] = await Promise.all([
        axios.get(`${API}/worlds`),
        axios.get(`${API}/characters`),
        axios.get(`${API}/scripts`)
      ]);
      setWorlds(w.data);
      setCharacters(c.data);
      setScripts(s.data);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-bold font-heading mb-2">
          Content Library
        </h1>
        <p className="text-sm text-[#8A8A8A]">
          Browse all created worlds, characters, and scripts
        </p>
      </div>
      
      <Tabs defaultValue="worlds" className="w-full">
        <TabsList className="bg-[#0A0A0A] border border-white/10 rounded-none p-1 mb-6">
          <TabsTrigger 
            value="worlds" 
            data-testid="tab-worlds"
            className="data-[state=active]:bg-[#141414] data-[state=active]:border-b-2 data-[state=active]:border-[#FF3B30] rounded-none"
          >
            <Globe className="w-4 h-4 mr-2" />
            Worlds ({worlds.length})
          </TabsTrigger>
          <TabsTrigger 
            value="characters"
            data-testid="tab-characters"
            className="data-[state=active]:bg-[#141414] data-[state=active]:border-b-2 data-[state=active]:border-[#FF3B30] rounded-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Characters ({characters.length})
          </TabsTrigger>
          <TabsTrigger 
            value="scripts"
            data-testid="tab-scripts"
            className="data-[state=active]:bg-[#141414] data-[state=active]:border-b-2 data-[state=active]:border-[#FF3B30] rounded-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            Scripts ({scripts.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="worlds">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {worlds.map((world) => (
              <div key={world.id} className="bg-[#0A0A0A] border border-white/10 p-6 hover:border-white/20 transition-colors">
                <Globe className="w-6 h-6 text-[#FF3B30] mb-3" />
                <h3 className="text-lg font-semibold font-heading mb-2">{world.name}</h3>
                <p className="text-sm text-[#8A8A8A] line-clamp-3 mb-3">{world.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-mono text-[#8A8A8A]">{(world.countries || []).length} countries</span>
                  <span className="text-xs font-mono text-[#8A8A8A]">•</span>
                  <span className="text-xs font-mono text-[#8A8A8A]">{(world.cities || []).length} cities</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="characters">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <div key={char.id} className="bg-[#0A0A0A] border border-white/10 p-6 hover:border-white/20 transition-colors">
                <Users className="w-6 h-6 text-[#00FF66] mb-3" />
                <h3 className="text-lg font-semibold font-heading mb-1">{char.name}</h3>
                <p className="text-sm text-[#8A8A8A] mb-3">{char.profession} • {char.age} years</p>
                <div className="text-[10px] font-mono text-[#FF3B30] mb-3 uppercase tracking-tighter">
                  Voice: {char.voice_id}
                </div>
                <p className="text-xs text-[#8A8A8A] line-clamp-2 mb-3">{char.backstory}</p>
                <div className="flex flex-wrap gap-1">
                  {char.personality_traits.slice(0, 3).map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#141414] border border-white/10 text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="scripts">
          <div className="space-y-4">
            {scripts.map((script) => (
              <div key={script.id} className="bg-[#0A0A0A] border border-white/10 p-6 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-[#FFCC00] mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold font-heading mb-2">{script.title}</h3>
                    <p className="text-sm text-[#8A8A8A] mb-2">Topic: {script.topic}</p>
                    <div className="flex items-center gap-4 text-xs font-mono text-[#8A8A8A]">
                      <span>Host: {script.host_name}</span>
                      <span>•</span>
                      <span>Guest: {script.guest_name}</span>
                      <span>•</span>
                      <span>{script.conversation.length} exchanges</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
