// ==SillyTavern Extension==
// @name         Mobile Context Monitor with Upload & Editor & Custom API & MesID Floor Monitor
// @version      2.3.0
// @description  实时监控 SillyTavern 上下文变化的移动端插件，带文件上传功能、上下文编辑器、自定义API配置和MesID楼层监听器 v2.3（SillyTavern.getContext() API集成）
// @author       Assistant
// @license      MIT

// 优化：首先加载性能配置和优化加载器
const performanceScript = document.createElement('script');
performanceScript.src = './scripts/extensions/third-party/mobile/performance-config.js';
performanceScript.onload = () => {
  console.log('[Mobile Context] 性能配置加载完成');

  // 加载优化加载器
  const optimizedLoaderScript = document.createElement('script');
  optimizedLoaderScript.src = './scripts/extensions/third-party/mobile/optimized-loader.js';
  optimizedLoaderScript.onload = () => {
    console.log('[Mobile Context] 优化加载器加载完成');

    // 加载性能测试器
    const performanceTestScript = document.createElement('script');
    performanceTestScript.src = './scripts/extensions/third-party/mobile/performance-test.js';
    performanceTestScript.onload = () => {
      console.log('[Mobile Context] 性能测试器加载完成');

      // 加载诊断工具
      const diagnosticScript = document.createElement('script');
      diagnosticScript.src = './scripts/extensions/third-party/mobile/diagnostic-tool.js';
      diagnosticScript.onload = () => {
        console.log('[Mobile Context] 诊断工具加载完成');
        // 开始优化加载流程
        initOptimizedLoading();
      };
      diagnosticScript.onerror = () => {
        console.warn('[Mobile Context] 诊断工具加载失败，继续初始化');
        initOptimizedLoading();
      };
      document.head.appendChild(diagnosticScript);
    };
    performanceTestScript.onerror = () => {
      console.warn('[Mobile Context] 性能测试器加载失败，继续初始化');
      initOptimizedLoading();
    };
    document.head.appendChild(performanceTestScript);
  };
  document.head.appendChild(optimizedLoaderScript);
};
document.head.appendChild(performanceScript);

// 优化：使用并行加载替代顺序加载
async function initOptimizedLoading() {
  try {
    const loader = window.optimizedLoader;

    // 定义核心模块（高优先级）
    const coreModules = [
      {
        src: './scripts/extensions/third-party/mobile/context-monitor.js',
        name: 'context-monitor',
        priority: 'high',
        required: true,
      },
      {
        src: './scripts/extensions/third-party/mobile/mobile-upload.js',
        name: 'mobile-upload',
        priority: 'high',
        required: true,
      },
      {
        src: './scripts/extensions/third-party/mobile/mobile-phone.js',
        name: 'mobile-phone',
        priority: 'high',
        required: true,
      },
    ];

    // 定义扩展模块（中优先级）
    const extensionModules = [
      {
        src: './scripts/extensions/third-party/mobile/context-editor.js',
        name: 'context-editor',
        priority: 'medium',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/custom-api-config.js',
        name: 'custom-api-config',
        priority: 'medium',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/mesid-floor-monitor.js',
        name: 'mesid-floor-monitor',
        priority: 'medium',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/app/weibo-app/weibo-manager.js',
        name: 'weibo-manager',
        priority: 'medium',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/app/forum-app/forum-manager.js',
        name: 'forum-manager',
        priority: 'medium',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/app/weibo-app/weibo-auto-listener.js',
        name: 'weibo-auto-listener',
        priority: 'low',
        required: false,
      },
      {
        src: './scripts/extensions/third-party/mobile/app/forum-app/forum-auto-listener.js',
        name: 'forum-auto-listener',
        priority: 'low',
        required: false,
      },
    ];

    // 优化：并行加载核心模块
    console.log('[Mobile Context] 开始并行加载核心模块...');
    await loader.loadScriptsParallel(coreModules);

    // 延迟加载扩展模块
    setTimeout(() => {
      console.log('[Mobile Context] 开始加载扩展模块...');
      loader.loadScriptsParallel(extensionModules);
    }, 1000);

    console.log('[Mobile Context] 优化加载流程完成');
  } catch (error) {
    console.error('[Mobile Context] 优化加载失败，回退到传统加载方式:', error);
    // 回退到传统加载方式
    fallbackToTraditionalLoading();
  }
}

// 回退到传统加载方式
function fallbackToTraditionalLoading() {
  console.log('[Mobile Context] 使用传统加载方式...');

  // 引入上下文监控器
  const contextScript = document.createElement('script');
  contextScript.src = './scripts/extensions/third-party/mobile/context-monitor.js';
  contextScript.onload = () => {
    console.log('[Mobile Context] 上下文监控器加载完成');
  };
  document.head.appendChild(contextScript);

  // 加载移动端上传管理器
  const uploadScript = document.createElement('script');
  uploadScript.src = './scripts/extensions/third-party/mobile/mobile-upload.js';
  uploadScript.onload = () => {
    console.log('[Mobile Context] 移动端上传管理器加载完成');
    // 检查上传管理器是否创建成功
    setTimeout(() => {
      if (window.mobileUploadManager) {
        console.log('[Mobile Context] ✅ 移动端上传管理器创建成功');
      } else {
        console.error('[Mobile Context] ❌ 移动端上传管理器创建失败');
      }
    }, 100);
  };
  uploadScript.onerror = () => {
    console.error('[Mobile Context] 移动端上传管理器加载失败');
  };
  document.head.appendChild(uploadScript);

  // 加载性能测试器（传统方式）
  const performanceTestScript = document.createElement('script');
  performanceTestScript.src = './scripts/extensions/third-party/mobile/performance-test.js';
  performanceTestScript.onload = () => {
    console.log('[Mobile Context] 性能测试器加载完成（传统方式）');

    // 加载诊断工具（传统方式）
    const diagnosticScript = document.createElement('script');
    diagnosticScript.src = './scripts/extensions/third-party/mobile/diagnostic-tool.js';
    diagnosticScript.onload = () => {
      console.log('[Mobile Context] 诊断工具加载完成（传统方式）');
    };
    diagnosticScript.onerror = () => {
      console.warn('[Mobile Context] 诊断工具加载失败（传统方式）');
    };
    document.head.appendChild(diagnosticScript);
  };
  performanceTestScript.onerror = () => {
    console.warn('[Mobile Context] 性能测试器加载失败（传统方式）');
  };
  document.head.appendChild(performanceTestScript);
}

// 加载移动端上下文编辑器
const contextEditorScript = document.createElement('script');
contextEditorScript.src = './scripts/extensions/third-party/mobile/context-editor.js';
contextEditorScript.onload = () => {
  console.log('[Mobile Context] 移动端上下文编辑器加载完成');
  // 检查上下文编辑器是否创建成功
  setTimeout(() => {
    if (window.mobileContextEditor) {
      console.log('[Mobile Context] ✅ 移动端上下文编辑器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 移动端上下文编辑器创建失败');
    }
  }, 100);
};
contextEditorScript.onerror = () => {
  console.error('[Mobile Context] 移动端上下文编辑器加载失败');
};
document.head.appendChild(contextEditorScript);

// 加载自定义API配置模块
const customAPIScript = document.createElement('script');
customAPIScript.src = './scripts/extensions/third-party/mobile/custom-api-config.js';
customAPIScript.onload = () => {
  console.log('[Mobile Context] 自定义API配置模块加载完成');
  // 检查API配置模块是否创建成功
  setTimeout(() => {
    if (window.mobileCustomAPIConfig) {
      console.log('[Mobile Context] ✅ 自定义API配置模块创建成功');
    } else {
      console.error('[Mobile Context] ❌ 自定义API配置模块创建失败');
    }
  }, 100);
};
customAPIScript.onerror = () => {
  console.error('[Mobile Context] 自定义API配置模块加载失败');
};
document.head.appendChild(customAPIScript);

// 加载MesID楼层监听器模块
const mesidFloorScript = document.createElement('script');
mesidFloorScript.src = './scripts/extensions/third-party/mobile/mesid-floor-monitor.js';
mesidFloorScript.onload = () => {
  console.log('[Mobile Context] MesID楼层监听器模块加载完成');
  // 检查楼层监听器是否创建成功
  setTimeout(() => {
    if (window.mesidFloorMonitor) {
      console.log('[Mobile Context] ✅ MesID楼层监听器创建成功');
    } else {
      console.error('[Mobile Context] ❌ MesID楼层监听器创建失败');
    }
  }, 100);
};
mesidFloorScript.onerror = () => {
  console.error('[Mobile Context] MesID楼层监听器模块加载失败');
};
document.head.appendChild(mesidFloorScript);

// 加载微博功能模块
// 1. 加载微博管理器
const weiboManagerScript = document.createElement('script');
weiboManagerScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-manager.js';
weiboManagerScript.onload = () => {
  console.log('[Mobile Context] 微博管理器加载完成');
  // 检查微博管理器是否创建成功
  setTimeout(() => {
    if (window.weiboManager) {
      console.log('[Mobile Context] ✅ 微博管理器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 微博管理器创建失败');
    }
  }, 100);
};
weiboManagerScript.onerror = () => {
  console.error('[Mobile Context] 微博管理器加载失败');
};
document.head.appendChild(weiboManagerScript);

// 2. 加载微博自动监听器
const weiboAutoListenerScript = document.createElement('script');
weiboAutoListenerScript.src = './scripts/extensions/third-party/mobile/app/weibo-app/weibo-auto-listener.js';
weiboAutoListenerScript.onload = () => {
  console.log('[Mobile Context] 微博自动监听器加载完成');
  // 检查微博自动监听器是否创建成功
  setTimeout(() => {
    if (window.weiboAutoListener) {
      console.log('[Mobile Context] ✅ 微博自动监听器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 微博自动监听器创建失败');
    }
  }, 100);
};
weiboAutoListenerScript.onerror = () => {
  console.error('[Mobile Context] 微博自动监听器加载失败');
};
document.head.appendChild(weiboAutoListenerScript);

// 加载论坛功能模块
// 1. 先加载论坛管理器
const forumManagerScript = document.createElement('script');
forumManagerScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-manager.js';
forumManagerScript.onload = () => {
  console.log('[Mobile Context] 论坛管理器加载完成');
  // 检查论坛管理器是否创建成功
  setTimeout(() => {
    if (window.forumManager) {
      console.log('[Mobile Context] ✅ 论坛管理器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 论坛管理器创建失败');
    }
  }, 100);
};
forumManagerScript.onerror = () => {
  console.error('[Mobile Context] 论坛管理器加载失败');
};
document.head.appendChild(forumManagerScript);

// 2. 加载论坛风格定义
const forumStylesScript = document.createElement('script');
forumStylesScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-styles.js';
forumStylesScript.onload = () => {
  console.log('[Mobile Context] 论坛风格模块加载完成');
  // 检查论坛风格是否创建成功
  setTimeout(() => {
    if (window.forumStyles) {
      console.log('[Mobile Context] ✅ 论坛风格模块创建成功');
    } else {
      console.error('[Mobile Context] ❌ 论坛风格模块创建失败');
    }
  }, 100);
};
forumStylesScript.onerror = () => {
  console.error('[Mobile Context] 论坛风格模块加载失败');
};
document.head.appendChild(forumStylesScript);

