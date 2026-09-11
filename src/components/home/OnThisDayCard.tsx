import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { timelineService } from '../../services/apiService';
import Icon from '../icons/Icons';
import { getThumbnailUrl } from '../../utils/imageUtils';
import ImageModal from '../ImageModal';

export default function OnThisDayCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);

  const { data: response, isLoading } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: async () => {
      const res = await timelineService.getOnThisDay();
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 分钟缓存
  });

  if (isLoading || !response?.hasMemories) {
    return null;
  }

  const { events = [], photos = [], targetDate } = response;
  const primaryMemory = events[0] || photos[0];
  const yearsAgo = primaryMemory?.yearsAgo || 1;

  const handleOpenPhoto = (images: string[], index: number = 0) => {
    if (!images || images.length === 0) return;
    setModalImages(images);
    setModalIndex(index);
    setModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mb-16 relative group"
        >
          {/* 莫兰迪柔和光晕背影 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-morandi-pink/30 via-morandi-rose/20 to-morandi-blue/20 rounded-[2.5rem] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/85 backdrop-blur-md border-2 border-white/80 p-6 md:p-10 shadow-lg shadow-morandi-pink/10">
            {/* 顶栏信息 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
              <div className="flex items-center space-x-3">
                <span className="w-10 h-10 rounded-2xl bg-[#FFEDF3] text-[#FF8BB1] flex items-center justify-center shadow-sm border border-[#FFEDF3]">
                  <Icon name="favorite" size={22} className="animate-heart-pop" />
                </span>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    那年今日
                    <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-morandi-pink/15 text-morandi-pink font-bold">
                      {yearsAgo} 年前的今天
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">时光漫步 · 记录这一刻的温存</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFF9EB] border border-[#FFE8B8]/50 text-[#FFB344] text-xs font-bold shadow-sm">
                <Icon name="star" size={16} />
                <span>{targetDate}</span>
              </div>
            </div>

            {/* 回忆卡片列表 */}
            <div className="space-y-6 relative z-10">
              {events.map((ev) => (
                <div key={ev.id} className="flex flex-col md:flex-row gap-6 items-start bg-white/60 p-5 md:p-6 rounded-2xl border border-white/70 shadow-sm">
                  {ev.images && ev.images.length > 0 && (
                    <div
                      className="w-full md:w-56 h-40 rounded-2xl overflow-hidden shadow-md flex-shrink-0 cursor-pointer relative group/img overflow-hidden"
                      onClick={() => handleOpenPhoto(ev.images || [], 0)}
                    >
                      <img
                        src={getThumbnailUrl(ev.images[0] || '')}
                        alt={ev.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                        loading="lazy"
                      />
                      {ev.images.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          +{ev.images.length}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {ev.category && (
                          <span className="text-xs px-2.5 py-0.5 rounded-md bg-morandi-blue/15 text-morandi-blue font-bold">
                            {ev.category}
                          </span>
                        )}
                        <h4 className="text-lg font-bold text-slate-800">{ev.title}</h4>
                      </div>
                      {ev.description && (
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-3">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {ev.location && (
                          <span className="inline-flex items-center gap-1 text-morandi-pink font-medium">
                            <Icon name="location_on" size={16} />
                            {ev.location}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400">{ev.date}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 如果仅有照片匹配 */}
              {events.length === 0 && photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-white cursor-pointer relative group/p"
                      onClick={() => handleOpenPhoto(photos.map(item => item.url), idx)}
                    >
                      <img
                        src={getThumbnailUrl(p.url)}
                        alt={p.caption || '回忆'}
                        className="w-full h-full object-cover group-hover/p:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/p:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                        <span className="text-xs font-bold truncate">{p.caption || p.album_name}</span>
                        {p.location && <span className="text-[10px] text-white/80 truncate">{p.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部寄语 */}
            <div className="mt-6 pt-4 border-t border-morandi-pink/15 flex items-center justify-center text-xs text-slate-400 font-medium tracking-wide">
              <span>时光缓缓，我们一直在一起 💕</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={modalImages}
        currentIndex={modalIndex}
        onPrevious={() => setModalIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)}
        onNext={() => setModalIndex((prev) => (prev + 1) % modalImages.length)}
        onJumpTo={setModalIndex}
      />
    </>
  );
}
