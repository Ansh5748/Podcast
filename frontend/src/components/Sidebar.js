import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Users, FileText, Library, Activity, Video } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/world-engine', icon: Globe, label: 'World Engine' },
    { path: '/characters', icon: Users, label: 'Characters' },
    { path: '/scripts', icon: FileText, label: 'Scripts' },
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/studio', icon: Video, label: 'Studio' },
  ];
  
  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#0A0A0A] border-r border-white/10 z-40">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#FF3B30]" />
          <span className="font-heading font-black text-lg tracking-tight">CharacterCast</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-none transition-colors
                  ${isActive 
                    ? 'bg-[#141414] border-l-2 border-[#FF3B30] text-white' 
                    : 'text-[#8A8A8A] hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Status Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="text-xs font-mono uppercase tracking-wider text-[#8A8A8A]">
          System Status
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF66]" data-testid="status-indicator"></div>
          <span className="text-xs font-mono text-white">All Systems Operational</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
