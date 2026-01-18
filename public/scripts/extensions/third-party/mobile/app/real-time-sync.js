/**
 * Real-time Sync - 实时同步器
 * 监控上下文变化，调用提取器和渲染器，实现增量更新
 */

class RealTimeSync {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = 0;
    this.syncInterval = 200000; // 同步间隔 2秒
    this.syncTimer = null;

    // 缓存状态
    this.lastMessageCount = 0;
    this.lastChatId = null;
    this.processedMessages = new Set(); // 已处理的消息ID
    this.lastFriendCount = 0;
    this.processedFriends = new Set(); // 已处理的好友ID

    // 增量渲染状态
    this.isIncrementalMode = true;
    this.maxProcessedMessages = 1000; // 最大缓存消息数
    this.maxProcessedFriends = 200; // 最大缓存好友数

    console.log('[Real-time Sync] 实时同步器已创建');
  }

  // 启动实时同步
  start() {
    if (this.isRunning) {
      console.log('[Real-time Sync] 已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('[Real-time Sync] 🚀 启动实时同步');

    // 立即执行一次同步
    this.performSync();

    // 设置定时同步
    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.syncInterval);

    // 监听SillyTavern事件
    this.setupEventListeners();
  }

  // 停止实时同步
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('[Real-time Sync] ⏹️ 停止实时同步');

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.removeEventListeners();
  }

  // 执行同步
  async performSync() {
    try {
      const startTime = Date.now();

      // 检查依赖是否可用
      if (!this.checkDependencies()) {
        return;
      }

      // 获取当前上下文状态
      const contextState = await this.getCurrentContextState();
      if (!contextState) {
        return;
      }

      // 检查是否有变化
      const hasChanges = this.detectChanges(contextState);
      if (!hasChanges) {
        return;
      }

      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log('[Real-time Sync] 🔄 检测到上下文变化，开始同步');
      }

      // 执行增量同步
      await this.performIncrementalSync(contextState);

      // 更新状态
      this.updateSyncState(contextState);

      const duration = Date.now() - startTime;
      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log(`[Real-time Sync] ✅ 同步完成，耗时 ${duration}ms`);
      }
    } catch (error) {
      console.error('[Real-time Sync] 同步失败:', error);
    }
  }

  // 检查依赖
  checkDependencies() {
    const dependencies = ['contextMonitor', 'friendRenderer', 'messageApp'];

    for (const dep of dependencies) {
      if (!window[dep]) {
        console.warn(`[Real-time Sync] 依赖 ${dep} 不可用`);
        return false;
      }
    }

    return true;
  }

  // 获取当前上下文状态
  async getCurrentContextState() {
    try {
      // 获取聊天消息
      const chatData = await window.contextMonitor.getCurrentChatMessages();
      if (!chatData) {
        return null;
      }

      // 获取好友数据
      const friendData = await this.extractFriendData();

      return {
        chatId: chatData.chatId,
        messageCount: chatData.totalMessages,
        messages: chatData.messages,
        friendCount: friendData.length,
        friends: friendData,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[Real-time Sync] 获取上下文状态失败:', error);
      return null;
    }
  }

  // 提取好友数据
  async extractFriendData() {
    try {
      if (!window.friendRenderer) {
        return [];
      }

      const friends = window.friendRenderer.extractFriendsFromContext();
      return friends || [];
    } catch (error) {
      console.error('[Real-time Sync] 提取好友数据失败:', error);
      return [];
    }
  }

  // 检测变化
  detectChanges(contextState) {
    if (!contextState) {
      return false;
    }

    // 检查聊天是否切换
    if (contextState.chatId !== this.lastChatId) {
      console.log('[Real-time Sync] 📱 检测到聊天切换');
      this.clearCache(); // 清除缓存
      return true;
    }

    // 检查消息数量变化
    if (contextState.messageCount !== this.lastMessageCount) {
      console.log(`[Real-time Sync] 📨 检测到消息数量变化: ${this.lastMessageCount} -> ${contextState.messageCount}`);
      return true;
    }

    // 检查好友数量变化
    if (contextState.friendCount !== this.lastFriendCount) {
      console.log(`[Real-time Sync] 👥 检测到好友数量变化: ${this.lastFriendCount} -> ${contextState.friendCount}`);
      return true;
    }

    // 检查是否有新消息（即使总数相同，也可能有内容变化）
    const hasNewMessages = this.detectNewMessages(contextState.messages);
    if (hasNewMessages) {
      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log('[Real-time Sync] 🆕 检测到新消息内容');
      }
      return true;
    }

    // 检查是否有新好友
    const hasNewFriends = this.detectNewFriends(contextState.friends);
    if (hasNewFriends) {
      console.log('[Real-time Sync] 🆕 检测到新好友');
      return true;
    }

    return false;
  }

  // 检测新消息
  detectNewMessages(messages) {
    if (!messages || messages.length === 0) {
      return false;
    }

    let hasNew = false;

    for (const message of messages) {
      const messageId = this.generateMessageId(message);
      if (!this.processedMessages.has(messageId)) {
        hasNew = true;
        break;
      }
    }

    return hasNew;
  }

  // 检测新好友
  detectNewFriends(friends) {
    if (!friends || friends.length === 0) {
      return false;
    }

    let hasNew = false;

    for (const friend of friends) {
      const friendId = friend.number || friend.id;
      if (friendId && !this.processedFriends.has(friendId)) {
        hasNew = true;
        break;
      }
    }

    return hasNew;
  }

  // 生成消息ID
  generateMessageId(message) {
    if (message.id) {
      return message.id;
    }

    // 使用消息内容的哈希作为ID
    const content = message.mes || message.content || '';
    const timestamp = message.send_date || message.timestamp || Date.now();
    return `${content.substring(0, 50)}_${timestamp}`;
  }

  // 执行增量同步
  async performIncrementalSync(contextState) {
    try {
      // 在处理之前检测变化
      const hasNewMessages = this.detectNewMessages(contextState.messages);
      const hasNewFriends = this.detectNewFriends(contextState.friends);

      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log(`[Real-time Sync] 变化检测结果: 新消息=${hasNewMessages}, 新好友=${hasNewFriends}`);
      }

      // 处理新消息
      await this.processNewMessages(contextState.messages);

      // 处理新好友
      await this.processNewFriends(contextState.friends);

      // 触发Message App的增量渲染，传递变化标记
      await this.triggerIncrementalRender(contextState, hasNewMessages, hasNewFriends);
    } catch (error) {
      console.error('[Real-time Sync] 增量同步失败:', error);
    }
  }

  // 处理新消息
  async processNewMessages(messages) {
    if (!messages || messages.length === 0) {
      return;
    }

    const newMessages = [];

    for (const message of messages) {
      const messageId = this.generateMessageId(message);
      if (!this.processedMessages.has(messageId)) {
        newMessages.push(message);
        this.processedMessages.add(messageId);
      }
    }

    if (newMessages.length > 0) {
      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log(`[Real-time Sync] 📨 处理 ${newMessages.length} 条新消息`);
      }

      // 清理过多的缓存
      this.cleanupProcessedMessages();
    }
  }

  // 处理新好友
  async processNewFriends(friends) {
    if (!friends || friends.length === 0) {
      return;
    }

    const newFriends = [];

    for (const friend of friends) {
      const friendId = friend.number || friend.id;
      if (friendId && !this.processedFriends.has(friendId)) {
        newFriends.push(friend);
        this.processedFriends.add(friendId);
      }
    }

    if (newFriends.length > 0) {
      console.log(`[Real-time Sync] 👥 处理 ${newFriends.length} 个新好友`);

      // 清理过多的缓存
      this.cleanupProcessedFriends();
    }
  }

  // 触发增量渲染
  async triggerIncrementalRender(contextState, hasNewMessages = false, hasNewFriends = false) {
    try {
      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log(`[Real-time Sync] 🎯 触发增量渲染: 新消息=${hasNewMessages}, 新好友=${hasNewFriends}`);
      }

      // 如果Message App存在且正在运行
      if (window.messageApp) {
        // 使用Message App的增量渲染功能
        if (typeof window.messageApp.handleIncrementalUpdate === 'function') {
          window.messageApp.handleIncrementalUpdate({
            eventType: 'sync_update',
            chatData: {
              messages: contextState.messages,
              friends: contextState.friends,
              messageCount: contextState.messageCount,
              friendCount: contextState.friendCount,
            },
            timestamp: contextState.timestamp,
            hasNewMessages,
            hasNewFriends,
          });
        }

        // 如果有新消息或新好友，触发完整渲染
        if (hasNewMessages || hasNewFriends) {
          if (window.DEBUG_REAL_TIME_SYNC) {
            console.log('[Real-time Sync] 🔄 检测到新内容，触发完整渲染');
          }
          if (typeof window.messageApp.refreshFriendListUI === 'function') {
            window.messageApp.refreshFriendListUI();
          }
        } else {
          // 否则只触发轻量级更新
          if (typeof window.messageApp.triggerLightweightUpdate === 'function') {
            window.messageApp.triggerLightweightUpdate();
          }
        }
      }

      // 发送自定义事件，传递正确的变化标记
      this.dispatchSyncEvent(contextState, hasNewMessages, hasNewFriends);
    } catch (error) {
      console.error('[Real-time Sync] 触发增量渲染失败:', error);
    }
  }

  // 发送同步事件
  dispatchSyncEvent(contextState, hasNewMessages = false, hasNewFriends = false) {
    try {
      if (window.DEBUG_REAL_TIME_SYNC) {
        console.log(`[Real-time Sync] 📡 发送同步事件: 新消息=${hasNewMessages}, 新好友=${hasNewFriends}`);
      }

      const event = new CustomEvent('realTimeSyncUpdate', {
        detail: {
          chatId: contextState.chatId,
          messageCount: contextState.messageCount,
          friendCount: contextState.friendCount,
          hasNewMessages: hasNewMessages,
          hasNewFriends: hasNewFriends,
          timestamp: contextState.timestamp,
          syncMode: 'incremental',
        },
      });

      window.dispatchEvent(event);
    } catch (error) {
      console.error('[Real-time Sync] 发送同步事件失败:', error);
    }
  }

  // 更新同步状态
  updateSyncState(contextState) {
    this.lastChatId = contextState.chatId;
    this.lastMessageCount = contextState.messageCount;
    this.lastFriendCount = contextState.friendCount;
    this.lastSyncTime = contextState.timestamp;
  }

  // 清除缓存
  clearCache() {
    this.processedMessages.clear();
    this.processedFriends.clear();
    this.lastMessageCount = 0;
    this.lastFriendCount = 0;
    console.log('[Real-time Sync] 🗑️ 缓存已清除');
  }

  // 清理过多的已处理消息
  cleanupProcessedMessages() {
    if (this.processedMessages.size > this.maxProcessedMessages) {
      const messagesToRemove = this.processedMessages.size - this.maxProcessedMessages;
      const messageArray = Array.from(this.processedMessages);

      // 移除最旧的消息
      for (let i = 0; i < messagesToRemove; i++) {
        this.processedMessages.delete(messageArray[i]);
      }

      console.log(`[Real-time Sync] 🧹 清理了 ${messagesToRemove} 条过旧的消息缓存`);
    }
  }

  // 清理过多的已处理好友
  cleanupProcessedFriends() {
    if (this.processedFriends.size > this.maxProcessedFriends) {
      const friendsToRemove = this.processedFriends.size - this.maxProcessedFriends;
      const friendArray = Array.from(this.processedFriends);

      // 移除最旧的好友
      for (let i = 0; i < friendsToRemove; i++) {
        this.processedFriends.delete(friendArray[i]);
      }

      console.log(`[Real-time Sync] 🧹 清理了 ${friendsToRemove} 个过旧的好友缓存`);
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 监听SillyTavern事件（如果可用）
    if (window.eventSource && window.event_types) {
      try {
        // 监听消息接收事件
        window.eventSource.on(window.event_types.MESSAGE_RECEIVED, () => {
          console.log('[Real-time Sync] 🔥 收到MESSAGE_RECEIVED事件');
          this.triggerImmediateSync();
        });

        // 监听聊天切换事件
        window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
          console.log('[Real-time Sync] 🔄 收到CHAT_CHANGED事件');
          this.clearCache();
          this.triggerImmediateSync();
        });

        console.log('[Real-time Sync] ✅ SillyTavern事件监听器已设置');
      } catch (error) {
        console.warn('[Real-time Sync] 设置SillyTavern事件监听器失败:', error);
      }
    }

    // 监听自定义事件
    window.addEventListener('messageAppRender', () => {
      console.log('[Real-time Sync] 收到messageAppRender事件');
      this.triggerImmediateSync();
    });

    window.addEventListener('contextMonitorUpdate', () => {
      console.log('[Real-time Sync] 收到contextMonitorUpdate事件');
      this.triggerImmediateSync();
    });
  }

  // 移除事件监听器
  removeEventListeners() {
    // 这里可以添加移除监听器的逻辑
    console.log('[Real-time Sync] 事件监听器已移除');
  }

  // 立即触发同步
  triggerImmediateSync() {
    if (!this.isRunning) {
      return;
    }

    // 防抖处理
    const now = Date.now();
    if (now - this.lastSyncTime < 500) {
      return;
    }

    console.log('[Real-time Sync] ⚡ 立即执行同步');
    this.performSync();
  }

  // 设置同步间隔
  setSyncInterval(interval) {
    this.syncInterval = Math.max(100000, interval); // 最小1秒

    if (this.isRunning) {
      // 重新启动定时器
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }

      this.syncTimer = setInterval(() => {
        this.performSync();
      }, this.syncInterval);
    }

    console.log(`[Real-time Sync] 同步间隔已设置为 ${this.syncInterval}ms`);
  }

  // 获取同步状态
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      syncInterval: this.syncInterval,
      lastSyncTime: this.lastSyncTime,
      lastChatId: this.lastChatId,
      lastMessageCount: this.lastMessageCount,
      lastFriendCount: this.lastFriendCount,
      processedMessagesCount: this.processedMessages.size,
      processedFriendsCount: this.processedFriends.size,
      isIncrementalMode: this.isIncrementalMode,
    };
  }

  // 强制全量同步
  async forceFullSync() {
    console.log('[Real-time Sync] 🔄 执行强制全量同步');

    // 临时禁用增量模式
    const originalMode = this.isIncrementalMode;
    this.isIncrementalMode = false;

    // 清除缓存
    this.clearCache();

    // 执行同步
    await this.performSync();

    // 恢复增量模式
    this.isIncrementalMode = originalMode;

    console.log('[Real-time Sync] ✅ 强制全量同步完成');
  }
}

// 避免重复定义
if (typeof window.RealTimeSync === 'undefined') {
  window.RealTimeSync = RealTimeSync;

  // 创建全局实例
  window.realTimeSync = new RealTimeSync();

  // 自动启动（可选）
  setTimeout(() => {
    if (window.realTimeSync && !window.realTimeSync.isRunning) {
      window.realTimeSync.start();
    }
  }, 3000); // 3秒后自动启动

  console.log('[Real-time Sync] 实时同步器模块加载完成');
}
