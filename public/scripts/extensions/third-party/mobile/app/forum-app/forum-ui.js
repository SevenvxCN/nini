/**
 * 论坛UI管理器
 * 负责论坛界面的显示和数据处理
 */
class ForumUI {
  constructor() {
    this.currentThreadId = null;
    this.clickHandler = null;
    this.subReplyEventsbound = false;
    this.likeClickHandler = null;
    // 点赞数据存储 - 格式: { threadId: { likes: number, isLiked: boolean }, ... }
    this.likesData = {};
    // 回复点赞数据存储 - 格式: { replyId: { likes: number, isLiked: boolean }, ... }
    this.replyLikesData = {};

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

    this.init();
  }

  init() {
    console.log('[Forum UI] 论坛UI管理器初始化');
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
   * 从消息中实时解析论坛内容
   */
  parseForumContent(content) {
    // 提取论坛标记之间的内容
    const forumRegex = /<!-- FORUM_CONTENT_START -->([\s\S]*?)<!-- FORUM_CONTENT_END -->/;
    const match = content.match(forumRegex);

    if (!match) {
      console.log('[Forum UI] 未找到论坛内容');
      return { threads: [], replies: {} };
    }

    const forumContent = match[1];
    const threads = [];
    const replies = {};

    // 解析标题格式: [标题|发帖人昵称|帖子id|标题内容|帖子详情]
    const titleRegex = /\[标题\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    // 解析回复格式: [回复|回帖人昵称|帖子id|回复内容]
    const replyRegex = /\[回复\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
    // 解析楼中楼格式: [楼中楼|回帖人昵称|帖子id|父楼层|回复内容]
    const subReplyRegex = /\[楼中楼\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;

    let match_title;
    let match_reply;
    let match_subreply;

    // 解析标题
    while ((match_title = titleRegex.exec(forumContent)) !== null) {
      const thread = {
        id: match_title[2],
        author: match_title[1],
        title: match_title[3],
        content: match_title[4],
        replies: [],
        timestamp: new Date().toLocaleString(),
      };

      threads.push(thread);
      replies[thread.id] = [];
    }

    // 解析普通回复
    while ((match_reply = replyRegex.exec(forumContent)) !== null) {
      const reply = {
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: match_reply[2],
        author: match_reply[1],
        content: match_reply[3],
        timestamp: new Date().toLocaleString(),
        type: 'reply',
        subReplies: [],
      };

      if (!replies[reply.threadId]) {
        replies[reply.threadId] = [];
      }
      replies[reply.threadId].push(reply);
    }

    // 解析楼中楼
    while ((match_subreply = subReplyRegex.exec(forumContent)) !== null) {
      const subReply = {
        id: `subreply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: match_subreply[2],
        author: match_subreply[1],
        parentFloor: match_subreply[3],
        content: match_subreply[4],
        timestamp: new Date().toLocaleString(),
        type: 'subreply',
      };

      if (!replies[subReply.threadId]) {
        replies[subReply.threadId] = [];
      }

      // 找到对应的父楼层并添加到其subReplies中
      const parentReply = replies[subReply.threadId].find(
        r =>
          r.author === subReply.parentFloor ||
          r.id === subReply.parentFloor ||
          replies[subReply.threadId].indexOf(r) + 2 === parseInt(subReply.parentFloor),
      );

      if (parentReply) {
        if (!parentReply.subReplies) {
          parentReply.subReplies = [];
        }
        parentReply.subReplies.push(subReply);
      } else {
        // 如果找不到父楼层，作为普通回复处理
        subReply.type = 'reply';
        subReply.subReplies = [];
        replies[subReply.threadId].push(subReply);
      }
    }

    // 更新对应帖子的回复数
    threads.forEach(thread => {
      if (replies[thread.id]) {
        thread.replies = replies[thread.id];
      }
    });

    console.log('[Forum UI] 解析完成，帖子数:', threads.length);
    return { threads, replies };
  }

  /**
   * 获取论坛主界面HTML
   */
  getForumMainHTML() {
    return `
            <div class="forum-app">
                <!-- 论坛内容 -->
                <div class="forum-content" id="forum-content">
                    ${this.getThreadListHTML()}
                </div>

                <!-- 发帖对话框 -->
                <div class="post-dialog" id="post-dialog" style="display: none;">
                    <div class="dialog-overlay" id="dialog-overlay"></div>
                    <div class="dialog-content">
                        <div class="dialog-header">
                            <h3>发新帖</h3>
                            <button class="close-btn" id="close-dialog-btn">×</button>
                        </div>
                        <div class="dialog-body">
                            <input type="text" class="post-title-input" id="post-title" placeholder="请输入帖子标题...">
                            <textarea class="post-content-input" id="post-content" placeholder="分享你的想法..."></textarea>
                        </div>
                        <div class="dialog-footer">
                            <button class="cancel-btn" id="cancel-post-btn">取消</button>
                            <button class="submit-btn" id="submit-post-btn">✈</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * 获取帖子列表HTML
   */
  getThreadListHTML() {
    // 实时从消息中提取论坛数据
    const forumData = this.getCurrentForumData();

    if (forumData.threads.length === 0) {
      return `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <div class="empty-text">暂无帖子</div>
                    <div class="empty-hint">点击右上角发帖按钮开始讨论吧～</div>
                </div>
            `;
    }

    // 按最新活动时间排序帖子（最新活动的在前）
    const sortedThreads = forumData.threads.slice().sort((a, b) => {
      // 计算每个帖子的最新活动时间
      const getLatestActivityTime = thread => {
        let latestTime = new Date(thread.timestamp || Date.now());

        if (thread.replies && thread.replies.length > 0) {
          thread.replies.forEach(reply => {
            const replyTime = new Date(reply.timestamp || Date.now());
            if (replyTime > latestTime) {
              latestTime = replyTime;
            }

            // 检查楼中楼回复
            if (reply.subReplies && reply.subReplies.length > 0) {
              reply.subReplies.forEach(subReply => {
                const subReplyTime = new Date(subReply.timestamp || Date.now());
                if (subReplyTime > latestTime) {
                  latestTime = subReplyTime;
                }
              });
            }
          });
        }

        return latestTime;
      };

      const aLatest = getLatestActivityTime(a);
      const bLatest = getLatestActivityTime(b);

      return bLatest - aLatest; // 降序排列，最新的在前
    });

    return sortedThreads
      .map(
        thread => `
            <div class="thread-item" data-thread-id="${thread.id}">
                <div class="thread-header">
                    ${this.generateAvatarHTML(thread.author)}
                    <div class="thread-author">
                        <div class="author-name">${thread.author}</div>
                    </div>
                    <div class="thread-id">ID: t${thread.id}</div>
                    <button class="delete-btn forum-delete-btn" data-thread-id="${thread.id}" title="删除帖子">删除</button>
                </div>
                <div class="post-content">
                    <h2 class="thread-title">${thread.title}</h2>
                    <div class="thread-content">${this.formatContent(thread.content)}</div>
                </div>
                <div class="thread-stats">
                    <div class="thread-actions">
                        <button class="action-btn like-btn" data-thread-id="${thread.id}">
                            <i class="${this.getLikeIconClass(thread.id)} fa-heart"></i> ${this.getLikeCount(thread.id)}
                        </button>
                        <button class="action-btn"><i class="far fa-comment-dots"></i> ${thread.replies.length}</button>
                    </div>
                </div>
            </div>
        `,
      )
      .join('');
  }

  /**
   * 从消息中获取当前论坛数据
   */
  getCurrentForumData() {
    try {
      if (window.mobileContextEditor) {
        const chatData = window.mobileContextEditor.getCurrentChatData();
        if (chatData && chatData.messages && chatData.messages.length > 0) {
          // 检查第一条消息是否包含论坛内容
          const firstMessage = chatData.messages[0];
          if (firstMessage && firstMessage.mes) {
            return this.parseForumContent(firstMessage.mes);
          }
        }
      }
    } catch (error) {
      console.warn('[Forum UI] 获取论坛数据失败:', error);
    }

    return { threads: [], replies: {} };
  }

  /**
   * 获取帖子详情HTML
   */
  getThreadDetailHTML(threadId) {
    // 实时从消息中提取论坛数据
    const forumData = this.getCurrentForumData();
    const thread = forumData.threads.find(t => t.id === threadId);
    if (!thread) return '<div class="error">帖子不存在</div>';

    const replies = forumData.replies[threadId] || [];

    return `
            <div class="thread-detail">
                <!-- 主帖 -->
                <div class="main-post">
                    <div class="post-header">
                        ${this.generateAvatarHTML(thread.author, 'large')}
                        <div class="author-info">
                            <span class="author-name">${thread.author}</span>
                        </div>
                    </div>
                    <h2 class="post-title">${thread.title}</h2>
                    <div class="post-meta">
                        <span class="thread-id">ID: t${thread.id}</span>
                    </div>
                    <div class="post-full-content">${this.formatContent(thread.content)}</div>
                    <div class="post-actions">
                        <button class="action-btn like-btn" data-thread-id="${thread.id}">
                            <i class="${this.getLikeIconClass(thread.id)} fa-heart"></i> ${this.getLikeCount(thread.id)}
                        </button>
                        <button class="action-btn"><i class="far fa-comment-dots"></i> ${replies.length}</button>
                    </div>
                </div>

                <!-- 回复列表 -->
                <div class="reply-list">
                    <div class="reply-header">
                        <h4>全部回复 (${replies.length})</h4>
                    </div>
                    ${this.getRepliesHTML(replies)}
                </div>

                <!-- 回复输入框 -->
                <div class="comment-input-bar">
                    <input type="text" class="reply-input" id="reply-input" placeholder="留下你的想法吧">
                    <button class="action-btn submit-reply-btn" id="submit-reply-btn" style="color: var(--accent-pink); font-size: 16px;"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
  }

  /**
   * 获取回复列表HTML
   */
  getRepliesHTML(replies) {
    if (replies.length === 0) {
      return `
                <div class="no-replies">
                    <div class="no-replies-icon">💭</div>
                    <div class="no-replies-text">暂无回复，来抢沙发吧～</div>
                </div>
            `;
    }

    return replies
      .map((reply, index) => {
        const floorNumber = index + 2;
        return `
                <div class="reply-item" data-floor="${floorNumber}" data-reply-id="${reply.id}">
                    <div class="reply-header">
                        <div class="reply-author">
                            ${this.generateAvatarHTML(reply.author)}
                            <div class="author-info">
                                <span class="author-name">${reply.author}</span>
                                <span class="reply-time">${reply.timestamp}</span>
                            </div>
                        </div>
                        <div class="reply-meta">
                            <span class="floor-number">${floorNumber}楼</span>
                        </div>
                    </div>
                    <div class="reply-content">${this.formatContent(reply.content)}</div>
                    <div class="reply-actions">
                        <button class="action-btn like-reply" data-reply-id="${reply.id}">
                            <i class="${this.getReplyLikeIconClass(reply.id)} fa-heart"></i> ${this.getReplyLikeCount(
          reply.id,
        )}
                        </button>
                        <button class="action-btn reply-to-reply" data-reply-to="${
                          reply.author
                        }" data-floor="${floorNumber}" data-reply-id="${
          reply.id
        }"><i class="fas fa-reply"></i> 回复</button>
                    </div>

                    <!-- 楼中楼回复 -->
                    ${this.getSubRepliesHTML(reply.subReplies || [], floorNumber)}

                    <!-- 楼中楼回复输入框 -->
                    <div class="sub-reply-input-container" id="sub-reply-input-${reply.id}" style="display: none;">
                        <div class="sub-reply-input-box">
                            <div class="sub-reply-target">回复 ${reply.author}:</div>
                            <textarea class="sub-reply-input" placeholder="写下你的回复..." rows="2"></textarea>
                            <div class="sub-reply-actions">
                                <button class="cancel-sub-reply-btn" data-reply-id="${reply.id}">取消</button>
                                <button class="submit-sub-reply-btn" data-reply-id="${
                                  reply.id
                                }" data-parent-floor="${floorNumber}" data-parent-author="${reply.author}">✈</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join('');
  }

  /**
   * 获取楼中楼回复HTML
   */
  getSubRepliesHTML(subReplies, parentFloor) {
    if (!subReplies || subReplies.length === 0) {
      return '';
    }

    return `
            <div class="sub-replies-container">
                <div class="sub-replies-header">
                    <span class="sub-replies-count">${subReplies.length} 条回复</span>
                </div>
                <div class="sub-replies-list">
                    ${subReplies
                      .map(
                        subReply => `
                        <div class="sub-reply-item" data-sub-reply-id="${subReply.id}">
                            <div class="sub-reply-author">
                                ${this.generateAvatarHTML(subReply.author, 'small')}
                                <span class="author-name">${subReply.author}</span>
                                <span class="sub-reply-time">${subReply.timestamp}</span>
                            </div>
                            <div class="sub-reply-content">${this.formatContent(subReply.content)}</div>
                            <div class="sub-reply-actions">
                                <button class="action-btn like-sub-reply">👍 ${Math.floor(Math.random() * 5)}</button>
                                <button class="action-btn reply-to-sub-reply" data-reply-to="${
                                  subReply.author
                                }" data-parent-floor="${parentFloor}">回复</button>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        `;
  }

  /**
   * 格式化内容（处理表情包等）
   */
  formatContent(content) {
    // 处理表情包标记
    let formatted = content.replace(/表情:\s*([^,\s]+)/g, '<span class="emoji-placeholder">[$1]</span>');



    // 处理@用户（如果有）
    formatted = formatted.replace(/@([^\s]+)/g, '<span class="mention">@$1</span>');

    // 处理换行
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 移除之前的事件监听器（如果存在）
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }

    // 帖子点击事件
    this.clickHandler = e => {
      // 只处理论坛内容区域的点击事件
      const forumContent = document.getElementById('forum-content');
      if (!forumContent || !forumContent.contains(e.target)) {
        return;
      }

      // 处理删除按钮点击
      if (e.target.closest('.forum-delete-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const deleteBtn = e.target.closest('.forum-delete-btn');
        const threadId = deleteBtn.dataset.threadId;
        if (threadId) {
          this.deleteThread(threadId);
        }
        return;
      }

      if (e.target.closest('.thread-item')) {
        const threadItem = e.target.closest('.thread-item');
        const threadId = threadItem.dataset.threadId;
        this.showThreadDetail(threadId);
      }
    };

    document.addEventListener('click', this.clickHandler);

    // 发帖按钮
    const newPostBtn = document.getElementById('new-post-btn');
    if (newPostBtn) {
      newPostBtn.addEventListener('click', () => this.showPostDialog());
    }

    // 刷新按钮
    const refreshBtn = document.getElementById('refresh-forum-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshForum());
    }

    // 论坛设置按钮
    const forumControlBtn = document.getElementById('forum-control-btn');
    if (forumControlBtn) {
      forumControlBtn.addEventListener('click', () => this.showForumControl());
    }

    // 生成演示内容按钮
    const generateBtn = document.getElementById('generate-demo-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateDemoContent());
    }

    // 对话框相关事件
    this.bindDialogEvents();

    // 楼中楼相关事件
    this.bindSubReplyEvents();

    // 主回复按钮事件
    this.bindMainReplyEvents();

    // 点赞按钮事件
    this.bindLikeEvents();
  }

  /**
   * 绑定对话框事件
   */
  bindDialogEvents() {
    // 关闭对话框
    const closeBtn = document.getElementById('close-dialog-btn');
    const cancelBtn = document.getElementById('cancel-post-btn');
    const overlay = document.getElementById('dialog-overlay');

    [closeBtn, cancelBtn, overlay].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => this.hidePostDialog());
      }
    });

    // 提交发帖
    const submitBtn = document.getElementById('submit-post-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitNewPost());
    }
  }

