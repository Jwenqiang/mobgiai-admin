/**
 * TOS上传调试工具
 * 用于诊断火山引擎TOS上传失败的原因
 */

/**
 * 检查TOS配置的完整性和有效性
 * @param {Object} tosConfig - TOS配置对象
 * @returns {Object} 检查结果
 */
export const validateTosConfig = (tosConfig) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 检查必要字段
  const requiredFields = [
    'accessKeyId',
    'sessionToken', 
    'region',
    'bucket'
  ];

  requiredFields.forEach(field => {
    if (!tosConfig[field]) {
      result.isValid = false;
      result.errors.push(`缺少必要字段: ${field}`);
    }
  });

  // 检查密钥字段
  if (!tosConfig.accessKeySecret && !tosConfig.secretAccessKey) {
    result.isValid = false;
    result.errors.push('缺少密钥字段: accessKeySecret 或 secretAccessKey');
  }

  // 检查字段格式
  if (tosConfig.accessKeyId && !tosConfig.accessKeyId.startsWith('AKTP')) {
    result.warnings.push('accessKeyId 格式可能不正确，通常以 AKTP 开头');
  }

  if (tosConfig.region && !/^[a-z]+-[a-z]+-\d+$/.test(tosConfig.region)) {
    result.warnings.push('region 格式可能不正确，应类似 cn-beijing, us-east-1');
  }

  if (tosConfig.sessionToken && tosConfig.sessionToken.length < 100) {
    result.warnings.push('sessionToken 长度可能不正确，通常较长');
  }

  return result;
};

/**
 * 检查网络连接和API可达性
 * @param {string} baseUrl - API基础URL
 * @returns {Promise<Object>} 检查结果
 */
