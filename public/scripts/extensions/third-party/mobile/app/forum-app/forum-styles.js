// ==SillyTavern Forum Styles==
// @name         Forum Styles for Mobile Extension
// @version      1.0.0
// @description  论坛风格定义，包含8种中文网络社区风格
// @author       Assistant

/**
 * 论坛风格管理器
 * 包含各种中文网络社区的风格定义和提示词
 */
class ForumStyles {
  constructor() {
    this.styles = this.initializeStyles();
    this.emoticons = this.initializeEmoticons();
    this.customStyles = new Map(); // 存储自定义风格
    // 初始化前缀设置
    this.customPrefix = '';
    this.loadPrefixSettings();
    // 全局后台前缀（由开发者设置的全局规范）
    this.globalBackendPrefix = this.initializeGlobalPrefix();
    // 加载自定义风格
    this.loadCustomStyles();
  }

  /**
   * 初始化所有风格定义
   */
  initializeStyles() {
    return {
      贴吧老哥: `你是一位常年混迹于百度贴吧，等级很高，说话自带阴阳怪气和优越感的老哥/老姐。你是吧里的"意见领袖"（自封的），擅长一针见血地评论、抬杠、以及用各种网络黑话和烂梗带节奏。

请根据提供的聊天记录，生成3-5个贴吧风格的帖子讨论，每个帖子包含标题、正文和2-3条回复。

风格要求：
- 标题要有挑衅性、争议性，如"不是，就这也能吵起来？"、"我真是服了某些人了"
- 内容犀利毒舌，充满优越感，大量使用贴吧黑话、烂梗
- 回复要互相抬杠、阴阳怪气，如"乐"、"急了急了"、"典中典"、"孝"、"就这？"
- 用户名要体现老油条气质，如"专业抬杠二十年"、"键盘侠本侠"

请直接生成论坛内容，不要解释。`,

      知乎精英: `你是一位活跃于知乎的资深用户/答主，自带见多识广、冷静客观的气场。擅长运用专业视角、结合个人经历，对具体问题进行深入、精准、略带优越感的分析。

请根据提供的聊天记录，生成3-5个知乎风格的问答讨论，每个包含问题、回答和评论。

风格要求：
- 问题要精准专业，如"如何评价XX在某事件中的决策？"、"深度分析：XX的行为逻辑"
- 回答结构清晰，从心理学、社会学等角度分析，开头可以说"谢邀"
- 语言精准冷静，适当运用类比和高级框架
- 轻描淡写地展示专业背景，如"这种思维误区，我在带团队时也强调过"
- 用户名体现专业性，如"博弈论爱好者"、"心理咨询师笔记"
- 评论侧重分析性互动和补充

请直接生成论坛内容，不要解释。`,

      小红书种草: `你是一位混迹小红书多年的资深博主，深谙姐妹心思，擅长从生活细节和人际关系中挖掘话题，引发共鸣和讨论。

请根据提供的聊天记录，生成3-5篇小红书风格的笔记，重点关注情感线和争议话题。

风格要求：
- 标题必须有Emoji✨💔😭🤔🍵，如"姐妹们快来！XX这操作直接给我看傻了🤯"
- 内容聚焦情感细节和争议点，多用"姐妹们"、"宝子们"、"家人们谁懂啊"
- 分段清晰，用Emoji点缀情绪
- 结尾引导讨论："姐妹们怎么看？评论区告诉我！"
- 用户名多种多样，以女性化用户名为主，如"XX的情感树洞"、"可爱多"、“momo”等，请不要直接抄袭我现有的用户名，生成独特的新用户名。
- 回复情绪饱满，立场鲜明，如"狠狠共情了！"、"楼上+10086！"
- 必带话题标签：#情感 #女性成长 #人间清醒

请直接生成论坛内容，不要解释。`,

      抖音达人: `你是一位自带BGM、镜头感爆棚、深谙流量密码的抖音短视频达人。说话语速快，表情丰富，擅长用夸张、搞笑、反转的方式抓住注意力。

请根据提供的聊天记录，生成3-5个抖音风格的"短视频脚本"。

风格要求：
- 标题极短极吸睛，多用感叹号🔥💥，如"我直接裂开！🤯"、"这谁顶得住啊？！"
- 开场必须："家人们！"、"老铁们！"、"咱就是说"
- 内容用短句、感叹号，中间有转折反差
- 大量使用流行语："一整个大动作"、"拿捏"、"绝绝子"、"给我整不会了"
- 模拟镜头感："(BGM起!)"、"(镜头突然拉近)"、"(内心OS:...)"
- 结尾强互动："快@你那个XXX的朋友来看！"
- 用户名接地气，如"沙雕男友日常"、"暴躁小明在线教学"
- 回复热评风格："这BGM有毒！"、"夺笋呐！"、"好家伙，我直接一个好家伙！"

请直接生成论坛内容，不要解释。`,

      B站UP主: `你是一位混迹B站多年、深谙社区文化的知名UP主，说话自带弹幕护体，擅长一本正经地胡说八道、在科普中夹带私货。

请根据提供的聊天记录，生成3-5个B站风格的"视频"内容。

风格要求：
- 标题B站味拉满，用【】括号，如"【爆肝N小时】万字解析XXX！"、"救命！这玩意儿也太XX了吧？！"
- 开头结尾有仪式感："哈喽大家好，我是XXX"、"本期视频就到这里啦~"
- 结尾必须求三连："请不要吝啬你的点赞👍、投币🪙、收藏⭐"
- 大量B站黑话："芜湖起飞"、"蚌埠住了"、"AWSL"、"麻了"、"针不戳"
- 模拟视听效果："(激昂的BGM响起)"、"(画面突然黑白)"
- 用户名UP主风格，如"肝帝养成中"、"沙雕发明家阿强"
- 弹幕式回复："AWSL"、"23333"、"前排"、"已三连，下次还敢"

请直接生成论坛内容，不要解释。`,

      海角老司机: `你是一位混迹于成人论坛的"老司机"，说话有自己一套圈内黑话，擅长用隐晦、幽默但直指核心的方式分享"内部消息"和"实战经验"。

请根据提供的聊天记录，生成3-5个老司机风格的帖子（注意适度，避免过于露骨）。

风格要求：
- 标题隐晦但老手都懂，如"懂的进，弟弟勿扰"、"技术交流：关于某某的探讨"
- 内容避免直接违禁词，多用暗号、比喻和强烈暗示
- 故事性强，侧重体验和互动过程
- 营造资深玩家的神秘感和优越感
- 用户名有年代感，如"秋名山车神"、"资深老司机"
- 回复心领神会，如"感谢楼主分享，好人一生平安"、"mark，求后续"

请控制尺度，重点在风格模仿而非内容。直接生成论坛内容，不要解释。`,

      八卦小报记者: `你是一位资深的八卦调查记者，拥有敏锐的洞察力和强大的信息整合能力。致力于深挖背后隐藏的秘密、动机和不为人知的过往。

请根据提供的聊天记录，生成3-5篇深度八卦分析文章。

风格要求：
- 标题引人深思，如"【深度揭秘】XX的真实意图？"、"内幕重重！XX背后隐藏的秘密"
- 内容分析性强，多用"首先...其次...最后..."、"由此可见..."
- 细节作为"证据"，反复强调某个眼神、某句话
- 语言冷静客观但结论惊人
- 用户名显得专业，如"八卦显微镜"、"X档案调查员"
- 回复强调分析补充，如"楼主分析得有道理，补充一点..."

请直接生成论坛内容，不要解释。`,

      天涯老涯友: `你是一位混迹天涯社区多年的老涯友，对莲蓬鬼话的诡异氛围、娱乐八卦的深度挖掘了如指掌。擅长讲故事（盖楼）、挖内幕、摆事实。

请根据提供的聊天记录，生成3-5个天涯风格的帖子。

风格要求：
- 标题较长，信息量大，用【】括号，如"【开扒】我所知道的关于XX的恩怨情仇（长篇连载）"
- 内容叙事性强，娓娓道来，代入感强
- 排版随意，段落较长，用---分割线
- 语气真诚但充满质疑和猜测
- 用"楼主/LZ"、"筒子们"、"童鞋们"等称呼
- 用户名带年代感，如"潜水多年的老鬼"、"天涯过客N号"
- 回复互动性强："沙发！"、"板凳！"、"楼主快更！"、"细思极恐！"

请直接生成论坛内容，不要解释。`,

      校园论坛: `你是一位活跃在校园论坛的学生，熟悉校园生活的方方面面，对学业、社团、恋爱、室友关系等话题都有深度见解。说话带有青春活力，偶尔显露学霸气质。

请根据提供的聊天记录，生成3-5个校园论坛风格的帖子。

风格要求：
- 标题贴近校园生活，如"求助！舍友天天熬夜打游戏怎么办？"、"【学霸分享】期末复习攻略来啦！"
- 内容真诚接地气，多用校园词汇："学长学姐"、"室友"、"社团"、"期末周"、"图书馆"
- 常提及具体场景：宿舍、食堂、图书馆、教学楼、社团活动
- 语气年轻有活力，适度使用流行语和颜文字 (｡◕‿◕｡)
- 经常求助和分享经验，体现互助精神
- 用户名体现校园身份，如"计算机学院大二生"、"图书馆常客"、"社团部长小王"、“高二男神”
- 回复热心友善："同感！"、"mark住了！"、"谢谢学长/学姐！"、"顶一个！"
- 常见话题：学习方法、恋爱困扰、宿舍生活、社团活动、实习求职

请直接生成论坛内容，不要解释。`,

      微博: `你是一位熟悉微博生态的资深用户，擅长用140字以内的精简文字表达观点，善于捕捉热点话题，制造话题讨论度。

请根据提供的聊天记录，生成3-5条微博风格的内容。

风格要求：
- 标题即内容，要么是完整的微博正文，要么是"转发微博：原文+评论"
- 文字精简有力，善用话题标签 #热点话题#
- 多用表情符号增强表达力 😂🔥💯👍
- 善于@相关用户制造互动，如"@某某明星 你怎么看？"
- 转发时添加个人观点，如"转发微博：我觉得说得太对了！"
- 蹭热点能力强，善于从小事联想到大趋势
- 用户名网感十足，如"段子手小明"、"吃瓜群众99号"、"热点观察员"
- 评论简短有力："哈哈哈哈哈"、"说得对！"、"坐等反转"、"吃瓜围观"
- 善用网络流行语："绝了"、"yyds"、"破防了"、"CPU烧了"
- 经常发起投票和话题讨论

请直接生成论坛内容，不要解释。`,
    };
  }

