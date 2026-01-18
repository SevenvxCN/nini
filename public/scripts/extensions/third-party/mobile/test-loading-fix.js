/**
 * 测试应用加载修复效果
 * 用于验证API/论坛/微博应用的加载状态管理和强制跳转修复
 */

console.log('=== 应用加载修复测试 ===');

// 测试用户导航意图管理
function testUserNavigationIntent() {
  console.log('\n1. 测试用户导航意图管理');
  
  if (!window.mobilePhone) {
    console.error('移动端手机界面未初始化');
    return;
  }

  const phone = window.mobilePhone;
  
  // 模拟用户点击论坛应用
  console.log('模拟用户点击论坛应用...');
  phone._userNavigationIntent = {
    targetApp: 'forum',
    timestamp: Date.now(),
    fromApp: null
  };
  
  console.log('用户导航意图:', phone._userNavigationIntent);
  
  // 测试导航意图有效性检查
  setTimeout(() => {
    const isValid = phone.isUserNavigationIntentValid('forum');
    console.log('导航意图是否有效:', isValid);
    
    // 模拟用户切换到其他应用
    console.log('模拟用户切换到其他应用...');
    phone.currentApp = 'messages';
    
    const isValidAfterSwitch = phone.isUserNavigationIntentValid('forum');
    console.log('切换后导航意图是否有效:', isValidAfterSwitch);
  }, 1000);
}

// 测试加载状态管理
function testLoadingStateManagement() {
  console.log('\n2. 测试加载状态管理');
  
  if (!window.mobilePhone) {
    console.error('移动端手机界面未初始化');
    return;
  }

  const phone = window.mobilePhone;
  
  // 测试显示加载状态
  console.log('测试显示加载状态...');
  phone.showAppLoadingState('forum', '论坛');
  
  // 检查加载状态
  console.log('正在加载的应用:', Array.from(phone._loadingApps));
  
  // 测试完成加载
  setTimeout(() => {
    console.log('测试完成加载...');
    const canJump = phone.completeAppLoading('forum');
    console.log('是否可以跳转:', canJump);
    console.log('正在加载的应用:', Array.from(phone._loadingApps));
  }, 2000);
}

// 测试返回按钮清除导航意图
function testBackButtonClearIntent() {
  console.log('\n3. 测试返回按钮清除导航意图');
  
  if (!window.mobilePhone) {
    console.error('移动端手机界面未初始化');
    return;
  }

  const phone = window.mobilePhone;
  
  // 设置导航意图
  phone._userNavigationIntent = {
    targetApp: 'weibo',
    timestamp: Date.now(),
    fromApp: null
  };
  
  console.log('设置导航意图:', phone._userNavigationIntent);
  
  // 模拟返回按钮点击
  console.log('模拟返回按钮点击...');
  phone.handleBackButton();
  
  console.log('返回后导航意图:', phone._userNavigationIntent);
}

// 运行测试
function runTests() {
  console.log('开始运行测试...');
  
  // 等待移动端界面初始化
  if (window.mobilePhone) {
    testUserNavigationIntent();
    setTimeout(testLoadingStateManagement, 3000);
    setTimeout(testBackButtonClearIntent, 6000);
  } else {
    console.log('等待移动端界面初始化...');
    setTimeout(runTests, 1000);
  }
}

// 页面加载完成后运行测试
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTests);
} else {
  runTests();
}

console.log('测试脚本已加载，等待执行...');
