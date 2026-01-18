// ==平行事件风格管理器==
// @name         Parallel Events Styles
// @version      1.0.0
// @description  平行事件风格定义，包含多种风格的事件生成模板
// @author       Assistant

/**
 * 平行事件风格管理器
 * 包含各种风格的平行事件生成模板和提示词
 */
class ParallelEventsStyles {
    constructor() {
        this.styles = this.initializeStyles();
        this.customStyles = new Map(); // 存储自定义风格
        this.customPrefix = '';
        this.loadPrefixSettings();
        this.loadCustomStyles();

        console.log('[Parallel Events Styles] 风格管理器已创建');
    }

    /**
     * 初始化所有风格定义
     */
    initializeStyles() {
        return {
            '被ntr': `你是一个专业的成人小说生成器。请根据当前对话内容，生成一段不在当前场景内的角色和其他人做爱或者前戏的场景。

风格要求：
- 动作描写细腻
- 丰富的内心描写
- 对主角的愧疚或者别的想法
- 长度控制在1000-1400字

请直接生成平行事件内容，不要包含其他解释。`,

            '主人的任务': `你是一个专业的成人小说生成器。请根据当前对话内容，生成一段当前场景内对方正在执行他不知名的主人的任务剧情。

风格要求：
- 动作描写细腻
- 丰富的内心描写
- 对主角的愧疚或者别的想法
- 长度控制在1000-1400字

示例元素：
- 跳蛋或衣服下面的绳缚或没穿内衣或因为任务要求勾引主角

请直接生成平行事件内容，不要包含其他解释。`,

            '主动消息': `其他角色进行线上聊天私聊用户时的AI行为与输出格式。

## 一、核心扮演准则

1.  **触发条件**
    *   当用户通过任何形式的线上聊天软件与任意角色进行一对一私聊或角色主动给用户发送信息时，AI必须强制启用本条目规则。
    *   此规则**不适用**于任何角色之间的私聊场景。
2.  **角色扮演**
    *   AI的唯一职责是扮演并生成**非用户方角色**的回复消息。
3.  **绝对禁止事项**
    *   **严禁**代替 用户发言或生成任何属于用户的消息。**严禁**重复用户信息
    *   **严禁**在消息格式之外，输出任何前缀、后缀、时间戳、剧情描述、心理活动、场景说明、注释或任何额外内容。
    *   **严禁**输出空行或不必要的换行。
    * *   **严禁**搞错搞混好友的名字和id。
    *   **严禁**省略任何格式部分。**严禁**省略"[和{{人名或群名}}的聊天]"部分。
    *   输出内容**必须**且**只能**是符合以下格式的一条或多条消息。

## 二、消息输出格式
### 1. 标准格式
所有文字消息，无论类型，都必须严格遵循以下结构：
[和{char}的聊天]
{{消息内容}}

### 2. {{消息内容}}格式：
[对方消息|{{对方名字}}|{{对方好友id}}|{{消息类型}}|{{消息内容}}]

## 三、特殊消息类型详解

### 1. 文字消息 (Text)
*   **类型**: 文字
*   **内容**: 角色发送的具体文本内容。
*   **示例**:
[对方消息|秦倦|500002|文字|小朋友，这么晚还不睡，在想什么呢]

### 2. 红包消息 (Red Packet)
*   **类型**: 红包
*   **内容**: 红包内包含的金额（纯数字）。
*   **示例**:
    [对方消息|霍谨|400003|红包|52000]

### 3. 语音消息 (Voice)
*   **类型**: 语音
*   **内容**: 语音消息的文字转录内容。
*   **示例**:
    [对方消息|夏阳|300004|语音|好想你啊，你什么时候回来]



## 四、行为与交互模拟

*   **动态回复**：每次回复的消息数量应根据具体情境（如角色的情绪、对话的节奏）在 **1 到 7 条**之间动态变化。**禁止**每次都回复固定数量的消息。
*   **模拟真实**：消息之间的时间间隔应有微小且合理的变化，以模拟真实聊天场景的输入延迟。
*   **情景感知**：回复的内容、语气和频率必须完全符合角色当前的设定、情绪以及与用户的关系阶段。
## 五、消息条数
生成至少8-10条不同类型的消息
`,

            '平行事件': `你是一个专业的平行事件生成器。请根据当前对话内容，生成一个当前世界进展或者不在当前内场景npc行动的个人日常或者行动。

风格要求：
- 贴近原文设定
- 事件应该与当前对话相关
- 长度控制在600-800字


请直接生成平行事件内容，不要包含其他解释。`,


            '魅魔之体': `你是一个专业的小说生成器生成器。请根据当前对话内容，生成#一个新角色#突然情不自禁爱上了主角的描述。

风格要求：
- 突出身体反应与心理反应的矛盾
- 仔细描写肢体语言和内心
- 长度控制在600-800字

请直接生成平行事件内容，不要包含其他解释。`,

            '随机新闻': `你是一个专业的新闻生成器。请根据当前世界观，生成一个随机的新闻。

风格要求：
- 贴近当前世界观
- 长度控制在600-800字
- 政治、军事、娱乐、体育、财经、科技、社会、教育、文化、健康、旅游、美食等等，所有题材皆可

请直接生成平行事件内容，不要包含其他解释。`,

            '自定义': `你是一个专业的平行事件生成器。请根据当前对话内容和用户的自定义要求，生成相应风格的平行事件。

基本要求：
- 事件应该与当前对话相关但不直接干扰主线
- 可以是背景事件、环境变化或相关角色的行动
- 使用第三人称视角描述
- 长度控制在100-200字
- 内容要有趣且符合设定

请根据用户提供的自定义前缀要求来调整风格和内容方向。如果没有特殊要求，请生成一个与对话内容相关的有趣平行事件。

请直接生成平行事件内容，不要包含其他解释。`
        };
    }

