/**
 * 测试直播应用修复效果的脚本
 * 用于验证批量转换和容器跳转问题的修复
 */

// 测试批量转换功能 (live-app)
function testLiveAppBatchConversion() {
  console.log('🧪 测试 live-app 批量转换功能...');

  if (!window.liveApp) {
    console.error('❌ liveApp 实例不存在');
    return;
  }

  // 模拟多条包含直播格式的消息
  const testMessages = [
    {
      mes: '这是第一条消息 [直播|用户1|弹幕|你好主播！] [直播|本场人数|1234]'
    },
    {
      mes: '这是第二条消息 [直播|用户2|礼物|玫瑰花*5] [直播|推荐互动|感谢礼物]'
    },
    {
      mes: '这是第三条消息 [直播|用户3|弹幕|今天天气真好] [直播|直播内容|主播正在聊天]'
    }
  ];

  // 模拟 getChatData 返回测试数据
  const originalGetChatData = window.liveApp.getChatData;
  window.liveApp.getChatData = function() {
    return testMessages;
  };

  // 模拟 updateMessageContent 和 saveChatData 方法
  let updateCount = 0;
  let saveCount = 0;

  window.liveApp.updateMessageContent = async function(index, content) {
    updateCount++;
    console.log(`📝 [live-app] 更新消息 ${index}: ${content.substring(0, 50)}...`);
    return true;
  };

  window.liveApp.saveChatData = async function() {
    saveCount++;
    console.log(`💾 [live-app] 保存聊天数据 (第${saveCount}次)`);
    return true;
  };

  // 执行转换
  window.liveApp.convertLiveToHistory().then(() => {
    console.log(`✅ live-app 批量转换测试完成:`);
    console.log(`   - 更新消息次数: ${updateCount}`);
    console.log(`   - 保存数据次数: ${saveCount}`);
    console.log(`   - 预期: 保存次数应该为1 (批量保存)`);

    // 恢复原始方法
    window.liveApp.getChatData = originalGetChatData;
  }).catch(error => {
    console.error('❌ live-app 批量转换测试失败:', error);
  });
}

// 测试批量转换功能 (watch-live-app)
function testWatchLiveAppBatchConversion() {
  console.log('🧪 测试 watch-live-app 批量转换功能...');

  if (!window.watchLiveApp) {
    console.error('❌ watchLiveApp 实例不存在');
    return;
  }

  // 模拟多条包含直播格式的消息
  const testMessages = [
    {
      mes: '这是第一条消息 [直播|用户1|弹幕|你好主播！] [直播|本场人数|1234]'
    },
    {
      mes: '这是第二条消息 [直播|用户2|礼物|玫瑰花*5] [直播|推荐互动|感谢礼物]'
    },
    {
      mes: '这是第三条消息 [直播|用户3|弹幕|今天天气真好] [直播|直播内容|主播正在聊天]'
    }
  ];

  // 模拟 getChatData 返回测试数据
  const originalGetChatData = window.watchLiveApp.getChatData;
  window.watchLiveApp.getChatData = function() {
    return testMessages;
  };

  // 模拟 updateMessageContent 和 saveChatData 方法
  let updateCount = 0;
  let saveCount = 0;

  window.watchLiveApp.updateMessageContent = async function(index, content) {
    updateCount++;
    console.log(`📝 [watch-live-app] 更新消息 ${index}: ${content.substring(0, 50)}...`);
    return true;
  };

  window.watchLiveApp.saveChatData = async function() {
    saveCount++;
    console.log(`💾 [watch-live-app] 保存聊天数据 (第${saveCount}次)`);
    return true;
  };

  // 执行转换
  window.watchLiveApp.convertLiveToHistory().then(() => {
    console.log(`✅ watch-live-app 批量转换测试完成:`);
    console.log(`   - 更新消息次数: ${updateCount}`);
    console.log(`   - 保存数据次数: ${saveCount}`);
    console.log(`   - 预期: 保存次数应该为1 (批量保存)`);

    // 恢复原始方法
    window.watchLiveApp.getChatData = originalGetChatData;
  }).catch(error => {
    console.error('❌ watch-live-app 批量转换测试失败:', error);
  });
}

