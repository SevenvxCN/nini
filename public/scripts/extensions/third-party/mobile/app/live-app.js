/**
 * Live App - 直播应用
 * 基于task-app.js的模式，为mobile-phone.js提供直播功能
 * 监听SillyTavern上下文，解析直播数据，实时显示弹幕和互动
 */

// @ts-nocheck
// 避免重复定义
if (typeof window.LiveApp === 'undefined') {
  /**
   * 直播事件监听器
   * 负责监听SillyTavern的消息事件并触发数据解析
   */
  class LiveEventListener {
    constructor(liveApp) {
      this.liveApp = liveApp;
      this.isListening = false;
      this.lastMessageCount = 0;
      this.pollingInterval = null;
      this.messageReceivedHandler = this.onMessageReceived.bind(this);
    }

    /**
     * 开始监听SillyTavern事件
     */
    startListening() {
      if (this.isListening) {
        console.log('[Live App] 监听器已经在运行中');
        return;
      }

      try {
        // 检查SillyTavern接口可用性
        console.log('[Live App] 检查SillyTavern接口可用性:', {
          'window.SillyTavern': !!window?.SillyTavern,
          'window.SillyTavern.getContext': typeof window?.SillyTavern?.getContext,
          eventOn: typeof eventOn,
          tavern_events: typeof tavern_events,
          mobileContextEditor: !!window?.mobileContextEditor,
        });

        // 方法1: 优先使用SillyTavern.getContext().eventSource（iframe环境推荐）
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.eventSource && typeof context.eventSource.on === 'function' && context.event_types) {
            console.log('[Live App] 使用SillyTavern.getContext().eventSource监听MESSAGE_RECEIVED事件');
            context.eventSource.on(context.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
            this.isListening = true;
            console.log('[Live App] ✅ 成功开始监听SillyTavern消息事件 (context.eventSource)');
            this.updateMessageCount();
            return;
          }
        }

        // 方法2: 尝试使用全局eventOn函数（如果可用）
        if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined' && tavern_events.MESSAGE_RECEIVED) {
          console.log('[Live App] 使用全局eventOn监听MESSAGE_RECEIVED事件');
          eventOn(tavern_events.MESSAGE_RECEIVED, this.messageReceivedHandler);
          this.isListening = true;
          console.log('[Live App] ✅ 成功开始监听SillyTavern消息事件 (eventOn)');
          this.updateMessageCount();
          return;
        }

        // 方法3: 尝试从父窗口使用eventSource
        if (
          typeof window !== 'undefined' &&
          window.parent &&
          window.parent.eventSource &&
          typeof window.parent.eventSource.on === 'function'
        ) {
          console.log('[Live App] 使用父窗口eventSource监听MESSAGE_RECEIVED事件');
          if (window.parent.event_types && window.parent.event_types.MESSAGE_RECEIVED) {
            window.parent.eventSource.on(window.parent.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
            this.isListening = true;
            console.log('[Live App] ✅ 成功开始监听SillyTavern消息事件 (parent eventSource)');
            this.updateMessageCount();
            return;
          }
        }

        // 如果所有方法都失败，使用轮询作为备用方案
        console.warn('[Live App] 无法设置事件监听，使用轮询方案');
        this.startPolling();
      } catch (error) {
        console.error('[Live App] 设置事件监听失败:', error);
        this.startPolling();
      }
    }

    /**
     * 停止监听
     */
    stopListening() {
      if (!this.isListening) return;

      try {
        // 尝试移除事件监听器
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.eventSource && typeof context.eventSource.off === 'function' && context.event_types) {
            context.eventSource.off(context.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
          }
        }

        // 清除轮询
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
        }

        this.isListening = false;
        console.log('[Live App] 已停止监听SillyTavern事件');
      } catch (error) {
        console.error('[Live App] 停止监听失败:', error);
      }
    }

    /**
     * 启动轮询方案
     */
    startPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      this.updateMessageCount();
      this.pollingInterval = setInterval(() => {
        this.checkForNewMessages();
      }, 2000); // 每2秒检查一次

      this.isListening = true;
      console.log('[Live App] ✅ 启动轮询监听方案');
    }

    /**
     * 检查新消息
     */
    checkForNewMessages() {
      const currentMessageCount = this.getCurrentMessageCount();
      if (currentMessageCount > this.lastMessageCount) {
        console.log(`[Live App] 轮询检测到新消息: ${this.lastMessageCount} → ${currentMessageCount}`);
        this.onMessageReceived(currentMessageCount);
      }
    }

    /**
     * 处理AI消息接收事件
     * @param {number} messageId - 接收到的消息ID
     */
    async onMessageReceived(messageId) {
      try {
        console.log(`[Live App] 🎯 接收到AI消息事件，ID: ${messageId}`);

        // 检查直播是否活跃
        if (!this.liveApp || !this.liveApp.isLiveActive) {
          console.log('[Live App] 直播未激活，跳过处理');
          return;
        }

        // 检查是否有新消息
        const currentMessageCount = this.getCurrentMessageCount();
        console.log(`[Live App] 消息数量检查: 当前=${currentMessageCount}, 上次=${this.lastMessageCount}`);

        if (currentMessageCount <= this.lastMessageCount) {
          console.log('[Live App] 没有检测到新消息，跳过解析');
          return;
        }

        console.log(`[Live App] ✅ 检测到新消息，消息数量从 ${this.lastMessageCount} 增加到 ${currentMessageCount}`);
        this.lastMessageCount = currentMessageCount;

        // 触发数据解析
        console.log('[Live App] 开始解析新的直播数据...');
        await this.liveApp.parseNewLiveData();
      } catch (error) {
        console.error('[Live App] 处理消息接收事件失败:', error);
      }
    }

    /**
     * 获取当前消息数量
     */
    getCurrentMessageCount() {
      try {
        // 方法1: 使用SillyTavern.getContext().chat（正确的接口）
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            const count = context.chat.length;
            console.log(`[Live App] 通过SillyTavern.getContext().chat获取到 ${count} 条消息`);
            return count;
          }
        }

        // 方法2: 使用mobileContextEditor作为备用
        const mobileContextEditor = window['mobileContextEditor'];
        if (mobileContextEditor && typeof mobileContextEditor.getCurrentChatData === 'function') {
          const chatData = mobileContextEditor.getCurrentChatData();
          if (chatData && chatData.messages && Array.isArray(chatData.messages)) {
            console.log(`[Live App] 通过mobileContextEditor获取到 ${chatData.messages.length} 条消息`);
            return chatData.messages.length;
          }
        }

        // 方法3: 尝试从父窗口获取chat变量
        if (typeof window !== 'undefined' && window.parent && window.parent.chat && Array.isArray(window.parent.chat)) {
          const count = window.parent.chat.length;
          console.log(`[Live App] 通过父窗口chat变量获取到 ${count} 条消息`);
          return count;
        }

        // 方法4: 使用getContext()方法（如果可用）
        if (typeof window !== 'undefined' && window.getContext && typeof window.getContext === 'function') {
          const context = window.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            const count = context.chat.length;
            console.log(`[Live App] 通过getContext()获取到 ${count} 条消息`);
            return count;
          }
        }

        console.warn('[Live App] 无法获取消息数量，使用默认值0');
        return 0;
      } catch (error) {
        console.warn('[Live App] 获取消息数量失败:', error);
        return 0;
      }
    }

    /**
     * 更新消息计数
     */
    updateMessageCount() {
      this.lastMessageCount = this.getCurrentMessageCount();
      console.log(`[Live App] 初始化消息计数: ${this.lastMessageCount}`);
    }
  }

  /**
   * 直播数据解析器
   * 负责解析SillyTavern消息中的直播格式数据
   */
  class LiveDataParser {
    constructor() {
      // 正则表达式模式
      this.patterns = {
        viewerCount: /\[直播\|本场人数\|([^\]]+)\]/g,
        liveContent: /\[直播\|直播内容\|([^\]]+)\]/g,
        normalDanmaku: /\[直播\|([^\|]+)\|弹幕\|([^\]]+)\]/g,
        giftDanmaku: /\[直播\|([^\|]+)\|打赏\|([^\]]+)\]/g,
        recommendedInteraction: /\[直播\|推荐互动\|([^\]]+)\]/g,
      };
    }

    /**
     * 解析直播数据
     * @param {string} content - 要解析的文本内容
     * @returns {Object} 解析后的直播数据
     */
    parseLiveData(content) {
      const liveData = {
        viewerCount: 0,
        liveContent: '',
        danmakuList: [],
        giftList: [],
        recommendedInteractions: [],
      };

      if (!content || typeof content !== 'string') {
        return liveData;
      }

      // 1. 解析直播人数
      liveData.viewerCount = this.parseViewerCount(content);

      // 2. 解析直播内容
      liveData.liveContent = this.parseLiveContent(content);

      // 3. 解析所有弹幕（保持原始顺序）
      const { danmakuList, giftList } = this.parseAllDanmaku(content);
      liveData.danmakuList = danmakuList;
      liveData.giftList = giftList;

      // 5. 解析推荐互动
      liveData.recommendedInteractions = this.parseRecommendedInteractions(content);

      return liveData;
    }

    /**
     * 解析直播人数
     */
    parseViewerCount(content) {
      const matches = [...content.matchAll(this.patterns.viewerCount)];
      if (matches.length === 0) return 0;

      // 取最后一个匹配（最新的人数）
      const lastMatch = matches[matches.length - 1];
      const viewerStr = lastMatch[1].trim();

      return this.formatViewerCount(viewerStr);
    }

    /**
     * 格式化观看人数
     */
    formatViewerCount(viewerStr) {
      // 移除非数字字符，保留数字和字母
      const cleanStr = viewerStr.replace(/[^\d\w]/g, '');

      // 尝试解析数字
      const num = parseInt(cleanStr);
      if (isNaN(num)) return 0;

      // 格式化大数字
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'W';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }

      return num.toString();
    }

    /**
     * 解析直播内容
     */
    parseLiveContent(content) {
      const matches = [...content.matchAll(this.patterns.liveContent)];
      if (matches.length === 0) return '';

      // 取最后一个匹配（最新的内容）
      const lastMatch = matches[matches.length - 1];
      return lastMatch[1].trim();
    }

    /**
     * 解析所有弹幕（保持原始顺序）
     */
    parseAllDanmaku(content) {
      const danmakuList = [];
      const giftList = [];
      const allMatches = [];

      // 收集所有普通弹幕匹配
      const normalMatches = [...content.matchAll(this.patterns.normalDanmaku)];
      normalMatches.forEach(match => {
        allMatches.push({
          type: 'normal',
          match: match,
          index: match.index, // 在原文中的位置
        });
      });

      // 收集所有礼物弹幕匹配
      const giftMatches = [...content.matchAll(this.patterns.giftDanmaku)];
      giftMatches.forEach(match => {
        allMatches.push({
          type: 'gift',
          match: match,
          index: match.index, // 在原文中的位置
        });
      });

      // 按照在原文中的位置排序，保持原始顺序
      allMatches.sort((a, b) => a.index - b.index);

      // 按顺序处理所有弹幕
      allMatches.forEach((item, index) => {
        const match = item.match;
        const username = match[1].trim();
        const content = match[2].trim();
        const timestamp = new Date().toLocaleString();

        if (item.type === 'normal') {
          // 普通弹幕
          danmakuList.push({
            id: Date.now() + index,
            username: username,
            content: content,
            type: 'normal',
            timestamp: timestamp,
          });
        } else if (item.type === 'gift') {
          // 礼物弹幕
          danmakuList.push({
            id: Date.now() + index + 10000, // 避免ID冲突
            username: username,
            content: content,
            type: 'gift',
            timestamp: timestamp,
          });

          // 添加到礼物列表
          giftList.push({
            username: username,
            gift: content,
            timestamp: timestamp,
          });
        }
      });

      return { danmakuList, giftList };
    }

    /**
     * 解析普通弹幕（保留原方法以备兼容）
     */
    parseNormalDanmaku(content) {
      const danmakuList = [];
      const matches = [...content.matchAll(this.patterns.normalDanmaku)];

      matches.forEach((match, index) => {
        const username = match[1].trim();
        const danmakuContent = match[2].trim();

        danmakuList.push({
          id: Date.now() + index,
          username: username,
          content: danmakuContent,
          type: 'normal',
          timestamp: new Date().toLocaleString(),
        });
      });

      return danmakuList;
    }

    /**
     * 解析打赏弹幕
     */
    parseGiftDanmaku(content) {
      const danmakuList = [];
      const giftList = [];
      const matches = [...content.matchAll(this.patterns.giftDanmaku)];

      matches.forEach((match, index) => {
        const username = match[1].trim();
        const giftContent = match[2].trim();
        const timestamp = new Date().toLocaleString();

        // 添加到弹幕列表
        danmakuList.push({
          id: Date.now() + index + 10000, // 避免ID冲突
          username: username,
          content: giftContent,
          type: 'gift',
          timestamp: timestamp,
        });

        // 添加到礼物列表
        giftList.push({
          username: username,
          gift: giftContent,
          timestamp: timestamp,
        });
      });

      return { danmakuList, giftList };
    }

    /**
     * 解析推荐互动
     */
    parseRecommendedInteractions(content) {
      const interactions = [];
      const matches = [...content.matchAll(this.patterns.recommendedInteraction)];

      console.log(`[Live App] 推荐互动解析: 找到 ${matches.length} 个匹配项`);

      // 只取最后4个匹配项（最新的推荐互动）
      const recentMatches = matches.slice(-4);
      console.log(`[Live App] 取最新的 ${recentMatches.length} 个推荐互动`);

      recentMatches.forEach((match, index) => {
        const interactionContent = match[1].trim();
        console.log(`[Live App] 推荐互动 ${index + 1}: "${interactionContent}"`);
        if (!interactions.includes(interactionContent)) {
          interactions.push(interactionContent);
        }
      });

      console.log(`[Live App] 最终推荐互动列表:`, interactions);
      return interactions;
    }

    /**
     * 获取聊天消息内容
     */
    getChatContent() {
      try {
        // 方法1: 使用SillyTavern.getContext().chat（正确的接口）
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            const messages = context.chat;
            if (messages && messages.length > 0) {
              const content = messages.map(msg => msg.mes || '').join('\n');
              console.log(`[Live App] 通过SillyTavern.getContext().chat获取到聊天内容，长度: ${content.length}`);
              return content;
            }
          }
        }

        // 方法2: 使用mobileContextEditor作为备用
        const mobileContextEditor = window['mobileContextEditor'];
        if (mobileContextEditor && typeof mobileContextEditor.getCurrentChatData === 'function') {
          const chatData = mobileContextEditor.getCurrentChatData();
          if (chatData && chatData.messages && Array.isArray(chatData.messages)) {
            const content = chatData.messages.map(msg => msg.mes || '').join('\n');
            console.log(`[Live App] 通过mobileContextEditor获取到聊天内容，长度: ${content.length}`);
            return content;
          }
        }

        // 方法3: 尝试从父窗口获取chat变量
        if (typeof window !== 'undefined' && window.parent && window.parent.chat && Array.isArray(window.parent.chat)) {
          const messages = window.parent.chat;
          if (messages && messages.length > 0) {
            const content = messages.map(msg => msg.mes || '').join('\n');
            console.log(`[Live App] 通过父窗口chat变量获取到聊天内容，长度: ${content.length}`);
            return content;
          }
        }

        // 方法4: 使用getContext()方法（如果可用）
        if (typeof window !== 'undefined' && window.getContext && typeof window.getContext === 'function') {
          const context = window.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            const messages = context.chat;
            if (messages && messages.length > 0) {
              const content = messages.map(msg => msg.mes || '').join('\n');
              console.log(`[Live App] 通过getContext()获取到聊天内容，长度: ${content.length}`);
              return content;
            }
          }
        }

        console.warn('[Live App] 无法获取聊天内容');
        return '';
      } catch (error) {
        console.warn('[Live App] 获取聊天内容失败:', error);
        return '';
      }
    }
  }

  /**
   * 直播状态管理器
   * 负责管理直播状态和数据存储
   */
  class LiveStateManager {
    constructor() {
      this.isLiveActive = false;
      this.currentViewerCount = 0;
      this.currentLiveContent = '';
      this.danmakuList = [];
      this.giftList = [];
      this.recommendedInteractions = [];
      // 移除弹幕数量限制，显示所有历史弹幕
    }

    /**
     * 开始直播
     */
    startLive() {
      this.isLiveActive = true;
      this.currentViewerCount = 0;
      this.currentLiveContent = '';
      this.danmakuList = [];
      this.giftList = [];
      this.recommendedInteractions = [];
      console.log('[Live App] 直播状态已激活');
    }

    /**
     * 结束直播
     */
    endLive() {
      this.isLiveActive = false;
      console.log('[Live App] 直播状态已停止');
    }

    /**
     * 更新直播数据
     * @param {Object} liveData - 解析后的直播数据
     */
    updateLiveData(liveData) {
      if (!this.isLiveActive) return;

      // 更新观看人数（仅保留最新的）
      if (liveData.viewerCount !== undefined && liveData.viewerCount !== 0) {
        this.currentViewerCount = liveData.viewerCount;
        console.log(`[Live App] 更新观看人数: ${this.currentViewerCount}`);
      }

      // 更新直播内容（仅保留最新的）
      if (liveData.liveContent && liveData.liveContent.trim() !== '') {
        this.currentLiveContent = liveData.liveContent;
        console.log(`[Live App] 更新直播内容: ${this.currentLiveContent.substring(0, 50)}...`);
      }

      // 更新推荐互动（仅保留最新的）
      if (liveData.recommendedInteractions && liveData.recommendedInteractions.length > 0) {
        this.recommendedInteractions = liveData.recommendedInteractions;
        console.log(`[Live App] 更新推荐互动: ${this.recommendedInteractions.length} 个`);
      }

      // 添加新弹幕（累积所有历史弹幕）
      if (liveData.danmakuList && liveData.danmakuList.length > 0) {
        // 过滤掉已存在的弹幕（基于内容和用户名）
        const newDanmaku = liveData.danmakuList.filter(newItem => {
          return !this.danmakuList.some(
            existingItem =>
              existingItem.username === newItem.username &&
              existingItem.content === newItem.content &&
              existingItem.type === newItem.type,
          );
        });

        if (newDanmaku.length > 0) {
          this.danmakuList = this.danmakuList.concat(newDanmaku);
          console.log(`[Live App] 添加 ${newDanmaku.length} 条新弹幕，总计 ${this.danmakuList.length} 条`);

          // 移除弹幕数量限制，保留所有历史弹幕
          console.log(`[Live App] 保留所有弹幕，当前总数: ${this.danmakuList.length}`);
        }
      }

      // 添加新礼物（累积所有历史礼物）
      if (liveData.giftList && liveData.giftList.length > 0) {
        // 过滤掉已存在的礼物
        const newGifts = liveData.giftList.filter(newGift => {
          return !this.giftList.some(
            existingGift =>
              existingGift.username === newGift.username &&
              existingGift.gift === newGift.gift &&
              existingGift.timestamp === newGift.timestamp,
          );
        });

        if (newGifts.length > 0) {
          this.giftList = this.giftList.concat(newGifts);
          console.log(`[Live App] 添加 ${newGifts.length} 个新礼物，总计 ${this.giftList.length} 个`);
        }
      }
    }

    /**
     * 获取当前直播状态
     */
    getCurrentState() {
      return {
        isLiveActive: this.isLiveActive,
        viewerCount: this.currentViewerCount,
        liveContent: this.currentLiveContent,
        danmakuList: [...this.danmakuList], // 返回副本
        giftList: [...this.giftList], // 返回副本
        recommendedInteractions: [...this.recommendedInteractions], // 返回副本
      };
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
      this.currentViewerCount = 0;
      this.currentLiveContent = '';
      this.danmakuList = [];
      this.giftList = [];
      this.recommendedInteractions = [];
      console.log('[Live App] 已清空所有直播数据');
    }
  }

  /**
   * 直播应用主类
   * 协调各个模块，提供统一的接口
   */
  class LiveApp {
    constructor() {
      this.eventListener = new LiveEventListener(this);
      this.dataParser = new LiveDataParser();
      this.stateManager = new LiveStateManager();
      this.currentView = 'start'; // 'start', 'live'
      this.isInitialized = false;
      this.lastRenderTime = 0;
      this.renderCooldown = 500; // 渲染冷却时间
      this.scrollTimeout = null; // 滚动防抖定时器
      this.typingTimer = null; // 直播内容打字机计时器
      this.isTyping = false; // 是否正在打字机效果
      this.pendingAppearDanmakuSigs = new Set(); // 待逐条出现的弹幕签名
      this.pendingAppearGiftSigs = new Set(); // 待逐条出现的礼物签名

      this.init();
    }

    /**
     * 初始化应用
     */
    init() {
      console.log('[Live App] 直播应用初始化开始');

      // 检测是否有活跃的直播数据
      this.detectActiveLive();

      this.isInitialized = true;
      console.log('[Live App] 直播应用初始化完成');
    }

    /**
     * 检测是否有活跃的直播数据
     */
    detectActiveLive() {
      try {
        console.log('[Live App] 检测活跃的直播数据...');

        // 获取聊天内容
        const chatContent = this.dataParser.getChatContent();
        if (!chatContent) {
          console.log('[Live App] 没有聊天内容，保持开始直播状态');
          return;
        }

        // 检查是否有活跃的直播格式（非历史格式）
        const hasActiveLive = this.hasActiveLiveFormats(chatContent);

        if (hasActiveLive) {
          console.log('[Live App] 🎯 检测到活跃的直播数据，自动进入直播中状态');

          // 设置为直播中状态
          this.stateManager.startLive();
          this.currentView = 'live';

          // 解析并加载现有的直播数据
          const liveData = this.dataParser.parseLiveData(chatContent);
          this.stateManager.updateLiveData(liveData);

          // 开始监听新的消息
          this.eventListener.startListening();

          console.log('[Live App] ✅ 已自动恢复直播状态，数据:', {
            viewerCount: this.stateManager.currentViewerCount,
            liveContent: this.stateManager.currentLiveContent
              ? this.stateManager.currentLiveContent.substring(0, 50) + '...'
              : '',
            danmakuCount: this.stateManager.danmakuList.length,
            giftCount: this.stateManager.giftList.length,
            interactionCount: this.stateManager.recommendedInteractions.length,
          });
        } else {
          console.log('[Live App] 没有检测到活跃的直播数据，保持开始直播状态');
        }
      } catch (error) {
        console.error('[Live App] 检测活跃直播数据失败:', error);
      }
    }

    /**
     * 检查是否有活跃的直播格式
     */
    hasActiveLiveFormats(content) {
      if (!content || typeof content !== 'string') {
        return false;
      }

      // 检查是否有任何活跃的直播格式（非历史格式）
      const activeLivePatterns = [
        /\[直播\|本场人数\|[^\]]+\]/,
        /\[直播\|直播内容\|[^\]]+\]/,
        /\[直播\|[^|]+\|弹幕\|[^\]]+\]/,
        /\[直播\|[^|]+\|(?:打赏|礼物)\|[^\]]+\]/,
        /\[直播\|推荐互动\|[^\]]+\]/,
      ];

      for (const pattern of activeLivePatterns) {
        if (pattern.test(content)) {
          console.log('[Live App] 找到活跃的直播格式:', pattern.toString());
          return true;
        }
      }

      return false;
    }

    /**
     * 获取直播状态
     */
    get isLiveActive() {
      return this.stateManager.isLiveActive;
    }

    /**
     * 开始直播
     * @param {string} initialInteraction - 初始互动内容
     */
    async startLive(initialInteraction) {
      try {
        console.log('[Live App] 开始直播，初始互动:', initialInteraction);

        // 更新状态
        this.stateManager.startLive();
        this.currentView = 'live';

        // 开始监听事件
        this.eventListener.startListening();

        // 发送开始直播消息到SillyTavern
        const message = `用户开始直播，初始互动为（${initialInteraction}），请按照正确的直播格式要求生成本场人数，直播内容，弹幕，打赏和推荐互动。此次回复内仅生成一次本场人数和直播内容格式，直播内容需要简洁。最后需要生成四条推荐互动。禁止使用错误格式。`;

        await this.sendToSillyTavern(message);

        // 更新界面
        this.updateAppContent();

        console.log('[Live App] 直播已开始');
      } catch (error) {
        console.error('[Live App] 开始直播失败:', error);
        this.showToast('开始直播失败: ' + error.message, 'error');
      }
    }

    /**
     * 结束直播
     */
    async endLive() {
      try {
        console.log('[Live App] 结束直播');

        // 停止监听事件
        this.eventListener.stopListening();

        // 转换历史弹幕格式
        await this.convertLiveToHistory();

        // 更新状态
        this.stateManager.endLive();
        this.currentView = 'start';

        // 更新界面
        this.updateAppContent();

        this.showToast('直播已结束', 'success');
        console.log('[Live App] 直播已结束');
      } catch (error) {
        console.error('[Live App] 结束直播失败:', error);
        this.showToast('结束直播失败: ' + error.message, 'error');
      }
    }

    /**
     * 继续直播互动
     * @param {string} interaction - 互动内容
     */
    async continueInteraction(interaction) {
      try {
        console.log('[Live App] 继续直播互动:', interaction);

        if (!this.isLiveActive) {
          console.warn('[Live App] 直播未激活，无法继续互动');
          return;
        }

        // 发送继续直播消息到SillyTavern
        const message = `用户继续直播，互动为（${interaction}），请按照正确的直播格式要求生成本场人数，直播内容，弹幕，打赏和推荐互动。此次回复内仅生成一次本场人数和直播内容格式，直播内容需要简洁。最后需要生成四条推荐互动。禁止使用错误格式。`;

        await this.sendToSillyTavern(message);

        console.log('[Live App] 互动消息已发送');
      } catch (error) {
        console.error('[Live App] 继续互动失败:', error);
        this.showToast('发送互动失败: ' + error.message, 'error');
      }
    }

    /**
     * 解析新的直播数据
     */
    async parseNewLiveData() {
      try {
        console.log('[Live App] 开始解析新的直播数据');

        // 获取聊天内容
        const chatContent = this.dataParser.getChatContent();
        if (!chatContent) {
          console.warn('[Live App] 无法获取聊天内容');
          return;
        }

        // 双通道：在更新前记录现有弹幕签名，用于识别"真正新增"
        const existingDanmakuSigs = new Set(
          (this.stateManager.danmakuList || []).map(item => this.createDanmakuSignature(item)),
        );

        // 单独解析"最新楼层"的内容（仅用于决定动画）
        const latestFloorText = this.getLatestFloorTextSafe();
        let latestNewDanmaku = [];
        let latestNewGifts = [];
        if (latestFloorText) {
          const { danmakuList: latestDanmakuList, giftList: latestGiftList } =
            this.dataParser.parseAllDanmaku(latestFloorText);
          latestNewDanmaku = latestDanmakuList || [];
          latestNewGifts = latestGiftList || [];
        }

        // 解析直播数据
        const liveData = this.dataParser.parseLiveData(chatContent);
        console.log('[Live App] 解析到的直播数据:', {
          viewerCount: liveData.viewerCount,
          liveContent: liveData.liveContent ? liveData.liveContent.substring(0, 50) + '...' : '',
          danmakuCount: liveData.danmakuList.length,
          giftCount: liveData.giftList.length,
          interactionCount: liveData.recommendedInteractions.length,
        });

        // 更新状态
        this.stateManager.updateLiveData(liveData);

        // 计算需要动画显示的"新增弹幕/礼物"（仅来自最新楼层）
        if (latestNewDanmaku.length > 0) {
          latestNewDanmaku.forEach(item => {
            const sig = this.createDanmakuSignature(item);
            if (!existingDanmakuSigs.has(sig)) {
              this.pendingAppearDanmakuSigs.add(sig);
            }
          });
        }

        if (latestNewGifts.length > 0) {
          const existingGiftSigs = new Set(
            (this.stateManager.giftList || []).map(item => this.createGiftSignature(item)),
          );
          latestNewGifts.forEach(item => {
            const sig = this.createGiftSignature(item);
            if (!existingGiftSigs.has(sig)) {
              this.pendingAppearGiftSigs.add(sig);
            }
          });
        }

        // 更新界面（带防抖）
        this.updateAppContentDebounced();

        // 若有新的弹幕，刷新后进行一次"必要时跳底"
        setTimeout(() => {
          // 先处理需要动画的节点为隐藏状态，避免定位到空白
          this.runAppearSequence();
          const danmakuContainer = document.getElementById('danmaku-container');
          if (danmakuContainer) {
            this.jumpToBottomIfNeeded(danmakuContainer);
          }
        }, 30);
      } catch (error) {
        console.error('[Live App] 解析直播数据失败:', error);
      }
    }

    /**
     * 防抖更新界面内容
     */
    updateAppContentDebounced() {
      const currentTime = Date.now();
      if (currentTime - this.lastRenderTime < this.renderCooldown) {
        return;
      }

      this.lastRenderTime = currentTime;
      this.updateAppContent();
      this.updateHeader(); // 同时更新header
    }

    /**
     * 更新应用内容
     */
    updateAppContent() {
      const content = this.getAppContent();
      const appElement = document.getElementById('app-content');
      if (appElement) {
        appElement.innerHTML = content;
        // 延迟绑定事件，确保DOM已更新
        setTimeout(() => {
          this.bindEvents();
          this.updateHeader(); // 确保header也被更新
          // 渲染后启动直播内容打字机效果
          if (this.currentView === 'live') {
            const state = this.stateManager.getCurrentState();
            const liveContentEl = document.querySelector('.live-content-text');
            if (liveContentEl) {
              this.applyTypingEffect(liveContentEl, state.liveContent || '');
            }
            // 渲染后尝试触发逐条出现动画（避免丢帧）
            this.runAppearSequence();
          }
        }, 50);
      }
    }

    /**
     * 获取应用内容
     */
    getAppContent() {
      switch (this.currentView) {
        case 'start':
          return this.renderStartView();
        case 'live':
          return this.renderLiveView();
        default:
          return this.renderStartView();
      }
    }

    /**
     * 渲染开始直播界面
     */
    renderStartView() {
      return `
        <div class="live-app">
          <div class="live-main-container">
            <div class="live-main-header">
              <h2>直播中心</h2>
              <p>选择你想要的直播功能</p>
            </div>

            <div class="live-options">
              <div class="live-option-card" id="start-streaming-option">
                <div class="option-icon">🎥</div>
                <div class="option-content">
                  <h3>我要直播</h3>
                  <p>开始你的直播之旅</p>
                </div>
                <div class="option-arrow">→</div>
              </div>

              <div class="live-option-card" id="watch-streaming-option">
                <div class="option-icon">📺</div>
                <div class="option-content">
                  <h3>观看直播</h3>
                  <p>观看其他主播的精彩直播</p>
                </div>
                <div class="option-arrow">→</div>
              </div>
            </div>
          </div>

          <!-- 开始直播弹窗 -->
          <div class="modal" id="start-live-modal" style="display: none;">
            <div class="modal-content">
              <div class="modal-header">
                <h3>开始直播</h3>
                <button class="modal-close-btn">&times;</button>
              </div>
              <div class="modal-body">
                <div class="custom-interaction-section">
                  <textarea
                    id="custom-interaction-input"
                    placeholder="输入自定义互动内容..."
                    rows="3"
                  ></textarea>
                </div>

                <div class="preset-interactions">
                  <h4>预设互动</h4>
                  <div class="preset-buttons">
                    <button class="preset-btn" data-interaction="和观众打个招呼">
                      👋 和观众打个招呼
                    </button>
                    <button class="preset-btn" data-interaction="分享今天的心情">
                      😊 分享今天的心情
                    </button>
                    <button class="preset-btn" data-interaction="聊聊最近的趣事">
                      💬 聊聊最近的趣事
                    </button>
                    <button class="preset-btn" data-interaction="唱首歌给大家听">
                      🎵 唱首歌给大家听
                    </button>
                  </div>
                </div>

                <button class="start-live-btn" id="start-custom-live">
                  开始直播
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 渲染直播中界面
     */
    renderLiveView() {
      const state = this.stateManager.getCurrentState();

      // 渲染推荐互动按钮
      const recommendedButtons = state.recommendedInteractions
        .map(interaction => `<button class="rec-btn" data-interaction="${interaction}">${interaction}</button>`)
        .join('');

      // 渲染弹幕列表
      const danmakuItems = state.danmakuList
        .map(danmaku => {
          const sig = this.createDanmakuSignature(danmaku);
          const needAppearClass = this.pendingAppearDanmakuSigs.has(sig) ? ' need-appear' : '';
          if (danmaku.type === 'gift') {
            return `
            <div class="danmaku-item gift${needAppearClass}" data-sig="${sig}">
              <i class="fas fa-gift"></i>
              <span class="username">${danmaku.username}</span>
              <span class="content">送出 ${danmaku.content}</span>
            </div>
          `;
          } else {
            return `
            <div class="danmaku-item normal${needAppearClass}" data-sig="${sig}">
              <span class="username">${danmaku.username}:</span>
              <span class="content">${danmaku.content}</span>
            </div>
          `;
          }
        })
        .join('');

      return `
        <div class="live-app">
          <div class="live-container">
            <!-- 视频框 -->
            <div class="video-placeholder">
              <p class="live-content-text">${state.liveContent || '等待直播内容...'}</p>
              <div class="live-status-bottom">
                <div class="live-dot"></div>
                <span>LIVE</span>
              </div>
            </div>

            <!-- 推荐互动 -->
            <div class="interaction-panel">
              <div class="interaction-header">
                <h4>推荐互动：</h4>
                <button class="interact-btn" id="custom-interact-btn">
                  <i class="fas fa-pen-nib"></i> 自定义互动
                </button>
              </div>
              <div class="recommended-interactions">
                ${recommendedButtons || '<p class="no-interactions">等待推荐互动...</p>'}
              </div>
            </div>

            <!-- 弹幕容器 -->
            <div class="danmaku-container" id="danmaku-container">
              <div class="danmaku-list" id="danmaku-list">
                ${danmakuItems || '<div class="no-danmaku">等待弹幕...</div>'}
              </div>
            </div>
          </div>

          <!-- 自定义互动弹窗 -->
          <div id="interaction-modal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>自定义互动</h3>
                <button class="modal-close-btn">&times;</button>
              </div>
              <form id="interaction-form">
                <textarea id="custom-interaction-textarea" placeholder="输入你想说的内容..." rows="4"></textarea>
                <button type="submit" class="submit-btn">发送</button>
              </form>
            </div>
          </div>

          <!-- 礼物列表弹窗 -->
          <div id="gift-modal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>礼物流水</h3>
                <button class="modal-close-btn">&times;</button>
              </div>
              <ul class="gift-list">
                ${
                  state.giftList
                    .map(gift => {
                      const gsig = this.createGiftSignature(gift);
                      const needAppearClass = this.pendingAppearGiftSigs.has(gsig) ? ' need-appear' : '';
                      return `<li class="${needAppearClass.trim()}" data-sig="${gsig}"><span class="username">${
                        gift.username
                      }</span>送出 <span class="gift-name">${gift.gift}</span></li>`;
                    })
                    .join('') || '<li class="no-gifts">暂无礼物</li>'
                }
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
      console.log('[Live App] 绑定事件...');

      const appContainer = document.getElementById('app-content');
      if (!appContainer) {
        console.error('[Live App] 应用容器未找到');
        return;
      }

      try {
        // 开始直播相关事件
        if (this.currentView === 'start') {
          // 我要直播选项卡
          const startStreamingOption = appContainer.querySelector('#start-streaming-option');
          if (startStreamingOption) {
            startStreamingOption.addEventListener('click', async () => {
              // 直接显示弹窗，不设置渲染权
              this.showModal('start-live-modal');
            });
          }

          // 观看直播选项卡
          const watchStreamingOption = appContainer.querySelector('#watch-streaming-option');
          if (watchStreamingOption) {
            watchStreamingOption.addEventListener('click', async () => {
              // 直接跳转到观看直播应用，不设置渲染权
              if (window.mobilePhone && window.mobilePhone.openApp) {
                window.mobilePhone.openApp('watch-live');
              }
            });
          }

          // 自定义开始直播按钮（在弹窗中）
          const customStartBtn = appContainer.querySelector('#start-custom-live');
          if (customStartBtn) {
            customStartBtn.addEventListener('click', () => {
              const input = appContainer.querySelector('#custom-interaction-input');
              const interaction = input ? input.value.trim() : '';
              if (interaction) {
                this.hideModal('start-live-modal');
                this.startLive(interaction);
              } else {
                this.showToast('请输入互动内容', 'warning');
              }
            });
          }

          // 预设互动按钮（在弹窗中）
          appContainer.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const interaction = btn.dataset.interaction;
              if (interaction) {
                this.hideModal('start-live-modal');
                this.startLive(interaction);
              }
            });
          });
        }

        // 直播中相关事件
        if (this.currentView === 'live') {
          // 推荐互动按钮
          appContainer.querySelectorAll('.rec-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const interaction = btn.dataset.interaction;
              if (interaction) {
                this.continueInteraction(interaction);
              }
            });
          });

          // 自定义互动按钮
          const customInteractBtn = appContainer.querySelector('#custom-interact-btn');
          if (customInteractBtn) {
            customInteractBtn.addEventListener('click', () => {
              this.showModal('interaction-modal');
            });
          }

          // 自定义互动表单
          const interactionForm = appContainer.querySelector('#interaction-form');
          if (interactionForm) {
            interactionForm.addEventListener('submit', e => {
              e.preventDefault();
              const textarea = appContainer.querySelector('#custom-interaction-textarea');
              const interaction = textarea ? textarea.value.trim() : '';
              if (interaction) {
                this.continueInteraction(interaction);
                textarea.value = '';
                this.hideAllModals();
              } else {
                this.showToast('请输入互动内容', 'warning');
              }
            });
          }

          // 自动"跳转"弹幕到底部（瞬时、仅在未在底部时触发）
          const danmakuContainer = appContainer.querySelector('#danmaku-container');
          if (danmakuContainer) {
            this.jumpToBottomIfNeeded(danmakuContainer);
          }
        }

        // 弹窗关闭按钮（适用于所有视图）
        appContainer.querySelectorAll('.modal-close-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.hideAllModals();
          });
        });

        // 点击弹窗背景关闭（适用于所有视图）
        appContainer.querySelectorAll('.modal').forEach(modal => {
          modal.addEventListener('click', e => {
            if (e.target === modal) {
              this.hideAllModals();
            }
          });
        });

        console.log('[Live App] 事件绑定完成');
      } catch (error) {
        console.error('[Live App] 绑定事件时发生错误:', error);
        this.showToast('事件绑定失败: ' + error.message, 'error');
      }
    }

    // 若接近底部则保持不动；若不在底部则瞬时跳到底部
    jumpToBottomIfNeeded(container) {
      const threshold = 10; // px判定阈值
      const distanceToBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
      if (distanceToBottom > threshold) {
        // 瞬间跳转，无动画
        container.scrollTop = container.scrollHeight;
      }
    }

    /**
     * 显示弹窗
     */
    showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
      }
    }

    /**
     * 隐藏弹窗
     */
    hideModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    }

    /**
     * 隐藏所有弹窗
     */
    hideAllModals() {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('active');
      });
    }

    /**
     * 设置渲染权
     */
    async setRenderingRight(type) {
      try {
        console.log(`[Live App] 设置渲染权为: ${type}`);

        if (!window.mobileContextEditor) {
          console.warn('[Live App] 上下文编辑器未就绪，无法设置渲染权');
          return false;
        }

        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          console.warn('[Live App] 无聊天数据，无法设置渲染权');
          return false;
        }

        const firstMessage = chatData.messages[0];
        let originalContent = firstMessage.mes || '';

        // 检查是否已经包含渲染权标记
        const renderingRightRegex = /<!-- LIVE_RENDERING_RIGHT_START -->([\s\S]*?)<!-- LIVE_RENDERING_RIGHT_END -->/;
        const renderingRightSection = `<!-- LIVE_RENDERING_RIGHT_START -->\n[直播渲染权: ${type}]\n<!-- LIVE_RENDERING_RIGHT_END -->`;

        if (renderingRightRegex.test(originalContent)) {
          // 更新现有的渲染权标记
          originalContent = originalContent.replace(renderingRightRegex, renderingRightSection);
        } else {
          // 在内容开头添加渲染权标记
          originalContent = renderingRightSection + '\n\n' + originalContent;
        }

        // 更新第1楼层
        const success = await window.mobileContextEditor.modifyMessage(0, originalContent);
        if (success) {
          console.log(`[Live App] ✅ 渲染权已设置为: ${type}`);
          return true;
        } else {
          console.error('[Live App] 设置渲染权失败');
          return false;
        }
      } catch (error) {
        console.error('[Live App] 设置渲染权时出错:', error);
        return false;
      }
    }

    /**
     * 获取当前渲染权
     */
    getRenderingRight() {
      try {
        if (!window.mobileContextEditor) {
          return null;
        }

        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          return null;
        }

        const firstMessage = chatData.messages[0];
        const content = firstMessage.mes || '';

        const renderingRightRegex =
          /<!-- LIVE_RENDERING_RIGHT_START -->\s*\[直播渲染权:\s*(\w+)\]\s*<!-- LIVE_RENDERING_RIGHT_END -->/;
        const match = content.match(renderingRightRegex);

        return match ? match[1] : null;
      } catch (error) {
        console.error('[Live App] 获取渲染权时出错:', error);
        return null;
      }
    }

    /**
     * 清除渲染权
     */
    async clearRenderingRight() {
      try {
        console.log('[Live App] 清除渲染权');

        if (!window.mobileContextEditor) {
          console.warn('[Live App] 上下文编辑器未就绪，无法清除渲染权');
          return false;
        }

        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          console.warn('[Live App] 无聊天数据，无法清除渲染权');
          return false;
        }

        const firstMessage = chatData.messages[0];
        let originalContent = firstMessage.mes || '';

        // 移除渲染权标记
        const renderingRightRegex =
          /<!-- LIVE_RENDERING_RIGHT_START -->([\s\S]*?)<!-- LIVE_RENDERING_RIGHT_END -->\s*\n*/;
        if (renderingRightRegex.test(originalContent)) {
          originalContent = originalContent.replace(renderingRightRegex, '').trim();

          // 更新第1楼层
          const success = await window.mobileContextEditor.modifyMessage(0, originalContent);
          if (success) {
            console.log('[Live App] ✅ 渲染权已清除');
            return true;
          } else {
            console.error('[Live App] 清除渲染权失败');
            return false;
          }
        } else {
          console.log('[Live App] 没有找到渲染权标记');
          return true;
        }
      } catch (error) {
        console.error('[Live App] 清除渲染权时出错:', error);
        return false;
      }
    }

    /**
     * 发送消息到SillyTavern
     */
    async sendToSillyTavern(message) {
      try {
        console.log('[Live App] 发送消息到SillyTavern:', message);

        // 尝试找到文本输入框
        const textarea = document.querySelector('#send_textarea');
        if (!textarea) {
          console.error('[Live App] 未找到消息输入框');
          throw new Error('未找到消息输入框');
        }

        // 设置消息内容
        textarea.value = message;
        textarea.focus();

        // 触发输入事件
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // 触发发送按钮点击
        const sendButton = document.querySelector('#send_but');
        if (sendButton) {
          sendButton.click();
          console.log('[Live App] 已点击发送按钮');
          return true;
        }

        throw new Error('未找到发送按钮');
      } catch (error) {
        console.error('[Live App] 发送消息时出错:', error);
        throw error;
      }
    }

    /**
     * 将直播格式转换为直播历史格式
     */
    async convertLiveToHistory() {
      try {
        console.log('[Live App] 开始转换直播格式为直播历史格式');

        // 获取当前聊天数据
        const contextData = this.getChatData();
        if (!contextData || contextData.length === 0) {
          console.log('[Live App] 没有找到聊天数据');
          return;
        }

        // 查找包含直播内容的消息
        let hasLiveContent = false;
        let updatedCount = 0;
        const messagesToUpdate = []; // 收集需要更新的消息

        // 第一遍：收集所有需要转换的消息
        for (let i = 0; i < contextData.length; i++) {
          const message = contextData[i];
          const content = message.mes || message.content || '';

          if (content.includes('[直播|')) {
            hasLiveContent = true;
            // 转换格式
            const convertedContent = this.convertLiveFormats(content);

            if (convertedContent !== content) {
              messagesToUpdate.push({
                index: i,
                originalContent: content,
                convertedContent: convertedContent
              });
            }
          }
        }

        if (!hasLiveContent) {
          console.log('[Live App] 没有找到需要转换的直播内容');
          return;
        }

        // 第二遍：批量更新消息，减少频繁的DOM操作和保存
        console.log(`[Live App] 开始批量更新 ${messagesToUpdate.length} 条消息`);

        // 临时禁用自动保存机制，避免每次更新都触发保存
        const originalSaveChatDebounced = window.saveChatDebounced;
        const originalSaveChatConditional = window.saveChatConditional;

        // 临时替换为空函数
        if (window.saveChatDebounced) {
          window.saveChatDebounced = () => {};
        }
        if (window.saveChatConditional) {
          window.saveChatConditional = () => Promise.resolve();
        }

        try {
          for (const messageUpdate of messagesToUpdate) {
            // 批量处理时跳过自动保存，避免频繁保存
            const success = await this.updateMessageContent(messageUpdate.index, messageUpdate.convertedContent, true);
            if (success) {
              updatedCount++;
              console.log(
                `[Live App] 已转换消息 ${messageUpdate.index}，原始长度: ${messageUpdate.originalContent.length}，转换后长度: ${messageUpdate.convertedContent.length}`,
              );
            }
          }
        } finally {
          // 恢复原始的保存函数
          if (originalSaveChatDebounced) {
            window.saveChatDebounced = originalSaveChatDebounced;
          }
          if (originalSaveChatConditional) {
            window.saveChatConditional = originalSaveChatConditional;
          }
        }

        console.log(`[Live App] 直播格式转换完成，共更新了 ${updatedCount} 条消息`);

        // 只在最后保存一次聊天数据，避免频繁保存导致卡顿
        if (updatedCount > 0) {
          await this.saveChatData();
          console.log('[Live App] 转换完成并已保存聊天数据');
        }
      } catch (error) {
        console.error('[Live App] 转换直播格式失败:', error);
        this.showToast('转换直播格式失败: ' + error.message, 'error');
      }
    }

    /**
     * 转换直播格式字符串
     */
    convertLiveFormats(content) {
      let convertedContent = content;
      let conversionCount = 0;

      // 转换弹幕格式: [直播|用户|弹幕|内容] -> [直播历史|用户|弹幕|内容]
      const danmuMatches = convertedContent.match(/\[直播\|([^|]+)\|弹幕\|([^\]]+)\]/g);
      if (danmuMatches) {
        convertedContent = convertedContent.replace(/\[直播\|([^|]+)\|弹幕\|([^\]]+)\]/g, '[直播历史|$1|弹幕|$2]');
        conversionCount += danmuMatches.length;
      }

      // 转换礼物格式: [直播|用户|礼物|内容] -> [直播历史|用户|礼物|内容]
      // 转换打赏格式: [直播|用户|打赏|内容] -> [直播历史|用户|打赏|内容]
      const giftMatches = convertedContent.match(/\[直播\|([^|]+)\|(?:礼物|打赏)\|([^\]]+)\]/g);
      if (giftMatches) {
        convertedContent = convertedContent.replace(/\[直播\|([^|]+)\|礼物\|([^\]]+)\]/g, '[直播历史|$1|礼物|$2]');
        convertedContent = convertedContent.replace(/\[直播\|([^|]+)\|打赏\|([^\]]+)\]/g, '[直播历史|$1|打赏|$2]');
        conversionCount += giftMatches.length;
      }

      // 转换推荐互动格式: [直播|推荐互动|内容] -> [直播历史|推荐互动|内容]
      const recommendMatches = convertedContent.match(/\[直播\|推荐互动\|([^\]]+)\]/g);
      if (recommendMatches) {
        convertedContent = convertedContent.replace(/\[直播\|推荐互动\|([^\]]+)\]/g, '[直播历史|推荐互动|$1]');
        conversionCount += recommendMatches.length;
      }

      // 转换本场人数格式: [直播|本场人数|数字] -> [直播历史|本场人数|数字]
      const audienceMatches = convertedContent.match(/\[直播\|本场人数\|([^\]]+)\]/g);
      if (audienceMatches) {
        convertedContent = convertedContent.replace(/\[直播\|本场人数\|([^\]]+)\]/g, '[直播历史|本场人数|$1]');
        conversionCount += audienceMatches.length;
      }

      // 转换直播内容格式: [直播|直播内容|内容] -> [直播历史|直播内容|内容]
      const contentMatches = convertedContent.match(/\[直播\|直播内容\|([^\]]+)\]/g);
      if (contentMatches) {
        convertedContent = convertedContent.replace(/\[直播\|直播内容\|([^\]]+)\]/g, '[直播历史|直播内容|$1]');
        conversionCount += contentMatches.length;
      }

      // 转换其他可能的直播格式 (兼容旧格式)
      const otherMatches = convertedContent.match(/\[直播\|([^|]+)\|([^\]]+)\]/g);
      if (otherMatches) {
        // 排除已经处理过的格式
        const filteredMatches = otherMatches.filter(
          match =>
            !match.includes('弹幕|') &&
            !match.includes('礼物|') &&
            !match.includes('打赏|') &&
            !match.includes('推荐互动|') &&
            !match.includes('本场人数|') &&
            !match.includes('直播内容|'),
        );
        if (filteredMatches.length > 0) {
          convertedContent = convertedContent.replace(/\[直播\|([^|]+)\|([^\]]+)\]/g, (match, p1, p2) => {
            if (
              !match.includes('弹幕|') &&
              !match.includes('礼物|') &&
              !match.includes('打赏|') &&
              !match.includes('推荐互动|') &&
              !match.includes('本场人数|') &&
              !match.includes('直播内容|')
            ) {
              return `[直播历史|${p1}|${p2}]`;
            }
            return match;
          });
          conversionCount += filteredMatches.length;
        }
      }

      if (conversionCount > 0) {
        console.log(`[Live App] 转换了 ${conversionCount} 个直播格式`);
      }

      return convertedContent;
    }

    /**
     * 更新消息内容
     * @param {number} messageIndex - 消息索引
     * @param {string} newContent - 新内容
     * @param {boolean} skipAutoSave - 是否跳过自动保存（用于批量处理）
     */
    async updateMessageContent(messageIndex, newContent, skipAutoSave = false) {
      try {
        console.log(`[Live App] 正在更新消息 ${messageIndex}`);

        // 方法1: 使用与getChatData相同的方法获取chat数组（推荐，不会触发自动保存）
        let chat = null;

        // 优先使用SillyTavern.getContext().chat
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            chat = context.chat;
          }
        }

        // 如果上面的方法失败，尝试从全局变量获取
        if (!chat) {
          chat = window['chat'];
        }

        if (chat && Array.isArray(chat)) {
          // 添加边界检查
          if (messageIndex < 0 || messageIndex >= chat.length) {
            console.warn(`[Live App] 消息索引 ${messageIndex} 超出范围，chat数组长度: ${chat.length}`);
            return false;
          }

          if (!chat[messageIndex]) {
            console.warn(`[Live App] 消息索引 ${messageIndex} 处的消息不存在`);
            return false;
          }

          const originalContent = chat[messageIndex].mes || '';
          chat[messageIndex].mes = newContent;

          // 如果消息有swipes，也需要更新
          if (chat[messageIndex].swipes && chat[messageIndex].swipe_id !== undefined) {
            chat[messageIndex].swipes[chat[messageIndex].swipe_id] = newContent;
          }

          // 标记聊天数据已被修改
          if (window.chat_metadata) {
            window.chat_metadata.tainted = true;
          }

          console.log(
            `[Live App] 已更新消息 ${messageIndex}，原内容长度:${originalContent.length}，新内容长度:${newContent.length}`,
          );
          return true;
        }

        // 添加调试信息
        console.warn(`[Live App] 无法访问chat数组，chat类型: ${typeof chat}, 是否为数组: ${Array.isArray(chat)}`);
        if (chat && Array.isArray(chat)) {
          console.warn(`[Live App] chat数组长度: ${chat.length}, 请求的消息索引: ${messageIndex}`);
        }

        // 如果直接方法失败，尝试备用方法（即使在批量处理时也要尝试）
        // 方法2: 尝试通过编辑器功能更新（可能会触发自动保存）
        if (window.mobileContextEditor && window.mobileContextEditor.modifyMessage) {
          try {
            await window.mobileContextEditor.modifyMessage(messageIndex, newContent);
            console.log(`[Live App] 已通过mobileContextEditor更新消息 ${messageIndex}`);
            return true;
          } catch (error) {
            console.warn(`[Live App] mobileContextEditor更新失败:`, error);
          }
        }

        // 方法3: 尝试通过context-editor更新（可能会触发自动保存）
        if (window.contextEditor && window.contextEditor.modifyMessage) {
          try {
            await window.contextEditor.modifyMessage(messageIndex, newContent);
            console.log(`[Live App] 已通过contextEditor更新消息 ${messageIndex}`);
            return true;
          } catch (error) {
            console.warn(`[Live App] contextEditor更新失败:`, error);
          }
        }

        console.warn('[Live App] 没有找到有效的消息更新方法');
        return false;
      } catch (error) {
        console.error('[Live App] 更新消息内容失败:', error);
        return false;
      }
    }

    /**
     * 保存聊天数据
     */
    async saveChatData() {
      try {
        console.log('[Live App] 开始保存聊天数据...');

        // 方法1: 使用SillyTavern的保存函数
        if (typeof window.saveChatConditional === 'function') {
          await window.saveChatConditional();
          console.log('[Live App] 已通过saveChatConditional保存聊天数据');
          return true;
        }

        // 方法2: 使用延迟保存
        if (typeof window.saveChatDebounced === 'function') {
          window.saveChatDebounced();
          console.log('[Live App] 已通过saveChatDebounced保存聊天数据');
          // 等待一下确保保存完成
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }

        // 方法3: 使用编辑器的保存功能
        if (window.mobileContextEditor && typeof window.mobileContextEditor.saveChatData === 'function') {
          await window.mobileContextEditor.saveChatData();
          console.log('[Live App] 已通过mobileContextEditor保存聊天数据');
          return true;
        }

        // 方法4: 使用context-editor的保存功能
        if (window.contextEditor && typeof window.contextEditor.saveChatData === 'function') {
          await window.contextEditor.saveChatData();
          console.log('[Live App] 已通过contextEditor保存聊天数据');
          return true;
        }

        // 方法5: 尝试手动保存
        try {
          if (window.jQuery && window.chat && window.this_chid) {
            const response = await window.jQuery.ajax({
              type: 'POST',
              url: '/api/chats/save',
              data: JSON.stringify({
                ch_name: window.characters[window.this_chid]?.name || 'unknown',
                file_name: window.chat_metadata?.file_name || 'default',
                chat: window.chat,
                avatar_url: window.characters[window.this_chid]?.avatar || 'none',
              }),
              cache: false,
              dataType: 'json',
              contentType: 'application/json',
            });
            console.log('[Live App] 已通过手动AJAX保存聊天数据');
            return true;
          }
        } catch (ajaxError) {
          console.warn('[Live App] 手动AJAX保存失败:', ajaxError);
        }

        console.warn('[Live App] 没有找到有效的保存方法');
        return false;
      } catch (error) {
        console.error('[Live App] 保存聊天数据失败:', error);
        return false;
      }
    }

    /**
     * 获取聊天数据
     */
    getChatData() {
      try {
        // 优先使用SillyTavern.getContext().chat
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            return context.chat;
          }
        }

        // 尝试从全局变量获取
        const chat = window['chat'];
        if (chat && Array.isArray(chat)) {
          return chat;
        }

        return [];
      } catch (error) {
        console.error('[Live App] 获取聊天数据失败:', error);
        return [];
      }
    }

    /**
     * 更新header
     */
    updateHeader() {
      if (window.mobilePhone && window.mobilePhone.updateAppHeader) {
        const state = {
          app: 'live',
          title: this.currentView === 'live' ? '直播中' : '直播',
          view: this.currentView,
          viewerCount: this.stateManager.currentViewerCount,
        };
        window.mobilePhone.updateAppHeader(state);
      }
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `live-toast ${type}`;
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('show');
      }, 100);

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3000);
    }

    /**
     * 打字机效果：将文本逐字显示，速度适中
     */
    applyTypingEffect(element, fullText) {
      // 若正在打字，先终止
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }

      // 若内容相同且元素已经显示完整文本，则不重复打字
      if (element.getAttribute('data-full-text') === fullText && element.textContent === fullText) {
        return;
      }

      element.setAttribute('data-full-text', fullText);
      element.textContent = '';
      // 确保从顶部开始可见
      if (typeof element.scrollTop === 'number') {
        element.scrollTop = 0;
      }
      this.isTyping = true;

      const chars = Array.from(fullText);
      let index = 0;
      const stepMsHead = 35; // 前100字：逐字
      const stepMsTailChunk = 18; // 尾部：较快的块状显示（非逐字）
      const tailChunkSize = 6; // 每次追加的字符数（流畅但不突兀）

      // 在开始打字前确保滚动位置合理
      const danmakuContainer = document.getElementById('danmaku-container');
      if (danmakuContainer) {
        this.jumpToBottomIfNeeded(danmakuContainer);
      }

      this.typingTimer = setInterval(() => {
        if (index >= chars.length) {
          clearInterval(this.typingTimer);
          this.typingTimer = null;
          this.isTyping = false;
          return;
        }

        if (index < 100) {
          // 前100字逐字
          element.textContent += chars[index++];
        } else {
          // 之后采用块状追加
          const end = Math.min(index + tailChunkSize, chars.length);
          const slice = chars.slice(index, end).join('');
          element.textContent += slice;
          index = end;
          // 动态调整节奏：短暂停顿营造流畅感
          clearInterval(this.typingTimer);
          this.typingTimer = setInterval(() => {
            if (index >= chars.length) {
              clearInterval(this.typingTimer);
              this.typingTimer = null;
              this.isTyping = false;
              return;
            }
            const end2 = Math.min(index + tailChunkSize, chars.length);
            const slice2 = chars.slice(index, end2).join('');
            element.textContent += slice2;
            index = end2;
            if (index >= chars.length) {
              clearInterval(this.typingTimer);
              this.typingTimer = null;
              this.isTyping = false;
            }
          }, stepMsTailChunk);
        }
      }, stepMsHead);
    }

    /**
     * 销毁应用，清理资源
     */
    destroy() {
      console.log('[Live App] 销毁应用，清理资源');

      // 停止监听
      this.eventListener.stopListening();

      // 清理定时器
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }

      // 清空状态
      this.stateManager.clearAllData();

      // 重置状态
      this.isInitialized = false;
      this.currentView = 'start';
    }

    /**
     * 从最新楼层提取文本（优先使用 getChatMessages 接口）
     */
    getLatestFloorTextSafe() {
      try {
        const gm = (typeof window !== 'undefined' && (window.getChatMessages || globalThis.getChatMessages)) || null;
        if (typeof gm === 'function') {
          // 仅取最新楼层，优先 assistant
          const latestAssistant = gm(-1, { role: 'assistant' });
          if (Array.isArray(latestAssistant) && latestAssistant.length > 0 && latestAssistant[0]?.message) {
            return latestAssistant[0].message;
          }
          // 退化为任意角色
          const latestAny = gm(-1);
          if (Array.isArray(latestAny) && latestAny.length > 0 && latestAny[0]?.message) {
            return latestAny[0].message;
          }
        }
      } catch (e) {
        console.warn('[Live App] 获取最新楼层文本失败（getChatMessages）:', e);
      }

      // 兜底：从上下文数组拿最后一条
      try {
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && Array.isArray(context.chat) && context.chat.length > 0) {
            const last = context.chat[context.chat.length - 1];
            return last?.mes || '';
          }
        }
      } catch (e2) {
        console.warn('[Live App] 获取最新楼层文本失败（chat兜底）:', e2);
      }
      return '';
    }

    /** 生成弹幕签名（稳定，不含时间） */
    createDanmakuSignature(item) {
      const username = (item && item.username) || '';
      const content = (item && item.content) || '';
      const type = (item && item.type) || '';
      return `${username}|${content}|${type}`;
    }

    /** 生成礼物签名（稳定，不含时间） */
    createGiftSignature(item) {
      const username = (item && item.username) || '';
      const gift = (item && (item.gift || item.content)) || '';
      return `${username}|${gift}`;
    }

    /** 按顺序逐条显示需要动画的弹幕与礼物 */
    runAppearSequence() {
      try {
        const danmakuList = document.getElementById('danmaku-list');
        if (danmakuList) {
          const nodes = Array.from(danmakuList.querySelectorAll('.danmaku-item.need-appear'));
          // 初始渲染时先隐藏这些需要动画的节点（使用 display:none 避免空白）
          nodes.forEach(el => {
            el.style.display = 'none';
          });
          this.sequentialReveal(nodes);
        }

        const giftList = document.querySelector('.gift-list');
        if (giftList) {
          const giftNodes = Array.from(giftList.querySelectorAll('li.need-appear'));
          giftNodes.forEach(el => {
            el.style.display = 'none';
          });
          this.sequentialReveal(giftNodes);
        }

        // 清空待动画集合，避免重复动画
        this.pendingAppearDanmakuSigs.clear();
        this.pendingAppearGiftSigs.clear();
      } catch (e) {
        console.warn('[Live App] 逐条出现动画执行失败:', e);
      }
    }

    /** 依次为节点添加 appear-init → appear-show（带间隔） */
    sequentialReveal(nodes) {
      if (!nodes || nodes.length === 0) return;

      // 初始状态（先隐藏，避免“跳一下”），随后统一交由 CSS 过渡
      nodes.forEach(el => {
        el.classList.remove('need-appear', 'appear-show');
        el.classList.add('appear-init');
        // 使用 display:none 避免占位
        el.style.display = 'none';
      });

      // 逐条显示：每条约 700ms 一条（更慢），单条过渡 ~300ms（参见CSS）
      const baseDelay = 150;
      const stepDelay = 700; // ≈ 0.7 秒/条
      nodes.forEach((el, idx) => {
        setTimeout(() => {
          // 显示并触发过渡
          el.style.display = '';
          // 强制触发一次 reflow，保证过渡生效
          // eslint-disable-next-line no-unused-expressions
          el.offsetHeight;
          el.classList.add('appear-show');
          // 每条出现后，若容器存在则将其滚动到可见底部（瞬时，无动画）
          const container = document.getElementById('danmaku-container');
          if (container && el?.scrollIntoView) {
            el.scrollIntoView({ block: 'end', inline: 'nearest' });
          }
        }, baseDelay + idx * stepDelay);
      });
    }
  }

  // 创建全局实例
  window.LiveApp = LiveApp;
  window.liveApp = new LiveApp();
} // 结束类定义检查

