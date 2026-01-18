/**
 * Mobile Init - 移动端初始化脚本
 * 确保所有移动端模块按正确顺序加载
 */

(function() {
    'use strict';

    console.log('[Mobile Init] 🚀 开始移动端初始化...');

    // 移动端模块配置
    const MOBILE_MODULES = [
        {
            name: 'real-time-sync',
            path: 'scripts/extensions/third-party/mobile/app/real-time-sync.js',
            dependencies: []
        }
    ];

    // 已加载的模块
    const loadedModules = new Set();
    const loadingModules = new Set();

    // 加载脚本
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            console.log(`[Mobile Init] 📦 加载脚本: ${src}`);

            // 检查是否已经存在
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                console.log(`[Mobile Init] ✅ 脚本已存在: ${src}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`[Mobile Init] ✅ 脚本加载完成: ${src}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`[Mobile Init] ❌ 脚本加载失败: ${src}`, error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    // 加载模块
    async function loadModule(module) {
        if (loadedModules.has(module.name)) {
            return true;
        }

        if (loadingModules.has(module.name)) {
            // 等待其他地方加载完成
            while (loadingModules.has(module.name)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return loadedModules.has(module.name);
        }

        loadingModules.add(module.name);

        try {
            // 加载依赖
            for (const depName of module.dependencies) {
                const dep = MOBILE_MODULES.find(m => m.name === depName);
                if (dep && !loadedModules.has(depName)) {
                    await loadModule(dep);
                }
            }

            // 加载当前模块
            await loadScript(module.path);
            loadedModules.add(module.name);
            console.log(`[Mobile Init] ✅ 模块加载完成: ${module.name}`);
            return true;

        } catch (error) {
            console.error(`[Mobile Init] ❌ 模块加载失败: ${module.name}`, error);
            return false;
        } finally {
            loadingModules.delete(module.name);
        }
    }

    // 检查是否在移动端环境
    function isMobileEnvironment() {
        const hasDataApp = document.querySelector('[data-app]') !== null;
        const hasPathMobile = window.location.pathname.includes('mobile');
        const hasMobilePhone = typeof window.mobilePhone !== 'undefined';

        console.log('[Mobile Init] 🔍 环境检测:', {
            hasDataApp,
            hasPathMobile,
            hasMobilePhone,
            pathname: window.location.pathname,
            dataAppElement: document.querySelector('[data-app]')
        });

        // 强制启用移动端模块，便于调试
        const isMobile = hasDataApp || hasPathMobile || hasMobilePhone || true;
        console.log('[Mobile Init] 🎯 移动端环境检测结果:', isMobile);

        return isMobile;
    }

    // 初始化移动端模块
    async function initMobileModules() {
        try {
            if (!isMobileEnvironment()) {
                console.log('[Mobile Init] 非移动端环境，跳过初始化');
                return;
            }

            console.log('[Mobile Init] 🎯 检测到移动端环境，开始加载模块...');

            // 加载所有模块
            for (const module of MOBILE_MODULES) {
                await loadModule(module);
            }

            // 等待一下确保模块初始化完成
            setTimeout(() => {
                initRealTimeSync();
            }, 1000);

            console.log('[Mobile Init] ✅ 所有移动端模块加载完成');

        } catch (error) {
            console.error('[Mobile Init] ❌ 移动端模块初始化失败:', error);
        }
    }

    // 初始化实时同步器
    function initRealTimeSync() {
        try {
            console.log('[Mobile Init] 🔄 初始化实时同步器...');

            // 检查实时同步器是否可用
            if (typeof window.realTimeSync !== 'undefined') {
                console.log('[Mobile Init] ✅ 实时同步器可用，启动中...');

                if (!window.realTimeSync.isRunning) {
                    window.realTimeSync.start();
                }
            } else {
                console.warn('[Mobile Init] ⚠️ 实时同步器不可用');
            }
        } catch (error) {
            console.error('[Mobile Init] ❌ 实时同步器初始化失败:', error);
        }
    }

    // 创建全局调试函数
    window.mobileDebug = {
        loadedModules: () => Array.from(loadedModules),
        loadingModules: () => Array.from(loadingModules),
        reloadModule: async (moduleName) => {
            const module = MOBILE_MODULES.find(m => m.name === moduleName);
            if (module) {
                loadedModules.delete(moduleName);
                return await loadModule(module);
            }
            return false;
        },
        initRealTimeSync,
        checkRealTimeSync: () => {
            return {
                exists: typeof window.realTimeSync !== 'undefined',
                isRunning: window.realTimeSync?.isRunning || false,
                status: window.realTimeSync?.getSyncStatus?.() || null
            };
        }
    };

    // 延迟启动，确保DOM准备就绪
    console.log('[Mobile Init] 当前DOM状态:', document.readyState);

    if (document.readyState === 'loading') {
        console.log('[Mobile Init] DOM正在加载，等待DOMContentLoaded事件...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[Mobile Init] DOMContentLoaded事件触发');
            setTimeout(initMobileModules, 1000);
        });
    } else {
        console.log('[Mobile Init] DOM已准备就绪，立即启动...');
        setTimeout(initMobileModules, 1000);
    }

    console.log('[Mobile Init] 移动端初始化脚本加载完成');
})();