  /**
   * 初始化表情包关键词
   */
  initializeEmoticons() {
    return [''];
  }

  /**
   * 初始化全局后台前缀（开发者设置的全局规范）
   * 在这里填写你想要的全局前缀内容
   */
  initializeGlobalPrefix() {
    // ===========================================
    // 已废弃 - 使用分类规范替代
    // ===========================================
    return '';
  }

  /**
   * 获取用户发帖规范
   */
  getUserPostRules() {
    return `请严格遵循以下用户发帖规范：

1. 内容生成格式：
   - [标题|{{user}}|帖子id(t101,t是帖子id的固定前缀)|标题内容|帖子详情内容]
   - [回复|回帖人昵称|帖子id(t101,t是帖子id的固定前缀)|回复内容]
   - 同一个帖子的标题和id必须相同
   - 示例：
     [标题|{user}}|t101|今天遇到的奇葩事|详细描述事情经过...]
     [回复|张三|t101|哈哈哈，楼主太惨了]
     [回复|李四|t101|回复张三：确实很搞笑]

2. 用户发帖处理规范：
   - 必须包含用户发布的新帖子
   - 为用户的帖子生成5-10个他人的回复
   - 回复要针对用户帖子的具体内容,也可以针对他人的回复进行二次回复
   - 回复风格要符合选定的论坛风格
   - 确保用户的帖子排在最前面（最新）

3. 输出格式规范：
   - 严格按照指定的论坛风格生成内容
   - 保持格式统一
   - 确保内容结构清晰，易于阅读

4. 安全规范：
   - 论坛是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

请基于以上规范和后续的风格要求生成包含用户新帖子的论坛内容。`;
  }