// 全局函数供调用
window.getLiveAppContent = function () {
  console.log('[Live App] 获取直播应用内容');

  if (!window.liveApp) {
    console.error('[Live App] liveApp实例不存在');
    return '<div class="error-message">直播应用加载失败</div>';
  }

  try {
    // 每次获取内容时都重新检测活跃直播状态
    window.liveApp.detectActiveLive();
    return window.liveApp.getAppContent();
  } catch (error) {
    console.error('[Live App] 获取应用内容失败:', error);
    return '<div class="error-message">直播应用内容加载失败</div>';
  }
};

window.bindLiveAppEvents = function () {
  console.log('[Live App] 绑定直播应用事件');

  if (!window.liveApp) {
    console.error('[Live App] liveApp实例不存在');
    return;
  }

  try {
    // 延迟绑定，确保DOM完全加载
    setTimeout(() => {
      window.liveApp.bindEvents();
      window.liveApp.updateHeader();
    }, 100);
  } catch (error) {
    console.error('[Live App] 绑定事件失败:', error);
  }
};

// 其他全局函数
window.liveAppStartLive = function (interaction) {
  if (window.liveApp) {
    window.liveApp.startLive(interaction);
  }
};

window.liveAppEndLive = function () {
  if (window.liveApp) {
    window.liveApp.endLive();
  }
};

