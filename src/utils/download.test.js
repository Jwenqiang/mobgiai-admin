/**
 * 下载功能测试文件
 * 这个文件可以在浏览器控制台中运行来测试下载功能
 */

// 测试单个文件下载
export const testSingleDownload = async () => {
  try {
    const { downloadFile } = await import('./index.ts')
    
    // 测试下载一个小的测试文件
    const testUrl = 'data:text/plain;charset=utf-8,Hello%20World%21'
    await downloadFile(testUrl, 'test.txt')
    
    console.log('✅ 单个文件下载测试成功')
    return true
  } catch (error) {
    console.error('❌ 单个文件下载测试失败:', error)
    return false
  }
}

// 测试批量下载
export const testBatchDownload = async () => {
  try {
    const { downloadFiles } = await import('./index.ts')
    
    const files = [
      { 
        url: 'data:text/plain;charset=utf-8,File%201%20Content', 
        filename: 'file1.txt' 
      },
      { 
        url: 'data:text/plain;charset=utf-8,File%202%20Content', 
        filename: 'file2.txt' 
      }
    ]
    
    await downloadFiles(files, {
      delay: 1000,
      onProgress: (current, total) => {
        console.log(`📥 下载进度: ${current}/${total}`)
      },
      onError: (error, file) => {
        console.error(`❌ 下载文件 ${file.filename} 失败:`, error)
      }
    })
    
    console.log('✅ 批量下载测试成功')
    return true
  } catch (error) {
    console.error('❌ 批量下载测试失败:', error)
    return false
  }
}

// 测试JSON下载
export const testJSONDownload = async () => {
  try {
    const { downloadJSON } = await import('./index.ts')
    
    const testData = {
      name: '测试数据',
      timestamp: new Date().toISOString(),
      items: [1, 2, 3, 4, 5]
    }
    
    downloadJSON(testData, 'test-data.json')
    
    console.log('✅ JSON下载测试成功')
    return true
  } catch (error) {
    console.error('❌ JSON下载测试失败:', error)
    return false
  }
}

// 运行所有测试
export const runAllTests = async () => {
  console.log('🚀 开始运行下载功能测试...')
  
  const results = await Promise.all([
    testSingleDownload(),
    testJSONDownload(),
    testBatchDownload()
  ])
  
  const passedTests = results.filter(Boolean).length
  const totalTests = results.length
  
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`)
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！下载功能正常工作')
  } else {
    console.log('⚠️ 部分测试失败，请检查控制台错误信息')
  }
  
  return passedTests === totalTests
}

// 在浏览器控制台中运行测试的说明
console.log(`
📋 下载功能测试说明:

在浏览器控制台中运行以下命令来测试下载功能:

1. 测试单个文件下载:
   testSingleDownload()

2. 测试JSON下载:
   testJSONDownload()

3. 测试批量下载:
   testBatchDownload()

4. 运行所有测试:
   runAllTests()

注意: 请确保浏览器允许下载文件，某些浏览器可能会阻止自动下载。
`)