import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Restaurant } from '../types';

interface MapVisualizationProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (r: Restaurant) => void;
  selectedRestaurant: Restaurant | null;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ restaurants, onSelectRestaurant, selectedRestaurant }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [geoData, setGeoData] = useState<any>(null);
  
  // Track current zoom transform
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [currentZoom, setCurrentZoom] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  // Fetch World Topology
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
      .then(response => response.json())
      .then(topology => {
        const geojson = topojson.feature(topology, topology.objects.countries);
        setGeoData(geojson);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Create a group for all map content
    const g = svg.append("g");

    // Projection centered on East Asia
    const projection = d3.geoMercator()
      .center([135, 36]) 
      .scale(width < 600 ? 800 : 1600) 
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // --- Zoom Behavior ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 60]) 
      .translateExtent([[-width, -height], [width * 3, height * 3]])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentZoom(event.transform);
        
        const k = event.transform.k;
        
        // 1. Update Dot Size
        g.selectAll("circle.restaurant")
          .attr("r", (d: any) => (selectedRestaurant?.id === d.id ? 10/k + 3 : 6/k + 2));

        // 2. Semantic Zoom: Country Labels (Low Zoom)
        g.selectAll(".country-label")
          .style("opacity", k < 4 ? 1 : Math.max(0, 1 - (k - 4)));

        // 3. Semantic Zoom: City Labels (Medium Zoom)
        g.selectAll(".city-ref")
          .style("opacity", k > 3 ? (k > 12 ? 0.5 : 1) : 0) // Fade out slightly when very zoomed in
          .attr("font-size", k > 12 ? "2px" : "4px");

        // 4. Semantic Zoom: Restaurant Names (High Zoom)
        g.selectAll(".place-label")
          .style("opacity", k > 4 ? 1 : 0)
          .style("font-size", k > 10 ? "3px" : "5px");
          
        // 5. Semantic Zoom: District Detail (Very High Zoom)
        g.selectAll(".district-label")
          .style("opacity", k > 10 ? 0.8 : 0)
          .style("display", k > 10 ? "block" : "none");
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    // --- Draw Map Layers ---
    
    // 1. Landmasses (Green)
    if (geoData) {
      g.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator as any)
        .attr("fill", "#86efac") // Green 300 - Fresh Green
        .attr("stroke", "#ffffff") // White borders
        .attr("stroke-width", 0.5);
    }

    // 2. Country Labels (Visible when zoomed out)
    const countryLabels = [
      { name: "SOUTH KOREA", lat: 36.5, lng: 128 },
      { name: "JAPAN", lat: 36.5, lng: 139 }
    ];

    g.selectAll("text.country-label")
      .data(countryLabels)
      .enter()
      .append("text")
      .attr("class", "country-label")
      .attr("x", d => projection([d.lng, d.lat])?.[0] || 0)
      .attr("y", d => projection([d.lng, d.lat])?.[1] || 0)
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "900")
      .attr("letter-spacing", "0.2em")
      .attr("fill", "#14532d") // Green 900
      .attr("opacity", 0.4)
      .style("pointer-events", "none");

    // 3. Expanded Reference Cities (Visible when zoomed in)
    const referencePoints = [
      // South Korea
      { name: "Seoul", lat: 37.5665, lng: 126.9780 },
      { name: "Busan", lat: 35.1796, lng: 129.0756 },
      { name: "Incheon", lat: 37.4563, lng: 126.7052 },
      { name: "Daegu", lat: 35.8714, lng: 128.6014 },
      { name: "Daejeon", lat: 36.3504, lng: 127.3845 },
      { name: "Gwangju", lat: 35.1595, lng: 126.8526 },
      { name: "Suwon", lat: 37.2636, lng: 127.0286 },
      { name: "Ulsan", lat: 35.5384, lng: 129.3114 },
      { name: "Jeju City", lat: 33.4996, lng: 126.5312 },
      
      // Japan
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Osaka", lat: 34.6937, lng: 135.5023 },
      { name: "Yokohama", lat: 35.4437, lng: 139.6380 },
      { name: "Nagoya", lat: 35.1815, lng: 136.9066 },
      { name: "Sapporo", lat: 43.0618, lng: 141.3545 },
      { name: "Fukuoka", lat: 33.5902, lng: 130.4017 },
      { name: "Kobe", lat: 34.6901, lng: 135.1955 },
      { name: "Kyoto", lat: 35.0116, lng: 135.7681 },
      { name: "Hiroshima", lat: 34.3853, lng: 132.4553 },
      { name: "Sendai", lat: 38.2682, lng: 140.8694 }
    ];

    g.selectAll("text.city-ref")
      .data(referencePoints)
      .enter()
      .append("text")
      .attr("class", "city-ref")
      .attr("x", d => projection([d.lng, d.lat])?.[0] || 0)
      .attr("y", d => projection([d.lng, d.lat])?.[1] || 0)
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", -2)
      .attr("font-size", "4px")
      .attr("fill", "#334155") // Slate 700
      .attr("font-weight", "600")
      .style("opacity", 0) // Hidden at start, controlled by zoom
      .style("pointer-events", "none")
      .style("text-shadow", "0px 0px 2px white");

    // 4. User Restaurants
    const pointsGroup = g.append("g");

    // Selection Ring
    if (selectedRestaurant) {
      const [sx, sy] = projection([selectedRestaurant.coordinates.lng, selectedRestaurant.coordinates.lat]) || [0,0];
      pointsGroup.append("circle")
        .attr("cx", sx)
        .attr("cy", sy)
        .attr("r", 10)
        .attr("fill", "none")
        .attr("stroke", "#f43f5e") // Brand Accent
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.6)
        .append("animate")
          .attr("attributeName", "r")
          .attr("from", 5)
          .attr("to", 20)
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
    }

    const places = pointsGroup.selectAll(".place-group")
      .data(restaurants)
      .enter()
      .append("g")
      .attr("class", "place-group cursor-pointer")
      .attr("transform", d => {
        const [x, y] = projection([d.coordinates.lng, d.coordinates.lat]) || [0,0];
        return `translate(${x},${y})`;
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelectRestaurant(d);
        
        // Smooth zoom to selection
        const [x, y] = projection([d.coordinates.lng, d.coordinates.lat]) || [0,0];
        const targetScale = 14; 
        const translate = [width / 2 - targetScale * x, height / 2 - targetScale * y];
        
        svg.transition()
          .duration(1000)
          .call(
            zoom.transform, 
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(targetScale)
          );
      });

    // The Dot
    places.append("circle")
      .attr("class", "restaurant")
      .attr("r", 3) 
      .attr("fill", d => (selectedRestaurant?.id === d.id ? "#fbbf24" : "#f43f5e")) // Amber for selected, Rose for normal
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("filter", "drop-shadow(0px 1px 1px rgba(0,0,0,0.2))");

    // The Name Label
    places.append("text")
      .attr("class", "place-label")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b") // Slate 800
      .attr("font-weight", "bold")
      .attr("font-size", "5px")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .attr("paint-order", "stroke")
      .style("opacity", 0) 
      .style("pointer-events", "none");

    // The District Label
    places.append("text")
      .attr("class", "district-label")
      .text(d => `${d.city} • ${d.district}`)
      .attr("x", 0)
      .attr("y", 5) 
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b") // Slate 500
      .attr("font-size", "3px")
      .style("opacity", 0)
      .style("display", "none")
      .style("text-shadow", "0px 0px 1px white");

  }, [dimensions, geoData, restaurants, selectedRestaurant, onSelectRestaurant]);

  // Zoom Helpers
  const handleZoom = (factor: number) => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(zoomRef.current.scaleBy, factor);
    }
  };

  const handleReset = () => {
     if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white overflow-hidden border-l border-slate-200">
      {/* Light Ocean Background */}
      <div className="absolute inset-0 bg-white pointer-events-none"></div>
      
      <svg ref={svgRef} className="w-full h-full touch-none cursor-move relative z-10" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={() => handleZoom(1.5)}
          className="w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button 
          onClick={() => handleZoom(0.66)}
          className="w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button 
          onClick={handleReset}
          className="w-10 h-10 bg-white border border-slate-200 rounded-lg text-brand-accent flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95 transition-all mt-2"
          title="Reset View"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </button>
      </div>
    </div>
  );
};

export default MapVisualization;