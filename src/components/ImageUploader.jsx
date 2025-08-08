import React, { useState, useRef } from 'react';
import { Upload, X, Image, CheckCircle, AlertCircle } from 'lucide-react';

const ImageUploader = ({ 
  onImagesUploaded, 
  maxImages = 20, 
  folder = 'images',
  existingImages = [],
  onRemoveImage,
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (files) => {
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
        status: 'uploading',
        url: null,
        error: null
      }))
    ]);

    // 开始上传
    for (const uploadFile of validFiles) {
      await uploadSingleFile(uploadFile);
    }
  };

  const uploadSingleFile = async (file) => {
    const uploadId = Math.random().toString(36).substr(2, 9);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const xhr = new XMLHttpRequest();
      
      // 创建上传任务
      setUploadingFiles(prev => prev.map(item => 
        item.file === file ? { ...item, id: uploadId } : item
      ));

      // 监听进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev => prev.map(item => 
            item.id === uploadId ? { ...item, progress } : item
          ));
        }
      };

      // 使用 Promise 包装 XMLHttpRequest
      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            const url = result.urls ? result.urls[0] : result.url;
            resolve(url);
          } else {
            reject(new Error('上传失败'));
          }
        };
        xhr.onerror = () => reject(new Error('网络错误'));
        
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      // 更新状态为成功
      setUploadingFiles(prev => prev.map(item => 
        item.id === uploadId ? { ...item, status: 'success', url: result } : item
      ));

      // 通知父组件
      onImagesUploaded([result]);

    } catch (error) {
      setUploadingFiles(prev => prev.map(item => 
        item.file === file ? { ...item, status: 'error', error: error.message } : item
      ));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeUploadingFile = (id) => {
    setUploadingFiles(prev => prev.filter(item => item.id !== id));
  };

  const retryUpload = (file) => {
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
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
                  <Image className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(item.file.size)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'uploading' && (
                    <span className="text-xs text-blue-600">{item.progress}%</span>
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <button
                    onClick={() => removeUploadingFile(item.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              
              {item.status === 'error' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600">{item.error}</span>
                  <button
                    onClick={() => retryUpload(item.file)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 已上传图片预览 */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">已上传图片</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {existingImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt=""
                  className="w-full h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80';
                  }}
                />
                {onRemoveImage && (
                  <button
                    onClick={() => onRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;