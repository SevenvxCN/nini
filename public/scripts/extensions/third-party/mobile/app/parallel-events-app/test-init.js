// 平行事件应用初始化测试脚本
console.log('=== 平行事件应用初始化测试 ===');

// 检查文件是否正确加载
console.log('1. 检查全局变量:');
console.log('   - ParallelEventsApp:', typeof ParallelEventsApp);
console.log('   - parallelEventsManager:', typeof window.parallelEventsManager);
console.log('   - parallelEventsStyles:', typeof window.parallelEventsStyles);
console.log('   - getParallelEventsAppContent:', typeof window.getParallelEventsAppContent);
console.log('   - bindParallelEventsAppEvents:', typeof window.bindParallelEventsAppEvents);

// 检查管理器状态
if (window.parallelEventsManager) {
    console.log('2. 管理器状态:');
    console.log('   - isInitialized:', window.parallelEventsManager.isInitialized);
    console.log('   - isListening:', window.parallelEventsManager.isListening);
    console.log('   - currentSettings:', window.parallelEventsManager.currentSettings);
    console.log('   - eventQueue length:', window.parallelEventsManager.eventQueue?.length);
} else {
    console.log('2. ❌ 管理器未创建');
}

// 检查风格管理器
if (window.parallelEventsStyles) {
    console.log('3. 风格管理器状态:');
    console.log('   - 可用风格:', window.parallelEventsStyles.getAvailableStyles());
    console.log('   - 自定义前缀:', window.parallelEventsStyles.getCustomPrefix());
} else {
    console.log('3. ❌ 风格管理器未创建');
}

// 检查依赖模块
console.log('4. 依赖模块状态:');
console.log('   - mobileContextEditor:', typeof window.mobileContextEditor);
console.log('   - mobileCustomAPIConfig:', typeof window.mobileCustomAPIConfig);

console.log('=== 测试完成 ===');