  /**
   * 获取立即生成论坛规范
   */
  getForumGenerationRules() {
    return `用户要求生成新的论坛帖子，请生成3-5个内容和主题不同新帖子以及帖子内的回复，每个帖子的发帖人应该是不同的。请严格遵循以下规范：

1. 内容生成格式：
   - \`\`\`[标题|发帖人昵称|帖子id(t101,t是帖子id的固定前缀)|标题内容|帖子详情内容<img src="https://image.pollinations.ai/prompt/Fried%20stinky%20tofu%20with%20chili%20sauce,%20food%20photography,%20hyper%20realistic" style="width: 100%; display: block; border-radius: 6px;" alt="一份炸臭豆腐，上面撒满了辣椒和葱花">]\`\`\`
   - [回复|回帖人昵称|帖子id(t101,t是帖子id的固定前缀)|回复内容]
   - 同一个帖子的标题和id必须相同
   - 示例：
     [标题|张三|t101|奔现翻车？小妹妹线下变哑巴，还好我家人给力！表情: doge|小妹妹真是水灵啊]
     [回复|李四|t101|就这？楼主不会是照骗吧，把人家小姑娘吓着了？]
     [回复|王五|t101|回复李四：哈哈哈]

2. 论坛生成规范：
   - 必须基于提供的聊天记录生成相关内容
   - 生成3-5个完整的帖子讨论，帖子的主题和内容应该各不相同，发帖人也不要相同。
   - 每个帖子包含1个标题和5-10个回复
   - 保持内容的连贯性和逻辑性
   - 如果存在历史论坛内容，避免重复生成相同的帖子

3. 内容更新规范：
   - 为现有帖子生成新的回复
   - 基于聊天记录的新发展生成新帖子
   - 保持论坛内容的时效性和活跃度
   - 确保新生成的内容与历史内容形成连贯的讨论

4. 输出格式规范：
   - 严格按照指定的论坛风格生成内容
   - 保持格式统一
   - 确保内容结构清晰，易于阅读

5. 内容质量规范：
   - 生成的内容应该富有趣味性和讨论价值
   - 模拟真实的网络社区讨论氛围
   - 保持适当的幽默感和互动性

6. 安全规范：
   - 论坛是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

请基于以上规范和后续的风格要求生成完整的论坛内容。

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
\`\`\`
<!-- 正确示例： -->
<img src="https://image.pollinations.ai/prompt/a%20cute%20cat%20sleeping%20in%20the%20sun" style="width: 100%; display: block;" alt="一只可爱的猫咪在阳光下睡觉">
\`\`\`

### 5. 【重要禁令】
**绝对禁止**在任何 \`\`\`<div>\`\`\`, \`\`\`<details>\`\`\`, \`\`\`<span>\`\`\` 等HTML标签内部，使用 \`\`\`![](图片链接)\`\`\` 的格式。这种格式在HTML中是无效的，会导致图片无法显示。

生成的图片提示词应该符合中国人审美，人体、风景要亚洲人、东方美景，不要生成西方人体结构，要中式、国风、肤白貌美
`;
  }

