/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时间
 */
export const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 检查文件类型
 */
export const checkFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })
}

/**
 * 压缩图片
 */
export const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      const ratio = Math.min(maxWidth / width, maxWidth / height)
      
      canvas.width = width * ratio
      canvas.height = height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

/**
 * 通用下载函数 - 支持多种下载方式，确保浏览器兼容性
 */
export const downloadFile = async (
  url: string, 
  filename?: string,
  options?: {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: any
  }
): Promise<void> => {
  try {
    // 方法1: 尝试使用fetch + blob方式下载（推荐）
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers || {},
      body: options?.body
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    
    // 从响应头或URL中获取文件名
    const finalFilename = filename || 
      response.headers.get('content-disposition')?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '') ||
      url.split('/').pop()?.split('?')[0] ||
      'download'
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = finalFilename
    link.style.display = 'none'
    
    // 添加到DOM并触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
    
  } catch (error) {
    console.warn('Fetch download failed, trying fallback method:', error)
    
    // 方法2: 降级到传统的a标签下载方式
    const link = document.createElement('a')
    link.href = url
    if (filename) {
      link.download = filename
    }
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * 批量下载文件
 */
export const downloadFiles = async (
  files: Array<{ url: string; filename?: string }>,
  options?: {
    delay?: number // 下载间隔时间（毫秒）
    onProgress?: (current: number, total: number) => void
    onError?: (error: Error, file: { url: string; filename?: string }) => void
  }
): Promise<void> => {
  const { delay = 500, onProgress, onError } = options || {}
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      await downloadFile(file.url, file.filename)
      onProgress?.(i + 1, files.length)
      
      // 添加延迟避免浏览器阻止多个下载
      if (i < files.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      onError?.(error as Error, file)
    }
  }
}

/**
 * 从Blob创建下载
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * 下载文本内容为文件
 */
export const downloadText = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * 下载JSON数据为文件
 */
export const downloadJSON = (data: any, filename: string): void => {
  const content = JSON.stringify(data, null, 2)
  downloadText(content, filename, 'application/json')
}