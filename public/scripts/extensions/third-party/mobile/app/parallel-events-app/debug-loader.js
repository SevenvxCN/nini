// 平行事件应用调试加载器
console.log('🔍 [Debug Loader] 开始调试平行事件应用加载过程...');

// 检查当前环境
console.log('📋 [Debug Loader] 环境检查:');
console.log('  - 当前URL:', window.location.href);
console.log('  - 用户代理:', navigator.userAgent);

// 检查文件路径
const expectedPaths = [
    './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.css',
    './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-styles.js',
    './scripts/extensions/third-party/mobile/app/parallel-events-app/parallel-events-app.js'
];

console.log('📁 [Debug Loader] 预期文件路径:');
expectedPaths.forEach((path, index) => {
    console.log(`  ${index + 1}. ${path}`);
});

// 测试文件是否可访问
async function testFileAccess() {
    console.log('🌐 [Debug Loader] 测试文件访问性...');
    
    for (let i = 0; i < expectedPaths.length; i++) {
        const path = expectedPaths[i];
        try {
            const response = await fetch(path);
            console.log(`  ✅ ${path} - 状态: ${response.status}`);
        } catch (error) {
            console.log(`  ❌ ${path} - 错误: ${error.message}`);
        }
    }
}

// 监控全局变量变化
const checkGlobals = () => {
    const globals = {
        'ParallelEventsApp': window.ParallelEventsApp,
        'parallelEventsManager': window.parallelEventsManager,
        'parallelEventsStyles': window.parallelEventsStyles,
        'getParallelEventsAppContent': window.getParallelEventsAppContent,
        'bindParallelEventsAppEvents': window.bindParallelEventsAppEvents
    };
    
    console.log('🔍 [Debug Loader] 全局变量状态:');
    Object.entries(globals).forEach(([name, value]) => {
        const type = typeof value;
        const exists = value !== undefined;
        console.log(`  - ${name}: ${exists ? '✅' : '❌'} (${type})`);
    });
    
    return globals;
};

// 初始检查
checkGlobals();

// 测试文件访问
testFileAccess();

// 定期检查全局变量变化
let checkCount = 0;
const maxChecks = 20;
const checkInterval = setInterval(() => {
    checkCount++;
    console.log(`🔄 [Debug Loader] 检查 ${checkCount}/${maxChecks}:`);
    
    const globals = checkGlobals();
    
    // 如果所有变量都存在，停止检查
    const allExists = Object.values(globals).every(v => v !== undefined);
    if (allExists) {
        console.log('🎉 [Debug Loader] 所有全局变量已就绪！');
        clearInterval(checkInterval);
        
        // 尝试调用调试函数
        if (window.debugParallelEventsApp) {
            console.log('🔧 [Debug Loader] 调用调试函数...');
            window.debugParallelEventsApp();
        }
    } else if (checkCount >= maxChecks) {
        console.log('⏰ [Debug Loader] 检查超时，停止监控');
        clearInterval(checkInterval);
    }
}, 1000);

console.log('🔍 [Debug Loader] 调试加载器已启动，将监控全局变量变化...');
