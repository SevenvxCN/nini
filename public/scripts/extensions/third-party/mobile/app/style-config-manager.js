/**
 * Style Config Manager - 移动端样式配置管理器
 * 使用SillyTavern的Data Bank API在global层级存储移动端界面样式配置
 */

// 导入SillyTavern的Data Bank API
let getDataBankAttachmentsForSource, getFileAttachment, uploadFileAttachmentToServer, deleteAttachment;
let sillyTavernCoreImported = false;

// 配置文件名（存储在Data Bank中）
const STYLE_CONFIG_FILE_NAME = 'mobile_style_config.json';

// 默认样式配置
const DEFAULT_STYLE_CONFIG = {
  homeScreen: {
    backgroundImage: '',
    backgroundImageUrl: '',
    description: '主屏幕背景图片',
  },
  messageDetailApp: {
    backgroundImage: '',
    backgroundImageUrl: '',
    description: '消息详情应用背景',
  },
  messagesApp: {
    backgroundImage: '',
    backgroundImageUrl: '',
    backgroundPosition: 'center center',
    description: '消息应用背景',
  },
  messageSentAvatar: {
    backgroundImage: '',
    backgroundImageUrl: '',
    backgroundPosition: 'center center',
    rotation: '0',
    scale: '1',
    description: '发送消息头像背景',
  },
  messageReceivedAvatars: [
    {
      id: 'default',
      backgroundImage: '',
      backgroundImageUrl: '',
      backgroundPosition: 'center center',
      rotation: '0',
      scale: '1',
      friendId: '',
      name: '默认好友头像',
      description: '接收消息头像背景',
    },
  ],
  // 新增：好友专属背景配置
  friendBackgrounds: [
    {
      id: 'default',
      friendId: '',
      name: '默认好友背景',
      backgroundImage: '',
      backgroundImageUrl: '',
      backgroundPosition: 'center center',
      rotation: '0',
      scale: '1',
      description: '好友专属聊天背景',
    },
  ],
  customStyles: {
    cssText: '',
    description: '自定义CSS样式',
  },
};

