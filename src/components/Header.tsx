import React, { useState, useEffect } from 'react';
import { 
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SlidersHorizontal,
  Filter,
  Search,
  RotateCcw,
  BarChart3, 
  MapPin, 
  GitCompare, 
  GitFork, 
  MessageSquare, 
  Sparkles,
  Layers,
  Map,
  CheckCircle2
} from 'lucide-react';
import { FilterState } from '../types';
import { 
  CUISINE_LIST, 
  REGION_LIST, 
  getProvincesForRegion
} from '../data/restaurantData';

interface HeaderProps {
  activeTab: 'overview' | 'map' | 'comparison' | 'model' | 'reviews';
  setActiveTab: (tab: 'overview' | 'map' | 'comparison' | 'model' | 'reviews') => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalBranches: number;
  filteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  filters,
  setFilters,
  totalBranches,
  filteredCount
}) => {
  // Sidebar (Hamburger Drawer) State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Filter Dropdown Collapsible State (Can be opened and closed at any time and scenario)
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const availableProvinces = getProvincesForRegion(filters.selectedRegion);

  const handleRegionChange = (newRegion: string) => {
    setFilters(prev => {
      const provincesInNewRegion = getProvincesForRegion(newRegion);
      const currentProv = prev.selectedProvince || prev.selectedDistrict;
      const isCurrentProvStillValid = newRegion === 'ทุกภาค' || provincesInNewRegion.includes(currentProv);
      const updatedProv = isCurrentProvStillValid ? currentProv : 'ทุกจังหวัด';
      return {
        ...prev,
        selectedRegion: newRegion,
        selectedProvince: updatedProv,
        selectedDistrict: updatedProv
      };
    });
  };

  const handleCuisineChange = (newCuisine: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCuisine: newCuisine
    }));
  };

  const handleProvinceChange = (newProvince: string) => {
    setFilters(prev => ({
      ...prev,
      selectedProvince: newProvince,
      selectedDistrict: newProvince
    }));
  };

  const handleRatingChange = (newRatingFilter: string) => {
    let minR = 0;
    if (newRatingFilter === '4.5+') minR = 4.5;
    else if (newRatingFilter === '4.0+') minR = 4.0;
    else if (newRatingFilter === '3.5+') minR = 3.5;

    setFilters(prev => ({
      ...prev,
      ratingFilter: newRatingFilter,
      minRating: minR
    }));
  };

  const handleResetAll = () => {
    setFilters({
      searchQuery: '',
      selectedRegion: 'ทุกภาค',
      selectedCuisine: 'ทั้งหมด',
      selectedProvince: 'ทุกจังหวัด',
      selectedDistrict: 'ทุกจังหวัด',
      minRating: 0,
      ratingFilter: 'all',
      selectedPriceRange: 'ทั้งหมด',
      selectedChain: 'ทั้งหมด'
    });
  };

  const isRegionActive = Boolean(filters.selectedRegion && filters.selectedRegion !== 'ทุกภาค' && filters.selectedRegion !== 'ทุกภูมิภาค');
  const isCuisineActive = Boolean(filters.selectedCuisine && filters.selectedCuisine !== 'ทั้งหมด' && filters.selectedCuisine !== 'ทุกประเภท');
  const currentProvince = filters.selectedProvince || filters.selectedDistrict;
  const isProvinceActive = Boolean(
    currentProvince && 
    currentProvince !== 'ทุกจังหวัด' && 
    currentProvince !== 'ทุกจังหวัด/พื้นที่' && 
    currentProvince !== 'ทุกย่านทำเล'
  );
  const isRatingActive = Boolean((filters.ratingFilter && filters.ratingFilter !== 'all') || filters.minRating > 0);
  const isSearchActive = Boolean(filters.searchQuery.trim());

  const hasActiveFilters = isRegionActive || isCuisineActive || isProvinceActive || isRatingActive || isSearchActive;
  const activeFilterCount = [isRegionActive, isCuisineActive, isProvinceActive, isRatingActive, isSearchActive].filter(Boolean).length;

  const getRatingLabel = () => {
    if (filters.ratingFilter === '4.5+') return '⭐ 4.5+ (ยอดเยี่ยม)';
    if (filters.ratingFilter === '4.0+') return '⭐ 4.0+ (เรตติ้งสูง)';
    if (filters.ratingFilter === '3.5+') return '⭐ 3.5+ (ปานกลาง+)';
    if (filters.ratingFilter === 'under_4.0') return '⚠️ ต่ำกว่า 4.0';
    if (filters.minRating > 0) return `⭐ ${filters.minRating.toFixed(1)}+`;
    return '';
  };

  // 5 Main Navigation Tabs as requested by user
  const NAV_ITEMS = [
    {
      id: 'overview' as const,
      shortTitle: 'ภาพรวม',
      fullTitle: 'ภาพรวม & วิเคราะห์มิติคะแนน',
      badge: 'Dashboard',
      desc: 'สรุปภาพรวม สถิติสำคัญ และการวิเคราะห์คะแนน 5 มิติทั้งระบบ',
      icon: BarChart3,
      accentColor: 'text-emerald-600',
      activeGradient: 'from-emerald-600 to-teal-700',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-50 text-emerald-950',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'map' as const,
      shortTitle: 'แผนที่พิกัด',
      fullTitle: 'แผนที่พิกัด 77 จังหวัด',
      badge: 'GIS Map',
      desc: 'แผนที่ตำแหน่งสาขา 1,500 จุด คลัสเตอร์ทำเล และภูมิภาคทั่วไทย',
      icon: MapPin,
      accentColor: 'text-indigo-600',
      activeGradient: 'from-indigo-600 to-blue-700',
      activeBorder: 'border-indigo-500',
      activeBg: 'bg-indigo-50 text-indigo-950',
      iconBg: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'comparison' as const,
      shortTitle: 'เปรียบเทียบ',
      fullTitle: 'เปรียบเทียบสาขาข้ามมิติ',
      badge: 'Radar Matrix',
      desc: 'เปรียบเทียบเรดาร์ชาร์ต จุดแข็ง-จุดอ่อน และความคุ้มค่าระหว่างสาขา',
      icon: GitCompare,
      accentColor: 'text-amber-600',
      activeGradient: 'from-amber-600 to-orange-700',
      activeBorder: 'border-amber-500',
      activeBg: 'bg-amber-50 text-amber-950',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'model' as const,
      shortTitle: 'จำลองการทำนาย',
      fullTitle: 'จำลองการทำนายและแผนภาพแสดงการทำนาย',
      badge: 'ML Engine',
      desc: 'โครงสร้างแบบจำลอง Decision Tree, กฎการพิจารณา และทดสอบตัวแปรคะแนน 5 มิติ',
      icon: GitFork,
      accentColor: 'text-purple-600',
      activeGradient: 'from-purple-600 to-violet-700',
      activeBorder: 'border-purple-500',
      activeBg: 'bg-purple-50 text-purple-950',
      iconBg: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'reviews' as const,
      shortTitle: 'คลังรีวิว',
      fullTitle: 'คลังรีวิวและเสียงตอบรับ',
      badge: 'Reviews Hub',
      desc: 'คลังความคิดเห็นผู้บริโภค กรองตามมิติคะแนน และจำลองเพิ่มรีวิวใหม่',
      icon: MessageSquare,
      accentColor: 'text-rose-600',
      activeGradient: 'from-rose-600 to-pink-700',
      activeBorder: 'border-rose-500',
      activeBg: 'bg-rose-50 text-rose-950',
      iconBg: 'bg-rose-100 text-rose-700',
    },
  ];

  const currentNavItem = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];
  const CurrentIcon = currentNavItem.icon;

  return (
    <>
      {/* ===================== SIDEBAR NAVIGATION DRAWER (แท็บขีดสามขีดด้านข้าง) ===================== */}
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        id="sidebar-navigation-drawer"
        className={`fixed top-0 left-0 bottom-0 w-84 sm:w-96 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="เมนูระบบนำทาง"
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md ring-2 ring-emerald-400/40 shrink-0">
              <span>GR</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wider uppercase">GastroReview</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Menu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                เลือกแท็บหน้าเพื่อสำรวจข้อมูล
              </p>
            </div>
          </div>

          <button
            id="close-sidebar-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="ปิดเมนู"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Tabs List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          <div className="px-2 pt-1 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>แท็บเมนูการนำทาง (5 หน้า)</span>
            <span className="text-emerald-600 font-medium">คลิกเพื่อสลับหน้า</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                  isActive
                    ? `${item.activeBg} ${item.activeBorder} shadow-sm ring-2 ring-emerald-500/20`
                    : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 rounded-r-full" />
                )}

                <div className={`p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : `${item.iconBg} group-hover:bg-slate-200`
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold tracking-tight truncate ${
                      isActive ? 'text-slate-900' : 'text-slate-800'
                    }`}>
                      {item.fullTitle}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        หน้าปัจจุบัน
                      </span>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick Filter Access from Sidebar */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  แผงตัวกรองข้อมูล
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isFilterOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isFilterOpen ? 'เปิดอยู่' : 'ย่ออยู่'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                {hasActiveFilters 
                  ? `มีการใช้งาน ${activeFilterCount} ตัวกรอง • แสดงผล ${filteredCount.toLocaleString()} สาขา`
                  : 'ยังไม่มีการเลือกตัวกรองพิเศษ • แสดงครบ 1,500 สาขา'
                }
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsFilterOpen(prev => !prev);
                    setIsSidebarOpen(false);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition-colors cursor-pointer"
                >
                  {isFilterOpen ? '▲ ปิดดรอปดาวน์ตัวกรอง' : '▼ เปิดดรอปดาวน์ตัวกรอง'}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetAll}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                    title="ล้างตัวกรองทั้งหมด"
                  >
                    ล้างค่า
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">ฐานข้อมูลสาขาทั่วประเทศ:</span>
            <span className="font-bold text-emerald-700">1,500 สาขา (77 จังหวัด)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>CRISP-DM Analytics Unit</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
      </aside>


      {/* ===================== MAIN HEADER BAR ===================== */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full">
        {/* Top Header Row with Hamburger (ขีดสามขีด), Brand, Current Tab Pill & Filter Toggle */}
        <div className="w-full px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Left: Hamburger (ขีดสามขีดด้านข้าง) + Brand + Active Tab Badge */}
          <div className="flex items-center space-x-3">
            {/* Hamburger Button (ขีดสามขีด) */}
            <button
              id="hamburger-menu-button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="เปิดแท็บเมนูนำทาง (ขีดสามขีด)"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200/90 border border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer font-bold text-xs group"
              title="เปิดเมนูนำทาง (ภาพรวม, แผนที่พิกัด, เปรียบเทียบ, จำลองการทำนาย, คลังรีวิว)"
            >
              <Menu className="w-5 h-5 text-slate-700 group-hover:text-slate-900 group-hover:scale-105 transition-transform" />
              <span className="font-bold hidden sm:inline text-slate-800">เมนู</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block"></span>
            </button>

            {/* Vibrant Multi-accent Logo Badge */}
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0 ring-1 ring-emerald-200">
                <span>GR</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-800 uppercase">
                    GastroReview <span className="text-emerald-600 font-extrabold">Analytics</span>
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CRISP-DM
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
                  ระบบวิเคราะห์รีวิวร้านอาหารและปัจจัยคะแนน 5 มิติ
                </p>
              </div>
            </div>

            {/* Current Active Tab Pill (Clicking it also opens sidebar) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
              title="คลิกเพื่อเปิดเมนูนำทางสลับหน้า"
            >
              <CurrentIcon className={`w-3.5 h-3.5 ${currentNavItem.accentColor}`} />
              <span className="text-slate-500 font-medium text-[11px]">หน้า:</span>
              <span className="text-slate-900 font-bold">{currentNavItem.shortTitle}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Right: Filter Dropdown Toggle Button (เปิดปิดได้ตลอดเวลาและทุกสถานะการณ์) & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Stats Pill */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${hasActiveFilters ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="font-semibold text-slate-700">สาขา:</span>
              <span className="text-emerald-700 font-bold">{filteredCount.toLocaleString()}</span>
              <span className="text-slate-400">/ {totalBranches.toLocaleString()}</span>
            </div>

            {/* Dedicated Dropdown Filter Toggle Button */}
            <button
              id="filter-dropdown-toggle-btn"
              onClick={() => setIsFilterOpen(prev => !prev)}
              aria-expanded={isFilterOpen}
              aria-controls="filter-collapsible-panel"
              className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                isFilterOpen
                  ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-emerald-500/20'
                  : hasActiveFilters
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200/50 hover:bg-emerald-100/70'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title={isFilterOpen ? 'คลิกเพื่อย่อ/ปิดแผงตัวกรอง' : 'คลิกเพื่อเปิดดรอปดาวน์แผงตัวกรอง'}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${
                isFilterOpen ? 'text-emerald-400' : hasActiveFilters ? 'text-emerald-600' : 'text-slate-500'
              }`} />
              
              <span>ตัวกรอง</span>
              
              {hasActiveFilters && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isFilterOpen ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}

              {isFilterOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>


        {/* ===================== COLLAPSIBLE FILTER DROPDOWN PANEL ===================== */}
        {/* Opens and closes at any time and in every scenario */}
        {isFilterOpen && (
          <div
            id="filter-collapsible-panel"
            className="bg-slate-50/95 border-t border-slate-200 px-3 sm:px-5 lg:px-6 py-3 transition-all duration-200 shadow-inner w-full"
          >
            <div className="w-full flex flex-col gap-2.5">
              
              {/* Filter Row 1: Header / Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                
                {/* Search & Filter Selectors */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[170px] max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="search-restaurant-input"
                      type="text"
                      placeholder="ค้นหาชื่อร้าน, เมนู, คีย์เวิร์ด..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      className={`w-full pl-8 ${filters.searchQuery ? 'pr-7' : 'pr-3'} py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-all ${
                        isSearchActive ? 'bg-emerald-50/50 border-emerald-300 font-medium' : 'bg-white border border-slate-200'
                      }`}
                    />
                    {filters.searchQuery && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        title="ล้างข้อความค้นหา"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 1. ภูมิภาค (Region Filter) */}
                  <div className={`flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg border transition-all ${
                    isRegionActive ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Map className="w-3 h-3 text-indigo-500" />
                      <span>ภูมิภาค:</span>
                    </span>
                    <select
                      id="filter-region-select"
                      value={filters.selectedRegion || 'ทุกภาค'}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 text-slate-800"
                    >
                      <option value="ทุกภาค">ทุกภูมิภาค (ทั้งหมด)</option>
                      {REGION_LIST.filter(r => r !== 'ทุกภาค').map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {isRegionActive && (
                      <button
                        onClick={() => handleRegionChange('ทุกภาค')}
                        className="text-indigo-600 hover:text-indigo-800 p-0.5 hover:bg-indigo-100 rounded-full transition-colors cursor-pointer"
                        title="ล้างตัวกรองภูมิภาค"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 2. ประเภทอาหาร (Cuisine Filter) */}
                  <div className={`flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg border transition-all ${
                    isCuisineActive ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-500" />
                      <span>ประเภท:</span>
                    </span>
                    <select
                      id="filter-cuisine-select"
                      value={filters.selectedCuisine}
                      onChange={(e) => handleCuisineChange(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 text-slate-800"
                    >
                      <option value="ทั้งหมด">ทุกประเภทอาหาร (ทั้งหมด)</option>
                      {CUISINE_LIST.filter(c => c !== 'ทั้งหมด').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {isCuisineActive && (
                      <button
                        onClick={() => handleCuisineChange('ทั้งหมด')}
                        className="text-emerald-600 hover:text-emerald-800 p-0.5 hover:bg-emerald-100 rounded-full transition-colors cursor-pointer"
                        title="ล้างตัวกรองประเภทอาหาร"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 3. จังหวัด (Province Filter) */}
                  <div className={`flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg border transition-all ${
                    isProvinceActive ? 'bg-blue-50/70 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span>จังหวัด:</span>
                    </span>
                    <select
                      id="filter-district-select"
                      value={currentProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[145px] text-slate-800"
                    >
                      <option value="ทุกจังหวัด">
                        ทุกจังหวัด {isRegionActive ? `(${availableProvinces.length} จ.)` : '(77 จ.)'}
                      </option>
                      {availableProvinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {isProvinceActive && (
                      <button
                        onClick={() => handleProvinceChange('ทุกจังหวัด')}
                        className="text-blue-600 hover:text-blue-800 p-0.5 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                        title="ล้างตัวกรองจังหวัด"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* 4. เรตติ้ง (Rating Filter) */}
                  <div className={`flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-lg border transition-all ${
                    isRatingActive ? 'bg-amber-50/70 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>เรตติ้ง:</span>
                    </span>
                    <select
                      id="filter-min-rating-select"
                      value={filters.ratingFilter || (filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+` : 'all')}
                      onChange={(e) => handleRatingChange(e.target.value)}
                      className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 text-slate-800"
                    >
                      <option value="all">ทุกระดับคะแนน (ทั้งหมด)</option>
                      <option value="4.5+">⭐ 4.5+ (ยอดเยี่ยมพิเศษ)</option>
                      <option value="4.0+">⭐ 4.0+ (กลุ่มเรตติ้งสูง ML)</option>
                      <option value="3.5+">⭐ 3.5+ (ปานกลางขึ้นไป)</option>
                      <option value="under_4.0">⚠️ ต่ำกว่า 4.0 (กลุ่มปรับปรุง)</option>
                    </select>
                    {isRatingActive && (
                      <button
                        onClick={() => handleRatingChange('all')}
                        className="text-amber-600 hover:text-amber-800 p-0.5 hover:bg-amber-100 rounded-full transition-colors cursor-pointer"
                        title="ล้างตัวกรองเรตติ้ง"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Master Reset Button */}
                  {hasActiveFilters && (
                    <button
                      id="reset-filters-btn"
                      onClick={handleResetAll}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer shadow-2xs"
                      title="ล้างตัวกรองทั้งหมดกลับสู่ค่าเริ่มต้น"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ล้างค่า ({activeFilterCount})</span>
                    </button>
                  )}
                </div>

                {/* Right side: Close Dropdown & Branch Count */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                    hasActiveFilters 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${hasActiveFilters ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span>แสดง <strong>{filteredCount.toLocaleString()}</strong> / {totalBranches.toLocaleString()} สาขา</span>
                  </span>

                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="ย่อ/ปิดแผงตัวกรองนี้"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Filter Chips Bar (Inside Dropdown) */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span>ตัวกรองที่กำลังใช้งาน:</span>
                  </span>

                  {/* Search query chip */}
                  {isSearchActive && (
                    <span className="inline-flex items-center gap-1 bg-white text-slate-800 px-2 py-0.5 rounded-md border border-slate-300 font-medium shadow-2xs">
                      <span>ค้นหา: &quot;{filters.searchQuery}&quot;</span>
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded p-0.2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Region chip */}
                  {isRegionActive && (
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 font-medium shadow-2xs">
                      <span>ภูมิภาค: {filters.selectedRegion}</span>
                      <button
                        onClick={() => handleRegionChange('ทุกภาค')}
                        className="text-indigo-500 hover:text-indigo-800 hover:bg-indigo-100 rounded p-0.2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Cuisine chip */}
                  {isCuisineActive && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-medium shadow-2xs">
                      <span>ประเภท: {filters.selectedCuisine}</span>
                      <button
                        onClick={() => handleCuisineChange('ทั้งหมด')}
                        className="text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 rounded p-0.2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Province chip */}
                  {isProvinceActive && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 font-medium shadow-2xs">
                      <span>จังหวัด: {currentProvince}</span>
                      <button
                        onClick={() => handleProvinceChange('ทุกจังหวัด')}
                        className="text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded p-0.2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Rating chip */}
                  {isRatingActive && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 font-medium shadow-2xs">
                      <span>เรตติ้ง: {getRatingLabel()}</span>
                      <button
                        onClick={() => handleRatingChange('all')}
                        className="text-amber-500 hover:text-amber-800 hover:bg-amber-100 rounded p-0.2 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetAll}
                    className="text-rose-600 hover:text-rose-800 font-semibold underline text-[11px] ml-1 cursor-pointer"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== COMPACT FILTER CHIPS STRIP WHEN DROPDOWN IS CLOSED ===================== */}
        {/* Even when dropdown is closed, if filters are active, user can see them and click to open dropdown anytime */}
        {!isFilterOpen && hasActiveFilters && (
          <div className="bg-emerald-50/80 border-t border-emerald-200 px-3 sm:px-5 lg:px-6 py-1.5 flex items-center justify-between text-xs gap-2 w-full">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-600" />
                <span>ตัวกรองที่ใช้อยู่ ({activeFilterCount}):</span>
              </span>
              {isSearchActive && (
                <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-slate-800 font-medium">
                  &quot;{filters.searchQuery}&quot;
                </span>
              )}
              {isRegionActive && (
                <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-indigo-800 font-medium">
                  {filters.selectedRegion}
                </span>
              )}
              {isCuisineActive && (
                <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 font-medium">
                  {filters.selectedCuisine}
                </span>
              )}
              {isProvinceActive && (
                <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-blue-800 font-medium">
                  {currentProvince}
                </span>
              )}
              {isRatingActive && (
                <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-amber-800 font-medium">
                  {getRatingLabel()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline cursor-pointer"
              >
                เปิดแผงตัวกรอง (คลิกแก้ไข) ▾
              </button>
              <button
                onClick={handleResetAll}
                className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] px-2 py-0.5 rounded bg-white border border-rose-200 hover:bg-rose-50 cursor-pointer"
              >
                ล้างค่า
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
