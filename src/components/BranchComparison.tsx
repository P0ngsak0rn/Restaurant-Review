import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Star, 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  Trash2, 
  MapPin, 
  AlertTriangle,
  Lightbulb,
  Building2,
  TrendingUp,
  BarChart2,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { RestaurantBranch } from '../types';
import { 
  CUISINE_COLORS, 
  ASPECT_COLORS,
  CUISINE_LIST,
  ALL_PROVINCES 
} from '../data/restaurantData';

interface BranchComparisonProps {
  allBranches: RestaurantBranch[];
  selectedBranches: RestaurantBranch[];
  onAddBranch: (branch: RestaurantBranch) => void;
  onRemoveBranch: (branchId: string) => void;
  onClearAll: () => void;
}

export type BranchSortOption = 
  | 'rating_desc'   // เรตติ้งสูงสุด (High-Low)
  | 'rating_asc'    // เรตติ้งต่ำสุด (Low-High)
  | 'name_asc'      // ชื่อร้าน ก-ฮ (A-Z)
  | 'name_desc'     // ชื่อร้าน ฮ-ก (Z-A)
  | 'reviews_desc'  // จำนวนรีวิวมากสุด
  | 'reviews_asc'   // จำนวนรีวิวน้อยสุด
  | 'price_asc'     // ราคาเฉลี่ยต่ำสุด (คุ้มค่า)
  | 'price_desc'    // ราคาเฉลี่ยสูงสุด (พรีเมียม)
  | 'food_desc'     // คะแนนรสชาติอาหารสูงสุด
  | 'service_desc'; // คะแนนการบริการสูงสุด

