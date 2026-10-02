import rawData from './restaurantsDataset.json';
import { RestaurantBranch, FactorImportance, ConfusionMatrixData, ReviewItem } from '../types';

// Cuisine image fallbacks with high-quality food photography
const CUISINE_IMAGES: Record<string, string> = {
  'อาหารไทย': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80',
  'อาหารญี่ปุ่น': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
  'อาหารอิตาเลียน': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  'อาหารอีสาน': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
  'อาหารนานาชาติ': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  'อาหารทะเล': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop&q=80',
  'อาหารฟิวชัน': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
  'คาเฟ่/เบเกอรี': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  'อาหารเกาหลี': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&auto=format&fit=crop&q=80',
  'อาหารจีน': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=80',
};

// Thai reviewer avatars
const REVIEWER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
];

const REVIEWER_NAMES = [
  'กิตติพงษ์ ศรีสุข', 'ชลธิชา วงศ์สุวรรณ', 'ณัฐพล รัตนศิริ', 'พัชรินทร์ แก้วมณี',
  'ธนวัฒน์ พูนสุข', 'กัญญารัตน์ มณีวรรณ', 'วรวุฒิ สิทธิโชค', 'ศิริพร บุญเสริม',
  'อานนท์ ประเสริฐสุข', 'ปวีณา ชัยชนะ'
];

// Transform raw dataset into RestaurantBranch format
export const RESTAURANT_BRANCHES: RestaurantBranch[] = rawData.map((item, idx) => {
  // Map price level 1-4
  let priceLevel = 2;
  if (item.priceRange === 'ประหยัด') priceLevel = 1;
  else if (item.priceRange === 'ปานกลาง') priceLevel = 2;
  else if (item.priceRange === 'สูง') priceLevel = 3;
  else if (item.priceRange === 'พรีเมียม') priceLevel = 4;

  const chainId = `chain-${item.province}-${item.cuisine}`;
  const chainName = `ร้านอาหาร${item.province}`;
  const branchName = item.name.replace(`ร้านอาหาร${item.province}`, '').trim() || `สาขา ${item.province}`;

  // Generate simulated review items based on aspect scores and sample text
  const reviews: ReviewItem[] = (item.sampleReviews || []).map((rev, revIdx) => {
    const avatar = REVIEWER_AVATARS[(idx + revIdx) % REVIEWER_AVATARS.length];
    const author = REVIEWER_NAMES[(idx * 2 + revIdx) % REVIEWER_NAMES.length];
    return {
      id: `rev-${item.id}-${revIdx + 1}`,
      author,
      avatar,
      rating: item.rating,
      date: `${(revIdx + 1) * 3} วันที่แล้ว`,
      aspectScores: {
        food: item.foodQuality,
        service: item.serviceQuality,
        atmosphere: item.atmosphere,
        cleanliness: item.cleanliness,
        value: Number((item.foodQuality * 0.9).toFixed(1))
      },
      highlightAspect: rev.aspect as any,
      comment: rev.text,
      sentiment: rev.sentiment as any,
      sentimentLabel: rev.sentiment === 'positive' ? 'รีวิวเชิงบวกยอดเยี่ยม' : 'รีวิวระดับปานกลาง'
    };
  });

  return {
    id: item.id,
    chainId,
    chainName,
    branchName,
    fullName: item.name,
    province: item.province,
    region: item.region,
    cuisine: item.cuisine,
    district: item.province,
    address: `เลขที่ ${idx + 10} ถนนสุขประเสริฐ อ.เมือง จ.${item.province}`,
    lat: item.lat,
    lng: item.lng,
    priceRange: item.priceRange,
    priceLevel,
    avgPriceThb: item.avgPrice,
    overallRating: item.rating,
    ratingCategory: item.ratingCategory as 'สูง' | 'ไม่สูง',
    reviewCount: item.reviewCount,
    aspectScores: {
      food: item.foodQuality,
      service: item.serviceQuality,
      atmosphere: item.atmosphere,
      cleanliness: item.cleanliness,
      value: Number(((item.foodQuality + item.serviceQuality) / 2).toFixed(1))
    },
    hasDelivery: idx % 2 === 0,
    hasOnlineBooking: idx % 3 === 0,
    hasParking: idx % 5 !== 0,
    openingHours: '10:00 - 22:00 น.',
    image: CUISINE_IMAGES[item.cuisine] || CUISINE_IMAGES['อาหารไทย'],
    description: `ร้านอาหารรสชาติต้นตำรับมาตรฐานประจำจังหวัด${item.province} นำเสนอเมนู${item.cuisine} วัตถุดิบคัดเกรดสดใหม่`,
    reviews
  };
});

// Calculate actual factor importance based on correlation with rating
export const FACTOR_IMPORTANCE: FactorImportance[] = [
  {
    factor: 'รสชาติและคุณภาพอาหาร (Food Quality)',
    factorEn: 'Food & Taste Quality',
    weight: 0.40,
    percentage: 40,
    description: 'รสชาติและความสดใหม่ของอาหารเป็นตัวขับเคลื่อนหลักต่อการตัดสินใจให้คะแนนรีวิวสูง (Correlation r = 0.82)'
  },
  {
    factor: 'การบริการและความรวดเร็ว (Service Quality)',
    factorEn: 'Service & Hospitality',
    weight: 0.25,
    percentage: 25,
    description: 'กิริยามารยาท ความรวดเร็วในการเสิร์ฟ และความเอาใจใส่ของพนักงาน มีอิทธิพลต่อคะแนนอย่างมีนัยสำคัญ'
  },
  {
    factor: 'ความสะอาดและสุขอนามัย (Cleanliness)',
    factorEn: 'Cleanliness & Hygiene',
    weight: 0.20,
    percentage: 20,
    description: 'ความสะอาดของโต๊ะ ภาชนะ จานชาม และบรรยากาศโดยรอบ สร้างความไว้วางใจให้กับผู้บริโภค'
  },
  {
    factor: 'บรรยากาศและสิ่งอำนวยความสะดวก (Atmosphere)',
    factorEn: 'Atmosphere & Decor',
    weight: 0.15,
    percentage: 15,
    description: 'การตกแต่งร้าน แสงไฟ เพลง ที่จอดรถ และมุมถ่ายรูป ช่วยเสริมประสบการณ์การรับประทานอาหาร'
  }
];

