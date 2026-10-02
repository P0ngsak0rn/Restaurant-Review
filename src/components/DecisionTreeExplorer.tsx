import React, { useState, useMemo, useRef } from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Edit3, 
  Sliders, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Zap, 
  Layers, 
  ChefHat, 
  HeartHandshake, 
  Flame, 
  Award, 
  Car, 
  CalendarCheck, 
  Truck, 
  BadgePercent, 
  MessageSquare, 
  MapPin, 
  Utensils, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  List, 
  Network, 
  Check, 
  X, 
  ArrowDown, 
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  MousePointer
} from 'lucide-react';
import { RestaurantBranch } from '../types';
import { RESTAURANT_BRANCHES, REGION_LIST, CUISINE_LIST } from '../data/restaurantData';

export type DecisionFeature = 
  | 'food'
  | 'service'
  | 'cleanliness'
  | 'atmosphere'
  | 'value'
  | 'hasParking'
  | 'hasOnlineBooking'
  | 'hasDelivery'
  | 'priceLevel'
  | 'reviewCount'
  | 'region'
  | 'cuisine';

export type DecisionOperator = '>=' | '<=' | '==' | '!=';

export interface DecisionNode {
  id: string;
  type: 'decision';
  feature: DecisionFeature;
  operator: DecisionOperator;
  threshold: number | string | boolean;
  left: TreeNode;  // False / No branch
  right: TreeNode; // True / Yes branch
  collapsed?: boolean;
}

export interface LeafNode {
  id: string;
  type: 'leaf';
  label: string;
  ratingGrade: 'high' | 'marginal' | 'low';
  predictedScoreRange: string;
  recommendation: string;
}

export type TreeNode = DecisionNode | LeafNode;

export interface SimulatorInputs {
  food: number;
  service: number;
  cleanliness: number;
  atmosphere: number;
  value: number;
  hasParking: boolean;
  hasOnlineBooking: boolean;
  hasDelivery: boolean;
  priceLevel: number;
  reviewCount: number;
  region: string;
  cuisine: string;
}

// Feature Metadata Definitions
export const FEATURE_DEFINITIONS: Record<DecisionFeature, {
  id: DecisionFeature;
  name: string;
  shortName: string;
  category: 'core' | 'service' | 'meta';
  type: 'numeric' | 'boolean' | 'categorical';
  min?: number;
  max?: number;
  step?: number;
  defaultThreshold: number | boolean | string;
  unit?: string;
  iconName: string;
  description: string;
}> = {
  food: {
    id: 'food',
    name: 'รสชาติและคุณภาพอาหาร (Food Quality)',
    shortName: 'รสชาติอาหาร',
    category: 'core',
    type: 'numeric',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultThreshold: 4.1,
    unit: 'ดาว',
    iconName: 'ChefHat',
    description: 'ความสด สะอาด รสชาติ ความคุ้มค่าทางโภชนาการ (น้ำหนัก 40%)'
  },
  service: {
    id: 'service',
    name: 'คุณภาพการบริการ (Service Quality)',
    shortName: 'การบริการ',
    category: 'core',
    type: 'numeric',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultThreshold: 3.9,
    unit: 'ดาว',
    iconName: 'HeartHandshake',
    description: 'ความรวดเร็ว สุภาพ เอาใจใส่ของพนักงาน (น้ำหนัก 25%)'
  },
  cleanliness: {
    id: 'cleanliness',
    name: 'ความสะอาดและสุขอนามัย (Cleanliness)',
    shortName: 'ความสะอาด',
    category: 'core',
    type: 'numeric',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultThreshold: 4.0,
    unit: 'ดาว',
    iconName: 'Sparkles',
    description: 'โต๊ะ ภาชนะ ห้องน้ำ และพื้นที่ปรุงอาหาร (น้ำหนัก 15%)'
  },
  atmosphere: {
    id: 'atmosphere',
    name: 'บรรยากาศและการตกแต่ง (Atmosphere)',
    shortName: 'บรรยากาศ',
    category: 'core',
    type: 'numeric',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultThreshold: 3.9,
    unit: 'ดาว',
    iconName: 'Flame',
    description: 'แสงสว่าง ดนตรี การถ่ายรูป แอร์ (น้ำหนัก 10%)'
  },
  value: {
    id: 'value',
    name: 'ความคุ้มค่าเทียบราคา (Value for Money)',
    shortName: 'ความคุ้มค่า',
    category: 'core',
    type: 'numeric',
    min: 1.0,
    max: 5.0,
    step: 0.1,
    defaultThreshold: 3.9,
    unit: 'ดาว',
    iconName: 'Award',
    description: 'ปริมาณอาหารและคุณภาพต่อราคาที่จ่าย (น้ำหนัก 10%)'
  },
  hasParking: {
    id: 'hasParking',
    name: 'มีที่จอดรถสะดวก (Has Parking)',
    shortName: 'ที่จอดรถ',
    category: 'service',
    type: 'boolean',
    defaultThreshold: true,
    iconName: 'Car',
    description: 'มีที่จอดรถเฉพาะของร้านหรือในห้างที่สะดวกสบาย'
  },
  hasOnlineBooking: {
    id: 'hasOnlineBooking',
    name: 'รับจองโต๊ะล่วงหน้า (Online Booking)',
    shortName: 'จองโต๊ะ',
    category: 'service',
    type: 'boolean',
    defaultThreshold: true,
    iconName: 'CalendarCheck',
    description: 'มีระบบจองคิวหรือจองโต๊ะผ่านออนไลน์'
  },
  hasDelivery: {
    id: 'hasDelivery',
    name: 'มีบริการส่งเดลิเวอรี (Delivery Service)',
    shortName: 'เดลิเวอรี',
    category: 'service',
    type: 'boolean',
    defaultThreshold: true,
    iconName: 'Truck',
    description: 'เชื่อมต่อแพลตฟอร์มสั่งอาหารส่งถึงบ้าน'
  },
  priceLevel: {
    id: 'priceLevel',
    name: 'ระดับราคาเฉลี่ยต่อคน (Price Level)',
    shortName: 'ระดับราคา',
    category: 'service',
    type: 'numeric',
    min: 1,
    max: 4,
    step: 1,
    defaultThreshold: 2,
    unit: 'ระดับ (1-4)',
    iconName: 'BadgePercent',
    description: '1=ต่ำกว่า 150฿, 2=150-500฿, 3=500-1500฿, 4=1500฿+'
  },
  reviewCount: {
    id: 'reviewCount',
    name: 'จำนวนรีวิวสะสมของร้าน (Review Count)',
    shortName: 'จำนวนรีวิว',
    category: 'meta',
    type: 'numeric',
    min: 20,
    max: 300,
    step: 10,
    defaultThreshold: 100,
    unit: 'รีวิว',
    iconName: 'MessageSquare',
    description: 'ปริมาณเสียงตอบรับจากลูกค้าในระบบ'
  },
  region: {
    id: 'region',
    name: 'ภูมิภาคที่ตั้ง (Region)',
    shortName: 'ภูมิภาค',
    category: 'meta',
    type: 'categorical',
    defaultThreshold: 'ภาคกลาง',
    iconName: 'MapPin',
    description: 'ทำเลที่ตั้งสาขาใน 6 ภูมิภาคทั่วไทย'
  },
  cuisine: {
    id: 'cuisine',
    name: 'ประเภทอาหาร (Cuisine Type)',
    shortName: 'ประเภทอาหาร',
    category: 'meta',
    type: 'categorical',
    defaultThreshold: 'อาหารไทย',
    iconName: 'Utensils',
    description: 'ประเภทหมวดหมู่อาหารหลักของร้าน'
  }
};