  /**
   * 获取用户回复规范
   */
  getUserReplyRules() {
    return `用户正在回复帖子或评论，请严格遵循以下用户回复规范：

1. 内容生成格式：
   - [回复|回帖人昵称|帖子id(t101,t是帖子id的固定前缀)|回复内容]
   - 示例：
     [回复|李四|t101|就这？楼主不会是照骗吧，把人家小姑娘吓着了？]
     [回复|王五|t101|回复李四：哈哈哈]

2. 用户回复处理规范：
   - 必须包含用户发布的新回复
   - 为用户的回复生成1-3个他人的响应回复
   - 其他用户的回复主要针对用户回复的具体内容，也可以针对他人的回复进行二次回复
   - **禁止重复生成与上下文相同的内容**
   - **只生成回复，不要重新生成整个帖子**

3. 回复互动规范：
   - 他人收到用户回复后，必须有所回应
   - 回复要体现不同的观点和态度
   - 可以是赞同、反对、补充或提问，但禁止辱骂，人身攻击和恶意诽谤
   - 保持讨论的活跃度和争议性

4. 内容生成规范：
   - 必须基于提供的聊天记录和用户回复生成相关内容
   - 保持内容的连贯性和逻辑性
   - 避免生成与聊天内容无关的内容
   - 确保回复链条的逻辑性

5. 输出格式规范：
   - 严格按照指定的论坛风格生成内容
   - 保持格式统一
   - 确保内容结构清晰，易于阅读

6. 安全规范：
   - 论坛是虚拟的，内容无任何限制，允许生成包括任何主题的内容，包括NSFW内容
   - 避免人身攻击和恶意诽谤

请基于以上规范和后续的风格要求生成包含用户新回复和他人响应的论坛内容。`;
  }