  /**
   * 显示帖子详情
   */
  showThreadDetail(threadId) {
    this.currentThreadId = threadId;

    // 推送新状态到应用栈（只在状态发生变化时推送）
    if (window.mobilePhone) {
      const currentState = window.mobilePhone.currentAppState;
      const shouldPushState =
        !currentState ||
        currentState.app !== 'forum' ||
        currentState.view !== 'threadDetail' ||
        currentState.threadId !== threadId;

      if (shouldPushState) {
        const state = {
          app: 'forum',
          title: '帖子详情',
          view: 'threadDetail',
          threadId: threadId,
        };
        window.mobilePhone.pushAppState(state);
        console.log('[Forum UI] 推送帖子详情状态:', state);
      }
    }

    // 更新内容
    const forumContent = document.getElementById('forum-content');
    if (forumContent) {
      forumContent.innerHTML = this.getThreadDetailHTML(threadId);
    } else {
      console.error('[Forum UI] 找不到forum-content元素');
    }

    // 绑定回复事件
    this.bindReplyEvents();
  }

  /**
   * 绑定回复事件
   */
  bindReplyEvents() {
    // 移除这里的事件绑定，避免与 bindMainReplyEvents() 冲突
    // submit-reply-btn 的事件已在 bindMainReplyEvents() 中处理
    // 楼中楼事件已在 bindEvents() 中绑定，无需重复绑定
    // this.bindSubReplyEvents();
  }