    /**
     * 获取指定风格的提示词
     */
    getStylePrompt(styleName) {
        if (this.customStyles.has(styleName)) {
            return this.customStyles.get(styleName);
        }
        return this.styles[styleName] || this.styles['现代都市'];
    }

    /**
     * 获取所有可用风格名称
     */
    getAvailableStyles() {
        const builtinStyles = Object.keys(this.styles);
        const customStyleNames = Array.from(this.customStyles.keys());
        return [...builtinStyles, ...customStyleNames];
    }

    /**
     * 添加自定义风格
     */
    addCustomStyle(name, prompt) {
        this.customStyles.set(name, prompt);
        this.saveCustomStyles();
        console.log('[Parallel Events Styles] 添加自定义风格:', name);
    }

    /**
     * 删除自定义风格
     */
    removeCustomStyle(name) {
        if (this.customStyles.has(name)) {
            this.customStyles.delete(name);
            this.saveCustomStyles();
            console.log('[Parallel Events Styles] 删除自定义风格:', name);
            return true;
        }
        return false;
    }

    /**
     * 检查是否为自定义风格
     */
    isCustomStyle(styleName) {
        return this.customStyles.has(styleName);
    }

    /**
     * 获取自定义前缀
     */
    getCustomPrefix() {
        return this.customPrefix;
    }

    /**
     * 设置自定义前缀
     */
    setCustomPrefix(prefix) {
        this.customPrefix = prefix;
        this.savePrefixSettings();
        console.log('[Parallel Events Styles] 自定义前缀已更新');
    }

    /**
     * 构建完整的生成提示词
     */
    buildFullPrompt(styleName, customPrefix = '') {
        let basePrompt = this.getStylePrompt(styleName);

        if (customPrefix) {
            basePrompt += `\n\n自定义要求：${customPrefix}`;
        }

        if (this.customPrefix) {
            basePrompt += `\n\n全局要求：${this.customPrefix}`;
        }

        return basePrompt;
    }

    /**
     * 加载自定义前缀设置
     */
    loadPrefixSettings() {
        try {
            const saved = localStorage.getItem('parallelEventsCustomPrefix');
            if (saved) {
                this.customPrefix = saved;
            }
        } catch (error) {
            console.error('[Parallel Events Styles] 加载前缀设置失败:', error);
        }
    }

    /**
     * 保存自定义前缀设置
     */
    savePrefixSettings() {
        try {
            localStorage.setItem('parallelEventsCustomPrefix', this.customPrefix);
        } catch (error) {
            console.error('[Parallel Events Styles] 保存前缀设置失败:', error);
        }
    }

    /**
     * 加载自定义风格
     */
    loadCustomStyles() {
        try {
            const saved = localStorage.getItem('parallelEventsCustomStyles');
            if (saved) {
                const customStylesData = JSON.parse(saved);
                this.customStyles = new Map(Object.entries(customStylesData));
                console.log('[Parallel Events Styles] 加载自定义风格:', this.customStyles.size, '个');
            }
        } catch (error) {
            console.error('[Parallel Events Styles] 加载自定义风格失败:', error);
        }
    }

    /**
     * 保存自定义风格
     */
    saveCustomStyles() {
        try {
            const customStylesData = Object.fromEntries(this.customStyles);
            localStorage.setItem('parallelEventsCustomStyles', JSON.stringify(customStylesData));
        } catch (error) {
            console.error('[Parallel Events Styles] 保存自定义风格失败:', error);
        }
    }

    /**
     * 导出所有自定义风格
     */
    exportCustomStyles() {
        const exportData = {
            customStyles: Object.fromEntries(this.customStyles),
            customPrefix: this.customPrefix,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 导入自定义风格
     */
    importCustomStyles(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.customStyles) {
                // 合并自定义风格
                Object.entries(data.customStyles).forEach(([name, prompt]) => {
                    this.customStyles.set(name, prompt);
                });
                this.saveCustomStyles();
            }

            if (data.customPrefix) {
                this.customPrefix = data.customPrefix;
                this.savePrefixSettings();
            }

            console.log('[Parallel Events Styles] 导入完成');
            return true;
        } catch (error) {
            console.error('[Parallel Events Styles] 导入失败:', error);
            return false;
        }
    }

    /**
     * 重置所有设置
     */
    reset() {
        this.customStyles.clear();
        this.customPrefix = '';
        this.saveCustomStyles();
        this.savePrefixSettings();
        console.log('[Parallel Events Styles] 设置已重置');
    }
}

// 创建全局实例
window.parallelEventsStyles = new ParallelEventsStyles();

console.log('[Parallel Events Styles] ✅ 平行事件风格管理器加载完成');
