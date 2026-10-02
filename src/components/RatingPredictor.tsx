import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  HelpCircle, 
  Award, 
  GitFork, 
  RotateCcw, 
  Zap, 
  Info,
  Check,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  PieChart,
  ShieldCheck,
  SlidersHorizontal,
  Flame,
  ChefHat,
  HeartHandshake,
  Sparkle
} from 'lucide-react';
import { MODEL_EVALUATION, RESTAURANT_BRANCHES, ASPECT_COLORS } from '../data/restaurantData';
import { RestaurantBranch } from '../types';
import { DecisionTreeExplorer, SimulatorInputs } from './DecisionTreeExplorer';

interface RatingPredictorProps {
  branches?: RestaurantBranch[];
}

export const RatingPredictor: React.FC<RatingPredictorProps> = ({ branches = RESTAURANT_BRANCHES }) => {
  // Simulator input parameters (5 Dimensions)
  const [foodQuality, setFoodQuality] = useState<number>(4.4);
  const [serviceQuality, setServiceQuality] = useState<number>(4.2);
  const [cleanliness, setCleanliness] = useState<number>(4.3);
  const [atmosphere, setAtmosphere] = useState<number>(4.0);
  const [valueForMoney, setValueForMoney] = useState<number>(4.1);

  // Categorical features
  const [priceLevel, setPriceLevel] = useState<number>(2); // 1 = budget, 2 = moderate, 3 = high, 4 = premium
  const [hasParking, setHasParking] = useState<boolean>(true);
  const [hasBooking, setHasBooking] = useState<boolean>(true);

  // Preset scenarios
  const handlePreset = (preset: 'champion' | 'foodOnly' | 'serviceFlaw' | 'budgetStar') => {
    if (preset === 'champion') {
      setFoodQuality(4.8);
      setServiceQuality(4.7);
      setCleanliness(4.8);
      setAtmosphere(4.6);
      setValueForMoney(4.5);
      setPriceLevel(3);
      setHasParking(true);
      setHasBooking(true);
    } else if (preset === 'foodOnly') {
      setFoodQuality(4.9);
      setServiceQuality(3.2); // Service drops
      setCleanliness(3.7);
      setAtmosphere(3.4);
      setValueForMoney(3.8);
      setPriceLevel(2);
      setHasParking(false);
      setHasBooking(false);
    } else if (preset === 'serviceFlaw') {
      setFoodQuality(4.3);
      setServiceQuality(3.5);
      setCleanliness(4.0);
      setAtmosphere(4.2);
      setValueForMoney(3.6);
      setPriceLevel(3);
      setHasParking(true);
      setHasBooking(true);
    } else if (preset === 'budgetStar') {
      setFoodQuality(4.4);
      setServiceQuality(4.1);
      setCleanliness(4.2);
      setAtmosphere(3.8);
      setValueForMoney(4.8);
      setPriceLevel(1);
      setHasParking(false);
      setHasBooking(false);
    }
  };

  // Prediction formula based on Feature Importance weights
  // Food: 40%, Service: 25%, Cleanliness: 15%, Atmosphere: 10%, Value: 10%
  const baseScore = 
    (foodQuality * 0.40) +
    (serviceQuality * 0.25) +
    (cleanliness * 0.15) +
    (atmosphere * 0.10) +
    (valueForMoney * 0.10);

  // Modifiers
  let modifier = 0;
  if (hasParking) modifier += 0.05;
  if (hasBooking) modifier += 0.04;
  if (priceLevel === 4) modifier += 0.05;

  const predictedScore = Math.min(5.0, Math.max(1.0, baseScore + modifier));
  const isHighRating = predictedScore >= 4.0;
  const probabilityHigh = Math.min(99, Math.max(5, Math.round(100 / (1 + Math.exp(-((predictedScore - 3.95) * 4))))));

  // Decision benchmarks
  const isFoodHigh = foodQuality >= 4.1;
  const isServiceHigh = serviceQuality >= 3.9;

  return (
    <div id="rating-predictor-view" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 mb-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
              <span>Machine Learning Interactive Simulator</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              แบบจำลองทำนายคะแนนและจำแนกเกรดร้านอาหาร (Rating Predictor)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
              ทดลองปรับระดับคะแนนใน 5 มิติของร้านเพื่อดูผลลัพธ์การทำนายคะแนนเฉลี่ย และดูว่าปัจจัยใดมีผลผลักดันให้ร้านได้คะแนนสูง (&ge; 4.0 ดาว)
            </p>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">กรณีศึกษา:</span>
            <button
              onClick={() => handlePreset('champion')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              ⭐ ร้านดาวเด่น
            </button>
            <button
              onClick={() => handlePreset('foodOnly')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              🍜 อาหารดี-บริการช้า
            </button>
            <button
              onClick={() => handlePreset('budgetStar')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              🏷️ คุ้มค่าประหยัด
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Inputs & Result Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 5-Dimensional Sliders */}
        <div id="simulator-controls-card" className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                ปรับระดับตัวแปร 5 มิติของร้าน (Feature Inputs)
              </h3>
            </div>
            <button
              onClick={() => handlePreset('champion')}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>รีเซ็ต</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Food Slider - Amber */}
            <div className={`p-3 rounded-lg ${ASPECT_COLORS.food.bg} border ${ASPECT_COLORS.food.border}`}>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span className="text-amber-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.food.bar}`}></span>
                  <span>🍛 {ASPECT_COLORS.food.name} (ความสำคัญ 40%):</span>
                </span>
                <span className={`${ASPECT_COLORS.food.text} font-black text-sm`}>{foodQuality.toFixed(1)} / 5.0</span>
              </div>
              <input
                id="slider-food"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={foodQuality}
                onChange={(e) => setFoodQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-amber-100 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>ธรรมดา (1.0)</span>
                <span className="font-bold text-amber-700">จุดตัดสำคัญ (4.1)</span>
                <span>ระดับมาสเตอร์ (5.0)</span>
              </div>
            </div>

            {/* Service Slider - Blue */}
            <div className={`p-3 rounded-lg ${ASPECT_COLORS.service.bg} border ${ASPECT_COLORS.service.border}`}>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span className="text-blue-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.service.bar}`}></span>
                  <span>🛎️ {ASPECT_COLORS.service.name} (ความสำคัญ 25%):</span>
                </span>
                <span className={`${ASPECT_COLORS.service.text} font-black text-sm`}>{serviceQuality.toFixed(1)} / 5.0</span>
              </div>
              <input
                id="slider-service"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={serviceQuality}
                onChange={(e) => setServiceQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>บริการล่าช้า (1.0)</span>
                <span className="font-bold text-blue-700">จุดตัดสำคัญ (3.9)</span>
                <span>บริการประทับใจ (5.0)</span>
              </div>
            </div>

            {/* Cleanliness Slider - Mint Emerald */}
            <div className={`p-3 rounded-lg ${ASPECT_COLORS.cleanliness.bg} border ${ASPECT_COLORS.cleanliness.border}`}>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span className="text-emerald-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.cleanliness.bar}`}></span>
                  <span>✨ {ASPECT_COLORS.cleanliness.name} (ความสำคัญ 15%):</span>
                </span>
                <span className={`${ASPECT_COLORS.cleanliness.text} font-black text-sm`}>{cleanliness.toFixed(1)} / 5.0</span>
              </div>
              <input
                id="slider-cleanliness"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={cleanliness}
                onChange={(e) => setCleanliness(parseFloat(e.target.value))}
                className="w-full h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Atmosphere Slider - Purple */}
            <div className={`p-3 rounded-lg ${ASPECT_COLORS.atmosphere.bg} border ${ASPECT_COLORS.atmosphere.border}`}>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span className="text-purple-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.atmosphere.bar}`}></span>
                  <span>🌿 {ASPECT_COLORS.atmosphere.name} (ความสำคัญ 10%):</span>
                </span>
                <span className={`${ASPECT_COLORS.atmosphere.text} font-black text-sm`}>{atmosphere.toFixed(1)} / 5.0</span>
              </div>
              <input
                id="slider-atmosphere"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={atmosphere}
                onChange={(e) => setAtmosphere(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-100 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Value Slider - Rose */}
            <div className={`p-3 rounded-lg ${ASPECT_COLORS.value.bg} border ${ASPECT_COLORS.value.border}`}>
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span className="text-rose-900 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ASPECT_COLORS.value.bar}`}></span>
                  <span>🏷️ {ASPECT_COLORS.value.name} (ความสำคัญ 10%):</span>
                </span>
                <span className={`${ASPECT_COLORS.value.text} font-black text-sm`}>{valueForMoney.toFixed(1)} / 5.0</span>
              </div>
              <input
                id="slider-value"
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={valueForMoney}
                onChange={(e) => setValueForMoney(parseFloat(e.target.value))}
                className="w-full h-2 bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Price Level & Amenities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">ระดับราคา:</label>
                <select
                  value={priceLevel}
                  onChange={(e) => setPriceLevel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={1}>ประหยัด (ต่ำกว่า 150 บาท)</option>
                  <option value={2}>ปานกลาง (150 - 500 บาท)</option>
                  <option value={3}>สูง (500 - 1,500 บาท)</option>
                  <option value={4}>พรีเมียม (1,500+ บาท)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">ที่จอดรถ:</label>
                <button
                  type="button"
                  onClick={() => setHasParking(!hasParking)}
                  className={`w-full p-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                    hasParking 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {hasParking ? '✓ มีที่จอดรถ' : '✕ ไม่มีที่จอดรถ'}
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">จองโต๊ะออนไลน์:</label>
                <button
                  type="button"
                  onClick={() => setHasBooking(!hasBooking)}
                  className={`w-full p-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                    hasBooking 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {hasBooking ? '✓ เปิดจองออนไลน์' : '✕ Walk-in เท่านั้น'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Prediction Outcome Card */}
        <div id="prediction-outcome-card" className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  Model Prediction Output
                </span>
                <h3 className="text-base font-bold text-slate-900">ผลการทำนายคะแนนรีวิว</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Random Forest ML
              </span>
            </div>

            {/* Score & Badge */}
            <div className="mt-4 p-5 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Predicted Score</span>
              <div className="text-4xl font-black text-slate-900 flex items-center justify-center gap-2">
                <span className="text-amber-400">★</span>
                <span>{predictedScore.toFixed(2)}</span>
                <span className="text-sm font-semibold text-slate-400">/ 5.00</span>
              </div>

              {/* Classification Tag */}
              <div className="pt-1">
                {isHighRating ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>HIGH RATING (&ge; 4.0 ดาว)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>BELOW 4.0 (&lt; 4.0 ดาว)</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 mt-2 font-medium">
                ความน่าจะเป็นที่จะได้ High Rating: <strong className="text-slate-900 font-bold">{probabilityHigh}%</strong>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all ${isHighRating ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                  style={{ width: `${probabilityHigh}%` }}
                ></div>
              </div>
            </div>

            {/* Diagnostic Strategic Advice */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs space-y-1.5 shadow-xs">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">คำแนะนำเชิงกลยุทธ์สำหรับผู้ประกอบการ:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {!isFoodHigh ? (
                  <span className="text-rose-300">
                    ⚠️ อาหารคือตัวตัดสินหลัก (&lt; 4.1)! หากคุณภาพหรือรสชาติอาหารยังไม่ถึงเกณฑ์ ลูกค้าจะไม่ให้เรตติ้งรวมถึง 4.0 ดาวอย่างแน่นอน ควรปรับสูตรและการควบคุมคุณภาพวัตถุดิบเป็นลำดับแรก
                  </span>
                ) : !isServiceHigh ? (
                  <span className="text-amber-300">
                    ⚠️ อาหารดีแล้ว ({foodQuality.toFixed(1)}) แต่การบริการตกต่ำกว่าเกณฑ์ 3.9! จุดนี้คือคอขวดที่ทำให้ร้านเสียคะแนน ให้เพิ่มพนักงานช่วงพีคและพัฒนามาตรฐานการบริการ
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    🎉 ร้านนี้อยู่ในเกณฑ์ &quot;ร้านเรตติ้งสูงระดับมาตรฐานทอง&quot; ทรงตัวอยู่ที่ {predictedScore.toFixed(2)} ดาว พร้อมสร้างความประทับใจและการกลับมาซ้ำของลูกค้าสูง
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visualized Deep Decision Tree Architecture */}
      <DecisionTreeExplorer
        simulatorInputs={{
          food: foodQuality,
          service: serviceQuality,
          cleanliness,
          atmosphere,
          value: valueForMoney,
          hasParking,
          hasOnlineBooking: hasBooking,
          hasDelivery: true,
          priceLevel,
          reviewCount: 120,
          region: 'ภาคกลาง',
          cuisine: 'อาหารไทย'
        }}
        branches={branches}
      />

      {/* Model Performance & Evaluation Metrics (CRISP-DM Phase 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Cards (Accuracy, Precision, Recall, F1) */}
        <div id="model-metrics-card" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Validation Results</span>
            <h3 className="text-base font-bold text-slate-900">
              ประสิทธิภาพของแบบจำลอง (Model Performance Metrics)
            </h3>
            <p className="text-xs text-slate-500">ผลการทดสอบด้วย 10-Fold Cross-Validation บนชุดข้อมูล 1,500 สาขา</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-700">{MODEL_EVALUATION.accuracy}%</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">ทำนายถูก 1,317 จาก 1,500 รายการ</span>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Precision</span>
              <span className="text-2xl font-black text-blue-700">{MODEL_EVALUATION.precision}%</span>
              <span className="text-[10px] text-blue-600 block mt-0.5">ร้านที่ทายว่า High เป็น High จริง</span>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Recall</span>
              <span className="text-2xl font-black text-indigo-700">{MODEL_EVALUATION.recall}%</span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">ครอบคลุมร้าน High ได้ครบถ้วน</span>
            </div>

            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">F1-Score</span>
              <span className="text-2xl font-black text-purple-700">{MODEL_EVALUATION.f1Score}%</span>
              <span className="text-[10px] text-purple-600 block mt-0.5">สมดุล Harmonic Mean</span>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div id="confusion-matrix-card" className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Error Analysis</span>
              <h3 className="text-base font-bold text-slate-900">ตารางความถูกต้อง (Confusion Matrix)</h3>
              <p className="text-xs text-slate-500">เปรียบเทียบค่าจริง (Actual) กับค่าที่ทาย (Predicted)</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">True Positive (TP)</span>
                <span className="text-2xl font-black text-emerald-700">{MODEL_EVALUATION.confusionMatrix.tp}</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">ทายว่าได้คะแนนสูง และได้จริง</span>
              </div>

              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 block uppercase">False Positive (FP)</span>
                <span className="text-2xl font-black text-rose-700">{MODEL_EVALUATION.confusionMatrix.fp}</span>
                <span className="text-[11px] text-rose-600 block mt-0.5">ทายว่าสูง แต่ค่าจริงไม่ถึง</span>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block uppercase">False Negative (FN)</span>
                <span className="text-2xl font-black text-amber-700">{MODEL_EVALUATION.confusionMatrix.fn}</span>
                <span className="text-[11px] text-amber-600 block mt-0.5">ทายว่าไม่ถึง แต่ค่าจริงได้สูง</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-700 block uppercase">True Negative (TN)</span>
                <span className="text-2xl font-black text-slate-800">{MODEL_EVALUATION.confusionMatrix.tn}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">ทายว่าไม่ถึง และไม่ถึงจริง</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
