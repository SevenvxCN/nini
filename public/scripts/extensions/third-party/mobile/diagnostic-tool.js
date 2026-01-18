/**
 * Mobile插件诊断工具
 * 用于检查所有优化模块是否正确加载和运行
 */

class MobileDiagnosticTool {
    constructor() {
        this.modules = [
            {
                name: '性能配置',
                check: () => !!window.MOBILE_PERFORMANCE_CONFIG,
                details: () => window.MOBILE_PERFORMANCE_CONFIG ? '已加载' : '未加载'
            },
            {
                name: '性能监控器',
                check: () => !!window.mobilePerformanceMonitor,
                details: () => window.mobilePerformanceMonitor ?
                    `运行时间: ${window.mobilePerformanceMonitor.getMetrics().loadTime || 0}ms` : '未加载'
            },
            {
                name: '优化加载器',
                check: () => !!window.optimizedLoader,
                details: () => window.optimizedLoader ?
                    `已加载模块: ${window.optimizedLoader.getLoadingStatus().loaded}个` : '未加载'
            },
            {
                name: '上下文监控器',
                check: () => !!window.contextMonitor,
                details: () => window.contextMonitor ?
                    `状态: ${window.contextMonitor.isRunning ? '运行中' : '已停止'}` : '未加载'
            },
            {
                name: '性能测试器',
                check: () => !!window.mobilePerformanceTester,
                details: () => window.mobilePerformanceTester ?
                    `测试用例: ${window.mobilePerformanceTester.tests.length}个` : '未加载'
            },
            {
                name: '手机界面',
                check: () => !!window.MobilePhone || !!document.getElementById('mobile-phone-trigger'),
                details: () => {
                    const button = document.getElementById('mobile-phone-trigger');
                    return button ? '界面按钮已创建' : '界面未初始化';
                }
            }
        ];

        console.log('[Diagnostic Tool] 诊断工具已初始化');
    }

