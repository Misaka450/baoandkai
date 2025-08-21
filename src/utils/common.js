// 公共工具函数

// 防抖函数 - 避免频繁请求
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 日期格式化
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 优先级映射
export const mapPriority = (priority) => {
  if (priority >= 3) return 'high';
  if (priority <= 1) return 'low';
  return 'medium';
};

// 优先级颜色
export const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200'
};

// 加载状态组件 - 使用函数返回JSX
import React from 'react';

export const LoadingSpinner = ({ message = '加载中...' }) => {
  return React.createElement(
    'div',
    { className: 'flex justify-center items-center py-8' },
    [
      React.createElement('div', {
        key: 'spinner',
        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500'
      }),
      message && React.createElement(
        'span',
        { key: 'message', className: 'ml-3 text-gray-600' },
        message
      )
    ]
  );
};