// 3. 加载论坛自动监听器
const forumAutoListenerScript = document.createElement('script');
forumAutoListenerScript.src = './scripts/extensions/third-party/mobile/app/forum-app/forum-auto-listener.js';
forumAutoListenerScript.onload = () => {
  console.log('[Mobile Context] 论坛自动监听器加载完成');
  // 检查论坛自动监听器是否创建成功
  setTimeout(() => {
    if (window.forumAutoListener) {
      console.log('[Mobile Context] ✅ 论坛自动监听器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 论坛自动监听器创建失败');
    }
  }, 100);
};
forumAutoListenerScript.onerror = () => {
  console.error('[Mobile Context] 论坛自动监听器加载失败');
};
document.head.appendChild(forumAutoListenerScript);

// 加载手机界面样式（先加载样式）
const phoneStyle = document.createElement('link');
phoneStyle.rel = 'stylesheet';
phoneStyle.type = 'text/css';
phoneStyle.href = './scripts/extensions/third-party/mobile/mobile-phone.css';
phoneStyle.onload = () => {
  console.log('[Mobile Context] 手机界面样式加载完成');
};
phoneStyle.onerror = () => {
  console.error('[Mobile Context] 手机界面样式加载失败');
};
document.head.appendChild(phoneStyle);

// 加载图片配置弹窗样式
const imageConfigStyle = document.createElement('link');
imageConfigStyle.rel = 'stylesheet';
imageConfigStyle.type = 'text/css';
imageConfigStyle.href = './scripts/extensions/third-party/mobile/app/image-config-modal.css';
imageConfigStyle.onload = () => {
  console.log('[Mobile Context] 图片配置弹窗样式加载完成');
};
imageConfigStyle.onerror = () => {
  console.error('[Mobile Context] 图片配置弹窗样式加载失败');
};
document.head.appendChild(imageConfigStyle);

// 加载手机界面脚本（在样式之后）
const phoneScript = document.createElement('script');
phoneScript.src = './scripts/extensions/third-party/mobile/mobile-phone.js';
phoneScript.onload = () => {
  console.log('[Mobile Context] 手机界面脚本加载完成');
  // 检查按钮是否创建成功
  setTimeout(() => {
    const trigger = document.getElementById('mobile-phone-trigger');
    if (trigger) {
      console.log('[Mobile Context] ✅ 手机按钮创建成功');
      // 添加上传按钮到手机界面
      addUploadButtonToMobilePhone();
      // 应用手机可见性设置
      updatePhoneVisibility();
    } else {
      console.error('[Mobile Context] ❌ 手机按钮创建失败');
    }
  }, 100);
};
phoneScript.onerror = () => {
  console.error('[Mobile Context] 手机界面脚本加载失败');
};
document.head.appendChild(phoneScript);

// 加载语音消息处理器脚本
const voiceMessageScript = document.createElement('script');
voiceMessageScript.src = './scripts/extensions/third-party/mobile/app/voice-message-handler.js';
voiceMessageScript.onload = () => {
  console.log('[Mobile Context] 语音消息处理器加载完成');
  // 检查语音消息处理器是否创建成功
  setTimeout(() => {
    if (window.voiceMessageHandler) {
      console.log('[Mobile Context] ✅ 语音消息处理器创建成功');
    } else {
      console.error('[Mobile Context] ❌ 语音消息处理器创建失败');
    }
  }, 100);
};
voiceMessageScript.onerror = () => {
  console.error('[Mobile Context] 语音消息处理器加载失败');
};
document.head.appendChild(voiceMessageScript);

// 加载图片配置弹窗脚本
const imageConfigScript = document.createElement('script');
imageConfigScript.src = './scripts/extensions/third-party/mobile/app/image-config-modal.js';
imageConfigScript.onload = () => {
  console.log('[Mobile Context] 图片配置弹窗加载完成');
  // 检查图片配置弹窗是否创建成功
  setTimeout(() => {
    if (window.ImageConfigModal) {
      console.log('[Mobile Context] ✅ 图片配置弹窗创建成功');
    } else {
      console.error('[Mobile Context] ❌ 图片配置弹窗创建失败');
    }
  }, 100);
};
imageConfigScript.onerror = () => {
  console.error('[Mobile Context] 图片配置弹窗加载失败');
};
document.head.appendChild(imageConfigScript);

// 等待页面加载完成后初始化
jQuery(async () => {
  // 等待 SillyTavern 完全加载
  if (!window.SillyTavern) {
    console.log('[Mobile Context] 等待 SillyTavern 启动...');
    const waitForST = setInterval(() => {
      if (window.SillyTavern) {
        clearInterval(waitForST);
        initMobileContextPlugin();
      }
    }, 1000);
  } else {
    initMobileContextPlugin();
  }
});

// 全局变量
let contextMonitor = null;
let isInitialized = false;

// 设置默认配置
const defaultSettings = {
  enabled: true,
  monitorChat: true,
  monitorCharacter: true,
  monitorEvents: true,
  logLevel: 'info',
  maxLogEntries: 100,
  historyLimit: 50,
  monitorInterval: 3000,
  enableEventLogging: true,
  enableContextLogging: true,
  enableAutoSave: false,
  // 新增上传功能设置
  uploadEnabled: true,
  maxUploadSize: 50 * 1024 * 1024, // 50MB
  showUploadNotifications: true,
  // 新增上下文编辑器设置
  contextEditorEnabled: true,
  // 新增自定义API配置设置
  customAPIEnabled: true,
  showAPIConfigButton: true,
  // 新增MesID楼层监听器设置
  mesidFloorEnabled: true,
  floorSelector: '.message',
  enableFloorNotifications: true,
  // 新增论坛管理器设置
  forumEnabled: true,
  forumAutoUpdate: true,
  forumThreshold: 10,
  forumStyle: '贴吧老哥',
  // 新增手机交互设置
  tavernCompatibilityMode: true,
  hidePhone: false,
  // 新增禁止正文设置
  disableBodyText: false,
};

// 插件设置 - 将在初始化时与 SillyTavern 的 extension_settings 集成
let extension_settings = {
  mobile_context: { ...defaultSettings },
};