// PRESET 1: Deep 5-Level Multi-Aspect Decision Tree
export const ULTRA_DEEP_TREE_PRESET: TreeNode = {
  id: 'node-root',
  type: 'decision',
  feature: 'food',
  operator: '>=',
  threshold: 4.1,
  left: {
    id: 'node-l1-left',
    type: 'decision',
    feature: 'service',
    operator: '>=',
    threshold: 4.2,
    left: {
      id: 'node-l2-l-l',
      type: 'decision',
      feature: 'priceLevel',
      operator: '<=',
      threshold: 2,
      left: {
        id: 'node-l3-crit',
        type: 'leaf',
        label: '🚫 CRITICAL ATTENTION (< 3.6)',
        ratingGrade: 'low',
        predictedScoreRange: '3.1 - 3.5 ดาว',
        recommendation: 'รสชาติไม่ผ่าน ราคาแพง บริการไม่ทัน ต้องปรับปรุงสูตรอาหารด่วน'
      },
      right: {
        id: 'node-l3-budget-ord',
        type: 'leaf',
        label: '🚫 BUDGET ORDINARY (3.5 - 3.8)',
        ratingGrade: 'low',
        predictedScoreRange: '3.4 - 3.7 ดาว',
        recommendation: 'ร้านราคาประหยัดแต่อาหารยังไม่ถูกปาก ดึงคะแนนขึ้นยาก'
      }
    },
    right: {
      id: 'node-l2-l-r',
      type: 'decision',
      feature: 'atmosphere',
      operator: '>=',
      threshold: 4.1,
      left: {
        id: 'node-l3-l-r-l',
        type: 'leaf',
        label: '🚫 BELOW AVERAGE (3.6 - 3.8)',
        ratingGrade: 'low',
        predictedScoreRange: '3.6 - 3.8 ดาว',
        recommendation: 'บริการดีแต่รสชาติอาหารและบรรยากาศยังไม่ดึงดูดพอ'
      },
      right: {
        id: 'node-l3-vibe-rescue',
        type: 'decision',
        feature: 'hasParking',
        operator: '==',
        threshold: true,
        left: {
          id: 'leaf-vibe-no-park',
          type: 'leaf',
          label: '⚠️ MARGINAL SERVICE RESCUE (3.8 - 4.0)',
          ratingGrade: 'marginal',
          predictedScoreRange: '3.8 - 3.9 ดาว',
          recommendation: 'บริการและบรรยากาศช่วยพยุงคะแนน แต่ไม่มีที่จอดรถ'
        },
        right: {
          id: 'leaf-vibe-park',
          type: 'leaf',
          label: '⭐ SERVICE-DRIVEN SATISFACTION (4.0 - 4.1)',
          ratingGrade: 'high',
          predictedScoreRange: '4.0 - 4.1 ดาว',
          recommendation: 'ความประทับใจจากการบริการและการต้อนรับช่วยพาร้านผ่านเกณฑ์ 4.0'
        }
      }
    }
  },
  right: {
    id: 'node-l1-right',
    type: 'decision',
    feature: 'service',
    operator: '>=',
    threshold: 3.9,
    left: {
      id: 'node-l2-r-l',
      type: 'decision',
      feature: 'value',
      operator: '>=',
      threshold: 4.1,
      left: {
        id: 'leaf-r-l-l',
        type: 'leaf',
        label: '⚠️ MARGINAL SERVICE BOTTLENECK (3.7 - 3.9)',
        ratingGrade: 'marginal',
        predictedScoreRange: '3.7 - 3.9 ดาว',
        recommendation: 'อาหารอร่อยแต่บริการช้าและราคาไม่คุ้มค่า ลูกค้าบ่นในรีวิว'
      },
      right: {
        id: 'node-l3-taste-hero',
        type: 'decision',
        feature: 'cleanliness',
        operator: '>=',
        threshold: 3.9,
        left: {
          id: 'leaf-taste-dirty',
          type: 'leaf',
          label: '⚠️ MARGINAL TASTE HERO (3.8 - 4.0)',
          ratingGrade: 'marginal',
          predictedScoreRange: '3.8 - 3.9 ดาว',
          recommendation: 'รสเด็ดคุ้มราคาแต่สุขอนามัยยังดร็อป ฉุดคะแนนให้อยู่ช่วงก้ำกึ่ง'
        },
        right: {
          id: 'leaf-taste-clean',
          type: 'leaf',
          label: '⭐ VALUE & TASTE POPULAR (4.0 - 4.2)',
          ratingGrade: 'high',
          predictedScoreRange: '4.0 - 4.2 ดาว',
          recommendation: 'รสชาติยอดเยี่ยมสะอาดคุ้มค่า อภัยให้เรื่องบริการที่อาจรอนานนิดหน่อย'
        }
      }
    },
    right: {
      id: 'node-l2-r-r',
      type: 'decision',
      feature: 'cleanliness',
      operator: '>=',
      threshold: 4.0,
      left: {
        id: 'node-l3-r-r-l',
        type: 'decision',
        feature: 'hasParking',
        operator: '==',
        threshold: true,
        left: {
          id: 'leaf-unclean-nopark',
          type: 'leaf',
          label: '⚠️ MARGINAL AVERAGE (3.8 - 4.0)',
          ratingGrade: 'marginal',
          predictedScoreRange: '3.8 - 3.9 ดาว',
          recommendation: 'รสชาติและการบริการดี แต่ความสะอาดไม่ถึงเกณฑ์มาตรฐาน'
        },
        right: {
          id: 'leaf-unclean-park',
          type: 'leaf',
          label: '⭐ ACCEPTABLE HIGH (4.0 - 4.1)',
          ratingGrade: 'high',
          predictedScoreRange: '4.0 - 4.1 ดาว',
          recommendation: 'มีที่จอดรถและรสชาติดีช่วยผลักดันให้ผ่านเกณฑ์เรตติ้ง 4.0'
        }
      },
      right: {
        id: 'node-l3-r-r-r',
        type: 'decision',
        feature: 'value',
        operator: '>=',
        threshold: 3.9,
        left: {
          id: 'node-l4-luxury',
          type: 'decision',
          feature: 'hasOnlineBooking',
          operator: '==',
          threshold: true,
          left: {
            id: 'leaf-luxury-nobook',
            type: 'leaf',
            label: '⭐ PREMIUM SATISFACTION (4.1 - 4.3)',
            ratingGrade: 'high',
            predictedScoreRange: '4.1 - 4.3 ดาว',
            recommendation: 'คุณภาพยอดเยี่ยมแม้ราคาค่อนข้างสูง ลูกค้าประทับใจคุณภาพ'
          },
          right: {
            id: 'leaf-luxury-book',
            type: 'leaf',
            label: '⭐ PREMIUM LUXURY HIGH (4.2 - 4.5)',
            ratingGrade: 'high',
            predictedScoreRange: '4.2 - 4.4 ดาว',
            recommendation: 'ร้านพรีเมียมจองล่วงหน้าได้ ประสบการณ์ลูกค้าระดับสูง'
          }
        },
        right: {
          id: 'node-l4-champion',
          type: 'decision',
          feature: 'hasParking',
          operator: '==',
          threshold: true,
          left: {
            id: 'leaf-champ-nopark',
            type: 'leaf',
            label: '⭐ ELITE TOP RATED (4.4 - 4.7)',
            ratingGrade: 'high',
            predictedScoreRange: '4.4 - 4.7 ดาว',
            recommendation: 'ยอดเยี่ยมรอบด้านทั้งรสชาติ บริการ สุขอนามัย และความคุ้มค่า'
          },
          right: {
            id: 'leaf-champ-park',
            type: 'leaf',
            label: '🌟 SUPERIOR GRAND CHAMPION (4.6 - 5.0)',
            ratingGrade: 'high',
            predictedScoreRange: '4.6 - 4.9 ดาว',
            recommendation: 'สุดยอดร้านอาหารต้นแบบ ครบเครื่องทุกมิติความพึงพอใจ 100%'
          }
        }
      }
    }
  }
};

