import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Sidebar />
      <div className="ml-64">
        {/* Top Bar */}
        <div className="h-16 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-8">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8A8A]">
            Fictional World Podcast Studio
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-[#8A8A8A]">
              v0.1.0 - Internal Tool
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