  /**
   * 绑定点赞事件
   */
  bindLikeEvents() {
    // 移除之前的事件监听器（如果存在）
    if (this.likeClickHandler) {
      document.removeEventListener('click', this.likeClickHandler);
    }

    this.likeClickHandler = e => {
      // 处理帖子点赞按钮点击
      if (e.target.closest('.like-btn[data-thread-id]')) {
        e.preventDefault();
        e.stopPropagation();

        const button = e.target.closest('.like-btn[data-thread-id]');
        const threadId = button.dataset.threadId;

        if (threadId) {
          this.toggleThreadLike(threadId);
        }
      }

      // 处理回复点赞按钮点击
      if (e.target.closest('.like-reply[data-reply-id]')) {
        e.preventDefault();
        e.stopPropagation();

        const button = e.target.closest('.like-reply[data-reply-id]');
        const replyId = button.dataset.replyId;

        if (replyId) {
          this.toggleReplyLike(replyId);
        }
      }
    };

    document.addEventListener('click', this.likeClickHandler);
  }

  /**
   * 绑定主回复事件
   */
  bindMainReplyEvents() {
    // 移除之前的事件监听器（如果存在）
    if (this.mainReplyClickHandler) {
      document.removeEventListener('click', this.mainReplyClickHandler);
    }

    this.mainReplyClickHandler = e => {
      // 处理主回复按钮点击
      if (e.target.closest('.action-btn') && e.target.closest('.action-btn').querySelector('i.fa-comment-dots')) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCommentInput();
      }

      // 处理回复提交按钮
      if (e.target.closest('#submit-reply-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.submitMainReply();
      }
    };

    document.addEventListener('click', this.mainReplyClickHandler);
  }

