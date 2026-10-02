import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Star, 
  MapPin, 
  Store, 
  Navigation, 
  ExternalLink, 
  GitCompare, 
  Layers, 
  Check, 
  Search, 
  Clock, 
  Car, 
  Utensils, 
  Compass, 
  CheckCircle2, 
  SlidersHorizontal, 
  Flame, 
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { RestaurantBranch } from '../types';
import { CUISINE_COLORS, REGION_LIST, ASPECT_COLORS, RESTAURANT_BRANCHES } from '../data/restaurantData';

interface RestaurantMapProps {
  branches: RestaurantBranch[];
  onSelectForCompare: (branch: RestaurantBranch) => void;
  selectedCompareBranchIds: string[];
}

const REGION_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'ทุกภาค': { lat: 13.5, lng: 100.8, zoom: 6 },
  'ภาคกลาง': { lat: 13.85, lng: 100.55, zoom: 9 },
  'ภาคเหนือ': { lat: 18.78, lng: 99.25, zoom: 7.5 },
  'ภาคตะวันออกเฉียงเหนือ': { lat: 16.05, lng: 103.20, zoom: 7.2 },
  'ภาคตะวันออก': { lat: 13.20, lng: 101.65, zoom: 8.2 },
  'ภาคตะวันตก': { lat: 13.95, lng: 99.20, zoom: 7.8 },
  'ภาคใต้': { lat: 8.45, lng: 99.70, zoom: 7 },
};

