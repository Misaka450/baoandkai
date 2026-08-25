import React, { useState, useRef } from 'react';
import Icon from './icons/Icons';
import { apiService } from '../services/apiService';
import { useToast } from './common/Toast';

// 定义图片上传组件的属性接口
interface ImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  existingImages?: string[];
  onRemoveImage?: (index: number) => void;
  maxFileSize?: number; // 默认 20MB
}

// 定义上传文件的状态接口
interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url: string | null;
  error: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImagesUploaded, 
  maxImages = 20, 
  folder = 'images',
  existingImages = [],
  onRemoveImage,
  maxFileSize = 20 * 1024 * 1024 // 20MB
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // 确保 existingImages 是数组
  const safeExistingImages = Array.isArray(existingImages) ? existingImages : [];

  // 格式化文件大小为易读文本
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 处理文件选择逻辑
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} 不是图片文件，已跳过`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.warning(`${file.name} 超过最大限制 (${formatFileSize(maxFileSize)})`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // 检查是否超过最大上传张数
    if (safeExistingImages.length + uploadingFiles.length + validFiles.length > maxImages) {
      toast.warning(`最多只能上传 ${maxImages} 张照片哦`);
      return;
    }

    const newUploadItems: UploadFile[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      progress: 0,
      status: 'uploading' as const,
      url: null,
      error: null,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadItems]);

    // 逐个开始上传
    for (const item of newUploadItems) {
      await uploadSingleFile(item.file, item.id);
    }
  };

  // 单文件上传执行函数
  const uploadSingleFile = async (file: File, itemId: string): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // 更新进度为 0%
      setUploadingFiles((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'uploading', progress: 0 } : item))
      );

      // 调用支持进度的 apiService 上传接口
      const { data, error } = await apiService.uploadWithProgress<{ url: string; urls: string[] }>(
        '/upload',
        formData,
        (p) => {
          setUploadingFiles((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, progress: p.percent } : item))
          );
        }
      );

      if (error) {
        throw new Error(error);
      }

      const url = data?.urls?.[0] || data?.url || '';

      // 更新状态为上传成功
      setUploadingFiles((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'success' as const, url, progress: 100 } : item
        )
      );

      toast.success(`${file.name} 上传成功`);

      // 通知父组件
      onImagesUploaded([url]);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '上传失败';
      setUploadingFiles((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: 'error' as const,
                error: errMsg,
              }
            : item
        )
      );
      toast.error(`${file.name} 上传失败: ${errMsg}`);
    }
  };

  // 拖拽相关事件处理
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // 移除正在上传或已上传的记录条目
  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // 单项重试上传
  const retryUpload = (item: UploadFile) => {
    uploadSingleFile(item.file, item.id);
  };

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        role="button"
        tabIndex={0}
        aria-label="点击或拖拽图片到此处上传"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer ${
          dragOver 
            ? 'border-primary bg-primary/10 scale-[1.01]' 
            : 'border-stone-300 dark:border-stone-700 hover:border-primary/60 hover:bg-stone-50/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="upload" size={26} />
          </div>
        </div>
        <p className="text-base font-semibold text-stone-800 dark:text-stone-100 mb-1">
          点击选择或拖拽图片到这里
        </p>
        <p className="text-xs text-stone-500 mb-4">
          支持 JPG、PNG、GIF、WebP 格式，单张最大 {formatFileSize(maxFileSize)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          aria-label="选择本地图片"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
        >
          浏览本地图片
        </button>
      </div>

      {/* 上传进度与文件状态列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-stone-500">上传列表</h4>
          {uploadingFiles.map((item) => (
            <div
              key={item.id}
              className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 border border-stone-200/60 dark:border-stone-700/60"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2 min-w-0">
                  <Icon name="photo" size={16} className="text-stone-400 flex-shrink-0" />
                  <span className="text-xs text-stone-700 dark:text-stone-300 truncate max-w-[180px] sm:max-w-xs">
                    {item.file.name}
                  </span>
                  <span className="text-[10px] text-stone-400 flex-shrink-0">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <span className="text-[10px] font-semibold text-primary">{item.progress}%</span>
                  )}
                  {item.status === 'success' && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                      <Icon name="check_circle" size={16} /> 成功
                    </span>
                  )}
                  {item.status === 'error' && (
                    <button
                      type="button"
                      aria-label="重试上传"
                      onClick={() => retryUpload(item)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
                    >
                      重试
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="移除条目"
                    onClick={() => removeUploadingFile(item.id)}
                    className="text-stone-400 hover:text-stone-600 p-0.5 rounded"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
