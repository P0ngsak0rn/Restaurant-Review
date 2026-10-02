import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { RestaurantMap } from './components/RestaurantMap';
import { BranchComparison } from './components/BranchComparison';
import { RatingPredictor } from './components/RatingPredictor';
import { ReviewExplorer } from './components/ReviewExplorer';
import { RESTAURANT_BRANCHES } from './data/restaurantData';
import { RestaurantBranch, FilterState, ReviewItem } from './types';

export default function App() {
  const [branches, setBranches] = useState<RestaurantBranch[]>(RESTAURANT_BRANCHES);
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'comparison' | 'model' | 'reviews'>('overview');

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedRegion: 'ทุกภาค',
    selectedCuisine: 'ทั้งหมด',
    selectedProvince: 'ทุกจังหวัด',
    selectedDistrict: 'ทุกจังหวัด',
    minRating: 0,
    ratingFilter: 'all',
    selectedPriceRange: 'ทั้งหมด',
    selectedChain: 'ทั้งหมด',
  });

  // Pre-select 2 branches for comparison demo (e.g. Shabu Shabu Taro Siam & Thonglor)
  const [selectedCompareBranches, setSelectedCompareBranches] = useState<RestaurantBranch[]>([
    RESTAURANT_BRANCHES[0], // Shabu Shabu Taro - Siam
    RESTAURANT_BRANCHES[1], // Shabu Shabu Taro - Thonglor
    RESTAURANT_BRANCHES[2], // Shabu Shabu Taro - Central Rama 9
  ]);

  // Filtered branches for display
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      // 1. Search query (supports name, province, region, cuisine, description)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = b.fullName.toLowerCase().includes(q);
        const matchesDistrict = b.district?.toLowerCase().includes(q);
        const matchesProvince = b.province?.toLowerCase().includes(q);
        const matchesRegion = b.region?.toLowerCase().includes(q);
        const matchesCuisine = b.cuisine.toLowerCase().includes(q);
        const matchesDesc = b.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDistrict && !matchesProvince && !matchesRegion && !matchesCuisine && !matchesDesc) {
          return false;
        }
      }

      // 2. Region Filter (ภูมิภาค)
      if (
        filters.selectedRegion && 
        filters.selectedRegion !== 'ทุกภาค' && 
        filters.selectedRegion !== 'ทุกภูมิภาค'
      ) {
        if (b.region !== filters.selectedRegion) {
          return false;
        }
      }

      // 3. Cuisine Filter (ประเภท)
      if (
        filters.selectedCuisine && 
        filters.selectedCuisine !== 'ทั้งหมด' && 
        filters.selectedCuisine !== 'ทุกประเภท'
      ) {
        if (b.cuisine !== filters.selectedCuisine) {
          return false;
        }
      }

      // 4. Province Filter (จังหวัด)
      const targetProvince = filters.selectedProvince || filters.selectedDistrict;
      if (
        targetProvince && 
        targetProvince !== 'ทุกจังหวัด' && 
        targetProvince !== 'ทุกจังหวัด/พื้นที่' && 
        targetProvince !== 'ทุกย่านทำเล'
      ) {
        if (b.province !== targetProvince && b.district !== targetProvince) {
          return false;
        }
      }

      // 5. Rating Filter (เรตติ้ง)
      if (filters.ratingFilter && filters.ratingFilter !== 'all') {
        if (filters.ratingFilter === '4.5+' && b.overallRating < 4.5) return false;
        if (filters.ratingFilter === '4.0+' && b.overallRating < 4.0) return false;
        if (filters.ratingFilter === '3.5+' && b.overallRating < 3.5) return false;
        if (filters.ratingFilter === 'under_4.0' && b.overallRating >= 4.0) return false;
      } else if (filters.minRating > 0) {
        if (b.overallRating < filters.minRating) {
          return false;
        }
      }

      return true;
    });
  }, [branches, filters]);

  // Comparison handlers
  const handleToggleCompare = (branch: RestaurantBranch) => {
    setSelectedCompareBranches((prev) => {
      const exists = prev.some((b) => b.id === branch.id);
      if (exists) {
        return prev.filter((b) => b.id !== branch.id);
      } else {
        if (prev.length >= 5) {
          alert('สามารถเปรียบเทียบได้สูงสุด 5 สาขาพร้อมกัน');
          return prev;
        }
        return [...prev, branch];
      }
    });
  };

  const handleAddBranchToCompare = (branch: RestaurantBranch) => {
    setSelectedCompareBranches((prev) => {
      if (prev.some((b) => b.id === branch.id)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, branch];
    });
  };

  const handleRemoveBranchFromCompare = (branchId: string) => {
    setSelectedCompareBranches((prev) => prev.filter((b) => b.id !== branchId));
  };

  const handleClearCompare = () => {
    setSelectedCompareBranches([]);
  };

  // Handler for adding a new simulated review
  const handleAddReview = (branchId: string, review: ReviewItem) => {
    setBranches((prev) =>
      prev.map((branch) => {
        if (branch.id === branchId) {
          const updatedReviews = [review, ...branch.reviews];
          const newCount = branch.reviewCount + 1;

          // Recalculate aspect scores
          const newFood = parseFloat(
            ((branch.aspectScores.food * branch.reviewCount + review.aspectScores.food) / newCount).toFixed(2)
          );
          const newService = parseFloat(
            ((branch.aspectScores.service * branch.reviewCount + review.aspectScores.service) / newCount).toFixed(2)
          );
          const newAtmosphere = parseFloat(
            ((branch.aspectScores.atmosphere * branch.reviewCount + review.aspectScores.atmosphere) / newCount).toFixed(2)
          );
          const newCleanliness = parseFloat(
            ((branch.aspectScores.cleanliness * branch.reviewCount + review.aspectScores.cleanliness) / newCount).toFixed(2)
          );
          const newValue = parseFloat(
            ((branch.aspectScores.value * branch.reviewCount + review.aspectScores.value) / newCount).toFixed(2)
          );

          const newOverall = parseFloat(
            (newFood * 0.36 + newService * 0.25 + newCleanliness * 0.17 + newAtmosphere * 0.11 + newValue * 0.11).toFixed(2)
          );

          return {
            ...branch,
            reviewCount: newCount,
            overallRating: newOverall,
            aspectScores: {
              food: newFood,
              service: newService,
              atmosphere: newAtmosphere,
              cleanliness: newCleanliness,
              value: newValue,
            },
            reviews: updatedReviews,
          };
        }
        return branch;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif] w-full">
      {/* Header with Navigation & Filter Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filters={filters}
        setFilters={setFilters}
        totalBranches={branches.length}
        filteredCount={filteredBranches.length}
      />

      {/* Main View Content Container - 100% Full Screen Width */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 pt-5">
        {activeTab === 'overview' && (
          <OverviewDashboard
            branches={filteredBranches}
            onSelectBranchForCompare={(branch) => {
              handleAddBranchToCompare(branch);
              setActiveTab('comparison');
            }}
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateToPredictor={() => setActiveTab('model')}
          />
        )}

        {activeTab === 'map' && (
          <RestaurantMap
            branches={filteredBranches}
            onSelectForCompare={handleToggleCompare}
            selectedCompareBranchIds={selectedCompareBranches.map((b) => b.id)}
          />
        )}

        {activeTab === 'comparison' && (
          <BranchComparison
            allBranches={branches}
            selectedBranches={selectedCompareBranches}
            onAddBranch={handleAddBranchToCompare}
            onRemoveBranch={handleRemoveBranchFromCompare}
            onClearAll={handleClearCompare}
          />
        )}

        {activeTab === 'model' && <RatingPredictor branches={branches} />}

        {activeTab === 'reviews' && (
          <ReviewExplorer
            branches={filteredBranches}
            onAddReview={handleAddReview}
          />
        )}
      </main>

      {/* Footer - Full Width */}
      <footer id="app-footer" className="h-12 bg-white border-t border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 justify-between shrink-0 shadow-2xs mt-auto w-full">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="uppercase tracking-tighter text-[11px]">Live Analytics Active</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="uppercase tracking-tighter text-[11px]">Data Synced</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          © 2024 Restaurant Intelligence Unit • CRISP-DM Analytics
        </div>
      </footer>
    </div>
  );
}
