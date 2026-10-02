import React from 'react';
import { 
  Star, 
  Store, 
  MessageSquareText, 
  Coins, 
  TrendingUp, 
  Award, 
  Sparkles, 
  ArrowUpRight, 
  GitCompare, 
  MapPin, 
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ChefHat,
  HeartHandshake,
  Sparkle,
  Coffee,
  CircleDollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Cell 
} from 'recharts';
import { RestaurantBranch } from '../types';
import { FEATURE_IMPORTANCES, CUISINE_COLORS, ASPECT_COLORS } from '../data/restaurantData';

interface OverviewDashboardProps {
  branches: RestaurantBranch[];
  onSelectBranchForCompare: (branch: RestaurantBranch) => void;
  onNavigateToMap: () => void;
  onNavigateToPredictor: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  branches,
  onSelectBranchForCompare,
  onNavigateToMap,
  onNavigateToPredictor
}) => {
  // Aggregate KPIs
  const totalCount = branches.length;
  const avgRating = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.overallRating, 0) / totalCount).toFixed(2)
    : '0';
  const totalReviews = branches.reduce((acc, b) => acc + b.reviewCount, 0);
  const avgPrice = totalCount > 0 
    ? Math.round(branches.reduce((acc, b) => acc + b.avgPriceThb, 0) / totalCount)
    : 0;
  const highRatingCount = branches.filter(b => b.overallRating >= 4.0).length;
  const highRatingPercentage = totalCount > 0 ? Math.round((highRatingCount / totalCount) * 100) : 0;

  // Aggregate Aspect Scores
  const avgFood = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.aspectScores.food, 0) / totalCount).toFixed(2)
    : '0';
  const avgService = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.aspectScores.service, 0) / totalCount).toFixed(2)
    : '0';
  const avgAtmosphere = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.aspectScores.atmosphere, 0) / totalCount).toFixed(2)
    : '0';
  const avgCleanliness = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.aspectScores.cleanliness, 0) / totalCount).toFixed(2)
    : '0';
  const avgValue = totalCount > 0 
    ? (branches.reduce((acc, b) => acc + b.aspectScores.value, 0) / totalCount).toFixed(2)
    : '0';

  // Radar Data for 5 Dimensions
  const aspectRadarData = [
    { aspect: ASPECT_COLORS.food.name, score: parseFloat(avgFood), fullMark: 5, color: ASPECT_COLORS.food.hex },
    { aspect: ASPECT_COLORS.service.name, score: parseFloat(avgService), fullMark: 5, color: ASPECT_COLORS.service.hex },
    { aspect: ASPECT_COLORS.cleanliness.name, score: parseFloat(avgCleanliness), fullMark: 5, color: ASPECT_COLORS.cleanliness.hex },
    { aspect: ASPECT_COLORS.atmosphere.name, score: parseFloat(avgAtmosphere), fullMark: 5, color: ASPECT_COLORS.atmosphere.hex },
    { aspect: ASPECT_COLORS.value.name, score: parseFloat(avgValue), fullMark: 5, color: ASPECT_COLORS.value.hex },
  ];

  // EDA 1: Cuisine vs Rating
  const cuisineGroups: { [key: string]: { totalRating: number; count: number; food: number; service: number } } = {};
  branches.forEach(b => {
    if (!cuisineGroups[b.cuisine]) {
      cuisineGroups[b.cuisine] = { totalRating: 0, count: 0, food: 0, service: 0 };
    }
    cuisineGroups[b.cuisine].totalRating += b.overallRating;
    cuisineGroups[b.cuisine].food += b.aspectScores.food;
    cuisineGroups[b.cuisine].service += b.aspectScores.service;
    cuisineGroups[b.cuisine].count += 1;
  });

  const cuisineChartData = Object.keys(cuisineGroups).map(cuisine => {
    const item = cuisineGroups[cuisine];
    return {
      cuisine,
      avgRating: parseFloat((item.totalRating / item.count).toFixed(2)),
      avgFood: parseFloat((item.food / item.count).toFixed(2)),
      avgService: parseFloat((item.service / item.count).toFixed(2)),
      count: item.count,
      color: CUISINE_COLORS[cuisine]?.hex || '#10b981'
    };
  }).sort((a, b) => b.avgRating - a.avgRating);

  // EDA 2: Price Range vs Rating
  const priceRangeMap: { [key: string]: { totalRating: number; count: number; avgAtmosphere: number; avgValue: number; color: string } } = {
    'ประหยัด': { totalRating: 0, count: 0, avgAtmosphere: 0, avgValue: 0, color: '#10b981' },
    'ปานกลาง': { totalRating: 0, count: 0, avgAtmosphere: 0, avgValue: 0, color: '#3b82f6' },
    'สูง': { totalRating: 0, count: 0, avgAtmosphere: 0, avgValue: 0, color: '#f59e0b' },
    'พรีเมียม': { totalRating: 0, count: 0, avgAtmosphere: 0, avgValue: 0, color: '#8b5cf6' },
  };

  branches.forEach(b => {
    const key = b.priceRange in priceRangeMap ? b.priceRange : (
      b.priceRange.includes('ประหยัด') || b.priceRange.includes('ต่ำกว่า 150') ? 'ประหยัด' :
      b.priceRange.includes('สูง') ? 'สูง' :
      b.priceRange.includes('พรีเมียม') || b.priceRange.includes('1,500') ? 'พรีเมียม' : 'ปานกลาง'
    );

    if (priceRangeMap[key]) {
      priceRangeMap[key].totalRating += b.overallRating;
      priceRangeMap[key].avgAtmosphere += b.aspectScores.atmosphere;
      priceRangeMap[key].avgValue += b.aspectScores.value;
      priceRangeMap[key].count += 1;
    }
  });

  const priceChartData = Object.keys(priceRangeMap).map(tier => {
    const data = priceRangeMap[tier];
    return {
      tier,
      avgRating: data.count > 0 ? parseFloat((data.totalRating / data.count).toFixed(2)) : 0,
      avgAtmosphere: data.count > 0 ? parseFloat((data.avgAtmosphere / data.count).toFixed(2)) : 0,
      avgValue: data.count > 0 ? parseFloat((data.avgValue / data.count).toFixed(2)) : 0,
      count: data.count,
      color: data.color
    };
  }).filter(d => d.count > 0);

  // Sample Scatter Data (sample 120 branches to keep chart responsive and clean)
  const scatterSample = branches.slice(0, 150).map(b => ({
    name: b.fullName,
    reviews: b.reviewCount,
    rating: b.overallRating,
    price: b.avgPriceThb,
    cuisine: b.cuisine,
    province: b.province
  }));

  // Top 8 Leaderboard branches
  const topBranches = [...branches]
    .sort((a, b) => b.overallRating - a.overallRating || b.reviewCount - a.reviewCount)
    .slice(0, 8);

  return (
    <div id="overview-dashboard-container" className="space-y-6 pb-12">
      {/* Top Banner Context - Crisp Colorful Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 via-indigo-500 to-purple-500"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>CRISP-DM Analytical Evaluation • Restaurant Review Intelligence</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              ปัจจัยที่ทำให้ร้านอาหารได้รับคะแนนสูง และการวิเคราะห์มิติคะแนนรีวิว
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              สำรวจข้อมูลว่าคะแนนรีวิวของลูกค้านั้นถูกขับเคลื่อนด้วยอะไรมากที่สุด ไม่ว่าจะเป็น <strong className="text-amber-600 font-semibold">รสชาติอาหาร</strong>, <strong className="text-blue-600 font-semibold">การบริการ</strong>, <strong className="text-emerald-600 font-semibold">ความสะอาด</strong> หรือ <strong className="text-purple-600 font-semibold">บรรยากาศ</strong> ใน 1,500 สาขา 77 จังหวัดทั่วไทย
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>แผนที่พิกัด 77 จังหวัด</span>
            </button>
            <button
              onClick={onNavigateToPredictor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>แบบจำลองทำนายคะแนน</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Enhanced with Colorful Accents */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Avg Rating */}
        <div id="kpi-avg-rating" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden hover:border-emerald-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คะแนนเฉลี่ยรวม</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{avgRating}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 5.00</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>High Quality Tier</span>
          </div>
        </div>

        {/* Card 2: Total Branches */}
        <div id="kpi-branches" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden hover:border-indigo-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สาขาในฐานข้อมูล</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalCount.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-semibold">สาขา</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-semibold">
            ครอบคลุม 77 จังหวัดทั่วไทย
          </div>
        </div>

        {/* Card 3: Total Reviews */}
        <div id="kpi-reviews" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden hover:border-blue-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">จำนวนรีวิวสะสม</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <MessageSquareText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalReviews.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-semibold">รีวิว</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-semibold">
            เฉลี่ย {totalCount > 0 ? Math.round(totalReviews / totalCount) : 0} รีวิว/สาขา
          </div>
        </div>

        {/* Card 4: Avg Spend */}
        <div id="kpi-avg-price" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden hover:border-amber-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ราคาเฉลี่ยต่อมื้อ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">฿{avgPrice.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-semibold">บาท</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold">
            ระดับราคาประหยัดถึงพรีเมียม
          </div>
        </div>

        {/* Card 5: High Rating Ratio */}
        <div id="kpi-high-ratio" className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden hover:border-purple-300 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ร้านเรตติ้งสูง (≥ 4.0)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-900 tracking-tight">{highRatingPercentage}%</span>
            <span className="text-xs text-slate-400 font-semibold">({highRatingCount.toLocaleString()}/{totalCount.toLocaleString()})</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-600 font-semibold">
            กลุ่มเป้าหมาย Classification
          </div>
        </div>
      </div>

      {/* Row: 5-Dimensional Aspect Breakdown Radar & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5 Dimension Radar & Breakdown */}
        <div id="aspect-breakdown-card" className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dimensional Decomposition</span>
                <h3 className="text-base font-bold text-slate-900">คะแนนรีวิวแยกตามส่วนของร้าน (5 มิติ)</h3>
                <p className="text-xs text-slate-500">เจาะลึกว่าคะแนนร้านอาหารมาจากส่วนไหนเป็นสำคัญ</p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={aspectRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="aspect" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="คะแนนเฉลี่ย" dataKey="score" stroke="#059669" fill="#10b981" fillOpacity={0.35} />
                  <Tooltip 
                    formatter={(value: any) => [`${value} / 5.00 คะแนน`, 'คะแนนเฉลี่ย']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension Metric Bars with Distinct Harmonious Colors */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              {/* Food */}
              <div className={`p-2 rounded-lg ${ASPECT_COLORS.food.bg}/50 border ${ASPECT_COLORS.food.border}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.food.bar}`}></span>
                    <span>🍛 {ASPECT_COLORS.food.name}</span>
                  </span>
                  <span className={`font-extrabold ${ASPECT_COLORS.food.text}`}>{avgFood} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                  <div className={`${ASPECT_COLORS.food.bar} h-2 rounded-full transition-all`} style={{ width: `${(parseFloat(avgFood) / 5) * 100}%` }}></div>
                </div>
              </div>

              {/* Service */}
              <div className={`p-2 rounded-lg ${ASPECT_COLORS.service.bg}/50 border ${ASPECT_COLORS.service.border}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.service.bar}`}></span>
                    <span>🛎️ {ASPECT_COLORS.service.name}</span>
                  </span>
                  <span className={`font-extrabold ${ASPECT_COLORS.service.text}`}>{avgService} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                  <div className={`${ASPECT_COLORS.service.bar} h-2 rounded-full transition-all`} style={{ width: `${(parseFloat(avgService) / 5) * 100}%` }}></div>
                </div>
              </div>

              {/* Cleanliness */}
              <div className={`p-2 rounded-lg ${ASPECT_COLORS.cleanliness.bg}/50 border ${ASPECT_COLORS.cleanliness.border}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.cleanliness.bar}`}></span>
                    <span>✨ {ASPECT_COLORS.cleanliness.name}</span>
                  </span>
                  <span className={`font-extrabold ${ASPECT_COLORS.cleanliness.text}`}>{avgCleanliness} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                  <div className={`${ASPECT_COLORS.cleanliness.bar} h-2 rounded-full transition-all`} style={{ width: `${(parseFloat(avgCleanliness) / 5) * 100}%` }}></div>
                </div>
              </div>

              {/* Atmosphere */}
              <div className={`p-2 rounded-lg ${ASPECT_COLORS.atmosphere.bg}/50 border ${ASPECT_COLORS.atmosphere.border}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.atmosphere.bar}`}></span>
                    <span>🌿 {ASPECT_COLORS.atmosphere.name}</span>
                  </span>
                  <span className={`font-extrabold ${ASPECT_COLORS.atmosphere.text}`}>{avgAtmosphere} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
                  <div className={`${ASPECT_COLORS.atmosphere.bar} h-2 rounded-full transition-all`} style={{ width: `${(parseFloat(avgAtmosphere) / 5) * 100}%` }}></div>
                </div>
              </div>

              {/* Value */}
              <div className={`p-2 rounded-lg ${ASPECT_COLORS.value.bg}/50 border ${ASPECT_COLORS.value.border}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.value.bar}`}></span>
                    <span>🏷️ {ASPECT_COLORS.value.name}</span>
                  </span>
                  <span className={`font-extrabold ${ASPECT_COLORS.value.text}`}>{avgValue} / 5.0</span>
                </div>
                <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
                  <div className={`${ASPECT_COLORS.value.bar} h-2 rounded-full transition-all`} style={{ width: `${(parseFloat(avgValue) / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Feature Importance (ปัจจัยสำคัญที่มีผลต่อคะแนน) */}
        <div id="feature-importance-card" className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Machine Learning Feature Weights</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  ปัจจัยที่มีผลต่อคะแนนรีวิวร้านอาหารมากที่สุด (Top Factors)
                </h3>
                <p className="text-xs text-slate-500">
                  วิเคราะห์ด้วย Random Forest Gini Importance & Pearson Correlation จากฐานข้อมูล 1,500 สาขา
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gini Importance
              </span>
            </div>

            <div className="space-y-4 my-4">
              {FEATURE_IMPORTANCES.map((item, idx) => {
                const colorConfig = idx === 0 
                  ? { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' }
                  : idx === 1 
                  ? { bar: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }
                  : idx === 2 
                  ? { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' }
                  : { bar: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' };

                return (
                  <div key={item.factor} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center ${colorConfig.badge}`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{item.factor}</span>
                      </div>
                      <span className={`font-black text-sm ${colorConfig.text}`}>{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all ${colorConfig.bar}`}
                        style={{ width: `${item.percentage * 2.3}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 text-xs border border-slate-800 flex items-start gap-3 mt-2 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300">ข้อค้นพบสำคัญ (Data Insights):</strong> &quot;รสชาติและคุณภาพอาหาร&quot; ครองสัดส่วนอิทธิพลสูงสุด 40% ขณะที่ &quot;การบริการ&quot; (25%) เป็นตัวตัดสินตัดเกรดสำคัญ หากคะแนนบริการหลุดต่ำกว่า 3.8 แม้อาหารจะอร่อย ร้านก็มีโอกาสสูงที่จะถูกจัดอยู่ในกลุ่ม &quot;คะแนนไม่สูง (&lt; 4.0)&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Row: EDA Charts (Cuisine & Price vs Rating) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EDA 1: Cuisine vs Rating */}
        <div id="cuisine-eda-card" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Segmentation Analysis</span>
            <h3 className="text-base font-bold text-slate-900">วิเคราะห์คะแนนเฉลี่ยแยกตามประเภทอาหาร (10 หมวดหมู่)</h3>
            <p className="text-xs text-slate-500">เปรียบเทียบคะแนนรวมและคะแนนรสชาติในแต่ละประเภทอาหาร</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cuisineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="cuisine" 
                  tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis domain={[3.0, 5.0]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} คะแนน`, '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avgRating" name="คะแนนรวม" radius={[4, 4, 0, 0]}>
                  {cuisineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="avgFood" name="รสชาติอาหาร" fill={ASPECT_COLORS.food.hex} radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center gap-2">
            <span className="text-base">💡</span>
            <span><strong className="text-slate-900">Insight:</strong> ร้านอาหารอิตาเลียน ญี่ปุ่น และฟิวชัน มีคะแนนเฉลี่ยรสชาติและภาพรวมสูง ขณะที่คาเฟ่และเบเกอรีเน้นคะแนนบรรยากาศสูงเป็นพิเศษ</span>
          </div>
        </div>

        {/* EDA 2: Price Range vs Rating */}
        <div id="price-eda-card" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Price Level Correlation</span>
            <h3 className="text-base font-bold text-slate-900">วิเคราะห์ระดับราคากับคะแนน (Price Range vs Rating)</h3>
            <p className="text-xs text-slate-500">ร้านราคาแพงกว่าได้คะแนนสูงกว่าจริงหรือไม่? แยกตาม 4 ระดับราคา</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="tier" 
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} 
                />
                <YAxis domain={[3.0, 5.0]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} คะแนน`, '']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avgRating" name="คะแนนรวม" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAtmosphere" name="บรรยากาศ" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgValue" name="ความคุ้มค่าราคา" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center gap-2">
            <span className="text-base">💡</span>
            <span><strong className="text-slate-900">Insight:</strong> ร้านระดับพรีเมียมและราคาสูงได้คะแนนบรรยากาศนำโด่ง (4.7+) แต่ร้านระดับประหยัดได้คะแนน &quot;ความคุ้มค่า&quot; สูงที่สุด</span>
          </div>
        </div>
      </div>

      {/* Top Rated Restaurants Leaderboard Table with Colorful Cuisine Tags */}
      <div id="top-branches-leaderboard" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Top Rated Highlights</span>
            <h3 className="text-base font-bold text-slate-900">ทำเนียบร้านอาหารคะแนนรีวิวสูงสุด (Top Rated Leaderboard)</h3>
            <p className="text-xs text-slate-500">เลือกดูสาขาที่ได้รับคะแนนรีวิวโดดเด่น พร้อมคะแนนแยก 5 มิติ</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            แสดง 8 สาขาหัวกะทิ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80">
                <th className="py-2.5 px-3">อันดับ / ชื่อร้าน</th>
                <th className="py-2.5 px-3">ประเภทอาหาร</th>
                <th className="py-2.5 px-3">จังหวัด</th>
                <th className="py-2.5 px-3 text-center">คะแนนรวม</th>
                <th className="py-2.5 px-3">รสชาติ</th>
                <th className="py-2.5 px-3">บริการ</th>
                <th className="py-2.5 px-3">ความสะอาด</th>
                <th className="py-2.5 px-3">บรรยากาศ</th>
                <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topBranches.map((branch, idx) => {
                const colorConfig = CUISINE_COLORS[branch.cuisine] || {
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                  dot: 'bg-slate-400'
                };

                return (
                  <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200' :
                          idx === 1 ? 'bg-slate-300 text-slate-900' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{branch.fullName}</div>
                          <div className="text-[10px] text-slate-400">{branch.priceRange} • {branch.reviewCount} รีวิว</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colorConfig.dot}`}></span>
                        <span>{branch.cuisine}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{branch.province}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md border border-emerald-200 text-xs">
                        <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                        <span>{branch.overallRating.toFixed(1)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-700">
                      {branch.aspectScores.food.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-700">
                      {branch.aspectScores.service.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">
                      {branch.aspectScores.cleanliness.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-purple-700">
                      {branch.aspectScores.atmosphere.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectBranchForCompare(branch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>เปรียบเทียบ</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