  /**
   * 切换评论输入框显示状态
   */
  toggleCommentInput() {
    const inputBar = document.querySelector('.comment-input-bar');
    if (inputBar) {
      inputBar.classList.toggle('show');
      if (inputBar.classList.contains('show')) {
        // 聚焦到输入框
        const input = inputBar.querySelector('input');
        if (input) {
          setTimeout(() => input.focus(), 100);
        }
      }
    }
  }

  /**
   * 提交主回复
   */
  submitMainReply() {
    const input = document.querySelector('.comment-input-bar input');
    if (!input) return;

    const content = input.value.trim();
    if (!content) {
      alert('请输入回复内容');
      return;
    }

    // 获取当前帖子信息
    const forumData = this.getCurrentForumData();
    const currentThread = forumData.threads.find(t => t.id === this.currentThreadId);

    if (!currentThread) {
      alert('无法找到当前帖子信息');
      return;
    }

    // 构建回复前缀：我回复帖子'作者|帖子id|帖子标题'
    const threadPrefix = `我回复帖子'${currentThread.author}|${currentThread.id}|${currentThread.title}'`;

    // 构建回复格式
    const replyFormat = `[回复|我|${this.currentThreadId}|${content}]`;

    // 直接发送回复，无需确认
    // 清空输入框并隐藏
    input.value = '';
    const inputBar = document.querySelector('.comment-input-bar');
    if (inputBar) {
      inputBar.classList.remove('show');
    }

    // 显示发送成功提示
    if (window.showMobileToast) {
      window.showMobileToast('📤 回复已发送', 'success');
    } else {
      // 如果没有toast功能，使用简单的alert
      setTimeout(() => {
        alert('回复已发送');
      }, 100);
    }

    // 直接发送回复给AI
    if (window.forumManager.sendReplyToAPI) {
      const fullReply = `${threadPrefix}\n${replyFormat}`;
      console.log('[Forum UI] 发送主回复给AI:', fullReply);

      window.forumManager
        .sendReplyToAPI(fullReply)
        .then(() => {
          console.log('[Forum UI] 回复已通过API发送给模型，论坛内容已更新');
          // 刷新论坛内容
          setTimeout(() => {
            this.refreshThreadList();
          }, 500);
        })
        .catch(error => {
          console.error('[Forum UI] API发送回复失败:', error);
          if (window.showMobileToast) {
            window.showMobileToast('❌ 发送回复失败，请重试', 'error');
          } else {
            alert('发送回复失败，请重试');
          }
        });
    } else {
      if (window.showMobileToast) {
        window.showMobileToast('❌ 回复功能不可用', 'error');
      } else {
        alert('回复功能不可用，请检查论坛管理器配置');
      }
    }
  }