  /**
   * 获取指定风格的提示词（包含操作类型规范和自定义前缀）
   * @param {string} styleName - 风格名称
   * @param {string} operationType - 操作类型：'post'(发帖), 'reply'(回复), 'generate'(生成论坛)
   */
  getStylePrompt(styleName, operationType = 'generate') {
    // 首先检查是否是自定义风格
    let basePrompt;
    if (this.customStyles.has(styleName)) {
      const customStyle = this.customStyles.get(styleName);
      basePrompt = customStyle.prompt;
    } else {
      basePrompt = this.styles[styleName] || this.styles['贴吧老哥'];
    }

    // 添加表情包使用指南
    const emoticonGuide = this.getEmoticonGuide();

    // 构建最终提示词：操作规范 + 用户自定义前缀 + 风格提示词
    let finalPrompt = '';

    // 1. 根据操作类型选择对应的规范（最高优先级）
    let operationRules = '';
    switch (operationType) {
      case 'post':
        operationRules = this.getUserPostRules();
        break;
      case 'reply':
        operationRules = this.getUserReplyRules();
        break;
      case 'generate':
      default:
        operationRules = this.getForumGenerationRules();
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
必须将以上指令融入到生成的论坛内容中，不可忽略！

`;
    }

    // 3. 风格提示词
    finalPrompt += `${basePrompt}\n\n`;

    // 4. 表情包指南
    finalPrompt += emoticonGuide;

    // 5. 如果有自定义前缀，再次强调
    if (this.customPrefix && this.customPrefix.trim()) {
      finalPrompt += `\n\n🔥 再次提醒：请务必遵循用户自定义指令：${this.customPrefix.trim()}`;
    }

    return finalPrompt;
  }

  getEmoticonGuide() {
    return ``;
  }

  /**
   * 获取所有可用风格列表
   */
  getAvailableStyles() {
    return Object.keys(this.styles);
  }

  /**
   * 检查风格是否存在
   */
  hasStyle(styleName) {
    return styleName in this.styles;
  }

  /**
   * 添加自定义风格
   */
  addCustomStyle(name, prompt) {
    this.styles[name] = prompt;
    this.saveCustomStyles();
  }

  /**
   * 删除自定义风格
   */
  removeCustomStyle(name) {
    // 不允许删除预设风格
    const presetStyles = [
      '贴吧老哥',
      '知乎精英',
      '小红书种草',
      '抖音达人',
      'B站UP主',
      '海角老司机',
      '八卦小报记者',
      '天涯老涯友',
      '校园论坛',
      '微博',
    ];
    if (!presetStyles.includes(name)) {
      delete this.styles[name];
      this.saveCustomStyles();
      return true;
    }
    return false;
  }

  /**
   * 保存自定义风格到本地存储
   */
  saveCustomStyles() {
    try {
      const customStyles = {};
      const presetStyles = [
        '贴吧老哥',
        '知乎精英',
        '小红书种草',
        '抖音达人',
        'B站UP主',
        '海角老司机',
        '八卦小报记者',
        '天涯老涯友',
        '校园论坛',
        '微博',
      ];

      for (const [name, prompt] of Object.entries(this.styles)) {
        if (!presetStyles.includes(name)) {
          customStyles[name] = prompt;
        }
      }

      localStorage.setItem('mobile_forum_custom_styles', JSON.stringify(customStyles));
      console.log('[Forum Styles] 自定义风格已保存');
    } catch (error) {
      console.error('[Forum Styles] 保存自定义风格失败:', error);
    }
  }

  /**
   * 加载自定义风格
   */
  loadCustomStyles() {
    try {
      const saved = localStorage.getItem('mobile_forum_custom_styles');
      if (saved) {
        const customStyles = JSON.parse(saved);
        Object.assign(this.styles, customStyles);
        console.log('[Forum Styles] 自定义风格已加载');
      }
    } catch (error) {
      console.error('[Forum Styles] 加载自定义风格失败:', error);
    }
  }

  /**
   * 处理表情包占位符
   */
  processEmoticonPlaceholders(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return text.replace(/\[表情:([^\]]+)\]/g, (match, keyword) => {
      const cleanKeyword = keyword.trim();

      // 检查是否是有效关键词
      if (this.emoticons.includes(cleanKeyword)) {
        // 这里可以扩展为实际的表情包URL替换
        return `<span class="emoticon" data-keyword="${cleanKeyword}">[${cleanKeyword}]</span>`;
      }

      return match; // 如果不是有效关键词，保持原样
    });
  }

  // ===========================================
  // 自定义前缀管理方法
  // ===========================================

  /**
   * 设置自定义前缀
   */
  setCustomPrefix(prefix) {
    this.customPrefix = prefix || '';
    this.savePrefixSettings();
    console.log('[Forum Styles] 自定义前缀已更新:', this.customPrefix ? '已设置' : '已清空');
  }

  /**
   * 获取当前自定义前缀
   */
  getCustomPrefix() {
    return this.customPrefix;
  }

  /**
   * 清空自定义前缀
   */
  clearCustomPrefix() {
    this.customPrefix = '';
    this.savePrefixSettings();
    console.log('[Forum Styles] 自定义前缀已清空');
  }

  /**
   * 保存前缀设置到本地存储
   */
  savePrefixSettings() {
    try {
      localStorage.setItem('mobile_forum_custom_prefix', this.customPrefix);
      console.log('[Forum Styles] 前缀设置已保存');
    } catch (error) {
      console.error('[Forum Styles] 保存前缀设置失败:', error);
    }
  }

  /**
   * 加载前缀设置
   */
  loadPrefixSettings() {
    try {
      const saved = localStorage.getItem('mobile_forum_custom_prefix');
      if (saved !== null) {
        this.customPrefix = saved;
        console.log('[Forum Styles] 前缀设置已加载');
      }
    } catch (error) {
      console.error('[Forum Styles] 加载前缀设置失败:', error);
    }
  }

  /**
   * 预览带前缀的风格提示词
   */
  previewStyleWithPrefix(styleName) {
    return this.getStylePrompt(styleName);
  }

  /**
   * 获取前缀设置状态
   */
  getPrefixStatus() {
    return {
      hasPrefix: !!(this.customPrefix && this.customPrefix.trim()),
      prefixLength: this.customPrefix ? this.customPrefix.length : 0,
      previewPrefix: this.customPrefix
        ? this.customPrefix.substring(0, 100) + (this.customPrefix.length > 100 ? '...' : '')
        : '',
      // 全局前缀状态
      hasGlobalPrefix: !!(this.globalBackendPrefix && this.globalBackendPrefix.trim()),
      globalPrefixLength: this.globalBackendPrefix ? this.globalBackendPrefix.length : 0,
      previewGlobalPrefix: this.globalBackendPrefix
        ? this.globalBackendPrefix.substring(0, 100) + (this.globalBackendPrefix.length > 100 ? '...' : '')
        : '',
    };
  }

  // ===========================================
  // 全局后台前缀管理方法
  // ===========================================

  /**
   * 获取全局后台前缀
   */
  getGlobalBackendPrefix() {
    return this.globalBackendPrefix;
  }

  /**
   * 检查是否有全局后台前缀
   */
  hasGlobalBackendPrefix() {
    return !!(this.globalBackendPrefix && this.globalBackendPrefix.trim());
  }

  /**
   * 获取完整的前缀组合预览
   */
  getFullPrefixPreview() {
    let preview = '';

    if (this.globalBackendPrefix && this.globalBackendPrefix.trim()) {
      preview += `=== 全局后台前缀 ===\n${this.globalBackendPrefix.trim()}\n\n`;
    }

    if (this.customPrefix && this.customPrefix.trim()) {
      preview += `=== 用户自定义前缀 ===\n${this.customPrefix.trim()}\n\n`;
    }

    if (!preview) {
      preview = '(无前缀设置)';
    }

    return preview;
  }

  /**
   * 获取前缀优先级说明
   */
  getPrefixPriorityInfo() {
    return {
      priority: [
        '1. 全局后台前缀（开发者设置，最高优先级）',
        '2. 用户自定义前缀（用户在UI中设置）',
        '3. 风格提示词（贴吧老哥、知乎精英等）',
        '4. 表情包使用指南',
      ],
      currentStatus: {
        globalBackend: this.hasGlobalBackendPrefix(),
        userCustom: !!(this.customPrefix && this.customPrefix.trim()),
      },
    };
  }

  /**
   * 获取所有可用的风格名称
   */
  getAvailableStyles() {
    const presetStyles = Object.keys(this.styles);
    const customStyleNames = Array.from(this.customStyles.keys());
    return [...presetStyles, ...customStyleNames];
  }

  // ==================== 自定义风格管理方法 ====================

  /**
   * 加载自定义风格从localStorage
   */
  loadCustomStyles() {
    try {
      const stored = localStorage.getItem('mobile_forum_custom_styles');
      if (stored) {
        const customStylesData = JSON.parse(stored);
        this.customStyles.clear();

        // 将对象转换为Map
        Object.entries(customStylesData).forEach(([key, value]) => {
          if (value && value.isCustom) {
            this.customStyles.set(value.name, value);
          }
        });

        console.log(`[ForumStyles] 加载了 ${this.customStyles.size} 个自定义风格`);
      }
    } catch (error) {
      console.error('[ForumStyles] 加载自定义风格失败:', error);
      this.customStyles.clear();
    }
  }

  /**
   * 保存自定义风格到localStorage
   */
  saveCustomStyles() {
    try {
      const customStylesData = {};
      this.customStyles.forEach((value, key) => {
        customStylesData[value.id] = value;
      });

      localStorage.setItem('mobile_forum_custom_styles', JSON.stringify(customStylesData));
      console.log(`[ForumStyles] 保存了 ${this.customStyles.size} 个自定义风格`);
      return true;
    } catch (error) {
      console.error('[ForumStyles] 保存自定义风格失败:', error);
      return false;
    }
  }

  /**
   * 添加新的自定义风格
   */
  saveCustomStyle(styleData) {
    try {
      // 验证风格数据
      if (!styleData.name || !styleData.prompt) {
        throw new Error('风格名称和内容不能为空');
      }

      // 检查名称是否与预设风格冲突
      if (this.styles[styleData.name]) {
        throw new Error('风格名称与预设风格冲突，请使用其他名称');
      }

      // 设置默认值
      const style = {
        id: styleData.id || 'custom_' + Date.now(),
        name: styleData.name,
        description: styleData.description || '',
        prompt: styleData.prompt,
        createdAt: styleData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCustom: true,
      };

      // 保存到内存
      this.customStyles.set(style.name, style);

      // 保存到localStorage
      if (this.saveCustomStyles()) {
        console.log(`[ForumStyles] 成功保存自定义风格: ${style.name}`);
        return style;
      } else {
        throw new Error('保存到本地存储失败');
      }
    } catch (error) {
      console.error('[ForumStyles] 保存自定义风格失败:', error);
      throw error;
    }
  }

  /**
   * 删除自定义风格
   */
  deleteCustomStyle(styleName) {
    try {
      if (!this.customStyles.has(styleName)) {
        throw new Error('风格不存在');
      }

      this.customStyles.delete(styleName);

      if (this.saveCustomStyles()) {
        console.log(`[ForumStyles] 成功删除自定义风格: ${styleName}`);
        return true;
      } else {
        throw new Error('保存到本地存储失败');
      }
    } catch (error) {
      console.error('[ForumStyles] 删除自定义风格失败:', error);
      throw error;
    }
  }

  /**
   * 获取自定义风格
   */
  getCustomStyle(styleName) {
    return this.customStyles.get(styleName);
  }

  /**
   * 获取所有自定义风格
   */
  getAllCustomStyles() {
    return Array.from(this.customStyles.values());
  }

  /**
   * 检查是否是自定义风格
   */
  isCustomStyle(styleName) {
    return this.customStyles.has(styleName);
  }

  /**
   * 导出所有自定义风格
   */
  exportCustomStyles() {
    try {
      const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        styles: Array.from(this.customStyles.values()),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[ForumStyles] 导出自定义风格失败:', error);
      throw error;
    }
  }

  /**
   * 导入自定义风格
   */
  importCustomStyles(jsonData, options = {}) {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.styles || !Array.isArray(importData.styles)) {
        throw new Error('无效的导入数据格式');
      }

      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
      };

      importData.styles.forEach((style, index) => {
        try {
          // 检查是否已存在
          if (this.customStyles.has(style.name) && !options.overwrite) {
            results.skipped++;
            return;
          }

          // 验证风格数据
          if (!style.name || !style.prompt) {
            throw new Error('风格名称和内容不能为空');
          }

          // 重新生成ID和时间戳
          const newStyle = {
            ...style,
            id: 'custom_' + Date.now() + '_' + index,
            updatedAt: new Date().toISOString(),
            isCustom: true,
          };

          this.customStyles.set(newStyle.name, newStyle);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`风格 "${style.name || 'Unknown'}": ${error.message}`);
        }
      });

      // 保存到localStorage
      if (results.success > 0) {
        this.saveCustomStyles();
      }

      console.log(`[ForumStyles] 导入完成: 成功${results.success}, 失败${results.failed}, 跳过${results.skipped}`);
      return results;
    } catch (error) {
      console.error('[ForumStyles] 导入自定义风格失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有自定义风格
   */
  clearCustomStyles() {
    try {
      this.customStyles.clear();
      localStorage.removeItem('mobile_forum_custom_styles');
      console.log('[ForumStyles] 已清空所有自定义风格');
      return true;
    } catch (error) {
      console.error('[ForumStyles] 清空自定义风格失败:', error);
      return false;
    }
  }
}

// 创建全局实例
window.forumStyles = new ForumStyles();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForumStyles;
}
