/**
 * 移动端跳转应用栈优化测试脚本
 * 用于验证优化后的跳转逻辑是否正常工作
 */

class MobilePhoneOptimizationTest {
  constructor() {
    this.testResults = [];
    this.mobilePhone = null;
  }

  // 初始化测试环境
  async init() {
    console.log('=== 移动端跳转应用栈优化测试开始 ===');
    
    // 等待 MobilePhone 实例准备就绪
    await this.waitForMobilePhone();
    
    if (!this.mobilePhone) {
      console.error('❌ MobilePhone 实例未找到，测试终止');
      return false;
    }

    console.log('✅ MobilePhone 实例已准备就绪');
    return true;
  }

  // 等待 MobilePhone 实例
  async waitForMobilePhone() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.mobilePhone && window.mobilePhone instanceof MobilePhone) {
        this.mobilePhone = window.mobilePhone;
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  // 运行所有测试
  async runAllTests() {
    const initialized = await this.init();
    if (!initialized) return;

    console.log('🧪 开始运行优化测试...');

    // 测试防抖机制
    await this.testDebouncing();
    
    // 测试状态管理
    await this.testStateManagement();
    
    // 测试重复操作防护
    await this.testDuplicateOperationPrevention();

    // 输出测试结果
    this.printTestResults();
  }

  // 测试防抖机制
  async testDebouncing() {
    console.log('🔍 测试防抖机制...');
    
    try {
      // 模拟快速连续点击应用图标
      const startTime = Date.now();
      
      // 连续调用 openApp 5次
      for (let i = 0; i < 5; i++) {
        this.mobilePhone.openApp('messages');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 检查是否有防抖标记
      const hasDebounceFlag = this.mobilePhone._openingApp !== null;
      
      this.addTestResult('防抖机制', hasDebounceFlag, 
        `快速连续调用 openApp 5次，耗时 ${duration}ms，防抖标记: ${this.mobilePhone._openingApp}`);
      
      // 等待防抖标记清除
      await new Promise(resolve => setTimeout(resolve, 600));
      
    } catch (error) {
      this.addTestResult('防抖机制', false, `测试出错: ${error.message}`);
    }
  }

  // 测试状态管理
  async testStateManagement() {
    console.log('🔍 测试状态管理...');
    
    try {
      // 清理状态
      this.mobilePhone.goHome();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 打开应用
      this.mobilePhone.openApp('messages');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 检查状态一致性
      const currentApp = this.mobilePhone.currentApp;
      const currentAppState = this.mobilePhone.currentAppState;
      const appStackLength = this.mobilePhone.appStack.length;
      
      const stateConsistent = currentApp === 'messages' && 
                             currentAppState && 
                             currentAppState.app === 'messages' &&
                             appStackLength === 1;
      
      this.addTestResult('状态管理', stateConsistent, 
        `currentApp: ${currentApp}, currentAppState.app: ${currentAppState?.app}, appStack长度: ${appStackLength}`);
      
    } catch (error) {
      this.addTestResult('状态管理', false, `测试出错: ${error.message}`);
    }
  }

  // 测试重复操作防护
  async testDuplicateOperationPrevention() {
    console.log('🔍 测试重复操作防护...');
    
    try {
      // 确保在消息应用主界面
      this.mobilePhone.openApp('messages');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const initialStackLength = this.mobilePhone.appStack.length;
      
      // 尝试重复打开相同应用
      this.mobilePhone.openApp('messages');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalStackLength = this.mobilePhone.appStack.length;
      
      // 应用栈长度不应该增加
      const preventedDuplicate = initialStackLength === finalStackLength;
      
      this.addTestResult('重复操作防护', preventedDuplicate, 
        `初始栈长度: ${initialStackLength}, 最终栈长度: ${finalStackLength}`);
      
    } catch (error) {
      this.addTestResult('重复操作防护', false, `测试出错: ${error.message}`);
    }
  }

  // 添加测试结果
  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 打印测试结果
  printTestResults() {
    console.log('\n=== 测试结果汇总 ===');
    
    let passedCount = 0;
    let totalCount = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${result.name}: ${result.details}`);
      
      if (result.passed) passedCount++;
    });
    
    console.log(`\n📊 总计: ${passedCount}/${totalCount} 个测试通过`);
    
    if (passedCount === totalCount) {
      console.log('🎉 所有测试通过！跳转应用栈优化成功！');
    } else {
      console.log('⚠️ 部分测试失败，需要进一步优化');
    }
    
    console.log('=== 测试结束 ===\n');
  }

  // 手动触发测试
  static async runTest() {
    const tester = new MobilePhoneOptimizationTest();
    await tester.runAllTests();
    return tester.testResults;
  }
}

// 导出到全局作用域
window.MobilePhoneOptimizationTest = MobilePhoneOptimizationTest;

// 自动运行测试（如果在开发环境）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // 延迟运行测试，确保所有组件都已加载
  setTimeout(() => {
    if (window.mobilePhone) {
      console.log('🚀 自动运行移动端跳转应用栈优化测试...');
      MobilePhoneOptimizationTest.runTest();
    }
  }, 3000);
}

console.log('📱 移动端跳转应用栈优化测试脚本已加载');