// PRESET 2: Balanced 4-Level Tree
export const BALANCED_4_LEVEL_PRESET: TreeNode = {
  id: 'node-root-4',
  type: 'decision',
  feature: 'food',
  operator: '>=',
  threshold: 4.1,
  left: {
    id: 'node-4-l',
    type: 'decision',
    feature: 'service',
    operator: '>=',
    threshold: 4.2,
    left: {
      id: 'leaf-4-l-l',
      type: 'leaf',
      label: '🚫 BELOW 4.0 (< 3.7)',
      ratingGrade: 'low',
      predictedScoreRange: '3.3 - 3.6 ดาว',
      recommendation: 'รสชาติและบริการไม่ถึงเกณฑ์'
    },
    right: {
      id: 'node-4-l-r',
      type: 'decision',
      feature: 'cleanliness',
      operator: '>=',
      threshold: 4.1,
      left: {
        id: 'leaf-4-l-r-l',
        type: 'leaf',
        label: '🚫 BELOW 4.0 (3.6 - 3.8)',
        ratingGrade: 'low',
        predictedScoreRange: '3.6 - 3.8 ดาว',
        recommendation: 'บริการดีแต่รสชาติและสุขอนามัยยังไม่สมบูรณ์'
      },
      right: {
        id: 'leaf-4-l-r-r',
        type: 'leaf',
        label: '⚠️ MARGINAL (3.8 - 4.0)',
        ratingGrade: 'marginal',
        predictedScoreRange: '3.8 - 4.0 ดาว',
        recommendation: 'บริการและสุขอนามัยดีช่วยยกระดับร้าน'
      }
    }
  },
  right: {
    id: 'node-4-r',
    type: 'decision',
    feature: 'service',
    operator: '>=',
    threshold: 3.9,
    left: {
      id: 'node-4-r-l',
      type: 'decision',
      feature: 'value',
      operator: '>=',
      threshold: 4.0,
      left: {
        id: 'leaf-4-r-l-l',
        type: 'leaf',
        label: '⚠️ MARGINAL (3.7 - 3.9)',
        ratingGrade: 'marginal',
        predictedScoreRange: '3.7 - 3.9 ดาว',
        recommendation: 'อาหารอร่อยแต่บริการช้าฉุดคะแนน'
      },
      right: {
        id: 'leaf-4-r-l-r',
        type: 'leaf',
        label: '⭐ HIGH RATING (4.0 - 4.2)',
        ratingGrade: 'high',
        predictedScoreRange: '4.0 - 4.2 ดาว',
        recommendation: 'ความคุ้มค่าและรสชาติอาหารช่วยดึงดูดลูกค้า'
      }
    },
    right: {
      id: 'node-4-r-r',
      type: 'decision',
      feature: 'cleanliness',
      operator: '>=',
      threshold: 4.0,
      left: {
        id: 'leaf-4-r-r-l',
        type: 'leaf',
        label: '⚠️ MARGINAL (3.8 - 4.0)',
        ratingGrade: 'marginal',
        predictedScoreRange: '3.8 - 4.0 ดาว',
        recommendation: 'รสชาติและบริการดี แต่ความสะอาดควรปรับปรุง'
      },
      right: {
        id: 'leaf-4-r-r-r',
        type: 'leaf',
        label: '⭐ HIGH RATING (4.2 - 4.8)',
        ratingGrade: 'high',
        predictedScoreRange: '4.3 - 4.7 ดาว',
        recommendation: 'คะแนนสูงรอบด้านทั้งรสชาติ บริการ และความสะอาด'
      }
    }
  }
};

// PRESET 3: Standard 2-Level Tree (Original Baseline)
export const STANDARD_2_LEVEL_PRESET: TreeNode = {
  id: 'node-root-2',
  type: 'decision',
  feature: 'food',
  operator: '>=',
  threshold: 4.1,
  left: {
    id: 'leaf-2-l',
    type: 'leaf',
    label: '🚫 จัดเป็น BELOW 4.0',
    ratingGrade: 'low',
    predictedScoreRange: '3.4 - 3.8 ดาว',
    recommendation: 'รสชาติอาหารไม่ประทับใจ ปัจจัยอื่นช่วยดันเรตติ้งไม่ทัน'
  },
  right: {
    id: 'node-2-r',
    type: 'decision',
    feature: 'service',
    operator: '>=',
    threshold: 3.9,
    left: {
      id: 'leaf-2-r-l',
      type: 'leaf',
      label: '⚠️ MARGINAL (3.8 - 4.0)',
      ratingGrade: 'marginal',
      predictedScoreRange: '3.8 - 4.0 ดาว',
      recommendation: 'อาหารอร่อยแต่บริการล่าช้าฉุดคะแนน'
    },
    right: {
      id: 'leaf-2-r-r',
      type: 'leaf',
      label: '⭐ HIGH RATING (≥ 4.0)',
      ratingGrade: 'high',
      predictedScoreRange: '4.1 - 4.7 ดาว',
      recommendation: 'สมบูรณ์แบบทั้งรสชาติและการบริการ'
    }
  }
};

interface DecisionTreeExplorerProps {
  simulatorInputs: SimulatorInputs;
  branches?: RestaurantBranch[];
  onApplyPreset?: (inputs: Partial<SimulatorInputs>) => void;
}