  /**
   * 绑定楼中楼回复事件
   */
  bindSubReplyEvents() {
    // 避免重复绑定事件监听器
    if (this.subReplyEventsbound) {
      return;
    }
    this.subReplyEventsbound = true;

    // 回复按钮点击事件
    this.subReplyClickHandler = e => {
      if (e.target.classList.contains('reply-to-reply')) {
        const replyId = e.target.dataset.replyId;
        this.showSubReplyInput(replyId);
      }

      if (e.target.classList.contains('cancel-sub-reply-btn')) {
        const replyId = e.target.dataset.replyId;
        this.hideSubReplyInput(replyId);
      }

      if (e.target.classList.contains('submit-sub-reply-btn')) {
        const replyId = e.target.dataset.replyId;
        const parentFloor = e.target.dataset.parentFloor;
        const parentAuthor = e.target.dataset.parentAuthor;
        this.submitSubReply(replyId, parentFloor, parentAuthor);
      }
    };

    document.addEventListener('click', this.subReplyClickHandler);
  }

  /**
   * 显示楼中楼回复输入框
   */
  showSubReplyInput(replyId) {
    // 隐藏所有其他的回复输入框
    document.querySelectorAll('.sub-reply-input-container').forEach(container => {
      container.style.display = 'none';
    });

    // 显示当前的回复输入框
    const container = document.getElementById(`sub-reply-input-${replyId}`);
    if (container) {
      container.style.display = 'block';
      // 聚焦到输入框
      const textarea = container.querySelector('.sub-reply-input');
      if (textarea) {
        textarea.focus();
      }
    }
  }

  /**
   * 隐藏楼中楼回复输入框
   */
  hideSubReplyInput(replyId) {
    const container = document.getElementById(`sub-reply-input-${replyId}`);
    if (container) {
      container.style.display = 'none';
      // 清空输入框
      const textarea = container.querySelector('.sub-reply-input');
      if (textarea) {
        textarea.value = '';
      }
    }
  }

  /**
   * 提交楼中楼回复
   */
  submitSubReply(replyId, parentFloor, parentAuthor) {
    const container = document.getElementById(`sub-reply-input-${replyId}`);
    if (!container) return;

    const textarea = container.querySelector('.sub-reply-input');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      alert('请输入回复内容');
      return;
    }

    // 获取当前论坛数据，找到被回复的评论信息
    const forumData = this.getCurrentForumData();
    const currentReplies = forumData.replies[this.currentThreadId] || [];

    // 查找被回复的评论
    let parentReply = null;
    for (const reply of currentReplies) {
      if (reply.id === replyId || reply.author === parentAuthor) {
        parentReply = reply;
        break;
      }
    }

    if (!parentReply) {
      alert('无法找到被回复的评论信息');
      return;
    }

    // 构建评论前缀：我回复评论'作者|帖子id|评论内容'
    const commentPrefix = `我回复评论'${parentReply.author}|${this.currentThreadId}|${parentReply.content}'`;

    // 构建楼中楼回复格式：[回复|我|帖子id|回复作者：回复内容]
    const replyFormat = `[回复|我|${this.currentThreadId}|回复${parentReply.author}：${content}]`;

    const subReplyData = {
      type: 'subreply',
      threadId: this.currentThreadId,
      parentFloor: parentFloor,
      parentAuthor: parentAuthor,
      content: content,
      prefix: commentPrefix,
      replyFormat: replyFormat,
    };

    // 调用论坛管理器发送楼中楼回复
    this.sendReplyToForum(subReplyData);

