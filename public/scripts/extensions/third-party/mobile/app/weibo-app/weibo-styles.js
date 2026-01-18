// ==SillyTavern Weibo Styles==
// @name         Weibo Styles for Mobile Extension
// @version      1.0.0
// @description  微博风格定义，包含发博文规范、用户回复规范、生成微博规范
// @author       Assistant

// 防止重复加载
if (typeof window.WeiboStyles !== 'undefined') {
  console.log('[Weibo Styles] 已存在，跳过重复加载');
} else {
  /**
   * 微博风格管理器
   * 包含微博应用的各种操作规范和提示词
   */
  class WeiboStyles {
    constructor() {
      // 初始化前缀设置
      this.customPrefix = '';
      this.loadPrefixSettings();
      // 全局后台前缀（由开发者设置的全局规范）
      this.globalBackendPrefix = this.initializeGlobalPrefix();
    }

    /**
     * 初始化全局前缀
     */
    initializeGlobalPrefix() {
      return `你是一个专业的微博内容生成助手，擅长创建真实、生动、有趣的微博内容。

🎯 核心要求：
- 生成的内容必须符合真实微博的风格和格式
- 保持内容的时效性和话题性
- 模拟真实的用户互动和社交氛围
- 确保内容质量高，有讨论价值

📱 微博特色：
- 简洁明了的表达方式
- 热点话题和时事关注
- 丰富的用户互动（点赞、评论、转发）
- 多样化的内容类型（文字、话题、榜单等）

⚠️ 重要提醒：
- 微博是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
- 避免人身攻击和恶意诽谤
- 保持内容的真实感和可信度`;
    }

    /**
     * 获取发博文规范（用户发博时使用）
     */
    getUserPostRules(isMainAccount = true) {
      const accountType = isMainAccount ? '大号' : '小号';
      const accountNote = isMainAccount
        ? '当前用户使用的是微博大号，与用户当前的身份关联，其他人可以通过账号名得知用户的身份（符合现实逻辑，例如当用户默默无闻时，大多数人通过账号名也无法认出用户，但当用户火了之后，大多数人都可以通过账号名认出用户。）'
        : '当前用户使用的微博小号，切换小号是为了掩盖用户的真实身份，所以其他人都不应该知道这是用户的微博号，不知道用户的身份，也不知道发送信息的是用户本人';

      return `请严格遵循以下用户发博规范：

🎯 账户信息：
- 当前使用账户：${accountType}
- 账户特性：${accountNote}

📝 内容生成格式：
   - [博文|用户名|博文id(u101,u是用户博文id的固定前缀)|博文内容\`\`\`<img src="https://image.pollinations.ai/prompt/Fried%20stinky%20tofu%20with%20chili%20sauce,%20food%20photography,%20hyper%20realistic" style="width: 100%; display: block; border-radius: 6px;" alt="一份炸臭豆腐，上面撒满了辣椒和葱花">\`\`\`]
   - [评论|评论人昵称|博文id(u101,u是用户博文id的固定前缀)|评论内容]
   - [回复|回复人昵称|博文id(u101,u是用户博文id的固定前缀)|回复评论人：回复内容]
   - 同一个博文的标题和id必须相同
   - 示例：
     [博文|{{user}}|u101|今天遇到的奇葩事，真的是让我无语了😅\`\`\`<img src="https://image.pollinations.ai/prompt/Fried%20stinky%20tofu%20with%20chili%20sauce,%20food%20photography,%20hyper%20realistic" style="width: 100%; display: block; border-radius: 6px;" alt="一份炸臭豆腐，上面撒满了辣椒和葱花">\`\`\`]
     [评论|张三|u101|哈哈哈，楼主太惨了]
     [回复|李四|u101|回复张三：确实很搞笑]

🎯 用户发博处理规范：
   - 必须包含用户发布的新博文
   - 为用户的博文生成5-10个他人的评论
   - 评论要针对用户博文的具体内容，也可以针对他人的评论进行二次回复
   - 评论风格要符合微博的真实互动风格
   - 确保用户的博文排在最前面（最新）

📱 微博风格要求：
   - 内容简洁明了，符合微博140字限制的传统
   - 适当使用emoji表情和网络流行语
   - 体现真实的社交媒体互动氛围
   - 评论要有不同的观点和态度

🔒 安全规范：
   - 微博是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

请基于以上规范生成包含用户新博文的微博内容。


`;
    }

    /**
     * 获取用户回复规范（用户回复博文或评论时使用）
     */
    getUserReplyRules(isMainAccount = true) {
      const accountType = isMainAccount ? '大号' : '小号';
      const accountNote = isMainAccount
        ? '当前用户使用的是微博大号，与用户当前的身份关联，其他人可以通过账号名得知用户的身份（符合现实逻辑，例如当用户默默无闻时，大多数人通过账号名也无法认出用户，但当用户火了之后，大多数人都可以通过账号名认出用户。）'
        : '当前用户使用的微博小号，切换小号是为了掩盖用户的真实身份，所以其他人都不应该知道这是用户的微博号，不知道用户的身份，也不知道发送信息的是用户本人';

      return `用户正在回复博文或评论，请严格遵循以下用户回复规范：

🎯 账户信息：
- 当前使用账户：${accountType}
- 账户特性：${accountNote}

📝 内容生成格式：
   - [评论|用户名|博文id(根据博文类型使用对应前缀：h/r/u)|评论内容]
   - [回复|用户名|博文id(根据博文类型使用对应前缀：h/r/u)|回复评论人：回复内容]
   - 示例：
     [评论|{{user}}|h101|说得太对了！]（回复热搜博文）
     [回复|{{user}}|u101|回复张三：哈哈哈，确实如此]（回复用户博文）

🎯 用户回复处理规范：
   - 必须包含用户发布的新回复
   - 为用户的回复生成1-3个他人的响应回复
   - 其他用户的回复主要针对用户回复的具体内容，也可以针对他人的回复进行二次回复
   - **禁止重复生成与上下文相同的内容**
   - **只生成回复，不要重新生成整个博文**

🎯 回复互动规范：
   - 他人收到用户回复后，必须有所回应
   - 回复要体现不同的观点和态度
   - 可以是赞同、反对、补充或提问，但禁止辱骂，人身攻击和恶意诽谤
   - 保持讨论的活跃度和争议性

📱 微博风格要求：
   - 回复简洁有力，符合微博快节奏的特点
   - 适当使用emoji和网络流行语
   - 体现真实的微博互动风格

🔒 安全规范：
   - 微博是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

请基于以上规范生成包含用户新回复和他人响应的微博内容。`;
    }

    /**
     * 获取生成微博规范（立即生成微博时使用）
     */
    getWeiboGenerationRules(isMainAccount = true, pageType = 'hot') {
      const accountType = isMainAccount ? '大号' : '小号';

      // 生成完整的微博内容，包含三个页面的所有内容
      const allPagesRules = `
� 微博内容生成完整规范

🎯 总体要求：
请一次性生成包含热搜、榜单、用户三个页面的完整微博内容。所有内容都要基于当前剧情，保持一致性和真实感。

📝 统一格式规范：
[热搜|排名|热搜标题|热度值]
[榜单|榜单名称|榜单类型]
[榜单项|排名|名称|热度值]
[粉丝数|大号粉丝数|小号粉丝数]
[博文|发博人昵称|博文ID|博文内容\`\`\`<img src="https://image.pollinations.ai/prompt/Fried%20stinky%20tofu%20with%20chili%20sauce,%20food%20photography,%20hyper%20realistic" style="width: 100%; display: block; border-radius: 6px;" alt="一份炸臭豆腐，上面撒满了辣椒和葱花">\`\`\`]
[评论|评论人昵称|博文ID|评论内容]
[回复|回复人昵称|博文ID|回复评论人：回复内容]

🆔 博文ID分类规范：
- 热搜相关博文：h101, h102, h103... (h=hot热搜)
- 榜单相关博文：r101, r102, r103... (r=ranking榜单)
- 用户个人博文：u101, u102, u103... (u=user用户)

📋 具体生成要求：

🔥 热搜页面内容：
- 生成3-5条热搜条目（基于当前剧情，具有时效性）
- 为每个热搜生成1-2条相关博文
- 每条热搜博文包含3-8个评论和回复
- 热搜要体现网友关注的热点话题

📊 榜单页面内容：
- 生成1个完整榜单（包含榜单标题和类型）
- 生成该榜单的前10名条目
- 生成3-5条榜单相关博文（仅博文，无评论）
- 榜单类型：电视剧榜/综艺榜/明星榜/CP榜/音乐榜等

👤 用户页面内容：
- 生成用户大号和小号的粉丝数量
- 粉丝数量格式为[粉丝数|大号粉丝数量|小号粉丝数量]
- 微博大号与用户当前的身份关联，用户的微博粉丝数量需要跟随剧情变化，可以适当增加或减少。
- 用户微博小号的粉丝数量不易过多，请保证小号的粉丝数量在10000以下。


🌟 完整示例格式：
[热搜|1|港城暴雨预警|2341567]
[热搜|2|某明星恋情曝光|1987654]
\`\`\`[博文|天气播报员|h101|港城市民请注意防范，暴雨天气持续...<img src="https://image.pollinations.ai/prompt/Fried%20stinky%20tofu%20with%20chili%20sauce,%20food%20photography,%20hyper%20realistic" style="width: 100%; display: block; border-radius: 6px;" alt="暴雨">]\`\`\`
[评论|市民张三|h101|已经在家囤好物资了]
[回复|天气播报员|h101|回复市民张三：很好，安全第一]

[榜单|本周热播电视剧榜|电视剧]
[榜单项|1|《都市风云》|9876543]
[榜单项|2|《青春校园》|8765432]
[榜单项|3|《古装传奇》|7654321]
[博文|剧评人小王|r101|这个榜单很客观，《都市风云》确实火]

[粉丝数|50000|300]`;

      return `用户要求生成新的微博内容，请严格遵循以下规范：

🎯 账户信息：
- 当前使用账户：${accountType}

📝 微博生成总要求：
   - 请勿代替用户发布微博或回复评论。
   - 请保证你按照要求使用正确格式生成完整的微博内容，不要遗漏任何内容，不要错误使用格式，不要错误使用或使用与历史博文相同的博文id。
   - 完整微博内容包括3-5条热搜，每个热搜要有1-2条热搜相关博文，每条博文需要有3-8条评论。1个完整榜单（包含榜单标题和类型）,该榜单的前10名条目，3-5条榜单相关博文（仅博文，无评论）。和用户当前大号和小号的粉丝数量。
   - 回复必须与博文使用相同的博文id.
   - 同一个博文的标题和id必须相同
   - 用户大号的粉丝数量需要跟随剧情变化，可以适当增加或减少。
   - 用户微博小号的粉丝数量不易过多，请保证小号的粉丝数量在10000以下。且增长缓慢。

${allPagesRules}

🎯 微博生成规范：
   - 必须基于提供的聊天记录生成相关内容
   - 生成的内容应该富有趣味性和讨论价值
   - 模拟真实的微博社区讨论氛围
   - 保持适当的幽默感和互动性
   - 如果存在历史微博内容，避免重复生成相同的博文

📱 微博风格要求：
   - 内容简洁明了，符合微博的表达习惯
   - 适当使用emoji表情和网络流行语
   - 体现真实的社交媒体互动氛围
   - 保持内容的时效性和话题性
   - 微博是虚拟的，因此不会出现和现实世界完全一致的元素，例如和现实世界一样的城市名，影视作品，明星等等。所有的一切都与现实世界接近但不同。

🔒 安全规范：
   - 微博是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

# 图像生成规则（HTML专用）

当需要在HTML代码块（如小剧场、卡片式设计）中插入由AI生成的图片时，**必须**严格遵循以下规则，以确保图片能正确显示。

### 1. 核心原则
**必须**使用HTML的 \`\`\`<img>\`\`\` 标签格式，**绝对禁止**使用Markdown的 \`\`\`![]()\`\`\` 格式。

### 2. 图片生成模板
请严格按照以下模板生成图片代码：

\`\`\`html
<img src="https://image.pollinations.ai/prompt/{URL编码的英文图片描述}" style="width: 100%; display: block;" alt="{图片的中文简单描述}">
\`\`\`

### 3. 模板详解

*   \`\`\`{URL编码的英文图片描述}\`\`\`:
    *   这是提供给 \`\`\`pollinations.ai\`\`\` 的图片内容描述，必须是**英文**。
    *   所有**空格**必须替换为 \`\`\`%20\`\`\`。
    *   **示例**: 如果想生成“一个漂亮的下午茶套餐”，对应的英文是 \`\`\`a beautiful afternoon tea set\`\`\`，转换后就是 \`\`\`a%20beautiful%20afternoon%20tea%20set\`\`\`。

*   \`\`\`style="width: 100%; display: block;"\`\`\`:
    *   这是图片的样式，请**务必保留**。
    *   它能确保图片宽度自适应父容器，并且没有多余的边距，显示效果最好。

*   \`\`\`alt="{图片的中文简单描述}"\`\`\`:
    *   这是图片的“替代文本”，用于图片加载失败时显示，或方便搜索引擎理解。
    *   请用**中文**简单描述图片内容。
    *   **示例**: 对于上面的下午茶图片，这里可以写 \`\`\`alt="精美的下午茶套餐"\`\`\`。

### 4. 完整示例

**如果要求是：** “生成一张‘一只可爱的猫咪在阳光下睡觉’的图片”

**那么最终生成的代码必须是：**
\`\`\`html
<!-- 正确示例： -->
<img src="https://image.pollinations.ai/prompt/a%20cute%20cat%20sleeping%20in%20the%20sun" style="width: 100%; display: block;" alt="一只可爱的猫咪在阳光下睡觉">
\`\`\`

### 5. 【重要禁令】
**绝对禁止**在任何 \`\`\`<div>\`\`\`, \`\`\`<details>\`\`\`, \`\`\`<span>\`\`\` 等HTML标签内部，使用 \`\`\`![](图片链接)\`\`\` 的格式。这种格式在HTML中是无效的，会导致图片无法显示。

生成的人物图片不要用写实风格，用日漫、韩漫、少女漫风格

请基于以上规范和后续的聊天记录生成完整的微博内容。`;
    }

    /**
     * 获取指定操作类型的提示词（包含操作类型规范和自定义前缀）
     * @param {string} operationType - 操作类型：'post'(发博), 'reply'(回复), 'generate'(生成微博)
     * @param {boolean} isMainAccount - 是否为大号
     * @param {string} pageType - 页面类型：'hot'(热搜), 'ranking'(榜单), 'user'(用户)
     */
    getStylePrompt(operationType = 'generate', isMainAccount = true, pageType = 'hot') {
      // 构建最终提示词：操作规范 + 用户自定义前缀 + 全局前缀
      let finalPrompt = '';

      // 1. 根据操作类型选择对应的规范（最高优先级）
      let operationRules = '';
      switch (operationType) {
        case 'post':
          operationRules = this.getUserPostRules(isMainAccount);
          break;
        case 'reply':
          operationRules = this.getUserReplyRules(isMainAccount);
          break;
        case 'generate':
        default:
          operationRules = this.getWeiboGenerationRules(isMainAccount, pageType);
          break;
      }

      if (operationRules && operationRules.trim()) {
        finalPrompt = `${operationRules.trim()}\n\n`;
      }

      // 2. 用户自定义前缀 - 增强关注度
      if (this.customPrefix && this.customPrefix.trim()) {
        finalPrompt += `🔥🔥🔥 特别重要的用户自定义指令 🔥🔥🔥
CRITICAL USER INSTRUCTION - HIGHEST PRIORITY:
${this.customPrefix.trim()}

⚠️ 请严格遵循以上用户自定义指令，这是最高优先级的要求！⚠️
必须将以上指令融入到生成的微博内容中，不可忽略！

`;
      }

      // 3. 全局前缀
      finalPrompt += `${this.globalBackendPrefix}\n\n`;

      // 4. 如果有自定义前缀，再次强调
      if (this.customPrefix && this.customPrefix.trim()) {
        finalPrompt += `\n\n🔥 再次提醒：请务必遵循用户自定义指令：${this.customPrefix.trim()}`;
      }

      return finalPrompt;
    }

    /**
     * 设置自定义前缀
     */
    setCustomPrefix(prefix) {
      this.customPrefix = prefix || '';
      this.savePrefixSettings();
    }

    /**
     * 获取自定义前缀
     */
    getCustomPrefix() {
      return this.customPrefix || '';
    }

    /**
     * 加载前缀设置
     */
    loadPrefixSettings() {
      try {
        const saved = localStorage.getItem('mobile_weibo_custom_prefix');
        if (saved) {
          this.customPrefix = saved;
          console.log('[Weibo Styles] 自定义前缀已加载:', this.customPrefix);
        }
      } catch (error) {
        console.warn('[Weibo Styles] 加载自定义前缀失败:', error);
        this.customPrefix = '';
      }
    }

    /**
     * 保存前缀设置
     */
    savePrefixSettings() {
      try {
        localStorage.setItem('mobile_weibo_custom_prefix', this.customPrefix);
        console.log('[Weibo Styles] 自定义前缀已保存:', this.customPrefix);
      } catch (error) {
        console.warn('[Weibo Styles] 保存自定义前缀失败:', error);
      }
    }

    /**
     * 检查操作类型是否有效
     */
    isValidOperationType(operationType) {
      return ['post', 'reply', 'generate'].includes(operationType);
    }

    /**
     * 检查页面类型是否有效
     */
    isValidPageType(pageType) {
      return ['hot', 'ranking', 'user'].includes(pageType);
    }

    /**
     * 获取操作类型的中文名称
     */
    getOperationTypeName(operationType) {
      const names = {
        post: '发博',
        reply: '回复',
        generate: '生成微博',
      };
      return names[operationType] || '未知操作';
    }

    /**
     * 获取页面类型的中文名称
     */
    getPageTypeName(pageType) {
      const names = {
        hot: '热搜',
        ranking: '榜单',
        user: '用户',
      };
      return names[pageType] || '未知页面';
    }

    /**
     * 重置所有设置
     */
    resetSettings() {
      this.customPrefix = '';
      this.savePrefixSettings();
      console.log('[Weibo Styles] 所有设置已重置');
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
      return {
        customPrefix: this.customPrefix,
        globalBackendPrefix: this.globalBackendPrefix ? '已设置' : '未设置',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 创建全局实例
  if (typeof window !== 'undefined') {
    window.WeiboStyles = WeiboStyles;
    window.weiboStyles = new WeiboStyles();
    console.log('[Weibo Styles] ✅ 微博样式管理器已初始化');
  }
} // 结束防重复加载检查