// 等待 ContextMonitor 类加载
function waitForContextMonitor() {
  return new Promise(resolve => {
    if (window.ContextMonitor) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.ContextMonitor) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

// 等待所有模块加载完成
function waitForAllModules() {
  return new Promise(resolve => {
    const checkModules = () => {
      const contextEditorReady = window.mobileContextEditor !== undefined;
      const customAPIReady = window.mobileCustomAPIConfig !== undefined;
      const uploadManagerReady = window.mobileUploadManager !== undefined;
      const mesidFloorReady = window.mesidFloorMonitor !== undefined;
      const forumStylesReady = window.forumStyles !== undefined;
      const forumAutoListenerReady = window.forumAutoListener !== undefined;
      const forumManagerReady = window.forumManager !== undefined;
      const voiceMessageReady = window.voiceMessageHandler !== undefined;

      console.log('[Mobile Context] 模块加载状态:', {
        contextEditor: contextEditorReady,
        customAPI: customAPIReady,
        uploadManager: uploadManagerReady,
        mesidFloor: mesidFloorReady,
        forumStyles: forumStylesReady,
        forumAutoListener: forumAutoListenerReady,
        forumManager: forumManagerReady,
        voiceMessage: voiceMessageReady,
      });

      if (
        contextEditorReady &&
        customAPIReady &&
        uploadManagerReady &&
        mesidFloorReady &&
        forumStylesReady &&
        forumAutoListenerReady &&
        forumUIReady &&
        forumManagerReady &&
        voiceMessageReady
      ) {
        console.log('[Mobile Context] ✅ 所有模块加载完成');
        resolve();
      } else {
        // 继续等待
        setTimeout(checkModules, 200);
      }
    };

    // 开始检查
    checkModules();
  });
}

/**
 * 主插件初始化函数
 */
async function initMobileContextPlugin() {
  try {
    // 集成 SillyTavern 的 extension_settings
    const context = SillyTavern.getContext();
    if (!context.extensionSettings.mobile_context) {
      context.extensionSettings.mobile_context = { ...defaultSettings };
      context.saveSettingsDebounced();
    } else {
      // 合并默认设置，确保新增的设置项存在
      for (const key of Object.keys(defaultSettings)) {
        if (context.extensionSettings.mobile_context[key] === undefined) {
          context.extensionSettings.mobile_context[key] = defaultSettings[key];
        }
      }
      context.saveSettingsDebounced();
    }

    // 使用 SillyTavern 的 extension_settings
    extension_settings = context.extensionSettings;

    // 等待 ContextMonitor 类加载
    await waitForContextMonitor();

    // 初始化上下文监控器
    contextMonitor = new window.ContextMonitor(extension_settings.mobile_context);

    // 创建设置UI
    createSettingsUI();

    // 等待所有模块加载完成后再注册控制台命令
    await waitForAllModules();

    // 注册控制台命令
    registerConsoleCommands();

    // 启动监控
    if (extension_settings.mobile_context.enabled) {
      contextMonitor.start();
    }

    // 初始化上传功能
    if (extension_settings.mobile_context.uploadEnabled) {
      initUploadFeature();
    }

    // 初始化楼层监听器
    if (extension_settings.mobile_context.mesidFloorEnabled) {
      initMesIDFloorMonitor();
    }

    // 初始化论坛功能
    initForumFeatures();

    // 初始化微博功能
    initWeiboFeatures();

    // 应用手机可见性设置
    updatePhoneVisibility();

    isInitialized = true;
    console.log(
      '[Mobile Context] v2.4 插件已加载（包含上传功能、上下文编辑器、自定义API配置、MesID楼层监听器和论坛管理器，使用SillyTavern.getContext() API集成）',
    );
  } catch (error) {
    console.error('[Mobile Context] 插件初始化失败:', error);
  }
}

/**
 * 初始化上传功能
 */
function initUploadFeature() {
  try {
    // 监听上传完成事件
    document.addEventListener('mobile-upload-complete', function (event) {
      const detail = event.detail;
      console.log('[Mobile Context] 文件上传完成:', detail);

      // 如果上下文监控器存在，记录上传事件
      if (contextMonitor && contextMonitor.log) {
        contextMonitor.log('info', `文件上传: ${detail.originalFilename} (${(detail.size / 1024).toFixed(1)} KB)`);
      }
    });

    console.log('[Mobile Context] 上传功能初始化完成');
  } catch (error) {
    console.error('[Mobile Context] 上传功能初始化失败:', error);
  }
}

/**
 * 初始化MesID楼层监听器
 */
function initMesIDFloorMonitor() {
  try {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未就绪，等待中...');
      // 等待楼层监听器加载完成
      setTimeout(initMesIDFloorMonitor, 1000);
      return;
    }

    // 设置楼层选择器
    if (extension_settings.mobile_context.floorSelector) {
      window.mesidFloorMonitor.setFloorSelector(extension_settings.mobile_context.floorSelector);
    }

    // 如果启用了通知，添加默认的楼层变化监听器
    if (extension_settings.mobile_context.enableFloorNotifications) {
      window.mesidFloorMonitor.addEventListener('onFloorAdded', function (data) {
        console.log(`[MesID楼层监听器] 🟢 楼层增加: ${data.oldCount} -> ${data.newCount} (+${data.change})`);
        if (contextMonitor && contextMonitor.log) {
          contextMonitor.log('info', `楼层增加: ${data.oldCount} -> ${data.newCount} (+${data.change})`);
        }
      });

      window.mesidFloorMonitor.addEventListener('onFloorRemoved', function (data) {
        console.log(`[MesID楼层监听器] 🔴 楼层减少: ${data.oldCount} -> ${data.newCount} (${data.change})`);
        if (contextMonitor && contextMonitor.log) {
          contextMonitor.log('info', `楼层减少: ${data.oldCount} -> ${data.newCount} (${data.change})`);
        }
      });
    }

    // 开始监听
    window.mesidFloorMonitor.start();

    console.log('[Mobile Context] MesID楼层监听器初始化完成');
  } catch (error) {
    console.error('[Mobile Context] MesID楼层监听器初始化失败:', error);
  }
}

/**
 * 初始化论坛功能
 */
function initForumFeatures() {
  try {
    console.log('[Mobile Context] 开始初始化论坛功能...');

    if (!window.forumManager) {
      console.warn('[Mobile Context] 论坛管理器未就绪，等待中...');
      // 等待论坛管理器加载完成
      setTimeout(initForumFeatures, 1000);
      return;
    }

    // 初始化论坛管理器
    window.forumManager
      .initialize()
      .then(() => {
        console.log('[Mobile Context] ✅ 论坛管理器初始化成功');

        // 启动自动监听器（如果论坛设置为自动更新）
        if (window.forumAutoListener) {
          window.forumAutoListener.start();
          console.log('[Mobile Context] ✅ 论坛自动监听器已启动');
        }

        // 记录初始化事件
        if (contextMonitor && contextMonitor.log) {
          contextMonitor.log('info', '论坛管理器已启动');
        }
      })
      .catch(error => {
        console.error('[Mobile Context] 论坛管理器初始化失败:', error);
      });

    console.log('[Mobile Context] 论坛功能初始化完成');
  } catch (error) {
    console.error('[Mobile Context] 论坛功能初始化失败:', error);
  }
}

/**
 * 初始化微博功能
 */
function initWeiboFeatures() {
  try {
    console.log('[Mobile Context] 开始初始化微博功能...');

    if (!window.weiboManager) {
      console.warn('[Mobile Context] 微博管理器未就绪，等待中...');
      // 等待微博管理器加载完成
      setTimeout(initWeiboFeatures, 1000);
      return;
    }

    // 初始化微博管理器
    window.weiboManager
      .initialize()
      .then(() => {
        console.log('[Mobile Context] ✅ 微博管理器初始化成功');

        // 启动自动监听器（如果微博设置为自动更新）
        if (window.weiboAutoListener) {
          window.weiboAutoListener.start();
          console.log('[Mobile Context] ✅ 微博自动监听器已启动');
        }

        // 记录初始化事件
        if (contextMonitor && contextMonitor.log) {
          contextMonitor.log('info', '微博管理器已启动');
        }
      })
      .catch(error => {
        console.error('[Mobile Context] 微博管理器初始化失败:', error);
      });

    console.log('[Mobile Context] 微博功能初始化完成');
  } catch (error) {
    console.error('[Mobile Context] 微博功能初始化失败:', error);
  }
}

/**
 * 添加上传按钮到手机界面
 */
function addUploadButtonToMobilePhone() {
  // 等待手机界面完全加载
  setTimeout(() => {
    const phoneContainer = document.querySelector('.mobile-phone-container');
    if (phoneContainer) {
      // 创建上传按钮
      const uploadButton = document.createElement('button');
      uploadButton.id = 'mobile-upload-trigger';
      uploadButton.className = 'mobile-upload-btn';
      uploadButton.innerHTML = '📁';
      uploadButton.title = '文件上传';
      uploadButton.style.cssText = `
                position: fixed;
                bottom: 140px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                z-index: 9998;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

      // 悬停效果
      uploadButton.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
      });

      uploadButton.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      });

      // 点击事件
      uploadButton.addEventListener('click', function () {
        if (window.mobileUploadManager) {
          window.mobileUploadManager.toggleMobileUploadUI();
        } else {
          console.warn('[Mobile Context] 上传管理器未就绪');
        }
      });

      document.body.appendChild(uploadButton);
      console.log('[Mobile Context] ✅ 上传按钮已添加到手机界面');
    } else {
      console.warn('[Mobile Context] 未找到手机界面容器');
    }
  }, 500);
}

/**
 * 创建设置UI
 */
function createSettingsUI() {
  const settingsHtml = `
    <div id="mobile_context_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>外置手机</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container" style='flex-wrap: wrap;flex-direction: row;'>
                    <label class="checkbox_label" for="mobile_tavern_compatibility_mode">
                        <input id="mobile_tavern_compatibility_mode" type="checkbox" />
                        <span>酒馆页面与手机控制兼容</span>
                    </label>
                    <label class="checkbox_label" for="mobile_hide_phone">
                        <input id="mobile_hide_phone" type="checkbox" />
                        <span>隐藏手机按钮</span>
                    </label>
                    <label class="checkbox_label" for="mobile_auto_send_enabled">
                        <input id="mobile_auto_send_enabled" type="checkbox" />
                        <span>专一模式（一次只和一人聊天）</span>
                    </label>
                    <label class="checkbox_label" for="mobile_disable_body_text">
                        <input id="mobile_disable_body_text" type="checkbox" />
                        <span>禁止正文</span>
                    </label>
                    <div class="flex m-t-1" style='flex-wrap: wrap;'>
                        <button id="mobile_context_status_btn" class="menu_button" style='width: auto;background:#777;color:#fff;display:none'>查看状态</button>
                        <button id="mobile_context_clear_btn" class="menu_button" style='width: auto;background:#777;color:#fff'>清除日志</button>
                        <button id="mobile_custom_api_show_btn" class="menu_button" style='width: auto;background:#777;color:#fff'>自定义API配置</button>
                        <button id="mobile_mesid_floor_status_btn" class="menu_button" style='width: auto;background:#777;color:#fff;display:none'>楼层监听器状态</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

  $('#extensions_settings').append(settingsHtml);

  // 绑定设置控件
  bindSettingsControls();

  // 绑定样式配置器
  bindStyleConfigControls();
}

/**
 * 绑定样式配置器控件
 */
function bindStyleConfigControls() {
  console.log('[Mobile Extension] 绑定样式配置器控件');

  // 绑定样式配置器按钮
  $('#mobile_style_config_btn').on('click', function () {
    console.log('[Mobile Extension] 样式配置器按钮被点击');
    const container = $('#mobile_style_config_app_container');

    if (container.is(':visible')) {
      // 如果已经显示，则隐藏
      container.slideUp(300);
      $(this).text('🎨 打开样式配置器');
    } else {
      // 如果隐藏，则显示并加载内容
      if (typeof window.getStyleConfigAppContent === 'function') {
        try {
          const content = window.getStyleConfigAppContent();
          container.html(content);
          container.slideDown(300);
          $(this).text('🎨 关闭样式配置器');

          // 绑定事件
          setTimeout(() => {
            if (typeof window.bindStyleConfigEvents === 'function') {
              window.bindStyleConfigEvents();
              console.log('[Mobile Extension] 样式配置器事件绑定完成');
            }
          }, 100);
        } catch (error) {
          console.error('[Mobile Extension] 加载样式配置器失败:', error);
          toastr.error('加载样式配置器失败，请检查控制台');
        }
      } else {
        console.error('[Mobile Extension] 样式配置器未加载');
        toastr.error('样式配置器未加载，请确保相关文件已正确加载');
      }
    }
  });
}

/**
 * 绑定设置控件
 */
function bindSettingsControls() {
  // 启用/禁用监控
  $('#mobile_context_enabled')
    .prop('checked', extension_settings.mobile_context.enabled)
    .on('change', function () {
      extension_settings.mobile_context.enabled = $(this).prop('checked');
      saveSettings();

      if (contextMonitor) {
        if (extension_settings.mobile_context.enabled) {
          contextMonitor.start();
        } else {
          contextMonitor.stop();
        }
      }
    });

  // 监控聊天变化
  $('#mobile_context_monitor_chat')
    .prop('checked', extension_settings.mobile_context.monitorChat)
    .on('change', function () {
      extension_settings.mobile_context.monitorChat = $(this).prop('checked');
      saveSettings();

      if (contextMonitor) {
        contextMonitor.updateSettings(extension_settings.mobile_context);
      }
    });

  // 监控角色变化
  $('#mobile_context_monitor_character')
    .prop('checked', extension_settings.mobile_context.monitorCharacter)
    .on('change', function () {
      extension_settings.mobile_context.monitorCharacter = $(this).prop('checked');
      saveSettings();

      if (contextMonitor) {
        contextMonitor.updateSettings(extension_settings.mobile_context);
      }
    });

  // 监控系统事件
  $('#mobile_context_monitor_events')
    .prop('checked', extension_settings.mobile_context.monitorEvents)
    .on('change', function () {
      extension_settings.mobile_context.monitorEvents = $(this).prop('checked');
      saveSettings();

      if (contextMonitor) {
        contextMonitor.updateSettings(extension_settings.mobile_context);
      }
    });

  // 日志级别
  $('#mobile_context_log_level')
    .val(extension_settings.mobile_context.logLevel)
    .on('change', function () {
      extension_settings.mobile_context.logLevel = $(this).val();
      saveSettings();

      if (contextMonitor) {
        contextMonitor.updateSettings(extension_settings.mobile_context);
      }
    });

  // 最大日志条目
  $('#mobile_context_max_log_entries')
    .val(extension_settings.mobile_context.maxLogEntries)
    .on('change', function () {
      extension_settings.mobile_context.maxLogEntries = parseInt($(this).val());
      saveSettings();

      if (contextMonitor) {
        contextMonitor.updateSettings(extension_settings.mobile_context);
      }
    });

  // 上传功能启用/禁用
  $('#mobile_upload_enabled')
    .prop('checked', extension_settings.mobile_context.uploadEnabled)
    .on('change', function () {
      extension_settings.mobile_context.uploadEnabled = $(this).prop('checked');
      saveSettings();

      // 切换上传按钮显示/隐藏
      const uploadButton = document.getElementById('mobile-upload-trigger');
      if (uploadButton) {
        uploadButton.style.display = extension_settings.mobile_context.uploadEnabled ? 'flex' : 'none';
      }
    });

  // 上传通知启用/禁用
  $('#mobile_upload_notifications')
    .prop('checked', extension_settings.mobile_context.showUploadNotifications)
    .on('change', function () {
      extension_settings.mobile_context.showUploadNotifications = $(this).prop('checked');
      saveSettings();
    });

  // 上下文编辑器启用/禁用
  $('#mobile_context_editor_enabled')
    .prop('checked', extension_settings.mobile_context.contextEditorEnabled)
    .on('change', function () {
      extension_settings.mobile_context.contextEditorEnabled = $(this).prop('checked');
      saveSettings();

      // 切换上下文编辑器按钮显示/隐藏
      const editorButton = document.getElementById('mobile-context-editor-btn');
      if (editorButton) {
        editorButton.style.display = extension_settings.mobile_context.contextEditorEnabled ? 'flex' : 'none';
      }
    });

  // 自定义API配置启用/禁用
  $('#mobile_custom_api_enabled')
    .prop('checked', extension_settings.mobile_context.customAPIEnabled)
    .on('change', function () {
      extension_settings.mobile_context.customAPIEnabled = $(this).prop('checked');
      saveSettings();

      // 切换API配置按钮显示/隐藏
      const apiButton = document.getElementById('mobile-api-config-trigger');
      if (apiButton) {
        apiButton.style.display = extension_settings.mobile_context.customAPIEnabled ? 'flex' : 'none';
      }
    });

  // API配置按钮显示/隐藏
  $('#mobile_show_api_config_button')
    .prop('checked', extension_settings.mobile_context.showAPIConfigButton)
    .on('change', function () {
      extension_settings.mobile_context.showAPIConfigButton = $(this).prop('checked');
      saveSettings();

      // 切换API配置按钮显示/隐藏
      const apiButton = document.getElementById('mobile-api-config-trigger');
      if (apiButton) {
        apiButton.style.display =
          extension_settings.mobile_context.customAPIEnabled && extension_settings.mobile_context.showAPIConfigButton
            ? 'flex'
            : 'none';
      }
    });

  // 酒馆页面与手机控制兼容模式
  $('#mobile_tavern_compatibility_mode')
    .prop('checked', extension_settings.mobile_context.tavernCompatibilityMode)
    .on('change', function () {
      extension_settings.mobile_context.tavernCompatibilityMode = $(this).prop('checked');
      saveSettings();

      // 应用pointer-events设置
      updatePointerEventsSettings();
    });

  // 隐藏手机按钮
  $('#mobile_hide_phone')
    .prop('checked', extension_settings.mobile_context.hidePhone)
    .on('change', function () {
      extension_settings.mobile_context.hidePhone = $(this).prop('checked');
      saveSettings();

      // 应用隐藏设置
      updatePhoneVisibility();
    });

  // 按钮事件
  $('#mobile_context_status_btn').on('click', function () {
    if (contextMonitor) {
      contextMonitor.showStatus();
    }
  });

  $('#mobile_context_clear_btn').on('click', function () {
    if (contextMonitor) {
      contextMonitor.clearLogs();
    }
  });

  $('#mobile_upload_show_btn').on('click', function () {
    if (window.mobileUploadManager) {
      window.mobileUploadManager.showMobileUploadUI();
    } else {
      console.warn('[Mobile Context] 上传管理器未就绪');
    }
  });

  $('#mobile_context_editor_show_btn').on('click', function () {
    if (window.mobileContextEditor) {
      window.mobileContextEditor.showEditor();
    } else {
      console.warn('[Mobile Context] 上下文编辑器未就绪');
    }
  });

  $('#mobile_custom_api_show_btn').on('click', function () {
    if (window.mobileCustomAPIConfig) {
      window.mobileCustomAPIConfig.showConfigPanel();
    } else {
      console.warn('[Mobile Context] 自定义API配置模块未就绪');
    }
  });

  // MesID楼层监听器设置
  $('#mobile_mesid_floor_enabled')
    .prop('checked', extension_settings.mobile_context.mesidFloorEnabled)
    .on('change', function () {
      extension_settings.mobile_context.mesidFloorEnabled = $(this).prop('checked');
      saveSettings();

      if (window.mesidFloorMonitor) {
        if (extension_settings.mobile_context.mesidFloorEnabled) {
          window.mesidFloorMonitor.start();
        } else {
          window.mesidFloorMonitor.stop();
        }
      }
    });

  $('#mobile_enable_floor_notifications')
    .prop('checked', extension_settings.mobile_context.enableFloorNotifications)
    .on('change', function () {
      extension_settings.mobile_context.enableFloorNotifications = $(this).prop('checked');
      saveSettings();
    });

  $('#mobile_floor_selector')
    .val(extension_settings.mobile_context.floorSelector)
    .on('change', function () {
      extension_settings.mobile_context.floorSelector = $(this).val();
      saveSettings();

      if (window.mesidFloorMonitor) {
        window.mesidFloorMonitor.setFloorSelector(extension_settings.mobile_context.floorSelector);
      }
    });

  $('#mobile_mesid_floor_status_btn').on('click', function () {
    if (window.mesidFloorMonitor) {
      const status = window.mesidFloorMonitor.getStatus();
      const debugInfo = window.mesidFloorMonitor.getDebugInfo();
      console.log('[Mobile Context] MesID楼层监听器状态:', status);
      console.log('[Mobile Context] MesID楼层监听器调试信息:', debugInfo);
      alert(
        `MesID楼层监听器状态:\n监听中: ${status.isMonitoring}\n当前楼层数: ${status.currentFloorCount}\n上次楼层数: ${status.lastFloorCount}\n回调数量: ${status.callbacks.onFloorChanged}`,
      );
    } else {
      console.warn('[Mobile Context] MesID楼层监听器未就绪');
      alert('MesID楼层监听器未就绪');
    }
  });

  // 论坛管理器设置
  $('#mobile_forum_enabled')
    .prop('checked', extension_settings.mobile_context.forumEnabled)
    .on('change', function () {
      extension_settings.mobile_context.forumEnabled = $(this).prop('checked');
      saveSettings();

      // 切换论坛按钮显示/隐藏
      const forumButton = document.getElementById('mobile-forum-trigger');
      if (forumButton) {
        forumButton.style.display = extension_settings.mobile_context.forumEnabled ? 'flex' : 'none';
      }
    });

  $('#mobile_forum_auto_update')
    .prop('checked', extension_settings.mobile_context.forumAutoUpdate)
    .on('change', function () {
      extension_settings.mobile_context.forumAutoUpdate = $(this).prop('checked');
      saveSettings();

      if (window.forumManager) {
        window.forumManager.currentSettings.autoUpdate = extension_settings.mobile_context.forumAutoUpdate;
        window.forumManager.saveSettings();
      }
    });

  $('#mobile_forum_threshold')
    .val(extension_settings.mobile_context.forumThreshold)
    .on('change', function () {
      extension_settings.mobile_context.forumThreshold = parseInt($(this).val());
      saveSettings();

      if (window.forumManager) {
        window.forumManager.currentSettings.threshold = extension_settings.mobile_context.forumThreshold;
        window.forumManager.saveSettings();
      }
    });

  $('#mobile_forum_style')
    .val(extension_settings.mobile_context.forumStyle)
    .on('change', function () {
      extension_settings.mobile_context.forumStyle = $(this).val();
      saveSettings();

      if (window.forumManager) {
        window.forumManager.currentSettings.selectedStyle = extension_settings.mobile_context.forumStyle;
        window.forumManager.saveSettings();
      }
    });

  $('#mobile_forum_show_btn').on('click', function () {
    if (window.forumManager) {
      window.forumManager.showForumPanel();
    } else {
      console.warn('[Mobile Context] 论坛管理器未就绪');
    }
  });

  $('#mobile_forum_generate_btn').on('click', function () {
    if (window.forumManager) {
      window.forumManager.generateForumContent();
    } else {
      console.warn('[Mobile Context] 论坛管理器未就绪');
    }
  });

  // 消息自动发送功能启用/禁用
  $('#mobile_auto_send_enabled')
    .prop('checked', getAutoSendEnabled())
    .on('change', function () {
      const enabled = $(this).prop('checked');
      setAutoSendEnabled(enabled);
      console.log('[Mobile Context] 消息自动发送功能已', enabled ? '启用' : '禁用');
    });

  // 禁止正文功能启用/禁用
  $('#mobile_disable_body_text')
    .prop('checked', extension_settings.mobile_context.disableBodyText)
    .on('change', function () {
      extension_settings.mobile_context.disableBodyText = $(this).prop('checked');
      saveSettings();
      console.log('[Mobile Context] 禁止正文功能已', extension_settings.mobile_context.disableBodyText ? '启用' : '禁用');
    });
}

/**
 * 获取消息自动发送功能启用状态
 */
function getAutoSendEnabled() {
  if (window.messageSender && typeof window.messageSender.isDelayClickEnabled === 'function') {
    return window.messageSender.isDelayClickEnabled();
  }
  // 如果 MessageSender 还未初始化，从 localStorage 直接读取
  try {
    const settings = localStorage.getItem('messageSenderSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      // 如果明确设置了 delayClickEnabled，使用该值；否则默认为 true
      return parsed.delayClickEnabled === undefined ? true : parsed.delayClickEnabled;
    }
    return true; // 默认启用
  } catch (error) {
    console.warn('[Mobile Context] 获取消息自动发送设置失败:', error);
    return true; // 默认启用
  }
}

/**
 * 设置消息自动发送功能启用状态
 */
function setAutoSendEnabled(enabled) {
  if (window.messageSender && typeof window.messageSender.setDelayClickEnabled === 'function') {
    window.messageSender.setDelayClickEnabled(enabled);
  } else {
    // 如果 MessageSender 还未初始化，直接写入 localStorage
    try {
      let settings = {};
      const existing = localStorage.getItem('messageSenderSettings');
      if (existing) {
        settings = JSON.parse(existing);
      }
      settings.delayClickEnabled = enabled;
      localStorage.setItem('messageSenderSettings', JSON.stringify(settings));
      console.log('[Mobile Context] 消息自动发送设置已保存:', enabled);
    } catch (error) {
      console.error('[Mobile Context] 保存消息自动发送设置失败:', error);
    }
  }
}

/**
 * 保存设置
 */
function saveSettings() {
  try {
    const context = SillyTavern.getContext();
    if (context && context.saveSettingsDebounced) {
      context.saveSettingsDebounced();
    } else if (window.saveSettingsDebounced) {
      window.saveSettingsDebounced();
    }
  } catch (error) {
    console.warn('[Mobile Context] 保存设置失败:', error);
    // 回退到旧的保存方式
    if (window.saveSettingsDebounced) {
      window.saveSettingsDebounced();
    }
  }
}

/**
 * 注册控制台命令
 */
function registerConsoleCommands() {
  // 将命令注册到全局对象
  if (!window.MobileContext) {
    window.MobileContext = {};
  }

  // 获取当前上下文
  window.MobileContext.getContext = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    return contextMonitor.getCurrentContext();
  };

  // 获取上下文历史
  window.MobileContext.getHistory = function (limit = 10) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return [];
    }
    return contextMonitor.getHistory(limit);
  };

  // 获取统计信息
  window.MobileContext.getStats = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    return contextMonitor.getStats();
  };

  // 显示状态
  window.MobileContext.showStatus = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    contextMonitor.showStatus();
  };

  // 开始监控
  window.MobileContext.start = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    contextMonitor.start();
  };

  // 停止监控
  window.MobileContext.stop = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    contextMonitor.stop();
  };

  // 获取当前聊天的 JSONL 数据
  window.MobileContext.getChatJsonl = async function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    return await contextMonitor.getCurrentChatJsonl();
  };

  // 获取当前聊天的消息数组
  window.MobileContext.getChatMessages = async function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    return await contextMonitor.getCurrentChatMessages();
  };

  // 一键下载当前聊天的 JSONL 文件
  window.MobileContext.downloadChatJsonl = async function () {
    try {
      const chatData = await window.MobileContext.getChatJsonl();
      if (!chatData) {
        console.error('[Mobile Context] 无法获取聊天数据');
        return;
      }

      const blob = new Blob([chatData.jsonlData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chatData.chatId}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`[Mobile Context] 已下载聊天文件: ${a.download}`);
    } catch (error) {
      console.error('[Mobile Context] 下载失败:', error);
    }
  };

  // 设置日志级别
  window.MobileContext.setLogLevel = function (level) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    contextMonitor.setLogLevel(level);
  };

  // 清除日志
  window.MobileContext.clearLogs = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    contextMonitor.clearLogs();
  };

  // ===========================================
  // 数据提取器控制台命令
  // ===========================================

  // 列出所有可用的提取格式
  window.MobileContext.listFormats = function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }
    return contextMonitor.listExtractorFormats();
  };

  // 从当前聊天消息中提取数据
  window.MobileContext.extractFromChat = async function (formatName) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    if (!formatName) {
      console.warn('[Mobile Context] 请指定格式名称，使用 MobileContext.listFormats() 查看可用格式');
      return null;
    }
    return await contextMonitor.extractFromCurrentChat(formatName);
  };

  // 从当前聊天JSONL中提取数据
  window.MobileContext.extractFromJsonl = async function (formatName) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return null;
    }
    if (!formatName) {
      console.warn('[Mobile Context] 请指定格式名称，使用 MobileContext.listFormats() 查看可用格式');
      return null;
    }
    return await contextMonitor.extractFromCurrentChatJsonl(formatName);
  };

  // 从文本中提取数据（手动测试用）
  window.MobileContext.extractFromText = function (text, formatName) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return [];
    }
    if (!text || !formatName) {
      console.warn('[Mobile Context] 请指定文本和格式名称');
      return [];
    }
    return contextMonitor.extractDataFromText(text, formatName);
  };

  // 添加自定义提取格式
  window.MobileContext.addFormat = function (name, regex, fields, description) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return false;
    }
    if (!name || !regex || !fields) {
      console.warn('[Mobile Context] 用法: MobileContext.addFormat(name, regex, fields, description)');
      console.log(
        "示例: MobileContext.addFormat('test', /\\[测试\\|([^|]*)\\|([^|]*)\\|([^|]*)\\|([^\\]]*)\\]/g, ['character', 'number', 'type', 'content'], '测试格式')",
      );
      return false;
    }

    const format = {
      regex: regex,
      fields: Array.isArray(fields) ? fields : [fields],
      description: description,
    };

    return contextMonitor.addExtractorFormat(name, format);
  };

  // 快速提取
  window.MobileContext.quickExtract = async function (formatName, useJsonl = false) {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }

    console.log(`[Mobile Context] 开始从${useJsonl ? 'JSONL' : '聊天消息'}中提取 ${formatName} 格式数据...`);

    const result = useJsonl
      ? await window.MobileContext.extractFromJsonl(formatName)
      : await window.MobileContext.extractFromChat(formatName);

    if (result && result.extractedCount > 0) {
      console.log(`[Mobile Context] 提取成功! 找到 ${result.extractedCount} 条数据`);
      console.log('提取结果:', result);
      return result;
    } else {
      console.log('[Mobile Context] 未找到匹配的数据');
      return null;
    }
  };

  // 调试函数 - 测试聊天数据获取
  window.MobileContext.debugChatData = async function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }

    console.group('=== 聊天数据调试信息 ===');

    // 检查 SillyTavern 上下文
    console.log('1. SillyTavern 全局对象:', window.SillyTavern);

    const context = window.SillyTavern?.getContext();
    console.log('2. SillyTavern 上下文:', context);

    if (context) {
      console.log('3. 当前聊天ID:', context.getCurrentChatId?.());
      console.log('4. 角色ID:', context.characterId);
      console.log('5. 群组ID:', context.groupId);
      console.log('6. 角色数组:', context.characters);

      if (context.characterId && context.characters) {
        const char = context.characters[context.characterId];
        console.log('7. 当前角色:', char);
      }
    }

    // 测试全局变量
    console.log('8. 全局 chat 变量:', window.chat);
    console.log('9. 全局 this_chid 变量:', window.this_chid);
    console.log('10. 全局 characters 变量:', window.characters);

    // 测试 API 调用
    try {
      const chatData = await contextMonitor.getCurrentChatMessages();
      console.log('11. API 调用结果:', chatData);
    } catch (error) {
      console.error('12. API 调用错误:', error);
    }

    console.groupEnd();
  };

  // 调试 JSONL 数据内容
  window.MobileContext.debugJsonlData = async function () {
    if (!contextMonitor) {
      console.warn('[Mobile Context] 监控器未初始化');
      return;
    }

    console.group('=== JSONL 数据调试 ===');

    try {
      const jsonlData = await contextMonitor.getCurrentChatJsonl();
      console.log('JSONL 数据:', jsonlData);

      if (jsonlData && jsonlData.lines) {
        console.log(`总行数: ${jsonlData.lines.length}`);
        jsonlData.lines.forEach((line, index) => {
          console.log(`第 ${index + 1} 行:`, line);
          try {
            const parsed = JSON.parse(line);
            console.log(`解析后:`, parsed);
            if (parsed.mes) {
              console.log(`消息内容: "${parsed.mes}"`);
              // 测试提取
              const myResult = contextMonitor.extractDataFromText(parsed.mes, 'myMessage');
              const otherResult = contextMonitor.extractDataFromText(parsed.mes, 'otherMessage');
              const universalResult = contextMonitor.extractDataFromText(parsed.mes, 'universalMessage');
              if (myResult.length > 0) {
                console.log(`✅ 我方消息匹配:`, myResult);
              }
              if (otherResult.length > 0) {
                console.log(`✅ 对方消息匹配:`, otherResult);
              }
              if (universalResult.length > 0) {
                console.log(`✅ 通用消息匹配:`, universalResult);
              }
            }
          } catch (e) {
            console.error(`解析第 ${index + 1} 行失败:`, e);
          }
          console.log('---');
        });
      }
    } catch (error) {
      console.error('获取 JSONL 数据失败:', error);
    }

    console.groupEnd();
  };

  // ===========================================
  // 上下文编辑器控制台命令
  // ===========================================

  // 显示上下文编辑器
  window.MobileContext.showContextEditor = function () {
    if (window.mobileContextEditor && typeof window.mobileContextEditor.showEditor === 'function') {
      window.mobileContextEditor.showEditor();
    } else {
      console.warn('[Mobile Context] 上下文编辑器未初始化或方法不存在');
      console.log('[Mobile Context] 编辑器状态:', {
        exists: !!window.mobileContextEditor,
        hasMethod: !!(window.mobileContextEditor && window.mobileContextEditor.showEditor),
      });
    }
  };

  // 强制启动编辑器（即使SillyTavern未就绪）
  window.MobileContext.forceShowEditor = function () {
    if (window.mobileContextEditor) {
      const success = window.mobileContextEditor.forceInitialize();
      if (success) {
        console.log('[Mobile Context] ✅ 强制启动编辑器成功');
      } else {
        console.error('[Mobile Context] ❌ 强制启动编辑器失败');
      }
    } else {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
    }
  };

  // 加载当前聊天到编辑器（使用v2.0 API）
  window.MobileContext.loadChatToEditor = function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }

    try {
      return window.mobileContextEditor.getCurrentChatData();
    } catch (error) {
      console.error('[Mobile Context] 加载聊天数据失败:', error);
      return null;
    }
  };

  // 修改消息内容（使用v2.0 API）
  window.MobileContext.modifyMessage = async function (messageIndex, newContent, newName = null) {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return false;
    }
    try {
      return await window.mobileContextEditor.modifyMessage(messageIndex, newContent, newName);
    } catch (error) {
      console.error('[Mobile Context] 修改消息失败:', error);
      return false;
    }
  };

  // 添加新消息（使用v2.0 API）
  window.MobileContext.addMessage = async function (content, isUser = false, name = null) {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return -1;
    }
    try {
      return await window.mobileContextEditor.addMessage(content, isUser, name);
    } catch (error) {
      console.error('[Mobile Context] 添加消息失败:', error);
      return -1;
    }
  };

  // 删除消息（使用v2.0 API）
  window.MobileContext.deleteMessage = async function (messageIndex) {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }
    try {
      return await window.mobileContextEditor.deleteMessage(messageIndex);
    } catch (error) {
      console.error('[Mobile Context] 删除消息失败:', error);
      return null;
    }
  };

  // 保存编辑后的聊天数据（使用v2.0 API）
  window.MobileContext.saveEditedChat = async function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return false;
    }
    try {
      return await window.mobileContextEditor.saveChatData();
    } catch (error) {
      console.error('[Mobile Context] 保存失败:', error);
      return false;
    }
  };

  // 刷新聊天界面（替代重置功能）
  window.MobileContext.refreshChatDisplay = async function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return false;
    }
    try {
      return await window.mobileContextEditor.refreshChatDisplay();
    } catch (error) {
      console.error('[Mobile Context] 刷新界面失败:', error);
      return false;
    }
  };

  // 导出编辑后的JSONL（使用v2.0 API）
  window.MobileContext.exportEditedJsonl = function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }
    try {
      return window.mobileContextEditor.exportToJsonl();
    } catch (error) {
      console.error('[Mobile Context] 导出失败:', error);
      return null;
    }
  };

  // 获取编辑器统计信息（使用v2.0 API）
  window.MobileContext.getEditorStats = function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }
    return window.mobileContextEditor.getStatistics();
  };

  // 调试SillyTavern状态（使用v2.0 API）
  window.MobileContext.debugSillyTavernStatus = function () {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }
    return window.mobileContextEditor.debugSillyTavernStatus();
  };

  // 等待SillyTavern准备就绪（使用v2.0 API）
  window.MobileContext.waitForSillyTavernReady = async function (timeout = 30000) {
    if (!window.mobileContextEditor) {
      console.warn('[Mobile Context] 上下文编辑器未初始化');
      return false;
    }
    return await window.mobileContextEditor.waitForSillyTavernReady(timeout);
  };

  // ===========================================
  // 自定义API配置控制台命令
  // ===========================================

  // 显示API配置面板
  window.MobileContext.showAPIConfig = function () {
    if (window.mobileCustomAPIConfig && typeof window.mobileCustomAPIConfig.showConfigPanel === 'function') {
      window.mobileCustomAPIConfig.showConfigPanel();
    } else {
      console.warn('[Mobile Context] 自定义API配置模块未初始化或方法不存在');
      console.log('[Mobile Context] API配置状态:', {
        exists: !!window.mobileCustomAPIConfig,
        hasMethod: !!(window.mobileCustomAPIConfig && window.mobileCustomAPIConfig.showConfigPanel),
      });
    }
  };

  // 获取当前API配置
  window.MobileContext.getAPIConfig = function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return null;
    }
    return window.mobileCustomAPIConfig.getCurrentConfig();
  };

  // 检查API是否可用
  window.MobileContext.isAPIAvailable = function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return false;
    }
    return window.mobileCustomAPIConfig.isAPIAvailable();
  };

  // 测试API连接
  window.MobileContext.testAPIConnection = async function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return false;
    }
    try {
      await window.mobileCustomAPIConfig.testConnection();
      return true;
    } catch (error) {
      console.error('[Mobile Context] API连接测试失败:', error);
      return false;
    }
  };

  // 调用自定义API
  window.MobileContext.callCustomAPI = async function (messages, options = {}) {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return null;
    }
    try {
      return await window.mobileCustomAPIConfig.callAPI(messages, options);
    } catch (error) {
      console.error('[Mobile Context] 自定义API调用失败:', error);
      return null;
    }
  };

  // 获取支持的API服务商列表
  window.MobileContext.getSupportedProviders = function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return null;
    }
    return Object.keys(window.mobileCustomAPIConfig.supportedProviders);
  };

  // 获取API调试信息
  window.MobileContext.getAPIDebugInfo = function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return null;
    }
    return window.mobileCustomAPIConfig.getDebugInfo();
  };

  // 快速设置API配置
  window.MobileContext.quickSetupAPI = function (apiUrl, apiKey, model) {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return false;
    }

    if (!apiUrl || !model) {
      console.warn('[Mobile Context] 用法: MobileContext.quickSetupAPI(apiUrl, apiKey, model)');
      console.log("示例: MobileContext.quickSetupAPI('https://api.openai.com', 'sk-xxx', 'gpt-4o')");
      console.log("示例: MobileContext.quickSetupAPI('https://浅浅超级空间站.ndvfp.cn', 'sk-xxx', 'gpt-4o')");
      return false;
    }

    try {
      window.mobileCustomAPIConfig.currentSettings = {
        ...window.mobileCustomAPIConfig.currentSettings,
        enabled: true,
        provider: 'custom', // 固定使用custom
        apiUrl: apiUrl,
        apiKey: apiKey || '',
        model: model,
      };

      window.mobileCustomAPIConfig.saveSettings();
      console.log('[Mobile Context] ✅ API配置已更新');
      return true;
    } catch (error) {
      console.error('[Mobile Context] 快速设置失败:', error);
      return false;
    }
  };

  // 调试API配置状态
  window.MobileContext.debugAPIConfig = function () {
    if (!window.mobileCustomAPIConfig) {
      console.warn('[Mobile Context] 自定义API配置模块未初始化');
      return;
    }
    window.mobileCustomAPIConfig.debugConfig();
  };

  // 调试所有模块加载状态
  window.MobileContext.debugModuleStatus = function () {
    console.group('=== Mobile Context 模块状态 ===');

    // 检查基础模块
    console.log('1. 基础插件:', {
      pluginInitialized: isInitialized,
      contextMonitor: !!contextMonitor,
      extensionSettings: !!extension_settings,
    });

    // 检查上下文监控器
    console.log('2. 上下文监控器:', {
      exists: !!window.ContextMonitor,
      instance: !!contextMonitor,
      running: contextMonitor ? contextMonitor.isRunning() : false,
    });

    // 检查上传管理器
    console.log('3. 上传管理器:', {
      exists: !!window.mobileUploadManager,
      hasToggleUI: !!(window.mobileUploadManager && window.mobileUploadManager.toggleMobileUploadUI),
      hasShowUI: !!(window.mobileUploadManager && window.mobileUploadManager.showMobileUploadUI),
    });

    // 检查上下文编辑器
    console.log('4. 上下文编辑器:', {
      exists: !!window.mobileContextEditor,
      hasShowEditor: !!(window.mobileContextEditor && window.mobileContextEditor.showEditor),
      hasForceInit: !!(window.mobileContextEditor && window.mobileContextEditor.forceInitialize),
    });

    // 检查自定义API配置
    console.log('5. 自定义API配置:', {
      exists: !!window.mobileCustomAPIConfig,
      hasShowPanel: !!(window.mobileCustomAPIConfig && window.mobileCustomAPIConfig.showConfigPanel),
      hasGetConfig: !!(window.mobileCustomAPIConfig && window.mobileCustomAPIConfig.getCurrentConfig),
    });

    // 检查MesID楼层监听器
    console.log('6. MesID楼层监听器:', {
      exists: !!window.mesidFloorMonitor,
      hasStart: !!(window.mesidFloorMonitor && window.mesidFloorMonitor.start),
      hasStop: !!(window.mesidFloorMonitor && window.mesidFloorMonitor.stop),
      hasGetStatus: !!(window.mesidFloorMonitor && window.mesidFloorMonitor.getStatus),
      isMonitoring: window.mesidFloorMonitor ? window.mesidFloorMonitor.getStatus().isMonitoring : false,
    });

    // 检查控制台命令
    console.log('7. 控制台命令:', {
      MobileContext: !!window.MobileContext,
      showContextEditor: !!(window.MobileContext && window.MobileContext.showContextEditor),
      showAPIConfig: !!(window.MobileContext && window.MobileContext.showAPIConfig),
      debugModuleStatus: !!(window.MobileContext && window.MobileContext.debugModuleStatus),
    });

    // 检查UI元素
    console.log('8. UI元素:', {
      phoneButton: !!document.getElementById('mobile-phone-trigger'),
      uploadButton: !!document.getElementById('mobile-upload-trigger'),
      contextEditorButton: !!document.getElementById('mobile-context-editor-btn'),
      apiConfigButton: !!document.getElementById('mobile-api-config-trigger'),
    });

    console.groupEnd();
  };

  // 智能加载聊天（使用v2.0 API - 简化版）
  window.MobileContext.smartLoadChat = async function () {
    console.log('[Mobile Context] 开始智能加载聊天（v2.0）...');

    if (!window.mobileContextEditor) {
      console.error('[Mobile Context] 上下文编辑器未初始化');
      return null;
    }

    // 先检查状态
    const status = window.MobileContext.debugSillyTavernStatus();
    if (!status || !status.ready) {
      console.log('[Mobile Context] SillyTavern未准备就绪，等待中...');
      const isReady = await window.MobileContext.waitForSillyTavernReady();
      if (!isReady) {
        console.error('[Mobile Context] 等待超时，请检查SillyTavern状态');
        return null;
      }
    }

    // 直接加载聊天数据
    try {
      const chatData = window.MobileContext.loadChatToEditor();
      if (chatData) {
        console.log(
          `[Mobile Context] ✅ 聊天加载成功！共 ${chatData.messages.length} 条消息 (${chatData.characterName})`,
        );
        return chatData;
      } else {
        console.error('[Mobile Context] 无法获取聊天数据');
        return null;
      }
    } catch (error) {
      console.error('[Mobile Context] 加载失败:', error);
      return null;
    }
  };

  // ===========================================
  // MesID楼层监听器控制台命令
  // ===========================================

  // 开始监听楼层变化
  window.MobileContext.startFloorMonitor = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    window.mesidFloorMonitor.start();
    return true;
  };

  // 停止监听楼层变化
  window.MobileContext.stopFloorMonitor = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    window.mesidFloorMonitor.stop();
    return true;
  };

  // 获取楼层监听器状态
  window.MobileContext.getFloorStatus = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return null;
    }
    return window.mesidFloorMonitor.getStatus();
  };

  // 获取楼层监听器调试信息
  window.MobileContext.getFloorDebugInfo = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return null;
    }
    return window.mesidFloorMonitor.getDebugInfo();
  };

  // 强制检查楼层变化
  window.MobileContext.forceCheckFloor = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    window.mesidFloorMonitor.forceCheck();
    return true;
  };

  // 设置楼层选择器
  window.MobileContext.setFloorSelector = function (selector) {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    if (!selector) {
      console.warn('[Mobile Context] 请提供有效的选择器');
      return false;
    }
    window.mesidFloorMonitor.setFloorSelector(selector);
    return true;
  };

  // 添加楼层变化监听器
  window.MobileContext.addFloorListener = function (eventType, callback) {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    if (!eventType || !callback) {
      console.warn("[Mobile Context] 用法: MobileContext.addFloorListener('onFloorChanged', function(data) { ... })");
      console.log('可用事件类型: onFloorAdded, onFloorRemoved, onFloorChanged');
      return false;
    }
    return window.mesidFloorMonitor.addEventListener(eventType, callback);
  };

  // 移除楼层变化监听器
  window.MobileContext.removeFloorListener = function (eventType, callback) {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }
    if (!eventType || !callback) {
      console.warn("[Mobile Context] 用法: MobileContext.removeFloorListener('onFloorChanged', callbackFunction)");
      return false;
    }
    return window.mesidFloorMonitor.removeEventListener(eventType, callback);
  };

  // 快速设置楼层监听器
  window.MobileContext.quickSetupFloorMonitor = function (floorSelector = '.message') {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }

    // 设置选择器
    window.mesidFloorMonitor.setFloorSelector(floorSelector);

    // 添加默认监听器
    window.mesidFloorMonitor.addEventListener('onFloorAdded', function (data) {
      console.log(`[楼层监听器] 🟢 楼层增加: ${data.oldCount} -> ${data.newCount} (+${data.change})`);
      if (extension_settings.mobile_context.enableFloorNotifications) {
        // 可以在这里添加通知逻辑
      }
    });

    window.mesidFloorMonitor.addEventListener('onFloorRemoved', function (data) {
      console.log(`[楼层监听器] 🔴 楼层减少: ${data.oldCount} -> ${data.newCount} (${data.change})`);
      if (extension_settings.mobile_context.enableFloorNotifications) {
        // 可以在这里添加通知逻辑
      }
    });

    window.mesidFloorMonitor.addEventListener('onFloorChanged', function (data) {
      console.log(
        `[楼层监听器] 🔄 楼层变化: ${data.oldCount} -> ${data.newCount} (${data.change > 0 ? '+' : ''}${data.change})`,
      );
    });

    // 开始监听
    window.mesidFloorMonitor.start();

    console.log(`[Mobile Context] ✅ 楼层监听器已快速设置完成 (选择器: ${floorSelector})`);
    return true;
  };

  // 测试楼层监听器
  window.MobileContext.testFloorMonitor = function () {
    if (!window.mesidFloorMonitor) {
      console.warn('[Mobile Context] MesID楼层监听器未初始化');
      return false;
    }

    console.group('=== MesID楼层监听器测试 ===');

    // 检查元素是否存在
    const mesidElement = document.querySelector('[mesid="1"]');
    console.log('1. MesID元素:', mesidElement);

    if (mesidElement) {
      console.log('2. MesID元素HTML:', mesidElement.innerHTML.slice(0, 200) + '...');
      console.log('3. MesID元素子元素数量:', mesidElement.children.length);

      // 测试选择器
      const floors = mesidElement.querySelectorAll('.message');
      console.log('4. 使用.message选择器找到的楼层:', floors.length);

      // 尝试其他可能的选择器
      const divs = mesidElement.querySelectorAll('div');
      console.log('5. 使用div选择器找到的元素:', divs.length);

      const allChildren = mesidElement.children;
      console.log('6. 直接子元素:', allChildren.length);
    }

    // 检查监听器状态
    const status = window.mesidFloorMonitor.getStatus();
    console.log('7. 监听器状态:', status);

    // 强制检查
    window.mesidFloorMonitor.forceCheck();

    console.groupEnd();
    return true;
  };

  console.log('[Mobile Context] 控制台命令已注册:');
  console.log('=== 基础功能 ===');
  console.log('  MobileContext.getContext()     - 获取当前上下文');
  console.log('  MobileContext.getHistory()     - 获取上下文历史');
  console.log('  MobileContext.getStats()       - 获取统计信息');
  console.log('  MobileContext.showStatus()     - 显示状态信息');
  console.log('  MobileContext.start()          - 开始监控');
  console.log('  MobileContext.stop()           - 停止监控');
  console.log('  MobileContext.setLogLevel(level) - 设置日志级别');
  console.log('  MobileContext.clearLogs()      - 清除日志');
  console.log('');
  console.log('=== 聊天数据 ===');
  console.log('  MobileContext.getChatJsonl()   - 获取聊天JSONL数据');
  console.log('  MobileContext.getChatMessages() - 获取聊天消息数组');
  console.log('  MobileContext.downloadChatJsonl() - 下载JSONL文件');
  console.log('');
  console.log('=== 数据提取器 ===');
  console.log('  MobileContext.listFormats()    - 列出所有可用格式');
  console.log('  MobileContext.extractFromChat(formatName) - 从聊天消息中提取');
  console.log('  MobileContext.extractFromJsonl(formatName) - 从JSONL中提取');
  console.log('  MobileContext.extractFromText(text, formatName) - 从文本中提取');
  console.log('  MobileContext.addFormat(name, regex, fields, desc) - 添加自定义格式');
  console.log('  MobileContext.quickExtract(formatName, useJsonl) - 快速提取');
  console.log('');
  console.log('=== 调试工具 ===');
  console.log('  MobileContext.debugChatData()   - 调试聊天数据获取');
  console.log('  MobileContext.debugJsonlData()  - 调试JSONL数据内容');
  console.log('  MobileContext.testExtraction()  - 测试文本提取功能');
  console.log('');
  console.log('=== 上下文编辑器 v2.0 (新API) ===');
  console.log('  MobileContext.showContextEditor() - 显示上下文编辑器界面');
  console.log('  MobileContext.forceShowEditor()   - 强制启动编辑器即使SillyTavern未就绪');
  console.log('  MobileContext.loadChatToEditor() - 加载当前聊天到编辑器使用SillyTavern.getContext()');
  console.log('  MobileContext.smartLoadChat()    - 智能加载聊天自动等待SillyTavern准备');
  console.log('  MobileContext.modifyMessage(index, content, name) - 修改消息异步使用新API');
  console.log('  MobileContext.addMessage(content, isUser, name) - 添加新消息异步使用新API');
  console.log('  MobileContext.deleteMessage(index) - 删除消息异步使用新API');
  console.log('  MobileContext.saveEditedChat()   - 保存编辑后的聊天使用context.saveChat()');
  console.log('  MobileContext.refreshChatDisplay() - 刷新聊天界面使用context.reloadCurrentChat()');
  console.log('  MobileContext.exportEditedJsonl() - 导出编辑后的JSONL');
  console.log('  MobileContext.getEditorStats()   - 获取编辑器统计信息');
  console.log('');
  console.log('=== 编辑器调试工具 v2.0 (新API) ===');
  console.log('  MobileContext.debugSillyTavernStatus() - 检查SillyTavern状态14项检查使用新API');
  console.log('  MobileContext.waitForSillyTavernReady(timeout) - 等待SillyTavern准备就绪30秒超时');
  console.log('');
  console.log('=== 自定义API配置 ===');
  console.log('  MobileContext.showAPIConfig()     - 显示API配置面板');
  console.log('  MobileContext.getAPIConfig()      - 获取当前API配置');
  console.log('  MobileContext.isAPIAvailable()    - 检查API是否可用');
  console.log('  MobileContext.testAPIConnection() - 测试API连接');
  console.log('  MobileContext.callCustomAPI(messages, options) - 调用自定义API');
  console.log('  MobileContext.getSupportedProviders() - 获取支持的API服务商列表');
  console.log('  MobileContext.getAPIDebugInfo()   - 获取API调试信息');
  console.log('  MobileContext.quickSetupAPI(url, key, model) - 快速设置API配置');
  console.log('  MobileContext.debugAPIConfig()    - 调试API配置状态');
  console.log('  MobileContext.debugModuleStatus() - 调试所有模块加载状态');
  console.log('');

  console.log('=== 上下文编辑器快速开始 v2.0 (新API) ===');
  console.log('方式一（推荐 - 等待完全加载）：');
  console.log('1. MobileContext.debugSillyTavernStatus()  // 检查SillyTavern状态使用新API');
  console.log('2. MobileContext.smartLoadChat()     // 智能加载聊天使用SillyTavern.getContext()');
  console.log('3. MobileContext.showContextEditor()  // 打开编辑器界面');
  console.log('');
  console.log('方式二（立即使用 - 如果SillyTavern正在加载');
  console.log('1. MobileContext.forceShowEditor()    // 立即强制启动编辑器');
  console.log('2. 在编辑器中点击"重新检查"或等待自动重试');
  console.log('3. MobileContext.showContextEditor()  // 打开编辑器界面');
  console.log("4. await MobileContext.modifyMessage(0, '新内容')  // 修改第0条消息使用context.saveChat()");
  console.log("5. await MobileContext.addMessage('新消息', true)  // 添加用户消息使用context.addOneMessage()");
  console.log('6. await MobileContext.saveEditedChat()    // 保存所有修改使用context.saveChat()');
  console.log('7. MobileContext.exportEditedJsonl()  // 导出JSONL文件');
  console.log('');
  console.log('注意v2.0使用SillyTavern.getContext()API修改会立即保存并更新界面');
  console.log('');
  console.log('=== 自定义API配置快速开始 ===');
  console.log('方式一（图形界面）：');
  console.log('1. 点击右侧🔧按钮打开API配置面板');
  console.log('2. 填写自定义API URL如https://api.openai.com 或 https://浅浅超级空间站.ndvfp.cn');
  console.log('3. 填写API密钥');
  console.log('4. 点击📥按钮获取模型列表');
  console.log('5. 选择模型');
  console.log('6. 点击🧪测试连接验证配置');
  console.log('7. 点击💾保存配置完成设置');
  console.log('');
  console.log('方式二（控制台命令）：');
  console.log("1. MobileContext.quickSetupAPI('https://api.openai.com', 'sk-xxx', 'gpt-4o')");
  console.log("   或 MobileContext.quickSetupAPI('https://浅浅超级空间站.ndvfp.cn', 'sk-xxx', 'gpt-4o')");
  console.log('2. MobileContext.testAPIConnection()  // 测试连接');
  console.log("3. MobileContext.callCustomAPI([{role: 'user', content: '你好'}])  // 调用API");
  console.log('');
  console.log('调试命令：');
  console.log('  MobileContext.debugModuleStatus()  // 检查所有模块加载状态（推荐首先运行）');
  console.log('  MobileContext.debugAPIConfig()     // 查看当前配置状态和问题诊断');
  console.log('  MobileContext.getAPIDebugInfo()    // 获取详细调试信息');
  console.log('');
  console.log('如果命令无法使用请先运行MobileContext.debugModuleStatus()');
  console.log('注意现在只支持OpenAI兼容的自定义API使用Bearer认证和/v1/models端点');
  console.log('');
  console.log('=== MesID楼层监听器 ===');
  console.log('  MobileContext.startFloorMonitor()   - 开始监听楼层变化');
  console.log('  MobileContext.stopFloorMonitor()    - 停止监听楼层变化');
  console.log('  MobileContext.getFloorStatus()      - 获取楼层监听器状态');
  console.log('  MobileContext.getFloorDebugInfo()   - 获取楼层监听器调试信息');
  console.log('  MobileContext.forceCheckFloor()     - 强制检查楼层变化');
  console.log('  MobileContext.setFloorSelector(selector) - 设置楼层选择器');
  console.log('  MobileContext.addFloorListener(eventType, callback) - 添加楼层变化监听器');
  console.log('  MobileContext.removeFloorListener(eventType, callback) - 移除楼层变化监听器');
  console.log('  MobileContext.quickSetupFloorMonitor(selector) - 快速设置楼层监听器');
  console.log('  MobileContext.testFloorMonitor()    - 测试楼层监听器');
  console.log('');
  console.log('=== MesID楼层监听器快速开始 ===');
  console.log('方式一（快速设置）：');
  console.log("1. MobileContext.quickSetupFloorMonitor('.message')  // 使用.message选择器快速设置");
  console.log('2. MobileContext.testFloorMonitor()   // 测试监听器是否正常工作');
  console.log('');
  console.log('方式二（手动设置）：');
  console.log("1. MobileContext.setFloorSelector('.message')  // 设置楼层选择器");
  console.log("2. MobileContext.addFloorListener('onFloorChanged', function(data) {");
  console.log("     console.log('楼层变化:', data.oldCount, '->', data.newCount);");
  console.log('   });');
  console.log('3. MobileContext.startFloorMonitor()  // 开始监听');
  console.log('');
  console.log('调试命令：');
  console.log('  MobileContext.testFloorMonitor()    // 测试楼层监听器并显示详细信息');
  console.log('  MobileContext.getFloorDebugInfo()   // 获取调试信息');
  console.log('  MobileContext.getFloorStatus()      // 查看当前状态');
  console.log('');
  console.log('事件类型onFloorAdded, onFloorRemoved, onFloorChanged');
  console.log('注意：楼层监听器会自动监听 mesid="1" 元素的变化');

  // ===========================================
  // 论坛管理器控制台命令
  // ===========================================

  // 显示论坛管理面板
  window.MobileContext.showForumPanel = function () {
    if (window.forumManager && typeof window.forumManager.showForumPanel === 'function') {
      window.forumManager.showForumPanel();
    } else {
      console.warn('[Mobile Context] 论坛管理器未初始化或方法不存在');
    }
  };

  // 生成论坛内容
  window.MobileContext.generateForum = function () {
    if (window.forumManager && typeof window.forumManager.generateForumContent === 'function') {
      window.forumManager.generateForumContent();
    } else {
      console.warn('[Mobile Context] 论坛管理器未初始化或方法不存在');
    }
  };

  // 清除论坛内容
  window.MobileContext.clearForum = function () {
    if (window.forumManager && typeof window.forumManager.clearForumContent === 'function') {
      window.forumManager.clearForumContent();
    } else {
      console.warn('[Mobile Context] 论坛管理器未初始化或方法不存在');
    }
  };

  // 获取论坛状态
  window.MobileContext.getForumStatus = function () {
    if (!window.forumManager) {
      console.warn('[Mobile Context] 论坛管理器未初始化');
      return null;
    }
    return {
      isInitialized: window.forumManager.isInitialized,
      isProcessing: window.forumManager.isProcessing,
      settings: window.forumManager.currentSettings,
      lastProcessedCount: window.forumManager.lastProcessedCount,
    };
  };

  // 设置论坛风格
  window.MobileContext.setForumStyle = function (styleName) {
    if (!window.forumManager) {
      console.warn('[Mobile Context] 论坛管理器未初始化');
      return false;
    }
    if (!styleName) {
      console.warn('[Mobile Context] 请提供风格名称');
      console.log(
        '可用风格:',
        window.forumStyles
          ? window.forumStyles.getAvailableStyles()
          : ['贴吧老哥', '知乎精英', '小红书种草', '抖音达人', 'B站UP主', '海角老司机', '八卦小报记者', '天涯老涯友'],
      );
      return false;
    }
    window.forumManager.currentSettings.selectedStyle = styleName;
    window.forumManager.saveSettings();
    return true;
  };

  // 设置论坛阈值
  window.MobileContext.setForumThreshold = function (threshold) {
    if (!window.forumManager) {
      console.warn('[Mobile Context] 论坛管理器未初始化');
      return false;
    }
    if (typeof threshold !== 'number' || threshold < 1) {
      console.warn('[Mobile Context] 请提供有效的阈值（大于0的整数）');
      return false;
    }
    window.forumManager.currentSettings.threshold = threshold;
    window.forumManager.saveSettings();
    return true;
  };

  // 切换论坛自动更新
  window.MobileContext.toggleForumAutoUpdate = function () {
    if (!window.forumManager) {
      console.warn('[Mobile Context] 论坛管理器未初始化');
      return false;
    }
    window.forumManager.currentSettings.autoUpdate = !window.forumManager.currentSettings.autoUpdate;
    window.forumManager.saveSettings();
    console.log(`[Mobile Context] 论坛自动更新已${window.forumManager.currentSettings.autoUpdate ? '启用' : '禁用'}`);
    return window.forumManager.currentSettings.autoUpdate;
  };

  // 获取可用论坛风格
  window.MobileContext.getForumStyles = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return [];
    }
    return window.forumStyles.getAvailableStyles();
  };

  // 启动/停止论坛自动监听器
  window.MobileContext.startForumListener = function () {
    if (!window.forumAutoListener) {
      console.warn('[Mobile Context] 论坛自动监听器未初始化');
      return false;
    }
    window.forumAutoListener.start();
    return true;
  };

  window.MobileContext.stopForumListener = function () {
    if (!window.forumAutoListener) {
      console.warn('[Mobile Context] 论坛自动监听器未初始化');
      return false;
    }
    window.forumAutoListener.stop();
    return true;
  };

  // 获取论坛监听器状态
  window.MobileContext.getForumListenerStatus = function () {
    if (!window.forumAutoListener) {
      console.warn('[Mobile Context] 论坛自动监听器未初始化');
      return null;
    }
    return window.forumAutoListener.getStatus();
  };

  // 调试论坛功能
  window.MobileContext.debugForumFeatures = function () {
    console.group('=== 论坛功能状态 ===');

    // 检查论坛模块
    console.log('1. 论坛风格模块:', {
      exists: !!window.forumStyles,
      availableStyles: window.forumStyles ? window.forumStyles.getAvailableStyles().length : 0,
      hasCustomPrefix: window.forumStyles ? window.forumStyles.getPrefixStatus().hasPrefix : false,
      hasGlobalPrefix: window.forumStyles ? window.forumStyles.getPrefixStatus().hasGlobalPrefix : false,
    });

    console.log('2. 论坛自动监听器:', {
      exists: !!window.forumAutoListener,
      isListening: window.forumAutoListener ? window.forumAutoListener.isListening : false,
      lastMessageCount: window.forumAutoListener ? window.forumAutoListener.lastMessageCount : 0,
    });

    console.log('3. 论坛管理器:', {
      exists: !!window.forumManager,
      isInitialized: window.forumManager ? window.forumManager.isInitialized : false,
      isProcessing: window.forumManager ? window.forumManager.isProcessing : false,
      settings: window.forumManager ? window.forumManager.currentSettings : null,
    });

    // 检查UI元素
    console.log('4. 论坛UI元素:', {
      forumButton: !!document.getElementById('mobile-forum-trigger'),
      forumPanel: !!document.getElementById('forum-panel-overlay'),
    });

    // 显示前缀状态（详细版）
    if (window.forumStyles) {
      const prefixStatus = window.forumStyles.getPrefixStatus();
      console.log('5. 前缀设置详情:', prefixStatus);

      // 显示优先级信息
      const priorityInfo = window.forumStyles.getPrefixPriorityInfo();
      console.log('6. 前缀优先级:', priorityInfo);
    }

    console.groupEnd();
  };

  // ===========================================
  // 论坛前缀控制台命令
  // ===========================================

  // 设置论坛前缀
  window.MobileContext.setForumPrefix = function (text) {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return false;
    }
    window.forumStyles.setCustomPrefix(text);
    console.log(`[Mobile Context] ✅ 前缀已设置: ${text ? '已设置' : '已清空'}`);
    return true;
  };

  // 获取当前前缀
  window.MobileContext.getForumPrefix = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const prefix = window.forumStyles.getCustomPrefix();
    console.log(`[Mobile Context] 当前前缀: ${prefix || '(无)'}`);
    return prefix;
  };

  // 清空前缀
  window.MobileContext.clearForumPrefix = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return false;
    }
    window.forumStyles.clearCustomPrefix();
    console.log('[Mobile Context] ✅ 前缀已清空');
    return true;
  };

  // 预览带前缀的风格提示词
  window.MobileContext.previewForumPrompt = function (styleName = '贴吧老哥') {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const prompt = window.forumStyles.previewStyleWithPrefix(styleName);
    console.log(`[Mobile Context] ${styleName} 风格预览:`);
    console.log(prompt);
    return prompt;
  };

  // 获取前缀状态
  window.MobileContext.getForumPrefixStatus = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const status = window.forumStyles.getPrefixStatus();
    console.log('[Mobile Context] 前缀状态:', status);
    return status;
  };

  // ===========================================
  // 全局后台前缀控制台命令
  // ===========================================

  // 查看全局后台前缀
  window.MobileContext.getGlobalForumPrefix = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const globalPrefix = window.forumStyles.getGlobalBackendPrefix();
    console.log('[Mobile Context] 全局后台前缀:');
    console.log(globalPrefix);
    return globalPrefix;
  };

  // 检查是否有全局后台前缀
  window.MobileContext.hasGlobalForumPrefix = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return false;
    }
    const hasGlobal = window.forumStyles.hasGlobalBackendPrefix();
    console.log(`[Mobile Context] 全局后台前缀状态: ${hasGlobal ? '已设置' : '未设置'}`);
    return hasGlobal;
  };

  // 获取完整前缀预览
  window.MobileContext.getFullForumPrefixPreview = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const preview = window.forumStyles.getFullPrefixPreview();
    console.log('[Mobile Context] 完整前缀预览:');
    console.log(preview);
    return preview;
  };

  // 获取前缀优先级信息
  window.MobileContext.getForumPrefixPriority = function () {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    const info = window.forumStyles.getPrefixPriorityInfo();
    console.log('[Mobile Context] 前缀优先级信息:');
    console.log(info);
    return info;
  };

  // 预览最终发送给模型的完整提示词
  window.MobileContext.previewFullForumPrompt = function (styleName = '贴吧老哥') {
    if (!window.forumStyles) {
      console.warn('[Mobile Context] 论坛风格模块未初始化');
      return null;
    }
    console.log(`[Mobile Context] 完整提示词预览（${styleName}风格）:`);
    console.log('='.repeat(60));
    const fullPrompt = window.forumStyles.previewStyleWithPrefix(styleName);
    console.log(fullPrompt);
    console.log('='.repeat(60));
    return fullPrompt;
  };

  console.log('');
  console.log('=== 论坛管理器 v1.0 ===');
  console.log('  MobileContext.showForumPanel() - 显示论坛管理面板');
  console.log('  MobileContext.generateForum() - 立即生成论坛内容');
  console.log('  MobileContext.clearForum() - 清除第1楼层的论坛内容');
  console.log('  MobileContext.getForumStatus() - 获取论坛管理器状态');
  console.log('  MobileContext.setForumStyle(styleName) - 设置论坛风格');
  console.log('  MobileContext.setForumThreshold(number) - 设置消息阈值');
  console.log('  MobileContext.toggleForumAutoUpdate() - 切换自动更新');
  console.log('  MobileContext.getForumStyles() - 获取可用论坛风格列表');
  console.log('');
  console.log('=== 论坛前缀设置 ===');
  console.log('  MobileContext.setForumPrefix(text) - 设置用户自定义前缀');
  console.log('  MobileContext.getForumPrefix() - 获取当前用户前缀');
  console.log('  MobileContext.clearForumPrefix() - 清空用户前缀');
  console.log('  MobileContext.previewForumPrompt(style) - 预览带前缀的提示词');
  console.log('');
  console.log('=== 全局后台前缀管理 ===');
  console.log('  MobileContext.getGlobalForumPrefix() - 查看全局后台前缀');
  console.log('  MobileContext.hasGlobalForumPrefix() - 检查是否设置全局前缀');
  console.log('  MobileContext.getFullForumPrefixPreview() - 预览所有前缀组合');
  console.log('  MobileContext.getForumPrefixPriority() - 查看前缀优先级信息');
  console.log('  MobileContext.previewFullForumPrompt(style) - 预览最终完整提示词');
  console.log('');
  console.log('=== 论坛自动监听器 ===');
  console.log('  MobileContext.startForumListener() - 启动论坛自动监听器');
  console.log('  MobileContext.stopForumListener() - 停止论坛自动监听器');
  console.log('  MobileContext.getForumListenerStatus() - 获取监听器状态');
  console.log('');
  console.log('=== 论坛调试工具 ===');
  console.log('  MobileContext.debugForumFeatures() - 调试论坛功能状态');
  console.log('');
  console.log('=== 论坛快速开始 ===');
  console.log('方式一（图形界面）：');
  console.log('1. 点击右侧📰按钮打开论坛管理面板');
  console.log('2. 选择论坛风格（贴吧老哥、知乎精英、小红书种草等8种风格）');
  console.log('3. 可选：设置用户自定义前缀（会添加到全局前缀后面）');
  console.log('4. 设置消息阈值（当新增消息达到阈值时自动生成论坛内容）');
  console.log('5. 开启/关闭自动生成');
  console.log("6. 点击'立即生成论坛'手动生成内容");
  console.log('7. 论坛内容会自动追加到第1楼层（保留原有内容）');
  console.log('');
  console.log('方式二（控制台命令）：');
  console.log("1. MobileContext.setForumStyle('知乎精英')  // 设置风格");
  console.log("2. MobileContext.setForumPrefix('你的自定义要求')  // 可选：设置用户前缀");
  console.log('3. MobileContext.setForumThreshold(5)      // 设置阈值');
  console.log('4. MobileContext.toggleForumAutoUpdate()   // 启用自动更新');
  console.log('5. MobileContext.generateForum()           // 立即生成论坛内容');
  console.log('');
  console.log('=== 前缀系统说明 ===');
  console.log('论坛功能采用多层前缀系统，优先级从高到低：');
  console.log('1. 🔒 全局后台前缀（开发者在代码中设置，包含基础规范）');
  console.log('2. 👤 用户自定义前缀（用户在UI或控制台中设置）');
  console.log('3. 🎭 论坛风格提示词（8种网络社区风格）');
  console.log('4. 😊 表情包使用指南');
  console.log('');
  console.log('查看前缀状态：MobileContext.getFullForumPrefixPreview()');
  console.log("预览完整提示词：MobileContext.previewFullForumPrompt('贴吧老哥')");
  console.log('');
  console.log('注意：论坛功能需要先配置API（自定义API配置模块）');
  console.log('支持的风格：贴吧老哥、知乎精英、小红书种草、抖音达人、B站UP主、海角老司机、八卦小报记者、天涯老涯友');
  console.log('生成的论坛内容会追加到第1楼层，使用特殊标记包装，清除时只清除论坛部分');
}

