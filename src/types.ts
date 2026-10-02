export type CuisineType = 
  | 'อาหารไทย'
  | 'อาหารญี่ปุ่น'
  | 'อาหารอิตาเลียน'
  | 'อาหารอีสาน'
  | 'อาหารนานาชาติ'
  | 'อาหารทะเล'
  | 'อาหารฟิวชัน'
  | 'คาเฟ่/เบเกอรี'
  | 'อาหารเกาหลี'
  | 'อาหารจีน'
  | 'ชาบู / สุกี้';

export type PriceRangeType = 'ประหยัด' | 'ปานกลาง' | 'สูง' | 'พรีเมียม' | '฿ (ต่ำกว่า 150)' | '฿฿ (150 - 500)' | '฿฿฿ (500 - 1,500)' | '฿฿฿฿ (1,500+)';

export interface AspectScores {
  food: number;        // คุณภาพอาหารและรสชาติ
  service: number;     // การบริการ
  atmosphere: number;  // บรรยากาศภายในร้าน
  cleanliness: number; // ความสะอาด
  value: number;       // ความคุ้มค่าราคา
}

export interface ReviewItem {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  aspectScores: AspectScores;
  highlightAspect: 'food' | 'service' | 'atmosphere' | 'cleanliness' | 'value';
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentLabel: string;
}

export interface RestaurantBranch {
  id: string;
  chainId: string;
  chainName: string;
  branchName: string;
  fullName: string;
  province: string;
  region: string;
  cuisine: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  priceRange: string;
  priceLevel: number; // 1 to 4
  avgPriceThb: number;
  overallRating: number;
  reviewCount: number;
  ratingCategory?: 'สูง' | 'ไม่สูง';
  aspectScores: AspectScores;
  hasDelivery: boolean;
  hasOnlineBooking: boolean;
  hasParking: boolean;
  openingHours: string;
  image: string;
  description: string;
  reviews: ReviewItem[];
}

export interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedCuisine: string;
  selectedProvince: string;
  selectedDistrict: string;
  minRating: number;
  ratingFilter: string; // 'all' | '4.5+' | '4.0+' | '3.5+' | 'under_4.0'
  selectedPriceRange: string;
  selectedChain: string;
}

export interface FactorImportance {
  factor: string;
  factorEn: string;
  weight: number;
  percentage: number;
  description: string;
}

export interface ConfusionMatrixData {
  actualHighPredictedHigh: number;
  actualHighPredictedLow: number;
  actualLowPredictedHigh: number;
  actualLowPredictedLow: number;
  tp?: number;
  fp?: number;
  fn?: number;
  tn?: number;
}
