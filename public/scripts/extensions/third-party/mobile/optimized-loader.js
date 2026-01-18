/**
 * Mobile插件优化加载器
 * 实现并行加载、懒加载和智能缓存
 */

class OptimizedLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.loadOrder = [];
        this.performanceMonitor = window.mobilePerformanceMonitor;
        this.config = window.MOBILE_PERFORMANCE_CONFIG?.loading || {};

        console.log('[Optimized Loader] 优化加载器已初始化');
    }

    /**
     * 并行加载多个脚本
     * @param {Array} scripts 脚本配置数组
     * @param {Object} options 加载选项
     */
    async loadScriptsParallel(scripts, options = {}) {
        const {
            maxConcurrent = 5,
            timeout = this.config.loadTimeout || 10000,
            retryCount = this.config.retryCount || 3
        } = options;

        console.log(`[Optimized Loader] 开始并行加载 ${scripts.length} 个脚本`);
        this.performanceMonitor?.startTimer('parallelLoad');

        const loadPromises = scripts.map(script =>
            this.loadScriptWithRetry(script, retryCount, timeout)
        );

        try {
            const results = await this.limitConcurrency(loadPromises, maxConcurrent);
            const loadTime = this.performanceMonitor?.endTimer('parallelLoad');

            console.log(`[Optimized Loader] 并行加载完成，耗时: ${loadTime?.toFixed(2)}ms`);
            return results;
        } catch (error) {
            console.error('[Optimized Loader] 并行加载失败:', error);
            throw error;
        }
    }

    /**
     * 限制并发数的Promise执行
     */
    async limitConcurrency(promises, maxConcurrent) {
        const results = [];
        const executing = [];

        for (const promise of promises) {
            const p = promise.then(result => {
                executing.splice(executing.indexOf(p), 1);
                return result;
            });

            results.push(p);
            executing.push(p);

            if (executing.length >= maxConcurrent) {
                await Promise.race(executing);
            }
        }

        return Promise.all(results);
    }

    /**
     * 带重试机制的脚本加载
     */
    async loadScriptWithRetry(scriptConfig, retryCount, timeout) {
        const { src, name, required = true } = scriptConfig;

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                const result = await this.loadScript(src, name, timeout);
                return result;
            } catch (error) {
                if (attempt === retryCount) {
                    if (required) {
                        throw new Error(`Failed to load required script ${name} after ${retryCount + 1} attempts: ${error.message}`);
                    } else {
                        console.warn(`[Optimized Loader] 可选脚本 ${name} 加载失败，继续执行`);
                        return { success: false, name, error: error.message };
                    }
                }

                const delay = Math.pow(2, attempt) * 1000; // 指数退避
                console.warn(`[Optimized Loader] 脚本 ${name} 第 ${attempt + 1} 次加载失败，${delay}ms后重试`);
                await this.delay(delay);
            }
        }
    }

    /**
     * 加载单个脚本
     */
    async loadScript(src, name, timeout = 10000) {
        // 检查是否已加载
        if (this.loadedModules.has(src)) {
            return this.loadedModules.get(src);
        }

        // 检查是否正在加载
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;

            const timer = setTimeout(() => {
                script.remove();
                reject(new Error(`Script ${name} loading timeout`));
            }, timeout);

            script.onload = () => {
                clearTimeout(timer);
                this.loadedModules.set(src, { success: true, name });
                this.loadOrder.push(name);
                console.log(`[Optimized Loader] ✅ 脚本加载成功: ${name}`);
                resolve({ success: true, name });
            };

            script.onerror = () => {
                clearTimeout(timer);
                script.remove();
                reject(new Error(`Script ${name} loading failed`));
            };

            document.head.appendChild(script);
        });

        this.loadingPromises.set(src, loadPromise);

        try {
            const result = await loadPromise;
            this.loadingPromises.delete(src);
            return result;
        } catch (error) {
            this.loadingPromises.delete(src);
            throw error;
        }
    }

    /**
     * 加载CSS文件
     */
    async loadCSS(href, name, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;

            const timer = setTimeout(() => {
                reject(new Error(`CSS ${name} loading timeout`));
            }, timeout);

            link.onload = () => {
                clearTimeout(timer);
                console.log(`[Optimized Loader] ✅ CSS加载成功: ${name}`);
                resolve({ success: true, name });
            };

            link.onerror = () => {
                clearTimeout(timer);
                console.warn(`[Optimized Loader] CSS加载失败: ${name}`);
                resolve({ success: false, name, error: 'CSS loading failed' });
            };

            document.head.appendChild(link);
        });
    }

    /**
     * 懒加载模块
     */
    async lazyLoadModule(moduleConfig) {
        const { src, name, condition, priority = 'low' } = moduleConfig;

        // 检查加载条件
        if (condition && !condition()) {
            console.log(`[Optimized Loader] 模块 ${name} 不满足加载条件，跳过`);
            return;
        }

        // 根据优先级决定加载时机
        const delay = priority === 'high' ? 0 : priority === 'medium' ? 500 : 1000;

        if (delay > 0) {
            await this.delay(delay);
        }

        return this.loadScript(src, name);
    }

    /**
     * 等待所有模块加载完成
     */
    async waitForModules(moduleNames, timeout = 30000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const allLoaded = moduleNames.every(name =>
                this.loadOrder.includes(name) || window[name] !== undefined
            );

            if (allLoaded) {
                return true;
            }

            await this.delay(100);
        }

        const missingModules = moduleNames.filter(name =>
            !this.loadOrder.includes(name) && window[name] === undefined
        );

        throw new Error(`Timeout waiting for modules: ${missingModules.join(', ')}`);
    }

    /**
     * 智能预加载
     */
    async preloadModules(moduleConfigs) {
        const highPriorityModules = moduleConfigs.filter(config => config.priority === 'high');
        const mediumPriorityModules = moduleConfigs.filter(config => config.priority === 'medium');
        const lowPriorityModules = moduleConfigs.filter(config => config.priority === 'low');

        // 立即加载高优先级模块
        if (highPriorityModules.length > 0) {
            await this.loadScriptsParallel(highPriorityModules);
        }

        // 延迟加载中优先级模块
        setTimeout(() => {
            if (mediumPriorityModules.length > 0) {
                this.loadScriptsParallel(mediumPriorityModules);
            }
        }, 1000);

        // 更晚加载低优先级模块
        setTimeout(() => {
            if (lowPriorityModules.length > 0) {
                this.loadScriptsParallel(lowPriorityModules);
            }
        }, 3000);
    }

    /**
     * 获取加载状态
     */
    getLoadingStatus() {
        return {
            loaded: this.loadedModules.size,
            loading: this.loadingPromises.size,
            loadOrder: [...this.loadOrder],
            performance: this.performanceMonitor?.getMetrics()
        };
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.loadingPromises.clear();
        console.log('[Optimized Loader] 资源已清理');
    }

    /**
     * 辅助方法：延迟
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局优化加载器实例
window.optimizedLoader = new OptimizedLoader();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizedLoader;
} else {
    window.OptimizedLoader = OptimizedLoader;
}

console.log('[Optimized Loader] 优化加载器已就绪');
