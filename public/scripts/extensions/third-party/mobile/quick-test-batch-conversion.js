/**
 * 快速测试批量转换修复效果
 * 在浏览器控制台中运行此脚本来验证修复
 */

console.log('🧪 开始快速测试批量转换修复...');

// 测试函数
function testBatchConversionFix() {
  // 检查应用是否存在
  if (!window.liveApp && !window.watchLiveApp) {
    console.error('❌ 没有找到直播应用实例');
    return;
  }

  // 模拟测试数据
  const testMessages = [
    { mes: '测试消息1 [直播|用户1|弹幕|你好] [直播|本场人数|100]' },
    { mes: '测试消息2 [直播|用户2|礼物|玫瑰*5] [直播|推荐互动|感谢]' },
    { mes: '测试消息3 [直播|用户3|弹幕|再见] [直播|直播内容|结束了]' }
  ];

  // 计数器
  let saveCallCount = 0;
  let updateCallCount = 0;

  // 模拟保存函数，记录调用次数
  const mockSaveFunction = () => {
    saveCallCount++;
    console.log(`💾 模拟保存被调用 (第${saveCallCount}次)`);
    return Promise.resolve();
  };

  // 备份原始函数
  const originalSaveChatConditional = window.saveChatConditional;
  const originalSaveChatDebounced = window.saveChatDebounced;

  // 替换为计数函数
  window.saveChatConditional = mockSaveFunction;
  window.saveChatDebounced = mockSaveFunction;

  // 测试 live-app
  if (window.liveApp) {
    console.log('📱 测试 live-app 批量转换...');
    
    // 备份原始方法
    const originalGetChatData = window.liveApp.getChatData;
    const originalUpdateMessageContent = window.liveApp.updateMessageContent;
    
    // 模拟数据和方法
    window.liveApp.getChatData = () => testMessages;
    window.liveApp.updateMessageContent = async (index, content, skipAutoSave) => {
      updateCallCount++;
      console.log(`📝 [live-app] 更新消息 ${index} (skipAutoSave: ${skipAutoSave})`);
      return true;
    };

    // 执行转换
    window.liveApp.convertLiveToHistory().then(() => {
      console.log('✅ live-app 测试完成');
      console.log(`   - 更新消息调用次数: ${updateCallCount}`);
      console.log(`   - 保存调用次数: ${saveCallCount}`);
      
      // 恢复原始方法
      window.liveApp.getChatData = originalGetChatData;
      window.liveApp.updateMessageContent = originalUpdateMessageContent;
      
      // 重置计数器
      updateCallCount = 0;
      saveCallCount = 0;
      
      // 测试 watch-live-app
      if (window.watchLiveApp) {
        console.log('📱 测试 watch-live-app 批量转换...');
        
        // 备份原始方法
        const originalGetChatDataWatch = window.watchLiveApp.getChatData;
        const originalUpdateMessageContentWatch = window.watchLiveApp.updateMessageContent;
        
        // 模拟数据和方法
        window.watchLiveApp.getChatData = () => testMessages;
        window.watchLiveApp.updateMessageContent = async (index, content, skipAutoSave) => {
          updateCallCount++;
          console.log(`📝 [watch-live-app] 更新消息 ${index} (skipAutoSave: ${skipAutoSave})`);
          return true;
        };

        // 执行转换
        window.watchLiveApp.convertLiveToHistory().then(() => {
          console.log('✅ watch-live-app 测试完成');
          console.log(`   - 更新消息调用次数: ${updateCallCount}`);
          console.log(`   - 保存调用次数: ${saveCallCount}`);
          
          // 恢复原始方法
          window.watchLiveApp.getChatData = originalGetChatDataWatch;
          window.watchLiveApp.updateMessageContent = originalUpdateMessageContentWatch;
          
          // 恢复原始保存函数
          window.saveChatConditional = originalSaveChatConditional;
          window.saveChatDebounced = originalSaveChatDebounced;
          
          console.log('🎉 所有测试完成！');
          console.log('📊 预期结果: 每个应用的保存调用次数应该为1');
        });
      } else {
        // 恢复原始保存函数
        window.saveChatConditional = originalSaveChatConditional;
        window.saveChatDebounced = originalSaveChatDebounced;
        console.log('⚠️ watch-live-app 不存在，跳过测试');
      }
    });
  } else if (window.watchLiveApp) {
    // 只测试 watch-live-app
    console.log('📱 只测试 watch-live-app 批量转换...');
    
    // 备份原始方法
    const originalGetChatDataWatch = window.watchLiveApp.getChatData;
    const originalUpdateMessageContentWatch = window.watchLiveApp.updateMessageContent;
    
    // 模拟数据和方法
    window.watchLiveApp.getChatData = () => testMessages;
    window.watchLiveApp.updateMessageContent = async (index, content, skipAutoSave) => {
      updateCallCount++;
      console.log(`📝 [watch-live-app] 更新消息 ${index} (skipAutoSave: ${skipAutoSave})`);
      return true;
    };

    // 执行转换
    window.watchLiveApp.convertLiveToHistory().then(() => {
      console.log('✅ watch-live-app 测试完成');
      console.log(`   - 更新消息调用次数: ${updateCallCount}`);
      console.log(`   - 保存调用次数: ${saveCallCount}`);
      
      // 恢复原始方法
      window.watchLiveApp.getChatData = originalGetChatDataWatch;
      window.watchLiveApp.updateMessageContent = originalUpdateMessageContentWatch;
      
      // 恢复原始保存函数
      window.saveChatConditional = originalSaveChatConditional;
      window.saveChatDebounced = originalSaveChatDebounced;
      
      console.log('🎉 测试完成！');
      console.log('📊 预期结果: 保存调用次数应该为1');
    });
  }
}

// 导出测试函数
window.testBatchConversionFix = testBatchConversionFix;

console.log('💡 使用 window.testBatchConversionFix() 运行测试');
console.log('📋 或者直接运行测试:');

// 自动运行测试
setTimeout(() => {
  testBatchConversionFix();
}, 1000);
