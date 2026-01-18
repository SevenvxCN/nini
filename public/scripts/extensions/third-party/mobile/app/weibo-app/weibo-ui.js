/**
 * 微博UI管理器
 * 负责微博界面的显示和数据处理
 */
class WeiboUI {
  constructor() {
    this.currentPage = 'hot'; // 当前页面：hot, ranking, user
    this.currentPostId = null;
    this.clickHandler = null;
    this.likeClickHandler = null;
    // 点赞数据存储 - 格式: { postId: { likes: number, isLiked: boolean }, ... }
    this.likesData = {};
    // 评论点赞数据存储 - 格式: { commentId: { likes: number, isLiked: boolean }, ... }
    this.commentLikesData = {};

    // 头像颜色数组
    this.avatarColors = [
      'var(--avatar-gradient-1)', // 原有粉色渐变
      'var(--avatar-color-1)', // #b28cb9
      'var(--avatar-color-2)', // #e2b3d4
      'var(--avatar-color-3)', // #f7d1e6
      'var(--avatar-color-4)', // #d49ec2
      'var(--avatar-color-5)', // #f3c6d7
      'var(--avatar-color-6)', // #ec97b7
      'var(--avatar-color-7)', // #d66a88
      'var(--avatar-color-8)', // #b74d66
      'var(--avatar-color-9)', // #e3d6a7
      'var(--avatar-color-10)', // #c8ac6d
      'var(--avatar-color-11)', // #a0d8e1
      'var(--avatar-color-12)', // #2e8b9b
      'var(--avatar-color-13)', // #1a6369
      'var(--avatar-color-14)', // #0e3d45
      'var(--avatar-color-15)', // #6ba1e1
      'var(--avatar-color-16)', // #1f5e8d
      'var(--avatar-color-17)', // #b7d3a8
      'var(--avatar-color-18)', // #3e7b41
      'var(--avatar-color-19)', // #f9e79f
      'var(--avatar-color-20)', // #a3b4e2
    ];

    // 优化版方案5：数据变化检测和增量替换
    this.lastDataFingerprints = {
      hotSearches: null,
      rankings: null,
      rankingPosts: null,
      userStats: null,
      lastUpdateTime: 0,
    };
    this.persistentData = {
      hotSearches: [],
      rankings: [],
      rankingPosts: [], // 榜单博文独立存储
      userStats: null,
    };

    this.init();
  }

  init() {
    console.log('[Weibo UI] 微博UI管理器初始化');

    // 🔥 新增：启动评论布局监控
    this.startCommentLayoutMonitor();
  }

  /**
   * 🔥 评论布局监控器 - 防止CSS被覆盖导致的布局错乱
   */
  startCommentLayoutMonitor() {
    // 创建一个MutationObserver来监控DOM变化
    const observer = new MutationObserver(mutations => {
      let needsLayoutFix = false;

      mutations.forEach(mutation => {
        // 检查是否有新的评论元素被添加
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList?.contains('comment-item') || node.querySelector?.('.comment-item')) {
                needsLayoutFix = true;
              }
            }
          });
        }

