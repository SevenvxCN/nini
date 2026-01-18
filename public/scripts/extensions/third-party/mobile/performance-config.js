/**
 * Mobile插件性能配置
 * 允许用户自定义性能设置以优化卡顿问题
 */

const MOBILE_PERFORMANCE_CONFIG = {
    // 文件加载优化
    loading: {
        // 启用异步并行加载
        enableParallelLoading: true,
        // 启用懒加载
        enableLazyLoading: true,
        // 分块加载大小（KB）
        chunkSize: 50,
        // 加载超时时间（毫秒）
        loadTimeout: 10000,
        // 重试次数
        retryCount: 3
    },

    // 监控器优化
    monitoring: {
        // 上下文监控间隔（毫秒）
        contextMonitorInterval: 5000, // 从3秒改为5秒
        // 启用智能监控（仅在必要时监控）
        enableSmartMonitoring: true,
        // 事件防抖延迟（毫秒）
        debounceDelay: 500,
        // 最大历史记录数
        maxHistoryRecords: 100, // 从50改为100但有清理机制
        // 启用性能监控
        enablePerformanceMonitoring: true
    },

    // 缓存优化
    caching: {
        // 启用智能缓存
        enableSmartCaching: true,
        // 缓存过期时间（毫秒）
        cacheExpiry: 300000, // 5分钟
        // 最大缓存大小（MB）
        maxCacheSize: 10,
        // 自动清理缓存
        autoCleanupCache: true
    },

    // 渲染优化
    rendering: {
        // 启用虚拟滚动
        enableVirtualScrolling: true,
        // 渲染批处理大小
        renderBatchSize: 20,
        // 渲染间隔（毫秒）
        renderInterval: 100,
        // 启用增量渲染
        enableIncrementalRendering: true,
        // 最大同时渲染数
        maxConcurrentRenders: 3
    },

    // 内存管理
    memory: {
        // 启用内存监控
        enableMemoryMonitoring: true,
        // 内存清理间隔（毫秒）
        memoryCleanupInterval: 60000, // 1分钟
        // 内存使用阈值（MB）
        memoryThreshold: 50,
        // 自动垃圾回收
        autoGarbageCollection: true
    },

    // 网络优化
    network: {
        // 启用请求合并
        enableRequestMerging: true,
        // 请求超时时间（毫秒）
        requestTimeout: 8000,
        // 最大并发请求数
        maxConcurrentRequests: 5,
        // 启用请求缓存
        enableRequestCache: true
    },

    // 调试选项
    debug: {
        // 启用性能日志
        enablePerformanceLogging: false,
        // 启用内存使用日志
        enableMemoryLogging: false,
        // 启用渲染性能日志
        enableRenderLogging: false,
        // 日志级别：'error', 'warn', 'info', 'debug'
        logLevel: 'info'
    }
};

// 性能监控工具
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            cacheHitRate: 0,
            errorCount: 0
        };
        this.startTime = performance.now();
        this.observers = [];
    }

    startTimer(name) {
        this.timers = this.timers || {};
        this.timers[name] = performance.now();
    }

    endTimer(name) {
        if (this.timers && this.timers[name]) {
            const duration = performance.now() - this.timers[name];
            this.metrics[name + 'Time'] = duration;
            delete this.timers[name];
            return duration;
        }
        return 0;
    }

    recordMetric(name, value) {
        this.metrics[name] = value;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    startMemoryMonitoring() {
        if (!performance.memory) return;

        const monitor = () => {
            const memory = performance.memory;
            this.recordMetric('memoryUsage', memory.usedJSHeapSize / 1024 / 1024); // MB

            // 如果内存使用超过阈值，触发清理
            if (memory.usedJSHeapSize / 1024 / 1024 > MOBILE_PERFORMANCE_CONFIG.memory.memoryThreshold) {
                this.triggerMemoryCleanup();
            }
        };

        setInterval(monitor, MOBILE_PERFORMANCE_CONFIG.memory.memoryCleanupInterval);
    }

    triggerMemoryCleanup() {
        // 触发内存清理事件
        window.dispatchEvent(new CustomEvent('mobile-memory-cleanup', {
            detail: { threshold: MOBILE_PERFORMANCE_CONFIG.memory.memoryThreshold }
        }));
    }

    generateReport() {
        const metrics = this.getMetrics();
        const totalTime = performance.now() - this.startTime;

        return {
            totalTime,
            metrics,
            timestamp: new Date().toISOString(),
            config: MOBILE_PERFORMANCE_CONFIG
        };
    }
}

// 创建全局性能监控器
window.mobilePerformanceMonitor = new PerformanceMonitor();

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MOBILE_PERFORMANCE_CONFIG, PerformanceMonitor };
} else {
    window.MOBILE_PERFORMANCE_CONFIG = MOBILE_PERFORMANCE_CONFIG;
    window.PerformanceMonitor = PerformanceMonitor;
}

console.log('[Mobile Performance] 性能配置已加载');