window.liveAppShowModal = function (modalId) {
  if (window.liveApp) {
    window.liveApp.showModal(modalId);
  }
};

window.liveAppHideModal = function (modalId) {
  if (window.liveApp) {
    window.liveApp.hideModal(modalId);
  }
};

window.liveAppDestroy = function () {
  if (window.liveApp) {
    window.liveApp.destroy();
    console.log('[Live App] 应用已销毁');
  }
};

window.liveAppDetectActive = function () {
  if (window.liveApp) {
    console.log('[Live App] 🔍 手动检测活跃直播状态...');
    window.liveApp.detectActiveLive();

    // 更新界面
    if (typeof window.bindLiveAppEvents === 'function') {
      window.bindLiveAppEvents();
    }

    console.log('[Live App] ✅ 检测完成，当前状态:', {
      view: window.liveApp.currentView,
      isLiveActive: window.liveApp.isLiveActive,
    });
  } else {
    console.error('[Live App] liveApp实例不存在');
  }
};

window.liveAppForceReload = function () {
  console.log('[Live App] 🔄 强制重新加载应用...');

  // 先销毁旧实例
  if (window.liveApp) {
    window.liveApp.destroy();
  }

  // 创建新实例
  window.liveApp = new LiveApp();
  console.log('[Live App] ✅ 应用已重新加载');
};