        // 检查是否有样式属性被修改
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')
        ) {
          const target = mutation.target;
          if (target.classList?.contains('comment-author') || target.classList?.contains('comment-info')) {
            needsLayoutFix = true;
          }
        }
      });

      if (needsLayoutFix) {
        // 延迟执行修复，避免频繁操作
        clearTimeout(this.layoutFixTimeout);
        this.layoutFixTimeout = setTimeout(() => {
          this.fixCommentLayout();
        }, 100);
      }
    });

    // 开始观察整个微博应用容器
    const weiboApp = document.querySelector('.weibo-app');
    if (weiboApp) {
      observer.observe(weiboApp, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      console.log('[Weibo UI] 🔥 评论布局监控器已启动');
    }

    // 立即执行一次布局修复
    this.fixCommentLayout();
  }

  /**
   * 🔥 修复评论布局 - 强制应用正确的CSS样式
   */
  fixCommentLayout() {
    const commentItems = document.querySelectorAll('.weibo-app .comment-item');
    let fixedCount = 0;

    commentItems.forEach(commentItem => {
      const commentAuthor = commentItem.querySelector('.comment-author');
      const commentInfo = commentItem.querySelector('.comment-info');
      const commentContent = commentItem.querySelector('.comment-content');
      const commentActions = commentItem.querySelector('.comment-actions');

      if (commentAuthor) {
        // 强制设置评论作者区域为水平布局
        const authorStyle = commentAuthor.style;
        const authorComputed = window.getComputedStyle(commentAuthor);

        if (authorComputed.flexDirection !== 'row' || authorComputed.display !== 'flex') {
          authorStyle.setProperty('display', 'flex', 'important');
          authorStyle.setProperty('flex-direction', 'row', 'important');
          authorStyle.setProperty('align-items', 'center', 'important');
          authorStyle.setProperty('flex-wrap', 'nowrap', 'important');
          authorStyle.setProperty('gap', '8px', 'important');
          fixedCount++;
        }
      }

      if (commentInfo) {
        // 强制设置评论信息区域为垂直布局
        const infoStyle = commentInfo.style;
        const infoComputed = window.getComputedStyle(commentInfo);

        if (infoComputed.flexDirection !== 'column' || infoComputed.display !== 'flex') {
          infoStyle.setProperty('display', 'flex', 'important');
          infoStyle.setProperty('flex-direction', 'column', 'important');
          infoStyle.setProperty('flex', '1', 'important');
          infoStyle.setProperty('min-width', '0', 'important');
          fixedCount++;
        }
      }

      if (commentContent) {
        // 确保评论内容正确显示
        const contentStyle = commentContent.style;
        contentStyle.setProperty('display', 'block', 'important');
        contentStyle.setProperty('width', '100%', 'important');
        contentStyle.setProperty('margin-bottom', '8px', 'important');
      }

      if (commentActions) {
        // 确保评论操作按钮正确布局
        const actionsStyle = commentActions.style;
        const actionsComputed = window.getComputedStyle(commentActions);

        if (actionsComputed.flexDirection !== 'row' || actionsComputed.display !== 'flex') {
          actionsStyle.setProperty('display', 'flex', 'important');
          actionsStyle.setProperty('flex-direction', 'row', 'important');
          actionsStyle.setProperty('align-items', 'center', 'important');
          actionsStyle.setProperty('justify-content', 'center', 'important');
          actionsStyle.setProperty('gap', '20px', 'important');
        }
      }
    });

    if (fixedCount > 0) {
      console.log(`[Weibo UI] 🔧 修复了 ${fixedCount} 个评论布局问题`);
    }
  }

  /**
   * 🔥 手动修复评论布局 - 提供给用户的控制台命令
   */
  static manualFixCommentLayout() {
    console.log('[Weibo UI] 🔧 手动修复评论布局...');

    const commentItems = document.querySelectorAll('.weibo-app .comment-item');
    let fixedCount = 0;

    commentItems.forEach((commentItem, index) => {
      console.log(`[Weibo UI] 检查评论 ${index + 1}/${commentItems.length}`);

      const commentAuthor = commentItem.querySelector('.comment-author');
      const commentInfo = commentItem.querySelector('.comment-info');
      const commentContent = commentItem.querySelector('.comment-content');
      const commentActions = commentItem.querySelector('.comment-actions');

      // 强制重置评论项的布局
      commentItem.style.setProperty('display', 'block', 'important');
      commentItem.style.setProperty('width', '100%', 'important');

      if (commentAuthor) {
        console.log(`[Weibo UI] 修复评论作者布局 ${index + 1}`);
        const authorStyle = commentAuthor.style;

        // 清除可能的冲突样式
        authorStyle.removeProperty('flex-direction');
        authorStyle.removeProperty('display');

        // 重新应用正确样式
        authorStyle.setProperty('display', 'flex', 'important');
        authorStyle.setProperty('flex-direction', 'row', 'important');
        authorStyle.setProperty('align-items', 'center', 'important');
        authorStyle.setProperty('flex-wrap', 'nowrap', 'important');
        authorStyle.setProperty('gap', '8px', 'important');
        authorStyle.setProperty('margin-bottom', '8px', 'important');
        authorStyle.setProperty('width', '100%', 'important');
        fixedCount++;
      }

      if (commentInfo) {
        console.log(`[Weibo UI] 修复评论信息布局 ${index + 1}`);
        const infoStyle = commentInfo.style;

        // 清除可能的冲突样式
        infoStyle.removeProperty('flex-direction');
        infoStyle.removeProperty('display');

        // 重新应用正确样式
        infoStyle.setProperty('display', 'flex', 'important');
        infoStyle.setProperty('flex-direction', 'column', 'important');
        infoStyle.setProperty('flex', '1', 'important');
        infoStyle.setProperty('min-width', '0', 'important');
        infoStyle.setProperty('overflow', 'hidden', 'important');
        fixedCount++;
      }

      if (commentContent) {
        const contentStyle = commentContent.style;
        contentStyle.setProperty('display', 'block', 'important');
        contentStyle.setProperty('width', '100%', 'important');
        contentStyle.setProperty('margin-bottom', '8px', 'important');
      }

      if (commentActions) {
        const actionsStyle = commentActions.style;
        actionsStyle.setProperty('display', 'flex', 'important');
        actionsStyle.setProperty('flex-direction', 'row', 'important');
        actionsStyle.setProperty('align-items', 'center', 'important');
        actionsStyle.setProperty('justify-content', 'center', 'important');
        actionsStyle.setProperty('gap', '20px', 'important');
        actionsStyle.setProperty('margin-top', '8px', 'important');
        actionsStyle.setProperty('width', '100%', 'important');
      }
    });

    console.log(`[Weibo UI] ✅ 手动修复完成，处理了 ${commentItems.length} 个评论项，修复了 ${fixedCount} 个布局问题`);
    return { total: commentItems.length, fixed: fixedCount };
  }

  /**
   * 计算数据指纹（轻量级哈希）
   */
  calculateDataFingerprint(data, type) {
    if (!data) return null;

    let content = '';
    switch (type) {
      case 'hotSearches':
        content = data.map(item => `${item.rank}:${item.title}:${item.heat}`).join('|');
        break;
      case 'rankings':
        content = data
          .map(
            ranking =>
              `${ranking.title}:${ranking.type}:${ranking.items
                .map(item => `${item.rank}:${item.name}:${item.heat}`)
                .join(',')}`,
          )
          .join('|');
        break;
      case 'rankingPosts':
        content = data.map(post => `${post.id}:${post.author}:${post.content.substring(0, 50)}`).join('|');
        break;
      case 'userStats':
        content = data ? `${data.fans}:${data.following}:${data.posts}` : '';
        break;
      default:
        content = JSON.stringify(data);
    }

    // 简单哈希算法（轻量级）
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 检测数据是否有变化
   */
  detectDataChanges(newContent) {
    const currentTime = Date.now();
    const changes = {
      hotSearches: false,
      rankings: false,
      rankingPosts: false,
      userStats: false,
      hasAnyChange: false,
    };

    // 检测各种数据格式是否存在
    const hasHotSearchPattern = /\[热搜\|/.test(newContent);
    const hasRankingPattern = /\[榜单\|/.test(newContent) || /\[榜单项\|/.test(newContent);
    const hasRankingPostPattern = /\[博文\|[^|]+\|r\d+\|/.test(newContent); // 榜单博文ID以r开头
    const hasUserStatsPattern = /\[粉丝数\|/.test(newContent);

    console.log('[Weibo UI] 🔍 数据格式检测:', {
      hasHotSearchPattern,
      hasRankingPattern,
      hasRankingPostPattern,
      hasUserStatsPattern,
    });

    // 只有当检测到对应格式时，才标记为需要更新
    if (hasHotSearchPattern) {
      changes.hotSearches = true;
      changes.hasAnyChange = true;
      console.log('[Weibo UI] ✅ 检测到热搜数据更新');
    }

    if (hasRankingPattern) {
      changes.rankings = true;
      changes.hasAnyChange = true;
      console.log('[Weibo UI] ✅ 检测到榜单数据更新');
    }

    if (hasRankingPostPattern) {
      changes.rankingPosts = true;
      changes.hasAnyChange = true;
      console.log('[Weibo UI] ✅ 检测到榜单博文更新');
    }

    if (hasUserStatsPattern) {
      changes.userStats = true;
      changes.hasAnyChange = true;
      console.log('[Weibo UI] ✅ 检测到粉丝数据更新');
    }

    // 更新最后检测时间
    if (changes.hasAnyChange) {
      this.lastDataFingerprints.lastUpdateTime = currentTime;
    }

    return changes;
  }

  /**
   * 基于用户名生成稳定的哈希值
   */
  hashUsername(username) {
    let hash = 0;
    if (username.length === 0) return hash;

    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }

    return Math.abs(hash);
  }

  /**
   * 根据用户名获取头像颜色
   */
  getAvatarColor(username) {
    // 检查是否是当前用户（大号或小号）
    let currentUsername = this.getCurrentUsername();
    if (currentUsername === '{{user}}') {
      currentUsername = this.getRealUsername();
    }
    const isMainAccount = window.weiboManager ? window.weiboManager.currentAccount.isMainAccount : true;

    // 检查是否是当前用户（支持多种用户名格式）
    if (
      username === currentUsername ||
      username === '{{user}}' ||
      (username === 'User' && currentUsername === 'User')
    ) {
      // 如果是当前用户，根据账户类型返回特定颜色
      return isMainAccount ? '#C4B7D6' : '#A37070';
    }

    // 其他用户使用原有的颜色系统
    const hash = this.hashUsername(username);
    const colorIndex = hash % this.avatarColors.length;
    return this.avatarColors[colorIndex];
  }

  /**
   * 生成带颜色的头像HTML
   */
  generateAvatarHTML(username, size = '') {
    const color = this.getAvatarColor(username);
    const sizeClass = size ? ` ${size}` : '';
    const initial = username[0] || '?';

    return `<div class="author-avatar${sizeClass}" style="background: ${color}">${initial}</div>`;
  }

  /**
   * 从消息中实时解析微博内容（优化版方案5：增量替换）
   */
  parseWeiboContent(content) {
    // 提取微博标记之间的内容
    const weiboRegex = /<!-- WEIBO_CONTENT_START -->([\s\S]*?)<!-- WEIBO_CONTENT_END -->/;
    const match = content.match(weiboRegex);

    if (!match) {
      console.log('[Weibo UI] 未找到微博内容');
      return {
        posts: [],
        comments: {},
        hotSearches: this.persistentData.hotSearches,
        rankings: this.persistentData.rankings,
        rankingPosts: this.persistentData.rankingPosts,
        userStats: this.persistentData.userStats,
      };
    }

    const weiboContent = match[1];
    console.log('[Weibo UI] 🔍 开始解析微博内容，启用增量替换机制');

    // 检测数据变化
    const changes = this.detectDataChanges(weiboContent);

    // 初始化解析结果
    const posts = [];
    const comments = {};
    let hotSearches = this.persistentData.hotSearches; // 默认使用持久化数据
    let rankings = this.persistentData.rankings;
    let rankingPosts = this.persistentData.rankingPosts;
    let userStats = this.persistentData.userStats;

    // 解析博文格式: [博文|发博人昵称|博文id|博文内容]
    const postRegex = /\[博文\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    let postMatch;
    const newRankingPosts = []; // 临时存储新的榜单博文

    while ((postMatch = postRegex.exec(weiboContent)) !== null) {
      const postId = postMatch[2];
      const post = {
        id: postId,
        author: postMatch[1],
        content: postMatch[3],
        timestamp: new Date().toLocaleString(),
        likes: Math.floor(Math.random() * 1000) + 10, // 随机点赞数
        comments: Math.floor(Math.random() * 100) + 5, // 随机评论数
        shares: Math.floor(Math.random() * 50) + 1, // 随机转发数
        // 根据ID前缀确定类型
        type: postId.startsWith('h') ? 'hot' : postId.startsWith('r') ? 'ranking' : 'user',
      };

      // 榜单博文单独处理
      if (postId.startsWith('r')) {
        newRankingPosts.push(post);
        console.log('[Weibo UI] 📊 发现榜单博文:', postId);
      } else {
        posts.push(post);
      }
      comments[post.id] = [];
    }

    // 如果检测到榜单博文更新，替换旧数据
    if (changes.rankingPosts && newRankingPosts.length > 0) {
      rankingPosts = newRankingPosts;
      this.persistentData.rankingPosts = rankingPosts;
      console.log('[Weibo UI] ✅ 榜单博文已更新，替换旧数据:', rankingPosts.length, '条');
    }

    // 解析评论格式: [评论|评论人昵称|博文id|评论内容]
    const commentRegex = /\[评论\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    let commentMatch;
    while ((commentMatch = commentRegex.exec(weiboContent)) !== null) {
      const comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        postId: commentMatch[2],
        author: commentMatch[1],
        content: commentMatch[3],
        timestamp: new Date().toLocaleString(),
        likes: Math.floor(Math.random() * 50) + 1,
      };

      if (comments[comment.postId]) {
        comments[comment.postId].push(comment);
      }
    }

    // 解析回复格式: [回复|回复人昵称|博文id|回复内容]
    const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    let replyMatch;
    while ((replyMatch = replyRegex.exec(weiboContent)) !== null) {
      const reply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        postId: replyMatch[2],
        author: replyMatch[1],
        content: replyMatch[3],
        timestamp: new Date().toLocaleString(),
        likes: Math.floor(Math.random() * 20) + 1,
        isReply: true,
      };

      if (comments[reply.postId]) {
        comments[reply.postId].push(reply);
      }
    }

    // 解析热搜格式: [热搜|排名|热搜标题|热度值] - 增量替换
    if (changes.hotSearches) {
      const newHotSearches = [];
      const hotSearchRegex = /\[热搜\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
      let hotSearchMatch;
      while ((hotSearchMatch = hotSearchRegex.exec(weiboContent)) !== null) {
        const hotSearch = {
          rank: parseInt(hotSearchMatch[1]),
          title: hotSearchMatch[2],
          heat: hotSearchMatch[3],
          icon: this.getHotSearchIcon(parseInt(hotSearchMatch[1])),
        };
        newHotSearches.push(hotSearch);
      }

      if (newHotSearches.length > 0) {
        hotSearches = newHotSearches;
        this.persistentData.hotSearches = hotSearches;
        console.log('[Weibo UI] ✅ 热搜数据已更新，替换旧数据:', hotSearches.length, '条');
      }
    }

    // 解析榜单格式: [榜单|榜单名称|榜单类型] 和 [榜单项|排名|名称|热度值] - 增量替换
    if (changes.rankings) {
      const newRankings = [];
      const rankingTitleRegex = /\[榜单\|([^|]+)\|([^\]]+)\]/g;
      const rankingItemRegex = /\[榜单项\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;

      let rankingTitleMatch;
      while ((rankingTitleMatch = rankingTitleRegex.exec(weiboContent)) !== null) {
        newRankings.push({
          title: rankingTitleMatch[1],
          type: rankingTitleMatch[2],
          items: [],
        });
      }

      let rankingItemMatch;
      while ((rankingItemMatch = rankingItemRegex.exec(weiboContent)) !== null) {
        const item = {
          rank: parseInt(rankingItemMatch[1]),
          name: rankingItemMatch[2],
          heat: rankingItemMatch[3],
        };

        // 添加到最后一个榜单
        if (newRankings.length > 0) {
          newRankings[newRankings.length - 1].items.push(item);
        }
      }

      if (newRankings.length > 0) {
        rankings = newRankings;
        this.persistentData.rankings = rankings;
        console.log('[Weibo UI] ✅ 榜单数据已更新，替换旧数据:', rankings.length, '个榜单');
      }
    }

    // 解析粉丝数格式: [粉丝数|大号粉丝数|小号粉丝数] - 增量替换
    if (changes.userStats) {
      const fansRegex = /\[粉丝数\|([^|]+)\|([^\]]+)\]/g;
      let fansMatch;
      while ((fansMatch = fansRegex.exec(weiboContent)) !== null) {
        const newUserStats = {
          mainAccountFans: fansMatch[1], // 大号粉丝数
          aliasAccountFans: fansMatch[2], // 小号粉丝数
          following: '100', // 固定关注数
          posts: posts.filter(p => p.author === this.getCurrentUsername()).length,
        };

        userStats = newUserStats;
        this.persistentData.userStats = userStats;
        console.log(
          '[Weibo UI] ✅ 粉丝数据已更新 - 大号:',
          userStats.mainAccountFans,
          '小号:',
          userStats.aliasAccountFans,
        );
        break; // 只取第一个匹配的粉丝数
      }
    }

    console.log('[Weibo UI] 📊 解析完成（增量替换）:', {
      posts: posts.length,
      comments: Object.keys(comments).length,
      hotSearches: hotSearches.length,
      rankings: rankings.length,
      rankingPosts: rankingPosts.length,
      userStats: userStats ? `大号粉丝${userStats.mainAccountFans} 小号粉丝${userStats.aliasAccountFans}` : '无',
      changes: changes,
    });

    return { posts, comments, hotSearches, rankings, rankingPosts, userStats };
  }

  /**
   * 获取热搜图标
   */
  getHotSearchIcon(rank) {
    if (rank <= 3) {
      return '<i class="fas fa-fire" style="color: #ff8500;"></i>';
    } else if (rank <= 10) {
      return '<i class="fas fa-arrow-up" style="color: #ff9500;"></i>';
    } else {
      return '<i class="fas fa-circle" style="color: #999;"></i>';
    }
  }

  /**
   * 获取当前用户名
   */
  getCurrentUsername() {
    if (window.weiboManager && window.weiboManager.getCurrentUsername) {
      const username = window.weiboManager.getCurrentUsername();
      // 如果是{{user}}，尝试从SillyTavern获取真实用户名
      if (username === '{{user}}') {
        return this.getRealUsername();
      }
      return username;
    }
    return this.getRealUsername();
  }

  /**
   * 获取真实用户名（从SillyTavern）
   */
  getRealUsername() {
    try {
      console.log('[Weibo UI] 开始获取真实用户名...');

      // 方法1: 从SillyTavern的全局变量获取
      if (typeof window.name1 !== 'undefined' && window.name1 && window.name1.trim() && window.name1 !== '{{user}}') {
        console.log('[Weibo UI] 从name1获取用户名:', window.name1);
        return window.name1.trim();
      }

      // 方法2: 从power_user获取
      if (
        window.power_user &&
        window.power_user.name &&
        window.power_user.name.trim() &&
        window.power_user.name !== '{{user}}'
      ) {
        console.log('[Weibo UI] 从power_user获取用户名:', window.power_user.name);
        return window.power_user.name.trim();
      }

      // 方法3: 从getContext获取
      if (window.getContext) {
        const context = window.getContext();
        if (context && context.name1 && context.name1.trim() && context.name1 !== '{{user}}') {
          console.log('[Weibo UI] 从context获取用户名:', context.name1);
          return context.name1.trim();
        }
      }

      // 方法4: 从localStorage获取
      const storedName = localStorage.getItem('name1');
      if (storedName && storedName.trim() && storedName !== '{{user}}') {
        console.log('[Weibo UI] 从localStorage获取用户名:', storedName);
        return storedName.trim();
      }

      // 方法5: 尝试从SillyTavern的其他全局变量获取
      if (
        typeof window.user_name !== 'undefined' &&
        window.user_name &&
        window.user_name.trim() &&
        window.user_name !== '{{user}}'
      ) {
        console.log('[Weibo UI] 从user_name获取用户名:', window.user_name);
        return window.user_name.trim();
      }

      // 方法6: 从聊天数据中获取最新的用户消息作者
      if (window.mobileContextEditor) {
        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (chatData && chatData.messages) {
          // 找到最后一条用户消息
          for (let i = chatData.messages.length - 1; i >= 0; i--) {
            const msg = chatData.messages[i];
            if (msg.is_user && msg.name && msg.name.trim() && msg.name !== '{{user}}' && msg.name !== 'User') {
              console.log('[Weibo UI] 从聊天记录获取用户名:', msg.name);
              return msg.name.trim();
            }
          }
        }
      }

      // 方法7: 尝试从DOM中的用户输入框获取
      const userNameInput = document.querySelector('#user_name, input[name="user_name"], .user-name-input');
      if (userNameInput && userNameInput.value && userNameInput.value.trim() && userNameInput.value !== '{{user}}') {
        console.log('[Weibo UI] 从用户名输入框获取用户名:', userNameInput.value);
        return userNameInput.value.trim();
      }

      console.log('[Weibo UI] 所有方法都未能获取到有效用户名，检查可用的全局变量...');
      console.log('[Weibo UI] window.name1:', window.name1);
      console.log('[Weibo UI] window.power_user:', window.power_user);
      console.log('[Weibo UI] window.user_name:', window.user_name);
    } catch (error) {
      console.warn('[Weibo UI] 获取用户名失败:', error);
    }

    console.log('[Weibo UI] 使用默认用户名: User');
    return 'User';
  }

  /**
   * 获取当前账户类型
   */
  getCurrentAccountType() {
    if (window.weiboManager && window.weiboManager.currentAccount) {
      return window.weiboManager.currentAccount.isMainAccount ? '大号' : '小号';
    }
    return '大号';
  }

  /**
   * 渲染热搜页面
   */
  renderHotPage(data) {
    const { posts, comments, hotSearches } = data;
    // 只显示热搜相关的博文（ID以h开头）
    const hotPosts = posts.filter(post => post.type === 'hot');

    let html = `
      <div class="weibo-page hot-page">
        <!-- 热搜列表 -->
        <div class="hot-search-section">
          <div class="section-header">
            <i class="fas fa-fire"></i>
            <span>微博热搜</span>
          </div>
          <div class="hot-search-list">
    `;

    // 渲染热搜条目
    hotSearches.forEach(search => {
      html += `
        <div class="hot-search-item" data-rank="${search.rank}">
          <div class="search-rank">${search.rank}</div>
          <div class="search-content">
            <div class="search-title">${search.title}</div>
            <div class="search-heat">${search.heat}</div>
          </div>
          <div class="search-icon">${search.icon}</div>
        </div>
      `;
    });

    html += `
          </div>
        </div>

        <!-- 热搜博文 -->
        <div class="posts-section">
          <div class="section-header">
            <i class="fas fa-comments"></i>
            <span>热搜讨论</span>
          </div>
          <div class="posts-list">
    `;

    // 按时间排序博文（新的在前）
    hotPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 渲染博文
    hotPosts.forEach(post => {
      const postComments = comments[post.id] || [];
      html += this.renderPost(post, postComments, true); // 热搜页面的博文可以回复
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * 渲染榜单页面
   */
  renderRankingPage(data) {
    const { posts, comments, rankings, rankingPosts } = data;
    // 使用独立的榜单博文数据（优化版方案5）
    const actualRankingPosts = rankingPosts || posts.filter(post => post.type === 'ranking');
    console.log('[Weibo UI] 📊 榜单页面使用博文数据:', actualRankingPosts.length, '条');

    let html = `
      <div class="weibo-page ranking-page">
        <!-- 榜单列表 -->
        <div class="ranking-section">
    `;

    // 渲染榜单
    rankings.forEach(ranking => {
      html += `
        <div class="ranking-container">
          <div class="section-header">
            <i class="fas fa-trophy"></i>
            <span>${ranking.title}</span>
            <span class="ranking-type">${ranking.type}</span>
          </div>
          <div class="ranking-list">
      `;

      // 渲染榜单项目
      ranking.items.forEach(item => {
        const rankClass = item.rank <= 3 ? 'top-rank' : '';
        html += `
          <div class="ranking-item ${rankClass}" data-rank="${item.rank}">
            <div class="item-rank">${item.rank}</div>
            <div class="item-content">
              <div class="item-name">${item.name}</div>
              <div class="item-heat">${item.heat}</div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>

        <!-- 榜单相关博文 -->
        <div class="posts-section">
          <div class="section-header">
            <i class="fas fa-comments"></i>
            <span>榜单讨论</span>
          </div>
          <div class="posts-list">
    `;

    // 按时间排序博文（新的在前）
    actualRankingPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 渲染博文（榜单页面的博文可以点赞但不能回复）
    actualRankingPosts.forEach(post => {
      const postComments = comments[post.id] || [];
      html += this.renderPost(post, postComments, false); // 榜单页面的博文不能回复
    });

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * 渲染用户页面
   */
  renderUserPage(data) {
    const { posts, comments, userStats } = data;
    // 优先从微博管理器获取当前账户的用户名，确保账户切换后显示正确
    let currentUsername = this.getCurrentUsername();
    console.log('[Weibo UI] 用户页面使用的用户名:', currentUsername);

    // 如果获取到的用户名是 'User' 或无效，尝试从其他地方获取
    if (!currentUsername || currentUsername === 'User' || currentUsername === '{{user}}') {
      console.log('[Weibo UI] 检测到无效用户名，尝试从其他来源获取...');

      // 尝试从SillyTavern获取真实用户名
      const realUsername = this.getRealUsername();
      if (realUsername && realUsername !== 'User' && realUsername !== '{{user}}') {
        currentUsername = realUsername;
        console.log('[Weibo UI] 从SillyTavern获取到用户名:', currentUsername);
      }

      // 如果还是无效，尝试从DOM中获取已设置的用户名
      if (!currentUsername || currentUsername === 'User' || currentUsername === '{{user}}') {
        const profileNameElement = document.querySelector('.profile-name');
        if (
          profileNameElement &&
          profileNameElement.textContent &&
          profileNameElement.textContent !== 'User' &&
          profileNameElement.textContent !== '{{user}}'
        ) {
          currentUsername = profileNameElement.textContent;
          console.log('[Weibo UI] 从DOM获取到用户名:', currentUsername);
        }
      }
    }

    const accountType = this.getCurrentAccountType();
    // 只显示用户相关的博文（ID以u开头）
    const userPosts = posts.filter(post => post.type === 'user');

    // 根据当前账户获取对应的粉丝数
    const isMainAccount = this.getCurrentAccountType() === '大号';
    const currentFans = userStats ? (isMainAccount ? userStats.mainAccountFans : userStats.aliasAccountFans) : '0';

    // 如果没有用户统计数据，使用默认值
    const stats = {
      fans: currentFans || '0',
      following: '100',
      posts: posts.filter(p => p.author === currentUsername).length,
    };

    console.log('[Weibo UI] 用户页面统计信息:', {
      isMainAccount,
      currentFans,
      userStats: userStats
        ? {
            mainAccountFans: userStats.mainAccountFans,
            aliasAccountFans: userStats.aliasAccountFans,
          }
        : null,
    });

    let html = `
      <div class="weibo-page user-page">
        <!-- 用户信息 -->
        <div class="user-info-section">
          <div class="user-header">
            <div class="user-avatar-large">
              ${this.generateAvatarHTML(currentUsername, 'large')}
            </div>
            <div class="user-details">
              <div class="user-name-container">
                <div class="profile-name">${currentUsername}</div>
                <button class="edit-name-btn" title="编辑用户名">
                  <i class="fas fa-edit"></i>
                </button>
              </div>
              <div class="account-type">${accountType}</div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-number">${stats.posts}</div>
              <div class="stat-label">微博</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.following}</div>
              <div class="stat-label">关注</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.fans}</div>
              <div class="stat-label">粉丝</div>
            </div>
          </div>
        </div>

        <!-- 用户博文 -->
        <div class="posts-section">
          <div class="section-header">
            <i class="fas fa-user"></i>
            <span>我的微博</span>
          </div>
          <div class="posts-list">
    `;

    // 渲染用户的博文（按时间排序，最新的在前）
    // 获取可能的用户名列表进行匹配
    const possibleUsernames = [currentUsername, this.getRealUsername(), '{{user}}', 'User'].filter(
      name => name && name.trim(),
    ); // 过滤空值

    // 从用户博文中过滤出当前用户的博文
    console.log('[Weibo UI] 用户名匹配调试:', {
      possibleUsernames,
      userPostsAuthors: userPosts.map(p => p.author),
      userPostsCount: userPosts.length,
    });

    const currentUserPosts = userPosts.filter(post => {
      // 检查博文作者是否匹配任何可能的用户名
      const isMatch = possibleUsernames.some(
        username => post.author === username || post.author.toLowerCase() === username.toLowerCase(),
      );
      if (isMatch) {
        console.log('[Weibo UI] 找到匹配的用户博文:', post.author, post.content);
      }
      return isMatch;
    });

    // 如果没有匹配的博文，显示所有用户类型的博文（兜底逻辑）
    const postsToShow = currentUserPosts.length > 0 ? currentUserPosts : userPosts;

    // 按时间排序博文（新的在前）
    postsToShow.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    postsToShow.forEach(post => {
      const postComments = comments[post.id] || [];
      html += this.renderPost(post, postComments, true); // 用户页面的博文可以回复
    });

    // 如果没有博文，显示提示
    if (userPosts.length === 0) {
      html += `
        <div class="empty-posts">
          <i class="fas fa-edit"></i>
          <p>还没有发布过微博</p>
          <p>点击右上角的"发博"按钮开始分享吧！</p>
        </div>
      `;
    }

    html += `
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * 渲染单个博文
   */
  renderPost(post, postComments, canReply = true) {
    const likeData = this.likesData[post.id] || { likes: post.likes, isLiked: false };
    const likeClass = likeData.isLiked ? 'liked' : '';

    let html = `
      <div class="weibo-post" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-author">
            ${this.generateAvatarHTML(post.author)}
            <div class="author-info">
              <div class="author-name">${post.author}</div>
              <div class="post-time">${post.timestamp}</div>
            </div>
          </div>
          <button class="delete-btn weibo-delete-btn" data-post-id="${post.id}" title="删除微博">删除</button>
        </div>

        <div class="post-content">
          ${this.formatPostContent(post.content)}
        </div>

        <div class="post-actions">
          <button class="action-btn like-btn ${likeClass}" data-post-id="${post.id}">
            <i class="fas fa-heart"></i>
            <span>${likeData.likes}</span>
          </button>
          ${
            canReply
              ? `
          <button class="action-btn comment-btn" data-post-id="${post.id}">
            <i class="fas fa-comment"></i>
            <span>${postComments.length}</span>
          </button>
          `
              : `
          <span class="action-info">
            <i class="fas fa-comment"></i>
            <span>${postComments.length}</span>
          </span>
          `
          }
          <button class="action-btn share-btn" data-post-id="${post.id}">
            <i class="fas fa-share"></i>
            <span>${post.shares || 0}</span>
          </button>
        </div>
    `;

    // 渲染评论
    if (postComments.length > 0) {
      html += `
        <div class="post-comments">
          <div class="comments-header">
            <span>评论 ${postComments.length}</span>
          </div>
          <div class="comments-list">
      `;

      postComments.forEach(comment => {
        const commentLikeData = this.commentLikesData[comment.id] || { likes: comment.likes, isLiked: false };
        const commentLikeClass = commentLikeData.isLiked ? 'liked' : '';

        html += `
          <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-author">
              ${this.generateAvatarHTML(comment.author, 'small')}
              <div class="comment-info">
                <div class="comment-author-name">${comment.author}</div>
                <div class="comment-time">${comment.timestamp}</div>
              </div>
            </div>
            <div class="comment-content">
              ${this.formatCommentContent(comment.content)}
            </div>
            <div class="comment-actions">
              <button class="action-btn comment-like-btn ${commentLikeClass}" data-comment-id="${comment.id}">
                <i class="fas fa-heart"></i>
                <span>${commentLikeData.likes}</span>
              </button>
              ${
                canReply
                  ? `
              <button class="action-btn reply-btn" data-comment-id="${comment.id}" data-post-id="${post.id}">
                <i class="fas fa-reply"></i>
                回复
              </button>
              `
                  : ''
              }
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    // 如果可以回复，添加回复输入框
    if (canReply) {
      html += `
        <div class="reply-input-container" style="display: none;">
          <div class="reply-input">
            <textarea placeholder="写评论..." maxlength="140"></textarea>
            <div class="reply-actions">
              <button class="cancel-reply-btn">取消</button>
              <button class="send-reply-btn">发送</button>
            </div>
          </div>
        </div>
      `;
    }

    html += `
      </div>
    `;

    return html;
  }

  /**
   * 格式化博文内容
   */
  formatPostContent(content) {
    // 处理话题标签
    content = content.replace(/#([^#\s]+)#/g, '<span class="topic-tag">#$1#</span>');

    // 处理@用户
    content = content.replace(/@([^\s@]+)/g, '<span class="mention-user">@$1</span>');

    // 处理换行
    content = content.replace(/\n/g, '<br>');

    return content;
  }

  /**
   * 格式化评论内容
   */
  formatCommentContent(content) {
    // 处理回复格式：回复张三：内容
    content = content.replace(/回复([^：]+)：/g, '<span class="reply-to">回复$1：</span>');

    // 处理话题标签
    content = content.replace(/#([^#\s]+)#/g, '<span class="topic-tag">#$1#</span>');

    // 处理@用户
    content = content.replace(/@([^\s@]+)/g, '<span class="mention-user">@$1</span>');

    // 处理换行
    content = content.replace(/\n/g, '<br>');

    return content;
  }

  /**
   * 刷新微博列表
   */
  async refreshWeiboList() {
    try {
      console.log('[Weibo UI] 开始刷新微博列表...');

      // 获取当前聊天数据
      const chatData = await this.getCurrentChatData();
      if (!chatData || !chatData.messages || chatData.messages.length === 0) {
        console.log('[Weibo UI] 无聊天数据，显示空状态');
        this.showEmptyState();
        return;
      }

      // 解析微博内容
      const firstMessage = chatData.messages[0];
      const weiboData = this.parseWeiboContent(firstMessage.mes || '');

      // 根据当前页面渲染内容
      let content = '';
      switch (this.currentPage) {
        case 'hot':
          content = this.renderHotPage(weiboData);
          break;
        case 'ranking':
          content = this.renderRankingPage(weiboData);
          break;
        case 'user':
          content = this.renderUserPage(weiboData);
          break;
        default:
          content = this.renderHotPage(weiboData);
      }

      // 更新页面内容
      const contentContainer = document.getElementById('weibo-content');
      if (contentContainer) {
        contentContainer.innerHTML = content;
        this.bindPostEvents();

        // 自动滚动到页面顶部，方便用户查看最新内容
        this.scrollToTop();

        console.log('[Weibo UI] ✅ 微博列表刷新完成');
      }
    } catch (error) {
      console.error('[Weibo UI] 刷新微博列表失败:', error);
      this.showErrorState(error.message);
    }
  }

  /**
   * 滚动到页面顶部
   */
  scrollToTop() {
    try {
      const contentContainer = document.getElementById('weibo-content');
      if (contentContainer) {
        contentContainer.scrollTo({
          top: 0,
          behavior: 'smooth', // 平滑滚动
        });
        console.log('[Weibo UI] 📜 已自动滚动到页面顶部');
      }
    } catch (error) {
      console.warn('[Weibo UI] 滚动到顶部失败:', error);
    }
  }

  /**
   * 获取当前聊天数据
   */
  async getCurrentChatData() {
    if (window.mobileContextEditor) {
      return window.mobileContextEditor.getCurrentChatData();
    } else if (window.MobileContext) {
      return await window.MobileContext.loadChatToEditor();
    } else {
      throw new Error('上下文编辑器未就绪');
    }
  }

  /**
   * 显示空状态
   */
  showEmptyState() {
    const contentContainer = document.getElementById('weibo-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comments"></i>
          <h3>暂无微博内容</h3>
          <p>点击右上角的"生成"按钮开始生成微博内容</p>
        </div>
      `;
    }
  }

  /**
   * 显示错误状态
   */
  showErrorState(message) {
    const contentContainer = document.getElementById('weibo-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${message}</p>
          <button onclick="window.weiboUI.refreshWeiboList()" class="retry-btn">重试</button>
        </div>
      `;
    }
  }

  /**
   * 绑定博文事件
   */
  bindPostEvents() {
    // 绑定删除按钮事件
    document.querySelectorAll('.weibo-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const postId = btn.dataset.postId;
        if (postId) {
          this.deletePost(postId);
        }
      });
    });

    // 绑定点赞事件
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.togglePostLike(postId);
      });
    });

    // 绑定评论点赞事件
    document.querySelectorAll('.comment-like-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const commentId = btn.dataset.commentId;
        this.toggleCommentLike(commentId);
      });
    });

    // 绑定评论按钮事件
    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.showReplyInput(postId);
      });
    });

    // 绑定回复按钮事件
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const commentId = btn.dataset.commentId;
        const postId = btn.dataset.postId;
        this.showReplyInput(postId, commentId);
      });
    });

    // 绑定发送回复事件
    document.querySelectorAll('.send-reply-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.sendReply(btn);
      });
    });

    // 绑定取消回复事件
    document.querySelectorAll('.cancel-reply-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.hideReplyInput(btn);
      });
    });

    // 绑定编辑用户名事件
    document.querySelectorAll('.edit-name-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.showEditNameDialog();
      });
    });
  }

  /**
   * 切换博文点赞
   */
  togglePostLike(postId) {
    // 如果没有点赞数据，从UI中获取原始点赞数
    if (!this.likesData[postId]) {
      const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
      const originalLikes = likeBtn ? parseInt(likeBtn.querySelector('span').textContent) || 0 : 0;
      this.likesData[postId] = { likes: originalLikes, isLiked: false };
    }

    const likeData = this.likesData[postId];

    if (likeData.isLiked) {
      likeData.likes = Math.max(0, likeData.likes - 1);
      likeData.isLiked = false;
    } else {
      likeData.likes += 1;
      likeData.isLiked = true;
    }

    // 更新UI
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    if (likeBtn) {
      likeBtn.classList.toggle('liked', likeData.isLiked);
      likeBtn.querySelector('span').textContent = likeData.likes;
    }

    console.log(`[Weibo UI] 博文 ${postId} 点赞状态: ${likeData.isLiked}, 点赞数: ${likeData.likes}`);
  }

  /**
   * 切换评论点赞
   */
  toggleCommentLike(commentId) {
    // 如果没有点赞数据，从UI中获取原始点赞数
    if (!this.commentLikesData[commentId]) {
      const likeBtn = document.querySelector(`.comment-like-btn[data-comment-id="${commentId}"]`);
      const originalLikes = likeBtn ? parseInt(likeBtn.querySelector('span').textContent) || 0 : 0;
      this.commentLikesData[commentId] = { likes: originalLikes, isLiked: false };
    }

    const likeData = this.commentLikesData[commentId];

    if (likeData.isLiked) {
      likeData.likes = Math.max(0, likeData.likes - 1);
      likeData.isLiked = false;
    } else {
      likeData.likes += 1;
      likeData.isLiked = true;
    }

    // 更新UI
    const likeBtn = document.querySelector(`.comment-like-btn[data-comment-id="${commentId}"]`);
    if (likeBtn) {
      likeBtn.classList.toggle('liked', likeData.isLiked);
      likeBtn.querySelector('span').textContent = likeData.likes;
    }

    console.log(`[Weibo UI] 评论 ${commentId} 点赞状态: ${likeData.isLiked}, 点赞数: ${likeData.likes}`);
  }

  /**
   * 显示回复输入框
   */
  showReplyInput(postId, commentId = null) {
    // 隐藏其他回复输入框
    document.querySelectorAll('.reply-input-container').forEach(container => {
      container.style.display = 'none';
    });

    // 显示当前博文的回复输入框
    const postElement = document.querySelector(`.weibo-post[data-post-id="${postId}"]`);
    if (postElement) {
      const replyContainer = postElement.querySelector('.reply-input-container');
      if (replyContainer) {
        replyContainer.style.display = 'block';
        const textarea = replyContainer.querySelector('textarea');

        // 如果是回复评论，设置占位符
        if (commentId) {
          const commentElement = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
          if (commentElement) {
            const authorName = commentElement.querySelector('.comment-author-name').textContent;
            textarea.placeholder = `回复 ${authorName}...`;
            textarea.dataset.replyTo = authorName;
            textarea.dataset.commentId = commentId;
          }
        } else {
          textarea.placeholder = '写评论...';
          delete textarea.dataset.replyTo;
          delete textarea.dataset.commentId;
        }

        textarea.focus();
      }
    }
  }

  /**
   * 隐藏回复输入框
   */
  hideReplyInput(btn) {
    const replyContainer = btn.closest('.reply-input-container');
    if (replyContainer) {
      replyContainer.style.display = 'none';
      const textarea = replyContainer.querySelector('textarea');
      textarea.value = '';
      textarea.placeholder = '写评论...';
      delete textarea.dataset.replyTo;
      delete textarea.dataset.commentId;
    }
  }

  /**
   * 发送回复
   */
  async sendReply(btn) {
    const replyContainer = btn.closest('.reply-input-container');
    const postElement = btn.closest('.weibo-post');

    if (!replyContainer || !postElement) return;

    const textarea = replyContainer.querySelector('textarea');
    const content = textarea.value.trim();

    if (!content) {
      this.showNotification('请输入回复内容', 'error');
      return;
    }

    const postId = postElement.dataset.postId;
    const replyTo = textarea.dataset.replyTo;
    const commentId = textarea.dataset.commentId;

    // 立即清空输入框并隐藏，模拟发送成功的效果
    const originalContent = content; // 保存内容用于错误恢复
    textarea.value = '';
    this.hideReplyInput(btn);

    // 显示发送中通知
    this.showNotification('正在发送回复...', 'loading');

    try {
      // 构建回复格式
      let replyFormat;
      if (replyTo && commentId) {
        // 回复评论
        replyFormat = `[回复|${this.getCurrentUsername()}|${postId}|回复${replyTo}：${originalContent}]`;
      } else {
        // 回复博文
        replyFormat = `[评论|${this.getCurrentUsername()}|${postId}|${originalContent}]`;
      }

      console.log('[Weibo UI] 发送回复:', replyFormat);

      // 调用微博管理器发送回复
      if (window.weiboManager && window.weiboManager.sendReplyToAPI) {
        await window.weiboManager.sendReplyToAPI(replyFormat);

        // 显示成功通知
        this.showNotification('回复成功', 'success');

        // 刷新微博列表
        setTimeout(() => {
          this.refreshWeiboList();
        }, 1000);
      } else {
        console.error('[Weibo UI] 微博管理器未找到或方法不存在');
        this.showNotification('回复失败：微博管理器未就绪', 'error');
        // 恢复输入内容
        this.restoreReplyInput(postId, originalContent, replyTo, commentId);
      }
    } catch (error) {
      console.error('[Weibo UI] 发送回复失败:', error);
      this.showNotification('回复失败：' + error.message, 'error');
      // 恢复输入内容
      this.restoreReplyInput(postId, originalContent, replyTo, commentId);
    }
  }

  /**
   * 恢复回复输入框内容（发送失败时使用）
   */
  restoreReplyInput(postId, content, replyTo = null, commentId = null) {
    const postElement = document.querySelector(`.weibo-post[data-post-id="${postId}"]`);
    if (postElement) {
      const replyContainer = postElement.querySelector('.reply-input-container');
      if (replyContainer) {
        replyContainer.style.display = 'block';
        const textarea = replyContainer.querySelector('textarea');
        textarea.value = content;

        if (replyTo && commentId) {
          textarea.placeholder = `回复 ${replyTo}...`;
          textarea.dataset.replyTo = replyTo;
          textarea.dataset.commentId = commentId;
        } else {
          textarea.placeholder = '写评论...';
          delete textarea.dataset.replyTo;
          delete textarea.dataset.commentId;
        }

        textarea.focus();
      }
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'success') {
    // 移除现有通知
    const existingNotification = document.querySelector('.reply-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `reply-notification ${type}`;

    // 根据类型设置图标
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-exclamation-circle"></i>';
        break;
      case 'loading':
        icon = '<i class="fas fa-spinner fa-spin"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle"></i>';
    }

    notification.innerHTML = `${icon}${message}`;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // 自动隐藏（loading类型不自动隐藏）
    if (type !== 'loading') {
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
    }
  }

  /**
   * 更新用户名显示（账户切换时调用）
   */
  updateUsernameDisplay() {
    // 更新用户页面中的用户名显示
    const profileNameElement = document.querySelector('.profile-name');
    if (profileNameElement) {
      const newUsername = this.getCurrentUsername();
      profileNameElement.textContent = newUsername;
      console.log('[Weibo UI] 用户名显示已更新:', newUsername);

      // 同时更新头像显示
      const userAvatarLarge = document.querySelector('.user-avatar-large');
      if (userAvatarLarge) {
        userAvatarLarge.innerHTML = this.generateAvatarHTML(newUsername, 'large');
      }

      // 更新账户类型显示
      const accountTypeElement = document.querySelector('.account-type');
      if (accountTypeElement && window.weiboManager) {
        const accountType = window.weiboManager.currentAccount.isMainAccount ? '大号' : '小号';
        accountTypeElement.textContent = accountType;
      }

      // 更新粉丝数显示（如果在用户页面）
      this.updateFansDisplay();
    }
  }

  /**
   * 更新粉丝数显示（账户切换时调用）
   */
  updateFansDisplay() {
    const fansNumberElement = document.querySelector('.stat-item .stat-number');
    if (fansNumberElement && this.persistentData.userStats) {
      const isMainAccount = this.getCurrentAccountType() === '大号';
      const currentFans = isMainAccount
        ? this.persistentData.userStats.mainAccountFans
        : this.persistentData.userStats.aliasAccountFans;

      if (currentFans) {
        fansNumberElement.textContent = currentFans;
        console.log('[Weibo UI] 粉丝数显示已更新:', currentFans, '(', isMainAccount ? '大号' : '小号', ')');
      }
    }
  }

  /**
   * 显示编辑用户名对话框
   */
  showEditNameDialog() {
    const currentName = this.getCurrentUsername();
    const accountType = this.getCurrentAccountType();

    const newName = prompt(`编辑${accountType}用户名:`, currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      this.updateUsername(newName.trim());
    }
  }

  /**
   * 更新用户名
   */
  updateUsername(newName) {
    try {
      if (window.weiboManager && window.weiboManager.setUsername) {
        window.weiboManager.setUsername(newName);

        // 立即更新DOM中的用户名显示
        const profileNameElement = document.querySelector('.profile-name');
        if (profileNameElement) {
          profileNameElement.textContent = newName;
        }

        // 更新头像显示
        const userAvatarElements = document.querySelectorAll('.user-avatar-large .author-avatar');
        userAvatarElements.forEach(avatar => {
          avatar.textContent = newName[0] || '?';
          avatar.style.background = this.getAvatarColor(newName);
        });

        // 刷新用户页面
        if (this.currentPage === 'user') {
          this.refreshWeiboList();
        }

        console.log('[Weibo UI] 用户名已更新:', newName);
      } else {
        throw new Error('微博管理器未就绪');
      }
    } catch (error) {
      console.error('[Weibo UI] 更新用户名失败:', error);
      alert(`更新用户名失败: ${error.message}`);
    }
  }

  /**
   * 设置当前页面
   */
  setCurrentPage(page) {
    if (['hot', 'ranking', 'user'].includes(page)) {
      this.currentPage = page;

      // 更新微博管理器的当前页面
      if (window.weiboManager && window.weiboManager.setCurrentPage) {
        window.weiboManager.setCurrentPage(page);
      }

      console.log('[Weibo UI] 当前页面已设置:', page);
    }
  }

  /**
   * 删除微博及其所有评论和回复
   */
  async deletePost(postId) {
    console.log('[Weibo UI] 开始删除微博:', postId);

    try {
      // 显示确认对话框
      if (!confirm(`确定要删除微博 ID: ${postId} 及其所有评论吗？此操作不可撤销。`)) {
        return;
      }

      // 获取当前聊天数据
      const chatData = await this.getCurrentChatData();
      if (!chatData || !chatData.messages || chatData.messages.length === 0) {
        throw new Error('无聊天数据');
      }

      // 获取第一条消息（包含微博内容）
      const firstMessage = chatData.messages[0];
      if (!firstMessage || !firstMessage.mes) {
        throw new Error('无法找到微博内容');
      }

      let content = firstMessage.mes;

      // 提取微博标记之间的内容
      const weiboRegex = /<!-- WEIBO_CONTENT_START -->([\s\S]*?)<!-- WEIBO_CONTENT_END -->/;
      const match = content.match(weiboRegex);

      if (!match) {
        throw new Error('未找到微博内容标记');
      }

      let weiboContent = match[1];

      // 删除包含指定微博ID的所有格式
      // 删除主博文: [博文|发博人昵称|博文id|博文内容]
      const postRegex = new RegExp(`\\[博文\\|[^|]+\\|${postId}\\|[^\\]]+\\]`, 'g');
      weiboContent = weiboContent.replace(postRegex, '');

      // 删除评论: [评论|评论人昵称|博文id|评论内容]
      const commentRegex = new RegExp(`\\[评论\\|[^|]+\\|${postId}\\|[^\\]]+\\]`, 'g');
      weiboContent = weiboContent.replace(commentRegex, '');

      // 删除回复: [回复|回复人昵称|博文id|回复内容]
      const replyRegex = new RegExp(`\\[回复\\|[^|]+\\|${postId}\\|[^\\]]+\\]`, 'g');
      weiboContent = weiboContent.replace(replyRegex, '');

      // 清理多余的空行
      weiboContent = weiboContent.replace(/\n{3,}/g, '\n\n');

      // 重新构建消息内容
      const newContent = content.replace(
        /<!-- WEIBO_CONTENT_START -->[\s\S]*?<!-- WEIBO_CONTENT_END -->/,
        `<!-- WEIBO_CONTENT_START -->${weiboContent}<!-- WEIBO_CONTENT_END -->`
      );

      // 更新消息内容
      await window.mobileContextEditor.modifyMessage(0, newContent);

      console.log('[Weibo UI] ✅ 微博删除成功:', postId);

      // 显示成功提示
      this.showNotification('🗑️ 微博已删除', 'success');

      // 刷新微博内容
      setTimeout(() => {
        this.refreshWeiboList();
      }, 500);

    } catch (error) {
      console.error('[Weibo UI] 删除微博失败:', error);
      this.showNotification('❌ 删除失败: ' + error.message, 'error');
    }
  }
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.weiboUI = new WeiboUI();
  console.log('[Weibo UI] ✅ 微博UI管理器已创建');
}

