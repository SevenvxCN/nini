// ==SillyTavern Weibo Manager==
// @name         Weibo Manager for Mobile Extension
// @version      1.0.0
// @description  微博自动更新管理器
// @author       Assistant

// 防止重复加载
if (typeof window.WeiboManager !== 'undefined') {
  console.log('[Weibo Manager] 已存在，跳过重复加载');
} else {
  /**
   * 微博管理器类
   * 负责管理微博内容生成、API调用和与上下文编辑器的集成
   */
  class WeiboManager {
    constructor() {
      this.isInitialized = false;
      this.currentSettings = {
        enabled: true,
        autoUpdate: true,
        threshold: 10,
        apiConfig: {
          url: '',
          apiKey: '',
          model: '',
        },
      };
      this.isProcessing = false;
      this.lastProcessedCount = 0;

      // 用户账户管理
      this.currentAccount = {
        isMainAccount: true, // true为大号，false为小号
        mainAccountName: '{{user}}', // 大号用户名
        aliasAccountName: 'Alias', // 小号用户名
        currentPage: 'hot', // 当前页面：hot, ranking, user
      };

      // 生成状态监控相关
      this.isMonitoringGeneration = false;
      this.pendingInsertions = [];
      this.generationCheckInterval = null;
      this.statusUpdateTimer = null;
      this.maxWaitTime = 300000; // 最大等待时间: 5分钟

      // 重试机制配置 - 已禁用自动重试
      this.retryConfig = {
        maxRetries: 0, // 禁用自动重试
        retryDelay: 60000, // 重试延迟: 1分钟（保留配置但不使用）
        currentRetryCount: 0, // 当前重试次数
        lastFailTime: null, // 上次失败时间
        autoRetryEnabled: false, // 明确禁用自动重试
      };

      // 绑定方法
      this.initialize = this.initialize.bind(this);
      this.generateWeiboContent = this.generateWeiboContent.bind(this);
      this.updateContextWithWeibo = this.updateContextWithWeibo.bind(this);
      this.checkGenerationStatus = this.checkGenerationStatus.bind(this);
      this.waitForGenerationComplete = this.waitForGenerationComplete.bind(this);
      this.processInsertionQueue = this.processInsertionQueue.bind(this);
      this.scheduleRetry = this.scheduleRetry.bind(this);
    }

    /**
     * 初始化微博管理器
     */
    async initialize() {
      try {
        console.log('[Weibo Manager] 初始化开始...');

        // 加载设置
        this.loadSettings();

        // 等待其他模块初始化完成
        await this.waitForDependencies();

        // 加载账户设置
        this.loadAccountSettings();

        this.isInitialized = true;
        console.log('[Weibo Manager] ✅ 初始化完成');

        // 浏览器兼容性检测和提示
        this.detectBrowserAndShowTips();
      } catch (error) {
        console.error('[Weibo Manager] 初始化失败:', error);
      }
    }

    /**
     * 检测浏览器并显示兼容性提示
     */
    detectBrowserAndShowTips() {
      const userAgent = navigator.userAgent;
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isVia = /Via/.test(userAgent);

      if (isSafari || isVia) {
        console.log('%c🍎 Safari/Via兼容性提示', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
        console.log(
          '%c如果遇到按钮无响应问题，请运行: MobileContext.fixBrowserCompatibility()',
          'color: #4ecdc4; font-size: 12px;',
        );
        console.log('%c更多诊断信息: MobileContext.quickDiagnosis()', 'color: #45b7d1; font-size: 12px;');
      }
    }

    /**
     * 等待依赖模块加载完成 - 优化版本，减少刷屏
     */
    async waitForDependencies() {
      return new Promise(resolve => {
        let checkCount = 0;
        const maxChecks = 20; // 减少到20次检查（10秒）
        let lastLogTime = 0;

        const checkDeps = () => {
          checkCount++;
          const contextEditorReady = window.mobileContextEditor !== undefined;
          const customAPIReady = window.mobileCustomAPIConfig !== undefined;
          let weiboStylesReady = window.weiboStyles !== undefined;

          // 🔧 如果 weiboStyles 未定义，尝试加载和创建
          if (!weiboStylesReady) {
            if (typeof window.WeiboStyles !== 'undefined') {
              console.log('[Weibo Manager] 🔧 检测到 WeiboStyles 类存在但实例未创建，尝试手动创建...');
              try {
                window.weiboStyles = new window.WeiboStyles();
                weiboStylesReady = true;
                console.log('[Weibo Manager] ✅ 手动创建 weiboStyles 实例成功');
              } catch (error) {
                console.error('[Weibo Manager] ❌ 手动创建 weiboStyles 实例失败:', error);
              }
            } else {
              // WeiboStyles 类也不存在，尝试动态加载
              console.log('[Weibo Manager] 🔄 WeiboStyles 类不存在，尝试动态加载 weibo-styles.js...');
              try {
                const script = document.createElement('script');
                script.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-styles.js';
                script.async = false; // 同步加载

                // 使用 Promise 等待加载完成
                const loadPromise = new Promise(resolve => {
                  script.onload = () => {
                    console.log('[Weibo Manager] ✅ 动态加载 weibo-styles.js 成功');
                    if (typeof window.weiboStyles !== 'undefined') {
                      weiboStylesReady = true;
                      console.log('[Weibo Manager] ✅ weiboStyles 实例已创建');
                    }
                    resolve();
                  };
                  script.onerror = () => {
                    console.error('[Weibo Manager] ❌ 动态加载 weibo-styles.js 失败');
                    resolve();
                  };
                });

                document.head.appendChild(script);

                // 等待一小段时间让脚本执行（使用同步方式）
                setTimeout(() => {
                  weiboStylesReady = window.weiboStyles !== undefined;
                }, 100);
              } catch (error) {
                console.error('[Weibo Manager] ❌ 动态加载过程失败:', error);
              }
            }
          }

          if (contextEditorReady && customAPIReady && weiboStylesReady) {
            console.log('[Weibo Manager] ✅ 所有依赖模块已就绪');
            resolve();
            return;
          }

          if (checkCount >= maxChecks) {
            console.warn('[Weibo Manager] ⚠️ 依赖等待超时，继续初始化（部分功能可能受限）');
            console.log('[Weibo Manager] 🔍 最终依赖状态:', {
              contextEditor: contextEditorReady,
              customAPI: customAPIReady,
              weiboStyles: weiboStylesReady,
              weiboStylesType: typeof window.weiboStyles,
              weiboStylesClass: typeof window.WeiboStyles,
              allWeiboKeys: Object.keys(window).filter(key => key.toLowerCase().includes('weibo')),
            });
            resolve();
            return;
          }

          // 大幅减少日志输出：只在第1次、第5次、第10次、第15次输出
          const shouldLog = checkCount === 1 || checkCount === 5 || checkCount === 10 || checkCount === 15;
          if (shouldLog) {
            console.log(`[Weibo Manager] 等待依赖模块 (${checkCount}/${maxChecks})...`, {
              contextEditor: contextEditorReady,
              customAPI: customAPIReady,
              weiboStyles: weiboStylesReady,
              weiboStylesType: typeof window.weiboStyles,
              weiboStylesClass: typeof window.WeiboStyles,
            });
          }

          setTimeout(checkDeps, 500);
        };

        checkDeps();
      });
    }

    /**
     * 加载设置
     */
    loadSettings() {
      try {
        const saved = localStorage.getItem('mobile_weibo_settings');
        if (saved) {
          const settings = JSON.parse(saved);
          this.currentSettings = { ...this.currentSettings, ...settings };
          console.log('[Weibo Manager] 设置已加载:', this.currentSettings);
        }
      } catch (error) {
        console.warn('[Weibo Manager] 加载设置失败:', error);
      }
    }

    /**
     * 保存设置
     */
    saveSettings() {
      try {
        localStorage.setItem('mobile_weibo_settings', JSON.stringify(this.currentSettings));
        console.log('[Weibo Manager] 设置已保存:', this.currentSettings);
      } catch (error) {
        console.warn('[Weibo Manager] 保存设置失败:', error);
      }
    }

    /**
     * 加载账户设置
     */
    loadAccountSettings() {
      try {
        const saved = localStorage.getItem('mobile_weibo_account');
        if (saved) {
          const account = JSON.parse(saved);
          this.currentAccount = { ...this.currentAccount, ...account };
          console.log('[Weibo Manager] 账户设置已加载:', this.currentAccount);
        }
      } catch (error) {
        console.warn('[Weibo Manager] 加载账户设置失败:', error);
      }
    }

    /**
     * 保存账户设置
     */
    saveAccountSettings() {
      try {
        localStorage.setItem('mobile_weibo_account', JSON.stringify(this.currentAccount));
        console.log('[Weibo Manager] 账户设置已保存:', this.currentAccount);
      } catch (error) {
        console.warn('[Weibo Manager] 保存账户设置失败:', error);
      }
    }

    /**
     * 切换账户（大号/小号）
     */
    switchAccount() {
      this.currentAccount.isMainAccount = !this.currentAccount.isMainAccount;
      this.saveAccountSettings();

      // 更新上下文编辑器中的渲染值
      this.updateAccountStatusInContext();

      console.log('[Weibo Manager] 账户已切换:', this.currentAccount.isMainAccount ? '大号' : '小号');
      return this.currentAccount.isMainAccount;
    }

    /**
     * 设置用户名
     */
    setUsername(username, isMainAccount = null) {
      if (isMainAccount === null) {
        isMainAccount = this.currentAccount.isMainAccount;
      }

      if (isMainAccount) {
        this.currentAccount.mainAccountName = username || '{{user}}';
      } else {
        this.currentAccount.aliasAccountName = username || 'Alias';
      }

      this.saveAccountSettings();
      console.log('[Weibo Manager] 用户名已更新:', {
        isMainAccount,
        username: isMainAccount ? this.currentAccount.mainAccountName : this.currentAccount.aliasAccountName,
      });
    }

    /**
     * 获取当前用户名
     */
    getCurrentUsername() {
      return this.currentAccount.isMainAccount
        ? this.currentAccount.mainAccountName
        : this.currentAccount.aliasAccountName;
    }

    /**
     * 设置当前页面
     */
    setCurrentPage(page) {
      if (['hot', 'ranking', 'user'].includes(page)) {
        this.currentAccount.currentPage = page;
        this.saveAccountSettings();
        console.log('[Weibo Manager] 当前页面已设置:', page);
      }
    }

    /**
     * 更新上下文编辑器中的账户状态渲染值
     */
    async updateAccountStatusInContext() {
      try {
        if (!window.mobileContextEditor) {
          console.warn('[Weibo Manager] 上下文编辑器未就绪，无法更新账户状态');
          return;
        }

        const accountStatus = this.currentAccount.isMainAccount ? '大号' : '小号';
        const renderValue = `当前微博账户：${accountStatus}`;

        // 这里需要调用上下文编辑器的方法来注入渲染值
        // 具体实现需要根据上下文编辑器的API来调整
        console.log('[Weibo Manager] 账户状态渲染值:', renderValue);
      } catch (error) {
        console.error('[Weibo Manager] 更新账户状态失败:', error);
      }
    }

    /**
     * 生成微博内容
     */
    async generateWeiboContent(force = false) {
      // 记录调用源
      const caller = force ? '手动强制生成' : '自动检查生成';
      console.log(`[Weibo Manager] 📞 调用源: ${caller}`);

      // 🔧 增强API配置检查 - 修复连续弹窗问题
      if (!this.isAPIConfigValid()) {
        const errorMsg = '请先配置API';
        console.warn(`[Weibo Manager] ❌ API配置无效: ${errorMsg}`);

        // 如果是自动触发的检查，静默失败，不显示弹窗
        if (!force) {
          console.log('[Weibo Manager] 自动检查模式下API配置无效，静默跳过，不弹窗');
          // 临时禁用auto-listener，避免连续触发
          if (window.weiboAutoListener) {
            window.weiboAutoListener.disable();
            console.log('[Weibo Manager] 已临时禁用auto-listener，避免连续失败');
          }
          return false;
        }

        // 只有手动强制生成时才显示错误
        this.updateStatus(`生成失败: ${errorMsg}`, 'error');
        if (window.showMobileToast) {
          window.showMobileToast(`❌ 微博生成失败: ${errorMsg}`, 'error');
        }
        return false;
      }

      // 如果是强制模式，立即阻止auto-listener
      if (force && window.weiboAutoListener) {
        if (window.weiboAutoListener.isProcessingRequest) {
          console.log('[Weibo Manager] ⚠️ auto-listener正在处理，但强制生成优先');
        }
        window.weiboAutoListener.isProcessingRequest = true;
        console.log('[Weibo Manager] 🚫 已阻止auto-listener干扰');
      }

      // 严格的重复请求防护 - 增强Safari兼容性
      if (this.isProcessing) {
        console.log('[Weibo Manager] 检测到正在处理中，检查是否为Safari兼容性问题...');

        // Safari兼容性处理：如果是强制模式，给予一次机会重置状态
        if (force) {
          console.log('[Weibo Manager] 🍎 Safari兼容模式：强制重置状态');
          this.isProcessing = false;
          if (window.weiboAutoListener) {
            window.weiboAutoListener.isProcessingRequest = false;
          }
          // 继续执行，不返回false
        } else {
          console.log('[Weibo Manager] 正在处理中，跳过重复请求');
          this.updateStatus('正在处理中，请稍候...', 'warning');

          // 如果是强制模式，恢复auto-listener状态
          if (force && window.weiboAutoListener) {
            window.weiboAutoListener.isProcessingRequest = false;
          }
          return false;
        }
      }

      // 如果是强制模式，临时暂停auto-listener
      let autoListenerPaused = false;
      if (force && window.weiboAutoListener && window.weiboAutoListener.isListening) {
        autoListenerPaused = true;
        // 设置处理请求锁，阻止auto-listener触发
        window.weiboAutoListener.isProcessingRequest = true;
        console.log('[Weibo Manager] 🔄 临时暂停auto-listener（设置处理锁）');
      }

      // 检查是否有足够的消息变化
      try {
        const chatData = await this.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          console.log('[Weibo Manager] 无聊天数据，跳过生成');
          return false;
        }

        // 只有在非强制模式下才检查消息增量
        if (!force) {
          // 检查是否有足够的新消息
          const currentCount = chatData.messages.length;
          const increment = currentCount - this.lastProcessedCount;

          if (increment < this.currentSettings.threshold) {
            console.log(
              `[Weibo Manager] [自动检查] 消息增量不足 (${increment}/${this.currentSettings.threshold})，跳过生成`,
            );
            return false;
          }
        } else {
          console.log('[Weibo Manager] 🚀 强制生成模式，跳过消息增量检查');
        }

        // 开始处理
        this.isProcessing = true;
        this.updateStatus('正在生成微博内容...', 'info');

        const currentCount = chatData.messages.length;
        const increment = currentCount - this.lastProcessedCount;
        console.log(
          `[Weibo Manager] 开始生成微博内容 (消息数: ${currentCount}, 增量: ${increment}, 强制模式: ${force})`,
        );

        // 调用API生成微博内容
        const weiboContent = await this.callWeiboAPI(chatData);
        if (!weiboContent) {
          throw new Error('API返回空内容');
        }

        // 通过上下文编辑器安全更新到第1楼层（带生成状态检查）
        const success = await this.safeUpdateContextWithWeibo(weiboContent);
        if (success) {
          this.updateStatus('微博内容已添加到第1楼层', 'success');
          this.lastProcessedCount = currentCount;

          // 同步到auto-listener
          if (window.weiboAutoListener) {
            window.weiboAutoListener.lastProcessedMessageCount = currentCount;
          }

          // 刷新微博UI界面以显示新内容
          this.clearWeiboUICache();

          console.log(`[Weibo Manager] ✅ 微博内容生成成功`);
          return true;
        } else {
          throw new Error('更新上下文失败');
        }
      } catch (error) {
        // 🔧 增强错误处理 - 防止连续弹窗
        console.error('[Weibo Manager] 生成微博内容失败:', error);
        this.updateStatus(`生成失败: ${error.message}`, 'error');

        // 如果是API配置错误，临时禁用auto-listener避免连续失败
        if (error.message.includes('请先配置API') || error.message.includes('API配置')) {
          if (window.weiboAutoListener && !force) {
            window.weiboAutoListener.disable();
            console.log('[Weibo Manager] API配置错误，已临时禁用auto-listener');
          }
        }

        // 只有手动强制生成时才显示弹窗错误提示
        if (force && window.showMobileToast) {
          window.showMobileToast(`❌ 微博生成失败: ${error.message}`, 'error');
        } else if (!force) {
          console.log('[Weibo Manager] 自动生成失败，不显示弹窗，避免干扰用户');
        }

        // 重置重试计数器
        this.resetRetryConfig();

        console.log('[Weibo Manager] ⏳ 已取消自动重试，将等待下次楼层变化阈值达标后重新尝试');
        return false;
      } finally {
        // 确保状态被重置
        this.isProcessing = false;

        // 恢复auto-listener
        if (autoListenerPaused && force) {
          setTimeout(() => {
            if (window.weiboAutoListener) {
              window.weiboAutoListener.isProcessingRequest = false;
              console.log('[Weibo Manager] 🔄 恢复auto-listener（释放处理锁）');
            }
          }, 2000); // 2秒后恢复，确保手动操作完成
        }

        // 强制重置状态，防止卡住
        setTimeout(() => {
          if (this.isProcessing) {
            console.warn('[Weibo Manager] 强制重置处理状态');
            this.isProcessing = false;
          }
        }, 5000);

        // 通知auto-listener处理完成
        if (window.weiboAutoListener) {
          window.weiboAutoListener.isProcessingRequest = false;
        }
      }
    }

    /**
     * 获取当前聊天数据
     */
    async getCurrentChatData() {
      try {
        if (window.mobileContextEditor) {
          return window.mobileContextEditor.getCurrentChatData();
        } else if (window.MobileContext) {
          return await window.MobileContext.loadChatToEditor();
        } else {
          throw new Error('上下文编辑器未就绪');
        }
      } catch (error) {
        console.error('[Weibo Manager] 获取聊天数据失败:', error);
        throw error;
      }
    }

    /**
     * 检查API配置是否有效（修复Gemini URL检查问题）
     */
    isAPIConfigValid() {
      if (!window.mobileCustomAPIConfig) {
        console.warn('[Weibo Manager] mobileCustomAPIConfig 未找到');
        return false;
      }

      const config = window.mobileCustomAPIConfig;
      const settings = config.currentSettings;

      // 检查基本配置
      if (!settings.enabled) {
        console.warn('[Weibo Manager] API未启用');
        return false;
      }

      if (!settings.model) {
        console.warn('[Weibo Manager] 未选择模型');
        return false;
      }

      // 检查API密钥（如果需要的话）
      const providerConfig = config.supportedProviders[settings.provider];
      if (providerConfig?.requiresKey && !settings.apiKey) {
        console.warn('[Weibo Manager] 缺少API密钥');
        return false;
      }

      // 检查API URL - 修复Gemini URL检查问题
      let apiUrl;
      if (settings.provider === 'gemini') {
        // Gemini使用内置URL
        apiUrl = config.geminiUrl || config.supportedProviders.gemini.defaultUrl;
      } else {
        // 其他服务商使用配置中的URL
        apiUrl = settings.apiUrl || providerConfig?.defaultUrl;
      }

      if (!apiUrl) {
        console.warn('[Weibo Manager] 缺少API URL');
        return false;
      }

      console.log('[Weibo Manager] ✅ API配置检查通过:', {
        provider: settings.provider,
        hasApiKey: !!settings.apiKey,
        hasModel: !!settings.model,
        hasUrl: !!apiUrl,
        enabled: settings.enabled
      });

      return true;
    }

    /**
     * 调用微博API
     */
    async callWeiboAPI(chatData) {
      try {
        console.log('🚀 [微博API] ===== 开始生成微博内容 =====');

        // 使用增强的API配置检查
        if (!this.isAPIConfigValid()) {
          throw new Error('请先配置API');
        }

        // 构建上下文信息
        const contextInfo = this.buildContextInfo(chatData);

        // 获取风格提示词（立即生成微博）
        const stylePrompt = window.weiboStyles
          ? window.weiboStyles.getStylePrompt(
              'generate',
              this.currentAccount.isMainAccount,
              this.currentAccount.currentPage,
            )
          : '';

        console.log('📋 [微博API] 系统提示词（立即生成微博）:');
        console.log(stylePrompt);
        console.log('\n📝 [微博API] 用户消息内容:');
        console.log(`请根据以下聊天记录生成微博内容：\n\n${contextInfo}`);

        // 构建API请求
        const messages = [
          {
            role: 'system',
            content: `${stylePrompt}\n\n🎯 【特别注意】：\n- 重点关注用户的发博和回博内容，它们标记有⭐和特殊说明\n- 延续用户的语言风格、话题偏好和互动习惯\n- 让微博内容体现用户的参与特点和行为模式\n- 如果用户有特定的观点或兴趣，请在微博中适当呼应`,
          },
          {
            role: 'user',
            content: `🎯 请根据以下聊天记录生成微博内容，特别注意用户的发博和回博模式：\n\n${contextInfo}`,
          },
        ];

        console.log('📡 [微博API] 完整API请求:');
        console.log(JSON.stringify(messages, null, 2));

        // 调用API
        const response = await window.mobileCustomAPIConfig.callAPI(messages, {
          temperature: 0.8,
          max_tokens: 2000,
        });

        console.log('📥 [微博API] 模型返回内容:');
        console.log(response);

        if (response && response.content) {
          console.log('✅ [微博API] 生成的微博内容:');
          console.log(response.content);
          console.log('🏁 [微博API] ===== 微博内容生成完成 =====\n');
          return response.content;
        } else {
          throw new Error('API返回格式错误');
        }
      } catch (error) {
        console.error('❌ [微博API] API调用失败:', error);
        console.log('🏁 [微博API] ===== 微博内容生成失败 =====\n');
        throw error;
      }
    }

    /**
     * 构建上下文信息（只发送倒数5层楼和第1层楼）
     */
    buildContextInfo(chatData) {
      let contextInfo = `角色: ${chatData.characterName || '未知'}\n`;
      contextInfo += `消息数量: ${chatData.messages.length}\n`;
      contextInfo += `当前账户: ${this.currentAccount.isMainAccount ? '大号' : '小号'}\n`;
      contextInfo += `当前用户名: ${this.getCurrentUsername()}\n`;
      contextInfo += `当前页面: ${this.currentAccount.currentPage}\n\n`;

      const messages = chatData.messages;
      const selectedMessages = [];

      // 1. 如果有第1层楼（索引0），且包含内容，添加到选择列表
      if (messages.length > 0 && messages[0].mes && messages[0].mes.trim()) {
        let firstFloorContent = messages[0].mes;

        // 检查是否包含微博内容
        const weiboRegex = /<!-- WEIBO_CONTENT_START -->([\s\S]*?)<!-- WEIBO_CONTENT_END -->/;
        const weiboMatch = firstFloorContent.match(weiboRegex);
        const hasWeiboContent = !!weiboMatch;

        // 如果包含微博内容，只提取微博标记内的内容
        if (hasWeiboContent) {
          firstFloorContent = weiboMatch[1].trim(); // 只保留标记内的内容
          console.log('📋 [上下文构建] 第1层楼：提取微博标记内容');
          console.log('提取的内容:', firstFloorContent);
        } else {
          console.log('📋 [上下文构建] 第1层楼：无微博标记，保留完整内容');
        }

        selectedMessages.push({
          ...messages[0],
          mes: firstFloorContent,
          floor: 1,
          isFirstFloor: true,
          hasWeiboContent: hasWeiboContent,
        });
      }

      // 2. 取倒数3条消息（排除第1层楼，避免重复）
      const lastThreeMessages = messages.slice(-3);
      lastThreeMessages.forEach((msg, index) => {
        // 跳过第1层楼（已在上面处理）
        if (messages.indexOf(msg) !== 0) {
          selectedMessages.push({
            ...msg,
            floor: messages.indexOf(msg) + 1,
            isRecentMessage: true,
          });
        }
      });

      // 3. 去重并按楼层排序
      const uniqueMessages = [];
      const addedIndices = new Set();

      selectedMessages.forEach(msg => {
        const originalIndex = messages.findIndex(m => m === msg || (m.mes === msg.mes && m.is_user === msg.is_user));
        if (!addedIndices.has(originalIndex)) {
          addedIndices.add(originalIndex);
          uniqueMessages.push({
            ...msg,
            originalIndex,
          });
        }
      });

      // 按原始索引排序
      uniqueMessages.sort((a, b) => a.originalIndex - b.originalIndex);

      // 4. 分析用户参与模式
      const userMessages = uniqueMessages.filter(msg => msg.is_user);
      const userWeiboPosts = [];
      const userReplies = [];

      userMessages.forEach(msg => {
        if (msg.isFirstFloor && msg.hasWeiboContent) {
          userWeiboPosts.push(msg);
        } else if (msg.mes && msg.mes.trim()) {
          userReplies.push(msg);
        }
      });

      // 5. 构建增强注意力的内容
      contextInfo += '选择的对话内容:\n';

      // 特别标记用户的微博参与行为
      if (userWeiboPosts.length > 0 || userReplies.length > 0) {
        contextInfo += '\n⭐ 【重点关注：用户微博参与模式】\n';

        if (userWeiboPosts.length > 0) {
          contextInfo += '👤 用户的发博内容：\n';
          userWeiboPosts.forEach(msg => {
            contextInfo += `  📝 [用户发博] ${msg.mes}\n`;
          });
          contextInfo += '\n';
        }

        if (userReplies.length > 0) {
          contextInfo += '💬 用户的回博内容：\n';
          userReplies.forEach(msg => {
            contextInfo += `  💭 [用户回复] ${msg.mes}\n`;
          });
          contextInfo += '\n';
        }

        contextInfo += '⚠️ 生成微博内容时请特别注意延续和呼应用户的发博风格、话题偏好和互动模式！\n\n';
      }

      contextInfo += '完整对话记录:\n';
      uniqueMessages.forEach(msg => {
        const speaker = msg.is_user ? '👤用户' : `🤖${chatData.characterName || '角色'}`;
        let floorInfo = '';
        let attentionMark = '';

        if (msg.isFirstFloor) {
          floorInfo = msg.hasWeiboContent ? '[第1楼层-含微博]' : '[第1楼层]';
        } else if (msg.isRecentMessage) {
          floorInfo = '[最近消息]';
        }

        // 为用户消息添加特殊注意力标记
        if (msg.is_user) {
          attentionMark = '⭐ ';
        }

        contextInfo += `${attentionMark}${speaker}${floorInfo}: ${msg.mes}\n`;
      });

      console.log('📋 [上下文构建] ===== 上下文信息构建完成 =====');
      console.log(`[上下文构建] 总消息数: ${chatData.messages.length}`);
      console.log(`[上下文构建] 选择消息数: ${uniqueMessages.length}`);
      console.log(`[上下文构建] 包含第1楼层: ${uniqueMessages.some(m => m.isFirstFloor)}`);
      console.log(`[上下文构建] 第1楼层包含微博内容: ${uniqueMessages.some(m => m.isFirstFloor && m.hasWeiboContent)}`);
      console.log(`[上下文构建] 最近消息数: ${uniqueMessages.filter(m => m.isRecentMessage).length}`);
      console.log('📝 [上下文构建] 构建的完整上下文信息:');
      console.log(contextInfo);
      console.log('🏁 [上下文构建] ===== 上下文信息构建完成 =====\n');

      return contextInfo;
    }

    /**
     * 安全更新上下文（带生成状态检查）
     */
    async safeUpdateContextWithWeibo(weiboContent) {
      try {
        console.log('[Weibo Manager] 🔒 开始安全更新微博内容到第1楼层...');

        // 检查是否正在生成
        if (this.checkGenerationStatus()) {
          console.log('[Weibo Manager] ⚠️ 检测到SillyTavern正在生成回复，将内容加入队列...');
          return this.queueInsertion('weibo', weiboContent, { weiboContent });
        }

        return await this.updateContextWithWeibo(weiboContent);
      } catch (error) {
        console.error('[Weibo Manager] 安全更新微博内容失败:', error);
        return false;
      }
    }

    /**
     * 通过上下文编辑器更新到第1楼层
     */
    async updateContextWithWeibo(weiboContent) {
      try {
        console.log('[Weibo Manager] 开始在第1楼层追加微博内容...');

        // 确保上下文编辑器可用
        if (!window.mobileContextEditor) {
          throw new Error('上下文编辑器未就绪');
        }

        // 获取当前聊天数据
        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          throw new Error('无聊天数据可更新');
        }

        // 构建微博内容格式（使用特殊标记包装）
        const weiboSection = `\n\n<!-- WEIBO_CONTENT_START -->\n【微博热议】\n\n${weiboContent}\n\n---\n[由微博管理器自动生成]\n<!-- WEIBO_CONTENT_END -->`;

        // 检查第1楼层是否存在
        if (chatData.messages.length >= 1) {
          const firstMessage = chatData.messages[0];
          let originalContent = firstMessage.mes || '';

          // 检查是否已经包含微博内容
          const existingWeiboRegex = /<!-- WEIBO_CONTENT_START -->[\s\S]*?<!-- WEIBO_CONTENT_END -->/;
          if (existingWeiboRegex.test(originalContent)) {
            // 如果已存在微博内容，智能合并新旧内容
            console.log('[Weibo Manager] 检测到已存在微博内容，开始智能合并...');

            // 提取现有微博内容
            const existingWeiboMatch = originalContent.match(existingWeiboRegex);
            const existingWeiboContent = existingWeiboMatch ? existingWeiboMatch[0] : '';

            // 智能合并微博内容
            const mergedWeiboContent = await this.mergeWeiboContent(existingWeiboContent, weiboContent);

            // 移除旧的微博内容，保留其他内容
            originalContent = originalContent.replace(existingWeiboRegex, '').trim();

            // 使用合并后的内容
            const mergedWeiboSection = `\n\n<!-- WEIBO_CONTENT_START -->\n【微博热议】\n\n${mergedWeiboContent}\n\n---\n[由微博管理器自动生成]\n<!-- WEIBO_CONTENT_END -->`;

            // 在原有内容后追加合并后的微博内容
            const newContent = originalContent + mergedWeiboSection;

            // 更新第1楼层
            const success = await window.mobileContextEditor.modifyMessage(0, newContent);
            if (success) {
              console.log('[Weibo Manager] ✅ 微博内容智能合并成功');
              return true;
            } else {
              throw new Error('modifyMessage返回false');
            }
          }

          // 在原有内容后追加新的微博内容
          const newContent = originalContent + weiboSection;

          // 更新第1楼层
          const success = await window.mobileContextEditor.modifyMessage(0, newContent);
          if (success) {
            console.log('[Weibo Manager] ✅ 第1楼层追加微博内容成功');
            return true;
          } else {
            throw new Error('modifyMessage返回false');
          }
        } else {
          // 如果没有消息，创建新消息（只包含微博内容）
          const messageIndex = await window.mobileContextEditor.addMessage(weiboSection.trim(), false, '微博系统');
          if (messageIndex >= 0) {
            console.log('[Weibo Manager] ✅ 新增第1楼层（包含微博内容）成功');
            return true;
          } else {
            throw new Error('addMessage返回负数');
          }
        }
      } catch (error) {
        console.error('[Weibo Manager] 更新第1楼层失败:', error);
        return false;
      }
    }

    /**
     * 智能合并微博内容
     */
    async mergeWeiboContent(existingWeiboContent, newWeiboContent) {
      try {
        console.log('[Weibo Manager] 🔄 开始智能合并微博内容...');

        // 提取现有微博内容（去除标记）
        const existingContentMatch = existingWeiboContent.match(
          /<!-- WEIBO_CONTENT_START -->\s*【微博热议】\s*([\s\S]*?)\s*---\s*\[由微博管理器自动生成\]\s*<!-- WEIBO_CONTENT_END -->/,
        );
        const existingContent = existingContentMatch ? existingContentMatch[1].trim() : '';

        console.log('[Weibo Manager] 📋 现有微博内容:');
        console.log(existingContent);
        console.log('[Weibo Manager] 📋 新生成微博内容:');
        console.log(newWeiboContent);

        // 解析现有内容
        const existingData = this.parseWeiboContent(existingContent);
        console.log('[Weibo Manager] 📊 解析现有内容:', existingData);

        // 解析新内容
        const newData = this.parseWeiboContent(newWeiboContent);
        console.log('[Weibo Manager] 📊 解析新内容:', newData);
        console.log('[Weibo Manager] 📊 新内容评论详情:', JSON.stringify(newData.comments, null, 2));

        // 🔧 优化版方案5：检测特殊数据类型的变化
        const hasNewHotSearches = /\[热搜\|/.test(newWeiboContent);
        const hasNewRankings = /\[榜单\|/.test(newWeiboContent) || /\[榜单项\|/.test(newWeiboContent);
        const hasNewRankingPosts = /\[博文\|[^|]+\|r\d+\|/.test(newWeiboContent);
        const hasNewUserStats = /\[粉丝数\|/.test(newWeiboContent);

        console.log('[Weibo Manager] 🔍 特殊数据变化检测:', {
          hasNewHotSearches,
          hasNewRankings,
          hasNewRankingPosts,
          hasNewUserStats,
        });

        // 合并逻辑
        const mergedPosts = new Map();
        const mergedComments = new Map();
        let mergedRankingPosts = []; // 榜单博文独立处理

        // 1. 先添加所有现有博文（排除榜单博文）
        existingData.posts.forEach(post => {
          if (!post.id.startsWith('r')) {
            // 非榜单博文
            mergedPosts.set(post.id, post);
            mergedComments.set(post.id, existingData.comments[post.id] || []);
          }
        });

        // 1.1 处理现有榜单博文
        if (!hasNewRankingPosts) {
          // 如果没有新的榜单博文，保留现有的
          mergedRankingPosts = existingData.posts.filter(post => post.id.startsWith('r'));
          console.log('[Weibo Manager] 📊 保留现有榜单博文:', mergedRankingPosts.length, '条');
        }

        // 2. 处理新内容
        const currentTime = new Date();
        newData.posts.forEach(newPost => {
          if (newPost.id.startsWith('r')) {
            // 榜单博文：如果有新的榜单博文，替换所有旧的
            if (hasNewRankingPosts) {
              mergedRankingPosts.push(newPost);
              console.log(`[Weibo Manager] 📊 添加新榜单博文: ${newPost.id}`);
            }
          } else {
            // 普通博文：累积模式
            if (mergedPosts.has(newPost.id)) {
              // 如果是现有博文，不覆盖，只合并评论
              console.log(`[Weibo Manager] 📝 发现对现有博文 ${newPost.id} 的内容，合并评论...`);
            } else {
              // 如果是新博文，直接添加并设置当前时间戳
              console.log(`[Weibo Manager] ✨ 添加新博文: ${newPost.id}`);
              newPost.timestamp = currentTime.toLocaleString();
              newPost.latestActivityTime = currentTime; // 设置为Date对象，用于排序
              mergedPosts.set(newPost.id, newPost);
              mergedComments.set(newPost.id, []);
            }
          }
        });

        // 如果有新的榜单博文，清空旧的
        if (hasNewRankingPosts && mergedRankingPosts.length > 0) {
          console.log('[Weibo Manager] ✅ 榜单博文已替换，新数量:', mergedRankingPosts.length);
        }

        // 3. 合并评论 - 修复：处理所有新评论，不仅仅是新博文的评论
        // 首先处理新博文的评论
        newData.posts.forEach(newPost => {
          const newPostComments = newData.comments[newPost.id] || [];
          const existingComments = mergedComments.get(newPost.id) || [];

          // 合并评论，避免重复
          const allComments = [...existingComments];
          newPostComments.forEach(newComment => {
            // 简单的重复检测：相同作者和相似内容
            const isDuplicate = allComments.some(
              existingComment =>
                existingComment.author === newComment.author &&
                existingComment.content.includes(newComment.content.substring(0, 20)),
            );

            if (!isDuplicate) {
              // 为新评论设置当前时间戳，确保它们排在前面
              newComment.timestamp = currentTime.toLocaleString();
              newComment.sortTimestamp = currentTime.getTime(); // 用于排序的数值时间戳

              allComments.push(newComment);
              console.log(`[Weibo Manager] 💬 添加新评论到博文 ${newPost.id}: ${newComment.author}`);

              // 如果是对现有博文的新评论，更新博文的最新活动时间
              if (mergedPosts.has(newPost.id)) {
                const existingPost = mergedPosts.get(newPost.id);
                existingPost.latestActivityTime = currentTime;
                existingPost.timestamp = currentTime.toLocaleString(); // 也更新显示时间戳
                console.log(`[Weibo Manager] 📝 更新博文 ${newPost.id} 的最新活动时间`);
              }
            }
          });

          mergedComments.set(newPost.id, allComments);
        });

        // 修复：处理对现有博文的新评论（即使新内容中没有对应的博文）
        Object.keys(newData.comments).forEach(postId => {
          // 跳过已经在上面处理过的新博文
          if (newData.posts.some(post => post.id === postId)) {
            return;
          }

          // 检查这个博文ID是否存在于现有博文中
          if (mergedPosts.has(postId)) {
            const newPostComments = newData.comments[postId] || [];
            const existingComments = mergedComments.get(postId) || [];

            console.log(`[Weibo Manager] 🔄 处理对现有博文 ${postId} 的新评论，数量: ${newPostComments.length}`);

            // 合并评论，避免重复
            const allComments = [...existingComments];
            newPostComments.forEach(newComment => {
              console.log(
                `[Weibo Manager] 🔍 检查新评论: ${newComment.author} - ${newComment.content.substring(0, 50)}...`,
              );

              // 简单的重复检测：相同作者和相似内容
              // 注意：回复格式的内容通常以"回复XXX："开头，需要特殊处理
              const newContentForCheck = newComment.content.substring(0, 30);
              const isDuplicate = allComments.some(existingComment => {
                const authorMatch = existingComment.author === newComment.author;
                const contentMatch =
                  existingComment.content.includes(newContentForCheck) ||
                  newComment.content.includes(existingComment.content.substring(0, 20));
                console.log(`[Weibo Manager] 🔍 比较评论:
                  现有: ${existingComment.author} - ${existingComment.content.substring(0, 30)}...
                  新的: ${newComment.author} - ${newContentForCheck}...
                  作者匹配: ${authorMatch}, 内容匹配: ${contentMatch}`);
                return authorMatch && contentMatch;
              });

              console.log(`[Weibo Manager] 🔍 重复检测结果: ${isDuplicate ? '重复' : '不重复'}`);

              if (!isDuplicate) {
                // 为新评论设置当前时间戳，确保它们排在前面
                newComment.timestamp = currentTime.toLocaleString();
                newComment.sortTimestamp = currentTime.getTime(); // 用于排序的数值时间戳

                allComments.push(newComment);
                console.log(`[Weibo Manager] 💬 添加新评论到现有博文 ${postId}: ${newComment.author}`);

                // 更新博文的最新活动时间
                const existingPost = mergedPosts.get(postId);
                existingPost.latestActivityTime = currentTime;
                existingPost.timestamp = currentTime.toLocaleString(); // 也更新显示时间戳
                console.log(`[Weibo Manager] 📝 更新博文 ${postId} 的最新活动时间`);
              } else {
                console.log(`[Weibo Manager] ⚠️ 跳过重复评论: ${newComment.author}`);
              }
            });

            mergedComments.set(postId, allComments);
          } else {
            console.log(`[Weibo Manager] ⚠️ 发现对不存在博文 ${postId} 的评论，跳过`);
          }
        });

        // 4. 处理特殊数据类型的增量替换
        let finalHotSearches = existingData.hotSearches || [];
        let finalRankings = existingData.rankings || [];
        let finalUserStats = existingData.userStats;

        if (hasNewHotSearches && newData.hotSearches && newData.hotSearches.length > 0) {
          finalHotSearches = newData.hotSearches;
          console.log('[Weibo Manager] ✅ 热搜数据已替换，新数量:', finalHotSearches.length);
        }

        if (hasNewRankings && newData.rankings && newData.rankings.length > 0) {
          finalRankings = newData.rankings;
          console.log('[Weibo Manager] ✅ 榜单数据已替换，新数量:', finalRankings.length);
        }

        if (hasNewUserStats && newData.userStats) {
          finalUserStats = newData.userStats;
          console.log(
            '[Weibo Manager] ✅ 粉丝数据已替换 - 大号:',
            finalUserStats.mainAccountFans,
            '小号:',
            finalUserStats.aliasAccountFans,
          );
        }

        // 5. 重新构建微博内容（包含特殊数据类型）
        const mergedContent = this.buildWeiboContent(
          mergedPosts,
          mergedComments,
          mergedRankingPosts,
          finalHotSearches,
          finalRankings,
          finalUserStats,
        );

        console.log('[Weibo Manager] ✅ 微博内容合并完成');
        console.log('[Weibo Manager] 📋 合并后内容:');
        console.log(mergedContent);

        return mergedContent;
      } catch (error) {
        console.error('[Weibo Manager] ❌ 合并微博内容失败:', error);
        // 如果合并失败，返回新内容
        return newWeiboContent;
      }
    }

    /**
     * 解析微博内容
     */
    parseWeiboContent(weiboContent) {
      const posts = [];
      const comments = {};

      if (!weiboContent || weiboContent.trim() === '') {
        return { posts, comments };
      }

      // 解析博文格式: [博文|发博人昵称|博文id|博文内容]
      const postRegex = /\[博文\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
      // 解析评论格式: [评论|评论人昵称|博文id|评论内容]
      const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
      // 解析回复格式: [回复|回复人昵称|博文id|回复评论人：回复内容]
      const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;

      let match;

      // 解析博文
      let postIndex = 0;
      while ((match = postRegex.exec(weiboContent)) !== null) {
        // 为现有博文设置递增的时间戳，保持原有顺序
        const baseTime = new Date('2024-01-01 10:00:00');
        const postTime = new Date(baseTime.getTime() + postIndex * 60000); // 每个博文间隔1分钟

        const post = {
          id: match[2],
          author: match[1],
          content: match[3],
          timestamp: postTime.toLocaleString(),
          latestActivityTime: postTime, // 初始活动时间等于发布时间
        };

        posts.push(post);
        comments[post.id] = [];
        postIndex++;
      }

      // 解析普通评论
      let commentIndex = 0;
      while ((match = commentRegex.exec(weiboContent)) !== null) {
        // 为现有评论设置递增的时间戳，保持原有顺序
        const baseTime = new Date('2024-01-01 11:00:00');
        const commentTime = new Date(baseTime.getTime() + commentIndex * 30000); // 每个评论间隔30秒

        const comment = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          postId: match[2],
          author: match[1],
          content: match[3],
          timestamp: commentTime.toLocaleString(),
          type: 'comment',
          replies: [],
        };

        // 修复：确保评论数组存在，即使没有对应的博文
        if (!comments[comment.postId]) {
          comments[comment.postId] = [];
        }

        comments[comment.postId].push(comment);
        console.log(`[Weibo Manager] 📝 解析评论到博文 ${comment.postId}: ${comment.author}`);

        // 更新对应博文的最新活动时间
        const post = posts.find(p => p.id === comment.postId);
        if (post && commentTime > post.latestActivityTime) {
          post.latestActivityTime = commentTime;
        }
        commentIndex++;
      }

      // 解析回复
      let replyIndex = 0;
      while ((match = replyRegex.exec(weiboContent)) !== null) {
        // 为现有回复设置递增的时间戳
        const baseTime = new Date('2024-01-01 12:00:00');
        const replyTime = new Date(baseTime.getTime() + replyIndex * 15000); // 每个回复间隔15秒

        const reply = {
          id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          postId: match[2],
          author: match[1],
          content: match[3],
          timestamp: replyTime.toLocaleString(),
          type: 'reply',
        };

        // 查找父评论并添加到其回复中
        // 修复：确保评论数组存在，即使没有对应的博文
        if (!comments[reply.postId]) {
          comments[reply.postId] = [];
        }

        // 简单处理：将回复作为普通评论处理
        reply.type = 'comment';
        reply.replies = [];
        comments[reply.postId].push(reply);
        console.log(`[Weibo Manager] 📝 解析回复到博文 ${reply.postId}: ${reply.author}`);

        // 更新对应博文的最新活动时间
        const post = posts.find(p => p.id === reply.postId);
        if (post && replyTime > post.latestActivityTime) {
          post.latestActivityTime = replyTime;
        }
        replyIndex++;
      }

      // 解析特殊数据类型（热搜、榜单、粉丝数据）
      const hotSearches = [];
      const rankings = [];
      let userStats = null;

      // 解析热搜格式: [热搜|排名|热搜标题|热度值]
      const hotSearchRegex = /\[热搜\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
      let hotSearchMatch;
      while ((hotSearchMatch = hotSearchRegex.exec(weiboContent)) !== null) {
        hotSearches.push({
          rank: parseInt(hotSearchMatch[1]),
          title: hotSearchMatch[2],
          heat: hotSearchMatch[3],
        });
      }

      // 解析榜单格式: [榜单|榜单名称|榜单类型] 和 [榜单项|排名|名称|热度值]
      const rankingTitleRegex = /\[榜单\|([^|]+)\|([^\]]+)\]/g;
      const rankingItemRegex = /\[榜单项\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;

      let rankingTitleMatch;
      while ((rankingTitleMatch = rankingTitleRegex.exec(weiboContent)) !== null) {
        rankings.push({
          title: rankingTitleMatch[1],
          type: rankingTitleMatch[2],
          items: [],
        });
      }

      let rankingItemMatch;
      while ((rankingItemMatch = rankingItemRegex.exec(weiboContent)) !== null) {
        const item = {
          rank: parseInt(rankingItemMatch[1]),
          name: rankingItemMatch[2],
          heat: rankingItemMatch[3],
        };

        // 添加到最后一个榜单
        if (rankings.length > 0) {
          rankings[rankings.length - 1].items.push(item);
        }
      }

      // 解析粉丝数格式: [粉丝数|大号粉丝数|小号粉丝数]
      const fansRegex = /\[粉丝数\|([^|]+)\|([^\]]+)\]/g;
      let fansMatch;
      while ((fansMatch = fansRegex.exec(weiboContent)) !== null) {
        userStats = {
          mainAccountFans: fansMatch[1], // 大号粉丝数
          aliasAccountFans: fansMatch[2], // 小号粉丝数
          following: '100', // 固定关注数
          posts: posts.length,
        };
        break; // 只取第一个匹配的粉丝数
      }

      return { posts, comments, hotSearches, rankings, userStats };
    }

    /**
     * 构建微博内容（支持特殊数据类型）
     */
    buildWeiboContent(postsMap, commentsMap, rankingPosts = [], hotSearches = [], rankings = [], userStats = null) {
      let content = '';

      // 计算每个博文的最新活动时间（包括评论时间）
      const postsWithActivity = Array.from(postsMap.values()).map(post => {
        const postComments = commentsMap.get(post.id) || [];
        let latestActivityTime = new Date(post.timestamp);

        // 检查所有评论的时间，找到最新的
        postComments.forEach(comment => {
          const commentTime = new Date(comment.timestamp);
          if (commentTime > latestActivityTime) {
            latestActivityTime = commentTime;
          }

          // 检查回复的时间
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              const replyTime = new Date(reply.timestamp);
              if (replyTime > latestActivityTime) {
                latestActivityTime = replyTime;
              }
            });
          }
        });

        return {
          ...post,
          latestActivityTime: latestActivityTime,
        };
      });

      // 构建特殊数据类型内容
      // 1. 热搜数据
      if (hotSearches && hotSearches.length > 0) {
        hotSearches.forEach(hotSearch => {
          content += `[热搜|${hotSearch.rank}|${hotSearch.title}|${hotSearch.heat}]\n`;
        });
        content += '\n';
      }

      // 2. 榜单数据
      if (rankings && rankings.length > 0) {
        rankings.forEach(ranking => {
          content += `[榜单|${ranking.title}|${ranking.type}]\n`;
          if (ranking.items && ranking.items.length > 0) {
            ranking.items.forEach(item => {
              content += `[榜单项|${item.rank}|${item.name}|${item.heat}]\n`;
            });
          }
        });
        content += '\n';
      }

      // 按最新活动时间排序（最新活动的博文在前）
      const allPosts = [...postsWithActivity];

      // 添加榜单博文到排序列表
      if (rankingPosts && rankingPosts.length > 0) {
        rankingPosts.forEach(rankingPost => {
          // 为榜单博文设置活动时间
          if (!rankingPost.latestActivityTime) {
            rankingPost.latestActivityTime = new Date(rankingPost.timestamp || new Date());
          }
          allPosts.push(rankingPost);
        });
      }

      const sortedPosts = allPosts.sort((a, b) => {
        return new Date(b.latestActivityTime) - new Date(a.latestActivityTime);
      });

      sortedPosts.forEach(post => {
        // 添加博文
        content += `[博文|${post.author}|${post.id}|${post.content}]\n\n`;

        // 添加评论（按时间排序，最新的在前）
        const postComments = commentsMap.get(post.id) || [];
        const sortedComments = postComments.sort((a, b) => {
          // 使用sortTimestamp进行排序，如果没有则使用timestamp
          const aTime = a.sortTimestamp || new Date(a.timestamp).getTime();
          const bTime = b.sortTimestamp || new Date(b.timestamp).getTime();
          return bTime - aTime; // 降序排列，最新的在前
        });

        sortedComments.forEach(comment => {
          content += `[评论|${comment.author}|${comment.postId}|${comment.content}]\n`;

          // 添加回复
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              content += `[回复|${reply.author}|${reply.postId}|${reply.content}]\n`;
            });
          }
        });

        content += '\n';
      });

      // 3. 粉丝数据（放在最后）
      if (userStats && (userStats.mainAccountFans || userStats.aliasAccountFans)) {
        const mainFans = userStats.mainAccountFans || '0';
        const aliasFans = userStats.aliasAccountFans || '0';
        content += `[粉丝数|${mainFans}|${aliasFans}]\n`;
      }

      return content.trim();
    }

    /**
     * 清除微博内容
     */
    async clearWeiboContent() {
      try {
        this.updateStatus('正在清除微博内容...', 'info');

        if (!window.mobileContextEditor) {
          throw new Error('上下文编辑器未就绪');
        }

        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (!chatData || !chatData.messages || chatData.messages.length === 0) {
          throw new Error('无数据可清除');
        }

        // 检查第1楼层是否包含微博内容标记
        const firstMessage = chatData.messages[0];
        if (firstMessage && firstMessage.mes) {
          const originalContent = firstMessage.mes;
          const weiboRegex = /<!-- WEIBO_CONTENT_START -->[\s\S]*?<!-- WEIBO_CONTENT_END -->/;

          if (weiboRegex.test(originalContent)) {
            // 移除微博内容标记及其包含的内容
            const cleanedContent = originalContent.replace(weiboRegex, '').trim();

            if (cleanedContent === '') {
              // 如果清除微博内容后消息变为空，删除整个消息
              const success = await window.mobileContextEditor.deleteMessage(0);
              if (success) {
                this.updateStatus('微博内容已清除（消息已删除）', 'success');
                console.log('[Weibo Manager] ✅ 第1楼层微博内容已清除，消息已删除');
              } else {
                throw new Error('删除空消息失败');
              }
            } else {
              // 如果还有其他内容，只更新消息内容
              const success = await window.mobileContextEditor.modifyMessage(0, cleanedContent);
              if (success) {
                this.updateStatus('微博内容已清除（保留原有内容）', 'success');
                console.log('[Weibo Manager] ✅ 第1楼层微博内容已清除，原有内容已保留');
              } else {
                throw new Error('更新消息失败');
              }
            }
          } else {
            this.updateStatus('第1楼层未发现微博内容标记', 'warning');
            console.log('[Weibo Manager] 第1楼层未发现微博内容标记');
          }
        } else {
          this.updateStatus('第1楼层消息为空', 'warning');
        }

        // 立即重置处理状态 - 兼容Safari
        this.isProcessing = false;

        // 重置auto-listener状态 - 确保不会被阻止
        if (window.weiboAutoListener) {
          window.weiboAutoListener.isProcessingRequest = false;
        }

        // 刷新微博UI界面以反映数据变化
        this.clearWeiboUICache();

        console.log('[Weibo Manager] 🔄 清除完成，状态已重置（兼容Safari）');
      } catch (error) {
        console.error('[Weibo Manager] 清除微博内容失败:', error);
        this.updateStatus(`清除失败: ${error.message}`, 'error');

        // 确保状态被重置 - 立即重置，不依赖setTimeout
        this.isProcessing = false;
        if (window.weiboAutoListener) {
          window.weiboAutoListener.isProcessingRequest = false;
        }
      } finally {
        // Safari兼容性：立即重置而不是延迟重置
        this.isProcessing = false;
        if (window.weiboAutoListener) {
          window.weiboAutoListener.isProcessingRequest = false;
        }

        // 额外的保险：仍然保留延迟重置作为最后保障
        setTimeout(() => {
          this.isProcessing = false;
          if (window.weiboAutoListener) {
            window.weiboAutoListener.isProcessingRequest = false;
          }
          console.log('[Weibo Manager] 🛡️ 延迟状态重置完成（最后保障）');
        }, 500); // 减少到500ms，提升响应速度
      }
    }

    /**
     * 刷新微博UI界面
     */
    clearWeiboUICache() {
      try {
        // 刷新微博UI界面
        if (window.weiboUI && window.weiboUI.refreshWeiboList) {
          window.weiboUI.refreshWeiboList();
          console.log('[Weibo Manager] ✅ 微博UI界面已刷新');
        }

        // 清除localStorage中的微博相关数据（如果有）
        const weiboDataKeys = ['mobile_weibo_posts', 'mobile_weibo_comments', 'mobile_weibo_cache'];

        weiboDataKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`[Weibo Manager] ✅ 已清除localStorage中的${key}`);
          }
        });
      } catch (error) {
        console.warn('[Weibo Manager] 刷新微博UI界面时出现警告:', error);
      }
    }

    /**
     * 更新状态显示
     */
    updateStatus(message, type = 'info') {
      console.log(`[Weibo Manager] 状态更新 [${type}]: ${message}`);

      // 如果有状态显示元素，更新它
      const statusElement = document.getElementById('weibo-status');
      if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
      }
    }

    /**
     * 更新生成状态（供mobile-phone.js调用）
     */
    updateGenerationStatus(message) {
      console.log(`[Weibo Manager] 生成状态: ${message}`);
      this.updateStatus(message, 'info');
    }

    /**
     * 检查生成状态
     */
    checkGenerationStatus() {
      // 这里应该检查SillyTavern是否正在生成
      // 具体实现需要根据SillyTavern的API来调整
      return false;
    }

    /**
     * 队列插入
     */
    queueInsertion(type, content, data) {
      this.pendingInsertions.push({
        type,
        content,
        data,
        timestamp: Date.now(),
      });
      console.log(`[Weibo Manager] 内容已加入队列: ${type}`);
      return true;
    }

    /**
     * 处理插入队列
     */
    async processInsertionQueue() {
      if (this.pendingInsertions.length === 0) {
        return;
      }

      console.log(`[Weibo Manager] 开始处理插入队列，共 ${this.pendingInsertions.length} 项`);

      while (this.pendingInsertions.length > 0) {
        const insertion = this.pendingInsertions.shift();
        try {
          await this.updateContextWithWeibo(insertion.content);
          console.log(`[Weibo Manager] 队列项处理成功: ${insertion.type}`);
        } catch (error) {
          console.error(`[Weibo Manager] 队列项处理失败: ${insertion.type}`, error);
        }
      }
    }

    /**
     * 等待生成完成
     */
    async waitForGenerationComplete() {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.checkGenerationStatus()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);

        // 超时保护
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, this.maxWaitTime);
      });
    }

    /**
     * 发送用户博文到API
     */
    async sendPostToAPI(content) {
      try {
        console.log('🚀 [微博API] ===== 开始发送用户博文 =====');

        // 使用增强的API配置检查
        if (!this.isAPIConfigValid()) {
          throw new Error('请先配置API');
        }

        // 构建上下文信息
        const chatData = await this.getCurrentChatData();
        const contextInfo = this.buildContextInfo(chatData);

        // 获取风格提示词（用户发博）
        const stylePrompt = window.weiboStyles
          ? window.weiboStyles.getStylePrompt(
              'post',
              this.currentAccount.isMainAccount,
              this.currentAccount.currentPage,
            )
          : '';

        console.log('📋 [微博API] 系统提示词（用户发博）:');
        console.log(stylePrompt);
        console.log('\n📝 [微博API] 用户博文内容:');
        console.log(content);

        // 构建API请求
        const messages = [
          {
            role: 'system',
            content: stylePrompt,
          },
          {
            role: 'user',
            content: `用户发布了一条微博：${content}\n\n请根据以下聊天记录生成相应的微博内容：\n\n${contextInfo}`,
          },
        ];

        console.log('📡 [微博API] 完整API请求:');
        console.log(JSON.stringify(messages, null, 2));

        // 调用API
        const response = await window.mobileCustomAPIConfig.callAPI(messages, {
          temperature: 0.8,
          max_tokens: 2000,
        });

        console.log('📥 [微博API] 模型返回内容:');
        console.log(response);

        if (response && response.content) {
          console.log('✅ [微博API] 用户博文生成成功:');
          console.log(response.content);

          // 更新上下文
          const success = await this.safeUpdateContextWithWeibo(response.content);
          if (success) {
            console.log('✅ [微博API] 用户博文已添加到上下文');
          }

          console.log('🏁 [微博API] ===== 用户博文发送完成 =====\n');
          return response.content;
        } else {
          throw new Error('API返回格式错误');
        }
      } catch (error) {
        console.error('❌ [微博API] 发送用户博文失败:', error);
        console.log('🏁 [微博API] ===== 用户博文发送失败 =====\n');
        throw error;
      }
    }

    /**
     * 发送用户回复到API
     */
    async sendReplyToAPI(replyContent) {
      try {
        console.log('🚀 [微博API] ===== 开始发送用户回复 =====');

        // 使用增强的API配置检查
        if (!this.isAPIConfigValid()) {
          throw new Error('请先配置API');
        }

        // 构建上下文信息
        const chatData = await this.getCurrentChatData();
        const contextInfo = this.buildContextInfo(chatData);

        // 获取风格提示词（用户回复）
        const stylePrompt = window.weiboStyles
          ? window.weiboStyles.getStylePrompt(
              'reply',
              this.currentAccount.isMainAccount,
              this.currentAccount.currentPage,
            )
          : '';

        console.log('📋 [微博API] 系统提示词（用户回复）:');
        console.log(stylePrompt);
        console.log('\n📝 [微博API] 用户回复内容:');
        console.log(replyContent);

        // 构建API请求
        const messages = [
          {
            role: 'system',
            content: stylePrompt,
          },
          {
            role: 'user',
            content: `用户发表了回复：${replyContent}\n\n请根据以下聊天记录生成相应的微博回复内容：\n\n${contextInfo}`,
          },
        ];

        console.log('📡 [微博API] 完整API请求:');
        console.log(JSON.stringify(messages, null, 2));

        // 调用API
        const response = await window.mobileCustomAPIConfig.callAPI(messages, {
          temperature: 0.8,
          max_tokens: 1500,
        });

        console.log('📥 [微博API] 模型返回内容:');
        console.log(response);

        if (response && response.content) {
          console.log('✅ [微博API] 用户回复生成成功:');
          console.log(response.content);

          // 更新上下文
          const success = await this.safeUpdateContextWithWeibo(response.content);
          if (success) {
            console.log('✅ [微博API] 用户回复已添加到上下文');
          }

          console.log('🏁 [微博API] ===== 用户回复发送完成 =====\n');
          return response.content;
        } else {
          throw new Error('API返回格式错误');
        }
      } catch (error) {
        console.error('❌ [微博API] 发送用户回复失败:', error);
        console.log('🏁 [微博API] ===== 用户回复发送失败 =====\n');
        throw error;
      }
    }

    /**
     * 检查是否需要自动生成微博内容
     */
    async checkAutoGenerate() {
      // 检查基本条件
      if (!this.currentSettings.autoUpdate || this.isProcessing) {
        return false;
      }

      // 检查auto-listener是否正在处理
      if (window.weiboAutoListener && window.weiboAutoListener.isProcessingRequest) {
        console.log('[Weibo Manager] Auto-listener正在处理，跳过检查');
        return false;
      }

      try {
        const chatData = await this.getCurrentChatData();
        if (!chatData || !chatData.messages) {
          return false;
        }

        const currentCount = chatData.messages.length;
        const increment = currentCount - this.lastProcessedCount;

        console.log(
          `[Weibo Manager] 检查自动生成条件: 当前消息数=${currentCount}, 已处理=${this.lastProcessedCount}, 增量=${increment}, 阈值=${this.currentSettings.threshold}`,
        );

        if (increment >= this.currentSettings.threshold) {
          console.log(`[Weibo Manager] 满足自动生成条件，开始生成微博内容`);
          return await this.generateWeiboContent(false);
        }

        return false;
      } catch (error) {
        console.error('[Weibo Manager] 检查自动生成失败:', error);
        return false;
      }
    }

    /**
     * 检查是否需要重试 - 已禁用自动重试
     */
    shouldRetry(error) {
      // 自动重试已被完全禁用，总是返回 false
      console.log(`[Weibo Manager] ⏳ 自动重试已禁用，将等待下次楼层变化阈值达标后重新尝试。错误: ${error.message}`);
      return false;
    }

    /**
     * 安排延迟重试
     */
    scheduleRetry(force = false) {
      // 更新重试配置
      this.retryConfig.currentRetryCount++;
      this.retryConfig.lastFailTime = Date.now();

      console.log(`[Weibo Manager] 🔄 安排第 ${this.retryConfig.currentRetryCount} 次重试，将在 ${this.retryConfig.retryDelay / 1000} 秒后执行`);

      // 设置延迟重试
      setTimeout(async () => {
        try {
          console.log(`[Weibo Manager] 🔄 开始第 ${this.retryConfig.currentRetryCount} 次重试`);
          this.updateStatus(`正在重试生成微博内容... (${this.retryConfig.currentRetryCount}/${this.retryConfig.maxRetries})`, 'info');

          const success = await this.generateWeiboContent(force);
          if (success) {
            console.log(`[Weibo Manager] ✅ 第 ${this.retryConfig.currentRetryCount} 次重试成功`);
            this.resetRetryConfig();
          }
        } catch (error) {
          console.error(`[Weibo Manager] ❌ 第 ${this.retryConfig.currentRetryCount} 次重试失败:`, error);
        }
      }, this.retryConfig.retryDelay);
    }

    /**
     * 重置重试配置
     */
    resetRetryConfig() {
      this.retryConfig.currentRetryCount = 0;
      this.retryConfig.lastFailTime = null;
      console.log('[Weibo Manager] 🔄 重试配置已重置');
    }

    /**
     * 当API配置修复后，重新启用auto-listener
     */
    enableAutoListenerIfConfigValid() {
      if (this.isAPIConfigValid() && window.weiboAutoListener && !window.weiboAutoListener.settings.enabled) {
        console.log('[Weibo Manager] 🔄 API配置已修复，重新启用auto-listener');
        window.weiboAutoListener.enable();
      }
    }
  }

  // 创建全局实例 - 参考Forum-App的智能初始化
  if (typeof window !== 'undefined') {
    window.WeiboManager = WeiboManager;
    window.weiboManager = new WeiboManager();

    // 智能初始化：确保微博管理器在所有依赖模块加载完成后再初始化
    function initializeWeiboManager() {
      if (window.weiboManager && !window.weiboManager.isInitialized) {
        console.log('[Weibo Manager] 开始初始化微博管理器...');
        window.weiboManager.initialize();
      }
    }

    // 延迟初始化，等待其他模块加载完成
    function delayedInitialization() {
      // 检查关键依赖是否已加载
      const contextEditorReady = window.mobileContextEditor !== undefined;
      const customAPIReady = window.mobileCustomAPIConfig !== undefined;
      const weiboStylesReady = window.weiboStyles !== undefined;

      // 详细的依赖调试信息
      console.log('[Weibo Manager] 🔍 详细依赖检查:', {
        contextEditor: contextEditorReady,
        customAPI: customAPIReady,
        weiboStyles: weiboStylesReady,
        weiboStylesType: typeof window.weiboStyles,
        weiboStylesClass: typeof window.WeiboStyles,
        allWeiboKeys: Object.keys(window).filter(key => key.toLowerCase().includes('weibo')),
      });

      // 如果 weiboStyles 未定义，尝试检查是否有其他相关对象
      if (!weiboStylesReady) {
        console.log('[Weibo Manager] 🔍 weiboStyles 未定义，检查可能的原因:');
        console.log('- window.WeiboStyles 类:', typeof window.WeiboStyles);

        // 尝试手动创建实例
        if (typeof window.WeiboStyles !== 'undefined') {
          console.log('[Weibo Manager] 🔧 尝试手动创建 weiboStyles 实例');
          try {
            window.weiboStyles = new window.WeiboStyles();
            console.log('[Weibo Manager] ✅ 手动创建 weiboStyles 实例成功');
          } catch (error) {
            console.error('[Weibo Manager] ❌ 手动创建 weiboStyles 实例失败:', error);
          }
        }
      }

      // 重新检查依赖状态
      const finalWeiboStylesReady = window.weiboStyles !== undefined;

      if (contextEditorReady && customAPIReady && finalWeiboStylesReady) {
        // 所有依赖都已就绪，立即初始化
        console.log('[Weibo Manager] ✅ 所有依赖已就绪，立即初始化');
        initializeWeiboManager();
      } else {
        // 依赖未就绪，延迟初始化（但不输出刷屏日志）
        console.log('[Weibo Manager] ⏳ 依赖未完全就绪，延迟初始化');
        setTimeout(initializeWeiboManager, 2000); // 2秒后初始化，让依赖等待逻辑处理
      }
    }

    // 如果DOM已经加载完成，延迟初始化；否则等待DOMContentLoaded
    if (document.readyState === 'loading') {
      console.log('[Weibo Manager] DOM正在加载，等待DOMContentLoaded事件');
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(delayedInitialization, 1000); // DOM加载完成后1秒再检查依赖
      });
    } else {
      console.log('[Weibo Manager] DOM已加载完成，延迟初始化');
      // 使用setTimeout确保模块完全加载后再初始化
      setTimeout(delayedInitialization, 1000);
    }

    console.log('[Weibo Manager] ✅ 微博管理器已创建');
  }
} // 结束防重复加载检查