export const BranchComparison: React.FC<BranchComparisonProps> = ({
  allBranches,
  selectedBranches,
  onAddBranch,
  onRemoveBranch,
  onClearAll
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('ทั้งหมด');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('ทั้งหมด');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0); // 0 = all ratings, 3.0, 3.5, 4.0, 4.5
  const [sortBy, setSortBy] = useState<BranchSortOption>('rating_desc');
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [quickSelectValue, setQuickSelectValue] = useState<string>('');

  // Helper to get consistent color for a branch based on its cuisine palette, or distinct sequence fallback
  const getBranchColor = (branch: RestaurantBranch, index: number) => {
    return CUISINE_COLORS[branch.cuisine]?.hex || ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#06b6d4'][index % 5];
  };

  // Quick Preset Combinations
  const handleSelectPreset = (cuisine: string) => {
    const matching = allBranches.filter(b => b.cuisine === cuisine).slice(0, 3);
    onClearAll();
    matching.forEach(b => onAddBranch(b));
  };

  // Quick direct select dropdown handler (Every branch is selectable)
  const handleQuickSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    if (!branchId) return;
    const branch = allBranches.find(b => b.id === branchId);
    if (branch) {
      onAddBranch(branch);
      setQuickSelectValue('');
    }
  };

  // Reset comparison filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCuisineFilter('ทั้งหมด');
    setSelectedProvinceFilter('ทั้งหมด');
    setMinRatingFilter(0);
    setSortBy('rating_desc');
    setVisibleCount(24);
  };

  // Prepare Radar Data across the 5 aspects
  const radarData = [
    {
      aspect: 'รสชาติอาหาร',
      ...selectedBranches.reduce((acc, b) => ({ ...acc, [b.fullName]: b.aspectScores.food }), {})
    },
    {
      aspect: 'การบริการ',
      ...selectedBranches.reduce((acc, b) => ({ ...acc, [b.fullName]: b.aspectScores.service }), {})
    },
    {
      aspect: 'ความสะอาด',
      ...selectedBranches.reduce((acc, b) => ({ ...acc, [b.fullName]: b.aspectScores.cleanliness }), {})
    },
    {
      aspect: 'บรรยากาศ',
      ...selectedBranches.reduce((acc, b) => ({ ...acc, [b.fullName]: b.aspectScores.atmosphere }), {})
    },
    {
      aspect: 'ความคุ้มค่า',
      ...selectedBranches.reduce((acc, b) => ({ ...acc, [b.fullName]: b.aspectScores.value }), {})
    },
  ];

  // Bar chart data for direct comparison
  const aspectBarData = selectedBranches.map((b) => ({
    name: b.fullName.length > 18 ? b.fullName.slice(0, 18) + '...' : b.fullName,
    อาหาร: b.aspectScores.food,
    บริการ: b.aspectScores.service,
    ความสะอาด: b.aspectScores.cleanliness,
    บรรยากาศ: b.aspectScores.atmosphere,
    ความคุ้มค่า: b.aspectScores.value,
  }));

  // Diagnostic comparison summary
  const getComparisonInsights = () => {
    if (selectedBranches.length < 2) return null;

    const sorted = [...selectedBranches].sort((a, b) => b.overallRating - a.overallRating);
    const topBranch = sorted[0];
    const lowBranch = sorted[sorted.length - 1];
    const ratingDiff = (topBranch.overallRating - lowBranch.overallRating).toFixed(1);

    const aspectGaps = [
      { name: 'การบริการ', gap: topBranch.aspectScores.service - lowBranch.aspectScores.service, topVal: topBranch.aspectScores.service, lowVal: lowBranch.aspectScores.service },
      { name: 'บรรยากาศ', gap: topBranch.aspectScores.atmosphere - lowBranch.aspectScores.atmosphere, topVal: topBranch.aspectScores.atmosphere, lowVal: lowBranch.aspectScores.atmosphere },
      { name: 'รสชาติอาหาร', gap: topBranch.aspectScores.food - lowBranch.aspectScores.food, topVal: topBranch.aspectScores.food, lowVal: lowBranch.aspectScores.food },
      { name: 'ความสะอาด', gap: topBranch.aspectScores.cleanliness - lowBranch.aspectScores.cleanliness, topVal: topBranch.aspectScores.cleanliness, lowVal: lowBranch.aspectScores.cleanliness },
    ].sort((a, b) => b.gap - a.gap);

    const biggestGap = aspectGaps[0];

    return {
      topBranch,
      lowBranch,
      ratingDiff,
      biggestGap,
    };
  };

  const insights = getComparisonInsights();

  // Sorting function supporting rating_desc, rating_asc, name_asc, name_desc (Z-A), etc.
  const sortBranches = (a: RestaurantBranch, b: RestaurantBranch, sort: BranchSortOption) => {
    switch (sort) {
      case 'rating_desc':
        return b.overallRating - a.overallRating || a.fullName.localeCompare(b.fullName, 'th');
      case 'rating_asc':
        return a.overallRating - b.overallRating || a.fullName.localeCompare(b.fullName, 'th');
      case 'name_asc':
        return a.fullName.localeCompare(b.fullName, 'th');
      case 'name_desc':
        return b.fullName.localeCompare(a.fullName, 'th');
      case 'reviews_desc':
        return b.reviewCount - a.reviewCount || b.overallRating - a.overallRating;
      case 'reviews_asc':
        return a.reviewCount - b.reviewCount || a.overallRating - b.overallRating;
      case 'price_asc':
        return a.avgPriceThb - b.avgPriceThb;
      case 'price_desc':
        return b.avgPriceThb - a.avgPriceThb;
      case 'food_desc':
        return b.aspectScores.food - a.aspectScores.food || b.overallRating - a.overallRating;
      case 'service_desc':
        return b.aspectScores.service - a.aspectScores.service || b.overallRating - a.overallRating;
      default:
        return 0;
    }
  };

  // Filtered & Sorted candidates for both the Dropdown List and the Visual List
  const filteredCandidates = useMemo(() => {
    return allBranches
      .filter(b => !selectedBranches.some(sb => sb.id === b.id))
      .filter(b => {
        // Minimum rating filter
        if (minRatingFilter > 0 && b.overallRating < minRatingFilter) return false;
        // Cuisine filter
        if (selectedCuisineFilter !== 'ทั้งหมด' && b.cuisine !== selectedCuisineFilter) return false;
        // Province filter
        if (selectedProvinceFilter !== 'ทั้งหมด' && b.province !== selectedProvinceFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            b.fullName.toLowerCase().includes(q) ||
            b.province.toLowerCase().includes(q) ||
            b.district?.toLowerCase().includes(q) ||
            b.cuisine.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => sortBranches(a, b, sortBy));
  }, [allBranches, selectedBranches, minRatingFilter, selectedCuisineFilter, selectedProvinceFilter, searchQuery, sortBy]);

  const displayedCandidates = filteredCandidates.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCandidates.length;

  const hasActiveCustomFilters = Boolean(
    minRatingFilter > 0 ||
    selectedCuisineFilter !== 'ทั้งหมด' ||
    selectedProvinceFilter !== 'ทั้งหมด' ||
    searchQuery.trim() ||
    sortBy !== 'rating_desc'
  );

  const getSortLabel = (opt: BranchSortOption) => {
    switch (opt) {
      case 'rating_desc': return 'เรตติ้งสูงสุด (High-Low)';
      case 'rating_asc': return 'เรตติ้งต่ำสุด (Low-High)';
      case 'name_asc': return 'ชื่อร้าน ก-ฮ (A-Z)';
      case 'name_desc': return 'ชื่อร้าน ฮ-ก (Z-A)';
      case 'reviews_desc': return 'จำนวนรีวิวมากสุด';
      case 'reviews_asc': return 'จำนวนรีวิวน้อยสุด';
      case 'price_asc': return 'ราคาต่ำสุด (คุ้มค่า)';
      case 'price_desc': return 'ราคาสูงสุด (พรีเมียม)';
      case 'food_desc': return 'รสชาติอาหารสูงสุด';
      case 'service_desc': return 'การบริการสูงสุด';
    }
  };

  return (
    <div id="branch-comparison-view" className="space-y-6 pb-12 w-full">
      {/* Header & Quick Presets */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden w-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
              <GitCompare className="w-3.5 h-3.5 text-amber-600" />
              <span>Cross-Branch Multi-Aspect Benchmarking</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              เปรียบเทียบข้อมูลและคะแนนรีวิวระหว่างสาขา (Head-to-Head)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              วิเคราะห์ความแตกต่างของคะแนน 5 มิติ (รสชาติ, บริการ, ความสะอาด, บรรยากาศ, ความคุ้มค่า) เลือกได้สูงสุด 5 สาขา
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedBranches.length > 0 && (
              <button
                id="clear-all-comparison-btn"
                onClick={onClearAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างที่เลือก</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets by Popular Cuisine */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            พรีเซ็ตเปรียบเทียบด่วน:
          </span>
          {['อาหารไทย', 'อาหารญี่ปุ่น', 'อาหารอิตาเลียน', 'อาหารอีสาน', 'คาเฟ่/เบเกอรี'].map((c) => (
            <button
              key={c}
              onClick={() => handleSelectPreset(c)}
              className="px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
            >
              3 สาขา {c}
            </button>
          ))}
        </div>
      </div>

      {/* When no branches are selected */}
      {selectedBranches.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-3 w-full">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
            <GitCompare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีสาขาที่เลือกเพื่อเปรียบเทียบ</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            กดเลือกพรีเซ็ตด้านบน หรือเลือกสาขาจาก Dropdown และรายการด้านล่างเพื่อเปรียบเทียบคะแนน 5 มิติ
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {allBranches.slice(0, 4).map((b) => (
              <button
                key={b.id}
                onClick={() => onAddBranch(b)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-lg font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ {b.fullName} (จ.{b.province})</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Visual Comparison: Radar & Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Radar Overlay Comparison */}
            <div id="comparison-radar-card" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Multi-Dimensional Overlay</span>
                <h3 className="text-base font-bold text-slate-900">
                  เรดาร์เปรียบเทียบคะแนน 5 มิติ (Radar Overlay)
                </h3>
                <p className="text-xs text-slate-500">
                  ซ้อนทับคะแนนของแต่ละสาขาเพื่อดูจุดเด่น-จุดด้อยข้ามมิติ
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="aspect" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    {selectedBranches.map((b, idx) => {
                      const color = getBranchColor(b, idx);
                      return (
                        <Radar
                          key={b.id}
                          name={b.fullName}
                          dataKey={b.fullName}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.25}
                        />
                      );
                    })}
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Comparison by Dimension */}
            <div id="comparison-bar-card" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Aspect Breakdown</span>
                <h3 className="text-base font-bold text-slate-900">
                  เปรียบเทียบเจาะลึก 5 มิติ (Head-to-Head Bar)
                </h3>
                <p className="text-xs text-slate-500">
                  เปรียบเทียบค่าคะแนนชัดเจนในแต่ละส่วนของร้าน
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aspectBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }} />
                    <YAxis domain={[3.0, 5.0]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="อาหาร" fill={ASPECT_COLORS.food.hex} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="บริการ" fill={ASPECT_COLORS.service.hex} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ความสะอาด" fill={ASPECT_COLORS.cleanliness.hex} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="บรรยากาศ" fill={ASPECT_COLORS.atmosphere.hex} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ความคุ้มค่า" fill={ASPECT_COLORS.value.hex} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Actionable Insights */}
          {insights && (
            <div id="comparison-insights-box" className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-xl p-5 shadow-xs w-full">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Lightbulb className="w-5 h-5 text-slate-950" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">Variance Analysis</span>
                  <h4 className="text-sm font-bold text-white">
                    บทวิเคราะห์ความแตกต่างระหว่างสาขา (Branch Variance Analysis)
                  </h4>
                  <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                    <p>
                      • สาขาที่ได้รับคะแนนสูงสุดคือ <strong className="text-white">{insights.topBranch.fullName} ({insights.topBranch.overallRating.toFixed(1)} ★)</strong> สูงกว่าสาขา <strong className="text-white">{insights.lowBranch.fullName} ({insights.lowBranch.overallRating.toFixed(1)} ★)</strong> อยู่ {insights.ratingDiff} คะแนน
                    </p>
                    <p>
                      • ช่องว่างความต่างสูงสุด (Largest Gap) เกิดขึ้นที่มิติ <strong className="text-amber-300">&quot;{insights.biggestGap.name}&quot;</strong> ต่างกัน {(insights.biggestGap.gap).toFixed(1)} คะแนน ({insights.biggestGap.topVal} เทียบกับ {insights.biggestGap.lowVal})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Head-to-Head Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs overflow-hidden w-full">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Side-by-Side Comparison</span>
              <h3 className="text-base font-bold text-slate-900">
                ตารางเปรียบเทียบข้อมูลสาขาแบบเคียงข้างกัน (Side-by-Side Matrix)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 font-bold text-slate-700 w-44 uppercase tracking-wider text-[10px]">ตัวแปร / มิติ</th>
                    {selectedBranches.map((b, idx) => (
                      <th key={b.id} className="p-3 font-bold text-slate-900 min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" 
                              style={{ backgroundColor: getBranchColor(b, idx) }}
                            ></span>
                            <span className="truncate">{b.fullName}</span>
                          </div>
                          <button
                            onClick={() => onRemoveBranch(b.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            title="นำออกจากการเปรียบเทียบ"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">จ.{b.province} • {b.cuisine}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Rating */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">คะแนนโดยรวม (Overall)</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3 font-black text-emerald-600 text-sm">
                        ★ {b.overallRating.toFixed(1)} / 5.0
                        <span className="text-[11px] font-normal text-slate-400 ml-1.5">({b.reviewCount} รีวิว)</span>
                      </td>
                    ))}
                  </tr>

                  {/* Food */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">🍛 รสชาติอาหาร</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3">
                        <span className="font-extrabold text-amber-700">{b.aspectScores.food.toFixed(1)}</span>
                        <div className="w-24 bg-amber-100 h-1.5 rounded-full mt-1">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(b.aspectScores.food / 5) * 100}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Service */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">🛎️ การบริการ</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3">
                        <span className="font-extrabold text-blue-700">{b.aspectScores.service.toFixed(1)}</span>
                        <div className="w-24 bg-blue-100 h-1.5 rounded-full mt-1">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(b.aspectScores.service / 5) * 100}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Cleanliness */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">✨ ความสะอาด</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3">
                        <span className="font-extrabold text-emerald-700">{b.aspectScores.cleanliness.toFixed(1)}</span>
                        <div className="w-24 bg-emerald-100 h-1.5 rounded-full mt-1">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(b.aspectScores.cleanliness / 5) * 100}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Atmosphere */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">🌿 บรรยากาศ</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3">
                        <span className="font-extrabold text-purple-700">{b.aspectScores.atmosphere.toFixed(1)}</span>
                        <div className="w-24 bg-purple-100 h-1.5 rounded-full mt-1">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(b.aspectScores.atmosphere / 5) * 100}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Value */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">🏷️ ความคุ้มค่าราคา</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3">
                        <span className="font-extrabold text-rose-700">{b.aspectScores.value.toFixed(1)}</span>
                        <div className="w-24 bg-rose-100 h-1.5 rounded-full mt-1">
                          <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(b.aspectScores.value / 5) * 100}%` }}></div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Spend */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50/50">ราคาเฉลี่ยต่อมื้อ</td>
                    {selectedBranches.map((b) => (
                      <td key={b.id} className="p-3 font-bold text-slate-800">
                        ฿{b.avgPriceThb} ({b.priceRange})
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===================== ADD TO COMPARISON SECTION ===================== */}
      {/* Complete multi-filter & multi-sort (including Z-A & Minimum Rating) */}
      <div id="add-to-comparison-section" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 w-full">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Add to Comparison</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedBranches.length >= 5 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                เลือกแล้ว {selectedBranches.length}/5 สาขา
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              + ช่องเลือกสาขาเพื่อเปรียบเทียบ (มีให้เลือกครบทุกสาขา 1,500 สาขาทั่วประเทศ)
            </h4>
            <p className="text-xs text-slate-500">
              {selectedBranches.length >= 5 
                ? 'ครบขีดจำกัด 5 สาขาแล้ว กรุณานำสาขาเดิมออกเพื่อเลือกสาขาใหม่'
                : `สามารถกรองเรตติ้งต่ำสุด เรียงลำดับ Z-A หรือค้นหา แล้วเลือกสาขาได้จาก Dropdown หรือรายการการ์ด`}
            </p>
          </div>

          {selectedBranches.length < 5 && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
              <Check className="w-3.5 h-3.5" />
              <span>เลือกเพิ่มได้อีก {5 - selectedBranches.length} สาขา</span>
            </div>
          )}
        </div>

        {/* PRIMARY DROPDOWN LIST: Direct List Selector for ALL Branches */}
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <label htmlFor="add-branch-dropdown-select" className="block text-xs font-bold text-slate-800 flex items-center justify-between flex-wrap gap-1">
            <span className="flex items-center gap-1.5 text-amber-950 font-bold">
              <Plus className="w-4 h-4 text-amber-600 font-extrabold" />
              <span>ช่อง Add to Comparison (เลือกสาขาจากรายชื่อที่กรองได้ {filteredCandidates.length.toLocaleString()} สาขา):</span>
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              เรียง: {getSortLabel(sortBy)} {minRatingFilter > 0 ? `• เรตติ้ง ≥ ${minRatingFilter} ★` : ''}
            </span>
          </label>

          <div className="relative">
            <select
              id="add-branch-dropdown-select"
              disabled={selectedBranches.length >= 5}
              value={quickSelectValue}
              onChange={handleQuickSelectChange}
              className="w-full bg-white border border-amber-300 rounded-lg pl-3 pr-10 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed appearance-none"
            >
              <option value="">
                {selectedBranches.length >= 5 
                  ? '⚠️ เลือกครบ 5 สาขาแล้ว (กรุณากด X นำสาขาเดิมออกก่อนเพื่อเพิ่มใหม่)' 
                  : filteredCandidates.length === 0
                    ? 'ไม่พบสาขาตามเงื่อนไขตัวกรอง (กรุณาลองปรับลดเรตติ้งต่ำสุดหรือล้างคำค้นหา)'
                    : `▼ คลิกเพื่อเลือกสาขาที่ต้องการเพิ่ม (${filteredCandidates.length.toLocaleString()} สาขา • เรียง: ${getSortLabel(sortBy)})...`}
              </option>
              {filteredCandidates.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fullName} — [จ.{b.province}] • {b.cuisine} • ⭐ {b.overallRating.toFixed(1)} ({b.reviewCount} รีวิว • ฿{b.avgPriceThb})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter & Search Controls Toolbar (รวม: เรตติ้งต่ำสุด, เรียงลำดับ Z-A, ค้นหา, ประเภทอาหาร, จังหวัด) */}
        <div className="pt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs w-full">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-[170px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-candidates-input"
                type="text"
                placeholder="ค้นหาชื่อสาขา, เมนู, อำเภอ..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(24);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="ล้างข้อความค้นหา"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2. ตัวกรองเรตติ้งต่ำสุด (Minimum Rating Filter) */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              minRatingFilter > 0 ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">เรตติ้งต่ำสุด:</span>
              <select
                id="filter-min-rating-comparison"
                value={minRatingFilter}
                onChange={(e) => {
                  setMinRatingFilter(parseFloat(e.target.value));
                  setVisibleCount(24);
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="0">เรตติ้งต่ำสุด: ทั้งหมด</option>
                <option value="4.5">⭐ 4.5+ (ยอดเยี่ยมพิเศษ)</option>
                <option value="4.0">⭐ 4.0+ (กลุ่มคะแนนสูง ML)</option>
                <option value="3.5">⭐ 3.5+ (ปานกลางขึ้นไป)</option>
                <option value="3.0">⭐ 3.0+ (พื้นฐาน)</option>
              </select>
            </div>

            {/* 3. ตัวเลือกการเรียงลำดับ (Sorting Options including Z-A & เรตติ้งต่ำสุด) */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">เรียง:</span>
              <select
                id="sort-branches-comparison"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as BranchSortOption)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="rating_desc">⭐ เรตติ้งสูงสุด (High-Low)</option>
                <option value="rating_asc">⚠️ เรตติ้งต่ำสุด (Low-High)</option>
                <option value="name_asc">🔤 ชื่อร้าน ก-ฮ (A-Z)</option>
                <option value="name_desc">🔤 ชื่อร้าน ฮ-ก (Z-A)</option>
                <option value="reviews_desc">💬 จำนวนรีวิวมากสุด</option>
                <option value="reviews_asc">💬 จำนวนรีวิวน้อยสุด</option>
                <option value="price_asc">💵 ราคาเฉลี่ยต่ำสุด (คุ้มค่า)</option>
                <option value="price_desc">💎 ราคาเฉลี่ยสูงสุด (พรีเมียม)</option>
                <option value="food_desc">🍛 คะแนนรสชาติอาหารสูงสุด</option>
                <option value="service_desc">🛎️ คะแนนการบริการสูงสุด</option>
              </select>
            </div>

            {/* 4. Cuisine Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCuisineFilter}
                onChange={(e) => {
                  setSelectedCuisineFilter(e.target.value);
                  setVisibleCount(24);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ทั้งหมด">ทุกประเภทอาหาร ({CUISINE_LIST.length - 1} ประเภท)</option>
                {CUISINE_LIST.filter(c => c !== 'ทั้งหมด').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 5. Province Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedProvinceFilter}
                onChange={(e) => {
                  setSelectedProvinceFilter(e.target.value);
                  setVisibleCount(24);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[130px]"
              >
                <option value="ทั้งหมด">ทุกจังหวัด ({ALL_PROVINCES.length} จ.)</option>
                {ALL_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveCustomFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="รีเซ็ตเงื่อนไขตัวกรองและการเรียงลำดับทั้งหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1.5">
            <span>พบ</span>
            <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{filteredCandidates.length.toLocaleString()}</strong>
            <span>สาขาที่พร้อมเลือก</span>
          </div>
        </div>

        {/* Visual Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs">ไม่พบสาขาที่ตรงกับเงื่อนไขการค้นหาและตัวกรองที่ระบุ</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              ล้างเงื่อนไขตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[480px] overflow-y-auto pr-1 w-full">
              {displayedCandidates.map((b) => {
                const colorConf = CUISINE_COLORS[b.cuisine] || {
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                  dot: 'bg-slate-400'
                };
                const isMaxReached = selectedBranches.length >= 5;

                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between shadow-2xs ${
                      isMaxReached 
                        ? 'bg-slate-50/60 border-slate-200 opacity-70' 
                        : 'bg-white hover:bg-amber-50/30 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 w-full mb-1">
                        <span className="font-bold text-slate-900 text-xs line-clamp-1" title={b.fullName}>
                          {b.fullName}
                        </span>
                        <span className="text-emerald-700 font-extrabold shrink-0 flex items-center gap-0.5 text-xs">
                          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                          {b.overallRating.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          จ.{b.province}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${colorConf.bg} ${colorConf.text}`}>
                          {b.cuisine}
                        </span>
                      </div>

                      {/* Mini aspect score summary */}
                      <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono py-1 px-1.5 bg-slate-50 rounded-md mb-2 text-slate-600">
                        <div title={`รสชาติอาหาร: ${b.aspectScores.food}`}>
                          <span className="block text-slate-400">รสชาติ</span>
                          <span className="font-bold text-amber-700">{b.aspectScores.food}</span>
                        </div>
                        <div title={`การบริการ: ${b.aspectScores.service}`}>
                          <span className="block text-slate-400">บริการ</span>
                          <span className="font-bold text-blue-700">{b.aspectScores.service}</span>
                        </div>
                        <div title={`ความสะอาด: ${b.aspectScores.cleanliness}`}>
                          <span className="block text-slate-400">สะอาด</span>
                          <span className="font-bold text-emerald-700">{b.aspectScores.cleanliness}</span>
                        </div>
                        <div title={`บรรยากาศ: ${b.aspectScores.atmosphere}`}>
                          <span className="block text-slate-400">บรรยากาศ</span>
                          <span className="font-bold text-purple-700">{b.aspectScores.atmosphere}</span>
                        </div>
                        <div title={`ความคุ้มค่า: ${b.aspectScores.value}`}>
                          <span className="block text-slate-400">คุ้มค่า</span>
                          <span className="font-bold text-rose-700">{b.aspectScores.value}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddBranch(b)}
                      disabled={isMaxReached}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isMaxReached
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-amber-600 text-white cursor-pointer shadow-xs active:scale-98'
                      }`}
                      title={isMaxReached ? 'ครบ 5 สาขาแล้ว' : `เพิ่ม ${b.fullName} เข้าเปรียบเทียบ`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isMaxReached ? 'ครบ 5 สาขาแล้ว' : '+ เพิ่มเข้าเปรียบเทียบ'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination / Show More Controls */}
            {hasMore && (
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>แสดงสาขาเพิ่มเติม (+24 สาขา)</span>
                </button>
                <button
                  onClick={() => setVisibleCount(filteredCandidates.length)}
                  className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors cursor-pointer"
                >
                  <span>แสดงทั้งหมด {filteredCandidates.length.toLocaleString()} สาขา</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