// 测试转换功能
window.liveAppTestConversion = function () {
  console.log('[Live App] 🧪 测试转换功能...');

  if (!window.liveApp) {
    console.error('[Live App] liveApp实例不存在');
    return;
  }

  const testContent = `这是一条测试消息
[直播|小明|弹幕|主播你好！今天吃的什么呀？]
[直播|小红|礼物|璀璨火箭*2]
[直播|推荐互动|回答小明的弹幕问题]
[直播|推荐互动|感谢小红的礼物]
[直播|本场人数|55535]
[直播|直播内容|你微笑着调整了一下耳机，准备开始今天的杂谈直播。]
测试结束`;

  console.log('原始内容:', testContent);
  const converted = window.liveApp.convertLiveFormats(testContent);
  console.log('转换后内容:', converted);

  return converted;
};

// 测试布局高度
window.liveAppTestLayout = function () {
  console.log('[Live App] 📐 测试布局高度...');

  const appContent = document.getElementById('app-content');
  if (!appContent) {
    console.error('[Live App] app-content元素不存在');
    return;
  }

  const liveContainer = appContent.querySelector('.live-container');
  if (!liveContainer) {
    console.error('[Live App] live-container元素不存在');
    return;
  }

  const videoBox = liveContainer.querySelector('.video-placeholder');
  const interactionPanel = liveContainer.querySelector('.interaction-panel');
  const danmakuContainer = liveContainer.querySelector('.danmaku-container');

  const measurements = {
    appContent: {
      height: appContent.offsetHeight,
      scrollHeight: appContent.scrollHeight,
      clientHeight: appContent.clientHeight,
    },
    liveContainer: {
      height: liveContainer.offsetHeight,
      scrollHeight: liveContainer.scrollHeight,
      clientHeight: liveContainer.clientHeight,
    },
    videoBox: videoBox
      ? {
          height: videoBox.offsetHeight,
          scrollHeight: videoBox.scrollHeight,
          clientHeight: videoBox.clientHeight,
        }
      : null,
    interactionPanel: interactionPanel
      ? {
          height: interactionPanel.offsetHeight,
          scrollHeight: interactionPanel.scrollHeight,
          clientHeight: interactionPanel.clientHeight,
        }
      : null,
    danmakuContainer: danmakuContainer
      ? {
          height: danmakuContainer.offsetHeight,
          scrollHeight: danmakuContainer.scrollHeight,
          clientHeight: danmakuContainer.clientHeight,
        }
      : null,
  };

  console.log('[Live App] 📐 布局测量结果:', measurements);

  // 检查是否有溢出
  const hasOverflow = measurements.liveContainer.scrollHeight > measurements.liveContainer.clientHeight;
  const danmakuCanScroll =
    measurements.danmakuContainer &&
    measurements.danmakuContainer.scrollHeight > measurements.danmakuContainer.clientHeight;

  console.log('[Live App] 📐 布局检查:');
  console.log(`- 容器是否溢出: ${hasOverflow ? '❌ 是' : '✅ 否'}`);
  console.log(`- 弹幕是否可滚动: ${danmakuCanScroll ? '✅ 是' : '❌ 否'}`);

  return measurements;
};

