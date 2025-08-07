import { useState } from 'react'
import { Upload, Loader2, Image, Trash2 } from 'lucide-react'
import { r2UploadManager } from '../utils/r2Upload.js'

export default function TestUpload() {
  const [uploadedUrls, setUploadedUrls] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [testResult, setTestResult] = useState('')

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setIsUploading(true)
    setTestResult('')
    
    try {
      console.log('开始上传图片...')
      const urls = await r2UploadManager.uploadMultipleFiles(files, 'test')
      setUploadedUrls(prev => [...prev, ...urls])
      setTestResult(`成功上传 ${urls.length} 张图片！`)
      console.log('上传成功:', urls)
    } catch (error) {
      console.error('上传失败:', error)
      setTestResult(`上传失败: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/upload', { method: 'HEAD' })
      setTestResult(`API连接测试: ${response.status}`)
    } catch (error) {
      setTestResult(`API连接失败: ${error.message}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">R2上传测试</h1>
      
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">测试上传</h2>
        
        <div className="mb-4">
          <button 
            onClick={testApiConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mr-4"
          >
            测试API连接
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
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
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                选择图片测试
              </>
            )}
          </label>
        </div>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-mono">{testResult}</p>
          </div>
        )}
      </div>

      {uploadedUrls.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">已上传图片</h2>
          <div className="grid grid-cols-3 gap-4">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`上传图片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1 truncate">{url}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}