// 测试 watch-live 应用的状态重置
function testWatchLiveStateReset() {
  console.log('🧪 测试观看直播应用状态重置...');

  if (!window.watchLiveApp) {
    console.error('❌ watchLiveApp 实例不存在');
    return;
  }

  // 记录初始状态
  const initialState = {
    currentView: window.watchLiveApp.currentView,
    isInitialized: window.watchLiveApp.isInitialized,
    isLiveActive: window.watchLiveApp.isLiveActive
  };

  console.log('📊 初始状态:', initialState);

  // 模拟进入直播状态
  window.watchLiveApp.currentView = 'live';
  window.watchLiveApp.isInitialized = true;
  window.watchLiveApp.stateManager.startLive();

  console.log('📊 模拟直播状态:', {
    currentView: window.watchLiveApp.currentView,
    isInitialized: window.watchLiveApp.isInitialized,
    isLiveActive: window.watchLiveApp.isLiveActive
  });

  // 执行结束直播
  window.watchLiveApp.endLive().then(() => {
    console.log('📊 结束直播后状态:', {
      currentView: window.watchLiveApp.currentView,
      isInitialized: window.watchLiveApp.isInitialized,
      isLiveActive: window.watchLiveApp.isLiveActive
    });

    // 验证状态是否正确重置
    const isCorrectlyReset =
      window.watchLiveApp.currentView === 'start' &&
      window.watchLiveApp.isInitialized === false &&
      window.watchLiveApp.isLiveActive === false;

    if (isCorrectlyReset) {
      console.log('✅ 状态重置测试通过');
    } else {
      console.log('❌ 状态重置测试失败');
    }
  }).catch(error => {
    console.error('❌ 状态重置测试失败:', error);
  });
}

// 测试头部按钮设置
function testHeaderButtons() {
  console.log('🧪 测试头部按钮设置...');

  if (!window.mobilePhone) {
    console.error('❌ mobilePhone 实例不存在');
    return;
  }

  // 测试 watch-live 应用的头部按钮
  const watchLiveState = {
    app: 'watch-live',
    title: '观看直播中',
    view: 'live',
    viewerCount: '1.2K'
  };

  console.log('📱 设置 watch-live 头部按钮...');
  window.mobilePhone.updateAppHeader(watchLiveState);

  // 检查是否有退出按钮
  const exitBtn = document.querySelector('.end-stream-btn');
  if (exitBtn) {
    console.log('✅ 找到退出直播间按钮');
    console.log('🔍 按钮标题:', exitBtn.title);
    console.log('🔍 按钮内容:', exitBtn.innerHTML);
  } else {
    console.log('❌ 未找到退出直播间按钮');
  }

  // 检查观看人数显示
  const viewerCount = document.querySelector('.viewer-count-num');
  if (viewerCount) {
    console.log('✅ 找到观看人数显示:', viewerCount.textContent);
  } else {
    console.log('❌ 未找到观看人数显示');
  }
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始运行直播应用修复测试...');
  console.log('='.repeat(50));

  setTimeout(() => {
    testLiveAppBatchConversion();
  }, 1000);

  setTimeout(() => {
    testWatchLiveAppBatchConversion();
  }, 2000);

  setTimeout(() => {
    testWatchLiveStateReset();
  }, 3000);

  setTimeout(() => {
    testHeaderButtons();
  }, 4000);

  setTimeout(() => {
    console.log('='.repeat(50));
    console.log('🏁 所有测试完成');
  }, 5000);
}

// 导出测试函数
window.testLiveFixes = {
  testLiveAppBatchConversion,
  testWatchLiveAppBatchConversion,
  testWatchLiveStateReset,
  testHeaderButtons,
  runAllTests
};

console.log('📋 直播应用修复测试脚本已加载');
console.log('💡 使用 window.testLiveFixes.runAllTests() 运行所有测试');
