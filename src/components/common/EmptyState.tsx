import React from 'react'
import Icon from '../icons/Icons'

type EmptyStateType = 'albums' | 'timeline' | 'photos' | 'food' | 'map' | 'todos' | 'search' | 'general'

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const emptyStateConfig: Record<EmptyStateType, { icon: string; title: string; description: string }> = {
  albums: {
    icon: 'photo_library',
    title: '还没有相册',
    description: '在管理后台创建第一个相册，记录你们的美好回忆吧'
  },
  timeline: {
    icon: 'timeline',
    title: '还没有时光轴记录',
    description: '在管理后台创建第一个时光轴事件，记录你们的美好时刻'
  },
  photos: {
    icon: 'photo',
    title: '还没有照片',
    description: '这个相册还没有照片，上传一些照片开始记录吧'
  },
  food: {
    icon: 'restaurant',
    title: '还没有美食打卡',
    description: '记录你们品尝过的美食，留下美味回忆'
  },
  map: {
    icon: 'public',
    title: '还没有旅行足迹',
    description: '开始记录你们的旅行足迹，探索更多城市'
  },
  todos: {
    icon: 'check_circle',
    title: '心愿清单是空的',
    description: '添加你们想要一起完成的愿望，开始逐梦之旅'
  },
  search: {
    icon: 'search_off',
    title: '没有找到匹配的',
    description: '尝试其他关键词搜索'
  },
  general: {
    icon: 'inbox',
    title: '暂无数据',
    description: '这里还没有内容'
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  const config = emptyStateConfig[type]

  return (
    <div className={`flex flex-col items-center justify-center py-20 animate-fade-in ${className}`}>
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Icon name={config.icon} size={48} className="text-slate-200" />
      </div>
      <h3 className="text-2xl font-black text-slate-400 mb-3">
        {title || config.title}
      </h3>
      <p className="text-slate-300 text-sm max-w-md mx-auto text-center leading-relaxed">
        {description || config.description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
