import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import WorldEngine from "./pages/WorldEngine";
import Characters from "./pages/Characters";
import Scripts from "./pages/Scripts";
import Library from "./pages/Library";
import Studio from "./pages/Studio";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/world-engine" element={<WorldEngine />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/library" element={<Library />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
