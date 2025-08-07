import { useState } from 'react'
import { Upload, Image, Loader2 } from 'lucide-react'
import { r2UploadManager } from '../utils/r2Upload.js'

export default function TestR2Upload() {
  const [uploadedUrls, setUploadedUrls] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setIsUploading(true)
    try {
      const urls = await r2UploadManager.uploadMultipleFiles(files, 'test')
      setUploadedUrls(prev => [...prev, ...urls])
      alert(`成功上传 ${urls.length} 张图片！`)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteImage = async (url) => {
    try {
      await r2UploadManager.deleteFile(url)
      setUploadedUrls(prev => prev.filter(u => u !== url))
      alert('图片删除成功！')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">R2 图片上传测试</h1>
      
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">上传图片</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                选择图片
              </>
            )}
          </label>
        </div>
      </div>

      {uploadedUrls.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">已上传图片</h2>
          <div className="grid grid-cols-3 gap-4">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`上传图片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteImage(url)}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{url}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}