// 避免重复定义
// @ts-ignore - StyleConfigManager全局对象
if (typeof window.StyleConfigManager === 'undefined') {
  class StyleConfigManager {
    constructor() {
      this.currentConfig = { ...DEFAULT_STYLE_CONFIG };
      this.configLoaded = false;
      this.styleElement = null;
      this.isReady = false;

      console.log('[Style Config Manager] 样式配置管理器初始化开始');

      // 初始化
      this.init();
    }

    async init() {
      try {
        // 导入SillyTavern核心模块
        await this.importSillyTavernCore();

        // 创建样式元素
        this.createStyleElement();

        // 清理重复的默认配置文件
        await this.cleanupDuplicateDefaultConfigs();

        // 自动加载配置
        await this.loadConfig();

        // 应用配置
        this.applyStyles();

        this.isReady = true;
        console.log('[Style Config Manager] ✅ 样式配置管理器初始化完成');

        // 触发就绪事件
        this.dispatchReadyEvent();

        // 确保全局引用可用
        // @ts-ignore - Window global property
        window.styleConfigManager = this;
      } catch (error) {
        console.error('[Style Config Manager] 初始化失败:', error);
      }
    }

    // 导入SillyTavern核心模块
    async importSillyTavernCore() {
      if (sillyTavernCoreImported) {
        return;
      }

      try {
        console.log('[Style Config Manager] 🔍 导入SillyTavern Data Bank API...');

        // 动态导入chats.js模块
        const chatsModule = await import('../../../../chats.js');

        getDataBankAttachmentsForSource = chatsModule.getDataBankAttachmentsForSource;
        getFileAttachment = chatsModule.getFileAttachment;
        uploadFileAttachmentToServer = chatsModule.uploadFileAttachmentToServer;
        deleteAttachment = chatsModule.deleteAttachment;

        sillyTavernCoreImported = true;
        console.log('[Style Config Manager] ✅ SillyTavern Data Bank API导入成功');
      } catch (error) {
        console.warn('[Style Config Manager] ⚠️ 导入SillyTavern模块失败，使用localStorage备用方案:', error);
        // 如果导入失败，仍然可以使用localStorage备用方案
      }
    }

    // 创建样式元素
    createStyleElement() {
      // 移除旧的样式元素
      const oldStyleElement = document.getElementById('mobile-style-config');
      if (oldStyleElement) {
        oldStyleElement.remove();
      }

      // 创建新的样式元素
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'mobile-style-config';
      this.styleElement.type = 'text/css';
      document.head.appendChild(this.styleElement);

      console.log('[Style Config Manager] 样式元素已创建');
    }

    // 清理重复的默认配置文件
    async cleanupDuplicateDefaultConfigs() {
      try {
        if (!sillyTavernCoreImported) {
          console.log('[Style Config Manager] SillyTavern未导入，跳过清理');
          return;
        }

        console.log('[Style Config Manager] 🧹 正在清理重复的默认配置文件...');

        // 获取所有配置文件
        const globalAttachments = getDataBankAttachmentsForSource('global', true);
        const defaultConfigs = globalAttachments.filter(att => att.name === STYLE_CONFIG_FILE_NAME);

        if (defaultConfigs.length > 1) {
          console.log(`[Style Config Manager] 发现 ${defaultConfigs.length} 个重复的默认配置，准备清理...`);

          // 保留第一个，删除其余的
          for (let i = 1; i < defaultConfigs.length; i++) {
            try {
              console.log(`[Style Config Manager] 正在删除重复配置: ${defaultConfigs[i].name}`);
              await deleteAttachment(defaultConfigs[i], 'global', () => {}, false);
              console.log(`[Style Config Manager] ✅ 已删除重复配置: ${defaultConfigs[i].name}`);
            } catch (error) {
              console.warn(`[Style Config Manager] 删除重复配置失败: ${defaultConfigs[i].name}`, error);
            }
          }

          console.log('[Style Config Manager] ✅ 重复默认配置清理完成');
        } else {
          console.log('[Style Config Manager] 未发现重复的默认配置');
        }
      } catch (error) {
        console.warn('[Style Config Manager] 清理重复配置时出错:', error);
      }
    }

    // 清理旧的默认配置文件（包括带时间戳的）
    async cleanupOldDefaultConfigs() {
      try {
        if (!sillyTavernCoreImported) {
          console.log('[Style Config Manager] SillyTavern未导入，跳过清理');
          return;
        }

        console.log('[Style Config Manager] 🧹 正在清理旧的默认配置文件...');

        // 获取所有配置文件
        const globalAttachments = getDataBankAttachmentsForSource('global', true);

        // 查找所有默认配置相关的文件
        const defaultRelatedConfigs = globalAttachments.filter(
          att =>
            att.name === STYLE_CONFIG_FILE_NAME ||
            (att.name.startsWith('mobile_config_') && att.name.includes('_mobile_style_config.json')),
        );

        if (defaultRelatedConfigs.length > 0) {
          console.log(`[Style Config Manager] 发现 ${defaultRelatedConfigs.length} 个默认配置相关文件，准备清理...`);

          // 删除所有相关文件
          for (const config of defaultRelatedConfigs) {
            try {
              console.log(`[Style Config Manager] 正在删除旧配置: ${config.name}`);
              await deleteAttachment(config, 'global', () => {}, false);
              console.log(`[Style Config Manager] ✅ 已删除旧配置: ${config.name}`);
            } catch (error) {
              console.warn(`[Style Config Manager] 删除旧配置失败: ${config.name}`, error);
            }
          }

          console.log('[Style Config Manager] ✅ 旧默认配置清理完成');
        } else {
          console.log('[Style Config Manager] 未发现需要清理的旧默认配置');
        }
      } catch (error) {
        console.warn('[Style Config Manager] 清理旧默认配置时出错:', error);
      }
    }

    // 从Data Bank加载配置
    async loadConfig() {
      try {
        console.log('[Style Config Manager] 🔄 从Data Bank加载样式配置...');

        if (sillyTavernCoreImported && getDataBankAttachmentsForSource && getFileAttachment) {
          // 使用SillyTavern原生API
          const result = await this.loadConfigFromDataBank();
          if (result) {
            this.configLoaded = true;
            return;
          }
        }

        // 备用方案：从localStorage加载
        await this.loadConfigFromLocalStorage();
        this.configLoaded = true;
      } catch (error) {
        console.warn('[Style Config Manager] 加载配置失败，使用默认配置:', error);
        this.configLoaded = true;
      }
    }

    // 从Data Bank加载配置
    async loadConfigFromDataBank() {
      try {
        console.log('[Style Config Manager] 🔍 开始从Data Bank加载配置...');

        // 获取全局附件列表
        const globalAttachments = getDataBankAttachmentsForSource('global', true);
        console.log('[Style Config Manager] 全局附件数量:', globalAttachments.length);

        // 寻找配置文件，优先寻找标准名称，然后寻找带时间戳的JSON文件
        let configAttachment = globalAttachments.find(att => att.name === STYLE_CONFIG_FILE_NAME);

        if (!configAttachment) {
          console.log('[Style Config Manager] 未找到标准配置文件，寻找带时间戳的配置文件...');
          // 寻找最新的mobile_config_开头的JSON文件
          const mobileConfigs = globalAttachments
            .filter(att => att.name.startsWith('mobile_config_') && att.name.endsWith('.json'))
            .sort((a, b) => {
              // 按文件名中的时间戳排序，最新的在前
              const timeA = parseInt(a.name.match(/mobile_config_(\d+)_/)?.[1] || '0');
              const timeB = parseInt(b.name.match(/mobile_config_(\d+)_/)?.[1] || '0');
              return timeB - timeA;
            });

          console.log(
            '[Style Config Manager] 找到带时间戳的配置文件:',
            mobileConfigs.map(c => c.name),
          );

          if (mobileConfigs.length > 0) {
            configAttachment = mobileConfigs[0]; // 使用最新的
            console.log('[Style Config Manager] 选择最新的配置文件:', configAttachment.name);
          }
        }

        if (configAttachment) {
          console.log('[Style Config Manager] 📁 找到配置文件:', configAttachment.name);
          console.log('[Style Config Manager] 配置文件URL:', configAttachment.url);

          // 验证URL格式
          if (configAttachment.url.endsWith('.txt')) {
            console.error('[Style Config Manager] ❌ 配置文件被错误保存为TXT格式，无法加载');
            return false;
          }

          // 下载文件内容
          console.log('[Style Config Manager] 🔄 下载文件内容...');
          const configContent = await getFileAttachment(configAttachment.url);
          console.log('[Style Config Manager] 下载的内容长度:', configContent ? configContent.length : 0);

          if (configContent && configContent.trim()) {
            try {
              const parsedConfig = JSON.parse(configContent);
              console.log('[Style Config Manager] ✅ JSON解析成功');

              // 合并配置（保留默认值，覆盖已存在的值）
              this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, parsedConfig);

              console.log('[Style Config Manager] ✅ 从Data Bank加载配置成功:', this.currentConfig);
              return true;
            } catch (parseError) {
              console.error('[Style Config Manager] ❌ JSON解析失败:', parseError);
              console.log('[Style Config Manager] 无效的JSON内容:', configContent.substring(0, 200));
              return false;
            }
          }
        }

        console.log('[Style Config Manager] 📄 Data Bank中未找到有效的配置文件，使用默认配置');
        return false;
      } catch (error) {
        console.error('[Style Config Manager] ❌ 从Data Bank加载配置失败:', error);
        return false;
      }
    }

    // 从localStorage加载配置
    async loadConfigFromLocalStorage() {
      try {
        const storageKey = `sillytavern_mobile_${STYLE_CONFIG_FILE_NAME}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const parsedConfig = JSON.parse(stored);
          this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, parsedConfig);
          console.log('[Style Config Manager] ✅ 从localStorage加载配置成功');
        } else {
          console.log('[Style Config Manager] 📄 localStorage中未找到配置，使用默认配置');
        }
      } catch (error) {
        console.warn('[Style Config Manager] 从localStorage加载配置失败:', error);
      }
    }

    // 保存配置到Data Bank
    async saveConfig() {
      try {
        console.log('[Style Config Manager] 💾 保存样式配置...');
        console.log('[Style Config Manager] sillyTavernCoreImported:', sillyTavernCoreImported);
        console.log('[Style Config Manager] uploadFileAttachmentToServer:', !!uploadFileAttachmentToServer);

        if (sillyTavernCoreImported && uploadFileAttachmentToServer) {
          console.log('[Style Config Manager] 🔄 尝试保存到Data Bank...');
          // 优先使用SillyTavern原生API
          const success = await this.saveConfigToDataBank();
          console.log('[Style Config Manager] Data Bank保存结果:', success);

          if (success) {
            console.log('[Style Config Manager] ✅ Data Bank保存成功，同时保存到localStorage备份');
            // 同时保存到localStorage作为备份
            await this.saveConfigToLocalStorage();
            this.applyStyles();
            return true;
          } else {
            console.warn('[Style Config Manager] ⚠️ Data Bank保存失败，使用localStorage备用方案');
          }
        } else {
          console.log('[Style Config Manager] ⚠️ SillyTavern API不可用，直接使用localStorage');
        }

        // 备用方案：保存到localStorage
        console.log('[Style Config Manager] 🔄 保存到localStorage...');
        await this.saveConfigToLocalStorage();
        this.applyStyles();
        console.log('[Style Config Manager] ✅ localStorage保存完成');
        return true;
      } catch (error) {
        console.error('[Style Config Manager] ❌ 保存配置失败:', error);
        return false;
      }
    }

    // 保存配置到Data Bank
    async saveConfigToDataBank() {
      try {
        console.log('[Style Config Manager] 🔄 开始保存到Data Bank...');
        console.log('[Style Config Manager] 文件名:', STYLE_CONFIG_FILE_NAME);

        const configJson = JSON.stringify(this.currentConfig, null, 2);
        console.log('[Style Config Manager] 配置JSON长度:', configJson.length);

        // 先清理旧的默认配置文件
        await this.cleanupOldDefaultConfigs();

        // 使用标准的文件名，不添加时间戳
        const safeFileName = STYLE_CONFIG_FILE_NAME;
        console.log('[Style Config Manager] 使用标准文件名:', safeFileName);

        const file = new File([configJson], safeFileName, { type: 'application/json' });
        console.log('[Style Config Manager] 创建文件对象:', {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        // 上传文件到全局Data Bank
        console.log('[Style Config Manager] 🔄 调用uploadFileAttachmentToServer...');
        const fileUrl = await uploadFileAttachmentToServer(file, 'global');
        console.log('[Style Config Manager] 上传返回URL:', fileUrl);

        // 验证返回的URL是否是JSON格式
        const isValidJsonUrl =
          fileUrl && (fileUrl.endsWith('.json') || fileUrl.includes(safeFileName.replace('.json', '')));

        if (fileUrl && isValidJsonUrl) {
          console.log('[Style Config Manager] ✅ 配置已保存到Data Bank (JSON格式):', fileUrl);

          // 验证文件是否正确保存
          console.log('[Style Config Manager] 🔍 验证保存结果...');
          setTimeout(async () => {
            try {
              const globalAttachments = getDataBankAttachmentsForSource('global', true);
              const savedConfig = globalAttachments.find(att => att.name === STYLE_CONFIG_FILE_NAME);
              console.log('[Style Config Manager] 验证结果 - 文件已保存:', !!savedConfig);
              if (savedConfig) {
                console.log('[Style Config Manager] 保存的文件信息:', savedConfig);
              }
            } catch (verifyError) {
              console.warn('[Style Config Manager] 验证保存结果失败:', verifyError);
            }
          }, 500);

          return true;
        } else if (fileUrl && fileUrl.endsWith('.txt')) {
          console.error('[Style Config Manager] ❌ 文件被错误保存为TXT格式:', fileUrl);
          console.error(
            '[Style Config Manager] SillyTavern的uploadFileAttachmentToServer函数有问题，JSON文件被保存为TXT',
          );
          return false;
        }

        console.warn('[Style Config Manager] ⚠️ uploadFileAttachmentToServer返回空URL或无效格式');
        return false;
      } catch (error) {
        console.error('[Style Config Manager] ❌ 保存到Data Bank失败:', error);
        return false;
      }
    }

    // 保存配置到localStorage
    async saveConfigToLocalStorage() {
      try {
        const storageKey = `sillytavern_mobile_${STYLE_CONFIG_FILE_NAME}`;
        const configJson = JSON.stringify(this.currentConfig, null, 2);
        localStorage.setItem(storageKey, configJson);
        console.log('[Style Config Manager] ✅ 配置已保存到localStorage');
      } catch (error) {
        console.warn('[Style Config Manager] 保存到localStorage失败:', error);
      }
    }

    // 应用样式到页面
    applyStyles() {
      if (!this.styleElement) {
        console.warn('[Style Config Manager] 样式元素不存在');
        return;
      }

      const css = this.generateCSS();
      this.styleElement.textContent = css;

      console.log('[Style Config Manager] ✅ 样式已应用');
      console.log('[Style Config Manager] 当前配置:', JSON.stringify(this.currentConfig, null, 2));

      // 验证图片URL是否有效
      Object.keys(this.currentConfig).forEach(key => {
        const config = this.currentConfig[key];
        if (config && config.backgroundImage) {
          console.log(`[Style Config Manager] ${key} 背景图片URL:`, config.backgroundImage);

          // 如果是http/https URL，尝试验证
          if (config.backgroundImage.startsWith('http')) {
            const img = new Image();
            img.onload = () => console.log(`[Style Config Manager] ✅ ${key} 图片加载成功`);
            img.onerror = () => console.warn(`[Style Config Manager] ❌ ${key} 图片加载失败:`, config.backgroundImage);
            img.src = config.backgroundImage;
          }
        }
      });

      // 触发样式应用事件
      this.dispatchStyleAppliedEvent();
    }

    // 生成CSS字符串
    generateCSS() {
      const config = this.currentConfig;

      // 处理URL，确保格式正确且安全
      const formatImageUrl = url => {
        if (!url) return '';

        // 如果是base64数据，直接返回
        if (url.startsWith('data:')) {
          return url;
        }

        // 对于普通URL路径，直接返回（不再拒绝.txt文件，因为可能是有效的图片数据）
        // 如果URL不以引号包围，添加引号
        if (!url.startsWith('"') && !url.startsWith("'")) {
          return `"${url}"`;
        }

        return url;
      };

      // 生成头像背景的CSS样式
      const generateAvatarCSS = (avatarConfig, selector) => {
        if (!avatarConfig || typeof avatarConfig === 'string') {
          // 处理旧格式的configKey
          const oldConfig = config[avatarConfig];
          if (!oldConfig) return '';

          const backgroundImage = oldConfig.backgroundImage || oldConfig.backgroundImageUrl;
          if (!backgroundImage) return '';

          const rotation = parseFloat(oldConfig.rotation) || 0;
          const scale = parseFloat(oldConfig.scale) || 1;
          const backgroundPosition = oldConfig.backgroundPosition || 'center center';

          return `
${selector} {
    background-image: url(${formatImageUrl(backgroundImage)}) !important;
    background-size: ${scale * 100}% !important;
    background-position: ${backgroundPosition} !important;
    background-repeat: no-repeat !important;
    transform: rotate(${rotation}deg) !important;
    transform-origin: center center !important;
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
}`;
        }

        // 处理新格式的avatar对象
        const backgroundImage = avatarConfig.backgroundImage || avatarConfig.backgroundImageUrl;
        if (!backgroundImage) return '';

        const rotation = parseFloat(avatarConfig.rotation) || 0;
        const scale = parseFloat(avatarConfig.scale) || 1;
        const backgroundPosition = avatarConfig.backgroundPosition || 'center center';

        return `
${selector} {
    background-image: url(${formatImageUrl(backgroundImage)}) !important;
    background-size: ${scale * 100}% !important;
    background-position: ${backgroundPosition} !important;
    background-repeat: no-repeat !important;
    transform: rotate(${rotation}deg) !important;
    transform-origin: center center !important;
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
}`;
      };

      let css = `
/* 移动端样式配置 - 由StyleConfigManager自动生成 */
.home-screen {
    ${
      config.homeScreen.backgroundImage
        ? `background-image: url(${formatImageUrl(config.homeScreen.backgroundImage)}) !important;
         background-size: cover !important;
         background-position: center !important;
         background-repeat: no-repeat !important;`
        : config.homeScreen.backgroundImageUrl
        ? `background-image: url(${formatImageUrl(config.homeScreen.backgroundImageUrl)}) !important;
         background-size: cover !important;
         background-position: center !important;
         background-repeat: no-repeat !important;`
        : `background: `
    }
}

.message-detail-app {
    ${
      config.messageDetailApp.backgroundImage
        ? `background-image: url(${formatImageUrl(config.messageDetailApp.backgroundImage)}) !important;
         background-size: cover !important;
         background-position: center !important;
         background-repeat: no-repeat !important;`
        : config.messageDetailApp.backgroundImageUrl
        ? `background-image: url(${formatImageUrl(config.messageDetailApp.backgroundImageUrl)}) !important;
         background-size: cover !important;
         background-position: center !important;
         background-repeat: no-repeat !important;`
        : `background: #;`
    }
}

.messages-app {
    ${
      config.messagesApp.backgroundImage
        ? `background-image: url(${formatImageUrl(config.messagesApp.backgroundImage)}) !important;
         background-size: cover !important;
         background-position: ${config.messagesApp.backgroundPosition || 'center center'} !important;
         background-repeat: no-repeat !important;`
        : config.messagesApp.backgroundImageUrl
        ? `background-image: url(${formatImageUrl(config.messagesApp.backgroundImageUrl)}) !important;
         background-size: cover !important;
         background-position: ${config.messagesApp.backgroundPosition || 'center center'} !important;
         background-repeat: no-repeat !important;`
        : `background: #;`
    }
}

/* 隐藏所有消息头像中的表情符号文本，只显示背景图片 */
.message-avatar {
    font-size: 0 !important;
    color: transparent !important;
    text-indent: -9999px !important;
    overflow: hidden !important;
}

/* 头像背景样式 */
${(() => {
  const sentAvatarCSS = generateAvatarCSS(config.messageSentAvatar, '.message-sent > .message-avatar');
  console.log(`[Style Config Manager] 发送头像配置:`, config.messageSentAvatar);
  console.log(`[Style Config Manager] 发送头像CSS:`, sentAvatarCSS);
  return sentAvatarCSS;
})()}
${
  config.messageReceivedAvatars
    ? config.messageReceivedAvatars
        .map((avatar, index) => {
          if (avatar.friendId && avatar.friendId.trim()) {
            console.log(
              `[Style Config Manager] ✅ 生成接收头像CSS: ${avatar.name || `头像${index + 1}`} (ID: ${
                avatar.friendId
              })`,
            );
            console.log(`[Style Config Manager] 头像配置数据:`, avatar);
            // 生成两种CSS选择器以覆盖不同的页面结构
            const css1 = generateAvatarCSS(
              avatar,
              `.message-item[data-friend-id="${avatar.friendId}"] .message-avatar`,
            );
            const css2 = generateAvatarCSS(avatar, `.message-received #message-avatar-${avatar.friendId}`);
            console.log(`[Style Config Manager] 生成的CSS1:`, css1);
            console.log(`[Style Config Manager] 生成的CSS2:`, css2);
            return css1 + '\n' + css2;
          } else {
            console.warn(
              `[Style Config Manager] ⚠️ 跳过无效头像配置: ${avatar.name || `头像${index + 1}`} - 缺少好友ID`,
            );
            return '';
          }
        })
        .join('\n')
    : ''
}
        `.trim();

      // 添加好友专属背景CSS
      if (config.friendBackgrounds && config.friendBackgrounds.length > 0) {
        css += '\n\n/* 好友专属聊天背景 */\n';
        config.friendBackgrounds.forEach(friendBg => {
          if (friendBg.friendId && friendBg.friendId.trim()) {
            const backgroundImage = friendBg.backgroundImage || friendBg.backgroundImageUrl;
            if (backgroundImage) {
              const backgroundPosition = friendBg.backgroundPosition || 'center center';
              const rotation = parseFloat(friendBg.rotation) || 0;
              const scale = parseFloat(friendBg.scale) || 1;

              css += `
.message-detail-content[data-background-id="${friendBg.friendId}"] {
    background-image: url(${formatImageUrl(backgroundImage)}) !important;
    background-size: cover !important;
    background-position: ${backgroundPosition} !important;
    background-repeat: no-repeat !important;
    transform: rotate(${rotation}deg) scale(${scale}) !important;
    transform-origin: center center !important;
}
`;
              console.log(`[Style Config Manager] ✅ 生成好友专属背景CSS: ${friendBg.name || friendBg.friendId}`);
            }
          }
        });
      }

      // 添加自定义CSS样式
      if (config.customStyles && config.customStyles.cssText) {
        css += '\n\n/* 用户自定义CSS样式 */\n' + config.customStyles.cssText;
      }

      console.log('[Style Config Manager] 生成的CSS:', css);
      return css;
    }

    // 获取当前配置
    getConfig() {
      return JSON.parse(JSON.stringify(this.currentConfig));
    }

    // 更新配置项
    updateConfig(key, property, value) {
      // 处理数组类型的配置（如messageReceivedAvatars、friendBackgrounds）
      if ((key === 'messageReceivedAvatars' || key === 'friendBackgrounds') && property === null) {
        this.currentConfig[key] = value;
        console.log(`[Style Config Manager] 数组配置已更新: ${key} = `, value);
        return true;
      }

      // 处理普通对象配置
      if (this.currentConfig[key] && this.currentConfig[key].hasOwnProperty(property)) {
        this.currentConfig[key][property] = value;
        console.log(`[Style Config Manager] 配置已更新: ${key}.${property} = ${value}`);
        return true;
      }

      console.warn(`[Style Config Manager] 无效的配置项: ${key}.${property}`);
      return false;
    }

    // 批量更新配置
    updateMultipleConfigs(updates) {
      let hasChanges = false;

      for (const update of updates) {
        if (this.updateConfig(update.key, update.property, update.value)) {
          hasChanges = true;
        }
      }

      return hasChanges;
    }

    // 合并配置对象
    mergeConfigs(defaultConfig, userConfig) {
      const merged = JSON.parse(JSON.stringify(defaultConfig));

      for (const key in userConfig) {
        if (userConfig.hasOwnProperty(key) && merged.hasOwnProperty(key)) {
          // 处理数组类型的配置（如messageReceivedAvatars）
          if (Array.isArray(userConfig[key])) {
            merged[key] = userConfig[key];
          } else if (typeof userConfig[key] === 'object' && userConfig[key] !== null) {
            merged[key] = { ...merged[key], ...userConfig[key] };
          } else {
            merged[key] = userConfig[key];
          }
        }
      }

      // 兼容性处理：迁移旧的单个messageReceivedAvatar到数组格式
      if (userConfig.messageReceivedAvatar && !userConfig.messageReceivedAvatars) {
        console.log('[Style Config Manager] 检测到旧格式头像配置，正在迁移...');
        merged.messageReceivedAvatars = [
          {
            id: 'migrated_default',
            ...userConfig.messageReceivedAvatar,
            name: '迁移的好友头像',
            description: '从旧配置迁移的接收消息头像背景',
          },
        ];
      }

      return merged;
    }

    // 获取所有样式配置文件
    async getAllStyleConfigs() {
      try {
        if (sillyTavernCoreImported && getDataBankAttachmentsForSource) {
          // 从Data Bank获取配置文件列表
          const globalAttachments = getDataBankAttachmentsForSource('global', true);
          const styleConfigs = globalAttachments.filter(att => att.name.endsWith('_style_config.json'));

          // 过滤掉带时间戳的旧默认配置文件
          const validConfigs = styleConfigs.filter(att => {
            // 保留标准的默认配置文件
            if (att.name === STYLE_CONFIG_FILE_NAME) {
              return true;
            }
            // 过滤掉带时间戳的默认配置文件
            if (att.name.startsWith('mobile_config_') && att.name.includes('_mobile_style_config.json')) {
              console.log('[Style Config Manager] 过滤掉带时间戳的旧默认配置:', att.name);
              return false;
            }
            // 保留其他用户配置文件
            return true;
          });

          // 确保默认配置只出现一次，并放在最前面
          const defaultConfigs = validConfigs.filter(att => att.name === STYLE_CONFIG_FILE_NAME);
          const userConfigs = validConfigs.filter(att => att.name !== STYLE_CONFIG_FILE_NAME);

          // 如果有多个默认配置，只保留一个
          const finalConfigs = [];
          if (defaultConfigs.length > 0) {
            finalConfigs.push(defaultConfigs[0]); // 只保留第一个默认配置
          }
          finalConfigs.push(...userConfigs);

          console.log(
            '[Style Config Manager] 找到有效配置文件:',
            finalConfigs.map(c => c.name),
          );
          return finalConfigs;
        }

        // 备用方案：从localStorage获取
        const configs = [];
        const configKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sillytavern_mobile_') && key.endsWith('_style_config.json')) {
            configKeys.push(key);
          }
        }

        // 处理默认配置
        const defaultKey = `sillytavern_mobile_${STYLE_CONFIG_FILE_NAME}`;
        const userKeys = configKeys.filter(key => key !== defaultKey);

        if (configKeys.includes(defaultKey)) {
          configs.push({
            name: STYLE_CONFIG_FILE_NAME,
            url: `localStorage://${defaultKey}`,
            source: 'localStorage',
            created: Date.now(),
          });
        }

        // 添加用户配置
        userKeys.forEach(key => {
          const fileName = key.replace('sillytavern_mobile_', '');
          configs.push({
            name: fileName,
            url: `localStorage://${key}`,
            source: 'localStorage',
            created: Date.now(),
          });
        });

        return configs;
      } catch (error) {
        console.warn('[Style Config Manager] 获取配置列表失败:', error);
        return [];
      }
    }

    // 从指定配置文件加载配置
    async loadConfigFromFile(fileName) {
      try {
        if (sillyTavernCoreImported && getDataBankAttachmentsForSource && getFileAttachment) {
          // 从Data Bank加载
          const globalAttachments = getDataBankAttachmentsForSource('global', true);
          const configAttachment = globalAttachments.find(att => att.name === fileName);

          if (configAttachment) {
            const configContent = await getFileAttachment(configAttachment.url);
            if (configContent && configContent.trim()) {
              const parsedConfig = JSON.parse(configContent);
              this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, parsedConfig);
              this.applyStyles();
              console.log('[Style Config Manager] ✅ 已加载配置:', fileName);
              return true;
            }
          }
        }

        // 备用方案：从localStorage加载
        const storageKey = `sillytavern_mobile_${fileName}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, parsedConfig);
          this.applyStyles();
          console.log('[Style Config Manager] ✅ 从localStorage加载配置:', fileName);
          return true;
        }

        return false;
      } catch (error) {
        console.error('[Style Config Manager] 加载配置文件失败:', error);
        return false;
      }
    }

    // 保存配置到指定文件名
    async saveConfigWithName(configName) {
      try {
        // 验证配置名称
        if (!configName || configName.trim() === '') {
          throw new Error('配置名称不能为空');
        }

        // 防止与默认配置冲突
        const cleanName = configName.trim();
        if (cleanName === 'mobile' || cleanName === 'default' || cleanName === '默认') {
          throw new Error('不能使用 "mobile"、"default" 或 "默认" 作为配置名称，这些名称为系统保留');
        }

        // 确保文件名格式正确
        const fileName = cleanName.endsWith('.json') ? cleanName : `${cleanName}_style_config.json`;

        // 检查是否会与默认配置文件名冲突
        if (fileName === STYLE_CONFIG_FILE_NAME) {
          throw new Error('此配置名称会与默认配置冲突，请选择其他名称');
        }

        if (sillyTavernCoreImported && uploadFileAttachmentToServer) {
          // 保存到Data Bank
          const configJson = JSON.stringify(this.currentConfig, null, 2);
          const file = new File([configJson], fileName, { type: 'application/json' });

          const fileUrl = await uploadFileAttachmentToServer(file, 'global');
          if (fileUrl) {
            console.log('[Style Config Manager] ✅ 配置已保存为:', fileName);

            // 同时保存到localStorage
            const storageKey = `sillytavern_mobile_${fileName}`;
            localStorage.setItem(storageKey, configJson);

            return true;
          }
        }

        // 备用方案：保存到localStorage
        const storageKey = `sillytavern_mobile_${fileName}`;
        const configJson = JSON.stringify(this.currentConfig, null, 2);
        localStorage.setItem(storageKey, configJson);
        console.log('[Style Config Manager] ✅ 配置已保存到localStorage:', fileName);
        return true;
      } catch (error) {
        console.error('[Style Config Manager] 保存配置失败:', error);
        throw error; // 重新抛出错误，让调用者处理
      }
    }

    // 删除配置文件
    async deleteConfigFile(fileName) {
      try {
        if (sillyTavernCoreImported && getDataBankAttachmentsForSource && deleteAttachment) {
          // 从Data Bank删除
          const globalAttachments = getDataBankAttachmentsForSource('global', true);
          const configAttachment = globalAttachments.find(att => att.name === fileName);

          if (configAttachment) {
            console.log('[Style Config Manager] 🗑️ 正在从Data Bank删除配置:', fileName);
            // 使用SillyTavern的deleteAttachment函数，confirm参数设为false以避免弹窗
            await deleteAttachment(configAttachment, 'global', () => {}, false);
            console.log('[Style Config Manager] ✅ 已从Data Bank删除配置:', fileName);
          }
        }

        // 从localStorage删除
        const storageKey = `sillytavern_mobile_${fileName}`;
        localStorage.removeItem(storageKey);
        console.log('[Style Config Manager] ✅ 已从localStorage删除配置:', fileName);
        return true;
      } catch (error) {
        console.error('[Style Config Manager] 删除配置失败:', error);
        return false;
      }
    }

    // 生成配置列表HTML
    async generateConfigListSection() {
      const configs = await this.getAllStyleConfigs();

      let configListHTML = '';

      if (configs.length === 0) {
        configListHTML = `
                <div class="no-configs">
                    <p>暂无保存的配置</p>
                    <small>保存当前配置后将在此显示</small>
                </div>
            `;
      } else {
        configListHTML = configs
          .map(config => {
            // 处理显示名称
            let displayName;
            const isDefault = config.name === STYLE_CONFIG_FILE_NAME;

            if (isDefault) {
              displayName = '默认配置';
            } else if (config.name.startsWith('mobile_config_') && config.name.includes('_mobile_style_config.json')) {
              // 处理带时间戳的默认配置文件：mobile_config_timestamp_mobile_style_config.json
              const match = config.name.match(/mobile_config_(\d+)_mobile_style_config\.json/);
              if (match) {
                const timestamp = match[1];
                const date = new Date(parseInt(timestamp));
                displayName = `默认配置 (${date.toLocaleString()})`;
              } else {
                displayName = config.name.replace('_style_config.json', '');
              }
            } else {
              // 处理普通的用户配置文件
              displayName = config.name.replace('_style_config.json', '');
            }

            const createTime = config.created ? new Date(config.created).toLocaleString() : '未知';

            return `
                    <div class="config-item" data-config-file="${config.name}">
                        <div class="config-info">
                            <div class="config-name">
                                ${isDefault ? '🏠' : '📄'} ${displayName}
                                ${isDefault ? '<span class="default-badge">默认</span>' : ''}
                            </div>
                            <div class="config-meta">
                                <small>创建时间: ${createTime}</small>
                                ${config.source ? `<small>来源: ${config.source}</small>` : ''}
                            </div>
                        </div>
                        <div class="config-actions">
                            <button class="config-action-btn load-config" data-config-file="${
                              config.name
                            }" title="加载此配置">
                                📥 加载
                            </button>
                            ${
                              !isDefault
                                ? `
                                <button class="config-action-btn delete-config" data-config-file="${config.name}" title="删除此配置">
                                    🗑️ 删除
                                </button>
                            `
                                : ''
                            }
                        </div>
                    </div>
                `;
          })
          .join('');
      }

      return `
            <div class="config-list-section">
                <div class="section-header">
                    <h3>📋 已保存的配置</h3>
                    <p>管理你保存的样式配置文件</p>
                </div>

                <div class="save-new-config">
                    <div class="save-config-input">
                        <input type="text" id="new-config-name" placeholder="输入配置名称..." maxlength="50">
                        <button id="save-new-config-btn" class="config-btn save-btn">
                            <span class="btn-icon">💾</span>
                            <span>另存为</span>
                        </button>
                    </div>
                </div>

                <div class="config-list">
                    ${configListHTML}
                </div>

                <div class="config-list-actions">
                    <button id="refresh-config-list" class="config-btn">
                        <span class="btn-icon">🔄</span>
                        <span>刷新列表</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 重置为默认配置
    resetToDefault() {
      this.currentConfig = JSON.parse(JSON.stringify(DEFAULT_STYLE_CONFIG));
      console.log('[Style Config Manager] 配置已重置为默认值');
    }

    // 获取设置应用的HTML内容
    getSettingsAppContent() {
      const config = this.getConfig(); // 使用getConfig()确保获取最新配置

      return `
            <div class="style-config-app">
                <div class="style-config-header">
                    <h2>🎨 移动端界面样式设置</h2>
                    <p>自定义移动端界面的背景和样式，配置会保存到全局Data Bank</p>
                </div>

                <div class="style-config-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="editor">
                            ✏️ 样式编辑器
                        </button>
                        <button class="tab-header" data-tab="manager">
                            📋 配置管理
                        </button>
                    </div>

                    <div class="m-tab-content">
                        <div class="tab-panel active" data-tab="editor">
                <div class="style-config-settings">
                    <div class="image-upload-settings">
                        <h4>🔧 图片上传设置</h4>
                        <div class="setting-item">
                            <label>
                                <input type="radio" name="imageUploadMode" value="auto" checked>
                                <span>自动模式</span>
                                <small>优先Data Bank，失败时自动使用base64</small>
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="radio" name="imageUploadMode" value="base64">
                                <span>Base64模式</span>
                                <small>直接转换为base64，配置文件会较大但更稳定</small>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="style-config-content">
                    ${this.generateConfigSection('homeScreen', '主屏幕背景', config.homeScreen)}
                    ${this.generateFriendBackgroundsSection(config.friendBackgrounds || [])}
                    ${this.generateConfigSection('messagesApp', '消息应用背景', config.messagesApp)}
                                ${this.generateAvatarConfigSection(
                                  'messageSentAvatar',
                                  '发送消息头像背景',
                                  config.messageSentAvatar,
                                )}
            ${this.generateReceivedAvatarsSection(config.messageReceivedAvatars)}
                    ${this.generateCustomStylesSection('customStyles', '自定义CSS样式', config.customStyles)}
                            </div>
                        </div>

                        <div class="tab-panel" data-tab="manager">
                            <div class="config-list-section">
                                <div class="section-header">
                                    <h3>📋 已保存的配置</h3>
                                    <p>管理你保存的样式配置文件，使用编辑器底部的"另存为"按钮创建新配置</p>
                                </div>



                                <div class="config-list" id="config-list-container">
                                    <div class="loading-configs">
                                        <div class="loading-icon">⏳</div>
                                        <div class="loading-text">正在加载配置列表...</div>
                                    </div>
                                </div>

                                <div class="config-list-actions">
                                    <button id="refresh-config-list" class="config-btn">
                                        <span>刷新</span>
                                    </button>
                                    <button id="export-config" class="config-btn preview-btn">
                                        <span>导出</span>
                                    </button>
                                    <button id="import-config" class="config-btn save-btn">
                                        <span>导入</span>
                                    </button>
                                </div>

                                <input type="file" id="config-import-input" accept=".json" style="display: none;">
                            </div>
                        </div>


                    </div>
                </div>

                <div class="style-config-footer">
                    <div class="config-actions">
                        <button class="config-btn preview-btn" id="preview-styles">
                            <span>预览样式</span>
                        </button>
                        <button class="config-btn save-btn" id="save-new-config-btn">
                            <span>另存为</span>
                        </button>
                        <button class="config-btn reset-btn" id="reset-styles">
                            <span>重置默认</span>
                        </button>
                    </div>

                    <div class="config-status" id="config-status">
                        <span class="status-icon">ℹ️</span>
                        <span class="status-text">调整完成后点击另存为按钮</span>
                    </div>
                </div>

                <style>
                /* 针对 data-app="settings" 容器的样式优化 */
                [data-app="settings"] {
                    padding: 0 !important;
                    margin: 0 !important;
                    max-height: 100vh !important;
                }

                [data-app="settings"] .style-config-app {
                    margin: 0 !important;
                    padding: 0 !important;
                    max-width: 100% !important;
                    background: transparent !important;
                }

                /* 样式配置应用界面美化 */
                .style-config-app {
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    border-radius: 12px;
                }

                /* 在 data-app="settings" 容器内的头部样式优化 */
                [data-app="settings"] .style-config-header {
                    margin-bottom: 12px !important;
                    padding: 12px 16px !important;
                    border-radius: 8px !important;
                }

                [data-app="settings"] .style-config-header h2 {
                    font-size: 16px !important;
                    margin: 0 0 4px 0 !important;
                }

                [data-app="settings"] .style-config-header p {
                    font-size: 12px !important;
                    margin: 0 !important;
                }

                .style-config-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                }

                .style-config-header h2 {
                    margin: 0 0 10px 0;
                    color: #2d3748;
                    font-size: 17px;
                    font-weight: 600;
                }

                .style-config-header p {
                    margin: 0;
                    color: #718096;
                    font-size: 14px;
                }

                /* 在 data-app="settings" 容器内的标签页样式优化 */
                [data-app="settings"] .style-config-tabs {
                    border-radius: 8px !important;
                }

                [data-app="settings"] .tab-header {
                    padding: 10px 16px !important;
                    font-size: 14px !important;
                    border-bottom: 2px solid transparent !important;
                }

                [data-app="settings"] .m-tab-content {
                    min-height: auto !important;
                    padding: 0 !important;
                }

                /* 标签页样式 */
                .style-config-tabs {
                    border-radius: 12px;
                    overflow: hidden;
                }

                .tab-headers {
                    display: flex;
                    background: #f7fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .tab-header {
                    flex: 1;
                    padding: 16px 24px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    color: #718096;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid transparent;
                }

                .tab-header:hover {
                    background: #edf2f7;
                    color: #4a5568;
                }

                .tab-header.active {
                    background: white;
                    color: #3182ce;
                    border-bottom-color: #3182ce;
                }

                .m-tab-content {
                    min-height: 500px;
                }

                .tab-panel {
                    display: none;
                    animation: fadeIn 0.3s ease;
                }

                .tab-panel.active {
                    display: block;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* 在 data-app="settings" 容器内的设置区域样式优化 */
                [data-app="settings"] .style-config-settings {
                    margin-bottom: 16px !important;
                }

                [data-app="settings"] .image-upload-settings {
                    padding: 12px !important;
                    margin-bottom: 12px !important;
                    border-radius: 8px !important;
                }

                [data-app="settings"] .image-upload-settings h4 {
                    font-size: 14px !important;
                    margin: 0 0 8px 0 !important;
                }

                /* 设置区域样式 */
                .style-config-settings {
                    margin-bottom: 30px;
                }

                .image-upload-settings {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .image-upload-settings h4 {
                    margin: 0 0 16px 0;
                    color: #856404;
                    font-size: 16px;
                    font-weight: 600;
                }

                .setting-item {
                    margin-bottom: 12px;
                }

                .setting-item label {
                    display: flex;
                    align-items: flex-start;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: background-color 0.2s;
                }

                .setting-item label:hover {
                    background: rgba(133, 100, 4, 0.1);
                }

                .setting-item input[type="radio"] {
                    margin-right: 12px;
                    margin-top: 2px;
                }

                .setting-item span {
                    font-weight: 500;
                    color: #856404;
                    margin-bottom: 4px;
                }

                .setting-item small {
                    display: block;
                    color: #6c757d;
                    font-size: 13px;
                    line-height: 1.4;
                }

                /* 在 data-app="settings" 容器内的配置区段样式优化 */
                [data-app="settings"] .config-section {
                    margin-bottom: 12px !important;
                    border-radius: 8px !important;
                    padding: 0 !important;
                }

                [data-app="settings"] .section-header {
                    padding: 12px 16px !important;
                }

                [data-app="settings"] .section-header h3 {
                    font-size: 16px !important;
                    margin: 0 0 4px 0 !important;
                }

                [data-app="settings"] .section-header p {
                    font-size: 12px !important;
                    margin: 0 0 8px 0 !important;
                }

                [data-app="settings"] .section-fields {
                    padding: 12px 16px !important;
                }

                /* 配置区段样式 */
                .config-section {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 0;
                    margin-bottom: 24px;
                    border: 1px solid #e2e8f0;
                }

                .section-header h3 {
                    margin: 0 0 8px 0;
                    color: #2d3748;
                    font-size: 20px;
                    font-weight: 600;
                }

                .section-header p {
                    margin: 0 0 20px 0;
                    color: #718096;
                    font-size: 14px;
                }

                /* 在 data-app="settings" 容器内的图片上传字段样式优化 */
                [data-app="settings"] .image-upload-field {
                    margin-bottom: 16px !important;
                }

                [data-app="settings"] .image-upload-field label {
                    margin-bottom: 8px !important;
                    font-size: 13px !important;
                }

                [data-app="settings"] .image-upload-container {
                    padding: 12px !important;
                    border-radius: 8px !important;
                }

                [data-app="settings"] .image-preview {
                    min-height: 80px !important;
                    margin-bottom: 8px !important;
                }

                [data-app="settings"] .image-preview img {
                    max-height: 80px !important;
                }

                [data-app="settings"] .upload-btn,
                [data-app="settings"] .remove-btn {
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                }

                /* 图片上传字段样式 */
                .image-upload-field {
                    margin-bottom: 24px;
                }

                .image-upload-field label {
                    display: block;
                    margin-bottom: 12px;
                    font-weight: 600;
                    color: #4a5568;
                }

                .image-upload-container {
                    border: 2px dashed #cbd5e0;
                    border-radius: 12px;
                    padding: 20px;
                    background: white;
                    transition: all 0.3s ease;
                }

                .image-upload-container:hover {
                    border-color: #3182ce;
                    background: #f7fafc;
                }

                .image-preview {
                    margin-bottom: 16px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #f7fafc;
                    min-height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-preview img {
                    max-width: 100%;
                    max-height: 120px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .no-image {
                    color: #a0aec0;
                    font-size: 18px;
                    padding: 40px;
                    text-align: center;
                }

                .image-upload-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .upload-btn, .remove-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .upload-btn {
                    background: #3182ce;
                    color: white;
                }

                .upload-btn:hover {
                    background: #2c5aa0;
                    transform: translateY(-1px);
                }

                .remove-btn {
                    background: #e53e3e;
                    color: white;
                }

                .remove-btn:hover {
                    background: #c53030;
                    transform: translateY(-1px);
                }

                /* 自定义CSS样式区域 */
                .custom-css-field {
                    margin-bottom: 24px;
                }

                .custom-css-container {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                }

                .custom-css-textarea {
                    width: 100%;
                    padding: 16px;
                    border: none;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    background: #1a202c;
                    color: #e2e8f0;
                    resize: vertical;
                    min-height: 200px;
                    border-radius: 0;
                    outline: none;
                }

                .custom-css-textarea:focus {
                    background: #2d3748;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                }

                .css-help {
                    padding: 12px 16px;
                    background: #f7fafc;
                    border-top: 1px solid #e2e8f0;
                    color: #4a5568;
                }

                /* 在 data-app="settings" 容器内的按钮样式优化 */
                [data-app="settings"] .config-btn {
                    padding: 8px 16px !important;
                    font-size: 12px !important;
                    margin-right: 8px !important;
                    border-radius: 6px !important;
                }

                [data-app="settings"] .style-config-footer {
                    padding: 12px 16px !important;
                    position: static !important;
                }

                [data-app="settings"] .config-actions {
                    margin-bottom: 8px !important;
                    gap: 0 !important;
                }

                [data-app="settings"] .config-status {
                    padding: 8px 12px !important;
                    font-size: 12px !important;
                    margin-top: 8px !important;
                }

                /* 按钮样式 */
                .config-btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    margin-right: 12px;
                }

                .config-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .save-btn {
                    background: #38a169;
                    color: white;
                }

                .save-btn:hover {
                    background: #2f855a;
                }

                .preview-btn {
                    background: #3182ce;
                    color: white;
                }

                .preview-btn:hover {
                    background: #2c5aa0;
                }

                .reset-btn {
                    background: #ed8936;
                    color: white;
                }

                .reset-btn:hover {
                    background: #dd6b20;
                }

                .danger-btn {
                    background: #e53e3e;
                    color: white;
                }

                .danger-btn:hover {
                    background: #c53030;
                }

                /* 状态显示 */
                .config-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-top: 16px;
                }

                .config-status.info {
                    background: #bee3f8;
                    color: #2c5aa0;
                    border: 1px solid #90cdf4;
                }

                .config-status.success {
                    background: #c6f6d5;
                    color: #2f855a;
                    border: 1px solid #9ae6b4;
                }

                .config-status.error {
                    background: #fed7d7;
                    color: #c53030;
                    border: 1px solid #feb2b2;
                }

                .config-status.loading {
                    background: #fefcbf;
                    color: #d69e2e;
                    border: 1px solid #faf089;
                }

                /* 配置列表样式 */
                .config-item {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .no-configs {
                    text-align: center;
                    padding: 40px;
                    color: #718096;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .config-item:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-1px);
                }

                .config-name {
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 4px;
                    word-break: break-all;
                }

                .default-badge {
                    background: #3182ce;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin-left: 8px;
                }

                .config-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-top:20px
                }

                .config-action-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .config-action-btn.load-config {
                    background: #3182ce;
                    color: white;
                }

                .config-action-btn.delete-config {
                    background: #e53e3e;
                    color: white;
                }

                .config-action-btn:hover {
                    transform: translateY(-1px);
                }

                /* 加载动画 */
                .loading-configs {
                    text-align: center;
                    padding: 40px;
                    color: #718096;
                }

                .loading-icon {
                    font-size: 24px;
                    margin-bottom: 12px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* 在 data-app="settings" 容器内的头像配置样式优化 */
                [data-app="settings"] .avatar-config-section {
                    border-left: 3px solid #8b5cf6 !important;
                }

                [data-app="settings"] .avatar-control-field {
                    margin-bottom: 12px !important;
                }

                [data-app="settings"] .avatar-card {
                    margin-bottom: 12px !important;
                }

                [data-app="settings"] .avatar-card-header {
                    padding: 12px 16px !important;
                }

                [data-app="settings"] .avatar-card-content {
                    padding: 12px 16px !important;
                    gap: 12px !important;
                }

                [data-app="settings"] .avatar-preview-circle {
                    width: 32px !important;
                    height: 32px !important;
                }

                [data-app="settings"] .avatar-input,
                [data-app="settings"] .avatar-number {
                    padding: 6px 8px !important;
                    font-size: 12px !important;
                }

                [data-app="settings"] .add-avatar-btn {
                    padding: 8px 16px !important;
                    font-size: 12px !important;
                }

                /* 头像配置区段样式 */
                .avatar-config-section {
                    border-left: 4px solid #8b5cf6;
                    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                }

                .avatar-control-field {
                    margin-bottom: 20px;
                }

                .control-input-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 8px;
                }

                .control-range {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #e2e8f0;
                    outline: none;
                    cursor: pointer;
                }

                .control-range::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #8b5cf6;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .control-range::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #8b5cf6;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .control-number {
                    width: 80px;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    text-align: center;
                    font-weight: 500;
                }

                .avatar-preview-field {
                    background: #ffffff;
                    border: 2px dashed #8b5cf6;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin-top: 20px;
                }

                .avatar-preview-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .avatar-preview {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    background: #f8fafc;
                    border-radius: 50%;
                    border: 2px solid #e2e8f0;
                    overflow: hidden;
                    position: relative;
                }

                .avatar-preview-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #f0f0f0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    transition: all 0.3s ease;
                    border: 1px solid #d1d5db;
                }

                .preview-info {
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 8px;
                }

                /* 头像卡片样式 */
                .avatars-section {
                    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
                    border: 2px solid #7c3aed;
                }

                .avatars-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .avatar-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .avatar-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
                }

                .avatar-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border-bottom: 1px solid #e2e8f0;
                }

                .avatar-card-title {
                    flex: 1;
                    margin-right: 12px;
                }

                .avatar-name-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    background: white;
                    transition: border-color 0.2s;
                }

                .avatar-name-input:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .avatar-card-actions {
                    display: flex;
                    gap: 8px;
                }

                .avatar-action-btn {
                    padding: 6px 8px;
                    border: none;
                    border-radius: 6px;
                    background: #f3f4f6;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .avatar-action-btn:hover {
                    background: #e5e7eb;
                    transform: scale(1.05);
                }

                .avatar-action-btn.delete-btn:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .avatar-card-content {
                    padding: 20px;
                    display: flex;
                    gap: 20px;
                }

                .avatar-preview-section {
                    flex-shrink: 0;
                    text-align: center;
                }

                .avatar-preview {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .avatar-preview-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #f0f0f0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    border: 2px solid #e2e8f0;
                    transition: all 0.3s ease;
                }

                .avatar-preview-label {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                }

                .avatar-fields {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* 好友背景配置样式 */
                .friend-backgrounds-section {
                    border-left: 4px solid #10b981;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                }

                .backgrounds-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .background-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .background-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
                }

                .background-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border-bottom: 1px solid #e2e8f0;
                }

                .background-card-title {
                    flex: 1;
                    margin-right: 12px;
                }

                .background-name-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .background-name-input:focus {
                    outline: none;
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }

                .background-card-actions {
                    display: flex;
                    gap: 8px;
                }

                .background-action-btn {
                    padding: 6px 8px;
                    border: none;
                    border-radius: 6px;
                    background: #f3f4f6;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .background-action-btn:hover {
                    background: #e5e7eb;
                }

                .background-action-btn.delete-btn:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .background-card-content {
                    padding: 20px;
                    display: flex;
                    gap: 20px;
                }

                .background-preview-section {
                    flex-shrink: 0;
                    text-align: center;
                }

                .background-preview {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .background-preview-rect {
                    width: 80px;
                    height: 60px;
                    border-radius: 8px;
                    background: #f0f0f0;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    border: 2px solid #e2e8f0;
                    transition: all 0.3s ease;
                }

                .background-preview-label {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 4px;
                }

                .background-fields {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .background-input, .background-range, .background-number {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .background-input:focus, .background-number:focus {
                    outline: none;
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }

                .background-range {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    outline: none;
                }

                .background-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: #10b981;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .background-range::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    background: #10b981;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .background-file-input {
                    display: none;
                }

                .background-remove-btn {
                    padding: 6px 8px;
                    background: #fee2e2;
                    color: #dc2626;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .background-remove-btn:hover {
                    background: #fecaca;
                }

                .background-actions {
                    text-align: center;
                    margin-top: 20px;
                }

                .add-background-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .add-background-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                }

                .empty-backgrounds {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6b7280;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .empty-text {
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .empty-hint {
                    font-size: 14px;
                    opacity: 0.8;
                }

                .avatar-input, .avatar-range, .avatar-number {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .avatar-input:focus, .avatar-number:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .avatar-range {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    outline: none;
                }

                .avatar-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .avatar-range::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    background: #8b5cf6;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .avatar-file-input {
                    display: none;
                }

                .avatar-remove-btn {
                    padding: 6px 8px;
                    border: none;
                    border-radius: 4px;
                    background: #fee2e2;
                    color: #dc2626;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background-color 0.2s;
                }

                .avatar-remove-btn:hover {
                    background: #fecaca;
                }

                .avatar-actions {
                    margin-top: 20px;
                    text-align: center;
                }

                .add-avatar-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .add-avatar-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                /* 配置状态指示器 */
                .field-status {
                    display: block;
                    margin-top: 4px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }

                .field-status.valid {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #10b981;
                }

                .field-status.invalid {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #ef4444;
                }

                .config-field input[required]:invalid {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
                }

                .config-field input[required]:valid {
                    border-color: #10b981;
                    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
                }

                /* 在 data-app="settings" 容器内的通用紧凑样式 */
                [data-app="settings"] .config-field {
                    margin-bottom: 12px !important;
                }

                [data-app="settings"] .config-field label {
                    margin-bottom: 6px !important;
                    font-size: 13px !important;
                }

                [data-app="settings"] .config-input {
                    padding: 8px 12px !important;
                    font-size: 13px !important;
                    border-radius: 6px !important;
                }

                [data-app="settings"] .custom-css-textarea {
                    min-height: 120px !important;
                    padding: 12px !important;
                    font-size: 12px !important;
                }

                [data-app="settings"] .css-help {
                    padding: 8px 12px !important;
                    font-size: 11px !important;
                }

                [data-app="settings"] .config-item {
                    padding: 12px !important;
                    margin-bottom: 8px !important;
                }

                [data-app="settings"] .config-name {
                    font-size: 13px !important;
                    margin-bottom: 2px !important;
                }

                [data-app="settings"] .config-action-btn {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                }

                /* 响应式设计 */
                @media (max-width: 768px) {
                    .style-config-app {
                        margin: 10px;
                    }

                    /* 在 data-app="settings" 容器内的移动端优化 */
                    [data-app="settings"] .style-config-app {
                        margin: 0 !important;
                    }

                    [data-app="settings"] .tab-headers {
                        flex-direction: row !important;
                    }

                    [data-app="settings"] .tab-header {
                        padding: 8px 12px !important;
                        font-size: 12px !important;
                    }

                    [data-app="settings"] .config-actions {
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                    }

                    [data-app="settings"] .config-btn {
                        flex: 1 1 auto !important;
                        min-width: 80px !important;
                        margin-right: 0 !important;
                    }

                    .tab-headers {
                        flex-direction: column;
                    }

                    .config-actions {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .config-btn {
                        width: 100%;
                        justify-content: center;
                        margin-right: 0;
                        margin-bottom: 10px;
                    }

                    .control-input-container {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .control-number {
                        width: 100%;
                    }

                    .avatar-card-content {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .avatar-preview-section {
                        align-self: center;
                    }

                    .avatar-card-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }

                    .avatar-card-actions {
                        justify-content: center;
                    }

                    .background-card-content {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .background-preview-section {
                        align-self: center;
                    }

                    .background-card-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: stretch;
                    }

                    .background-card-actions {
                        justify-content: center;
                    }
                }

                /* 针对 data-app="settings" 容器的滚动条优化 */
                [data-app="settings"]::-webkit-scrollbar {
                    width: 6px !important;
                }

                [data-app="settings"]::-webkit-scrollbar-track {
                    background: #f1f1f1 !important;
                    border-radius: 3px !important;
                }

                [data-app="settings"]::-webkit-scrollbar-thumb {
                    background: #c1c1c1 !important;
                    border-radius: 3px !important;
                }

                [data-app="settings"]::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8 !important;
                }

                /* 确保设置容器内的内容不会溢出 */
                [data-app="settings"] * {
                    box-sizing: border-box !important;
                }

                [data-app="settings"] .style-config-app * {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width:100%
                }
                    .config-list-actions button{margin-bottom:10px}
                </style>
            </div>
        `;
    }

    // 异步加载配置列表内容
    async loadConfigListContent() {
      try {
        const configListContainer = document.getElementById('config-list-container');
        if (!configListContainer) return;

        const configs = await this.getAllStyleConfigs();

        let configListHTML = '';

        if (configs.length === 0) {
          configListHTML = `
                    <div class="no-configs">
                        <p>暂无保存的配置</p>
                        <small>保存当前配置后将在此显示</small>
                    </div>
                `;
        } else {
          configListHTML = configs
            .map(config => {
              // 处理显示名称
              let displayName;
              const isDefault = config.name === STYLE_CONFIG_FILE_NAME;

              if (isDefault) {
                displayName = '默认配置';
              } else if (
                config.name.startsWith('mobile_config_') &&
                config.name.includes('_mobile_style_config.json')
              ) {
                // 处理带时间戳的默认配置文件：mobile_config_timestamp_mobile_style_config.json
                const match = config.name.match(/mobile_config_(\d+)_mobile_style_config\.json/);
                if (match) {
                  const timestamp = match[1];
                  const date = new Date(parseInt(timestamp));
                  displayName = `默认配置 (${date.toLocaleString()})`;
                } else {
                  displayName = config.name.replace('_style_config.json', '');
                }
              } else {
                // 处理普通的用户配置文件
                displayName = config.name.replace('_style_config.json', '');
              }

              const createTime = config.created ? new Date(config.created).toLocaleString() : '未知';

              return `
                        <div class="config-item" data-config-file="${config.name}">
                            <div class="config-info">
                                <div class="config-name">
                                    ${isDefault ? '🏠' : '📄'} ${displayName}
                                    ${isDefault ? '<span class="default-badge">默认</span>' : ''}
                                </div>
                                <div class="config-meta">
                                    <small>创建时间: ${createTime}</small>
                                    ${config.source ? `<small>来源: ${config.source}</small>` : ''}
                                </div>
                            </div>
                            <div class="config-actions">
                                <button class="config-action-btn load-config" data-config-file="${
                                  config.name
                                }" title="加载此配置">
                                    📥 加载
                                </button>
                                ${
                                  !isDefault
                                    ? `
                                    <button class="config-action-btn delete-config" data-config-file="${config.name}" title="删除此配置">
                                        🗑️ 删除
                                    </button>
                                `
                                    : ''
                                }
                            </div>
                        </div>
                    `;
            })
            .join('');
        }

        configListContainer.innerHTML = configListHTML;

        // 重新绑定配置列表事件
        this.bindConfigListEvents();

        console.log('[Style Config Manager] 配置列表内容已加载');
      } catch (error) {
        console.error('[Style Config Manager] 加载配置列表内容失败:', error);
        const configListContainer = document.getElementById('config-list-container');
        if (configListContainer) {
          configListContainer.innerHTML = `
                    <div class="error-configs">
                        <p>❌ 加载配置列表失败</p>
                        <small>请点击刷新按钮重试</small>
                    </div>
                `;
        }
      }
    }

    // 生成配置区段HTML
    generateConfigSection(key, title, configObject) {
      let fieldsHTML = '';

      for (const property in configObject) {
        if (property === 'description') continue;

        const value = configObject[property];
        const fieldId = `${key}_${property}`;
        const fieldTitle = this.getFieldTitle(property);

        if (property === 'backgroundImage') {
          // 图片上传字段
          fieldsHTML += `
                    <div class="config-field image-upload-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <div class="image-upload-container">
                            <div class="image-preview" data-field-id="${fieldId}">
                                ${
                                  value
                                    ? `<img src="${value}" alt="背景预览" />`
                                    : '<div class="no-image">📷 暂无图片</div>'
                                }
                            </div>
                            <div class="image-upload-controls">
                                <input type="file" id="${fieldId}_file" class="image-file-input" accept="image/*" data-target="${fieldId}" style="display: none;">
                                <button type="button" class="upload-btn" onclick="document.getElementById('${fieldId}_file').click()">
                                    📤 选择图片
                                </button>
                                ${
                                  value
                                    ? `<button type="button" class="remove-btn" data-target="${fieldId}">🗑️ 移除</button>`
                                    : ''
                                }
                            </div>
                            <input
                                type="hidden"
                                id="${fieldId}"
                                class="config-input"
                                value="${value}"
                                data-config-key="${key}"
                                data-config-property="${property}"
                            >
                        </div>
                    </div>
                `;
        } else if (property === 'backgroundImageUrl') {
          // 图片链接字段
          fieldsHTML += `
                    <div class="config-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <input
                            type="url"
                            id="${fieldId}"
                            class="config-input"
                            value="${value}"
                            data-config-key="${key}"
                            data-config-property="${property}"
                            placeholder="输入图片链接地址..."
                        >
                    </div>
                `;
        } else {
          // 普通文本字段
          fieldsHTML += `
                    <div class="config-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <input
                            type="text"
                            id="${fieldId}"
                            class="config-input"
                            value="${value}"
                            data-config-key="${key}"
                            data-config-property="${property}"
                            placeholder="输入${fieldTitle}值..."
                        >
                    </div>
                `;
        }
      }

      return `
            <div class="config-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    <p>${configObject.description || ''}</p>
                </div>
                <div class="section-fields">
                    ${fieldsHTML}
                </div>
            </div>
        `;
    }

    // 生成头像配置区段HTML
    generateAvatarConfigSection(key, title, configObject) {
      let fieldsHTML = '';

      for (const property in configObject) {
        if (property === 'description') continue;

        const value = configObject[property];
        const fieldId = `${key}_${property}`;
        const fieldTitle = this.getFieldTitle(property);

        if (property === 'backgroundImage') {
          // 图片上传字段
          fieldsHTML += `
                    <div class="config-field image-upload-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <div class="image-upload-container">
                            <div class="image-preview" data-field-id="${fieldId}">
                                ${
                                  value
                                    ? `<img src="${value}" alt="背景预览" />`
                                    : '<div class="no-image">📷 暂无图片</div>'
                                }
                            </div>
                            <div class="image-upload-controls">
                                <input type="file" id="${fieldId}_file" class="image-file-input" accept="image/*" data-target="${fieldId}" style="display: none;">
                                <button type="button" class="upload-btn" onclick="document.getElementById('${fieldId}_file').click()">
                                    📤 选择图片
                                </button>
                                ${
                                  value
                                    ? `<button type="button" class="remove-btn" data-target="${fieldId}">🗑️ 移除</button>`
                                    : ''
                                }
                            </div>
                            <input
                                type="hidden"
                                id="${fieldId}"
                                class="config-input"
                                value="${value}"
                                data-config-key="${key}"
                                data-config-property="${property}"
                            >
                        </div>
                    </div>
                `;
        } else if (property === 'backgroundImageUrl') {
          // 图片链接字段
          fieldsHTML += `
                    <div class="config-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <input
                            type="url"
                            id="${fieldId}"
                            class="config-input"
                            value="${value}"
                            data-config-key="${key}"
                            data-config-property="${property}"
                            placeholder="输入图片链接地址..."
                        >
                    </div>
                `;
        } else if (property === 'rotation') {
          // 旋转控制
          fieldsHTML += `
                    <div class="config-field avatar-control-field">
                        <label for="${fieldId}">${fieldTitle} (度):</label>
                        <div class="control-input-container">
                            <input
                                type="range"
                                id="${fieldId}_range"
                                min="0"
                                max="360"
                                step="1"
                                value="${value}"
                                class="control-range"
                                oninput="document.getElementById('${fieldId}').value = this.value; document.getElementById('${fieldId}').dispatchEvent(new Event('input'));"
                            >
                            <input
                                type="number"
                                id="${fieldId}"
                                class="config-input control-number"
                                value="${value}"
                                data-config-key="${key}"
                                data-config-property="${property}"
                                min="0"
                                max="360"
                                step="1"
                                oninput="document.getElementById('${fieldId}_range').value = this.value;"
                            >
                        </div>
                    </div>
                `;
        } else if (property === 'scale') {
          // 缩放控制
          fieldsHTML += `
                    <div class="config-field avatar-control-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <div class="control-input-container">
                            <input
                                type="range"
                                id="${fieldId}_range"
                                min="0.1"
                                max="3"
                                step="0.1"
                                value="${value}"
                                class="control-range"
                                oninput="document.getElementById('${fieldId}').value = this.value; document.getElementById('${fieldId}').dispatchEvent(new Event('input'));"
                            >
                            <input
                                type="number"
                                id="${fieldId}"
                                class="config-input control-number"
                                value="${value}"
                                data-config-key="${key}"
                                data-config-property="${property}"
                                min="0.1"
                                max="3"
                                step="0.1"
                                oninput="document.getElementById('${fieldId}_range').value = this.value;"
                            >
                        </div>
                    </div>
                `;
        } else if (property === 'friendId') {
          // 好友ID字段
          fieldsHTML += `
                    <div class="config-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <input
                            type="text"
                            id="${fieldId}"
                            class="config-input"
                            value="${value}"
                            data-config-key="${key}"
                            data-config-property="${property}"
                            placeholder="输入好友ID（如：22333）"
                        >
                        <small>💡 这个ID会用于生成CSS选择器：.message-received > .message-avatar#message-avatar-{ID}</small>
                    </div>
                `;
        } else {
          // 普通文本字段
          fieldsHTML += `
                    <div class="config-field">
                        <label for="${fieldId}">${fieldTitle}:</label>
                        <input
                            type="text"
                            id="${fieldId}"
                            class="config-input"
                            value="${value}"
                            data-config-key="${key}"
                            data-config-property="${property}"
                            placeholder="输入${fieldTitle}值..."
                        >
                    </div>
                `;
        }
      }

      // 可视化预览
      const previewHTML = `
            <div class="config-field avatar-preview-field">
                <label>预览效果:</label>
                <div class="avatar-preview-container">
                    <div class="avatar-preview" id="${key}_preview">
                        <div class="avatar-preview-circle"></div>
                    </div>
                    <div class="preview-info">
                        <small>40px × 40px 圆形预览</small>
                    </div>
                </div>
            </div>
        `;

      return `
            <div class="config-section avatar-config-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    <p>${configObject.description || ''}</p>
                </div>
                <div class="section-fields">
                    ${fieldsHTML}
                    ${previewHTML}
                </div>
            </div>
        `;
    }

    // 生成好友专属背景配置区段HTML
    generateFriendBackgroundsSection(backgroundsArray) {
      if (!backgroundsArray || !Array.isArray(backgroundsArray)) {
        backgroundsArray = [];
      }

      const backgroundCards = backgroundsArray
        .map((background, index) => {
          return this.generateSingleBackgroundCard(background, index, backgroundsArray.length);
        })
        .join('');

      return `
            <div class="config-section friend-backgrounds-section">
                <div class="section-header">
                    <h3>🎨 好友专属聊天背景</h3>
                    <p>为每个好友设置独特的聊天背景，基于data-background-id机制实现</p>
                </div>

                <div class="backgrounds-container">
                    ${backgroundCards}
                    ${
                      backgroundsArray.length === 0
                        ? `
                        <div class="empty-backgrounds">
                            <div class="empty-icon">🖼️</div>
                            <div class="empty-text">暂无好友专属背景</div>
                            <div class="empty-hint">使用好友弹窗设置专属背景</div>
                        </div>
                    `
                        : ''
                    }
                </div>

                <div class="background-actions">
                    <button class="config-btn add-background-btn" onclick="window.styleConfigManager.addNewFriendBackground()">
                        <span class="btn-icon">➕</span>
                        <span>手动添加背景</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 生成接收消息头像配置区段HTML（支持多个头像）
    generateReceivedAvatarsSection(avatarsArray) {
      if (!avatarsArray || !Array.isArray(avatarsArray)) {
        return '';
      }

      const avatarCards = avatarsArray
        .map((avatar, index) => {
          return this.generateSingleAvatarCard(avatar, index, avatarsArray.length);
        })
        .join('');

      return `
            <div class="config-section avatars-section">
                <div class="section-header">
                    <h3>🎭 接收消息头像背景</h3>
                    <p>为不同好友的头像设置个性化背景图片</p>
                </div>

                <div class="avatars-container">
                    ${avatarCards}
                </div>

                <div class="avatar-actions">
                    <button class="config-btn add-avatar-btn" onclick="window.styleConfigManager.addNewAvatar()">
                        <span class="btn-icon">➕</span>
                        <span>添加新头像</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 生成单个好友背景配置卡片
    generateSingleBackgroundCard(background, index, backgroundsLength) {
      const friendId = background.friendId || '';
      const name = background.name || `好友背景 ${index + 1}`;
      const backgroundImage = background.backgroundImage || background.backgroundImageUrl || '';
      const rotation = background.rotation || '0';
      const scale = background.scale || '1';
      const backgroundPosition = background.backgroundPosition || 'center center';

      const previewImageUrl = backgroundImage ? `url(${backgroundImage})` : 'none';
      const previewTransform = `rotate(${rotation}deg) scale(${scale})`;

      return `
            <div class="background-card" data-background-index="${index}">
                <div class="background-card-header">
                    <div class="background-card-title">
                        <input type="text" class="background-name-input"
                               data-background-index="${index}"
                               data-property="name"
                               value="${name}"
                               placeholder="背景名称">
                    </div>
                    <div class="background-card-actions">
                        <button class="background-action-btn collapse-btn" onclick="window.styleConfigManager.toggleBackgroundCard(${index})" title="折叠/展开">
                            <span>📁</span>
                        </button>
                        ${
                          backgroundsLength > 1
                            ? `
                        <button class="background-action-btn delete-btn" onclick="window.styleConfigManager.deleteFriendBackground(${index})" title="删除">
                            <span>🗑️</span>
                        </button>
                        `
                            : ''
                        }
                    </div>
                </div>

                <div class="background-card-content">
                    <div class="background-preview-section">
                        <div class="background-preview" data-background-index="${index}">
                            <div class="background-preview-rect"
                                 style="background-image: ${previewImageUrl}; background-position: ${backgroundPosition}; transform: ${previewTransform};">
                            </div>
                        </div>
                        <div class="background-preview-label">聊天背景预览</div>
                    </div>

                    <div class="background-fields">
                        <div class="config-field">
                            <label>好友ID (必填):</label>
                            <input type="text"
                                   class="config-input background-input"
                                   data-background-index="${index}"
                                   data-property="friendId"
                                   value="${friendId}"
                                   placeholder="558778"
                                   required>
                            <small>⚠️ <strong>必须填写好友ID才能生效</strong> - 用于匹配data-background-id属性</small>
                            ${
                              friendId
                                ? `<small class="field-status valid">✅ 配置有效 - CSS选择器: .message-detail-content[data-background-id="${friendId}"]</small>`
                                : `<small class="field-status invalid">❌ 配置无效 - 请填写好友ID</small>`
                            }
                        </div>

                        <div class="config-field">
                            <label>背景图片:</label>
                            <div class="image-input-container">
                                <input type="file"
                                       class="image-file-input background-file-input"
                                       data-background-index="${index}"
                                       data-property="backgroundImage"
                                       accept="image/*">
                                <button class="upload-btn" onclick="this.previousElementSibling.click()">
                                    <span>📁</span>
                                    <span>选择图片</span>
                                </button>
                                ${
                                  backgroundImage
                                    ? `
                                <button class="remove-btn background-remove-btn"
                                        data-background-index="${index}"
                                        data-property="backgroundImage">
                                    <span>🗑️</span>
                                </button>
                                `
                                    : ''
                                }
                            </div>
                        </div>

                        <div class="config-field">
                            <label>图片链接:</label>
                            <input type="text"
                                   class="config-input background-input"
                                   data-background-index="${index}"
                                   data-property="backgroundImageUrl"
                                   value="${background.backgroundImageUrl || ''}"
                                   placeholder="https://example.com/image.jpg">
                        </div>

                        <div class="config-field">
                            <label>背景位置:</label>
                            <input type="text"
                                   class="config-input background-input"
                                   data-background-index="${index}"
                                   data-property="backgroundPosition"
                                   value="${backgroundPosition}"
                                   placeholder="center center">
                            <small>例如: center center, top left, 50% 25%</small>
                        </div>

                        <div class="config-field range-field">
                            <label>旋转角度: <span class="range-value">${rotation}°</span></label>
                            <div class="range-container">
                                <input type="range"
                                       class="config-range background-range"
                                       data-background-index="${index}"
                                       data-property="rotation"
                                       min="0" max="360" step="1" value="${rotation}">
                                <input type="number"
                                       class="range-number background-number"
                                       data-background-index="${index}"
                                       data-property="rotation"
                                       min="0" max="360" step="1" value="${rotation}">
                            </div>
                        </div>

                        <div class="config-field range-field">
                            <label>缩放比例: <span class="range-value">${scale}x</span></label>
                            <div class="range-container">
                                <input type="range"
                                       class="config-range background-range"
                                       data-background-index="${index}"
                                       data-property="scale"
                                       min="0.1" max="3" step="0.1" value="${scale}">
                                <input type="number"
                                       class="range-number background-number"
                                       data-background-index="${index}"
                                       data-property="scale"
                                       min="0.1" max="3" step="0.1" value="${scale}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成单个头像配置卡片
    generateSingleAvatarCard(avatar, index, avatarsLength) {
      const friendId = avatar.friendId || '';
      const name = avatar.name || `好友头像 ${index + 1}`;
      const backgroundImage = avatar.backgroundImage || avatar.backgroundImageUrl || '';
      const rotation = avatar.rotation || '0';
      const scale = avatar.scale || '1';

      const previewImageUrl = backgroundImage ? `url(${backgroundImage})` : 'none';
      const previewTransform = `rotate(${rotation}deg) scale(${scale})`;

      return `
            <div class="avatar-card" data-avatar-index="${index}">
                <div class="avatar-card-header">
                    <div class="avatar-card-title">
                        <input type="text" class="avatar-name-input"
                               data-avatar-index="${index}"
                               data-property="name"
                               value="${name}"
                               placeholder="头像名称">
                    </div>
                    <div class="avatar-card-actions">
                        <button class="avatar-action-btn collapse-btn" onclick="window.styleConfigManager.toggleAvatarCard(${index})" title="折叠/展开">
                            <span>📁</span>
                        </button>
                        ${
                          avatarsLength > 1
                            ? `
                        <button class="avatar-action-btn delete-btn" onclick="window.styleConfigManager.deleteAvatar(${index})" title="删除">
                            <span>🗑️</span>
                        </button>
                        `
                            : ''
                        }
                    </div>
                </div>

                <div class="avatar-card-content">
                    <div class="avatar-preview-section">
                        <div class="avatar-preview" data-avatar-index="${index}">
                            <div class="avatar-preview-circle"
                                 style="background-image: ${previewImageUrl}; transform: ${previewTransform};">
                            </div>
                        </div>
                        <div class="avatar-preview-label">40×40px 预览</div>
                    </div>

                    <div class="avatar-fields">
                        <div class="config-field">
                            <label>好友ID (必填):</label>
                            <input type="text"
                                   class="config-input avatar-input"
                                   data-avatar-index="${index}"
                                   data-property="friendId"
                                   value="${friendId}"
                                   placeholder="558778"
                                   required>
                            <small>⚠️ <strong>必须填写好友ID才能生效</strong> - 用于匹配特定好友的头像元素</small>
                                                         ${
                                                           friendId
                                                             ? `<small class="field-status valid">✅ 配置有效 - CSS选择器: [data-friend-id="${friendId}"] 和 #message-avatar-${friendId}</small>`
                                                             : `<small class="field-status invalid">❌ 配置无效 - 请填写好友ID</small>`
                                                         }
                        </div>

                        <div class="config-field">
                            <label>背景图片:</label>
                            <div class="image-input-container">
                                <input type="file"
                                       class="image-file-input avatar-file-input"
                                       data-avatar-index="${index}"
                                       data-property="backgroundImage"
                                       accept="image/*">
                                <button class="upload-btn" onclick="this.previousElementSibling.click()">
                                    <span>📁</span>
                                    <span>选择图片</span>
                                </button>
                                ${
                                  backgroundImage
                                    ? `
                                <button class="remove-btn avatar-remove-btn"
                                        data-avatar-index="${index}"
                                        data-property="backgroundImage">
                                    <span>🗑️</span>
                                </button>
                                `
                                    : ''
                                }
                            </div>
                        </div>

                        <div class="config-field">
                            <label>图片链接:</label>
                            <input type="text"
                                   class="config-input avatar-input"
                                   data-avatar-index="${index}"
                                   data-property="backgroundImageUrl"
                                   value="${avatar.backgroundImageUrl || ''}"
                                   placeholder="https://example.com/image.jpg">
                        </div>

                        <div class="config-field range-field">
                            <label>旋转角度: <span class="range-value">${rotation}°</span></label>
                            <div class="range-container">
                                <input type="range"
                                       class="config-range avatar-range"
                                       data-avatar-index="${index}"
                                       data-property="rotation"
                                       min="0" max="360" step="1" value="${rotation}">
                                <input type="number"
                                       class="range-number avatar-number"
                                       data-avatar-index="${index}"
                                       data-property="rotation"
                                       min="0" max="360" step="1" value="${rotation}">
                            </div>
                        </div>

                        <div class="config-field range-field">
                            <label>缩放比例: <span class="range-value">${scale}x</span></label>
                            <div class="range-container">
                                <input type="range"
                                       class="config-range avatar-range"
                                       data-avatar-index="${index}"
                                       data-property="scale"
                                       min="0.1" max="3" step="0.1" value="${scale}">
                                <input type="number"
                                       class="range-number avatar-number"
                                       data-avatar-index="${index}"
                                       data-property="scale"
                                       min="0.1" max="3" step="0.1" value="${scale}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成自定义样式区段HTML
    generateCustomStylesSection(key, title, configObject) {
      const value = configObject.cssText || '';
      const fieldId = `${key}_cssText`;

      return `
            <div class="config-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    <p>${configObject.description || ''}</p>
                </div>
                <div class="section-fields">
                    <div class="config-field custom-css-field">
                        <label for="${fieldId}">自定义CSS代码:</label>
                        <div class="custom-css-container">
                            <textarea
                                id="${fieldId}"
                                class="config-input custom-css-textarea"
                                data-config-key="${key}"
                                data-config-property="cssText"
                                placeholder="/* 在这里输入自定义CSS样式 */&#10;.your-custom-class {&#10;    /* 你的样式 */&#10;}"
                                rows="8"
                            >${value}</textarea>
                            <div class="css-help">
                                <small>💡 提示：这里的CSS样式会随配置一起保存，并自动应用到页面</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 添加新头像配置
    addNewAvatar() {
      const config = this.getConfig();
      if (!config.messageReceivedAvatars) {
        config.messageReceivedAvatars = [];
      }

      const newAvatar = {
        id: 'avatar_' + Date.now(),
        backgroundImage: '',
        backgroundImageUrl: '',
        rotation: '0',
        scale: '1',
        friendId: '',
        name: `好友头像 ${config.messageReceivedAvatars.length + 1}`,
        description: '接收消息头像背景',
      };

      config.messageReceivedAvatars.push(newAvatar);
      this.updateConfig('messageReceivedAvatars', null, config.messageReceivedAvatars);

      // 重新渲染界面
      this.refreshEditorInterface();
      this.updateStatus('添加新头像成功，点击另存为按钮保存更改', 'info');
    }

    // 删除头像配置
    deleteAvatar(index) {
      const config = this.getConfig();
      if (!config.messageReceivedAvatars || config.messageReceivedAvatars.length <= 1) {
        this.updateStatus('至少需要保留一个头像配置', 'warning');
        return;
      }

      if (confirm('确定要删除这个头像配置吗？')) {
        config.messageReceivedAvatars.splice(index, 1);
        this.updateConfig('messageReceivedAvatars', null, config.messageReceivedAvatars);

        // 重新渲染界面
        this.refreshEditorInterface();
        this.updateStatus('删除头像成功，点击另存为按钮保存更改', 'info');
      }
    }

    // 添加新好友背景配置
    addNewFriendBackground() {
      const config = this.getConfig();
      if (!config.friendBackgrounds) {
        config.friendBackgrounds = [];
      }

      const newBackground = {
        id: 'friend_bg_' + Date.now(),
        friendId: '',
        name: `好友背景 ${config.friendBackgrounds.length + 1}`,
        backgroundImage: '',
        backgroundImageUrl: '',
        backgroundPosition: 'center center',
        rotation: '0',
        scale: '1',
        description: '好友专属聊天背景',
      };

      config.friendBackgrounds.push(newBackground);
      this.updateConfig('friendBackgrounds', null, config.friendBackgrounds);

      // 重新渲染界面
      this.refreshEditorInterface();
      this.updateStatus('添加新好友背景成功，点击另存为按钮保存更改', 'info');
    }

    // 删除好友背景配置
    deleteFriendBackground(index) {
      const config = this.getConfig();
      if (!config.friendBackgrounds || config.friendBackgrounds.length === 0) {
        this.updateStatus('没有可删除的背景配置', 'warning');
        return;
      }

      if (confirm('确定要删除这个好友背景配置吗？')) {
        config.friendBackgrounds.splice(index, 1);
        this.updateConfig('friendBackgrounds', null, config.friendBackgrounds);

        // 重新渲染界面
        this.refreshEditorInterface();
        this.updateStatus('删除好友背景成功，点击另存为按钮保存更改', 'info');
      }
    }

    // 切换好友背景卡片展开/折叠状态
    toggleBackgroundCard(index) {
      const card = document.querySelector(`[data-background-index="${index}"]`);
      if (card) {
        const content = card.querySelector('.background-card-content');
        const button = card.querySelector('.collapse-btn span');

        if (content.style.display === 'none') {
          content.style.display = 'block';
          button.textContent = '📁';
        } else {
          content.style.display = 'none';
          button.textContent = '📂';
        }
      }
    }

    // 折叠/展开头像卡片
    toggleAvatarCard(index) {
      const card = document.querySelector(`[data-avatar-index="${index}"]`);
      if (card) {
        // @ts-ignore - HTMLElement style access
        const content = card.querySelector('.avatar-card-content');
        const btn = card.querySelector('.collapse-btn span');

        if (content && btn) {
          // @ts-ignore - HTMLElement style access
          if (content.style.display === 'none') {
            // @ts-ignore - HTMLElement style access
            content.style.display = 'block';
            btn.textContent = '📁';
          } else {
            // @ts-ignore - HTMLElement style access
            content.style.display = 'none';
            btn.textContent = '📂';
          }
        }
      }
    }

    // 获取字段标题
    getFieldTitle(property) {
      const titleMap = {
        background: '背景',
        backgroundImage: '背景图片',
        backgroundImageUrl: '背景图片链接',
        borderRadius: '圆角',
        color: '颜色',
        fontSize: '字体大小',
        padding: '内边距',
        margin: '外边距',
        rotation: '旋转角度',
        scale: '缩放比例',
        friendId: '好友ID',
      };

      return titleMap[property] || property;
    }

    // 绑定设置应用的事件
    bindSettingsEvents() {
      // 标签页切换事件
      document.querySelectorAll('.tab-header').forEach(tab => {
        tab.addEventListener('click', e => {
          this.handleTabSwitch(e.target);
        });
      });

      // 输入框变化事件
      document.querySelectorAll('.config-input').forEach(input => {
        input.addEventListener('input', e => {
          this.handleInputChange(e.target);
        });
      });

      // 图片上传事件
      document.querySelectorAll('.image-file-input').forEach(input => {
        input.addEventListener('change', e => {
          this.handleImageUpload(e.target);
        });
      });

      // 图片移除事件
      document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          this.handleImageRemove(e.target);
        });
      });

      // 预览按钮
      const previewBtn = document.getElementById('preview-styles');
      if (previewBtn) {
        previewBtn.addEventListener('click', () => {
          this.previewStyles();
        });
      }

      // 另存为按钮（原保存按钮）
      const saveNewBtn = document.getElementById('save-new-config-btn');
      if (saveNewBtn) {
        saveNewBtn.addEventListener('click', async () => {
          await this.handleSaveNewConfigWithPrompt();
        });
      }

      // 重置按钮
      const resetBtn = document.getElementById('reset-styles');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetStyles();
        });
      }

      // 注意：另存为按钮已在上面绑定，这里不再重复绑定

      // 刷新配置列表按钮
      const refreshBtn = document.getElementById('refresh-config-list');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          await this.handleRefreshConfigList();
        });
      }

      // 导出配置按钮
      const exportBtn = document.getElementById('export-config');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.handleExportConfig();
        });
      }

      // 导入配置按钮
      const importBtn = document.getElementById('import-config');
      const importInput = document.getElementById('config-import-input');
      if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
          importInput.click();
        });

        importInput.addEventListener('change', e => {
          this.handleImportConfig(e.target);
        });
      }

      // 注意：配置管理器中的另存为输入框已移除

      // 绑定初始的配置列表事件（如果存在）
      this.bindConfigListEvents();

      // 自定义CSS textarea事件
      document.querySelectorAll('.custom-css-textarea').forEach(textarea => {
        textarea.addEventListener('input', e => {
          this.handleInputChange(e.target);
        });
      });

      // 头像预览更新事件
      this.bindAvatarPreviewEvents();

      // 自动加载配置列表（延迟执行，确保DOM渲染完成）
      setTimeout(() => {
        this.loadConfigListContent();
        this.updateAllAvatarPreviews(); // 更新所有头像预览
      }, 100);
    }

    // 处理标签页切换
    handleTabSwitch(tabHeader) {
      // @ts-ignore - EventTarget getAttribute
      const targetTab = tabHeader.getAttribute('data-tab');

      // 更新标签页状态
      document.querySelectorAll('.tab-header').forEach(header => {
        header.classList.remove('active');
      });
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      tabHeader.classList.add('active');
      document.querySelector(`[data-tab="${targetTab}"].tab-panel`).classList.add('active');

      // 如果切换到配置管理标签页，加载配置列表
      if (targetTab === 'manager') {
        this.loadConfigListContent();
      }
    }

    // 处理保存新配置（带弹窗提示）
    async handleSaveNewConfigWithPrompt() {
      const configName = prompt('请输入配置名称：', '');

      if (!configName) {
        this.updateStatus('已取消保存', 'info');
        return;
      }

      const trimmedName = configName.trim();

      if (!trimmedName) {
        this.updateStatus('请输入有效的配置名称', 'error');
        return;
      }

      if (trimmedName.length > 50) {
        this.updateStatus('配置名称过长（最多50个字符）', 'error');
        return;
      }

      this.updateStatus('正在保存配置...', 'loading');

      try {
        const success = await this.saveConfigWithName(trimmedName);
        if (success) {
          this.updateStatus('配置保存成功！', 'success');
          // 如果在配置管理标签页，刷新配置列表
          const activeTab = document.querySelector('.tab-header.active');
          if (activeTab && activeTab.getAttribute('data-tab') === 'manager') {
            await this.handleRefreshConfigList();
          }
        }
      } catch (error) {
        console.error('[Style Config Manager] 保存配置失败:', error);
        this.updateStatus(`保存失败：${error.message}`, 'error');
      }
    }

    // 处理加载配置
    async handleLoadConfig(fileName) {
      if (!fileName) return;

      this.updateStatus('正在加载配置...', 'loading');

      const success = await this.loadConfigFromFile(fileName);
      if (success) {
        // 刷新编辑器界面
        await this.refreshEditorInterface();

        // 检查是否为默认配置
        const isDefaultConfig = fileName === STYLE_CONFIG_FILE_NAME;

        if (isDefaultConfig) {
          this.updateStatus('默认配置加载成功！', 'success');
        } else {
          // 对于非默认配置，询问用户是否要设为默认配置
          const loadChoice = await this.showLoadOptionsDialog(fileName);

          if (loadChoice === 'setDefault') {
            this.updateStatus('正在设为默认配置...', 'loading');

            console.log('[Style Config Manager] 🔄 开始保存为默认配置');
            console.log('[Style Config Manager] 当前配置内容:', JSON.stringify(this.currentConfig, null, 2));

            // 保存为默认配置
            const saveSuccess = await this.saveConfig();

            console.log('[Style Config Manager] 保存结果:', saveSuccess);

            if (saveSuccess) {
              this.updateStatus('配置已加载并设为默认配置！刷新页面后依然有效', 'success');
              console.log('[Style Config Manager] ✅ 配置已加载并保存为默认配置');

              // 验证保存是否成功
              console.log('[Style Config Manager] 🔍 验证保存结果...');
              if (sillyTavernCoreImported && getDataBankAttachmentsForSource) {
                const globalAttachments = getDataBankAttachmentsForSource('global', true);
                const defaultConfig = globalAttachments.find(att => att.name === 'mobile_style_config.json');
                console.log('[Style Config Manager] 默认配置文件存在:', !!defaultConfig);
                if (defaultConfig) {
                  console.log('[Style Config Manager] 默认配置文件信息:', defaultConfig);
                }
              }
            } else {
              this.updateStatus('配置加载成功，但设为默认配置失败', 'error');
              console.error('[Style Config Manager] ❌ 保存为默认配置失败');
            }
          } else {
            this.updateStatus('配置加载成功！仅本次会话有效，刷新页面后将恢复原配置', 'success');
          }
        }
      } else {
        this.updateStatus('加载配置失败', 'error');
      }
    }

    // 处理删除配置
    async handleDeleteConfig(fileName) {
      if (!fileName) return;

      if (!confirm(`确定要删除配置"${fileName}"吗？此操作无法撤销。`)) {
        return;
      }

      this.updateStatus('正在删除配置...', 'loading');

      const success = await this.deleteConfigFile(fileName);
      if (success) {
        this.updateStatus('配置删除成功！', 'success');
        // 刷新配置列表
        await this.handleRefreshConfigList();
      } else {
        this.updateStatus('删除配置失败', 'error');
      }
    }

    // 处理刷新配置列表
    async handleRefreshConfigList() {
      await this.loadConfigListContent();
      console.log('[Style Config Manager] 配置列表已刷新');
    }

    // 处理导出配置
    handleExportConfig() {
      try {
        const configData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          config: this.currentConfig,
          description: '移动端样式配置文件',
        };

        const configJson = JSON.stringify(configData, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `mobile-style-config-${new Date().toISOString().split('T')[0]}.json`;
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 清理URL对象
        URL.revokeObjectURL(url);

        this.updateStatus('配置导出成功！', 'success');
        console.log('[Style Config Manager] 配置已导出:', configData);
      } catch (error) {
        console.error('[Style Config Manager] 导出配置失败:', error);
        this.updateStatus('导出配置失败', 'error');
      }
    }

    // 处理导入配置
    async handleImportConfig(fileInput) {
      try {
        // @ts-ignore - HTMLInputElement files property
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
          this.updateStatus('请选择JSON格式的配置文件', 'error');
          return;
        }

        this.updateStatus('正在导入配置...', 'loading');

        const fileContent = await this.fileToText(file);
        const importData = JSON.parse(fileContent);

        // 验证配置文件格式
        if (!importData.config) {
          // 如果没有config字段，可能是直接的配置对象
          if (typeof importData === 'object' && importData.mobilePhoneFrame) {
            this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, importData);
          } else {
            throw new Error('无效的配置文件格式');
          }
        } else {
          // 标准格式的配置文件
          this.currentConfig = this.mergeConfigs(DEFAULT_STYLE_CONFIG, importData.config);
        }

        // 应用新配置
        this.applyStyles();

        // 刷新编辑器界面
        await this.refreshEditorInterface();

        // 询问用户如何处理导入的配置
        const importChoice = await this.showImportOptionsDialog();

        if (importChoice === 'default') {
          this.updateStatus('正在保存为默认配置...', 'loading');

          // 保存为默认配置
          const saveSuccess = await this.saveConfig();

          if (saveSuccess) {
            this.updateStatus('配置已导入并设为默认配置！刷新页面后依然有效', 'success');
            console.log('[Style Config Manager] 配置已导入并保存为默认配置');
          } else {
            this.updateStatus('配置导入成功，但保存为默认配置失败', 'error');
          }
        } else if (importChoice === 'named') {
          // 保存为具名配置
          const configName = prompt('请输入配置名称：', '导入的配置');
          if (configName && configName.trim()) {
            this.updateStatus('正在保存具名配置...', 'loading');

            try {
              const saveSuccess = await this.saveConfigWithName(configName.trim());

              if (saveSuccess) {
                this.updateStatus(`配置已保存为"${configName.trim()}"，可在配置管理中选择加载`, 'success');
                // 刷新配置列表
                setTimeout(() => {
                  this.loadConfigListContent();
                }, 1000);
              }
            } catch (error) {
              this.updateStatus(`保存配置失败：${error.message}`, 'error');
            }
          } else {
            this.updateStatus('配置导入成功！仅本次会话有效', 'success');
          }
        } else {
          this.updateStatus('配置导入成功！仅本次会话有效，刷新页面后将恢复原配置', 'success');
        }

        console.log('[Style Config Manager] 配置已导入:', this.currentConfig);

        // 清空文件输入
        // @ts-ignore - HTMLInputElement value property
        fileInput.value = '';
      } catch (error) {
        console.error('[Style Config Manager] 导入配置失败:', error);
        this.updateStatus('导入配置失败：' + error.message, 'error');

        // 清空文件输入
        // @ts-ignore - HTMLInputElement value property
        fileInput.value = '';
      }
    }

    // 文件转文本
    fileToText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    // 显示加载选项对话框
    async showLoadOptionsDialog(fileName) {
      const displayName = fileName.replace('_style_config.json', '');

      return new Promise(resolve => {
        // 创建对话框HTML
        const dialogHtml = `
                <div class="load-options-dialog" id="load-options-dialog">
                    <div class="load-options-overlay"></div>
                    <div class="load-options-content">
                        <div class="load-options-header">
                            <h3>📥 配置加载成功</h3>
                            <p>已加载配置："${displayName}"</p>
                            <p style="color: #f59e0b; font-size: 13px; margin-top: 8px;">💡 请选择如何保存此配置</p>
                        </div>
                        <div class="load-options-body">
                            <div class="load-option recommended" data-choice="setDefault">
                                <div class="option-icon">🏠</div>
                                <div class="option-content">
                                    <div class="option-title">设为默认配置 <span class="recommended-badge">推荐</span></div>
                                    <div class="option-desc">替换当前默认配置，<strong>刷新页面后依然有效</strong></div>
                                </div>
                            </div>
                            <div class="load-option" data-choice="temp">
                                <div class="option-icon">⚡</div>
                                <div class="option-content">
                                    <div class="option-title">仅临时应用</div>
                                    <div class="option-desc">本次会话有效，<strong style="color: #dc2626;">刷新页面后会恢复原配置</strong></div>
                                </div>
                            </div>
                        </div>
                        <div class="load-options-footer">
                            <button class="load-cancel-btn" data-choice="temp">保持临时</button>
                        </div>
                    </div>
                </div>
                <style>
                .load-options-dialog {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .load-options-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                    cursor: pointer;
                }
                .load-options-content {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    max-width: 480px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: dialogSlideIn 0.3s ease-out;
                }
                .load-options-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .load-options-header h3 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                    font-size: 20px;
                    font-weight: 600;
                }
                .load-options-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }
                .load-options-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .load-option {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: white;
                }
                .load-option:hover {
                    border-color: #3b82f6;
                    background: #f8fafc;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                }
                .load-option.recommended {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #f0fff4 0%, #ecfdf5 100%);
                }
                .load-option.recommended:hover {
                    border-color: #059669;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
                }
                .recommended-badge {
                    background: #10b981;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                .option-icon {
                    font-size: 24px;
                    margin-right: 16px;
                    flex-shrink: 0;
                }
                .option-content {
                    flex: 1;
                }
                .option-title {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                }
                .option-desc {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                .load-options-footer {
                    margin-top: 24px;
                    text-align: center;
                }
                .load-cancel-btn {
                    padding: 8px 16px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                .load-cancel-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }
                </style>
            `;

        // 添加对话框到页面
        document.body.insertAdjacentHTML('beforeend', dialogHtml);

        // 等待DOM更新后再绑定事件
        setTimeout(() => {
          const dialog = document.getElementById('load-options-dialog');
          console.log('[Load Dialog] 对话框元素:', dialog);

          if (!dialog) {
            console.error('[Load Dialog] 无法找到对话框元素');
            resolve('temp');
            return;
          }

          // 定义关闭函数
          const closeDialog = choice => {
            console.log('[Load Dialog] 关闭对话框，选择:', choice);
            if (dialog && dialog.parentNode) {
              dialog.remove();
            }
            resolve(choice);
          };

          // 点击背景遮罩关闭
          const overlay = dialog.querySelector('.load-options-overlay');
          console.log('[Load Dialog] 背景遮罩元素:', overlay);
          if (overlay) {
            overlay.addEventListener('click', e => {
              console.log('[Load Dialog] 点击背景遮罩');
              e.preventDefault();
              e.stopPropagation();
              closeDialog('temp');
            });
          } else {
            console.error('[Load Dialog] 无法找到背景遮罩元素');
          }

          // 点击选项按钮
          const options = dialog.querySelectorAll('.load-option');
          console.log('[Load Dialog] 找到选项按钮数量:', options.length);
          options.forEach((option, index) => {
            const choice = option.getAttribute('data-choice');
            console.log(`[Load Dialog] 绑定选项 ${index}:`, choice);
            option.addEventListener('click', e => {
              console.log('[Load Dialog] 点击选项:', choice);
              e.preventDefault();
              e.stopPropagation();
              if (choice) {
                closeDialog(choice);
              }
            });
          });

          // 点击取消按钮
          const cancelBtn = dialog.querySelector('.load-cancel-btn');
          console.log('[Load Dialog] 取消按钮元素:', cancelBtn);
          if (cancelBtn) {
            const choice = cancelBtn.getAttribute('data-choice') || 'temp';
            console.log('[Load Dialog] 取消按钮选择值:', choice);
            cancelBtn.addEventListener('click', e => {
              console.log('[Load Dialog] 点击取消按钮');
              e.preventDefault();
              e.stopPropagation();
              closeDialog(choice);
            });
          } else {
            console.error('[Load Dialog] 无法找到取消按钮元素');
          }

          // 阻止对话框内容区域的点击传播到背景
          const content = dialog.querySelector('.load-options-content');
          if (content) {
            content.addEventListener('click', e => {
              e.stopPropagation();
            });
          }

          console.log('[Load Dialog] 事件绑定完成');
        }, 100);
      });
    }

    // 显示导入选项对话框
    async showImportOptionsDialog() {
      return new Promise(resolve => {
        // 创建对话框HTML
        const dialogHtml = `
                <div class="import-options-dialog" id="import-options-dialog">
                    <div class="import-options-overlay"></div>
                    <div class="import-options-content">
                        <div class="import-options-header">
                            <h3>📥 配置导入成功</h3>
                            <p>请选择如何处理此配置：</p>
                        </div>
                        <div class="import-options-body">
                            <div class="import-option" data-choice="default">
                                <div class="option-icon">🏠</div>
                                <div class="option-content">
                                    <div class="option-title">设为默认配置</div>
                                    <div class="option-desc">替换当前默认配置，刷新页面后自动生效</div>
                                </div>
                            </div>
                            <div class="import-option" data-choice="named">
                                <div class="option-icon">📄</div>
                                <div class="option-content">
                                    <div class="option-title">保存为具名配置</div>
                                    <div class="option-desc">保存为新配置，不影响默认配置</div>
                                </div>
                            </div>
                            <div class="import-option" data-choice="temp">
                                <div class="option-icon">⚡</div>
                                <div class="option-content">
                                    <div class="option-title">仅临时应用</div>
                                    <div class="option-desc">本次会话有效，刷新页面后恢复原配置</div>
                                </div>
                            </div>
                        </div>
                        <div class="import-options-footer">
                            <button class="import-cancel-btn" data-choice="cancel">取消</button>
                        </div>
                    </div>
                </div>
                <style>
                .import-options-dialog {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .import-options-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                    cursor: pointer;
                }
                .import-options-content {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    max-width: 480px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    animation: dialogSlideIn 0.3s ease-out;
                }
                @keyframes dialogSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .import-options-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .import-options-header h3 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                    font-size: 20px;
                    font-weight: 600;
                }
                .import-options-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }
                .import-options-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .import-option {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: white;
                }
                .import-option:hover {
                    border-color: #3b82f6;
                    background: #f8fafc;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                }
                .option-icon {
                    font-size: 24px;
                    margin-right: 16px;
                    flex-shrink: 0;
                }
                .option-content {
                    flex: 1;
                }
                .option-title {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                }
                .option-desc {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                .import-options-footer {
                    margin-top: 24px;
                    text-align: center;
                }
                .import-cancel-btn {
                    padding: 8px 16px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                .import-cancel-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }
                </style>
            `;

        // 添加对话框到页面
        document.body.insertAdjacentHTML('beforeend', dialogHtml);

        // 等待DOM更新后再绑定事件
        setTimeout(() => {
          const dialog = document.getElementById('import-options-dialog');
          console.log('[Import Dialog] 对话框元素:', dialog);

          if (!dialog) {
            console.error('[Import Dialog] 无法找到对话框元素');
            resolve('cancel');
            return;
          }

          // 定义关闭函数
          const closeDialog = choice => {
            console.log('[Import Dialog] 关闭对话框，选择:', choice);
            if (dialog && dialog.parentNode) {
              dialog.remove();
            }
            resolve(choice);
          };

          // 点击背景遮罩关闭
          const overlay = dialog.querySelector('.import-options-overlay');
          console.log('[Import Dialog] 背景遮罩元素:', overlay);
          if (overlay) {
            overlay.addEventListener('click', e => {
              console.log('[Import Dialog] 点击背景遮罩');
              e.preventDefault();
              e.stopPropagation();
              closeDialog('cancel');
            });
          } else {
            console.error('[Import Dialog] 无法找到背景遮罩元素');
          }

          // 点击选项按钮
          const options = dialog.querySelectorAll('.import-option');
          console.log('[Import Dialog] 找到选项按钮数量:', options.length);
          options.forEach((option, index) => {
            const choice = option.getAttribute('data-choice');
            console.log(`[Import Dialog] 绑定选项 ${index}:`, choice);
            option.addEventListener('click', e => {
              console.log('[Import Dialog] 点击选项:', choice);
              e.preventDefault();
              e.stopPropagation();
              if (choice) {
                closeDialog(choice);
              }
            });
          });

          // 点击取消按钮
          const cancelBtn = dialog.querySelector('.import-cancel-btn');
          console.log('[Import Dialog] 取消按钮元素:', cancelBtn);
          if (cancelBtn) {
            const choice = cancelBtn.getAttribute('data-choice') || 'cancel';
            console.log('[Import Dialog] 取消按钮选择值:', choice);
            cancelBtn.addEventListener('click', e => {
              console.log('[Import Dialog] 点击取消按钮');
              e.preventDefault();
              e.stopPropagation();
              closeDialog(choice);
            });
          } else {
            console.error('[Import Dialog] 无法找到取消按钮元素');
          }

          // 阻止对话框内容区域的点击传播到背景
          const content = dialog.querySelector('.import-options-content');
          if (content) {
            content.addEventListener('click', e => {
              e.stopPropagation();
            });
          }

          console.log('[Import Dialog] 事件绑定完成');
        }, 100);
      });
    }

    // 绑定配置列表事件
    bindConfigListEvents() {
      // 加载配置按钮
      document.querySelectorAll('.load-config').forEach(btn => {
        // 移除旧的事件监听器（如果存在）
        btn.removeEventListener('click', this.loadConfigHandler);
        // 绑定新的事件监听器
        this.loadConfigHandler = async e => {
          // @ts-ignore - EventTarget getAttribute
          const fileName = e.target.getAttribute('data-config-file');
          await this.handleLoadConfig(fileName);
        };
        btn.addEventListener('click', this.loadConfigHandler);
      });

      // 删除配置按钮
      document.querySelectorAll('.delete-config').forEach(btn => {
        // 移除旧的事件监听器（如果存在）
        btn.removeEventListener('click', this.deleteConfigHandler);
        // 绑定新的事件监听器
        this.deleteConfigHandler = async e => {
          // @ts-ignore - EventTarget getAttribute
          const fileName = e.target.getAttribute('data-config-file');
          await this.handleDeleteConfig(fileName);
        };
        btn.addEventListener('click', this.deleteConfigHandler);
      });
    }

    // 刷新编辑器界面
    async refreshEditorInterface() {
      try {
        // 重新生成整个界面以确保数据同步
        const container = document.querySelector('.style-config-app');
        if (container) {
          container.innerHTML = this.getSettingsAppContent();

          // 重新绑定所有事件
          this.bindSettingsEvents();
          return;
        }
        // 更新所有输入框的值（包括textarea）
        document.querySelectorAll('.config-input').forEach(input => {
          const key = input.getAttribute('data-config-key');
          const property = input.getAttribute('data-config-property');

          if (key && property && this.currentConfig[key]) {
            // @ts-ignore - HTMLInputElement value property
            input.value = this.currentConfig[key][property] || '';

            // 同步滑块值（如果存在对应的滑块）
            const rangeId = `${key}_${property}_range`;
            const rangeInput = document.getElementById(rangeId);
            if (rangeInput) {
              // @ts-ignore - HTMLInputElement value property
              rangeInput.value = this.currentConfig[key][property] || '';
            }
          }
        });

        // 更新接收消息头像的输入框
        document.querySelectorAll('.avatar-input, .avatar-range, .avatar-number, .avatar-name-input').forEach(input => {
          // @ts-ignore - Event target
          const avatarIndex = input.getAttribute('data-avatar-index');
          // @ts-ignore - Event target
          const property = input.getAttribute('data-property');

          if (avatarIndex !== null && property && this.currentConfig.messageReceivedAvatars) {
            const avatar = this.currentConfig.messageReceivedAvatars[parseInt(avatarIndex)];
            if (avatar) {
              // @ts-ignore - HTMLInputElement value property
              input.value = avatar[property] || '';
            }
          }
        });

        // 同时更新图片预览
        Object.keys(this.currentConfig).forEach(key => {
          const config = this.currentConfig[key];
          if (config && config.backgroundImage) {
            const fieldId = `${key}_backgroundImage`;
            this.updateImagePreview(fieldId, config.backgroundImage);
          }
        });

        // 更新头像预览
        this.updateAllAvatarPreviews();

        // 重新绑定头像事件
        this.bindAvatarPreviewEvents();

        console.log('[Style Config Manager] 编辑器界面已刷新');
      } catch (error) {
        console.error('[Style Config Manager] 刷新编辑器界面失败:', error);
      }
    }

    // 处理输入框变化
    handleInputChange(input) {
      const key = input.getAttribute('data-config-key');
      const property = input.getAttribute('data-config-property');
      const value = input.value;

      if (key && property) {
        this.updateConfig(key, property, value);
        this.updateStatus('配置已修改，点击另存为按钮保存更改', 'info');

        // 如果是头像相关配置，更新预览
        if (key === 'messageSentAvatar' || key === 'messageReceivedAvatar') {
          this.updateAvatarPreview(key);
        }
      }
    }

    // 绑定头像预览事件
    bindAvatarPreviewEvents() {
      // 发送消息头像控件
      document.querySelectorAll('[data-config-key="messageSentAvatar"]').forEach(input => {
        input.addEventListener('input', () => {
          this.updateAvatarPreview('messageSentAvatar');
        });
      });

      // 接收消息头像控件（多个）
      document.querySelectorAll('.avatar-input, .avatar-range, .avatar-number').forEach(input => {
        input.addEventListener('input', e => {
          // @ts-ignore - Event target
          const avatarIndex = e.target.getAttribute('data-avatar-index');
          // @ts-ignore - Event target
          const property = e.target.getAttribute('data-property');
          // @ts-ignore - Event target
          const value = e.target.value;

          if (avatarIndex !== null && property) {
            this.updateAvatarProperty(parseInt(avatarIndex), property, value);

            // 同步滑块和数字输入的值
            if (property === 'rotation' || property === 'scale') {
              const relatedInputs = document.querySelectorAll(
                `[data-avatar-index="${avatarIndex}"][data-property="${property}"]`,
              );
              relatedInputs.forEach(relatedInput => {
                // @ts-ignore - HTMLElement value property
                if (relatedInput !== e.target) {
                  // @ts-ignore - HTMLElement value property
                  relatedInput.value = value;
                }
              });

              // 更新标签显示
              const label = document.querySelector(`[data-avatar-index="${avatarIndex}"] .range-value`);
              if (label && (property === 'rotation' || property === 'scale')) {
                const unit = property === 'rotation' ? '°' : 'x';
                label.textContent = `${value}${unit}`;
              }
            }
          }
        });
      });

      // 头像名称输入
      document.querySelectorAll('.avatar-name-input').forEach(input => {
        input.addEventListener('input', e => {
          // @ts-ignore - Event target
          const avatarIndex = e.target.getAttribute('data-avatar-index');
          // @ts-ignore - Event target
          const property = e.target.getAttribute('data-property');
          // @ts-ignore - Event target
          const value = e.target.value;

          if (avatarIndex !== null && property) {
            this.updateAvatarProperty(parseInt(avatarIndex), property, value);
          }
        });
      });

      // 头像文件上传
      document.querySelectorAll('.avatar-file-input').forEach(input => {
        input.addEventListener('change', e => {
          this.handleAvatarFileUpload(e.target);
        });
      });

      // 头像移除按钮
      document.querySelectorAll('.avatar-remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          this.handleAvatarImageRemove(e.target);
        });
      });

      // 好友背景控件（多个）
      document.querySelectorAll('.background-input, .background-range, .background-number').forEach(input => {
        input.addEventListener('input', e => {
          // @ts-ignore - Event target
          const backgroundIndex = e.target.getAttribute('data-background-index');
          // @ts-ignore - Event target
          const property = e.target.getAttribute('data-property');
          // @ts-ignore - Event target
          const value = e.target.value;

          if (backgroundIndex !== null && property) {
            this.updateBackgroundProperty(parseInt(backgroundIndex), property, value);

            // 同步滑块和数字输入的值
            if (property === 'rotation' || property === 'scale') {
              const relatedInputs = document.querySelectorAll(
                `[data-background-index="${backgroundIndex}"][data-property="${property}"]`,
              );
              relatedInputs.forEach(relatedInput => {
                // @ts-ignore - HTMLInputElement value property
                if (relatedInput !== e.target) relatedInput.value = value;
              });

              // 更新范围值显示
              const rangeValueSpan = document.querySelector(
                `[data-background-index="${backgroundIndex}"] .range-value`,
              );
              if (rangeValueSpan && property === 'rotation') {
                rangeValueSpan.textContent = `${value}°`;
              } else if (rangeValueSpan && property === 'scale') {
                rangeValueSpan.textContent = `${value}x`;
              }
            }

            // 更新预览
            this.updateBackgroundPreview(parseInt(backgroundIndex));
          }
        });
      });

      // 好友背景名称输入
      document.querySelectorAll('.background-name-input').forEach(input => {
        input.addEventListener('input', e => {
          // @ts-ignore - Event target
          const backgroundIndex = e.target.getAttribute('data-background-index');
          // @ts-ignore - Event target
          const property = e.target.getAttribute('data-property');
          // @ts-ignore - Event target
          const value = e.target.value;

          if (backgroundIndex !== null && property) {
            this.updateBackgroundProperty(parseInt(backgroundIndex), property, value);
          }
        });
      });

      // 好友背景文件上传
      document.querySelectorAll('.background-file-input').forEach(input => {
        input.addEventListener('change', e => {
          this.handleBackgroundFileUpload(e.target);
        });
      });

      // 好友背景移除按钮
      document.querySelectorAll('.background-remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          this.handleBackgroundImageRemove(e.target);
        });
      });
    }

    // 更新所有头像预览
    updateAllAvatarPreviews() {
      this.updateAvatarPreview('messageSentAvatar');

      // 更新所有接收消息头像预览
      const config = this.getConfig();
      if (config.messageReceivedAvatars) {
        config.messageReceivedAvatars.forEach((_, index) => {
          this.updateReceivedAvatarPreview(index);
        });
      }
    }

    // 更新头像预览
    updateAvatarPreview(configKey) {
      const config = this.currentConfig[configKey];
      if (!config) return;

      const previewElement = document.getElementById(`${configKey}_preview`);
      if (!previewElement) return;

      const circle = previewElement.querySelector('.avatar-preview-circle');
      if (!circle) return;

      // 获取背景图片
      const backgroundImage = config.backgroundImage || config.backgroundImageUrl;

      // 获取变换参数
      const rotation = parseFloat(config.rotation) || 0;
      const scale = parseFloat(config.scale) || 1;

      // 应用样式
      if (backgroundImage) {
        // @ts-ignore - HTMLElement style property
        circle.style.backgroundImage = `url(${backgroundImage})`;
        // @ts-ignore - HTMLElement style property
        circle.style.backgroundSize = 'cover';
        // @ts-ignore - HTMLElement style property
        circle.style.backgroundPosition = 'center';
        // @ts-ignore - HTMLElement style property
        circle.style.backgroundRepeat = 'no-repeat';
      } else {
        // @ts-ignore - HTMLElement style property
        circle.style.backgroundImage = '';
        // @ts-ignore - HTMLElement style property
        circle.style.background = '#f0f0f0';
      }

      // 应用变换
      // @ts-ignore - HTMLElement style property
      circle.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      // @ts-ignore - HTMLElement style property
      circle.style.transformOrigin = 'center center';
    }

    // 更新接收消息头像预览
    updateReceivedAvatarPreview(avatarIndex) {
      const config = this.getConfig();
      if (!config.messageReceivedAvatars || !config.messageReceivedAvatars[avatarIndex]) {
        console.warn(`[Avatar Preview] 头像配置不存在: index=${avatarIndex}`);
        return;
      }

      const avatar = config.messageReceivedAvatars[avatarIndex];
      const previewElement = document.querySelector(`[data-avatar-index="${avatarIndex}"] .avatar-preview-circle`);
      if (!previewElement) {
        console.warn(`[Avatar Preview] 预览元素不存在: [data-avatar-index="${avatarIndex}"] .avatar-preview-circle`);
        return;
      }

      // 格式化图片URL的函数（与generateCSS中的保持一致）
      const formatImageUrl = url => {
        if (!url) return '';
        if (url.startsWith('data:')) return url;
        return url; // 直接返回URL，不添加引号（CSS中需要引号，但style属性中不需要）
      };

      // 获取背景图片
      const backgroundImage = avatar.backgroundImage || avatar.backgroundImageUrl;
      const formattedUrl = formatImageUrl(backgroundImage);

      console.log(`[Avatar Preview] 更新头像预览 ${avatarIndex}:`, {
        name: avatar.name,
        originalUrl: backgroundImage,
        formattedUrl: formattedUrl,
        rotation: avatar.rotation,
        scale: avatar.scale,
      });

      // 获取变换参数
      const rotation = parseFloat(avatar.rotation) || 0;
      const scale = parseFloat(avatar.scale) || 1;

      // 应用样式
      if (formattedUrl) {
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundImage = `url(${formattedUrl})`;
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundSize = 'cover';
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundPosition = 'center';
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundRepeat = 'no-repeat';
      } else {
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundImage = '';
        // @ts-ignore - HTMLElement style property
        previewElement.style.background = '#f0f0f0';
      }

      // 应用变换
      // @ts-ignore - HTMLElement style property
      previewElement.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      // @ts-ignore - HTMLElement style property
      previewElement.style.transformOrigin = 'center center';
    }

    // 更新头像属性
    updateAvatarProperty(avatarIndex, property, value) {
      const config = this.getConfig();
      if (!config.messageReceivedAvatars || !config.messageReceivedAvatars[avatarIndex]) return;

      config.messageReceivedAvatars[avatarIndex][property] = value;
      this.updateConfig('messageReceivedAvatars', null, config.messageReceivedAvatars);

      // 更新预览
      if (
        property === 'backgroundImage' ||
        property === 'backgroundImageUrl' ||
        property === 'rotation' ||
        property === 'scale'
      ) {
        this.updateReceivedAvatarPreview(avatarIndex);
      }

      // 如果是好友ID更改，更新状态指示器
      if (property === 'friendId') {
        this.updateAvatarStatusIndicator(avatarIndex, value);
      }

      // 提示用户保存配置
      this.updateStatus('配置已修改，点击另存为按钮保存更改', 'info');
    }

    // 更新头像状态指示器
    updateAvatarStatusIndicator(avatarIndex, friendId) {
      const statusElement = document.querySelector(`[data-avatar-index="${avatarIndex}"] .field-status`);
      if (statusElement) {
        if (friendId && friendId.trim()) {
          statusElement.className = 'field-status valid';
          statusElement.innerHTML = `✅ 配置有效 - CSS选择器: [data-friend-id="${friendId}"] 和 #message-avatar-${friendId}`;
        } else {
          statusElement.className = 'field-status invalid';
          statusElement.innerHTML = `❌ 配置无效 - 请填写好友ID`;
        }
      }
    }

    // 更新好友背景属性
    updateBackgroundProperty(backgroundIndex, property, value) {
      const config = this.getConfig();
      if (!config.friendBackgrounds || !config.friendBackgrounds[backgroundIndex]) return;

      config.friendBackgrounds[backgroundIndex][property] = value;
      this.updateConfig('friendBackgrounds', null, config.friendBackgrounds);

      // 更新预览
      if (
        property === 'backgroundImage' ||
        property === 'backgroundImageUrl' ||
        property === 'rotation' ||
        property === 'scale' ||
        property === 'backgroundPosition'
      ) {
        this.updateBackgroundPreview(backgroundIndex);
      }

      // 如果是好友ID更改，更新状态指示器
      if (property === 'friendId') {
        this.updateBackgroundStatusIndicator(backgroundIndex, value);
      }

      // 提示用户保存配置
      this.updateStatus('配置已修改，点击另存为按钮保存更改', 'info');
    }

    // 更新好友背景状态指示器
    updateBackgroundStatusIndicator(backgroundIndex, friendId) {
      const statusElement = document.querySelector(`[data-background-index="${backgroundIndex}"] .field-status`);
      if (statusElement) {
        if (friendId && friendId.trim()) {
          statusElement.className = 'field-status valid';
          statusElement.innerHTML = `✅ 配置有效 - CSS选择器: .message-detail-content[data-background-id="${friendId}"]`;
        } else {
          statusElement.className = 'field-status invalid';
          statusElement.innerHTML = `❌ 配置无效 - 请填写好友ID`;
        }
      }
    }

    // 更新好友背景预览
    updateBackgroundPreview(backgroundIndex) {
      const config = this.getConfig();
      if (!config.friendBackgrounds || !config.friendBackgrounds[backgroundIndex]) return;

      const background = config.friendBackgrounds[backgroundIndex];
      const previewElement = document.querySelector(
        `[data-background-index="${backgroundIndex}"] .background-preview-rect`,
      );

      if (!previewElement) return;

      const backgroundImage = background.backgroundImage || background.backgroundImageUrl || '';
      const formattedUrl = formatImageUrl(backgroundImage);

      console.log(`[Background Preview] 更新好友背景预览 ${backgroundIndex}:`, {
        name: background.name,
        originalUrl: backgroundImage,
        formattedUrl: formattedUrl,
        rotation: background.rotation,
        scale: background.scale,
        position: background.backgroundPosition,
      });

      // 获取变换参数
      const rotation = parseFloat(background.rotation) || 0;
      const scale = parseFloat(background.scale) || 1;
      const backgroundPosition = background.backgroundPosition || 'center center';

      // 应用样式
      if (formattedUrl) {
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundImage = `url(${formattedUrl})`;
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundSize = 'cover';
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundPosition = backgroundPosition;
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundRepeat = 'no-repeat';
      } else {
        // @ts-ignore - HTMLElement style property
        previewElement.style.backgroundImage = '';
        // @ts-ignore - HTMLElement style property
        previewElement.style.background = '#f0f0f0';
      }

      // 应用变换
      // @ts-ignore - HTMLElement style property
      previewElement.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      // @ts-ignore - HTMLElement style property
      previewElement.style.transformOrigin = 'center center';
    }

    // 处理头像文件上传
    async handleAvatarFileUpload(fileInput) {
      const file = fileInput.files[0];
      if (!file) return;

      // @ts-ignore - Event target
      const avatarIndex = parseInt(fileInput.getAttribute('data-avatar-index'));
      const property = fileInput.getAttribute('data-property');

      if (avatarIndex === null || property === null) return;

      console.log('[Style Config Manager] 开始处理头像图片上传:', {
        name: file.name,
        type: file.type,
        size: file.size,
        avatarIndex: avatarIndex,
        property: property,
      });

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        this.updateStatus('请选择图片文件', 'error');
        console.warn('[Style Config Manager] 不支持的文件类型:', file.type);
        return;
      }

      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        this.updateStatus('头像图片文件过大，请选择小于5MB的图片', 'error');
        return;
      }

      // 验证文件扩展名
      const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!validImageExtensions.includes(fileExtension)) {
        this.updateStatus('不支持的头像图片格式，请选择 JPG、PNG、GIF、WebP 等格式', 'error');
        return;
      }

      try {
        this.updateStatus('正在上传头像图片...', 'loading');

        let imageUrl;
        if (sillyTavernCoreImported && uploadFileAttachmentToServer) {
          try {
            // 确保文件名正确格式化
            let fileName = file.name;

            // 如果文件名没有扩展名，从MIME类型推断
            if (!fileName.includes('.')) {
              const mimeToExt = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/bmp': '.bmp',
                'image/svg+xml': '.svg',
              };
              const extension = mimeToExt[file.type] || '.jpg';
              fileName = `${fileName}${extension}`;
            }

            // 添加时间戳前缀以避免文件名冲突
            const timestamp = Date.now();
            const safeName = `avatar_${timestamp}_${fileName}`;

            console.log('[Style Config Manager] 准备上传头像文件:', {
              originalName: file.name,
              processedName: safeName,
              type: file.type,
              size: file.size,
            });

            // 创建一个新的File对象，确保正确的文件名和类型
            const imageFile = new File([file], safeName, {
              type: file.type,
              lastModified: file.lastModified,
            });

            // 上传到SillyTavern Data Bank
            imageUrl = await uploadFileAttachmentToServer(imageFile, 'global');

            console.log('[Style Config Manager] Data Bank返回头像URL:', imageUrl);

            // 严格验证返回的URL - 必须是图片格式
            const isValidImageUrl =
              imageUrl &&
              (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                imageUrl.includes(safeName.replace(/\.[^.]+$/, ''))); // 至少包含我们的文件名前缀

            if (!isValidImageUrl) {
              console.warn('[Style Config Manager] ❌ Data Bank返回了错误的头像URL格式，可能是txt文件:', imageUrl);
              console.warn('[Style Config Manager] 预期的文件名应包含:', safeName);
              // 强制使用base64备用方案
              imageUrl = null;
            } else {
              console.log('[Style Config Manager] ✅ Data Bank头像上传成功，URL格式正确');
            }
          } catch (uploadError) {
            console.warn('[Style Config Manager] 头像图片上传到Data Bank失败，使用base64:', uploadError);
            imageUrl = null;
          }
        }

        if (!imageUrl) {
          console.log('[Style Config Manager] 使用base64方案处理头像图片');
          imageUrl = await this.fileToBase64(file);
        }

        // 更新头像配置
        this.updateAvatarProperty(avatarIndex, property, imageUrl);
        this.updateStatus('头像图片上传成功，点击另存为按钮保存更改', 'info');
      } catch (error) {
        console.error('[Style Config Manager] 头像图片上传失败:', error);
        this.updateStatus('头像图片上传失败', 'error');
      }
    }

    // 处理头像图片移除
    handleAvatarImageRemove(removeBtn) {
      // @ts-ignore - Event target
      const avatarIndex = parseInt(removeBtn.getAttribute('data-avatar-index'));
      const property = removeBtn.getAttribute('data-property');

      if (avatarIndex !== null && property) {
        this.updateAvatarProperty(avatarIndex, property, '');
        this.updateStatus('头像图片已移除，点击另存为按钮保存更改', 'info');

        // 重新渲染界面以更新按钮状态
        this.refreshEditorInterface();
      }
    }

    // 处理好友背景文件上传
    async handleBackgroundFileUpload(fileInput) {
      const file = fileInput.files[0];
      if (!file) return;

      // @ts-ignore - Event target
      const backgroundIndex = parseInt(fileInput.getAttribute('data-background-index'));
      const property = fileInput.getAttribute('data-property');

      if (backgroundIndex === null || !property) return;

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.updateStatus('不支持的背景图片格式，请选择 JPG、PNG、GIF、WebP 等格式', 'error');
        return;
      }

      try {
        this.updateStatus('正在上传好友背景图片...', 'loading');

        let imageUrl;
        // 使用Base64方案处理背景图片
        console.log('[Style Config Manager] 使用base64方案处理好友背景图片');
        imageUrl = await this.fileToBase64(file);

        // 更新背景配置
        this.updateBackgroundProperty(backgroundIndex, property, imageUrl);
        this.updateStatus('好友背景图片上传成功，点击另存为按钮保存更改', 'info');
      } catch (error) {
        console.error('[Style Config Manager] 好友背景图片上传失败:', error);
        this.updateStatus('好友背景图片上传失败', 'error');
      }
    }

    // 处理好友背景图片移除
    handleBackgroundImageRemove(removeBtn) {
      // @ts-ignore - Event target
      const backgroundIndex = parseInt(removeBtn.getAttribute('data-background-index'));
      const property = removeBtn.getAttribute('data-property');

      if (backgroundIndex !== null && property) {
        this.updateBackgroundProperty(backgroundIndex, property, '');
        this.updateStatus('好友背景图片已移除，点击另存为按钮保存更改', 'info');

        // 重新渲染界面以更新按钮状态
        this.refreshEditorInterface();
      }
    }

    // 处理图片上传
    async handleImageUpload(fileInput) {
      const file = fileInput.files[0];
      if (!file) return;

      console.log('[Style Config Manager] 开始处理图片上传:', {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        this.updateStatus('请选择图片文件', 'error');
        console.warn('[Style Config Manager] 不支持的文件类型:', file.type);
        return;
      }

      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        this.updateStatus('图片文件过大，请选择小于5MB的图片', 'error');
        return;
      }

      // 验证文件扩展名
      const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!validImageExtensions.includes(fileExtension)) {
        this.updateStatus('不支持的图片格式，请选择 JPG、PNG、GIF、WebP 等格式', 'error');
        return;
      }

      try {
        this.updateStatus('正在上传图片...', 'loading');

        let imageUrl;

        // 检查用户选择的上传模式
        const uploadModeInput = document.querySelector('input[name="imageUploadMode"]:checked');
        // @ts-ignore - HTMLInputElement value property
        const uploadMode = uploadModeInput ? uploadModeInput.value : 'auto';

        console.log('[Style Config Manager] 用户选择的上传模式:', uploadMode);

        if (uploadMode === 'auto' && sillyTavernCoreImported && uploadFileAttachmentToServer) {
          try {
            // 确保文件名正确格式化
            let fileName = file.name;

            // 如果文件名没有扩展名，从MIME类型推断
            if (!fileName.includes('.')) {
              const mimeToExt = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/bmp': '.bmp',
                'image/svg+xml': '.svg',
              };
              const extension = mimeToExt[file.type] || '.jpg';
              fileName = `${fileName}${extension}`;
            }

            // 添加时间戳前缀以避免文件名冲突
            const timestamp = Date.now();
            const safeName = `mobile_bg_${timestamp}_${fileName}`;

            console.log('[Style Config Manager] 准备上传文件:', {
              originalName: file.name,
              processedName: safeName,
              type: file.type,
              size: file.size,
            });

            // 创建一个新的File对象，确保正确的文件名和类型
            const imageFile = new File([file], safeName, {
              type: file.type,
              lastModified: file.lastModified,
            });

            // 上传到SillyTavern Data Bank
            imageUrl = await uploadFileAttachmentToServer(imageFile, 'global');

            console.log('[Style Config Manager] Data Bank返回URL:', imageUrl);

            // 严格验证返回的URL - 必须是图片格式
            const isValidImageUrl =
              imageUrl &&
              (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                imageUrl.includes(safeName.replace(/\.[^.]+$/, ''))); // 至少包含我们的文件名前缀

            if (!isValidImageUrl) {
              console.warn('[Style Config Manager] ❌ Data Bank返回了错误的URL格式，可能是txt文件:', imageUrl);
              console.warn('[Style Config Manager] 预期的文件名应包含:', safeName);
              // 强制使用base64备用方案
              imageUrl = null;
            } else {
              console.log('[Style Config Manager] ✅ Data Bank上传成功，URL格式正确');
            }
          } catch (uploadError) {
            console.warn('[Style Config Manager] Data Bank上传失败:', uploadError);
            imageUrl = null;
          }
        }

        if (!imageUrl) {
          // 备用方案或用户选择：转换为base64
          if (uploadMode === 'base64') {
            console.log('[Style Config Manager] 用户选择base64模式，直接转换');
          } else {
            console.log('[Style Config Manager] Data Bank上传失败或格式错误，使用base64备用方案');
          }
          imageUrl = await this.fileToBase64(file);
          console.log('[Style Config Manager] base64转换完成，长度:', imageUrl.length);
        }

        // 最终验证和配置更新
        const targetFieldId = fileInput.getAttribute('data-target');
        const targetInput = document.getElementById(targetFieldId);

        if (targetInput && imageUrl) {
          // 最后一次验证URL有效性
          const isFinalValidUrl =
            imageUrl.startsWith('data:') || // base64格式
            imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || // 图片扩展名
            (imageUrl.startsWith('/user/files/') && !imageUrl.endsWith('.txt')); // 不是txt文件

          if (!isFinalValidUrl) {
            console.error('[Style Config Manager] ❌ 最终URL验证失败，拒绝保存:', imageUrl);
            this.updateStatus('图片URL格式无效，请重试', 'error');
            return;
          }

          // @ts-ignore - HTMLInputElement value property
          targetInput.value = imageUrl;

          const key = targetInput.getAttribute('data-config-key');
          const property = targetInput.getAttribute('data-config-property');

          if (key && property) {
            this.updateConfig(key, property, imageUrl);
            this.updateImagePreview(targetFieldId, imageUrl);

            if (imageUrl.startsWith('data:')) {
              this.updateStatus('图片已转换为base64格式保存', 'success');
              console.log('[Style Config Manager] ✅ 使用base64格式保存图片');
            } else {
              this.updateStatus('图片上传成功！', 'success');
              console.log('[Style Config Manager] ✅ 使用文件URL保存图片:', imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('[Style Config Manager] 图片上传失败:', error);
        this.updateStatus('图片上传失败', 'error');
      }
    }

    // 处理图片移除
    handleImageRemove(removeBtn) {
      const targetFieldId = removeBtn.getAttribute('data-target');
      const targetInput = document.getElementById(targetFieldId);

      if (targetInput) {
        // @ts-ignore - HTMLInputElement value property
        targetInput.value = '';

        const key = targetInput.getAttribute('data-config-key');
        const property = targetInput.getAttribute('data-config-property');

        if (key && property) {
          this.updateConfig(key, property, '');
          this.updateImagePreview(targetFieldId, '');
          this.updateStatus('背景图片已移除', 'info');
        }
      }
    }

    // 文件转base64
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // 更新图片预览
    updateImagePreview(fieldId, imageUrl) {
      const previewContainer = document.querySelector(`[data-field-id="${fieldId}"]`);
      if (previewContainer) {
        if (imageUrl) {
          previewContainer.innerHTML = `<img src="${imageUrl}" alt="背景预览" />`;

          // 更新移除按钮
          const controlsContainer = previewContainer.nextElementSibling;
          if (controlsContainer && !controlsContainer.querySelector('.remove-btn')) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '🗑️ 移除';
            removeBtn.setAttribute('data-target', fieldId);
            removeBtn.addEventListener('click', e => {
              this.handleImageRemove(e.target);
            });
            controlsContainer.appendChild(removeBtn);
          }
        } else {
          previewContainer.innerHTML = '<div class="no-image">📷 暂无图片</div>';

          // 移除移除按钮
          const controlsContainer = previewContainer.nextElementSibling;
          if (controlsContainer) {
            const removeBtn = controlsContainer.querySelector('.remove-btn');
            if (removeBtn) {
              removeBtn.remove();
            }
          }
        }
      }
    }

    // 预览样式
    previewStyles() {
      this.applyStyles();
      this.updateStatus('样式预览已应用，如需永久保存请点击保存按钮', 'success');
    }

    // 重置样式
    resetStyles() {
      if (confirm('确定要重置为默认样式吗？这将清除所有自定义配置。')) {
        this.resetToDefault();

        // 更新界面输入框
        document.querySelectorAll('.config-input').forEach(input => {
          const key = input.getAttribute('data-config-key');
          const property = input.getAttribute('data-config-property');

          if (key && property && this.currentConfig[key]) {
            // @ts-ignore - HTMLInputElement value property
            input.value = this.currentConfig[key][property] || '';
          }
        });

        this.applyStyles();
        this.updateStatus('已重置为默认样式', 'info');
      }
    }

    // 更新状态显示
    updateStatus(message, type = 'info') {
      const statusElement = document.getElementById('config-status');
      if (!statusElement) return;

      const iconMap = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        loading: '⏳',
      };

      const statusIcon = statusElement.querySelector('.status-icon');
      const statusText = statusElement.querySelector('.status-text');

      if (statusIcon) statusIcon.textContent = iconMap[type] || 'ℹ️';
      if (statusText) statusText.textContent = message;

      statusElement.className = `config-status ${type}`;

      // 自动清除成功和错误状态
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          this.updateStatus('调整完成后点击另存为按钮', 'info');
        }, 3000);
      }
    }

    // 分发就绪事件
    dispatchReadyEvent() {
      const event = new CustomEvent('styleConfigManagerReady', {
        detail: {
          manager: this,
          config: this.currentConfig,
        },
      });
      window.dispatchEvent(event);
    }

    // 分发样式应用事件
    dispatchStyleAppliedEvent() {
      const event = new CustomEvent('mobileStylesApplied', {
        detail: {
          config: this.currentConfig,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    }

    // 获取CSS样式表
    getStyleSheet() {
      return this.generateCSS();
    }

    // 检查是否已准备就绪
    isConfigReady() {
      return this.isReady && this.configLoaded;
    }

    // 等待配置加载完成
    async waitForReady() {
      if (this.isConfigReady()) {
        return;
      }

      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.isConfigReady()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
  }

  // 创建全局实例
  // @ts-ignore - 全局构造函数
  window.StyleConfigManager = StyleConfigManager;

  // 为settings应用提供的接口
  // @ts-ignore - 添加全局函数
  window.getStyleConfigAppContent = function () {
    console.log('[Style Config Manager] 获取样式配置应用内容');

    // @ts-ignore - 全局对象属性
    if (!window.styleConfigManager) {
      console.log('[Style Config Manager] 创建样式配置管理器实例');
      // @ts-ignore - 全局对象属性
      window.styleConfigManager = new StyleConfigManager();
    }

    // 始终返回完整界面，让内部组件处理加载状态
    // @ts-ignore - 全局对象属性
    return window.styleConfigManager.getSettingsAppContent();
  };

  // @ts-ignore - 添加全局函数
  window.bindStyleConfigEvents = function () {
    console.log('[Style Config Manager] 绑定样式配置事件');

    // @ts-ignore - 全局对象属性
    if (!window.styleConfigManager) {
      console.log('[Style Config Manager] 创建样式配置管理器实例');
      // @ts-ignore - 全局对象属性
      window.styleConfigManager = new StyleConfigManager();
    }

    // 不管是否准备就绪，都直接绑定事件
    // @ts-ignore - 全局对象属性
    window.styleConfigManager.bindSettingsEvents();
    console.log('[Style Config Manager] 事件绑定完成');

    // 如果还没准备就绪，等待准备就绪后再执行一次绑定
    // @ts-ignore - 全局对象属性
    if (!window.styleConfigManager.isConfigReady()) {
      console.log('[Style Config Manager] 配置管理器未准备就绪，等待准备完成...');
      // @ts-ignore - 全局对象属性
      window.styleConfigManager
        .waitForReady()
        .then(() => {
          console.log('[Style Config Manager] 配置管理器已准备就绪，重新绑定事件');
          // @ts-ignore - 全局对象属性
          window.styleConfigManager.bindSettingsEvents();
        })
        .catch(error => {
          console.error('[Style Config Manager] 等待准备就绪失败:', error);
        });
    }
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // @ts-ignore - 全局对象属性
      window.styleConfigManager = new StyleConfigManager();
    });
  } else {
    // DOM已经加载完成
    setTimeout(() => {
      // @ts-ignore - 全局对象属性
      if (!window.styleConfigManager) {
        // @ts-ignore - 全局对象属性
        window.styleConfigManager = new StyleConfigManager();
      }
    }, 1000);
  }

  console.log('[Style Config Manager] 样式配置管理器模块加载完成');
} // 结束 if (typeof window.StyleConfigManager === 'undefined') 检查