export const DecisionTreeExplorer: React.FC<DecisionTreeExplorerProps> = ({
  simulatorInputs,
  branches = RESTAURANT_BRANCHES,
  onApplyPreset
}) => {
  // Tree State
  const [tree, setTree] = useState<TreeNode>(ULTRA_DEEP_TREE_PRESET);
  const [activePreset, setActivePreset] = useState<'ultra-deep' | 'balanced-4' | 'standard-2' | 'custom'>('ultra-deep');
  const [viewMode, setViewMode] = useState<'tree' | 'rules'>('tree');
  // Zoom, Spacing, Pan & Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(85);
  const [branchSpacing, setBranchSpacing] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [mouseWheelMode, setMouseWheelMode] = useState<'zoom' | 'scroll'>('zoom');
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef<number>(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [ruleFilter, setRuleFilter] = useState<'all' | 'high' | 'marginal' | 'low'>('all');

  // Edit Node Modal State
  const [editingNode, setEditingNode] = useState<DecisionNode | null>(null);
  const [editFeature, setEditFeature] = useState<DecisionFeature>('food');
  const [editOperator, setEditOperator] = useState<DecisionOperator>('>=');
  const [editThreshold, setEditThreshold] = useState<number | string | boolean>(4.1);

  // Subtree leaf counter to compute generous, collision-free branch widths
  const getSubtreeLeafCount = (n: TreeNode): number => {
    if (n.type === 'leaf' || n.collapsed) return 1;
    return getSubtreeLeafCount(n.left) + getSubtreeLeafCount(n.right);
  };

  // Fit to screen helper
  const handleFitView = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 48;
    const totalLeaves = getSubtreeLeafCount(tree);
    const baseWidth = branchSpacing === 'compact' ? 440 : branchSpacing === 'normal' ? 480 : 540;
    const treeTotalWidth = Math.max(440, totalLeaves * baseWidth);
    const optimalZoom = Math.min(100, Math.max(30, Math.floor((containerWidth / treeTotalWidth) * 100)));
    setZoomLevel(optimalZoom);
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = Math.max(0, (containerRef.current.scrollWidth - containerRef.current.clientWidth) / 2);
      }
    }, 60);
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, .no-pan')) return;
    setIsPanning(true);
    if (containerRef.current) {
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    containerRef.current.scrollLeft = panStart.scrollLeft - dx;
    containerRef.current.scrollTop = panStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Direct Mouse Wheel Zoom Listener (Non-passive so preventDefault() stops browser scroll)
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== 'tree') return;

    const onNativeWheel = (e: WheelEvent) => {
      // If user enabled wheel zoom (default) OR holds Ctrl/Cmd
      if (mouseWheelMode === 'zoom' || e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const currentZoom = zoomLevelRef.current;
        // Determine zoom increment
        const isSmoothScroll = Math.abs(e.deltaY) < 30;
        const delta = e.deltaY < 0 
          ? (isSmoothScroll ? 4 : 8) 
          : (isSmoothScroll ? -4 : -8);

        const nextZoom = Math.min(200, Math.max(25, currentZoom + delta));
        if (nextZoom === currentZoom) return;

        // Maintain cursor focal point during zoom
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const ratio = nextZoom / currentZoom;
        const targetScrollLeft = (container.scrollLeft + cursorX) * ratio - cursorX;
        const targetScrollTop = (container.scrollTop + cursorY) * ratio - cursorY;

        setZoomLevel(nextZoom);
        zoomLevelRef.current = nextZoom;

        container.scrollLeft = targetScrollLeft;
        container.scrollTop = targetScrollTop;
      }
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, [mouseWheelMode, viewMode]);

  // Double-click to zoom in or reset
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, .no-pan')) return;
    setZoomLevel(prev => (prev >= 130 ? 85 : Math.min(200, prev + 25)));
  };

  // Helper to test if a restaurant branch or simulator input satisfies a condition
  const testCondition = (
    data: SimulatorInputs | RestaurantBranch,
    feature: DecisionFeature,
    operator: DecisionOperator,
    threshold: number | string | boolean
  ): boolean => {
    let val: any;
    if ('aspectScores' in data) {
      // RestaurantBranch object
      if (feature === 'food') val = data.aspectScores.food;
      else if (feature === 'service') val = data.aspectScores.service;
      else if (feature === 'cleanliness') val = data.aspectScores.cleanliness;
      else if (feature === 'atmosphere') val = data.aspectScores.atmosphere;
      else if (feature === 'value') val = data.aspectScores.value;
      else if (feature === 'hasParking') val = data.hasParking;
      else if (feature === 'hasOnlineBooking') val = data.hasOnlineBooking;
      else if (feature === 'hasDelivery') val = data.hasDelivery;
      else if (feature === 'priceLevel') val = data.priceLevel;
      else if (feature === 'reviewCount') val = data.reviewCount;
      else if (feature === 'region') val = data.region;
      else if (feature === 'cuisine') val = data.cuisine;
    } else {
      // SimulatorInputs object
      val = (data as any)[feature];
    }

    if (typeof val === 'boolean') {
      const boolThresh = Boolean(threshold);
      return operator === '==' ? val === boolThresh : val !== boolThresh;
    }

    if (typeof val === 'string') {
      const strThresh = String(threshold);
      return operator === '==' ? val === strThresh : val !== strThresh;
    }

    const numVal = Number(val) || 0;
    const numThresh = Number(threshold) || 0;

    switch (operator) {
      case '>=': return numVal >= numThresh;
      case '<=': return numVal <= numThresh;
      case '==': return Math.abs(numVal - numThresh) < 0.001;
      case '!=': return Math.abs(numVal - numThresh) >= 0.001;
      default: return numVal >= numThresh;
    }
  };

  // Compute active path of node IDs from simulator inputs
  const activePathNodeIds = useMemo(() => {
    const activeIds = new Set<string>();

    const traverse = (node: TreeNode) => {
      activeIds.add(node.id);
      if (node.type === 'decision') {
        const pass = testCondition(simulatorInputs, node.feature, node.operator, node.threshold);
        if (pass) {
          traverse(node.right); // True / Yes branch
        } else {
          traverse(node.left);  // False / No branch
        }
      }
    };

    traverse(tree);
    return activeIds;
  }, [tree, simulatorInputs]);

  // Compute node statistics across all 1,500 restaurant branches
  const nodeStatsMap = useMemo(() => {
    const stats = new Map<string, {
      total: number;
      highCount: number;
      lowCount: number;
      highPercent: number;
      avgRating: number;
    }>();

    const compute = (node: TreeNode, subset: RestaurantBranch[]) => {
      const total = subset.length;
      const highCount = subset.filter(b => b.overallRating >= 4.0).length;
      const lowCount = total - highCount;
      const highPercent = total > 0 ? (highCount / total) * 100 : 0;
      const sumRating = subset.reduce((acc, b) => acc + b.overallRating, 0);
      const avgRating = total > 0 ? sumRating / total : 0;

      stats.set(node.id, {
        total,
        highCount,
        lowCount,
        highPercent,
        avgRating
      });

      if (node.type === 'decision') {
        const leftSubset = subset.filter(b => !testCondition(b, node.feature, node.operator, node.threshold));
        const rightSubset = subset.filter(b => testCondition(b, node.feature, node.operator, node.threshold));
        compute(node.left, leftSubset);
        compute(node.right, rightSubset);
      }
    };

    compute(tree, branches);
    return stats;
  }, [tree, branches]);

  // Calculate tree metrics (depth, total nodes, leaves)
  const treeMetrics = useMemo(() => {
    let maxDepth = 1;
    let decisionCount = 0;
    let leafCount = 0;

    const traverse = (node: TreeNode, depth: number) => {
      if (depth > maxDepth) maxDepth = depth;
      if (node.type === 'decision') {
        decisionCount++;
        traverse(node.left, depth + 1);
        traverse(node.right, depth + 1);
      } else {
        leafCount++;
      }
    };

    traverse(tree, 1);
    return { maxDepth, decisionCount, leafCount, totalNodes: decisionCount + leafCount };
  }, [tree]);

  // Extract all business rules from tree paths
  interface DecisionRule {
    id: string;
    leafId: string;
    path: Array<{
      feature: DecisionFeature;
      featureName: string;
      operator: string;
      threshold: string | number | boolean;
      unit?: string;
      passed: boolean;
    }>;
    leaf: LeafNode;
    stats: {
      total: number;
      highPercent: number;
      avgRating: number;
    };
    isActive: boolean;
  }

  const allRules = useMemo<DecisionRule[]>(() => {
    const rules: DecisionRule[] = [];

    const traverse = (
      node: TreeNode,
      currentPath: DecisionRule['path']
    ) => {
      if (node.type === 'leaf') {
        const stats = nodeStatsMap.get(node.id) || { total: 0, highPercent: 0, avgRating: 0 };
        const isActive = activePathNodeIds.has(node.id);
        rules.push({
          id: `rule-${node.id}`,
          leafId: node.id,
          path: [...currentPath],
          leaf: node,
          stats,
          isActive
        });
      } else {
        const featDef = FEATURE_DEFINITIONS[node.feature];
        // Left child = False / ไม่ผ่านเงื่อนไข
        traverse(node.left, [
          ...currentPath,
          {
            feature: node.feature,
            featureName: featDef.shortName,
            operator: node.operator === '>=' ? '<' : node.operator === '<=' ? '>' : '!=',
            threshold: node.threshold,
            unit: featDef.unit,
            passed: false
          }
        ]);
        // Right child = True / ผ่านเงื่อนไข
        traverse(node.right, [
          ...currentPath,
          {
            feature: node.feature,
            featureName: featDef.shortName,
            operator: node.operator,
            threshold: node.threshold,
            unit: featDef.unit,
            passed: true
          }
        ]);
      }
    };

    traverse(tree, []);
    return rules;
  }, [tree, nodeStatsMap, activePathNodeIds]);

  // Handler to open editor for a decision node
  const handleOpenEdit = (node: DecisionNode) => {
    setEditingNode(node);
    setEditFeature(node.feature);
    setEditOperator(node.operator);
    setEditThreshold(node.threshold);
  };

  // Handler to save changes to a decision node
  const handleSaveEdit = () => {
    if (!editingNode) return;

    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === editingNode.id && node.type === 'decision') {
        return {
          ...node,
          feature: editFeature,
          operator: editOperator,
          threshold: editThreshold
        };
      }
      if (node.type === 'decision') {
        return {
          ...node,
          left: updateRecursive(node.left),
          right: updateRecursive(node.right)
        };
      }
      return node;
    };

    setTree(updateRecursive(tree));
    setActivePreset('custom');
    setEditingNode(null);
  };

  // Handler to add branch (split) to a leaf node
  const handleAddBranchToLeaf = (leafId: string, featureToSplit: DecisionFeature = 'cleanliness') => {
    const featDef = FEATURE_DEFINITIONS[featureToSplit];
    const newDecisionId = `node-split-${Date.now()}`;

    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === leafId && node.type === 'leaf') {
        const leftLeaf: LeafNode = {
          id: `leaf-no-${Date.now()}`,
          type: 'leaf',
          label: '⚠️ MARGINAL / BELOW',
          ratingGrade: 'marginal',
          predictedScoreRange: '3.7 - 3.9 ดาว',
          recommendation: `ไม่ผ่านเกณฑ์ ${featDef.shortName} ต้องปรับปรุง`
        };
        const rightLeaf: LeafNode = {
          id: `leaf-yes-${Date.now()}`,
          type: 'leaf',
          label: '⭐ HIGH RATING (≥ 4.0)',
          ratingGrade: 'high',
          predictedScoreRange: '4.1 - 4.5 ดาว',
          recommendation: `ผ่านเกณฑ์ ${featDef.shortName} เพิ่มโอกาสได้คะแนนสูง`
        };

        const newNode: DecisionNode = {
          id: newDecisionId,
          type: 'decision',
          feature: featureToSplit,
          operator: featDef.type === 'boolean' ? '==' : '>=',
          threshold: featDef.defaultThreshold,
          left: leftLeaf,
          right: rightLeaf,
          collapsed: false
        };
        return newNode;
      }

      if (node.type === 'decision') {
        return {
          ...node,
          left: updateRecursive(node.left),
          right: updateRecursive(node.right)
        };
      }

      return node;
    };

    setTree(updateRecursive(tree));
    setActivePreset('custom');
  };

  // Handler to prune/delete a decision node back to a leaf
  const handlePruneNode = (nodeId: string) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === nodeId && node.type === 'decision') {
        // Replace this decision node with a leaf
        const prunedLeaf: LeafNode = {
          id: `leaf-pruned-${Date.now()}`,
          type: 'leaf',
          label: '⭐/⚠️ ผลรวมประเมินกลุ่ม',
          ratingGrade: 'marginal',
          predictedScoreRange: '3.8 - 4.2 ดาว',
          recommendation: 'กิ่งถูกตัดรวบยอดเป็นผลการประเมินแบบรวม'
        };
        return prunedLeaf;
      }
      if (node.type === 'decision') {
        return {
          ...node,
          left: updateRecursive(node.left),
          right: updateRecursive(node.right)
        };
      }
      return node;
    };

    setTree(updateRecursive(tree));
    setActivePreset('custom');
    setEditingNode(null);
  };

  // Toggle collapse state of a subtree
  const handleToggleCollapse = (nodeId: string) => {
    const updateRecursive = (node: TreeNode): TreeNode => {
      if (node.id === nodeId && node.type === 'decision') {
        return {
          ...node,
          collapsed: !node.collapsed
        };
      }
      if (node.type === 'decision') {
        return {
          ...node,
          left: updateRecursive(node.left),
          right: updateRecursive(node.right)
        };
      }
      return node;
    };

    setTree(updateRecursive(tree));
  };

  // Switch presets
  const handleApplyPresetTree = (presetType: 'ultra-deep' | 'balanced-4' | 'standard-2') => {
    if (presetType === 'ultra-deep') {
      setTree(ULTRA_DEEP_TREE_PRESET);
      setActivePreset('ultra-deep');
    } else if (presetType === 'balanced-4') {
      setTree(BALANCED_4_LEVEL_PRESET);
      setActivePreset('balanced-4');
    } else if (presetType === 'standard-2') {
      setTree(STANDARD_2_LEVEL_PRESET);
      setActivePreset('standard-2');
    }
  };

  // Render dynamic icon
  const renderFeatureIcon = (feature: DecisionFeature, className: string = 'w-4 h-4') => {
    switch (feature) {
      case 'food': return <ChefHat className={className} />;
      case 'service': return <HeartHandshake className={className} />;
      case 'cleanliness': return <Sparkles className={className} />;
      case 'atmosphere': return <Flame className={className} />;
      case 'value': return <Award className={className} />;
      case 'hasParking': return <Car className={className} />;
      case 'hasOnlineBooking': return <CalendarCheck className={className} />;
      case 'hasDelivery': return <Truck className={className} />;
      case 'priceLevel': return <BadgePercent className={className} />;
      case 'reviewCount': return <MessageSquare className={className} />;
      case 'region': return <MapPin className={className} />;
      case 'cuisine': return <Utensils className={className} />;
      default: return <Sliders className={className} />;
    }
  };

  // Render Recursive Visual Node
  const renderVisualNode = (node: TreeNode, depth: number = 1, isRightBranch: boolean | null = null) => {
    const isActive = activePathNodeIds.has(node.id);
    const stats = nodeStatsMap.get(node.id) || { total: 0, highCount: 0, lowCount: 0, highPercent: 0, avgRating: 0 };

    if (node.type === 'leaf') {
      const isHigh = node.ratingGrade === 'high';
      const isLow = node.ratingGrade === 'low';

      return (
        <div key={node.id} className="flex flex-col items-center">
          {/* Leaf Card - Sized for outstanding legibility */}
          <div className={`w-[410px] sm:w-[440px] p-6 rounded-2xl border transition-all relative group shadow-sm ${
            isActive 
              ? isHigh 
                ? 'bg-emerald-50 border-emerald-400 ring-4 ring-emerald-300/70 shadow-xl text-emerald-950 scale-102 z-10' 
                : isLow 
                  ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-300/70 shadow-xl text-rose-950 scale-102 z-10'
                  : 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/70 shadow-xl text-amber-950 scale-102 z-10'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:shadow-md'
          }`}>
            {isActive && (
              <div className="absolute -top-3.5 right-5 bg-slate-900 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Simulator Outcome</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-1 mb-2.5">
              <span className={`text-sm font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg ${
                isHigh ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : isLow ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {node.label}
              </span>
              <span className="text-xs font-extrabold text-slate-500">ชั้นที่ {depth}</span>
            </div>

            {/* Score Range Box */}
            <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">ช่วงคะแนนคาดหมาย:</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 flex items-center gap-2">
                <span>{node.predictedScoreRange}</span>
                <span className="text-amber-500 text-xl">★</span>
              </div>
            </div>

            {/* Recommendation */}
            <p className="text-sm text-slate-700 mt-3.5 leading-relaxed font-semibold">
              {node.recommendation}
            </p>

            {/* Real Data Distribution from 1,500 branches */}
            <div className="mt-4 pt-3.5 border-t border-slate-200 text-xs grid grid-cols-2 gap-2.5 text-slate-700 bg-white/80 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 text-xs block font-bold">ตัวอย่างในชุดข้อมูล:</span>
                <span className="font-black text-base text-slate-900">n = {stats.total.toLocaleString()} สาขา</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block font-bold">เรตติ้งเฉลี่ยจริง:</span>
                <span className="font-black text-base text-amber-600">⭐ {stats.avgRating.toFixed(2)}</span>
              </div>
              <div className="col-span-2 mt-1.5">
                <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-bold">
                  <span>สัดส่วนคะแนนสูง (≥4.0)</span>
                  <span className="font-black text-emerald-700 text-sm">{stats.highPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${stats.highPercent}%` }} 
                  />
                  <div 
                    className="bg-rose-400 h-full transition-all" 
                    style={{ width: `${100 - stats.highPercent}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Action to branch deeper directly from this leaf */}
            <div className="mt-4 pt-2 flex items-center justify-between gap-1">
              <button
                onClick={() => handleAddBranchToLeaf(node.id, 'cleanliness')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs group-hover:border-indigo-400"
                title="คลิกเพื่อแตกแขนงกิ่งสาขาต่อให้ลึกขึ้น"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>+ แตกกิ่งสาขาต่อ (Branch Deeper)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Decision Node
    const featDef = FEATURE_DEFINITIONS[node.feature];
    const currentValue = (simulatorInputs as any)[node.feature];
    const conditionMet = testCondition(simulatorInputs, node.feature, node.operator, node.threshold);

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card - Large, spacious, clear hierarchy */}
        <div className={`w-[420px] sm:w-[450px] p-6 rounded-2xl border transition-all relative shadow-sm ${
          isActive
            ? 'bg-slate-900 border-indigo-500 ring-4 ring-indigo-500/25 text-white shadow-2xl z-10'
            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:shadow-md'
        }`}>
          {/* Depth badge & actions */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <span className={`text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
              isActive ? 'bg-indigo-900/90 text-indigo-200 border border-indigo-700' : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              {renderFeatureIcon(node.feature, 'w-4 h-4')}
              <span>ชั้นที่ {depth} {depth === 1 ? '(Root Node)' : ''}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(node)}
                className={`p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ${
                  isActive ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : ''
                }`}
                title="แก้ไขหัวข้อและเงื่อนไข"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleCollapse(node.id)}
                className={`p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ${
                  isActive ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : ''
                }`}
                title={node.collapsed ? 'ขยายกิ่ง' : 'ยุบกิ่ง'}
              >
                {node.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {depth > 1 && (
                <button
                  onClick={() => handlePruneNode(node.id)}
                  className={`p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ${
                    isActive ? 'hover:bg-rose-950 text-slate-400 hover:text-rose-400' : ''
                  }`}
                  title="ตัดกิ่งนี้ออก (Prune)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Condition text: Extra Large, bold, instant readability */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                isActive ? 'bg-indigo-800/90 text-indigo-100 border border-indigo-600' : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}>
                {featDef.shortName}
              </span>
              <span className={`text-xs font-bold ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                ({featDef.name})
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-baseline gap-2.5">
              <span className={isActive ? 'text-indigo-300' : 'text-indigo-600'}>
                {node.operator}
              </span>
              <span className={isActive ? 'text-amber-300' : 'text-slate-900'}>
                {String(node.threshold)} {featDef.unit || ''}
              </span>
              <span className="text-slate-400 text-xl font-bold">?</span>
            </div>
          </div>

          {/* Current simulator value & evaluation */}
          <div className={`mt-3.5 p-3.5 rounded-xl text-sm flex items-center justify-between gap-2 border ${
            isActive ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border border-slate-200'
          }`}>
            <div>
              <span className={`text-xs block font-bold ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                ค่าจำลองปัจจุบัน:
              </span>
              <span className={`font-black text-base sm:text-lg ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {String(currentValue)} {featDef.unit || ''}
              </span>
            </div>
            <span className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 ${
              conditionMet
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs'
            }`}>
              {conditionMet ? '✓ เงื่อนไขผ่าน' : '✕ ไม่ผ่าน'}
            </span>
          </div>

          {/* Real dataset partitioning stats */}
          <div className={`mt-3.5 text-xs pt-3 border-t ${
            isActive ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
          } flex items-center justify-between font-bold`}>
            <span>ครอบคลุมข้อมูลจริง: <strong>n = {stats.total.toLocaleString()}</strong> สาขา</span>
            <span className="text-emerald-500 font-extrabold text-sm">High: {stats.highPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Collapsed State Toggle */}
        {node.collapsed && (
          <button
            onClick={() => handleToggleCollapse(node.id)}
            className="mt-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-100 flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>กิ่งย่อยถูกย่อไว้ ({getSubtreeLeafCount(node)} กิ่ง) - คลิกเพื่อขยาย</span>
          </button>
        )}

        {/* Subtree Children with High-Contrast Connectors & Wide Collision-Free Layout */}
        {!node.collapsed && (() => {
          const leftLeaves = getSubtreeLeafCount(node.left);
          const rightLeaves = getSubtreeLeafCount(node.right);
          const baseLeafWidth = branchSpacing === 'compact' ? 440 : branchSpacing === 'normal' ? 480 : 540;
          const halfGap = branchSpacing === 'compact' ? 20 : branchSpacing === 'normal' ? 30 : 42;
          const leftMinW = Math.max(baseLeafWidth, leftLeaves * baseLeafWidth);
          const rightMinW = Math.max(baseLeafWidth, rightLeaves * baseLeafWidth);
          const isLeftActive = activePathNodeIds.has(node.left.id);
          const isRightActive = activePathNodeIds.has(node.right.id);

          return (
            <div className="flex flex-col items-center w-full">
              {/* Vertical stem from parent bottom */}
              <div className="w-full flex justify-center">
                <div 
                  className={`h-9 rounded-full transition-all ${
                    isActive 
                      ? 'w-[4px] bg-indigo-600 shadow-md shadow-indigo-500/50' 
                      : 'w-[3px] bg-slate-300'
                  }`} 
                />
              </div>

              {/* Subtree Container with Flex Basis & Generous Gap */}
              <div 
                className="flex items-start justify-center w-full"
                style={{ gap: `${halfGap * 2}px` }}
              >
                {/* Left Branch (False / No) */}
                <div 
                  className="flex flex-col items-center" 
                  style={{ 
                    minWidth: `${leftMinW}px`, 
                    flex: `${leftLeaves} 0 auto` 
                  }}
                >
                  {/* Left Connector Fork */}
                  <div className="w-full relative h-16 select-none mb-1 pointer-events-none">
                    {/* Top horizontal segment: from center (50%) to right edge + halfGap */}
                    <div 
                      className={`absolute top-0 rounded-full transition-all ${
                        isLeftActive 
                          ? 'h-[4px] bg-rose-500 shadow-sm shadow-rose-400' 
                          : 'h-[3px] bg-slate-300'
                      }`}
                      style={{ left: '50%', right: `-${halfGap}px` }}
                    />
                    {/* Vertical drop segment: straight down center into child card */}
                    <div 
                      className={`absolute top-0 left-1/2 -translate-x-1/2 h-full rounded-full transition-all ${
                        isLeftActive 
                          ? 'w-[4px] bg-rose-500 shadow-sm shadow-rose-400' 
                          : 'w-[3px] bg-slate-300'
                      }`}
                    />
                    {/* Badge centered on drop line */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                      <span className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 border shadow-sm whitespace-nowrap transition-all ${
                        isLeftActive
                          ? 'bg-rose-600 text-white border-rose-500 ring-4 ring-rose-200/80 shadow-md scale-105'
                          : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                      }`}>
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>✕ ไม่ผ่านเกณฑ์ (FALSE / NO)</span>
                        {isLeftActive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                      </span>
                    </div>
                    {/* Downward triangle arrowhead pointing to child card */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 z-10">
                      <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${
                        isLeftActive ? 'border-t-rose-600' : 'border-t-slate-400'
                      }`} />
                    </div>
                  </div>

                  {/* Left Child Node */}
                  {renderVisualNode(node.left, depth + 1, false)}
                </div>

                {/* Right Branch (True / Yes) */}
                <div 
                  className="flex flex-col items-center" 
                  style={{ 
                    minWidth: `${rightMinW}px`, 
                    flex: `${rightLeaves} 0 auto` 
                  }}
                >
                  {/* Right Connector Fork */}
                  <div className="w-full relative h-16 select-none mb-1 pointer-events-none">
                    {/* Top horizontal segment: from left edge - halfGap to center (50%) */}
                    <div 
                      className={`absolute top-0 rounded-full transition-all ${
                        isRightActive 
                          ? 'h-[4px] bg-emerald-500 shadow-sm shadow-emerald-400' 
                          : 'h-[3px] bg-slate-300'
                      }`}
                      style={{ left: `-${halfGap}px`, right: '50%' }}
                    />
                    {/* Vertical drop segment: straight down center into child card */}
                    <div 
                      className={`absolute top-0 left-1/2 -translate-x-1/2 h-full rounded-full transition-all ${
                        isRightActive 
                          ? 'w-[4px] bg-emerald-500 shadow-sm shadow-emerald-400' 
                          : 'w-[3px] bg-slate-300'
                      }`}
                    />
                    {/* Badge centered on drop line */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                      <span className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 border shadow-sm whitespace-nowrap transition-all ${
                        isRightActive
                          ? 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-200/80 shadow-md scale-105'
                          : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>✓ ผ่านเกณฑ์ (TRUE / YES)</span>
                        {isRightActive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                      </span>
                    </div>
                    {/* Downward triangle arrowhead pointing to child card */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 z-10">
                      <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${
                        isRightActive ? 'border-t-emerald-600' : 'border-t-slate-400'
                      }`} />
                    </div>
                  </div>

                  {/* Right Child Node */}
                  {renderVisualNode(node.right, depth + 1, true)}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div 
      id="decision-tree-explorer" 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-white p-6 shadow-2xl overflow-hidden flex flex-col space-y-4" 
          : "bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5"
      }
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Machine Learning Decision Tree Architecture</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            แผนผังโครงสร้างการตัดสินใจแบบลึก (Deep Decision Tree Explorer)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            สามารถเลือกหัวข้อคุณลักษณะ (Features) ได้อย่างอิสระ แตกแขนงกิ่งก้านได้ลึกหลายระดับ และเชื่อมโยงกับการจำลองแบบเรียลไทม์
          </p>
        </div>

        {/* Tree Complexity Stats */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">ความลึกสูงสุด</span>
            <span className="text-sm font-black text-indigo-600">{treeMetrics.maxDepth} ชั้น</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">จุดตัดสินใจ</span>
            <span className="text-sm font-black text-slate-800">{treeMetrics.decisionCount} โหนด</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">ผลลัพธ์ (Leaves)</span>
            <span className="text-sm font-black text-emerald-600">{treeMetrics.leafCount} ใบ</span>
          </div>
        </div>
      </div>

      {/* Toolbar: View Switcher, Preset Depth, Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        {/* Presets & Deep Modes */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>ระดับความลึก:</span>
          </span>

          <button
            onClick={() => handleApplyPresetTree('ultra-deep')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreset === 'ultra-deep'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🌲 ลึกพิเศษ 5 ระดับ (Ultra-Deep)</span>
          </button>

          <button
            onClick={() => handleApplyPresetTree('balanced-4')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreset === 'balanced-4'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🌳 4 ระดับ (Comprehensive)</span>
          </button>

          <button
            onClick={() => handleApplyPresetTree('standard-2')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreset === 'standard-2'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🍃 2 ระดับ (Standard)</span>
          </button>

          {activePreset === 'custom' && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>กำหนดเอง (Custom Structure)</span>
            </span>
          )}
        </div>

        {/* View Mode & Visual Layout Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>ผังต้นไม้</span>
            </button>
            <button
              onClick={() => setViewMode('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'rules'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>ตารางกฎ ({allRules.length})</span>
            </button>
          </div>

          {/* Controls specific to Tree View: Spacing, Zoom, Fit & Fullscreen */}
          {viewMode === 'tree' && (
            <>
              {/* Mouse Wheel Mode Selector */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setMouseWheelMode(prev => prev === 'zoom' ? 'scroll' : 'zoom')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                    mouseWheelMode === 'zoom'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={
                    mouseWheelMode === 'zoom'
                      ? 'หมุนลูกกลิ้งเมาส์เพื่อซูมเข้า/ออกโดยตรง (คลิกเพื่อเปลี่ยนเป็นโหมดเลื่อนหน้าจอ)'
                      : 'หมุนลูกกลิ้งเมาส์เพื่อเลื่อนหน้าจอขึ้น-ลง (คลิกเพื่อเปลี่ยนเป็นโหมดซูม)'
                  }
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>{mouseWheelMode === 'zoom' ? 'ซูมด้วยลูกกลิ้งเมาส์: เปิดอยู่' : 'เลื่อนหน้าจอด้วยเมาส์'}</span>
                </button>
              </div>

              {/* Branch Spacing Selector */}
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs text-xs">
                <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap">ระยะห่างกิ่ง:</span>
                <div className="inline-flex rounded-md p-0.5 bg-slate-100">
                  <button
                    onClick={() => setBranchSpacing('compact')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      branchSpacing === 'compact'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ระยะห่างกิ่งแบบกระชับ (440px)"
                  >
                    กระชับ
                  </button>
                  <button
                    onClick={() => setBranchSpacing('normal')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      branchSpacing === 'normal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ระยะห่างกิ่งมาตรฐาน พอดีกับขนาดการ์ดใหม่ (480px)"
                  >
                    มาตรฐาน ✨
                  </button>
                  <button
                    onClick={() => setBranchSpacing('wide')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-all cursor-pointer ${
                      branchSpacing === 'wide'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="ระยะห่างกิ่งกว้างพิเศษ (540px)"
                  >
                    กว้างพิเศษ
                  </button>
                </div>
              </div>

              {/* Zoom Controls & Slider */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(25, prev - 10))}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  title="ย่อขนาด (-10%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Range Slider for Zoom */}
                <input
                  type="range"
                  min="25"
                  max="160"
                  step="5"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-indigo-600 h-1.5 cursor-pointer"
                  title={`ระดับการซูม: ${zoomLevel}%`}
                />

                <span className="text-[11px] font-extrabold text-indigo-700 w-11 text-center select-none">
                  {zoomLevel}%
                </span>

                <button
                  onClick={() => setZoomLevel(prev => Math.min(160, prev + 10))}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  title="ขยายขนาด (+10%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

                <button
                  onClick={handleFitView}
                  className="px-2 py-0.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded cursor-pointer text-[10.5px] font-bold transition-all"
                  title="ปรับระดับซูมให้เห็นภาพรวมทั้งต้นไม้พอดีหน้าจอ"
                >
                  พอดีจอ
                </button>

                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer text-[10px] font-bold transition-colors"
                  title="รีเซ็ตขนาด 100%"
                >
                  100%
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  isFullscreen
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                }`}
                title={isFullscreen ? 'ย่อหน้าต่างกลับสู่ขนาดปกติ' : 'เปิดดูเต็มหน้าจอ (Fullscreen View)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ย่อลง</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">เต็มจอ</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'tree' ? (
        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          {/* Navigation Hint Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>การซูมและควบคุมด้วยเมาส์:</span>
              </span>
              <span className="text-slate-700">
                หมุนลูกกลิ้งเมาส์ (Scroll Wheel) เพื่อ <strong className="text-indigo-900 font-extrabold underline decoration-indigo-300 decoration-2">ซูมเข้า-ออกได้โดยตรงทันที</strong> • คลิกค้างแล้วลาก (Drag to Pan) เพื่อเลื่อนผัง • ดับเบิลคลิกเพื่อขยาย
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block"></span>
                <span>เขียว = ผ่านเกณฑ์ (True)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-rose-700 font-bold">
                <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block"></span>
                <span>แดง = ไม่ผ่านเกณฑ์ (False)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-indigo-800 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping inline-block"></span>
                <span>เส้นทางจำลอง Active</span>
              </span>
            </div>
          </div>

          {/* Interactive Pan & Zoom Tree Stage */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className={`p-4 sm:p-6 bg-slate-50/70 border border-slate-200 rounded-xl overflow-auto select-none transition-colors relative ${
              isPanning ? 'cursor-grabbing' : 'cursor-grab'
            } ${isFullscreen ? 'flex-1 min-h-0' : 'min-h-[580px] max-h-[800px]'}`}
          >
            <div 
              className="flex justify-center p-4 transition-transform duration-100 ease-out origin-top"
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'top center',
                width: 'max-content',
                minWidth: '100%',
                margin: '0 auto'
              }}
            >
              {renderVisualNode(tree, 1)}
            </div>
          </div>
        </div>
      ) : (
        /* Rules Table View */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold uppercase tracking-wider">กรองตามผลลัพธ์:</span>
              <select
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">ทั้งหมด ({allRules.length} กฎ)</option>
                <option value="high">⭐ เรตติ้งสูง (HIGH RATING)</option>
                <option value="marginal">⚠️ ก้ำกึ่ง (MARGINAL)</option>
                <option value="low">🚫 ต่ำกว่าเกณฑ์ (BELOW)</option>
              </select>
            </div>
            <span className="text-slate-500 text-[11px]">
              แสดงกฎการจำแนกประเภทตามเส้นทางการแตกแขนงจาก Root สู่ Leaf
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {allRules
              .filter(r => ruleFilter === 'all' || r.leaf.ratingGrade === ruleFilter)
              .map((rule, idx) => {
                const isHigh = rule.leaf.ratingGrade === 'high';
                const isLow = rule.leaf.ratingGrade === 'low';

                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      rule.isActive
                        ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/20 shadow-md'
                        : 'bg-white border-slate-200 text-slate-800 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          rule.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          กฎข้อที่ {idx + 1}
                        </span>
                        <span className={`text-xs font-bold ${
                          isHigh ? 'text-emerald-500' : isLow ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                          {rule.leaf.label}
                        </span>
                      </div>

                      {rule.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ตรงกับค่าจำลองปัจจุบัน</span>
                        </span>
                      )}
                    </div>

                    {/* Step-by-step condition clauses */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`font-bold ${rule.isActive ? 'text-indigo-300' : 'text-indigo-600'}`}>ถ้า (IF):</span>
                      {rule.path.map((step, sIdx) => (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && (
                            <span className={rule.isActive ? 'text-slate-400 font-bold' : 'text-slate-400 font-bold'}>
                              และ (AND)
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            step.passed
                              ? rule.isActive 
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : rule.isActive
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {step.featureName} {step.operator} {String(step.threshold)} {step.unit || ''}
                          </span>
                        </React.Fragment>
                      ))}
                      <span className={`font-bold ml-1 ${rule.isActive ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        แล้วผลลัพธ์ (THEN):
                      </span>
                      <strong className={rule.isActive ? 'text-amber-300' : 'text-slate-900'}>
                        {rule.leaf.predictedScoreRange}
                      </strong>
                    </div>

                    {/* Dataset stats */}
                    <div className={`mt-2 pt-2 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${
                      rule.isActive ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}>
                      <span>ครอบคลุมกลุ่มตัวอย่าง: <strong>{rule.stats.total.toLocaleString()} สาขา</strong></span>
                      <span>คะแนนเฉลี่ยจริงในกลุ่ม: <strong>⭐ {rule.stats.avgRating.toFixed(2)}</strong></span>
                      <span className="font-bold text-emerald-500">ความแม่นยำเรตติ้งสูง: {rule.stats.highPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Interactive Node Editor Modal */}
      {editingNode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">แก้ไขจุดตัดสินใจ (Edit Decision Split)</h4>
                  <p className="text-xs text-slate-500">เลือกหัวข้อคุณลักษณะและกำหนดเกณฑ์ชี้วัด</p>
                </div>
              </div>
              <button
                onClick={() => setEditingNode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              {/* Feature Topic Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  1. เลือกหัวข้อคุณลักษณะ (Decision Feature):
                </label>
                <select
                  value={editFeature}
                  onChange={(e) => {
                    const newFeat = e.target.value as DecisionFeature;
                    setEditFeature(newFeat);
                    const def = FEATURE_DEFINITIONS[newFeat];
                    setEditThreshold(def.defaultThreshold);
                    setEditOperator(def.type === 'boolean' ? '==' : '>=');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="มิติการประเมิน 5 ด้าน (Core Aspects)">
                    <option value="food">🍛 รสชาติและคุณภาพอาหาร (Food Quality)</option>
                    <option value="service">🛎️ คุณภาพการบริการ (Service Quality)</option>
                    <option value="cleanliness">✨ ความสะอาดและสุขอนามัย (Cleanliness)</option>
                    <option value="atmosphere">🌿 บรรยากาศภายในร้าน (Atmosphere)</option>
                    <option value="value">🏷️ ความคุ้มค่าเทียบราคา (Value for Money)</option>
                  </optgroup>
                  <optgroup label="สิ่งอำนวยความสะดวก & บริการ (Facilities & Service)">
                    <option value="hasParking">🚗 มีที่จอดรถ (Has Parking)</option>
                    <option value="hasOnlineBooking">📅 รับจองโต๊ะล่วงหน้า (Online Booking)</option>
                    <option value="hasDelivery">🛵 บริการจัดส่งเดลิเวอรี (Delivery)</option>
                    <option value="priceLevel">💰 ระดับราคาเฉลี่ยต่อคน (Price Level 1-4)</option>
                  </optgroup>
                  <optgroup label="ข้อมูลจำเพาะร้าน (Meta & Regional)">
                    <option value="reviewCount">💬 จำนวนรีวิวสะสม (Review Count)</option>
                    <option value="region">📍 ภูมิภาคที่ตั้ง (Region)</option>
                    <option value="cuisine">🍜 หมวดหมู่อาหาร (Cuisine Type)</option>
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {FEATURE_DEFINITIONS[editFeature].description}
                </p>
              </div>

              {/* Operator Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  2. เครื่องหมายเปรียบเทียบ (Operator):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { op: '>=' as DecisionOperator, label: '≥ มากกว่าเท่ากับ' },
                    { op: '<=' as DecisionOperator, label: '≤ น้อยกว่าเท่ากับ' },
                    { op: '==' as DecisionOperator, label: '= เท่ากับ / ใช่' },
                    { op: '!=' as DecisionOperator, label: '≠ ไม่เท่ากับ / ไม่ใช่' }
                  ].map(({ op, label }) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setEditOperator(op)}
                      className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                        editOperator === op
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  3. กำหนดค่าตัดเกณฑ์ (Threshold Cutoff):
                </label>
                {FEATURE_DEFINITIONS[editFeature].type === 'numeric' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={FEATURE_DEFINITIONS[editFeature].min || 1.0}
                        max={FEATURE_DEFINITIONS[editFeature].max || 5.0}
                        step={FEATURE_DEFINITIONS[editFeature].step || 0.1}
                        value={Number(editThreshold)}
                        onChange={(e) => setEditThreshold(Number(e.target.value))}
                        className="flex-1 accent-indigo-600 cursor-pointer"
                      />
                      <span className="w-16 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-center font-black text-indigo-700 text-xs">
                        {Number(editThreshold).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      หน่วย: {FEATURE_DEFINITIONS[editFeature].unit || 'คะแนน'}
                    </span>
                  </div>
                ) : FEATURE_DEFINITIONS[editFeature].type === 'boolean' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditThreshold(true)}
                      className={`p-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                        editThreshold === true
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ✓ มี / เปิดให้บริการ (True)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditThreshold(false)}
                      className={`p-2.5 rounded-lg border font-bold transition-all cursor-pointer ${
                        editThreshold === false
                          ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ✕ ไม่มี / ไม่เปิดบริการ (False)
                    </button>
                  </div>
                ) : (
                  <div>
                    <select
                      value={String(editThreshold)}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      {editFeature === 'region' ? (
                        REGION_LIST.filter(r => r !== 'ทุกภาค').map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))
                      ) : (
                        CUISINE_LIST.filter(c => c !== 'ทั้งหมด').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handlePruneNode(editingNode.id)}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ตัดกิ่งนี้ทิ้ง (Prune)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