// 设置全局插件标识
window.MobileContextPlugin = {
  version: '2.4.0',
  description:
    'Mobile Context Monitor with Upload & Editor & Custom API & MesID Floor Monitor & Forum Manager & Forum UI v2.4 (SillyTavern.getContext() API Integration)',
  isInitialized: () => isInitialized,
  getMonitor: () => contextMonitor,
  getContextEditor: () => window.mobileContextEditor,
  getCustomAPIConfig: () => window.mobileCustomAPIConfig,
  getMesIDFloorMonitor: () => window.mesidFloorMonitor,
  getForumManager: () => window.forumManager,
  getForumStyles: () => window.forumStyles,
  getForumAutoListener: () => window.forumAutoListener,
  getForumUI: () => window.forumUI,
  apiVersion: '2.4',
  updatePointerEventsSettings: () => updatePointerEventsSettings(),
  getSettings: () => extension_settings.mobile_context,
};

/**
 * 更新pointer-events设置
 */
function updatePointerEventsSettings() {
  const container = document.querySelector('.mobile-phone-container');
  const frame = document.querySelector('.mobile-phone-frame');

  if (!container || !frame) {
    return;
  }

  if (extension_settings.mobile_context.tavernCompatibilityMode) {
    // 兼容模式：启用pointer-events设置，允许同时控制手机和酒馆页面
    container.style.pointerEvents = 'none';
    frame.style.pointerEvents = 'auto';
  } else {
    // 非兼容模式：确保容器可以接收点击事件，允许点击外部关闭手机
    container.style.pointerEvents = 'auto';
    frame.style.pointerEvents = 'auto';
  }
}

/**
 * 更新手机按钮可见性
 */
function updatePhoneVisibility() {
  const phoneTrigger = document.getElementById('mobile-phone-trigger');

  if (!phoneTrigger) {
    return;
  }

  if (extension_settings.mobile_context.hidePhone) {
    // 隐藏手机按钮
    phoneTrigger.style.display = 'none';
  } else {
    // 显示手机按钮
    phoneTrigger.style.display = 'block';
  }
}
