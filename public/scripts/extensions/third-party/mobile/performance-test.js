/**
 * Mobile插件性能测试脚本
 * 用于测试和验证优化效果
 */

class MobilePerformanceTester {
    constructor() {
        this.tests = [];
        this.results = [];
        this.baselineMetrics = null;
        this.currentMetrics = null;

        console.log('[Performance Tester] 性能测试器已初始化');
    }

    /**
     * 注册测试用例
     */
    registerTests() {
        this.tests = [
            {
                name: '插件加载时间测试',
                description: '测试插件完整加载所需时间',
                test: this.testPluginLoadTime.bind(this),
                category: 'loading'
            },
            {
                name: '内存使用测试',
                description: '测试插件运行时的内存占用',
                test: this.testMemoryUsage.bind(this),
                category: 'memory'
            },
            {
                name: '监控器性能测试',
                description: '测试上下文监控器的性能表现',
                test: this.testMonitorPerformance.bind(this),
                category: 'monitoring'
            },
            {
                name: '并行加载测试',
                description: '测试优化加载器的并行加载性能',
                test: this.testParallelLoading.bind(this),
                category: 'loading'
            },
            {
                name: 'DOM操作性能测试',
                description: '测试DOM操作的响应时间',
                test: this.testDOMPerformance.bind(this),
                category: 'rendering'
            },
            {
                name: '缓存命中率测试',
                description: '测试缓存机制的有效性',
                test: this.testCacheHitRate.bind(this),
                category: 'caching'
            }
        ];

        console.log(`[Performance Tester] 已注册 ${this.tests.length} 个测试用例`);
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('[Performance Tester] 开始运行性能测试...');

        this.results = [];
        const startTime = performance.now();

        for (const test of this.tests) {
            try {
                console.log(`[Performance Tester] 运行测试: ${test.name}`);
                const result = await this.runSingleTest(test);
                this.results.push(result);
            } catch (error) {
                console.error(`[Performance Tester] 测试失败: ${test.name}`, error);
                this.results.push({
                    ...test,
                    success: false,
                    error: error.message,
                    duration: 0
                });
            }
        }

        const totalTime = performance.now() - startTime;

        // 生成测试报告
        const report = this.generateReport(totalTime);
        this.displayReport(report);

        return report;
    }

