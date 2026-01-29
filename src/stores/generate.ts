import { defineStore } from 'pinia'
import { ref } from 'vue'

// 生成模式类型
export type GenerateMode = 'image' | 'video'

// 参考图片类型
export interface ReferenceImage {
  url: string
  file?: File
  val?: string // TOS uploadFileName
}

// 生成配置类型
export interface GenerateConfig {
  mode: GenerateMode
  prompt?: string
  referenceImages?: ReferenceImage[]
  referenceVideo?: string
  referenceVideoVal?: string // TOS uploadFileName for video
  // 图片生成参数
  aspectRatio?: string
  resolutionRatio?: string
  genImageNum?: number
  // 视频生成参数
  duration?: string
  aiDriver?: string
  // 其他参数
  [key: string]: string | number | ReferenceImage[] | undefined
}

// 资产标签类型
interface AssetTag {
  id: number
  name: string
  key: string
  val: string
  showVal: string
  attr: string
  type: number
  materialId: number
  sort: number
}

// 资产详情类型
interface AssetDetail {
  materialUrl: string
  materialUri: string
  coverUri: string
  userInput?: {
    tags?: AssetTag[]
  }
}

export const useGenerateStore = defineStore('generate', () => {
  // 生成配置
  const config = ref<GenerateConfig>({
    mode: 'image'
  })

  // 设置生成配置
  const setConfig = (newConfig: Partial<GenerateConfig>) => {
    config.value = {
      ...config.value,
      ...newConfig
    }
  }

  // 设置生成模式
  const setMode = (mode: GenerateMode) => {
    config.value.mode = mode
  }

  // 设置提示词
  const setPrompt = (prompt: string) => {
    config.value.prompt = prompt
  }

  // 添加参考图片
  const addReferenceImage = (image: ReferenceImage) => {
    if (!config.value.referenceImages) {
      config.value.referenceImages = []
    }
    config.value.referenceImages.push(image)
  }

  // 设置参考图片列表
  const setReferenceImages = (images: ReferenceImage[]) => {
    config.value.referenceImages = images
  }

  // 清除参考图片
  const clearReferenceImages = () => {
    config.value.referenceImages = []
  }

  // 设置参考视频
  const setReferenceVideo = (videoUrl: string, videoVal?: string) => {
    config.value.referenceVideo = videoUrl
    if (videoVal) {
      config.value.referenceVideoVal = videoVal
    }
  }

  // 清除参考视频
  const clearReferenceVideo = () => {
    config.value.referenceVideo = undefined
    config.value.referenceVideoVal = undefined
  }

  // 重置配置
  const resetConfig = () => {
    config.value = {
      mode: 'image'
    }
  }

  // 从资产详情设置配置（用于重新编辑）
  const setConfigFromAsset = (assetDetail: AssetDetail, mode: GenerateMode) => {
    const tags = assetDetail.userInput?.tags || []
    
    console.log('=== setConfigFromAsset 开始 ===')
    console.log('mode:', mode)
    console.log('assetDetail:', assetDetail)
    console.log('tags:', tags)
    
    const newConfig: GenerateConfig = {
      mode
    }

    // 提取提示词
    const promptTag = tags.find((tag: AssetTag) => 
      tag.key === 'prompt' || tag.key === 'userPrompt' || tag.key === 'text'
    )
    if (promptTag) {
      newConfig.prompt = promptTag.val || promptTag.showVal
      console.log('提示词:', newConfig.prompt)
    }

    // 提取其他参数
    const aiDriverTag = tags.find((tag: AssetTag) => tag.key === 'aiDriver')
    if (aiDriverTag) {
      newConfig.aiDriver = aiDriverTag.val
      console.log('AI模型:', newConfig.aiDriver)
    }

    const aspectRatioTag = tags.find((tag: AssetTag) => tag.key === 'aspectRatio')
    if (aspectRatioTag) {
      newConfig.aspectRatio = aspectRatioTag.val
      console.log('尺寸比例:', newConfig.aspectRatio)
    }

    const resolutionTag = tags.find((tag: AssetTag) => tag.key === 'resolutionRatio')
    if (resolutionTag) {
      newConfig.resolutionRatio = resolutionTag.val
      console.log('分辨率:', newConfig.resolutionRatio)
    }

    const durationTag = tags.find((tag: AssetTag) => tag.key === 'duration')
    if (durationTag) {
      newConfig.duration = durationTag.val
      console.log('时长:', newConfig.duration)
    }

    const genImageNumTag = tags.find((tag: AssetTag) => tag.key === 'genImageNum')
    if (genImageNumTag) {
      newConfig.genImageNum = parseInt(genImageNumTag.val)
      console.log('图片张数:', newConfig.genImageNum)
    }

    // 设置参考素材 - 从 tags 中提取
    if (mode === 'video') {
      // 视频模式：检查是否有参考图片（首尾帧）或参考视频
      const imagesTag = tags.find((tag: AssetTag) => tag.key === 'images')
      const imageFirstTag = tags.find((tag: AssetTag) => tag.key === 'imageFirst')
      const imageLastTag = tags.find((tag: AssetTag) => tag.key === 'imageLast')
      const referenceVideoTag = tags.find((tag: AssetTag) => tag.key === 'referenceVideo' || tag.key === 'video')
      
      console.log('查找参考素材:')
      console.log('- imagesTag:', imagesTag)
      console.log('- imageFirstTag:', imageFirstTag)
      console.log('- imageLastTag:', imageLastTag)
      console.log('- referenceVideoTag:', referenceVideoTag)
      
      if (referenceVideoTag && referenceVideoTag.val) {
        // 有参考视频
        newConfig.referenceVideo = referenceVideoTag.showVal || referenceVideoTag.val
        newConfig.referenceVideoVal = referenceVideoTag.val
        console.log('设置参考视频:', newConfig.referenceVideo)
      } else if (imageFirstTag || imageLastTag || imagesTag) {
        // 有参考图片（首尾帧模式）
        newConfig.referenceImages = []
        
        if (imageFirstTag && imageFirstTag.val) {
          const imageData = {
            url: imageFirstTag.showVal || imageFirstTag.val,
            val: imageFirstTag.val
          }
          newConfig.referenceImages.push(imageData)
          console.log('设置首帧图 - tag:', imageFirstTag)
          console.log('设置首帧图 - data:', imageData)
        }
        
        if (imageLastTag && imageLastTag.val) {
          const imageData = {
            url: imageLastTag.showVal || imageLastTag.val,
            val: imageLastTag.val
          }
          newConfig.referenceImages.push(imageData)
          console.log('设置尾帧图 - tag:', imageLastTag)
          console.log('设置尾帧图 - data:', imageData)
        }
        
        // 如果没有 imageFirst/imageLast，尝试从 images 中提取
        if (newConfig.referenceImages.length === 0 && imagesTag && imagesTag.val) {
          newConfig.referenceImages.push({
            url: imagesTag.showVal || imagesTag.val,
            val: imagesTag.val
          })
          console.log('从 images 设置参考图:', imagesTag.showVal || imagesTag.val)
        }
        
        console.log('最终参考图片数组:', newConfig.referenceImages)
      } else {
        console.log('未找到任何参考素材')
      }
    } else if (mode === 'image') {
      // 图片模式：检查是否有参考图片
      const imagesTag = tags.find((tag: AssetTag) => tag.key === 'images')
      
      console.log('图片模式 - imagesTag:', imagesTag)
      
      if (imagesTag && imagesTag.val) {
        newConfig.referenceImages = [{
          url: imagesTag.showVal || imagesTag.val,
          val: imagesTag.val
        }]
        console.log('设置参考图片:', newConfig.referenceImages)
      }
    }

    console.log('=== 最终配置 ===')
    console.log(newConfig)
    console.log('=== setConfigFromAsset 结束 ===')

    config.value = newConfig
  }

  return {
    config,
    setConfig,
    setMode,
    setPrompt,
    addReferenceImage,
    setReferenceImages,
    clearReferenceImages,
    setReferenceVideo,
    clearReferenceVideo,
    resetConfig,
    setConfigFromAsset
  }
}, {
  // 不持久化，因为这是临时状态
  persist: false
})
