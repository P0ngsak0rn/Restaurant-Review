import React, { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Send,
  User,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { RestaurantBranch, ReviewItem, AspectScores } from '../types';
import { CUISINE_COLORS, ASPECT_COLORS } from '../data/restaurantData';

interface ReviewExplorerProps {
  branches: RestaurantBranch[];
  onAddReview: (branchId: string, review: ReviewItem) => void;
}

export const ReviewExplorer: React.FC<ReviewExplorerProps> = ({
  branches,
  onAddReview
}) => {
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string>('ทั้งหมด');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<string>('ทั้งหมด');
  const [selectedAspectFilter, setSelectedAspectFilter] = useState<string>('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(24);
  
  // Modal for adding a new review
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetBranchId, setTargetBranchId] = useState<string>(branches[0]?.id || '');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [newAspectScores, setNewAspectScores] = useState<AspectScores>({
    food: 4.5,
    service: 4.0,
    cleanliness: 4.5,
    atmosphere: 4.5,
    value: 4.0,
  });

  // Extract all reviews across branches with branch context
  const allReviewsWithBranch = branches.flatMap(b => 
    (b.reviews || []).map(r => ({
      ...r,
      branchId: b.id,
      branchName: b.fullName,
      province: b.province,
      chainName: b.chainName,
      cuisine: b.cuisine
    }))
  );

  // Filter reviews
  const filteredReviews = allReviewsWithBranch.filter(r => {
    if (selectedCuisineFilter !== 'ทั้งหมด' && r.cuisine !== selectedCuisineFilter) return false;
    if (selectedSentimentFilter !== 'ทั้งหมด' && r.sentiment !== selectedSentimentFilter) return false;
    if (selectedAspectFilter !== 'ทั้งหมด' && r.highlightAspect !== selectedAspectFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchComment = r.comment.toLowerCase().includes(q);
      const matchAuthor = r.author.toLowerCase().includes(q);
      const matchBranch = r.branchName.toLowerCase().includes(q);
      const matchProvince = r.province?.toLowerCase().includes(q);
      if (!matchComment && !matchAuthor && !matchBranch && !matchProvince) return false;
    }
    return true;
  });

  const displayedReviews = filteredReviews.slice(0, visibleCount);

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim() || !targetBranchId) return;

    // Calculate rating based on aspect average
    const calculatedRating = parseFloat(
      (
        (newAspectScores.food * 0.40 +
         newAspectScores.service * 0.25 +
         newAspectScores.cleanliness * 0.15 +
         newAspectScores.atmosphere * 0.10 +
         newAspectScores.value * 0.10)
      ).toFixed(1)
    );

    const aspects: Array<{ key: keyof AspectScores; score: number }> = [
      { key: 'food', score: newAspectScores.food },
      { key: 'service', score: newAspectScores.service },
      { key: 'cleanliness', score: newAspectScores.cleanliness },
      { key: 'atmosphere', score: newAspectScores.atmosphere },
      { key: 'value', score: newAspectScores.value },
    ];
    aspects.sort((a, b) => b.score - a.score);
    const topAspect = aspects[0].key;

    const sentiment = calculatedRating >= 4.0 ? 'positive' : 'neutral';

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: newAuthor,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      rating: calculatedRating,
      date: 'เมื่อสักครู่',
      aspectScores: { ...newAspectScores },
      highlightAspect: topAspect as any,
      comment: newComment,
      sentiment,
      sentimentLabel: sentiment === 'positive' ? 'ความประทับใจโดยรวมสูง' : 'ความคิดเห็นและข้อเสนอแนะ'
    };

    onAddReview(targetBranchId, newRev);
    setShowAddModal(false);
    setNewAuthor('');
    setNewComment('');
  };

  const cuisines = ['ทั้งหมด', ...Object.keys(CUISINE_COLORS)];

  return (
    <div id="review-explorer-view" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Voice Analytics & Sentiment Repository</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              เจาะลึกเสียงสะท้อนของลูกค้าตามมิติของร้าน (Review Explorer)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              อ่านรีวิวจริงที่ถูกแยกแยะตาม 5 มิติ (รสชาติ, บริการ, ความสะอาด, บรรยากาศ, ราคา) จาก 1,500 สาขาทั่วประเทศ
            </p>
          </div>

          <div>
            <button
              id="open-add-review-modal-btn"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>เขียนรีวิวจำลองใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อความรีวิว, ชื่อร้าน, จังหวัด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Cuisine Filter */}
          <select
            value={selectedCuisineFilter}
            onChange={(e) => setSelectedCuisineFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
          >
            {cuisines.map(c => (
              <option key={c} value={c}>{c === 'ทั้งหมด' ? 'ทุกประเภทอาหาร' : c}</option>
            ))}
          </select>

          {/* Aspect Filter */}
          <select
            value={selectedAspectFilter}
            onChange={(e) => setSelectedAspectFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer"
          >
            <option value="ทั้งหมด">ทุกมิติที่พูดถึง</option>
            <option value="food">ด้านอาหารและรสชาติ</option>
            <option value="service">ด้านการบริการ</option>
            <option value="cleanliness">ด้านความสะอาด</option>
            <option value="atmosphere">ด้านบรรยากาศ</option>
            <option value="value">ด้านความคุ้มค่า</option>
          </select>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setSelectedSentimentFilter('ทั้งหมด')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedSentimentFilter === 'ทั้งหมด' 
                  ? 'bg-slate-900 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedSentimentFilter('positive')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedSentimentFilter === 'positive' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              เชิงบวก (High)
            </button>
            <button
              onClick={() => setSelectedSentimentFilter('neutral')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedSentimentFilter === 'neutral' 
                  ? 'bg-amber-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              ข้อเสนอแนะ
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-3.5">
        <div className="text-xs text-slate-500 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            พบรีวิวตรงตามเงื่อนไข <strong className="text-slate-900">{filteredReviews.length.toLocaleString()}</strong> รายการ (กำลังแสดง {displayedReviews.length} รายการ)
          </span>
        </div>

        {displayedReviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
            ไม่พบรีวิวที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReviews.map((r) => {
              const colorConf = CUISINE_COLORS[r.cuisine] || {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
                dot: 'bg-slate-400'
              };

              return (
                <div 
                  key={r.id} 
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    {/* Top: Branch Name & Sentiment Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${colorConf.bg} ${colorConf.text}`}>
                            {r.cuisine}
                          </span>
                          <span className="text-[11px] text-slate-400">จ.{r.province}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">{r.branchName}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          r.sentiment === 'positive' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {r.sentimentLabel}
                        </span>
                        <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                          {r.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Comment Text */}
                    <p className="text-xs text-slate-700 mt-2.5 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100 italic">
                      &quot;{r.comment}&quot;
                    </p>
                  </div>

                  {/* Aspect Breakdown for this review */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
                      <div className={`p-1.5 ${ASPECT_COLORS.food.bg}/60 border ${ASPECT_COLORS.food.border} rounded-md`}>
                        <span className={`${ASPECT_COLORS.food.text} block text-[9px] uppercase tracking-wider font-bold`}>อาหาร</span>
                        <span className={`font-extrabold ${ASPECT_COLORS.food.text}`}>{r.aspectScores.food}</span>
                      </div>
                      <div className={`p-1.5 ${ASPECT_COLORS.service.bg}/60 border ${ASPECT_COLORS.service.border} rounded-md`}>
                        <span className={`${ASPECT_COLORS.service.text} block text-[9px] uppercase tracking-wider font-bold`}>บริการ</span>
                        <span className={`font-extrabold ${ASPECT_COLORS.service.text}`}>{r.aspectScores.service}</span>
                      </div>
                      <div className={`p-1.5 ${ASPECT_COLORS.cleanliness.bg}/60 border ${ASPECT_COLORS.cleanliness.border} rounded-md`}>
                        <span className={`${ASPECT_COLORS.cleanliness.text} block text-[9px] uppercase tracking-wider font-bold`}>สะอาด</span>
                        <span className={`font-extrabold ${ASPECT_COLORS.cleanliness.text}`}>{r.aspectScores.cleanliness}</span>
                      </div>
                      <div className={`p-1.5 ${ASPECT_COLORS.atmosphere.bg}/60 border ${ASPECT_COLORS.atmosphere.border} rounded-md`}>
                        <span className={`${ASPECT_COLORS.atmosphere.text} block text-[9px] uppercase tracking-wider font-bold`}>บรรยากาศ</span>
                        <span className={`font-extrabold ${ASPECT_COLORS.atmosphere.text}`}>{r.aspectScores.atmosphere}</span>
                      </div>
                      <div className={`p-1.5 ${ASPECT_COLORS.value.bg}/60 border ${ASPECT_COLORS.value.border} rounded-md`}>
                        <span className={`${ASPECT_COLORS.value.text} block text-[9px] uppercase tracking-wider font-bold`}>คุ้มค่า</span>
                        <span className={`font-extrabold ${ASPECT_COLORS.value.text}`}>{r.aspectScores.value}</span>
                      </div>
                    </div>

                    {/* Author & Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <img 
                          src={r.avatar} 
                          alt={r.author} 
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-700">{r.author}</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">{r.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredReviews.length && (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>โหลดรีวิวเพิ่มเติม (+24)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal: Write New Review */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">เขียนรีวิวจำลองใหม่</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">เลือกสาขาร้านอาหาร:</label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                >
                  {branches.slice(0, 50).map(b => (
                    <option key={b.id} value={b.id}>{b.fullName} (จ.{b.province})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อผู้รีวิว:</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณกมลวรรณ"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              {/* 5 Sliders for the new review */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">ให้คะแนนแยก 5 มิติ (1.0 - 5.0):</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-amber-800 font-bold">🍛 อาหาร:</span>
                      <span className="font-extrabold text-amber-700">{newAspectScores.food}</span>
                    </div>
                    <input 
                      type="range" min="1.0" max="5.0" step="0.1" 
                      value={newAspectScores.food}
                      onChange={(e) => setNewAspectScores({...newAspectScores, food: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-amber-200 accent-amber-500 rounded-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-blue-800 font-bold">🛎️ บริการ:</span>
                      <span className="font-extrabold text-blue-700">{newAspectScores.service}</span>
                    </div>
                    <input 
                      type="range" min="1.0" max="5.0" step="0.1" 
                      value={newAspectScores.service}
                      onChange={(e) => setNewAspectScores({...newAspectScores, service: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-blue-200 accent-blue-500 rounded-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-800 font-bold">✨ ความสะอาด:</span>
                      <span className="font-extrabold text-emerald-700">{newAspectScores.cleanliness}</span>
                    </div>
                    <input 
                      type="range" min="1.0" max="5.0" step="0.1" 
                      value={newAspectScores.cleanliness}
                      onChange={(e) => setNewAspectScores({...newAspectScores, cleanliness: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-emerald-200 accent-emerald-500 rounded-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-purple-800 font-bold">🌿 บรรยากาศ:</span>
                      <span className="font-extrabold text-purple-700">{newAspectScores.atmosphere}</span>
                    </div>
                    <input 
                      type="range" min="1.0" max="5.0" step="0.1" 
                      value={newAspectScores.atmosphere}
                      onChange={(e) => setNewAspectScores({...newAspectScores, atmosphere: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-purple-200 accent-purple-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-rose-800 font-bold">🏷️ ความคุ้มค่าราคา:</span>
                    <span className="font-extrabold text-rose-700">{newAspectScores.value}</span>
                  </div>
                  <input 
                    type="range" min="1.0" max="5.0" step="0.1" 
                    value={newAspectScores.value}
                    onChange={(e) => setNewAspectScores({...newAspectScores, value: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-rose-200 accent-rose-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ข้อความรีวิว:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="เขียนความคิดเห็นเกี่ยวกับอาหาร บริการ หรือบรรยากาศ..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>บันทึกรีวิว</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