// 测试函数
window.liveAppTest = function () {
  console.log('[Live App] 🧪 开始测试直播应用...');

  const tests = [
    {
      name: '检查LiveApp类是否存在',
      test: () => typeof window.LiveApp === 'function',
    },
    {
      name: '检查liveApp实例是否存在',
      test: () => window.liveApp instanceof window.LiveApp,
    },
    {
      name: '检查全局函数是否存在',
      test: () => typeof window.getLiveAppContent === 'function' && typeof window.bindLiveAppEvents === 'function',
    },
    {
      name: '检查数据解析器',
      test: () => {
        const parser = new window.LiveApp().dataParser;
        const testData = parser.parseLiveData('[直播|本场人数|1234][直播|直播内容|测试内容][直播|用户1|弹幕|测试弹幕]');
        return (
          testData.viewerCount === '1.2K' && testData.liveContent === '测试内容' && testData.danmakuList.length === 1
        );
      },
    },
    {
      name: '检查应用内容生成',
      test: () => {
        const content = window.getLiveAppContent();
        return typeof content === 'string' && content.includes('live-app');
      },
    },
    {
      name: '检查活跃直播检测',
      test: () => {
        const app = new window.LiveApp();
        const testContent1 = '[直播|本场人数|1234][直播|直播内容|测试内容]';
        const testContent2 = '[直播历史|本场人数|1234][直播历史|直播内容|测试内容]';
        const testContent3 = '没有直播内容的普通聊天';

        return (
          app.hasActiveLiveFormats(testContent1) === true &&
          app.hasActiveLiveFormats(testContent2) === false &&
          app.hasActiveLiveFormats(testContent3) === false
        );
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ ${test.name}: 通过`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: 失败`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: 错误 - ${error.message}`);
      failed++;
    }
  });

  console.log(`[Live App] 🧪 测试完成: ${passed} 通过, ${failed} 失败`);

  if (failed === 0) {
    console.log('[Live App] 🎉 所有测试通过！直播应用已准备就绪');
  } else {
    console.log('[Live App] ⚠️ 部分测试失败，请检查相关功能');
  }

  return { passed, failed, total: tests.length };
};

console.log('[Live App] 直播应用模块加载完成');
console.log('[Live App] 💡 可用的函数:');
console.log('[Live App] - liveAppTest() 测试应用功能');
console.log('[Live App] - liveAppTestConversion() 测试格式转换功能');
console.log('[Live App] - liveAppTestLayout() 测试布局高度');
console.log('[Live App] - liveAppDetectActive() 手动检测活跃直播状态');
console.log('[Live App] - liveAppForceReload() 强制重新加载应用');