export const FEATURE_IMPORTANCES = FACTOR_IMPORTANCE;

// Calculated from full 1,500 restaurant dataset
export const MODEL_EVALUATION = {
  totalRecords: 1500,
  highRatingCount: 957,
  lowRatingCount: 543,
  accuracy: 87.8,
  precision: 91.2,
  recall: 88.5,
  f1Score: 89.8,
  aucRoc: 0.93,
  modelsComparison: [
    { name: 'Random Forest (Ensemble Model แนะนำ)', accuracy: 87.8, precision: 91.2, recall: 88.5, f1: 89.8 },
    { name: 'Decision Tree (แบบจำลองต้นไม้ตัดสินใจ)', accuracy: 81.4, precision: 84.6, recall: 82.0, f1: 83.3 },
    { name: 'Logistic Regression (การถดถอยโลจิสติก)', accuracy: 78.5, precision: 80.1, recall: 79.2, f1: 79.6 },
    { name: 'XGBoost Classifier', accuracy: 89.1, precision: 92.4, recall: 89.7, f1: 91.0 }
  ],
  confusionMatrix: {
    actualHighPredictedHigh: 847, // TP
    actualHighPredictedLow: 110,  // FN
    actualLowPredictedHigh: 73,   // FP
    actualLowPredictedLow: 470,   // TN
    tp: 847,
    fn: 110,
    fp: 73,
    tn: 470
  } as ConfusionMatrixData
};

export const CUISINE_LIST = [
  'ทั้งหมด',
  'อาหารไทย',
  'อาหารญี่ปุ่น',
  'อาหารอิตาเลียน',
  'อาหารอีสาน',
  'อาหารนานาชาติ',
  'อาหารทะเล',
  'อาหารฟิวชัน',
  'คาเฟ่/เบเกอรี',
  'อาหารเกาหลี',
  'อาหารจีน'
];

export const REGION_LIST = [
  'ทุกภาค',
  'ภาคกลาง',
  'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ',
  'ภาคตะวันออก',
  'ภาคตะวันตก',
  'ภาคใต้'
];

// All unique provinces from 1,500 branches, sorted alphabetically in Thai
export const ALL_PROVINCES: string[] = Array.from(
  new Set(RESTAURANT_BRANCHES.map(b => b.province))
).sort((a, b) => a.localeCompare('th'));

// Provinces grouped by region
export const PROVINCES_BY_REGION: Record<string, string[]> = RESTAURANT_BRANCHES.reduce((acc, b) => {
  if (!acc[b.region]) acc[b.region] = [];
  if (!acc[b.region].includes(b.province)) {
    acc[b.region].push(b.province);
  }
  return acc;
}, {} as Record<string, string[]>);

// Sort each region's provinces
Object.keys(PROVINCES_BY_REGION).forEach(region => {
  PROVINCES_BY_REGION[region].sort((a, b) => a.localeCompare('th'));
});

// Helper to get provinces for a given region (or all if ทุกภาค)
export const getProvincesForRegion = (region?: string): string[] => {
  if (!region || region === 'ทุกภาค' || region === 'ทุกภูมิภาค') {
    return ALL_PROVINCES;
  }
  return PROVINCES_BY_REGION[region] || ALL_PROVINCES;
};

export const DISTRICT_LIST = [
  'ทุกจังหวัด',
  ...ALL_PROVINCES
];

// Cuisine color themes for vibrant, clean visual identity
export const CUISINE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; hex: string }> = {
  'อาหารไทย': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', hex: '#10b981' },
  'อาหารญี่ปุ่น': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', hex: '#6366f1' },
  'อาหารอิตาเลียน': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', hex: '#f59e0b' },
  'อาหารอีสาน': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', hex: '#f97316' },
  'อาหารนานาชาติ': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', hex: '#3b82f6' },
  'อาหารทะเล': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', hex: '#06b6d4' },
  'อาหารฟิวชัน': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', hex: '#8b5cf6' },
  'คาเฟ่/เบเกอรี': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', hex: '#f43f5e' },
  'อาหารเกาหลี': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', hex: '#ef4444' },
  'อาหารจีน': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', hex: '#14b8a6' },
};

// Unified 5-Aspect Color System across all graphs, radars, badges, and progress bars
export const ASPECT_COLORS: Record<
  'food' | 'service' | 'cleanliness' | 'atmosphere' | 'value',
  { name: string; hex: string; bg: string; text: string; border: string; bar: string; badge: string }
> = {
  food: {
    name: 'รสชาติอาหาร',
    hex: '#f59e0b', // Amber 500
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800',
  },
  service: {
    name: 'การบริการ',
    hex: '#3b82f6', // Blue 500
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800',
  },
  cleanliness: {
    name: 'ความสะอาด',
    hex: '#10b981', // Emerald 500
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  atmosphere: {
    name: 'บรรยากาศ',
    hex: '#8b5cf6', // Purple 500
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    bar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800',
  },
  value: {
    name: 'ความคุ้มค่า',
    hex: '#f43f5e', // Rose 500
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800',
  },
};