// Region theme styles (Border & Fill colors)
export const REGION_STYLES: Record<string, { stroke: string; fill: string; bg: string; text: string; border: string }> = {
  'ภาคเหนือ': { stroke: '#059669', fill: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  'ภาคตะวันออกเฉียงเหนือ': { stroke: '#d97706', fill: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  'ภาคกลาง': { stroke: '#4f46e5', fill: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  'ภาคตะวันออก': { stroke: '#0891b2', fill: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' },
  'ภาคตะวันตก': { stroke: '#7c3aed', fill: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  'ภาคใต้': { stroke: '#e11d48', fill: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
};

// Compute 2D Convex Hull with generous geographic expansion to represent the regional boundary
function computeRegionHull(allBranches: RestaurantBranch[], regionName: string): [number, number][] {
  const targetBranches = allBranches.filter(b => b.region === regionName);
  if (targetBranches.length < 3) return [];

  const points: [number, number][] = targetBranches.map(b => [b.lat, b.lng]);

  // Sort by lng, then lat
  points.sort((a, b) => a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]) => {
    return (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
  };

  const lower: [number, number][] = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  if (hull.length === 0) return [];

  // Centroid
  const cLat = hull.reduce((sum, p) => sum + p[0], 0) / hull.length;
  const cLng = hull.reduce((sum, p) => sum + p[1], 0) / hull.length;

  // Outward buffer expansion (~35-40km) so all pins and provinces sit clearly inside the boundary
  return hull.map(([lat, lng]) => {
    const dLat = lat - cLat;
    const dLng = lng - cLng;
    const dist = Math.hypot(dLat, dLng) || 1;
    const pad = 0.35; // Expansion in degrees
    return [lat + (dLat / dist) * pad, lng + (dLng / dist) * pad];
  });
}

export const RestaurantMap: React.FC<RestaurantMapProps> = ({
  branches,
  onSelectForCompare,
  selectedCompareBranchIds
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<RestaurantBranch | null>(
    branches.length > 0 ? branches[0] : null
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('ทุกภาค');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('ทั้งหมด');
  const [showBoundary, setShowBoundary] = useState<boolean>(true); // Toggle region boundary

  // Pre-calculate regional boundaries from complete dataset
  const regionHulls = useMemo(() => {
    const hulls: Record<string, [number, number][]> = {};
    const validRegions = REGION_LIST.filter(r => r !== 'ทุกภาค');
    validRegions.forEach(r => {
      hulls[r] = computeRegionHull(RESTAURANT_BRANCHES, r);
    });
    return hulls;
  }, []);

  // Filter branches for map display
  const mapBranches = branches.filter(b => {
    if (selectedRegion !== 'ทุกภาค' && b.region !== selectedRegion) return false;
    if (selectedCuisineFilter !== 'ทั้งหมด' && b.cuisine !== selectedCuisineFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.fullName.toLowerCase().includes(q) || b.province.toLowerCase().includes(q);
    }
    return true;
  });

  // Keep selectedBranch synced if it's not in mapBranches
  useEffect(() => {
    if (mapBranches.length > 0 && (!selectedBranch || !mapBranches.some(b => b.id === selectedBranch.id))) {
      setSelectedBranch(mapBranches[0]);
    }
  }, [mapBranches]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.5, 100.8],
        zoom: 6,
        zoomControl: true,
      });

      // Standard OSM tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Boundary layer (rendered below markers)
      const boundaryLayer = L.layerGroup().addTo(map);
      boundaryLayerRef.current = boundaryLayer;

      // Markers layer
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle full-width resizing smoothly
      const handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleResize);
      setTimeout(() => map.invalidateSize(), 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to region when region changes
  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    const coords = REGION_COORDINATES[region] || REGION_COORDINATES['ทุกภาค'];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], coords.zoom, { duration: 1.1 });
    }
  };

  // Render Regional Boundary Polygon (ขอบเขตภูมิภาคที่เลือกอย่างชัดเจน)
  useEffect(() => {
    if (!mapInstanceRef.current || !boundaryLayerRef.current) return;
    const boundaryLayer = boundaryLayerRef.current;
    boundaryLayer.clearLayers();

    if (!showBoundary) return;

    if (selectedRegion !== 'ทุกภาค') {
      // Highlight single selected region with thick, vibrant boundary and soft background fill
      const hull = regionHulls[selectedRegion];
      const style = REGION_STYLES[selectedRegion] || { stroke: '#4f46e5', fill: '#6366f1' };

      if (hull && hull.length >= 3) {
        const polygon = L.polygon(hull, {
          color: style.stroke,
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 6',
          fillColor: style.fill,
          fillOpacity: 0.16,
          className: 'region-boundary-active'
        });

        // Tooltip on boundary
        polygon.bindTooltip(`📍 ขอบเขต: ${selectedRegion}`, {
          permanent: false,
          direction: 'center',
          className: 'region-tooltip-badge'
        });

        boundaryLayer.addLayer(polygon);

        // Center badge label on boundary centroid
        const cLat = hull.reduce((sum, p) => sum + p[0], 0) / hull.length;
        const cLng = hull.reduce((sum, p) => sum + p[1], 0) / hull.length;

        const countInRegion = RESTAURANT_BRANCHES.filter(b => b.region === selectedRegion).length;

        const labelHtml = `
          <div style="
            background: rgba(15, 23, 42, 0.92);
            color: white;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 2px solid ${style.stroke};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            pointer-events: none;
            backdrop-filter: blur(4px);
          ">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${style.fill}; box-shadow: 0 0 6px ${style.fill};"></span>
            <span>ขอบเขต: ${selectedRegion} (${countInRegion} สาขา)</span>
          </div>
        `;

        const labelIcon = L.divIcon({
          html: labelHtml,
          className: 'region-centroid-badge',
          iconSize: [220, 28],
          iconAnchor: [110, 14]
        });

        const labelMarker = L.marker([cLat, cLng], { icon: labelIcon, interactive: false });
        boundaryLayer.addLayer(labelMarker);

        // Fit bounds smoothly with padding
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(polygon.getBounds(), { padding: [50, 50], maxZoom: 8.5 });
        }
      }
    } else {
      // When "ทุกภาค" is selected, render subtle boundaries of all 6 regions so user sees the regional divide
      (Object.keys(regionHulls) as string[]).forEach((rName) => {
        const hull = regionHulls[rName];
        if (!hull || hull.length < 3) return;
        const style = REGION_STYLES[rName] || { stroke: '#64748b', fill: '#94a3b8' };
        const polygon = L.polygon(hull, {
          color: style.stroke,
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 6',
          fillColor: style.fill,
          fillOpacity: 0.07,
          className: 'region-boundary-overview'
        });

        polygon.bindTooltip(`คลิกเพื่อเลือก: ${rName}`, {
          permanent: false,
          direction: 'center'
        });

        // Clicking a region boundary switches to that region
        polygon.on('click', () => {
          handleRegionClick(rName);
        });

        boundaryLayer.addLayer(polygon);
      });
    }
  }, [selectedRegion, showBoundary, regionHulls]);

  // Render Markers when branches or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Render top 120 branches in viewport/filter for smooth 60fps interaction
    const displayList = mapBranches.slice(0, 120);

    displayList.forEach((branch) => {
      const isSelected = selectedBranch?.id === branch.id;
      const isCompared = selectedCompareBranchIds.includes(branch.id);
      const cuisineColor = CUISINE_COLORS[branch.cuisine]?.hex || '#10b981';

      const markerHtml = `
        <div style="
          position: relative;
          cursor: pointer;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background: ${isSelected ? '#0f172a' : 'white'};
            color: ${isSelected ? 'white' : '#0f172a'};
            padding: 3px 7px;
            border-radius: 9999px;
            border: 2px solid ${isCompared ? '#6366f1' : cuisineColor};
            box-shadow: 0 4px 10px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            transition: transform 0.15s ease-in-out;
            ${isSelected ? 'transform: scale(1.15); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);' : ''}
            ${isCompared ? 'border-color: #6366f1; background: #f5f3ff;' : ''}
          ">
            <span style="color: ${isSelected ? '#fbbf24' : cuisineColor};">★</span>
            <span>${branch.overallRating.toFixed(1)}</span>
            <span style="color: ${isSelected ? '#cbd5e1' : '#64748b'}; font-size: 9px; font-weight: 500;">(${branch.province})</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'restaurant-map-pin',
        iconSize: [85, 30],
        iconAnchor: [42, 15],
      });

      const marker = L.marker([branch.lat, branch.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedBranch(branch);
      });

      markersLayer.addLayer(marker);
    });
  }, [mapBranches, selectedBranch, selectedCompareBranchIds]);

  const cuisineStyle = selectedBranch ? (CUISINE_COLORS[selectedBranch.cuisine] || {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    hex: '#10b981'
  }) : null;

  const currentRegionStyle = selectedRegion !== 'ทุกภาค' ? REGION_STYLES[selectedRegion] : null;

  return (
    <div id="restaurant-map-view" className="space-y-4 pb-12 w-full">
      {/* Top Controls: Region Selector Buttons with Colorful Active Badges & Boundary Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>ภูมิภาค:</span>
          </span>
          {REGION_LIST.map((region) => {
            const isAct = selectedRegion === region;
            const rStyle = REGION_STYLES[region];

            return (
              <button
                key={region}
                onClick={() => handleRegionClick(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isAct
                    ? 'bg-slate-900 text-white shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                {rStyle && (
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: isAct ? '#10b981' : rStyle.stroke }}
                  />
                )}
                <span>{region}</span>
              </button>
            );
          })}
        </div>

        {/* Boundary Toggle & Branch Stats */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Toggle Regional Boundary */}
          <button
            onClick={() => setShowBoundary(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showBoundary
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
            }`}
            title="คลิกเพื่อเปิดหรือปิดเส้นกรอบแสดงขอบเขตภูมิภาคบนแผนที่"
          >
            {showBoundary ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>กรอบขอบเขตภูมิภาค: {showBoundary ? 'แสดง' : 'ซ่อน'}</span>
          </button>

          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>แสดง <strong>{mapBranches.length.toLocaleString()}</strong> สาขา</span>
          </div>
        </div>
      </div>

      {/* Main Map + Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px] w-full">
        {/* Leaflet Map Stage */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative flex flex-col min-h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[520px] flex-1 z-10" />

          {/* Active Region Indicator Pill on Top-Left of Map */}
          {showBoundary && (
            <div className="absolute top-3 left-14 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-md text-xs flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full animate-pulse" 
                style={{ backgroundColor: currentRegionStyle?.stroke || '#10b981' }}
              />
              <span className="font-bold text-slate-800">
                ขอบเขต: <strong style={{ color: currentRegionStyle?.stroke || '#059669' }}>{selectedRegion}</strong>
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                {selectedRegion === 'ทุกภาค' ? 'แสดงกรอบ 6 ภาค' : 'เน้นกรอบพื้นที่'}
              </span>
            </div>
          )}

          {/* Map Floating Legend with Cuisine Color Dots */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-md text-xs max-w-xs hidden sm:block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">หมวดหมู่อาหาร (สีหมุด)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {Object.entries(CUISINE_COLORS).slice(0, 6).map(([name, conf]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${conf.dot}`}></span>
                  <span className="text-slate-700 font-medium truncate">{name}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>คลิกที่หมุดเพื่อดู 5 มิติ</span>
              <span className="text-emerald-600 font-bold">1,500 สาขา</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Selected Branch Details & Aspect Breakdown */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between overflow-y-auto max-h-[700px]">
          {selectedBranch ? (
            <div className="space-y-4">
              {/* Branch Image & Header */}
              <div className="relative rounded-xl overflow-hidden h-36 border border-slate-200">
                <img 
                  src={selectedBranch.image} 
                  alt={selectedBranch.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${cuisineStyle?.bg} ${cuisineStyle?.text}`}>
                    {selectedBranch.cuisine}
                  </span>
                  <h4 className="font-extrabold text-sm leading-tight drop-shadow-sm">
                    {selectedBranch.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>จ.{selectedBranch.province} • {selectedBranch.region}</span>
                  </p>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block">เรตติ้งรวม</span>
                  <span className="text-base font-black text-emerald-700 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    {selectedBranch.overallRating.toFixed(1)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">จำนวนรีวิว</span>
                  <span className="text-base font-black text-slate-800">{selectedBranch.reviewCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-bold block">ระดับราคา</span>
                  <span className="text-xs font-black text-amber-800 block mt-1">{selectedBranch.priceRange}</span>
                </div>
              </div>

              {/* 5 Dimensional Aspect Breakdown Bars */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  คะแนนแยกตาม 5 มิติของร้าน
                </span>

                {/* Food */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span className={`${ASPECT_COLORS.food.text} font-bold`}>🍛 {ASPECT_COLORS.food.name}</span>
                    <span className={`${ASPECT_COLORS.food.text} font-extrabold`}>{selectedBranch.aspectScores.food.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                    <div className={`${ASPECT_COLORS.food.bar} h-1.5 rounded-full`} style={{ width: `${(selectedBranch.aspectScores.food / 5) * 100}%` }}></div>
                  </div>
                </div>

                {/* Service */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span className={`${ASPECT_COLORS.service.text} font-bold`}>🛎️ {ASPECT_COLORS.service.name}</span>
                    <span className={`${ASPECT_COLORS.service.text} font-extrabold`}>{selectedBranch.aspectScores.service.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div className={`${ASPECT_COLORS.service.bar} h-1.5 rounded-full`} style={{ width: `${(selectedBranch.aspectScores.service / 5) * 100}%` }}></div>
                  </div>
                </div>

                {/* Cleanliness */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span className={`${ASPECT_COLORS.cleanliness.text} font-bold`}>✨ {ASPECT_COLORS.cleanliness.name}</span>
                    <span className={`${ASPECT_COLORS.cleanliness.text} font-extrabold`}>{selectedBranch.aspectScores.cleanliness.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <div className={`${ASPECT_COLORS.cleanliness.bar} h-1.5 rounded-full`} style={{ width: `${(selectedBranch.aspectScores.cleanliness / 5) * 100}%` }}></div>
                  </div>
                </div>

                {/* Atmosphere */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span className={`${ASPECT_COLORS.atmosphere.text} font-bold`}>🌿 {ASPECT_COLORS.atmosphere.name}</span>
                    <span className={`${ASPECT_COLORS.atmosphere.text} font-extrabold`}>{selectedBranch.aspectScores.atmosphere.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className={`${ASPECT_COLORS.atmosphere.bar} h-1.5 rounded-full`} style={{ width: `${(selectedBranch.aspectScores.atmosphere / 5) * 100}%` }}></div>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span className={`${ASPECT_COLORS.value.text} font-bold`}>🏷️ {ASPECT_COLORS.value.name}</span>
                    <span className={`${ASPECT_COLORS.value.text} font-extrabold`}>{selectedBranch.aspectScores.value.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                    <div className={`${ASPECT_COLORS.value.bar} h-1.5 rounded-full`} style={{ width: `${(selectedBranch.aspectScores.value / 5) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Sample Review Quote */}
              {selectedBranch.reviews && selectedBranch.reviews.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>เสียงตอบรับจากลูกค้าจริง:</span>
                  </div>
                  <p className="text-slate-700 italic">
                    &quot;{selectedBranch.reviews[0].comment}&quot;
                  </p>
                </div>
              )}

              {/* Compare Button */}
              <button
                onClick={() => onSelectForCompare(selectedBranch)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  selectedCompareBranchIds.includes(selectedBranch.id)
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                <span>
                  {selectedCompareBranchIds.includes(selectedBranch.id)
                    ? 'อยู่ในรายการเปรียบเทียบแล้ว'
                    : 'เพิ่มสาขานี้เพื่อเปรียบเทียบ'}
                </span>
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MapPin className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs">คลิกเลือกหมุดบนแผนที่เพื่อดูข้อมูลสาขา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
