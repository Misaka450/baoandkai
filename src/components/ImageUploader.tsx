import React, { useState, useRef } from 'react';
import Icon from './icons/Icons';
import { apiService } from '../services/apiService';

// 定义图片上传组件的属性接口
interface ImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  existingImages?: string[];
  onRemoveImage?: (index: number) => void;
  maxFileSize?: number; // 默认20MB 支持更大的相机照片
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
  maxFileSize = 20 * 1024 * 1024 // 20MB 支持更大的相机照片
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 确保existingImages是数组
  const safeExistingImages = Array.isArray(existingImages) ? existingImages : [];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} 不是图片文件`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`${file.name} 超过最大文件大小限制 (${formatFileSize(maxFileSize)})`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'uploading' as const,
        url: null,
        error: null
      }))
    ]);

    // 开始上传
    for (const uploadFile of validFiles) {
      await uploadSingleFile(uploadFile);
    }
  };

  const uploadSingleFile = async (file: File): Promise<void> => {
    const uploadId = Math.random().toString(36).substr(2, 9);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // 更新状态为上传中
      setUploadingFiles(prev => prev.map(item =>
        item.file === file ? { ...item, id: uploadId, status: 'uploading' as const, progress: 0 } : item
      ));

      // 使用统一的 apiService 上传
      const { data, error } = await apiService.uploadWithProgress<{ url: string; urls: string[] }>(
        '/upload',
        formData,
        (p) => {
          setUploadingFiles(prev => prev.map(item =>
            item.id === uploadId ? { ...item, progress: p.percent } : item
          ));
        }
      );

      if (error) {
        throw new Error(error);
      }

      const url = data?.urls?.[0] || data?.url || '';

      // 更新状态为成功
      setUploadingFiles(prev => prev.map(item =>
        item.id === uploadId ? { ...item, status: 'success' as const, url, progress: 100 } : item
      ));

      // 通知父组件
      onImagesUploaded([url]);

    } catch (error) {
      setUploadingFiles(prev => prev.map(item =>
        item.file === file ?
          {
            ...item,
            status: 'error' as const,
            error: error instanceof Error ? error.message : '上传失败'
          } : item
      ));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(item => item.id !== id));
  };

  const retryUpload = (file: File) => {
    uploadSingleFile(file);
  };

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Icon name="upload" size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          拖拽图片到这里上传
        </p>
        <p className="text-sm text-gray-500 mb-4">
          或点击选择文件，支持 JPG、PNG、GIF 格式，最大 {formatFileSize(maxFileSize)}
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
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-colors"
        >
          选择图片
        </button>
      </div>

      {/* 上传进度显示 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">上传进度</h4>
          {uploadingFiles.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon name="photo" size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
                
                {item.status === 'uploading' && (
                  <button
                    onClick={() => removeUploadingFile(item.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
                
                {item.status === 'success' && (
                  <Icon name="check_circle" size={20} className="text-green-500" />
                )}
                
                {item.status === 'error' && (
                  <div className="flex items-center space-x-2">
                    <Icon name="error" size={20} className="text-red-500" />
                    <button
                      onClick={() => retryUpload(item.file)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>
              
              {item.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
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