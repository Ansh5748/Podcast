import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const InteractiveGlobe = ({ characters = [], worldName = "Unknown World", continents = [] }) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const containerRef = useRef();
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight || 400
      });
    }
    
    // Auto-rotate and starfield initialization
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
      
      // Wait a bit for the globe to be fully ready before accessing material
      setTimeout(() => {
        if (globeRef.current && globeRef.current.globeMaterial) {
          const globeMaterial = globeRef.current.globeMaterial();
          if (globeMaterial) {
            globeMaterial.color = new THREE.Color('#00BFFF'); // Bright Sky Blue water
            globeMaterial.emissive = new THREE.Color('#001a33'); // Subtle deep glow
            globeMaterial.emissiveIntensity = 0.2;
            globeMaterial.shininess = 0.9;
          }
        }
      }, 500);
    }
  }, []);

  // Generate random "continents" as large blobs
  const hexData = useMemo(() => {
    const data = [];
    const numContinents = 7; // Target 6-9
    
    for (let c = 0; c < numContinents; c++) {
      // Center of each continent
      const cLat = (Math.random() - 0.5) * 120;
      const cLng = (Math.random() - 0.5) * 360;
      
      // Create a blob around the center (continent)
      for (let i = 0; i < 40; i++) { // More points for a fuller look
        data.push({
          lat: cLat + (Math.random() - 0.5) * 40,
          lng: cLng + (Math.random() - 0.5) * 80,
          size: 1, // Normalized weight
          color: 'white' // White land
        });
      }
    }
    return data;
  }, []);

  // Borders simulation - random black lines on land
  const pathsData = useMemo(() => {
    const paths = [];
    // Only show borders when zoomed in (zoomLevel > 3)
    if (zoomLevel < 3) return paths;

    // Create "border" lines across the continents
    // Using a safer approach to build paths: each path must be an array of [lat, lng] pairs
    hexData.forEach((hex, i) => {
      if (i % 10 === 0) { // Every 10th point gets a border line
        const p1 = [hex.lat, hex.lng];
        const p2 = [hex.lat + (Math.random() - 0.5) * 8, hex.lng + (Math.random() - 0.5) * 15];
        paths.push({
          coords: [p1, p2], // Renamed to coords for safety
          color: 'rgba(0,0,0,0.4)' // Semi-transparent black border
        });
      }
    });
    return paths;
  }, [hexData, zoomLevel]);

  // Labels for the globe based on zoom
  const labelsData = useMemo(() => {
    const labels = [];
    if (!continents || continents.length === 0) return labels;

    continents.forEach((continent, cIdx) => {
      // Continent labels: High visibility at low zoom (1.0 to 3.5)
      // Disappear at zoom > 3.5 to show countries
      if (zoomLevel <= 3.5) {
        const cLat = -40 + (cIdx * 25);
        const cLng = -160 + (cIdx * 50);
        
        labels.push({
          lat: cLat,
          lng: cLng,
          text: continent.name,
          color: 'black', // Black text on white continents
          size: 2.5,
          type: 'continent'
        });
      }

      // Country labels: Zoom 3.5 to 7.0
      if (zoomLevel > 3.5 && zoomLevel <= 7.0) {
        const cLat = -40 + (cIdx * 25);
        const cLng = -160 + (cIdx * 50);
        
        continent.countries?.forEach((country, coIdx) => {
          const coLat = cLat + (Math.sin(coIdx) * 12);
          const coLng = cLng + (Math.cos(coIdx) * 25);
          
          labels.push({
            lat: coLat,
            lng: coLng,
            text: country.name,
            color: '#000000', // Solid black
            size: 1.4,
            type: 'country'
          });
        });
      }

      // State labels: Zoom 7.0 to 11.0
      if (zoomLevel > 7.0 && zoomLevel <= 11.0) {
        const cLat = -40 + (cIdx * 25);
        const cLng = -160 + (cIdx * 50);
        
        continent.countries?.forEach((country, coIdx) => {
          const coLat = cLat + (Math.sin(coIdx) * 12);
          const coLng = cLng + (Math.cos(coIdx) * 25);
          
          country.states?.forEach((state, sIdx) => {
            const sLat = coLat + (Math.sin(sIdx) * 4);
            const sLng = coLng + (Math.cos(sIdx) * 8);
            
            labels.push({
              lat: sLat,
              lng: sLng,
              text: state.name,
              color: '#333333',
              size: 1.0,
              type: 'state'
            });
          });
        });
      }

      // City labels: Zoom > 11.0
      if (zoomLevel > 11.0) {
        const cLat = -40 + (cIdx * 25);
        const cLng = -160 + (cIdx * 50);
        
        continent.countries?.forEach((country, coIdx) => {
          const coLat = cLat + (Math.sin(coIdx) * 12);
          const coLng = cLng + (Math.cos(coIdx) * 25);
          
          country.states?.forEach((state, sIdx) => {
            const sLat = coLat + (Math.sin(sIdx) * 4);
            const sLng = coLng + (Math.cos(sIdx) * 8);
            
            state.cities?.forEach((city, ciIdx) => {
              labels.push({
                lat: sLat + (Math.sin(ciIdx) * 1),
                lng: sLng + (Math.cos(ciIdx) * 2),
                text: city,
                color: '#555555',
                size: 0.6,
                type: 'city'
              });
            });
          });
        });
      }
    });
    return labels;
  }, [continents, zoomLevel]);

  // Data for character pins
  const gData = characters.map(char => ({
    lat: char.lat || 0,
    lng: char.lng || 0,
    size: 0.8,
    color: '#FF3B30',
    name: char.name,
    profession: char.profession,
    label: `${char.name} (${char.profession})`
  }));

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-[#050505] border border-white/10 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-1 border border-[#FF3B30]/20">
          Live Planetary Feed: {worldName}
        </div>
        <div className="text-[8px] font-mono text-[#8A8A8A] bg-black/50 px-2 py-1 border border-white/5">
          Zoom: {zoomLevel.toFixed(1)}x
        </div>
      </div>
      
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        
        // Custom look: Bright Sky Blue Water, White Land, Black Borders
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#00BFFF"
        atmosphereAltitude={0.15}
        
        // Base Globe Styling
        globeColor="#00BFFF" // Water color
        
        // Landmasses using hex polygons
        hexBinPointsData={hexData}
        hexBinPointWeight="size"
        hexBinResolution={4}
        hexMargin={0.05} // Smaller margin for more solid land
        hexTopColor={() => 'white'}
        hexSideColor={() => 'rgba(0,0,0,0.1)'}
        
        // Borders (Black lines dividing countries/states on zoom)
        pathsData={pathsData}
        pathPoints="coords"
        pathColor={d => d.color}
        pathStroke={1}
        pathDashLength={0.1}
        
        // Labels (Continents, Countries, etc)
        labelsData={labelsData}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.text}
        labelSize={d => d.size}
        labelDotRadius={0.3}
        labelColor={d => d.color}
        labelResolution={3}
        
        // Character Pins
        pointsData={gData}
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        pointAltitude={0.02}
        
        onPointClick={(point) => {
          alert(`Character: ${point.name}\nProfession: ${point.profession}`);
        }}

        onZoom={(v) => {
          // Approximate zoom level from camera distance
          const level = Math.max(1, 800 / v.distance);
          setZoomLevel(level);
        }}
      />
      
      <div className="absolute bottom-4 right-4 z-10 text-[10px] font-mono text-[#8A8A8A] bg-black/50 p-2 border border-white/5 backdrop-blur-sm">
        Scroll to Zoom • Drag to Rotate • Click Pins for Data
      </div>
    </div>
  );
};

export default InteractiveGlobe;