export const checkNetworkConnectivity = async (baseUrl) => {
  const result = {
    isConnected: false,
    responseTime: 0,
    error: null
  };

  try {
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/v1/tos/get_sts_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    result.responseTime = Date.now() - startTime;
    result.isConnected = true;
    result.status = response.status;
    result.statusText = response.statusText;
    
    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
};

/**
 * 测试TOS SDK连接
 * @param {Object} tosConfig - TOS配置
 * @returns {Promise<Object>} 测试结果
 */
export const testTosConnection = async (tosConfig) => {
  const result = {
    canConnect: false,
    error: null,
    bucketInfo: null
  };

  try {
    const { TosClient } = await import('@volcengine/tos-sdk');
    
    const client = new TosClient({
      accessKeyId: tosConfig.accessKeyId,
      accessKeySecret: tosConfig.accessKeySecret || tosConfig.secretAccessKey,
      stsToken: tosConfig.sessionToken,  // ✅ 使用 stsToken
      region: tosConfig.region,
      bucket: tosConfig.bucket,
    });

    // 尝试获取bucket信息
    const bucketInfo = await client.headBucket({
      bucket: tosConfig.bucket
    });
    
    result.canConnect = true;
    result.bucketInfo = bucketInfo;
  } catch (error) {
    result.error = error.message;
    
    // 分析常见错误
    if (error.message.includes('AccessDenied')) {
      result.errorType = 'PERMISSION_DENIED';
      result.suggestion = '检查AccessKey权限或临时凭证是否过期';
    } else if (error.message.includes('InvalidAccessKeyId')) {
      result.errorType = 'INVALID_ACCESS_KEY';
      result.suggestion = '检查accessKeyId是否正确';
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      result.errorType = 'SIGNATURE_ERROR';
      result.suggestion = '检查accessKeySecret是否正确';
    } else if (error.message.includes('TokenExpired')) {
      result.errorType = 'TOKEN_EXPIRED';
      result.suggestion = '临时凭证已过期，需要重新获取';
    } else if (error.message.includes('NoSuchBucket')) {
      result.errorType = 'BUCKET_NOT_FOUND';
      result.suggestion = '检查bucket名称是否正确或bucket是否存在';
    } else {
      result.errorType = 'UNKNOWN_ERROR';
      result.suggestion = '未知错误，请检查网络连接和配置';
    }
  }

  return result;
};

/**
 * 综合诊断TOS上传问题
 * @param {string} baseUrl - API基础URL
 * @returns {Promise<Object>} 诊断报告
 */
export const diagnoseTosUpload = async (baseUrl) => {
  const report = {
    timestamp: new Date().toISOString(),
    steps: [],
    overallStatus: 'UNKNOWN',
    recommendations: []
  };

  // 步骤1: 检查网络连接
  report.steps.push({ step: 1, name: '检查API网络连接', status: 'RUNNING' });
  const networkCheck = await checkNetworkConnectivity(baseUrl);
  
  if (networkCheck.isConnected) {
    report.steps[0].status = 'SUCCESS';
    report.steps[0].details = `连接成功，响应时间: ${networkCheck.responseTime}ms`;
  } else {
    report.steps[0].status = 'FAILED';
    report.steps[0].details = `连接失败: ${networkCheck.error}`;
    report.recommendations.push('检查网络连接和API服务器状态');
    report.overallStatus = 'NETWORK_ERROR';
    return report;
  }

  // 步骤2: 获取TOS配置
  report.steps.push({ step: 2, name: '获取TOS配置', status: 'RUNNING' });
  
  try {
    const { getTosToken } = await import('../api/index');
    const tosConfig = await getTosToken();
    
    report.steps[1].status = 'SUCCESS';
    report.steps[1].details = '成功获取TOS配置';
    
    // 步骤3: 验证配置完整性
    report.steps.push({ step: 3, name: '验证配置完整性', status: 'RUNNING' });
    const configValidation = validateTosConfig(tosConfig);
    
    if (configValidation.isValid) {
      report.steps[2].status = 'SUCCESS';
      report.steps[2].details = '配置验证通过';
      if (configValidation.warnings.length > 0) {
        report.steps[2].warnings = configValidation.warnings;
      }
    } else {
      report.steps[2].status = 'FAILED';
      report.steps[2].details = `配置验证失败: ${configValidation.errors.join(', ')}`;
      report.recommendations.push('检查后端TOS配置接口返回的数据格式');
      report.overallStatus = 'CONFIG_ERROR';
      return report;
    }

    // 步骤4: 测试TOS连接
    report.steps.push({ step: 4, name: '测试TOS服务连接', status: 'RUNNING' });
    const tosConnectionTest = await testTosConnection(tosConfig);
    
    if (tosConnectionTest.canConnect) {
      report.steps[3].status = 'SUCCESS';
      report.steps[3].details = 'TOS连接测试成功';
      report.overallStatus = 'SUCCESS';
      report.recommendations.push('TOS配置正常，可以尝试文件上传');
    } else {
      report.steps[3].status = 'FAILED';
      report.steps[3].details = `TOS连接失败: ${tosConnectionTest.error}`;
      report.steps[3].errorType = tosConnectionTest.errorType;
      report.recommendations.push(tosConnectionTest.suggestion);
      report.overallStatus = 'TOS_CONNECTION_ERROR';
    }
    
  } catch (error) {
    report.steps[1].status = 'FAILED';
    report.steps[1].details = `获取配置失败: ${error.message}`;
    report.recommendations.push('检查后端TOS配置接口是否正常工作');
    report.overallStatus = 'API_ERROR';
  }

  return report;
};

/**
 * 打印诊断报告
 * @param {Object} report - 诊断报告
 */
export const printDiagnosisReport = (report) => {
  console.log('\n=== TOS上传诊断报告 ===');
  console.log(`时间: ${report.timestamp}`);
  console.log(`总体状态: ${report.overallStatus}`);
  
  console.log('\n--- 检查步骤 ---');
  report.steps.forEach(step => {
    const statusIcon = step.status === 'SUCCESS' ? '✅' : 
                      step.status === 'FAILED' ? '❌' : '🔄';
    console.log(`${statusIcon} 步骤${step.step}: ${step.name}`);
    console.log(`   ${step.details}`);
    
    if (step.warnings) {
      step.warnings.forEach(warning => {
        console.log(`   ⚠️ ${warning}`);
      });
    }
    
    if (step.errorType) {
      console.log(`   错误类型: ${step.errorType}`);
    }
  });
  
  if (report.recommendations.length > 0) {
    console.log('\n--- 建议 ---');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n=== 报告结束 ===\n');
};