    /**
     * 运行完整诊断
     */
    runDiagnosis() {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 Mobile插件诊断报告');
        console.log('='.repeat(50));

        const results = [];
        let passedCount = 0;

        this.modules.forEach((module, index) => {
            const passed = module.check();
            const details = module.details();

            results.push({
                name: module.name,
                passed,
                details
            });

            if (passed) passedCount++;

            const status = passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${module.name}: ${details}`);
        });

        const successRate = Math.round((passedCount / this.modules.length) * 100);

        console.log('\n📊 诊断总结:');
        console.log(`  通过: ${passedCount}/${this.modules.length} (${successRate}%)`);

        if (successRate === 100) {
            console.log('🎉 所有模块运行正常！');
        } else if (successRate >= 80) {
            console.log('⚠️  大部分模块正常，存在少量问题');
        } else {
            console.log('🚨 存在严重问题，请检查插件安装');
        }

        // 提供修复建议
        this.provideTroubleshootingTips(results);

        console.log('='.repeat(50));

        return {
            results,
            passedCount,
            totalCount: this.modules.length,
            successRate
        };
    }

    /**
     * 提供故障排除建议
     */
    provideTroubleshootingTips(results) {
        const failedModules = results.filter(r => !r.passed);

        if (failedModules.length === 0) return;

        console.log('\n🔧 故障排除建议:');

        failedModules.forEach(module => {
            switch (module.name) {
                case '性能配置':
                    console.log('  - 检查 performance-config.js 是否正确加载');
                    break;
                case '性能监控器':
                    console.log('  - 尝试手动创建: window.mobilePerformanceMonitor = new PerformanceMonitor()');
                    break;
                case '优化加载器':
                    console.log('  - 检查 optimized-loader.js 是否加载，或手动创建实例');
                    break;
                case '上下文监控器':
                    console.log('  - 尝试重新初始化: window.contextMonitor = new ContextMonitor()');
                    break;
                case '性能测试器':
                    console.log('  - 检查 performance-test.js 是否加载完成');
                    break;
                case '手机界面':
                    console.log('  - 等待页面完全加载后再试，或检查 mobile-phone.js');
                    break;
            }
        });
    }

    /**
     * 快速检查核心功能
     */
    quickCheck() {
        const coreModules = ['性能配置', '优化加载器', '上下文监控器'];
        const coreResults = this.modules
            .filter(m => coreModules.includes(m.name))
            .map(m => ({ name: m.name, passed: m.check() }));

        const corePassed = coreResults.filter(r => r.passed).length;
        const coreTotal = coreResults.length;

        console.log(`🔍 核心模块检查: ${corePassed}/${coreTotal} 正常`);

        if (corePassed === coreTotal) {
            console.log('✅ 核心功能正常，可以使用性能测试');
            this.showAvailableCommands();
        } else {
            console.log('⚠️  核心功能异常，请先修复基础模块');
        }

        return corePassed === coreTotal;
    }

    /**
     * 显示可用命令
     */
    showAvailableCommands() {
        console.log('\n💡 可用的命令:');
        console.log('  - checkMobileOptimization()      // 快速检查');
        console.log('  - diagnoseMobilePlugin()         // 完整诊断');
        console.log('  - runMobilePerformanceTest()     // 性能测试（如果可用）');
        console.log('  - window.optimizedLoader.getLoadingStatus()');
        console.log('  - window.contextMonitor.getPerformanceStats()');
    }

    /**
     * 尝试修复常见问题
     */
    attemptAutoFix() {
        console.log('🔧 尝试自动修复...');

        let fixCount = 0;

        // 修复性能监控器
        if (!window.mobilePerformanceMonitor && window.PerformanceMonitor) {
            try {
                window.mobilePerformanceMonitor = new window.PerformanceMonitor();
                console.log('✅ 已修复性能监控器');
                fixCount++;
            } catch (error) {
                console.log('❌ 性能监控器修复失败:', error.message);
            }
        }

        // 修复优化加载器
        if (!window.optimizedLoader && window.OptimizedLoader) {
            try {
                window.optimizedLoader = new window.OptimizedLoader();
                console.log('✅ 已修复优化加载器');
                fixCount++;
            } catch (error) {
                console.log('❌ 优化加载器修复失败:', error.message);
            }
        }

        // 修复上下文监控器
        if (!window.contextMonitor && window.ContextMonitor) {
            try {
                window.contextMonitor = new window.ContextMonitor();
                window.contextMonitor.init();
                console.log('✅ 已修复上下文监控器');
                fixCount++;
            } catch (error) {
                console.log('❌ 上下文监控器修复失败:', error.message);
            }
        }

        // 修复性能测试器
        if (!window.mobilePerformanceTester && window.MobilePerformanceTester) {
            try {
                window.mobilePerformanceTester = new window.MobilePerformanceTester();
                window.mobilePerformanceTester.registerTests();

                // 重新定义全局函数
                window.runMobilePerformanceTest = () => {
                    return window.mobilePerformanceTester.runAllTests();
                };

                window.exportMobilePerformanceResults = () => {
                    return window.mobilePerformanceTester.exportResults();
                };

                console.log('✅ 已修复性能测试器');
                fixCount++;
            } catch (error) {
                console.log('❌ 性能测试器修复失败:', error.message);
            }
        }

        console.log(`🔧 自动修复完成，修复了 ${fixCount} 个问题`);

        if (fixCount > 0) {
            console.log('💡 建议重新运行诊断: diagnoseMobilePlugin()');
        }

        return fixCount;
    }

    /**
     * 重新加载缺失的模块
     */
    async reloadMissingModules() {
        console.log('🔄 重新加载缺失的模块...');

        const basePath = './scripts/extensions/third-party/mobile/';
        const modules = [
            { file: 'performance-config.js', check: () => !!window.MOBILE_PERFORMANCE_CONFIG },
            { file: 'optimized-loader.js', check: () => !!window.OptimizedLoader },
            { file: 'performance-test.js', check: () => !!window.MobilePerformanceTester }
        ];

        for (const module of modules) {
            if (!module.check()) {
                try {
                    await this.loadScript(basePath + module.file);
                    console.log(`✅ 已重新加载 ${module.file}`);
                } catch (error) {
                    console.log(`❌ 重新加载 ${module.file} 失败:`, error.message);
                }
            }
        }

        // 等待一下让模块初始化
        setTimeout(() => {
            this.attemptAutoFix();
        }, 1000);
    }

    /**
     * 加载脚本的辅助方法
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// 创建全局诊断工具实例
window.mobileDiagnosticTool = new MobileDiagnosticTool();

// 提供简便的全局函数
window.diagnoseMobilePlugin = () => {
    return window.mobileDiagnosticTool.runDiagnosis();
};

window.checkMobileOptimization = () => {
    return window.mobileDiagnosticTool.quickCheck();
};

window.fixMobilePlugin = () => {
    return window.mobileDiagnosticTool.attemptAutoFix();
};

window.reloadMobileModules = () => {
    return window.mobileDiagnosticTool.reloadMissingModules();
};

// 立即进行快速检查
setTimeout(() => {
    console.log('[Mobile Diagnostic] 诊断工具已就绪');
    console.log('💡 使用 checkMobileOptimization() 进行快速检查');
    console.log('💡 使用 diagnoseMobilePlugin() 进行完整诊断');
    console.log('💡 使用 fixMobilePlugin() 尝试自动修复');
}, 1000);

console.log('[Mobile Diagnostic] 诊断工具已加载');