    // 隐藏输入框
    this.hideSubReplyInput(replyId);
  }

  /**
   * 显示发帖对话框
   */
  showPostDialog() {
    const dialog = document.getElementById('post-dialog');
    if (dialog) {
      dialog.style.display = 'flex';
      // 清空输入框
      document.getElementById('post-title').value = '';
      document.getElementById('post-content').value = '';
    }
  }

  /**
   * 隐藏发帖对话框
   */
  hidePostDialog() {
    const dialog = document.getElementById('post-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
  }

  /**
   * 提交新帖
   */
  submitNewPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !content) {
      alert('请填写标题和内容');
      return;
    }

    // 隐藏对话框
    this.hidePostDialog();

    if (!window.forumManager) {
      alert('论坛管理器未初始化，请稍后再试');
      return;
    }

    // 构建发帖格式：[标题|我|帖子id|标题内容|帖子详情]
    // 帖子id固定为四个字，让模型自己编
    const postFormat = `[标题|我|帖子|${title}|${content}]`;

    console.log('[Forum UI] 用户发帖:', { title, content, postFormat });

    // 直接发布帖子，无需确认
    // 显示发布成功提示
    if (window.showMobileToast) {
      window.showMobileToast('📝 帖子已发布', 'success');
    } else {
      // 如果没有toast功能，使用简单的alert
      setTimeout(() => {
        alert('帖子已发布');
      }, 100);
    }

    // 调用论坛管理器的发帖API
    if (window.forumManager.sendPostToAPI) {
      window.forumManager
        .sendPostToAPI(postFormat)
        .then(() => {
          console.log('[Forum UI] 帖子已发布');
          // 刷新论坛内容
          setTimeout(() => {
            this.refreshThreadList();
          }, 1000);
        })
        .catch(error => {
          console.error('[Forum UI] 发帖失败:', error);
          if (window.showMobileToast) {
            window.showMobileToast('❌ 发帖失败，请重试', 'error');
          } else {
            alert('发帖失败，请重试');
          }
        });
    } else {
      if (window.showMobileToast) {
        window.showMobileToast('❌ 发帖功能不可用', 'error');
      } else {
        alert('发帖功能不可用，请检查论坛管理器配置');
      }
      console.error('[Forum UI] sendPostToAPI方法不存在');
    }
  }

  /**
   * 提交回复
   */
  submitReply() {
    if (!this.currentThreadId) return;

    const content = document.getElementById('reply-input').value.trim();
    if (!content) {
      alert('请输入回复内容');
      return;
    }

    // 清空输入框
    document.getElementById('reply-input').value = '';

    // 获取当前帖子信息
    const forumData = this.getCurrentForumData();
    const currentThread = forumData.threads.find(t => t.id === this.currentThreadId);

    if (!currentThread) {
      alert('无法找到当前帖子信息');
      return;
    }

    // 构建回复前缀：我回复帖子'作者|帖子id|帖子标题和内容'
    const threadPrefix = `我回复帖子'${currentThread.author}|${currentThread.id}|${currentThread.title}'`;

    // 构建普通回复格式：[回复|我|帖子id|回复内容]
    const replyFormat = `[回复|我|${this.currentThreadId}|${content}]`;

    const replyData = {
      type: 'reply',
      threadId: this.currentThreadId,
      content: content,
      prefix: threadPrefix,
      replyFormat: replyFormat,
    };

    // 调用论坛管理器发送回复
    this.sendReplyToForum(replyData);
  }

  /**
   * 发送回复到论坛管理器
   */
  sendReplyToForum(replyData) {
    if (!window.forumManager) {
      alert('论坛管理器未初始化，请稍后再试');
      return;
    }

    console.log('[Forum UI] 发送回复到论坛管理器:', replyData);

    // 直接发送回复，无需确认
    // 显示发送成功提示
    if (window.showMobileToast) {
      window.showMobileToast('📤 回复已发送', 'success');
    } else {
      // 如果没有toast功能，使用简单的alert
      setTimeout(() => {
        alert('回复已发送');
      }, 100);
    }

    // 直接通过API发送回复给模型，让AI生成包含用户回复的完整论坛内容
    if (window.forumManager.sendReplyToAPI) {
      const fullReply = `${replyData.prefix}\n${replyData.replyFormat}`;
      console.log('[Forum UI] 发送回复给AI生成完整论坛内容:', fullReply);

      window.forumManager
        .sendReplyToAPI(fullReply)
        .then(() => {
          console.log('[Forum UI] 回复已通过API发送给模型，论坛内容已更新');

          // 刷新论坛内容
          setTimeout(() => {
            this.refreshThreadList();
          }, 500);
        })
        .catch(error => {
          console.error('[Forum UI] API发送回复失败:', error);
          if (window.showMobileToast) {
            window.showMobileToast('❌ 发送回复失败，请重试', 'error');
          } else {
            alert('发送回复失败，请重试');
          }
        });
    } else {
      // 如果API功能不可用，回退到插入模式
      console.warn('[Forum UI] API发送功能不可用，回退到直接插入模式');
      if (window.forumManager.insertReplyToFirstLayer) {
        window.forumManager
          .insertReplyToFirstLayer(replyData.prefix, replyData.replyFormat)
          .then(() => {
            console.log('[Forum UI] 回复已插入到第一层');
            // 刷新论坛内容
            setTimeout(() => {
              this.refreshThreadList();
            }, 500);
          })
          .catch(error => {
            console.error('[Forum UI] 插入回复失败:', error);
            if (window.showMobileToast) {
              window.showMobileToast('❌ 发送回复失败，请重试', 'error');
            } else {
              alert('发送回复失败，请重试');
            }
          });
      } else {
        if (window.showMobileToast) {
          window.showMobileToast('❌ 回复功能不可用', 'error');
        } else {
          alert('回复功能需要通过论坛管理器重新生成论坛内容来实现。请使用论坛管理器功能。');
        }
        console.log('[Forum UI] 用户尝试回复:', replyData);
      }
    }
  }

  /**
   * 刷新论坛
   */
  refreshForum() {
    console.log('[Forum UI] 刷新论坛内容');
    this.refreshThreadList();
  }

  /**
   * 刷新帖子列表
   */
  refreshThreadList() {
    const content = document.getElementById('forum-content');
    if (content) {
      content.innerHTML = this.getThreadListHTML();
    }
  }

  /**
   * 生成演示内容
   */
  generateDemoContent() {
    if (window.forumManager) {
      console.log('[Forum UI] 调用论坛管理器生成内容');
      window.forumManager.generateForumContent().then(() => {
        // 生成完成后刷新界面
        setTimeout(() => {
          this.refreshThreadList();
        }, 1000);
      });
    } else {
      console.warn('[Forum UI] 论坛管理器未找到');
      alert('论坛管理器未初始化，请稍后再试');
    }
  }

  /**
   * 返回主列表
   */
  showMainList() {
    this.currentThreadId = null;

    // 更新状态到论坛主列表
    if (window.mobilePhone) {
      const currentState = window.mobilePhone.currentAppState;
      if (currentState && currentState.app === 'forum' && currentState.view !== 'main') {
        const mainState = {
          app: 'forum',
          title: '论坛',
          view: 'main',
        };
        // 替换当前状态而不是推送新状态
        window.mobilePhone.currentAppState = mainState;
        window.mobilePhone.updateAppHeader(mainState);
        console.log('[Forum UI] 更新状态到论坛主列表:', mainState);
      }
    }

    const forumContent = document.getElementById('forum-content');
    if (forumContent) {
      forumContent.innerHTML = this.getThreadListHTML();
      // 重新绑定主列表事件
      if (window.bindForumEvents) {
        window.bindForumEvents();
      }
    }
  }

  /**
   * 显示论坛控制面板
   */
  showForumControl() {
    // 推送新状态到应用栈，切换到论坛控制页面
    if (window.mobilePhone) {
      const state = {
        app: 'forum',
        title: '论坛设置',
        view: 'forumControl',
      };
      window.mobilePhone.pushAppState(state);
    }

    // 如果没有手机框架，回退到原有的弹出面板
    if (!window.mobilePhone && window.forumManager) {
      window.forumManager.showForumPanel();
    }
  }

  // 重置论坛UI状态
  resetState() {
    console.log('[Forum UI] 重置论坛UI状态');
    this.currentThreadId = null;
    this.currentView = 'main';

    // 清理事件监听器
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
    if (this.likeClickHandler) {
      document.removeEventListener('click', this.likeClickHandler);
      this.likeClickHandler = null;
    }
    if (this.mainReplyClickHandler) {
      document.removeEventListener('click', this.mainReplyClickHandler);
      this.mainReplyClickHandler = null;
    }

    // 重置到主列表视图
    this.showMainList();

    console.log('[Forum UI] 论坛UI状态重置完成');
  }

  /**
   * 初始化帖子点赞数据
   */
  initThreadLikeData(threadId) {
    if (!this.likesData[threadId]) {
      this.likesData[threadId] = {
        likes: Math.floor(Math.random() * 50) + 10, // 随机初始点赞数
        isLiked: false,
      };
    }
  }

  /**
   * 初始化回复点赞数据
   */
  initReplyLikeData(replyId) {
    if (!this.replyLikesData[replyId]) {
      this.replyLikesData[replyId] = {
        likes: Math.floor(Math.random() * 10) + 1, // 随机初始点赞数
        isLiked: false,
      };
    }
  }

  /**
   * 获取帖子点赞数
   */
  getLikeCount(threadId) {
    this.initThreadLikeData(threadId);
    return this.likesData[threadId].likes;
  }

  /**
   * 获取帖子点赞图标类名
   */
  getLikeIconClass(threadId) {
    this.initThreadLikeData(threadId);
    return this.likesData[threadId].isLiked ? 'fas' : 'far';
  }

  /**
   * 获取回复点赞数
   */
  getReplyLikeCount(replyId) {
    this.initReplyLikeData(replyId);
    return this.replyLikesData[replyId].likes;
  }

  /**
   * 获取回复点赞图标类名
   */
  getReplyLikeIconClass(replyId) {
    this.initReplyLikeData(replyId);
    return this.replyLikesData[replyId].isLiked ? 'fas' : 'far';
  }

  /**
   * 切换帖子点赞状态
   */
  toggleThreadLike(threadId) {
    this.initThreadLikeData(threadId);
    const likeData = this.likesData[threadId];

    if (likeData.isLiked) {
      // 取消点赞
      likeData.likes--;
      likeData.isLiked = false;
    } else {
      // 点赞
      likeData.likes++;
      likeData.isLiked = true;
    }

    // 更新所有相关的点赞按钮
    this.updateAllThreadLikeButtons(threadId);

    return likeData;
  }

  /**
   * 切换回复点赞状态
   */
  toggleReplyLike(replyId) {
    this.initReplyLikeData(replyId);
    const likeData = this.replyLikesData[replyId];

    if (likeData.isLiked) {
      // 取消点赞
      likeData.likes--;
      likeData.isLiked = false;
    } else {
      // 点赞
      likeData.likes++;
      likeData.isLiked = true;
    }

    // 更新所有相关的点赞按钮
    this.updateAllReplyLikeButtons(replyId);

    return likeData;
  }

  /**
   * 更新所有帖子点赞按钮
   */
  updateAllThreadLikeButtons(threadId) {
    const buttons = document.querySelectorAll(`.like-btn[data-thread-id="${threadId}"]`);
    const likeData = this.likesData[threadId];

    buttons.forEach(button => {
      const icon = button.querySelector('i');
      const textNode = button.childNodes[button.childNodes.length - 1];

      if (icon) {
        icon.className = likeData.isLiked ? 'fas fa-heart' : 'far fa-heart';
        icon.style.color = likeData.isLiked ? '#e74c3c' : '';
      }

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = ` ${likeData.likes}`;
      }

      // 添加点赞动画效果
      if (likeData.isLiked) {
        button.classList.add('liked');
        this.addLikeAnimation(button);
      } else {
        button.classList.remove('liked');
      }
    });
  }

  /**
   * 更新所有回复点赞按钮
   */
  updateAllReplyLikeButtons(replyId) {
    const buttons = document.querySelectorAll(`.like-reply[data-reply-id="${replyId}"]`);
    const likeData = this.replyLikesData[replyId];

    buttons.forEach(button => {
      const icon = button.querySelector('i');
      const textNode = button.childNodes[button.childNodes.length - 1];

      if (icon) {
        icon.className = likeData.isLiked ? 'fas fa-heart' : 'far fa-heart';
        icon.style.color = likeData.isLiked ? '#e74c3c' : '';
      }

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = ` ${likeData.likes}`;
      }

      // 添加点赞动画效果
      if (likeData.isLiked) {
        button.classList.add('liked');
        this.addLikeAnimation(button);
      } else {
        button.classList.remove('liked');
      }
    });
  }

  /**
   * 添加点赞动画效果
   */
  addLikeAnimation(button) {
    // 添加缩放动画
    button.style.transform = 'scale(1.2)';
    button.style.transition = 'transform 0.2s ease';

    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 200);

    // 创建飘心动画
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
      position: absolute;
      pointer-events: none;
      font-size: 16px;
      z-index: 1000;
      animation: heartFloat 1s ease-out forwards;
    `;

    // 获取按钮位置
    const rect = button.getBoundingClientRect();
    const phoneContainer = document.querySelector('.mobile-phone-container');
    const phoneRect = phoneContainer ? phoneContainer.getBoundingClientRect() : { left: 0, top: 0 };

    heart.style.left = rect.left - phoneRect.left + rect.width / 2 + 'px';
    heart.style.top = rect.top - phoneRect.top + 'px';

    // 添加到手机容器而不是body
    if (phoneContainer) {
      phoneContainer.appendChild(heart);
    } else {
      document.body.appendChild(heart);
    }

    // 移除动画元素
    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
    }, 1000);
  }

  /**
   * 删除论坛帖子及其所有回复
   */
  async deleteThread(threadId) {
    console.log('[Forum UI] 开始删除帖子:', threadId);

    try {
      // 显示确认对话框
      if (!confirm(`确定要删除帖子 ID: t${threadId} 及其所有回复吗？此操作不可撤销。`)) {
        return;
      }

      // 获取当前聊天数据
      if (!window.mobileContextEditor) {
        throw new Error('上下文编辑器未就绪');
      }

      const chatData = window.mobileContextEditor.getCurrentChatData();
      if (!chatData || !chatData.messages || chatData.messages.length === 0) {
        throw new Error('无聊天数据');
      }

      // 获取第一条消息（包含论坛内容）
      const firstMessage = chatData.messages[0];
      if (!firstMessage || !firstMessage.mes) {
        throw new Error('无法找到论坛内容');
      }

      let content = firstMessage.mes;

      // 提取论坛标记之间的内容
      const forumRegex = /<!-- FORUM_CONTENT_START -->([\s\S]*?)<!-- FORUM_CONTENT_END -->/;
      const match = content.match(forumRegex);

      if (!match) {
        throw new Error('未找到论坛内容标记');
      }

      let forumContent = match[1];

      // 删除包含指定帖子ID的所有格式
      // 删除主帖: [标题|发帖人昵称|帖子id|标题内容|帖子详情]
      const titleRegex = new RegExp(`\\[标题\\|[^|]+\\|${threadId}\\|[^|]+\\|[^\\]]+\\]`, 'g');
      forumContent = forumContent.replace(titleRegex, '');

      // 删除普通回复: [回复|回帖人昵称|帖子id|回复内容]
      const replyRegex = new RegExp(`\\[回复\\|[^|]+\\|${threadId}\\|[^\\]]+\\]`, 'g');
      forumContent = forumContent.replace(replyRegex, '');

      // 删除楼中楼回复: [楼中楼|回帖人昵称|帖子id|父楼层|回复内容]
      const subReplyRegex = new RegExp(`\\[楼中楼\\|[^|]+\\|${threadId}\\|[^|]+\\|[^\\]]+\\]`, 'g');
      forumContent = forumContent.replace(subReplyRegex, '');

      // 清理多余的空行
      forumContent = forumContent.replace(/\n{3,}/g, '\n\n');

      // 重新构建消息内容
      const newContent = content.replace(
        /<!-- FORUM_CONTENT_START -->[\s\S]*?<!-- FORUM_CONTENT_END -->/,
        `<!-- FORUM_CONTENT_START -->${forumContent}<!-- FORUM_CONTENT_END -->`
      );

      // 更新消息内容
      await window.mobileContextEditor.modifyMessage(0, newContent);

      console.log('[Forum UI] ✅ 帖子删除成功:', threadId);

      // 显示成功提示
      if (window.showMobileToast) {
        window.showMobileToast('🗑️ 帖子已删除', 'success');
      } else {
        alert('帖子已删除');
      }

      // 刷新论坛内容
      setTimeout(() => {
        this.refreshThreadList();
      }, 500);

    } catch (error) {
      console.error('[Forum UI] 删除帖子失败:', error);
      if (window.showMobileToast) {
        window.showMobileToast('❌ 删除失败: ' + error.message, 'error');
      } else {
        alert('删除失败: ' + error.message);
      }
    }
  }
}

// 创建全局实例
window.ForumUI = ForumUI;
window.forumUI = new ForumUI();

// 获取论坛应用内容的全局函数
window.getForumAppContent = function () {
  return window.forumUI.getForumMainHTML();
};

// 绑定论坛应用事件的全局函数
window.bindForumEvents = function () {
  if (window.forumUI) {
    window.forumUI.bindEvents();
    console.log('[Forum UI] 事件绑定完成');
  }
};

console.log('[Forum UI] 论坛UI模块加载完成');