/**
 * 获取微博应用内容（供手机框架调用）
 */
function getWeiboAppContent() {
  try {
    console.log('[Weibo UI] 生成微博应用内容...');

    return `
      <div class="weibo-app">
        <!-- 页面切换栏 -->
        <div class="weibo-tabs">
          <div class="tab-item active" data-page="hot">
            <i class="fas fa-fire"></i>
            <span>热搜</span>
          </div>
          <div class="tab-item" data-page="ranking">
            <i class="fas fa-trophy"></i>
            <span>榜单</span>
          </div>
          <div class="tab-item" data-page="user">
            <i class="fas fa-user"></i>
            <span>用户</span>
          </div>
        </div>

        <!-- 微博内容区域 -->
        <div class="weibo-content" id="weibo-content">
          <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在加载微博内容...</p>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('[Weibo UI] 生成微博应用内容失败:', error);
    return `
      <div class="error-placeholder">
        <div class="error-icon">❌</div>
        <div class="error-text">微博应用加载失败</div>
        <div class="error-detail">${error.message}</div>
        <button onclick="window.mobilePhone.handleWeiboApp()" class="retry-button">重试</button>
      </div>
    `;
  }
}

/**
 * 绑定微博事件（供手机框架调用）
 */
function bindWeiboEvents() {
  try {
    console.log('[Weibo UI] 绑定微博事件...');

    // 绑定页面切换事件
    document.querySelectorAll('.weibo-tabs .tab-item').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        const page = tab.dataset.page;

        // 更新选中状态
        document.querySelectorAll('.weibo-tabs .tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 切换页面
        if (window.weiboUI) {
          window.weiboUI.setCurrentPage(page);
          window.weiboUI.refreshWeiboList();
        }

        console.log('[Weibo UI] 切换到页面:', page);
      });
    });

    // 初始化微博内容
    if (window.weiboUI) {
      // 设置默认页面
      window.weiboUI.setCurrentPage('hot');

      // 延迟加载内容，确保DOM完全渲染
      setTimeout(() => {
        window.weiboUI.refreshWeiboList();
      }, 100);
    }

    console.log('[Weibo UI] ✅ 微博事件绑定完成');
  } catch (error) {
    console.error('[Weibo UI] 绑定微博事件失败:', error);
  }
}

// 确保全局函数可用
if (typeof window !== 'undefined') {
  window.getWeiboAppContent = getWeiboAppContent;
  window.bindWeiboEvents = bindWeiboEvents;

  // 🔥 添加评论布局修复的全局函数
  window.fixWeiboCommentLayout = function () {
    console.log('🔧 [全局函数] 修复微博评论布局...');
    if (window.WeiboUI && window.WeiboUI.manualFixCommentLayout) {
      return window.WeiboUI.manualFixCommentLayout();
    } else {
      console.error('❌ WeiboUI 类未找到，无法执行修复');
      return { total: 0, fixed: 0 };
    }
  };

  // 🔥 添加评论布局检查的全局函数
  window.checkWeiboCommentLayout = function () {
    console.log('🔍 [全局函数] 检查微博评论布局状态...');
    const commentItems = document.querySelectorAll('.weibo-app .comment-item');
    let issues = [];

    commentItems.forEach((item, index) => {
      const author = item.querySelector('.comment-author');
      const info = item.querySelector('.comment-info');

      if (author) {
        const authorComputed = window.getComputedStyle(author);
        if (authorComputed.flexDirection !== 'row' || authorComputed.display !== 'flex') {
          issues.push(
            `评论 ${index + 1}: 作者区域布局异常 (display: ${authorComputed.display}, flex-direction: ${
              authorComputed.flexDirection
            })`,
          );
        }
      }

      if (info) {
        const infoComputed = window.getComputedStyle(info);
        if (infoComputed.flexDirection !== 'column' || infoComputed.display !== 'flex') {
          issues.push(
            `评论 ${index + 1}: 信息区域布局异常 (display: ${infoComputed.display}, flex-direction: ${
              infoComputed.flexDirection
            })`,
          );
        }
      }
    });

    console.log(`📊 检查结果: 共 ${commentItems.length} 个评论，发现 ${issues.length} 个布局问题`);
    if (issues.length > 0) {
      console.warn('⚠️ 发现的问题:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
      console.log('💡 建议执行: fixWeiboCommentLayout() 来修复这些问题');
    } else {
      console.log('✅ 所有评论布局正常');
    }

    return { total: commentItems.length, issues: issues.length, details: issues };
  };

  console.log('🔧 [Weibo UI] 评论布局修复工具已加载');
  console.log('💡 可用命令:');
  console.log('  - fixWeiboCommentLayout() : 修复评论布局问题');
  console.log('  - checkWeiboCommentLayout() : 检查评论布局状态');
}