    /**
     * 运行单个测试
     */
    async runSingleTest(test) {
        const startTime = performance.now();

        try {
            const result = await test.test();
            const duration = performance.now() - startTime;

            return {
                ...test,
                success: true,
                duration,
                result,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            const duration = performance.now() - startTime;

            return {
                ...test,
                success: false,
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 测试插件加载时间
     */
    async testPluginLoadTime() {
        const startTime = performance.now();

        // 模拟插件重新加载
        const loader = window.optimizedLoader;
        if (!loader) {
            throw new Error('优化加载器不可用');
        }

        const testModules = [
            {
                src: './scripts/extensions/third-party/mobile/context-monitor.js',
                name: 'test-context-monitor',
                required: true
            }
        ];

        await loader.loadScriptsParallel(testModules);

        const loadTime = performance.now() - startTime;

        return {
            loadTime: Math.round(loadTime),
            modules: testModules.length,
            averageTimePerModule: Math.round(loadTime / testModules.length)
        };
    }

    /**
     * 测试内存使用
     */
    async testMemoryUsage() {
        if (!performance.memory) {
            throw new Error('Performance memory API 不可用');
        }

        const initialMemory = performance.memory.usedJSHeapSize;

        // 执行一些操作来测试内存使用
        const testData = [];
        for (let i = 0; i < 1000; i++) {
            testData.push({
                id: i,
                data: new Array(100).fill('test data'),
                timestamp: Date.now()
            });
        }

        // 等待垃圾回收
        await this.delay(100);

        const afterMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = afterMemory - initialMemory;

        // 清理测试数据
        testData.length = 0;

        return {
            initialMemory: Math.round(initialMemory / 1024 / 1024),
            afterMemory: Math.round(afterMemory / 1024 / 1024),
            memoryIncrease: Math.round(memoryIncrease / 1024 / 1024),
            totalMemory: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
        };
    }

    /**
     * 测试监控器性能
     */
    async testMonitorPerformance() {
        const monitor = window.contextMonitor;
        if (!monitor) {
            throw new Error('上下文监控器不可用');
        }

        const startTime = performance.now();

        // 模拟监控器操作
        monitor.checkContextChanges();

        const checkTime = performance.now() - startTime;

        // 获取监控器统计
        const stats = monitor.getPerformanceStats ? monitor.getPerformanceStats() : null;

        return {
            checkTime: Math.round(checkTime),
            isRunning: monitor.isRunning,
            stats: stats,
            historySize: monitor.contextHistory ? monitor.contextHistory.length : 0
        };
    }

    /**
     * 测试并行加载
     */
    async testParallelLoading() {
        const loader = window.optimizedLoader;
        if (!loader) {
            throw new Error('优化加载器不可用');
        }

        const testModules = [
            { src: 'data:text/javascript,console.log("test1");', name: 'test1', required: false },
            { src: 'data:text/javascript,console.log("test2");', name: 'test2', required: false },
            { src: 'data:text/javascript,console.log("test3");', name: 'test3', required: false }
        ];

        const startTime = performance.now();
        await loader.loadScriptsParallel(testModules);
        const parallelTime = performance.now() - startTime;

        return {
            parallelTime: Math.round(parallelTime),
            moduleCount: testModules.length,
            averageTime: Math.round(parallelTime / testModules.length)
        };
    }

    /**
     * 测试DOM操作性能
     */
    async testDOMPerformance() {
        const startTime = performance.now();

        // 创建测试DOM元素
        const testContainer = document.createElement('div');
        testContainer.id = 'performance-test-container';
        testContainer.style.display = 'none';
        document.body.appendChild(testContainer);

        // 执行DOM操作
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.className = 'test-element';
            element.textContent = `Test element ${i}`;
            testContainer.appendChild(element);
        }

        // 查询DOM元素
        const elements = testContainer.querySelectorAll('.test-element');

        // 修改DOM元素
        elements.forEach((element, index) => {
            element.style.backgroundColor = index % 2 === 0 ? '#f0f0f0' : '#ffffff';
        });

        const domTime = performance.now() - startTime;

        // 清理测试元素
        testContainer.remove();

        return {
            domTime: Math.round(domTime),
            elementCount: elements.length,
            operationsPerSecond: Math.round(elements.length / (domTime / 1000))
        };
    }

    /**
     * 测试缓存命中率
     */
    async testCacheHitRate() {
        const loader = window.optimizedLoader;
        if (!loader) {
            throw new Error('优化加载器不可用');
        }

        const testUrl = 'data:text/javascript,console.log("cache test");';

        // 第一次加载
        const startTime1 = performance.now();
        await loader.loadScript(testUrl, 'cache-test1');
        const firstLoadTime = performance.now() - startTime1;

        // 第二次加载（应该从缓存加载）
        const startTime2 = performance.now();
        await loader.loadScript(testUrl, 'cache-test2');
        const secondLoadTime = performance.now() - startTime2;

        const cacheHitRate = secondLoadTime < firstLoadTime ?
            ((firstLoadTime - secondLoadTime) / firstLoadTime * 100) : 0;

        return {
            firstLoadTime: Math.round(firstLoadTime),
            secondLoadTime: Math.round(secondLoadTime),
            cacheHitRate: Math.round(cacheHitRate),
            improvement: Math.round(firstLoadTime / secondLoadTime)
        };
    }

    /**
     * 生成测试报告
     */
    generateReport(totalTime) {
        const successfulTests = this.results.filter(r => r.success);
        const failedTests = this.results.filter(r => !r.success);

        const categoryStats = {};
        this.results.forEach(result => {
            if (!categoryStats[result.category]) {
                categoryStats[result.category] = { total: 0, passed: 0, failed: 0 };
            }
            categoryStats[result.category].total++;
            if (result.success) {
                categoryStats[result.category].passed++;
            } else {
                categoryStats[result.category].failed++;
            }
        });

        return {
            summary: {
                totalTests: this.results.length,
                successfulTests: successfulTests.length,
                failedTests: failedTests.length,
                successRate: Math.round((successfulTests.length / this.results.length) * 100),
                totalTime: Math.round(totalTime)
            },
            categoryStats,
            detailedResults: this.results,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 生成优化建议
     */
    generateRecommendations() {
        const recommendations = [];

        // 基于测试结果生成建议
        this.results.forEach(result => {
            if (result.success && result.result) {
                switch (result.category) {
                    case 'loading':
                        if (result.result.loadTime > 1000) {
                            recommendations.push('建议进一步优化模块加载时间');
                        }
                        break;
                    case 'memory':
                        if (result.result.memoryIncrease > 10) {
                            recommendations.push('建议检查内存泄漏，优化内存使用');
                        }
                        break;
                    case 'monitoring':
                        if (result.result.checkTime > 100) {
                            recommendations.push('建议优化监控器检查频率');
                        }
                        break;
                }
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('所有测试表现良好，无需额外优化');
        }

        return recommendations;
    }

    /**
     * 显示测试报告
     */
    displayReport(report) {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 Mobile插件性能测试报告');
        console.log('='.repeat(60));

        console.log('\n📊 测试概要:');
        console.log(`  总测试数: ${report.summary.totalTests}`);
        console.log(`  成功: ${report.summary.successfulTests}`);
        console.log(`  失败: ${report.summary.failedTests}`);
        console.log(`  成功率: ${report.summary.successRate}%`);
        console.log(`  总耗时: ${report.summary.totalTime}ms`);

        console.log('\n📈 分类统计:');
        Object.entries(report.categoryStats).forEach(([category, stats]) => {
            console.log(`  ${category}: ${stats.passed}/${stats.total} 通过`);
        });

        console.log('\n💡 优化建议:');
        report.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });

        console.log('\n📋 详细结果:');
        report.detailedResults.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`  ${index + 1}. ${status} ${result.name} (${result.duration}ms)`);
            if (result.result) {
                console.log(`     结果: ${JSON.stringify(result.result)}`);
            }
            if (result.error) {
                console.log(`     错误: ${result.error}`);
            }
        });

        console.log('\n' + '='.repeat(60));
    }

    /**
     * 导出测试结果
     */
    exportResults() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            performance: this.results,
            config: window.MOBILE_PERFORMANCE_CONFIG
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mobile-performance-test-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('[Performance Tester] 测试结果已导出');
    }

    /**
     * 辅助方法：延迟
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建全局性能测试器
window.mobilePerformanceTester = new MobilePerformanceTester();

// 注册测试用例
window.mobilePerformanceTester.registerTests();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobilePerformanceTester;
} else {
    window.MobilePerformanceTester = MobilePerformanceTester;
}

// 添加控制台命令
window.runMobilePerformanceTest = () => {
    return window.mobilePerformanceTester.runAllTests();
};

window.exportMobilePerformanceResults = () => {
    return window.mobilePerformanceTester.exportResults();
};

console.log('[Performance Tester] 性能测试器已就绪');
console.log('💡 使用 runMobilePerformanceTest() 运行测试');
console.log('💡 使用 exportMobilePerformanceResults() 导出结果');
