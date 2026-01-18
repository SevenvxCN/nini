/**
 * Friends Circle - 朋友圈功能
 * 为mobile-phone.js提供朋友圈功能，仿照QQ空间和微信朋友圈设计
 */

// 避免重复定义
if (typeof window.FriendsCircle === 'undefined') {
  /**
   * 朋友圈数据管理器
   * 负责朋友圈数据的解析、存储和管理
   */
  class FriendsCircleManager {
    constructor() {
      this.friendsCircleData = new Map(); // 存储朋友圈数据
      this.likesData = new Map(); // 存储点赞数据
      this.lastProcessedMessageId = null;
      this.lastProcessedMessageIndex = -1; // 记录上次处理到的消息索引

      // 朋友圈格式正则表达式 - 更精确的匹配，避免跨行匹配
      this.patterns = {
        // 文字朋友圈：[朋友圈|角色名|好友ID|w楼层ID|内容]
        textCircle: /\[朋友圈\|([^|\]]+)\|([^|\]]+)\|(w\d+)\|([^\]]+?)\]/g,
        // 视觉朋友圈（带文字）：[朋友圈|角色名|好友ID|s楼层ID|图片描述|文字内容]
        visualCircle: /\[朋友圈\|([^|\]]+)\|([^|\]]+)\|(s\d+)\|([^|]+?)\|([^\]]+?)\]/g,
        // 视觉朋友圈（无文字）：[朋友圈|角色名|好友ID|s楼层ID|图片描述]
        visualCircleNoText: /\[朋友圈\|([^|\]]+)\|([^|\]]+)\|(s\d+)\|([^\]]+?)\]/g,
        // 🌟 新增：用户发送的图片朋友圈格式（6个部分）：[朋友圈|角色名|好友ID|s楼层ID|图片描述|文字内容]
        userVisualCircle: /\[朋友圈\|([^|\]]+)\|([^|\]]+)\|(s\d+)\|我的图片:\s*([^|]+?)\|([^\]]+?)\]/g,
        // 朋友圈回复
        circleReply: /\[朋友圈回复\|([^|\]]+)\|([^|\]]+)\|([ws]\d+)\|([^\]]+?)\]/g,
      };

      console.log('[Friends Circle] 朋友圈数据管理器初始化完成');
    }

    /**
     * 验证朋友圈内容是否合理
     * @param {string} content - 要验证的内容
     * @returns {boolean} 是否为合理的朋友圈内容
     */
    isValidCircleContent(content) {
      if (!content || typeof content !== 'string') {
        return false;
      }

      // 检查是否包含明显的非朋友圈内容
      const invalidPatterns = [
        /^\s*-\s*序号:/, // 序号格式
        /^\s*\|\s*名字\s*\|/, // 表格头
        /^\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|/, // 表格行
        /剧情总结:/, // 剧情总结
        /^\s*<[^>]+>/, // HTML标签
        /^\s*\[好友id\|/, // 好友ID格式
        /^\s*<UpdateVariable>/, // 变量更新
        /^\s*<content>/, // content标签
        /^\s*<apple>/, // apple标签
      ];

      // 如果匹配到任何无效模式，返回false
      for (const pattern of invalidPatterns) {
        if (pattern.test(content)) {
          console.log(`[Friends Circle] ❌ 内容验证失败，匹配到无效模式: ${pattern}`, content.substring(0, 100));
          return false;
        }
      }

      // 检查内容长度是否合理（太长可能包含了其他内容）
      if (content.length > 1000) {
        console.log(`[Friends Circle] ❌ 内容过长，可能包含无关内容: ${content.length} 字符`);
        return false;
      }

      return true;
    }

    /**
     * 解析朋友圈数据
     * @param {string} chatContent - 聊天内容
     * @param {number} startIndex - 开始解析的消息索引（用于增量更新）
     * @returns {Map} 解析后的朋友圈数据
     */
    parseFriendsCircleData(chatContent, startIndex = 0) {
      const circles = new Map();

      if (!chatContent || typeof chatContent !== 'string') {
        return circles;
      }

      // 将聊天内容分割为消息数组，用于计算消息位置
      const messages = chatContent.split('\n');

      // 解析文字朋友圈
      let match;
      this.patterns.textCircle.lastIndex = 0;
      while ((match = this.patterns.textCircle.exec(chatContent)) !== null) {
        const [, author, friendId, floorId, content] = match;

        // 验证内容是否合理（不包含表格格式或其他无关内容）
        if (this.isValidCircleContent(content) && !circles.has(floorId)) {
          // 找到这条消息在聊天中的位置
          const messageIndex = this.findMessageIndex(messages, match[0], startIndex);

          const circleData = {
            id: floorId,
            author: author,
            friendId: friendId,
            type: 'text',
            content: content,
            messageIndex: messageIndex,
            latestActivityIndex: messageIndex,
            replies: [],
            likes: this.getLikeCount(floorId),
            isLiked: this.isLiked(floorId),
          };

          circles.set(floorId, circleData);
        }
      }

      // 解析视觉朋友圈（带文字）
      this.patterns.visualCircle.lastIndex = 0;
      while ((match = this.patterns.visualCircle.exec(chatContent)) !== null) {
        const [, author, friendId, floorId, imageDescription, textContent] = match;

        // 验证图片描述和文字内容是否合理
        if (
          this.isValidCircleContent(imageDescription) &&
          this.isValidCircleContent(textContent) &&
          !circles.has(floorId)
        ) {
          // 找到这条消息在聊天中的位置
          const messageIndex = this.findMessageIndex(messages, match[0], startIndex);

          // 🌟 方案1：查找对应的SillyTavern消息并提取图片信息
          const imageInfo = this.extractImageFromMessage(match[0], imageDescription, author);

          const circleData = {
            id: floorId,
            author: author,
            friendId: friendId,
            type: 'visual',
            imageDescription: imageDescription,
            imageUrl: imageInfo.imageUrl, // 🌟 添加真实图片URL
            imageFileName: imageInfo.fileName, // 🌟 添加真实文件名
            content: textContent,
            messageIndex: messageIndex,
            latestActivityIndex: messageIndex,
            replies: [],
            likes: this.getLikeCount(floorId),
            isLiked: this.isLiked(floorId),
          };

          circles.set(floorId, circleData);
        }
      }

      // 解析视觉朋友圈（无文字）
      this.patterns.visualCircleNoText.lastIndex = 0;
      while ((match = this.patterns.visualCircleNoText.exec(chatContent)) !== null) {
        const [, author, friendId, floorId, imageDescription] = match;

        // 验证图片描述是否合理，且该楼层还未被处理
        if (this.isValidCircleContent(imageDescription) && !circles.has(floorId)) {
          // 找到这条消息在聊天中的位置
          const messageIndex = this.findMessageIndex(messages, match[0], startIndex);

          // 🌟 方案1：查找对应的SillyTavern消息并提取图片信息
          const imageInfo = this.extractImageFromMessage(match[0], imageDescription, author);

          const circleData = {
            id: floorId,
            author: author,
            friendId: friendId,
            type: 'visual',
            imageDescription: imageDescription,
            imageUrl: imageInfo.imageUrl, // 🌟 添加真实图片URL
            imageFileName: imageInfo.fileName, // 🌟 添加真实文件名
            content: '', // 无文字内容
            messageIndex: messageIndex,
            latestActivityIndex: messageIndex,
            replies: [],
            likes: this.getLikeCount(floorId),
            isLiked: this.isLiked(floorId),
          };

          circles.set(floorId, circleData);
        }
      }

      // 🌟 新增：解析用户发送的图片朋友圈格式
      this.patterns.userVisualCircle.lastIndex = 0;
      while ((match = this.patterns.userVisualCircle.exec(chatContent)) !== null) {
        const [, author, friendId, floorId, fileName, textContent] = match;

        // 验证内容是否合理，且该楼层还未被处理
        if (this.isValidCircleContent(textContent) && !circles.has(floorId)) {
          // 找到这条消息在聊天中的位置
          const messageIndex = this.findMessageIndex(messages, match[0], startIndex);

          // 🌟 方案1：查找对应的SillyTavern消息并提取图片信息
          const imageInfo = this.extractImageFromMessage(match[0], fileName, author);

          const circleData = {
            id: floorId,
            author: author,
            friendId: friendId,
            type: 'visual',
            imageDescription: `我的图片: ${fileName}`, // 构建图片描述
            imageUrl: imageInfo.imageUrl, // 🌟 添加真实图片URL
            imageFileName: imageInfo.fileName || fileName, // 🌟 添加真实文件名
            content: textContent,
            messageIndex: messageIndex,
            latestActivityIndex: messageIndex,
            replies: [],
            likes: this.getLikeCount(floorId),
            isLiked: this.isLiked(floorId),
          };

          circles.set(floorId, circleData);
        }
      }

      // 解析回复
      this.patterns.circleReply.lastIndex = 0;
      while ((match = this.patterns.circleReply.exec(chatContent)) !== null) {
        const [, replyAuthor, replyFriendId, floorId, replyContent] = match;

        if (circles.has(floorId)) {
          const circle = circles.get(floorId);

          // 检查是否已存在相同回复（去重）
          const existingReply = circle.replies.find(r => r.author === replyAuthor && r.content === replyContent);

          if (!existingReply) {
            // 找到回复消息在聊天中的位置
            const replyMessageIndex = this.findMessageIndex(messages, match[0], startIndex);

            circle.replies.push({
              id: `reply_${replyMessageIndex}_${Math.random().toString(36).substring(2, 11)}`,
              author: replyAuthor,
              friendId: replyFriendId,
              content: replyContent,
              messageIndex: replyMessageIndex,
              likes: 0,
              isLiked: false,
            });

            // 更新朋友圈的最新活动位置（有新回复）
            circle.latestActivityIndex = Math.max(circle.latestActivityIndex, replyMessageIndex);

            console.log(`[Friends Circle] ✅ 解析到回复: ${replyAuthor} -> ${floorId} at index ${replyMessageIndex}`);
          }
        }
      }

      console.log(`[Friends Circle] 解析到 ${circles.size} 条朋友圈`);
      return circles;
    }

    /**
     * 🌟 方案1：从SillyTavern消息中提取图片信息
     * @param {string} circleContent - 朋友圈内容
     * @param {string} fileName - 文件名
     * @param {string} author - 作者
     * @returns {Object} 图片信息 {imageUrl, fileName}
     */
    extractImageFromMessage(circleContent, fileName, author) {
      try {
        // 获取SillyTavern聊天数据
        let chatMessages = null;

        // 优先使用SillyTavern.getContext().chat
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            chatMessages = context.chat;
          }
        }

        // 备用方案：从全局变量获取
        if (!chatMessages && window.chat && Array.isArray(window.chat)) {
          chatMessages = window.chat;
        }

        if (!chatMessages) {
          console.warn('[Friends Circle] 无法获取SillyTavern聊天数据');
          return { imageUrl: null, fileName: fileName };
        }

        // 🌟 关键：查找包含朋友圈内容的消息
        const targetMessage = chatMessages.find(message => {
          const content = message.mes || message.content || '';
          return content.includes(circleContent.trim());
        });

        if (!targetMessage) {
          console.warn('[Friends Circle] 未找到对应的SillyTavern消息');
          return { imageUrl: null, fileName: fileName };
        }

        // 🌟 方法1：从message.extra.image获取图片URL
        if (targetMessage.extra && targetMessage.extra.image) {
          const imageUrl = targetMessage.extra.image;
          const realFileName = imageUrl.split('/').pop();

          return { imageUrl: imageUrl, fileName: realFileName };
        }

        // 🌟 方法2：从detailedContent中提取<img>标签
        if (targetMessage.detailedContent) {
          const imgMatch = targetMessage.detailedContent.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch) {
            const imageUrl = imgMatch[1];
            const realFileName = imageUrl.split('/').pop();

            return { imageUrl: imageUrl, fileName: realFileName };
          }
        }

        // 🌟 方法3：使用AttachmentSender构建图片URL
        if (window.attachmentSender && typeof window.attachmentSender.buildImageUrl === 'function') {
          const imageUrl = window.attachmentSender.buildImageUrl(author, fileName);

          return { imageUrl: imageUrl, fileName: fileName };
        }

        console.warn('[Friends Circle] 所有方法都无法获取图片URL，使用占位符');
        return { imageUrl: null, fileName: fileName };
      } catch (error) {
        console.error('[Friends Circle] 提取图片信息失败:', error);
        return { imageUrl: null, fileName: fileName };
      }
    }

    /**
     * 查找消息在聊天中的位置索引
     * @param {Array} messages - 消息数组
     * @param {string} targetMessage - 目标消息内容
     * @param {number} startIndex - 开始搜索的索引
     * @returns {number} 消息位置索引
     */
    findMessageIndex(messages, targetMessage, startIndex = 0) {
      // 从指定位置开始搜索，找到包含目标消息的行
      for (let i = startIndex; i < messages.length; i++) {
        if (messages[i].includes(targetMessage)) {
          return i;
        }
      }

      // 如果没找到，从头开始搜索（兼容性处理）
      for (let i = 0; i < startIndex; i++) {
        if (messages[i].includes(targetMessage)) {
          return i;
        }
      }

      // 如果还是没找到，返回一个基于当前时间的索引
      return messages.length + (Math.floor(Date.now() / 1000) % 1000);
    }

    /**
     * 增量解析朋友圈数据（专门用于增量更新）
     * @param {string} fullChatContent - 完整的聊天内容
     * @param {number} lastProcessedIndex - 上次处理到的消息索引
     * @returns {Map} 新增或更新的朋友圈数据
     */
    parseIncrementalData(fullChatContent, lastProcessedIndex) {
      const circles = new Map();
      const messages = fullChatContent.split('\n');

      console.log(`[Friends Circle] 增量解析：总消息数 ${messages.length}，上次处理到 ${lastProcessedIndex}`);

      // 只查找新增消息中的朋友圈（原始朋友圈发布）
      for (let i = lastProcessedIndex; i < messages.length; i++) {
        const message = messages[i];

        // 检查是否是新的朋友圈发布
        const textMatch = this.patterns.textCircle.exec(message);
        if (textMatch) {
          const [, author, friendId, floorId, content] = textMatch;
          if (this.isValidCircleContent(content) && !circles.has(floorId)) {
            circles.set(floorId, {
              id: floorId,
              author: author,
              friendId: friendId,
              type: 'text',
              content: content,
              messageIndex: i,
              latestActivityIndex: i,
              replies: [],
              likes: this.getLikeCount(floorId),
              isLiked: this.isLiked(floorId),
            });
            console.log(`[Friends Circle] 增量解析到新文字朋友圈: ${author} (${floorId}) at index ${i}`);
          }
        }

        // 重置正则表达式
        this.patterns.textCircle.lastIndex = 0;

        // 检查视觉朋友圈（带文字）
        const visualMatch = this.patterns.visualCircle.exec(message);
        if (visualMatch) {
          const [, author, friendId, floorId, imageDescription, textContent] = visualMatch;
          if (
            this.isValidCircleContent(imageDescription) &&
            this.isValidCircleContent(textContent) &&
            !circles.has(floorId)
          ) {
            circles.set(floorId, {
              id: floorId,
              author: author,
              friendId: friendId,
              type: 'visual',
              imageDescription: imageDescription,
              content: textContent,
              messageIndex: i,
              latestActivityIndex: i,
              replies: [],
              likes: this.getLikeCount(floorId),
              isLiked: this.isLiked(floorId),
            });
            console.log(`[Friends Circle] 增量解析到新视觉朋友圈: ${author} (${floorId}) at index ${i}`);
          }
        }

        // 重置正则表达式
        this.patterns.visualCircle.lastIndex = 0;

        // 检查视觉朋友圈（无文字）
        const visualNoTextMatch = this.patterns.visualCircleNoText.exec(message);
        if (visualNoTextMatch) {
          const [, author, friendId, floorId, imageDescription] = visualNoTextMatch;
          if (this.isValidCircleContent(imageDescription) && !circles.has(floorId)) {
            circles.set(floorId, {
              id: floorId,
              author: author,
              friendId: friendId,
              type: 'visual',
              imageDescription: imageDescription,
              content: '',
              messageIndex: i,
              latestActivityIndex: i,
              replies: [],
              likes: this.getLikeCount(floorId),
              isLiked: this.isLiked(floorId),
            });
            console.log(`[Friends Circle] 增量解析到新视觉朋友圈(无文字): ${author} (${floorId}) at index ${i}`);
          }
        }

        // 重置正则表达式
        this.patterns.visualCircleNoText.lastIndex = 0;

        // 🌟 新增：检查用户发送的图片朋友圈格式
        const userVisualMatch = this.patterns.userVisualCircle.exec(message);
        if (userVisualMatch) {
          const [, author, friendId, floorId, fileName, textContent] = userVisualMatch;
          if (this.isValidCircleContent(textContent) && !circles.has(floorId)) {
            circles.set(floorId, {
              id: floorId,
              author: author,
              friendId: friendId,
              type: 'visual',
              imageDescription: `我的图片: ${fileName}`,
              content: textContent,
              messageIndex: i,
              latestActivityIndex: i,
              replies: [],
              likes: this.getLikeCount(floorId),
              isLiked: this.isLiked(floorId),
            });
            console.log(
              `[Friends Circle] 增量解析到用户图片朋友圈: ${author} (${floorId}) - ${fileName} at index ${i}`,
            );
          }
        }

        // 重置正则表达式
        this.patterns.userVisualCircle.lastIndex = 0;
      }

      // 处理所有回复（包括对已存在朋友圈的新回复）
      this.patterns.circleReply.lastIndex = 0;
      let replyMatch;
      while ((replyMatch = this.patterns.circleReply.exec(fullChatContent)) !== null) {
        const [, replyAuthor, replyFriendId, floorId, replyContent] = replyMatch;

        // 找到回复在消息中的位置
        const replyMessageIndex = this.findMessageIndex(messages, replyMatch[0], 0);

        // 只处理新增消息中的回复
        if (replyMessageIndex >= lastProcessedIndex) {
          // 检查是否是对新朋友圈的回复
          if (circles.has(floorId)) {
            const circle = circles.get(floorId);
            const existingReply = circle.replies.find(r => r.author === replyAuthor && r.content === replyContent);

            if (!existingReply) {
              circle.replies.push({
                id: `reply_${replyMessageIndex}_${Math.random().toString(36).substring(2, 11)}`,
                author: replyAuthor,
                friendId: replyFriendId,
                content: replyContent,
                messageIndex: replyMessageIndex,
                likes: 0,
                isLiked: false,
              });

              circle.latestActivityIndex = Math.max(circle.latestActivityIndex, replyMessageIndex);
              console.log(
                `[Friends Circle] 增量解析到新回复: ${replyAuthor} -> ${floorId} at index ${replyMessageIndex}`,
              );
            }
          } else {
            // 这是对已存在朋友圈的新回复，需要特殊处理
            // 创建一个特殊的更新条目
            const updateKey = `update_${floorId}`;
            if (!circles.has(updateKey)) {
              circles.set(updateKey, {
                id: floorId,
                isUpdate: true, // 标记这是一个更新条目
                newReplies: [],
                latestActivityIndex: replyMessageIndex,
              });
            }

            const updateEntry = circles.get(updateKey);
            updateEntry.newReplies.push({
              id: `reply_${replyMessageIndex}_${Math.random().toString(36).substring(2, 11)}`,
              author: replyAuthor,
              friendId: replyFriendId,
              content: replyContent,
              messageIndex: replyMessageIndex,
              likes: 0,
              isLiked: false,
            });

            updateEntry.latestActivityIndex = Math.max(updateEntry.latestActivityIndex, replyMessageIndex);
            console.log(
              `[Friends Circle] 增量解析到对已存在朋友圈的新回复: ${replyAuthor} -> ${floorId} at index ${replyMessageIndex}`,
            );
          }
        }
      }

      console.log(`[Friends Circle] 增量解析完成，发现 ${circles.size} 个新增/更新项`);
      return circles;
    }

    /**
     * 测试视觉朋友圈解析
     * @param {string} testContent - 测试内容
     */
    testVisualCircleParsing(testContent) {
      console.log('[Friends Circle] 测试朋友圈解析...');
      console.log('测试内容:', testContent);

      // 测试文字朋友圈
      this.patterns.textCircle.lastIndex = 0;
      let match;
      while ((match = this.patterns.textCircle.exec(testContent)) !== null) {
        const [, author, friendId, floorId, content] = match;
        console.log('文字朋友圈匹配:', { author, friendId, floorId, content });
      }

      // 测试视觉朋友圈（带文字）
      this.patterns.visualCircle.lastIndex = 0;
      while ((match = this.patterns.visualCircle.exec(testContent)) !== null) {
        const [, author, friendId, floorId, imageDescription, textContent] = match;
        console.log('视觉朋友圈匹配:', { author, friendId, floorId, imageDescription, textContent });
      }

      // 测试视觉朋友圈（无文字）
      this.patterns.visualCircleNoText.lastIndex = 0;
      while ((match = this.patterns.visualCircleNoText.exec(testContent)) !== null) {
        const [, author, friendId, floorId, imageDescription] = match;
        console.log('视觉朋友圈(无文字)匹配:', { author, friendId, floorId, imageDescription });
      }

      // 测试回复
      this.patterns.circleReply.lastIndex = 0;
      while ((match = this.patterns.circleReply.exec(testContent)) !== null) {
        const [, replyAuthor, replyFriendId, floorId, replyContent] = match;
        console.log('朋友圈回复匹配:', { replyAuthor, replyFriendId, floorId, replyContent });
      }
    }

    /**
     * 获取排序后的朋友圈列表
     * @returns {Array} 按最新活动位置降序排序的朋友圈数组
     */
    getSortedFriendsCircles() {
      const circles = Array.from(this.friendsCircleData.values());

      // 计算每个朋友圈的最新活动位置（包括回复位置）
      const circlesWithActivity = circles.map(circle => {
        let latestActivityIndex = circle.latestActivityIndex || circle.messageIndex || 0;

        // 检查所有回复的位置，找到最新的
        if (circle.replies && circle.replies.length > 0) {
          circle.replies.forEach(reply => {
            if (reply.messageIndex && reply.messageIndex > latestActivityIndex) {
              latestActivityIndex = reply.messageIndex;
            }
          });
        }

        return {
          ...circle,
          latestActivityIndex: latestActivityIndex,
        };
      });

      // 按最新活动位置降序排序（位置越大越新，排在前面）
      return circlesWithActivity.sort((a, b) => b.latestActivityIndex - a.latestActivityIndex);
    }

    /**
     * 切换点赞状态
     * @param {string} circleId - 朋友圈ID
     * @returns {Object} 点赞数据
     */
    toggleLike(circleId) {
      const currentLikes = this.getLikeCount(circleId);
      const isCurrentlyLiked = this.isLiked(circleId);

      if (isCurrentlyLiked) {
        this.likesData.set(circleId, { likes: currentLikes - 1, isLiked: false });
      } else {
        this.likesData.set(circleId, { likes: currentLikes + 1, isLiked: true });
      }

      // 更新朋友圈数据中的点赞信息
      if (this.friendsCircleData.has(circleId)) {
        const circle = this.friendsCircleData.get(circleId);
        const likeData = this.likesData.get(circleId);
        circle.likes = likeData.likes;
        circle.isLiked = likeData.isLiked;
      }

      return this.likesData.get(circleId);
    }

    /**
     * 获取点赞数量
     * @param {string} circleId - 朋友圈ID
     * @returns {number} 点赞数量
     */
    getLikeCount(circleId) {
      if (this.likesData.has(circleId)) {
        return this.likesData.get(circleId).likes;
      }
      // 初始化随机点赞数
      const initialLikes = Math.floor(Math.random() * 20) + 5;
      this.likesData.set(circleId, { likes: initialLikes, isLiked: false });
      return initialLikes;
    }

    /**
     * 检查是否已点赞
     * @param {string} circleId - 朋友圈ID
     * @returns {boolean} 是否已点赞
     */
    isLiked(circleId) {
      return this.likesData.get(circleId)?.isLiked || false;
    }

    /**
     * 更新朋友圈数据（支持增量更新）
     * @param {Map} newCircles - 新的朋友圈数据
     * @param {boolean} isIncremental - 是否为增量更新
     */
    updateFriendsCircleData(newCircles, isIncremental = false) {
      if (isIncremental) {
        // 增量更新：合并新数据到现有数据
        let addedCount = 0;
        let updatedCount = 0;

        for (const [key, newData] of newCircles) {
          if (newData.isUpdate) {
            // 这是一个更新条目，处理对已存在朋友圈的回复
            const circleId = newData.id;
            if (this.friendsCircleData.has(circleId)) {
              const existingCircle = this.friendsCircleData.get(circleId);
              const existingReplies = existingCircle.replies || [];

              // 添加新回复（去重）
              for (const newReply of newData.newReplies) {
                const exists = existingReplies.some(
                  r => r.author === newReply.author && r.content === newReply.content,
                );
                if (!exists) {
                  existingReplies.push(newReply);
                }
              }

              // 更新最新活动位置
              existingCircle.replies = existingReplies;
              existingCircle.latestActivityIndex = Math.max(
                existingCircle.latestActivityIndex || existingCircle.messageIndex,
                newData.latestActivityIndex,
              );

              updatedCount++;
              console.log(
                `[Friends Circle] 更新已存在朋友圈 ${circleId} 的回复，新增 ${newData.newReplies.length} 条回复`,
              );
            }
          } else {
            // 这是新朋友圈或对新朋友圈的回复
            const circleId = newData.id;
            if (this.friendsCircleData.has(circleId)) {
              // 已存在的朋友圈，合并回复
              const existingCircle = this.friendsCircleData.get(circleId);
              const existingReplies = existingCircle.replies || [];
              const newReplies = newData.replies || [];

              for (const newReply of newReplies) {
                const exists = existingReplies.some(
                  r => r.author === newReply.author && r.content === newReply.content,
                );
                if (!exists) {
                  existingReplies.push(newReply);
                }
              }

              // 更新最新活动位置
              existingCircle.replies = existingReplies;
              existingCircle.latestActivityIndex = Math.max(
                existingCircle.latestActivityIndex || existingCircle.messageIndex,
                newData.latestActivityIndex || newData.messageIndex,
              );

              updatedCount++;
            } else {
              // 新朋友圈，直接添加
              this.friendsCircleData.set(circleId, newData);
              addedCount++;
            }
          }
        }

        console.log(
          `[Friends Circle] 增量更新完成：新增 ${addedCount} 条，更新 ${updatedCount} 条，总计 ${this.friendsCircleData.size} 条`,
        );
      } else {
        // 全量更新：直接替换
        this.friendsCircleData = newCircles;
        console.log(`[Friends Circle] 全量更新完成，共 ${newCircles.size} 条`);
      }
    }

    /**
     * 刷新朋友圈数据（用于事件监听器调用）
     * @param {boolean} forceFullRefresh - 是否强制全量刷新
     */
    async refreshData(forceFullRefresh = false) {
      try {
        // 获取聊天内容
        const chatContent = await this.getChatContent();

        if (!chatContent) {
          console.log('[Friends Circle] 没有聊天内容，跳过刷新');
          return;
        }

        const messages = chatContent.split('\n');
        const currentMessageCount = messages.length;

        // 判断是否需要增量更新
        const shouldUseIncremental =
          !forceFullRefresh &&
          this.lastProcessedMessageIndex >= 0 &&
          currentMessageCount > this.lastProcessedMessageIndex &&
          this.friendsCircleData.size > 0; // 确保有历史数据

        if (shouldUseIncremental) {
          // 增量更新：只解析新增的消息
          console.log(
            `[Friends Circle] 执行增量更新：从消息索引 ${this.lastProcessedMessageIndex} 到 ${currentMessageCount}`,
          );

          // 使用新的增量解析方法
          const newCircles = this.parseIncrementalData(chatContent, this.lastProcessedMessageIndex);

          // 增量更新数据
          if (newCircles.size > 0) {
            this.updateFriendsCircleData(newCircles, true);
            console.log(`[Friends Circle] 增量更新成功，处理了 ${newCircles.size} 个新增/更新项`);
          } else {
            console.log('[Friends Circle] 增量更新：没有发现新的朋友圈数据');
          }
        } else {
          // 全量更新：解析所有消息
          console.log('[Friends Circle] 执行全量更新');

          // 解析所有朋友圈数据
          const newCircles = this.parseFriendsCircleData(chatContent, 0);

          // 全量更新数据
          this.updateFriendsCircleData(newCircles, false);
        }

        // 更新已处理的消息索引
        this.lastProcessedMessageIndex = currentMessageCount;

        console.log('[Friends Circle] 数据刷新完成');
      } catch (error) {
        console.error('[Friends Circle] 刷新数据失败:', error);
      }
    }

    /**
     * 获取聊天内容（用于数据刷新）
     */
    async getChatContent() {
      try {
        // 方法1: 使用SillyTavern.getContext
        if (window.SillyTavern?.getContext) {
          const context = window.SillyTavern.getContext();
          if (context?.chat && Array.isArray(context.chat)) {
            return context.chat.map(msg => msg.mes || '').join('\n');
          }
        }

        // 方法2: 使用父窗口chat
        if (window.parent?.chat && Array.isArray(window.parent.chat)) {
          return window.parent.chat.map(msg => msg.mes || '').join('\n');
        }

        // 方法3: 使用contextMonitor
        if (window.contextMonitor?.getCurrentChatMessages) {
          const chatData = await window.contextMonitor.getCurrentChatMessages();
          if (chatData?.messages) {
            return chatData.messages.map(msg => msg.mes || '').join('\n');
          }
        }

        return '';
      } catch (error) {
        console.error('[Friends Circle] 获取聊天内容失败:', error);
        return '';
      }
    }
  }

  /**
   * 朋友圈事件监听器
   * 复用live-app的智能检测机制
   */
  class FriendsCircleEventListener {
    constructor(friendsCircle) {
      this.friendsCircle = friendsCircle;
      this.isListening = false;
      this.lastMessageCount = 0;
      this.pollingInterval = null;
      this.messageReceivedHandler = this.onMessageReceived.bind(this);
    }

    /**
     * 开始监听SillyTavern事件
     */
    startListening() {
      if (this.isListening) {
        console.log('[Friends Circle] 监听器已经在运行中');
        return;
      }

      console.log('[Friends Circle] 开始设置事件监听...');
      let eventListenerSet = false;

      try {
        // 方法1: 优先使用SillyTavern.getContext().eventSource（iframe环境推荐）
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.eventSource && typeof context.eventSource.on === 'function' && context.event_types) {
            console.log('[Friends Circle] 使用SillyTavern.getContext().eventSource监听MESSAGE_RECEIVED事件');
            context.eventSource.on(context.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
            this.isListening = true;
            eventListenerSet = true;
            console.log('[Friends Circle] ✅ 成功开始监听SillyTavern消息事件 (context.eventSource)');
            this.updateMessageCount();
            return;
          }
        }

        // 方法2: 尝试使用全局eventOn函数（如果可用）
        if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined' && tavern_events.MESSAGE_RECEIVED) {
          console.log('[Friends Circle] 使用全局eventOn监听MESSAGE_RECEIVED事件');
          eventOn(tavern_events.MESSAGE_RECEIVED, this.messageReceivedHandler);
          this.isListening = true;
          eventListenerSet = true;
          console.log('[Friends Circle] ✅ 成功开始监听SillyTavern消息事件 (eventOn)');
          this.updateMessageCount();
          return;
        }

        // 方法3: 尝试使用父窗口的事件系统
        if (typeof window.parent !== 'undefined' && window.parent !== window) {
          try {
            const parentEventSource = window.parent.eventSource;
            const parentEventTypes = window.parent.event_types;
            if (parentEventSource && parentEventTypes && parentEventTypes.MESSAGE_RECEIVED) {
              console.log('[Friends Circle] 使用父窗口事件系统监听MESSAGE_RECEIVED事件');
              parentEventSource.on(parentEventTypes.MESSAGE_RECEIVED, this.messageReceivedHandler);
              this.isListening = true;
              eventListenerSet = true;
              console.log('[Friends Circle] ✅ 成功开始监听SillyTavern消息事件 (parent)');
              this.updateMessageCount();
              return;
            }
          } catch (parentError) {
            console.warn('[Friends Circle] 无法访问父窗口事件系统:', parentError);
          }
        }

        // 方法4: 尝试使用window.eventSource
        if (typeof window.eventSource !== 'undefined' && typeof window.event_types !== 'undefined') {
          try {
            if (window.eventSource.on && window.event_types.MESSAGE_RECEIVED) {
              console.log('[Friends Circle] 使用window.eventSource监听MESSAGE_RECEIVED事件');
              window.eventSource.on(window.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
              this.isListening = true;
              eventListenerSet = true;
              console.log('[Friends Circle] ✅ 成功开始监听SillyTavern消息事件 (window.eventSource)');
              this.updateMessageCount();
              return;
            }
          } catch (windowError) {
            console.warn('[Friends Circle] 无法使用window.eventSource:', windowError);
          }
        }
      } catch (error) {
        console.error('[Friends Circle] 设置事件监听时发生错误:', error);
      }

      // 如果所有事件监听方法都失败，使用轮询备用方案
      if (!eventListenerSet) {
        console.warn('[Friends Circle] 无法找到SillyTavern事件系统，使用轮询备用方案');
        this.startPolling();
      }
    }

    /**
     * 处理消息接收事件
     * @param {number} messageId - 消息ID
     */
    async onMessageReceived(messageId) {
      try {
        console.log(`[Friends Circle] 收到MESSAGE_RECEIVED事件: ${messageId}`);

        // 获取当前消息数量
        const currentMessageCount = this.getCurrentMessageCount();
        console.log(
          `[Friends Circle] 消息计数检查: 当前=${currentMessageCount}, 上次=${this.lastMessageCount}, messageId=${messageId}`,
        );

        if (currentMessageCount <= this.lastMessageCount) {
          console.log('[Friends Circle] 消息数量未增加，跳过处理');
          console.log('[Friends Circle] 调试信息: 可能的原因是消息计数方法返回了错误的值');

          // 强制检查一下实际的消息数量
          if (window.SillyTavern?.getContext) {
            const context = window.SillyTavern.getContext();
            console.log('[Friends Circle] SillyTavern context.chat.length:', context?.chat?.length);
          }

          // 即使消息数量看起来没有增加，也尝试刷新一次（可能是计数方法的问题）
          console.log('[Friends Circle] 强制执行一次数据刷新...');
          if (this.friendsCircle) {
            await this.friendsCircle.manager.refreshData();

            // 如果刷新后有新数据，更新消息计数
            const newCount = this.getCurrentMessageCount();
            if (newCount > this.lastMessageCount) {
              console.log(`[Friends Circle] 强制刷新后发现新消息: ${this.lastMessageCount} → ${newCount}`);
              this.lastMessageCount = newCount;
            }
          }
          return;
        }

        console.log(
          `[Friends Circle] ✅ 检测到新消息，消息数量从 ${this.lastMessageCount} 增加到 ${currentMessageCount}`,
        );
        this.lastMessageCount = currentMessageCount;

        // 更新朋友圈数据
        if (this.friendsCircle) {
          console.log('[Friends Circle] 开始更新朋友圈数据...');
          await this.friendsCircle.manager.refreshData();

          // 如果朋友圈页面处于活跃状态，立即更新界面
          if (this.friendsCircle.isActive) {
            console.log('[Friends Circle] 朋友圈页面处于活跃状态，立即更新界面');
            this.friendsCircle.updateDisplay();
          } else {
            console.log('[Friends Circle] 朋友圈页面未激活，数据已更新，下次打开时会显示新内容');
          }
        }
      } catch (error) {
        console.error('[Friends Circle] 处理消息接收事件失败:', error);
      }
    }

    /**
     * 获取当前消息数量
     * @returns {number} 消息数量
     */
    getCurrentMessageCount() {
      try {
        // 方法1: 使用SillyTavern.getContext().chat
        if (window.SillyTavern?.getContext) {
          const context = window.SillyTavern.getContext();
          if (context?.chat && Array.isArray(context.chat)) {
            return context.chat.length;
          }
        }

        // 方法2: 使用mobileContextEditor
        if (window.mobileContextEditor?.getCurrentChatData) {
          const chatData = window.mobileContextEditor.getCurrentChatData();
          if (chatData?.messages && Array.isArray(chatData.messages)) {
            return chatData.messages.length;
          }
        }

        // 方法3: 使用父窗口chat变量
        if (window.parent?.chat && Array.isArray(window.parent.chat)) {
          return window.parent.chat.length;
        }

        return 0;
      } catch (error) {
        console.warn('[Friends Circle] 获取消息数量失败:', error);
        return 0;
      }
    }

    /**
     * 更新消息计数
     */
    updateMessageCount() {
      this.lastMessageCount = this.getCurrentMessageCount();
      console.log(`[Friends Circle] 初始化消息计数: ${this.lastMessageCount}`);
    }

    /**
     * 启动轮询方案
     */
    startPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      this.updateMessageCount();
      this.pollingInterval = setInterval(() => {
        this.checkForNewMessages();
      }, 1000); // 改为1秒检查一次，更及时

      this.isListening = true;
      console.log('[Friends Circle] ✅ 启动轮询监听方案 (每1秒检查一次)');
    }

    /**
     * 检查新消息
     */
    async checkForNewMessages() {
      try {
        const currentMessageCount = this.getCurrentMessageCount();
        console.log(`[Friends Circle Debug] 检查消息: 当前=${currentMessageCount}, 上次=${this.lastMessageCount}`);

        if (currentMessageCount > this.lastMessageCount) {
          console.log(`[Friends Circle] 轮询检测到新消息: ${this.lastMessageCount} → ${currentMessageCount}`);
          await this.onMessageReceived(currentMessageCount);
        } else {
          console.log(`[Friends Circle Debug] 没有新消息`);
        }
      } catch (error) {
        console.error('[Friends Circle] 轮询检查消息失败:', error);
      }
    }

    /**
     * 手动触发消息事件（用于测试）
     */
    triggerTestMessage() {
      console.log('[Friends Circle Debug] 手动触发测试消息事件...');
      const fakeMessageId = Date.now();
      this.onMessageReceived(fakeMessageId);
    }

    /**
     * 停止监听
     */
    stopListening() {
      if (!this.isListening) return;

      try {
        // 尝试移除事件监听器
        if (window.SillyTavern?.getContext) {
          const context = window.SillyTavern.getContext();
          if (context?.eventSource?.off && context.event_types) {
            context.eventSource.off(context.event_types.MESSAGE_RECEIVED, this.messageReceivedHandler);
          }
        }

        // 清除轮询
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
        }

        this.isListening = false;
        console.log('[Friends Circle] 已停止监听事件');
      } catch (error) {
        console.error('[Friends Circle] 停止监听失败:', error);
      }
    }
  }

  /**
   * 朋友圈UI渲染器
   * 负责朋友圈界面的渲染和交互
   */
  class FriendsCircleRenderer {
    constructor(friendsCircle) {
      this.friendsCircle = friendsCircle;
      this.publishModal = null;
    }

    /**
     * 渲染朋友圈页面
     * @returns {string} 朋友圈页面HTML
     */
    renderFriendsCirclePage() {
      const userInfo = this.renderUserInfo();
      const circlesList = this.renderCirclesList();

      return `
        <div class="friends-circle-page">
          <div class="friends-circle-content">
            ${userInfo}
            <div class="circles-container">
              ${circlesList}
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 渲染用户信息区域
     * @returns {string} 用户信息HTML
     */
    renderUserInfo() {
      const userName = this.getCurrentUserName();
      const userAvatar = this.getCurrentUserAvatar();
      const userSignature = this.friendsCircle.getUserSignature();

      return `
        <div class="user-info-section">
          <div class="user-cover">
            <div class="user-avatar">
              <img src="${userAvatar}" alt="${userName}" />
            </div>
            <div class="user-details">
              <div class="user-name">${userName}</div>
              <div class="user-signature" onclick="window.friendsCircle?.editUserSignature()">
                <span class="signature-text">${userSignature}</span>
                <i class="fas fa-edit signature-edit-icon"></i>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 🌟 方案B+C：批量渲染朋友圈列表（懒加载）
     * @returns {string} 朋友圈列表HTML
     */
    renderCirclesList() {
      if (!this.friendsCircle.manager) {
        return '<div class="empty-circles"><i class="fas fa-heart"></i><span>暂无朋友圈</span></div>';
      }

      const circles = this.friendsCircle.manager.getSortedFriendsCircles();

      if (circles.length === 0) {
        return '<div class="empty-circles"><i class="fas fa-heart"></i><span>暂无朋友圈</span></div>';
      }

      // 🌟 方案B：同步批量获取基础信息，避免重复调用
      try {
        // 同步调用批量获取，如果缓存过期则更新
        this.friendsCircle.batchGetBasicInfo();
      } catch (error) {
        console.warn('[Friends Circle] 批量获取基础信息失败，使用降级处理:', error);
      }

      // 🌟 方案C：懒加载 - 只渲染前10条朋友圈
      const visibleCircles = circles.slice(0, 10);
      const remainingCount = circles.length - 10;

      let html = visibleCircles.map(circle => this.renderSingleCircle(circle)).join('');

      // 如果还有更多朋友圈，添加加载更多按钮
      if (remainingCount > 0) {
        html += `
          <div class="load-more-container" data-remaining="${remainingCount}" style="text-align: center; padding: 20px;">
            <button class="load-more-btn" onclick="window.friendsCircle.loadMoreCircles()"
                    style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-size: 14px;">
              <i class="fas fa-chevron-down" style="margin-right: 5px;"></i>
              加载更多 (还有${remainingCount}条)
            </button>
          </div>
        `;
      }

      return html;
    }

    /**
     * 渲染单个朋友圈
     * @param {Object} circle - 朋友圈数据
     * @returns {string} 单个朋友圈HTML
     */
    renderSingleCircle(circle) {
      // 🌟 方案B：使用批量缓存的信息，避免重复调用
      let friendAvatar;
      const cache = this.friendsCircle.batchCache;
      const currentUserName = cache.userName || this.getCurrentUserName();

      if (circle.author === currentUserName || circle.friendId === '483920') {
        // 用户自己的朋友圈，使用缓存的用户头像
        friendAvatar = cache.userAvatar || this.getCurrentUserAvatar();
      } else {
        // 其他好友的朋友圈，使用缓存的好友头像
        friendAvatar = cache.friendAvatars.get(circle.friendId) || this.getFriendAvatar(circle.friendId);
      }

      const timeStr = this.formatTime(circle.messageIndex || 0);
      const contentHtml = this.renderCircleContent(circle);
      const repliesHtml = this.renderCircleReplies(circle.replies, circle.id);
      const actionsHtml = this.renderCircleActions(circle);

      return `
        <div class="circle-item" data-circle-id="${circle.id}">
          <div class="circle-header">
            <div class="friend-avatar">
              <img src="${friendAvatar}" alt="${circle.author}" />
            </div>
            <div class="friend-info">
              <div class="friend-name">${circle.author}</div>
              <div class="circle-time">${timeStr}</div>
            </div>
          </div>

          <div class="circle-content">
            ${contentHtml}
          </div>

          <div class="circle-actions">
            ${actionsHtml}
          </div>

          ${repliesHtml}

          <div class="reply-input-container" id="reply-input-${circle.id}" style="display: none;">
            <input type="text" class="reply-input" placeholder="写下你的想法..." />
            <button class="reply-send-btn" onclick="window.friendsCircle?.sendCircleReply('${circle.id}')">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      `;
    }

    /**
     * 渲染朋友圈内容
     * @param {Object} circle - 朋友圈数据
     * @returns {string} 朋友圈内容HTML
     */
    renderCircleContent(circle) {
      if (circle.type === 'visual') {
        // 检查是否有真实图片URL
        const hasRealImage = circle.imageUrl && circle.imageUrl.trim();

        let imageHtml;
        if (hasRealImage) {
          // 显示真实图片
          imageHtml = `
            <div class="circle-image-container">
              <img src="${circle.imageUrl}"
                   alt="${circle.imageDescription || '朋友圈图片'}"
                   class="circle-image"
                   onclick="this.style.transform=this.style.transform?'':'scale(2)'; setTimeout(()=>this.style.transform='', 3000);"
                   loading="lazy"
                   onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-image\\'></i><span class=\\'image-description\\'>${
                     circle.imageDescription || '图片加载失败'
                   }</span></div>'">
            </div>
          `;
        } else {
          // 显示占位符
          imageHtml = `
            <div class="image-placeholder">
              <i class="fas fa-image"></i>
              <span class="image-description">${circle.imageDescription || '图片描述缺失'}</span>
            </div>
          `;
        }

        const visualHtml = `
          <div class="visual-circle-content">
            ${circle.content ? `<div class="text-content">${circle.content}</div>` : ''}
            ${imageHtml}
          </div>
        `;
        return visualHtml;
      } else {
        const textHtml = `<div class="text-circle-content">${circle.content}</div>`;
        return textHtml;
      }
    }

    /**
     * 渲染朋友圈操作按钮
     * @param {Object} circle - 朋友圈数据
     * @returns {string} 操作按钮HTML
     */
    renderCircleActions(circle) {
      const likeIcon = circle.isLiked ? 'fas fa-heart liked' : 'far fa-heart';

      return `
        <div class="actions-bar">
          <button class="action-btn like-btn" onclick="window.friendsCircle?.toggleCircleLike('${circle.id}')">
            <i class="${likeIcon}"></i>
            <span class="like-count">${circle.likes}</span>
          </button>
          <button class="action-btn reply-btn" onclick="window.friendsCircle?.toggleReplyInput('${circle.id}')">
            <i class="fas fa-comment"></i>
            <span>回复</span>
          </button>
        </div>
      `;
    }

    /**
     * 渲染朋友圈回复
     * @param {Array} replies - 回复数组
     * @param {string} circleId - 朋友圈ID
     * @returns {string} 回复HTML
     */
    renderCircleReplies(replies, circleId) {
      if (!replies || replies.length === 0) {
        return '';
      }

      const repliesHtml = replies
        .map(reply => {
          // 🔧 修复用户回复头像显示问题 + 使用批量缓存优化性能
          let replyAvatar;
          const cache = this.friendsCircle.batchCache;
          const currentUserName = cache.userName || this.getCurrentUserName();

          if (reply.author === currentUserName || reply.friendId === '483920') {
            // 用户自己的回复，使用缓存的用户头像
            replyAvatar = cache.userAvatar || this.getCurrentUserAvatar();
          } else {
            // 其他好友的回复，使用缓存的好友头像
            replyAvatar = cache.friendAvatars.get(reply.friendId) || this.getFriendAvatar(reply.friendId);
          }

          const timeStr = this.formatTime(reply.messageIndex || 0);

          return `
          <div class="circle-reply" data-reply-id="${reply.id}" data-reply-author="${reply.author}">
            <div class="reply-avatar">
              <img src="${replyAvatar}" alt="${reply.author}" />
            </div>
            <div class="reply-content">
              <div class="reply-header">
                <span class="reply-author">${reply.author}</span>
                <span class="reply-time">${timeStr}</span>
                <button class="reply-to-comment-btn" onclick="window.friendsCircle?.showReplyToComment('${circleId}', '${reply.id}', '${reply.author}')">
                  <i class="fas fa-reply"></i>
                </button>
              </div>
              <div class="reply-text">${reply.content}</div>
            </div>
          </div>
        `;
        })
        .join('');

      return `
        <div class="replies-section">
          <div class="replies-list">
            ${repliesHtml}
          </div>
        </div>
      `;
    }

    /**
     * 获取好友头像
     * @param {string} friendId - 好友ID
     * @returns {string} 头像URL
     */
    getFriendAvatar(friendId) {
      // 尝试从StyleConfigManager获取头像配置
      if (window.styleConfigManager) {
        try {
          const config = window.styleConfigManager.getConfig();
          if (config && config.messageReceivedAvatars) {
            // 查找匹配的好友头像配置
            const avatarConfig = config.messageReceivedAvatars.find(avatar => avatar.friendId === friendId);

            if (avatarConfig) {
              const imageUrl = avatarConfig.backgroundImage || avatarConfig.backgroundImageUrl;
              if (imageUrl) {
                return imageUrl;
              }
            }
          }
        } catch (error) {
          console.warn('[Friends Circle] 获取头像配置失败:', error);
        }
      }

      // 备用方案：使用默认头像
      return this.getDefaultAvatar(friendId);
    }

    /**
     * 获取默认头像
     * @param {string} friendId - 好友ID
     * @returns {string} 默认头像URL
     */
    getDefaultAvatar(friendId) {
      // 根据好友ID生成不同颜色的默认头像
      const colors = [
        '#FF6B9D',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E9',
      ];

      const colorIndex = friendId
        ? friendId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
        : 0;
      const color = colors[colorIndex];

      // 生成SVG头像
      const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="${color}"/>
          <circle cx="20" cy="16" r="6" fill="white" opacity="0.9"/>
          <path d="M10 32C10 26.4771 14.4771 22 19 22H21C25.5229 22 30 26.4771 30 32V34H10V32Z" fill="white" opacity="0.9"/>
        </svg>
      `;

      return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * 获取当前用户信息
     * @returns {string} 用户名
     */
    getCurrentUserName() {
      try {
        // 方法1: 尝试从SillyTavern的persona系统获取当前选中的用户角色名称
        const selectedPersona = this.getSelectedPersonaName();
        if (selectedPersona && selectedPersona !== '{{user}}' && selectedPersona !== 'User') {
          return selectedPersona;
        }

        // 方法2: 从SillyTavern的全局变量获取
        if (typeof window.name1 !== 'undefined' && window.name1 && window.name1.trim() && window.name1 !== '{{user}}') {
          return window.name1.trim();
        }

        // 方法3: 从power_user获取
        if (
          window.power_user &&
          window.power_user.name &&
          window.power_user.name.trim() &&
          window.power_user.name !== '{{user}}'
        ) {
          console.log('[Friends Circle] 从power_user获取用户名:', window.power_user.name);
          return window.power_user.name.trim();
        }

        // 方法4: 从SillyTavern的getContext获取
        if (window.SillyTavern && typeof window.SillyTavern.getContext === 'function') {
          const context = window.SillyTavern.getContext();
          if (context && context.name1 && context.name1.trim() && context.name1 !== '{{user}}') {
            console.log('[Friends Circle] 从SillyTavern context获取用户名:', context.name1);
            return context.name1.trim();
          }
        }

        // 方法5: 从localStorage获取
        const storedName = localStorage.getItem('name1');
        if (storedName && storedName.trim() && storedName !== '{{user}}') {
          console.log('[Friends Circle] 从localStorage获取用户名:', storedName);
          return storedName.trim();
        }

        console.log('[Friends Circle] 所有方法都未能获取到有效用户名，使用默认值');
        console.log('[Friends Circle] 调试信息:');
        console.log('- window.name1:', window.name1);
        console.log('- window.power_user:', window.power_user);
        console.log('- localStorage name1:', localStorage.getItem('name1'));
      } catch (error) {
        console.warn('[Friends Circle] 获取用户名失败:', error);
      }

      return '我';
    }

    /**
     * 获取当前选中的persona名称
     * @returns {string|null} persona名称
     */
    getSelectedPersonaName() {
      try {
        console.log('[Friends Circle] 尝试获取选中的persona名称...');

        // 方法1: 从DOM中查找选中的persona
        const selectedPersonaElement = document.querySelector('#user_avatar_block .avatar-container.selected .ch_name');
        if (selectedPersonaElement) {
          const personaName = selectedPersonaElement.textContent?.trim();
          if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
            console.log('[Friends Circle] 从DOM获取选中persona名称:', personaName);
            return personaName;
          }
        }

        // 方法2: 从SillyTavern的全局变量获取当前persona
        if (window.user_avatar && window.user_avatar.name) {
          const personaName = window.user_avatar.name.trim();
          if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
            console.log('[Friends Circle] 从user_avatar获取persona名称:', personaName);
            return personaName;
          }
        }

        // 方法3: 从power_user的persona设置获取
        if (window.power_user && window.power_user.persona_description) {
          // 尝试从persona描述中提取名称（通常在开头）
          const personaDesc = window.power_user.persona_description;
          const nameMatch = personaDesc.match(/^([^\n\r]+)/);
          if (nameMatch) {
            const personaName = nameMatch[1].trim();
            if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
              console.log('[Friends Circle] 从persona描述获取名称:', personaName);
              return personaName;
            }
          }
        }

        // 方法4: 尝试从其他可能的全局变量获取
        const possibleVars = ['persona_name', 'current_persona', 'selected_persona'];
        for (const varName of possibleVars) {
          if (window[varName] && typeof window[varName] === 'string') {
            const personaName = window[varName].trim();
            if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
              console.log(`[Friends Circle] 从${varName}获取persona名称:`, personaName);
              return personaName;
            }
          }
        }

        // 方法5: 尝试其他DOM选择器
        const alternativeSelectors = [
          '.avatar-container.selected .character_name_block .ch_name',
          '.avatar-container.selected span.ch_name',
          '#user_avatar_block .selected .ch_name',
          '.persona_management_left_column .selected .ch_name',
        ];

        for (const selector of alternativeSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const personaName = element.textContent?.trim();
            if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
              console.log(`[Friends Circle] 从DOM选择器 ${selector} 获取persona名称:`, personaName);
              return personaName;
            }
          }
        }

        // 方法6: 尝试从SillyTavern的personas数组获取
        if (window.personas && Array.isArray(window.personas)) {
          const selectedPersona = window.personas.find(p => p.selected || p.active);
          if (selectedPersona && selectedPersona.name) {
            const personaName = selectedPersona.name.trim();
            if (personaName && personaName !== '{{user}}' && personaName !== 'User') {
              console.log('[Friends Circle] 从personas数组获取persona名称:', personaName);
              return personaName;
            }
          }
        }

        console.log('[Friends Circle] 未能从任何来源获取到有效的persona名称');
        console.log('[Friends Circle] 调试信息:');
        console.log('- DOM选中元素:', document.querySelector('#user_avatar_block .avatar-container.selected'));
        console.log('- window.user_avatar:', window.user_avatar);
        console.log('- window.personas:', window.personas);
        console.log('- window.power_user.persona_description:', window.power_user?.persona_description);

        return null;
      } catch (error) {
        console.warn('[Friends Circle] 获取persona名称失败:', error);
        return null;
      }
    }

    /**
     * 调试函数：测试所有可能的用户名获取方法
     * 在浏览器控制台中调用 window.friendsCircle.debugUserNameMethods() 来测试
     */
    debugUserNameMethods() {
      console.log('=== 调试用户名获取方法 ===');

      // 测试DOM方法
      console.log('\n1. DOM方法测试:');
      const domSelectors = [
        '#user_avatar_block .avatar-container.selected .ch_name',
        '.avatar-container.selected .character_name_block .ch_name',
        '.avatar-container.selected span.ch_name',
        '#user_avatar_block .selected .ch_name',
        '.persona_management_left_column .selected .ch_name',
      ];

      domSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        console.log(`  ${selector}:`, element ? element.textContent?.trim() : 'null');
      });

      // 测试全局变量
      console.log('\n2. 全局变量测试:');
      const globalVars = ['name1', 'user_name', 'persona_name', 'current_persona', 'selected_persona', 'user_persona'];

      globalVars.forEach(varName => {
        console.log(`  window.${varName}:`, window[varName]);
      });

      // 测试对象属性
      console.log('\n3. 对象属性测试:');
      console.log('  window.power_user:', window.power_user);
      console.log('  window.user_avatar:', window.user_avatar);
      console.log('  window.personas:', window.personas);

      // 测试SillyTavern context
      console.log('\n4. SillyTavern Context测试:');
      if (window.SillyTavern && typeof window.SillyTavern.getContext === 'function') {
        const context = window.SillyTavern.getContext();
        console.log('  SillyTavern context:', context);
        console.log('  context.name1:', context?.name1);
      } else {
        console.log('  SillyTavern.getContext 不可用');
      }

      // 测试localStorage
      console.log('\n5. LocalStorage测试:');
      console.log('  localStorage.name1:', localStorage.getItem('name1'));
      console.log('  localStorage.persona_name:', localStorage.getItem('persona_name'));

      console.log('\n=== 调试完成 ===');

      // 测试当前实际获取的用户名
      console.log('\n6. 当前获取结果:');
      console.log('  getCurrentUserName():', this.getCurrentUserName());
      console.log('  getSelectedPersonaName():', this.getSelectedPersonaName());
    }

    /**
     * 获取当前用户头像
     * @returns {string} 用户头像URL
     */
    getCurrentUserAvatar() {
      // 尝试从StyleConfigManager获取用户头像配置
      if (window.styleConfigManager) {
        try {
          const config = window.styleConfigManager.getConfig();
          if (config && config.messageSentAvatar) {
            const imageUrl = config.messageSentAvatar.backgroundImage || config.messageSentAvatar.backgroundImageUrl;
            if (imageUrl) {
              return imageUrl;
            }
          }
        } catch (error) {
          console.warn('[Friends Circle] 获取用户头像配置失败:', error);
        }
      }

      // 备用方案：使用默认用户头像
      const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#74B9FF"/>
          <circle cx="20" cy="16" r="6" fill="white" opacity="0.9"/>
          <path d="M10 32C10 26.4771 14.4771 22 19 22H21C25.5229 22 30 26.4771 30 32V34H10V32Z" fill="white" opacity="0.9"/>
        </svg>
      `;

      return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * 格式化时间（基于消息位置显示相对时间）
     * @param {number} messageIndex - 消息位置索引
     * @param {number} totalMessages - 总消息数
     * @returns {string} 格式化后的时间
     */
    formatTime(messageIndex, totalMessages = null) {
      // 如果传入的是旧的时间戳格式，尝试兼容处理
      if (messageIndex > 1000000000000) {
        // 这是一个时间戳，使用原来的逻辑
        const date = new Date(messageIndex);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) {
          return '刚刚';
        } else if (diffMins < 60) {
          return `${diffMins}分钟前`;
        } else {
          return '较早';
        }
      }

      // 基于消息位置的相对时间显示
      if (totalMessages === null) {
        // 尝试获取当前总消息数
        totalMessages = this.friendsCircle?.manager?.lastProcessedMessageIndex || 1000;
      }

      const positionFromEnd = totalMessages - messageIndex;

      if (positionFromEnd <= 1) {
        return '刚刚';
      } else if (positionFromEnd <= 5) {
        return '几分钟前';
      } else if (positionFromEnd <= 20) {
        return '半小时前';
      } else if (positionFromEnd <= 50) {
        return '1小时前';
      } else if (positionFromEnd <= 100) {
        return '几小时前';
      } else if (positionFromEnd <= 200) {
        return '今天';
      } else if (positionFromEnd <= 500) {
        return '昨天';
      } else {
        return '较早';
      }
    }

    /**
     * 显示发布选择弹窗
     */
    showPublishModal() {
      if (this.publishModal) {
        this.publishModal.remove();
      }

      this.publishModal = document.createElement('div');
      this.publishModal.className = 'friends-circle-publish-modal';
      this.publishModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>发布朋友圈</h3>
            <button class="modal-close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="publish-options">
            <button class="publish-option-btn text-btn">
              <i class="fas fa-font"></i>
              <span>发文字</span>
            </button>
            <button class="publish-option-btn image-btn">
              <i class="fas fa-image"></i>
              <span>发图片</span>
            </button>
          </div>
        </div>
      `;

      // 查找元素
      const overlay = this.publishModal.querySelector('.modal-overlay');
      const closeBtn = this.publishModal.querySelector('.modal-close');
      const textBtn = this.publishModal.querySelector('.text-btn');
      const imageBtn = this.publishModal.querySelector('.image-btn');

      console.log('[Friends Circle Debug] 元素查找结果:', {
        overlay: !!overlay,
        closeBtn: !!closeBtn,
        textBtn: !!textBtn,
        imageBtn: !!imageBtn,
      });

      // 绑定事件
      if (overlay) {
        overlay.addEventListener('click', () => {
          console.log('[Friends Circle Debug] 点击了遮罩层');
          this.hidePublishModal();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          console.log('[Friends Circle Debug] 点击了关闭按钮');
          this.hidePublishModal();
        });
      }

      if (textBtn) {
        textBtn.addEventListener('click', () => {
          console.log('[Friends Circle Debug] 点击了发文字按钮');
          this.showTextPublishModal();
        });
      }

      if (imageBtn) {
        imageBtn.addEventListener('click', () => {
          console.log('[Friends Circle Debug] 点击了发图片按钮');
          this.showImagePublishModal();
        });
      }

      // 使用手机容器定位
      const mobileContainer = document.querySelector('.mobile-phone-container');
      console.log('[Friends Circle Debug] 手机容器查找结果:', !!mobileContainer);

      if (mobileContainer) {
        mobileContainer.appendChild(this.publishModal);
        console.log('[Friends Circle Debug] 弹窗已添加到手机容器');
      } else {
        document.body.appendChild(this.publishModal);
        console.log('[Friends Circle Debug] 弹窗已添加到body');
      }

      // 检查弹窗是否可见
      setTimeout(() => {
        if (!this.publishModal) {
          console.log('[Friends Circle Debug] 弹窗已被移除，跳过调试');
          return;
        }

        const modalRect = this.publishModal.getBoundingClientRect();
        const modalStyle = window.getComputedStyle(this.publishModal);
        console.log('[Friends Circle Debug] 弹窗位置和大小:', modalRect);
        console.log('[Friends Circle Debug] 弹窗关键样式:', {
          display: modalStyle.display,
          position: modalStyle.position,
          zIndex: modalStyle.zIndex,
          visibility: modalStyle.visibility,
          opacity: modalStyle.opacity,
          pointerEvents: modalStyle.pointerEvents,
        });

        // 检查弹窗内部元素
        const overlay = this.publishModal.querySelector('.modal-overlay');
        const content = this.publishModal.querySelector('.modal-content');
        const buttons = this.publishModal.querySelectorAll('button');

        console.log('[Friends Circle Debug] 弹窗内部元素:', {
          overlay: !!overlay,
          overlayRect: overlay?.getBoundingClientRect(),
          content: !!content,
          contentRect: content?.getBoundingClientRect(),
          buttonsCount: buttons.length,
        });

        // 测试点击事件
        buttons.forEach((btn, index) => {
          console.log(`[Friends Circle Debug] 按钮 ${index}:`, {
            className: btn.className,
            rect: btn.getBoundingClientRect(),
            style: {
              pointerEvents: window.getComputedStyle(btn).pointerEvents,
              zIndex: window.getComputedStyle(btn).zIndex,
            },
          });
        });
      }, 100);

      console.log('[Friends Circle Debug] 发布弹窗显示完成');
    }

    /**
     * 隐藏发布弹窗
     */
    hidePublishModal() {
      if (this.publishModal) {
        this.publishModal.remove();
        this.publishModal = null;
      }
    }

    /**
     * 显示文字发布弹窗
     */
    showTextPublishModal() {
      this.hidePublishModal();

      const modal = document.createElement('div');
      modal.className = 'friends-circle-text-publish-modal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>发布文字朋友圈</h3>
            <button class="modal-close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <textarea class="text-input" placeholder="分享新鲜事..." maxlength="500"></textarea>
            <div class="char-count">0/500</div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn">取消</button>
            <button class="send-btn">发布</button>
          </div>
        </div>
      `;

      // 绑定事件
      const overlay = modal.querySelector('.modal-overlay');
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.cancel-btn');
      const sendBtn = modal.querySelector('.send-btn');

      const closeModal = () => modal.remove();

      overlay.addEventListener('click', closeModal);
      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      sendBtn.addEventListener('click', () => {
        console.log('[Friends Circle] 文字发布按钮被点击');
        console.log('[Friends Circle] this上下文检查:', {
          thisExists: !!this,
          thisConstructorName: this?.constructor?.name,
          hasHandleTextPublish: typeof this?.handleTextPublish === 'function',
        });

        if (this && typeof this.handleTextPublish === 'function') {
          this.handleTextPublish(modal);
        } else {
          console.error('[Friends Circle] handleTextPublish方法不存在或this上下文丢失');
          // 备用方案：直接处理文字发布
          const textInput = modal.querySelector('.text-input');
          if (textInput) {
            const content = textInput.value.trim();
            if (content) {
              // 直接调用全局朋友圈实例的方法
              if (window.friendsCircle && typeof window.friendsCircle.sendTextCircle === 'function') {
                window.friendsCircle.sendTextCircle(content);
                modal.remove();
              } else {
                console.error('[Friends Circle] 无法找到全局朋友圈实例');
              }
            }
          }
        }
      });

      // 使用手机容器定位
      const mobileContainer = document.querySelector('.mobile-phone-container');
      if (mobileContainer) {
        mobileContainer.appendChild(modal);
      } else {
        document.body.appendChild(modal);
      }

      // 绑定字数统计
      const textInput = modal.querySelector('.text-input');
      const charCount = modal.querySelector('.char-count');
      if (textInput && charCount) {
        textInput.addEventListener('input', () => {
          const count = textInput.value.length;
          charCount.textContent = `${count}/500`;
          if (count > 450) {
            charCount.style.color = '#ff6b9d';
          } else {
            charCount.style.color = '#999';
          }
        });
        textInput.focus();
      }

      console.log('[Friends Circle] 文字发布弹窗已显示，事件已绑定');
    }

    /**
     * 显示图片发布弹窗
     */
    showImagePublishModal() {
      this.hidePublishModal();

      const modal = document.createElement('div');
      modal.className = 'friends-circle-image-publish-modal';
      modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>发布图片朋友圈</h3>
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>图片描述</label>
              <textarea class="image-desc-input" placeholder="描述图片内容..." maxlength="200"></textarea>
              <div class="char-count">0/200</div>
            </div>
            <div class="form-group">
              <label>配文（必填！！！）</label>
              <textarea class="text-input" placeholder="说点什么..." maxlength="300"></textarea>
              <div class="char-count">0/300</div>
            </div>
            <div class="form-group">
              <label>上传图片</label>
              <div class="attachment-upload-area">
                <div class="file-drop-zone" id="friends-circle-drop-zone">
                  <div class="drop-zone-content">
                    <i class="fas fa-image"></i>
                    <div class="upload-text">点击选择图片或拖拽图片到此处</div>
                    <div class="upload-hint">支持jpg、png、gif、webp等格式，最大10MB</div>
                  </div>
                  <input type="file" class="hidden-file-input" accept="image/*" id="friends-circle-file-input">
                </div>
                <div class="image-preview-area" id="friends-circle-preview-area" style="display: none;">
                  <div class="preview-image-container">
                    <img class="preview-image" alt="预览图片" id="friends-circle-preview-image">
                    <button class="remove-image-btn" id="friends-circle-remove-image">×</button>
                    <div class="image-info">
                      <span class="image-name" id="friends-circle-image-name"></span>
                      <span class="image-size" id="friends-circle-image-size"></span>
                    </div>
                  </div>
                </div>
                <div class="upload-status" id="friends-circle-upload-status" style="display: none;">
                  <div class="upload-progress">
                    <div class="progress-bar" id="friends-circle-progress-bar"></div>
                  </div>
                  <div class="upload-text" id="friends-circle-upload-text">上传中...</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" onclick="this.parentElement.parentElement.parentElement.remove()">取消</button>
            <button class="send-btn" id="friends-circle-publish-btn">发布</button>
          </div>
        </div>
      `;

      // 使用手机容器定位
      const mobileContainer = document.querySelector('.mobile-phone-container');
      if (mobileContainer) {
        mobileContainer.appendChild(modal);
      } else {
        document.body.appendChild(modal);
      }

      // 绑定字数统计
      const imageDescInput = modal.querySelector('.image-desc-input');
      const textInput = modal.querySelector('.text-input');
      const charCounts = modal.querySelectorAll('.char-count');

      if (imageDescInput && charCounts[0]) {
        imageDescInput.addEventListener('input', () => {
          const count = imageDescInput.value.length;
          charCounts[0].textContent = `${count}/200`;
          if (count > 180) {
            charCounts[0].style.color = '#ff6b9d';
          } else {
            charCounts[0].style.color = '#999';
          }
        });
      }

      if (textInput && charCounts[1]) {
        textInput.addEventListener('input', () => {
          const count = textInput.value.length;
          charCounts[1].textContent = `${count}/300`;
          if (count > 270) {
            charCounts[1].style.color = '#ff6b9d';
          } else {
            charCounts[1].style.color = '#999';
          }
        });
      }

      // 绑定图片上传功能
      this.bindImageUploadEvents(modal);

      if (imageDescInput) {
        imageDescInput.focus();
      }
    }

    /**
     * 绑定图片上传相关事件
     */
    bindImageUploadEvents(modal) {
      const dropZone = modal.querySelector('#friends-circle-drop-zone');
      const fileInput = modal.querySelector('#friends-circle-file-input');
      const previewArea = modal.querySelector('#friends-circle-preview-area');
      const previewImage = modal.querySelector('#friends-circle-preview-image');
      const removeBtn = modal.querySelector('#friends-circle-remove-image');
      const imageName = modal.querySelector('#friends-circle-image-name');
      const imageSize = modal.querySelector('#friends-circle-image-size');
      const uploadStatus = modal.querySelector('#friends-circle-upload-status');
      const publishBtn = modal.querySelector('#friends-circle-publish-btn');

      if (!dropZone || !fileInput) {
        console.warn('[Friends Circle] 上传区域元素未找到');
        return;
      }

      // 点击上传区域触发文件选择
      dropZone.addEventListener('click', () => {
        fileInput.click();
      });

      // 文件选择事件
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          this.handleImageFileSelection(file, {
            previewArea,
            previewImage,
            imageName,
            imageSize,
            uploadStatus,
            publishBtn,
            dropZone,
          });
        }
      });

      // 拖拽事件
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          this.handleImageFileSelection(file, {
            previewArea,
            previewImage,
            imageName,
            imageSize,
            uploadStatus,
            publishBtn,
            dropZone,
          });
        }
      });

      // 移除图片事件
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          this.clearImageSelection({
            previewArea,
            uploadStatus,
            publishBtn,
            dropZone,
            fileInput,
          });
        });
      }

      // 绑定发布按钮事件 - 使用全局引用确保正确调用
      if (publishBtn) {
        publishBtn.addEventListener('click', () => {
          console.log('[Friends Circle] 发布按钮被点击');
          console.log('[Friends Circle] 检查全局朋友圈实例:', !!window.friendsCircle);
          console.log('[Friends Circle] 检查handleImagePublish方法:', typeof window.friendsCircle?.handleImagePublish);

          if (window.friendsCircle && typeof window.friendsCircle.handleImagePublish === 'function') {
            window.friendsCircle.handleImagePublish();
          } else {
            console.error('[Friends Circle] 无法调用handleImagePublish方法');
          }
        });
        console.log('[Friends Circle] 发布按钮事件已绑定');
      } else {
        console.warn('[Friends Circle] 发布按钮未找到，无法绑定事件');
      }
    }

    /**
     * 处理图片文件选择
     */
    async handleImageFileSelection(file, elements) {
      console.log('[Friends Circle] 处理图片文件选择:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        elementsProvided: !!elements,
      });

      // 确保AttachmentSender可用
      if (!window.attachmentSender) {
        console.error('[Friends Circle] AttachmentSender未找到');
        this.showToast('图片上传功能未就绪', 'error');
        return;
      }

      // 验证文件
      console.log('[Friends Circle] 开始验证文件...');
      const validation = window.attachmentSender.validateFile(file);
      console.log('[Friends Circle] 文件验证结果:', validation);

      if (!validation.isValid) {
        console.warn('[Friends Circle] 文件验证失败:', validation.errors);
        this.showToast(validation.errors.join(', '), 'error');
        return;
      }

      console.log('[Friends Circle] 文件验证成功，开始显示预览...');

      // 显示预览
      this.showImagePreview(file, elements);

      // 存储文件信息供后续上传使用
      this.selectedImageFile = file;
      this.selectedImageElements = elements;

      console.log('[Friends Circle] 文件信息已存储:', {
        selectedImageFile: !!this.selectedImageFile,
        selectedImageFileName: this.selectedImageFile ? this.selectedImageFile.name : 'none',
        thisInstanceId: this.constructor.name,
        globalInstanceExists: !!window.friendsCircle,
        globalInstanceSame: window.friendsCircle === this,
      });

      // 同时存储到全局实例中，确保数据不丢失
      if (window.friendsCircle && window.friendsCircle !== this) {
        console.warn('[Friends Circle] 检测到不同的实例，同步文件信息到全局实例');
        window.friendsCircle.selectedImageFile = file;
        window.friendsCircle.selectedImageElements = elements;
      }

      // 更新发布按钮状态
      if (elements.publishBtn) {
        elements.publishBtn.disabled = false;
        elements.publishBtn.textContent = '发布';
        console.log('[Friends Circle] 发布按钮已启用');
      } else {
        console.warn('[Friends Circle] 发布按钮未找到');
      }

      console.log('[Friends Circle] 图片文件选择处理完成');
    }

    /**
     * 显示图片预览
     */
    showImagePreview(file, elements) {
      console.log('[Friends Circle] 开始显示图片预览:', file.name);

      const { previewArea, previewImage, imageName, imageSize, dropZone } = elements;

      console.log('[Friends Circle] 预览元素检查:', {
        previewArea: !!previewArea,
        previewImage: !!previewImage,
        imageName: !!imageName,
        imageSize: !!imageSize,
        dropZone: !!dropZone,
      });

      if (!previewArea || !previewImage) {
        console.warn('[Friends Circle] 预览区域或预览图片元素未找到');
        return;
      }

      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      console.log('[Friends Circle] 创建预览URL:', previewUrl);

      // 设置预览图片
      previewImage.src = previewUrl;
      previewImage.onload = () => {
        console.log('[Friends Circle] 预览图片加载完成');
        URL.revokeObjectURL(previewUrl); // 释放内存
      };

      // 设置文件信息
      if (imageName) {
        imageName.textContent = file.name;
        console.log('[Friends Circle] 设置文件名:', file.name);
      }
      if (imageSize) {
        const sizeText = this.formatFileSize(file.size);
        imageSize.textContent = sizeText;
        console.log('[Friends Circle] 设置文件大小:', sizeText);
      }

      // 显示预览区域，隐藏上传区域
      previewArea.style.display = 'block';
      if (dropZone) {
        dropZone.style.display = 'none';
      }

      console.log('[Friends Circle] 图片预览显示完成');
    }

    /**
     * 清除图片选择
     */
    clearImageSelection(elements) {
      const { previewArea, uploadStatus, publishBtn, dropZone, fileInput } = elements;

      // 隐藏预览和上传状态
      if (previewArea) previewArea.style.display = 'none';
      if (uploadStatus) uploadStatus.style.display = 'none';

      // 显示上传区域
      if (dropZone) dropZone.style.display = 'block';

      // 清除文件输入
      if (fileInput) fileInput.value = '';

      // 重置按钮状态
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.textContent = '发布';
      }

      // 清除存储的文件
      this.selectedImageFile = null;
      this.selectedImageElements = null;
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }

  /**
   * 朋友圈主类
   * 整合所有朋友圈功能
   */
  class FriendsCircle {
    constructor() {
      this.manager = new FriendsCircleManager();
      this.eventListener = new FriendsCircleEventListener(this);
      this.renderer = new FriendsCircleRenderer(this);
      this.isActive = false;

      // 🌟 方案B：批量处理缓存
      this.batchCache = {
        userName: null,
        userAvatar: null,
        friendAvatars: new Map(),
        lastCacheTime: 0,
        cacheTimeout: 30000, // 30秒缓存过期
      };
      this.userSignature = localStorage.getItem('friendsCircle_userSignature') || '这个人很懒，什么都没留下';

      // 初始化AttachmentSender用于图片上传
      this.initializeAttachmentSender();

      // 存储选中的图片文件信息
      this.selectedImageFile = null;
      this.selectedImageElements = null;

      console.log('[Friends Circle] 朋友圈功能初始化完成');
    }

    /**
     * 🌟 方案B：批量获取基础信息
     * 一次性获取用户名、用户头像和所有好友头像，避免重复调用
     */
    batchGetBasicInfo() {
      const now = Date.now();

      // 检查缓存是否过期
      if (this.batchCache.lastCacheTime && now - this.batchCache.lastCacheTime < this.batchCache.cacheTimeout) {
        return this.batchCache;
      }

      try {
        // 批量获取用户信息
        if (!this.batchCache.userName) {
          this.batchCache.userName = this.renderer.getCurrentUserName();
        }
        if (!this.batchCache.userAvatar) {
          this.batchCache.userAvatar = this.renderer.getCurrentUserAvatar();
        }

        // 批量获取好友头像（从现有朋友圈数据中提取好友ID）
        const friendIds = new Set();
        for (const circle of this.manager.friendsCircleData.values()) {
          if (circle.friendId && circle.friendId !== '483920') {
            // 排除用户自己的ID
            friendIds.add(circle.friendId);
          }
        }

        // 批量获取所有好友头像
        for (const friendId of friendIds) {
          if (!this.batchCache.friendAvatars.has(friendId)) {
            const avatar = this.renderer.getFriendAvatar(friendId);
            if (avatar) {
              this.batchCache.friendAvatars.set(friendId, avatar);
            }
          }
        }

        this.batchCache.lastCacheTime = now;
        return this.batchCache;
      } catch (error) {
        console.error('[Friends Circle] 批量获取基础信息失败:', error);
        // 返回当前缓存状态，即使部分失败也能继续工作
        return this.batchCache;
      }
    }

    /**
     * 🌟 方案B：清空缓存（用户切换角色时调用）
     */
    clearBatchCache() {
      this.batchCache.userName = null;
      this.batchCache.userAvatar = null;
      this.batchCache.friendAvatars.clear();
      this.batchCache.lastCacheTime = 0;
    }

    /**
     * 🌟 方案C：加载更多朋友圈（懒加载）
     */
    loadMoreCircles() {
      try {
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (!loadMoreContainer) return;

        const remaining = parseInt(loadMoreContainer.dataset.remaining) || 0;
        if (remaining <= 0) return;

        const circlesContainer = document.querySelector('.circles-container');
        if (!circlesContainer) return;

        // 获取所有朋友圈数据
        const allCircles = this.manager.getSortedFriendsCircles();
        const currentCount = circlesContainer.querySelectorAll('.circle-item').length; // 当前已显示的朋友圈数量

        // 加载下一批（最多10条）
        const nextBatch = allCircles.slice(currentCount, currentCount + 10);
        const newRemaining = remaining - nextBatch.length;

        // 渲染新的朋友圈
        const newHtml = nextBatch.map(circle => this.renderer.renderSingleCircle(circle)).join('');

        // 插入到加载更多按钮之前
        loadMoreContainer.insertAdjacentHTML('beforebegin', newHtml);

        // 更新或移除加载更多按钮
        if (newRemaining > 0) {
          loadMoreContainer.dataset.remaining = newRemaining;
          loadMoreContainer.querySelector('.load-more-btn').innerHTML = `
            <i class="fas fa-chevron-down"></i>
            加载更多 (还有${newRemaining}条)
          `;
        } else {
          loadMoreContainer.remove();
        }
      } catch (error) {
        console.error('[Friends Circle] 加载更多朋友圈失败:', error);
      }
    }

    /**
     * 获取当前用户名
     * @returns {string} 用户名
     */
    getCurrentUserName() {
      // 委托给renderer的方法
      if (this.renderer && typeof this.renderer.getCurrentUserName === 'function') {
        return this.renderer.getCurrentUserName();
      }

      // 备用方案：直接获取
      try {
        // 方法1: 从persona系统获取
        if (typeof getSelectedPersona === 'function') {
          const persona = getSelectedPersona();
          if (persona && persona.name && persona.name.trim() && persona.name !== '{{user}}') {
            return persona.name.trim();
          }
        }

        // 方法2: 从DOM获取选中的persona名称
        const personaSelect = document.querySelector('#persona-management-block .persona_name_block .menu_button');
        if (
          personaSelect &&
          personaSelect.textContent &&
          personaSelect.textContent.trim() &&
          personaSelect.textContent.trim() !== '{{user}}'
        ) {
          return personaSelect.textContent.trim();
        }

        // 方法3: 从SillyTavern的全局变量获取
        if (typeof window.name1 !== 'undefined' && window.name1 && window.name1.trim() && window.name1 !== '{{user}}') {
          return window.name1.trim();
        }
      } catch (error) {
        console.warn('[Friends Circle] 获取用户名失败:', error);
      }

      // 默认返回
      return '用户';
    }

    /**
     * 初始化AttachmentSender
     */
    initializeAttachmentSender() {
      try {
        if (window.attachmentSender) {
          // 设置朋友圈为当前聊天对象
          window.attachmentSender.setCurrentChat('friends_circle', '朋友圈', false);
          console.log('[Friends Circle] AttachmentSender已配置为朋友圈模式');
        } else {
          console.warn('[Friends Circle] AttachmentSender未找到，图片上传功能可能不可用');
        }
      } catch (error) {
        console.error('[Friends Circle] 初始化AttachmentSender失败:', error);
      }
    }

    /**
     * 激活朋友圈功能
     */
    activate() {
      console.log('[Friends Circle] 开始激活朋友圈功能...');

      this.isActive = true;
      console.log('[Friends Circle] 朋友圈状态已设置为激活');

      // 启动事件监听器
      if (this.eventListener) {
        this.eventListener.startListening();
        console.log('[Friends Circle] 事件监听器已启动');
      } else {
        console.error('[Friends Circle] 事件监听器不存在！');
      }

      // 确保header正确显示
      this.updateHeader();

      // 刷新朋友圈数据
      this.refreshFriendsCircle();
      console.log('[Friends Circle] 朋友圈功能激活完成');
    }

    /**
     * 停用朋友圈功能
     */
    deactivate() {
      this.isActive = false;
      this.eventListener.stopListening();
      console.log('[Friends Circle] 朋友圈功能已停用');
    }

    /**
     * 更新朋友圈header
     */
    updateHeader() {
      console.log('[Friends Circle] 更新朋友圈header...');

      // 通知主框架更新应用状态
      if (window.mobilePhone) {
        const friendsCircleState = {
          app: 'messages',
          view: 'friendsCircle',
          title: '朋友圈',
          showBackButton: false,
          showAddButton: true,
          addButtonIcon: 'fas fa-plus',
          addButtonAction: () => {
            if (window.friendsCircle) {
              window.friendsCircle.showPublishModal();
            }
          },
        };

        window.mobilePhone.currentAppState = friendsCircleState;
        window.mobilePhone.updateAppHeader(friendsCircleState);
        console.log('[Friends Circle] Header更新完成');
      } else {
        console.warn('[Friends Circle] mobilePhone不存在，无法更新header');
      }
    }

    /**
     * 刷新朋友圈数据
     */
    async refreshFriendsCircle() {
      try {
        console.log('[Friends Circle] 开始刷新朋友圈数据...');
        console.log('[Friends Circle] 当前激活状态:', this.isActive);

        // 使用新的refreshData方法，首次激活时强制全量刷新
        const forceFullRefresh = this.manager.lastProcessedMessageIndex < 0;
        await this.manager.refreshData(forceFullRefresh);

        // 只有在激活状态下才触发界面更新
        if (this.isActive) {
          console.log('[Friends Circle] 朋友圈已激活，触发界面更新');
          this.dispatchUpdateEvent();
        } else {
          console.log('[Friends Circle] 朋友圈未激活，仅更新数据');
        }
      } catch (error) {
        console.error('[Friends Circle] 刷新朋友圈数据失败:', error);
      }
    }

    /**
     * 更新朋友圈显示
     */
    updateDisplay() {
      try {
        console.log('[Friends Circle] 更新朋友圈显示...');

        // 触发界面更新事件
        this.dispatchUpdateEvent();

        console.log('[Friends Circle] 朋友圈显示更新完成');
      } catch (error) {
        console.error('[Friends Circle] 更新显示失败:', error);
      }
    }

    /**
     * 获取聊天内容
     * @returns {Promise<string>} 聊天内容
     */
    async getChatContent() {
      try {
        // 方法1: 使用contextMonitor
        if (window.contextMonitor?.getCurrentChatMessages) {
          const chatData = await window.contextMonitor.getCurrentChatMessages();
          if (chatData?.messages) {
            return chatData.messages.map(msg => msg.mes || '').join('\n');
          }
        }

        // 方法2: 使用SillyTavern.getContext
        if (window.SillyTavern?.getContext) {
          const context = window.SillyTavern.getContext();
          if (context?.chat && Array.isArray(context.chat)) {
            return context.chat.map(msg => msg.mes || '').join('\n');
          }
        }

        // 方法3: 使用父窗口chat
        if (window.parent?.chat && Array.isArray(window.parent.chat)) {
          return window.parent.chat.map(msg => msg.mes || '').join('\n');
        }

        return '';
      } catch (error) {
        console.error('[Friends Circle] 获取聊天内容失败:', error);
        return '';
      }
    }

    /**
     * 获取用户签名
     * @returns {string} 用户签名
     */
    getUserSignature() {
      return this.userSignature;
    }

    /**
     * 设置用户签名
     * @param {string} signature - 新签名
     */
    setUserSignature(signature) {
      this.userSignature = signature;
      localStorage.setItem('friendsCircle_userSignature', signature);
      this.dispatchUpdateEvent();
    }

    /**
     * 编辑用户签名
     */
    editUserSignature() {
      const newSignature = prompt('请输入新的个性签名:', this.userSignature);
      if (newSignature !== null && newSignature.trim() !== '') {
        this.setUserSignature(newSignature.trim());
      }
    }

    /**
     * 切换朋友圈点赞
     * @param {string} circleId - 朋友圈ID
     */
    toggleCircleLike(circleId) {
      const likeData = this.manager.toggleLike(circleId);

      // 直接更新DOM，避免重新渲染整个页面
      this.updateLikeButtonUI(circleId, likeData);

      // 不调用dispatchUpdateEvent()，避免页面重新加载
      console.log(
        `[Friends Circle] 点赞状态已更新: ${circleId}, 点赞数: ${likeData.likes}, 已点赞: ${likeData.isLiked}`,
      );
    }

    /**
     * 更新点赞按钮UI
     * @param {string} circleId - 朋友圈ID
     * @param {Object} likeData - 点赞数据
     */
    updateLikeButtonUI(circleId, likeData) {
      // 查找对应的点赞按钮
      const circleElement = document.querySelector(`[data-circle-id="${circleId}"]`);
      if (!circleElement) return;

      const likeBtn = circleElement.querySelector('.like-btn');
      const likeIcon = likeBtn?.querySelector('i');
      const likeCount = likeBtn?.querySelector('.like-count');

      if (likeBtn && likeIcon && likeCount) {
        // 更新图标
        if (likeData.isLiked) {
          likeIcon.className = 'fas fa-heart liked';
          likeBtn.classList.add('liked');

          // 添加点赞动画效果
          likeBtn.classList.add('liked-animation');
          setTimeout(() => {
            likeBtn.classList.remove('liked-animation');
          }, 300);
        } else {
          likeIcon.className = 'far fa-heart';
          likeBtn.classList.remove('liked');
        }

        // 更新点赞数
        likeCount.textContent = likeData.likes;
      }
    }

    /**
     * 切换回复输入框
     * @param {string} circleId - 朋友圈ID
     */
    toggleReplyInput(circleId) {
      const inputContainer = document.getElementById(`reply-input-${circleId}`);
      if (inputContainer) {
        const isVisible = inputContainer.style.display !== 'none';

        // 隐藏所有其他回复输入框
        document.querySelectorAll('.reply-input-container').forEach(container => {
          container.style.display = 'none';
        });

        // 切换当前输入框
        if (!isVisible) {
          inputContainer.style.display = 'flex';
          const input = inputContainer.querySelector('.reply-input');
          if (input) {
            input.focus();
          }
        }
      }
    }

    /**
     * 发送朋友圈回复
     * @param {string} circleId - 朋友圈ID
     */
    async sendCircleReply(circleId) {
      const inputContainer = document.getElementById(`reply-input-${circleId}`);
      if (!inputContainer) return;

      const input = inputContainer.querySelector('.reply-input');
      if (!input) return;

      const content = input.value.trim();
      if (!content) {
        alert('请输入回复内容');
        return;
      }

      try {
        // 检查是否是回复评论
        const replyToAuthor = input.dataset.replyToAuthor;

        if (replyToAuthor) {
          // 发送回复评论
          await this.sendReplyToComment(circleId, content, replyToAuthor);
        } else {
          // 构建普通回复格式
          const replyFormat = `[朋友圈回复|{{user}}|483920|${circleId}|${content}]`;

          // 发送给AI
          await this.sendToAI(
            `用户正在回复朋友圈。请为用户的回复生成1-3个他人的响应回复，只生成回复，不要重新生成整个帖子，也不要重新生成用户的回复，用户回复已完成。\n${replyFormat}`,
          );

          this.showToast('回复已发送', 'success');
        }

        // 清空输入框并隐藏
        input.value = '';
        input.placeholder = '写下你的想法...';
        input.removeAttribute('data-reply-to-author');
        input.removeAttribute('data-reply-to-id');
        inputContainer.style.display = 'none';
      } catch (error) {
        console.error('[Friends Circle] 发送回复失败:', error);
        this.showToast('发送失败，请重试', 'error');
      }
    }

    /**
     * 显示回复评论输入框
     * @param {string} circleId - 朋友圈ID
     * @param {string} replyId - 被回复的评论ID
     * @param {string} replyAuthor - 被回复的评论作者
     */
    showReplyToComment(circleId, replyId, replyAuthor) {
      // 隐藏所有其他回复输入框
      document.querySelectorAll('.reply-input-container').forEach(container => {
        container.style.display = 'none';
      });

      // 显示主回复输入框
      const inputContainer = document.getElementById(`reply-input-${circleId}`);
      if (inputContainer) {
        inputContainer.style.display = 'flex';
        const input = inputContainer.querySelector('.reply-input');
        if (input) {
          // 设置占位符提示回复对象
          input.placeholder = `回复 ${replyAuthor}...`;
          input.focus();

          // 存储回复目标信息
          input.dataset.replyToAuthor = replyAuthor;
          input.dataset.replyToId = replyId;
        }
      }
    }

    /**
     * 发送回复评论
     * @param {string} circleId - 朋友圈ID
     * @param {string} content - 回复内容
     * @param {string} replyToAuthor - 被回复的评论作者
     */
    async sendReplyToComment(circleId, content, replyToAuthor) {
      try {
        // 构建回复评论格式
        const replyFormat = `[朋友圈回复|{{user}}|483920|${circleId}|回复${replyToAuthor}：${content}]`;

        // 发送给AI
        await this.sendToAI(
          `用户正在回复朋友圈的评论。请为用户的回复生成1-3个他人的响应回复，只生成回复，不要重新生成整个帖子，也不要重新生成用户的回复，用户回复已完成。\n${replyFormat}`,
        );

        this.showToast('回复已发送', 'success');
      } catch (error) {
        console.error('[Friends Circle] 发送回复评论失败:', error);
        this.showToast('发送失败，请重试', 'error');
      }
    }

    /**
     * 发送消息给AI
     * @param {string} message - 消息内容
     */
    async sendToAI(message) {
      try {
        console.log('[Friends Circle] 发送消息给AI:', message);

        const chatMessage = {
          role: 'user',
          message: message,
          send_date: '',
        };

        try {
          window.parent.document.querySelector('#send_textarea').value = message;
          window.parent.document.querySelector('#send_but').click();

          // 显示成功提示
          this.showToast('消息已准备好，请在主界面点击发送', 'success');
        } catch (error) {
          console.error('[Friends Circle] 发送数据到父窗口时出错:', error);
          console.error('[Friends Circle] 此功能需要页面被嵌入到正确配置的父窗口中才能工作。');
          console.log('[Friends Circle] 生成的消息:', message);
          this.showToast('无法自动发送。消息已输出到控制台，请手动复制。', 'warning');
        }
      } catch (error) {
        console.error('[Friends Circle] 发送消息失败:', error);
        this.showToast('发送失败，请重试', 'error');
        throw error;
      }
    }

    /**
     * 显示提示消息
     * @param {string} message - 提示消息
     * @param {string} type - 消息类型
     */
    showToast(message, type = 'info') {
      if (window.showMobileToast) {
        window.showMobileToast(message, type);
      } else {
        alert(message);
      }
    }

    /**
     * 显示发布弹窗
     */
    showPublishModal() {
      if (this.renderer) {
        this.renderer.showPublishModal();
      }
    }

    /**
     * 隐藏发布弹窗
     */
    hidePublishModal() {
      if (this.renderer) {
        this.renderer.hidePublishModal();
      }
    }

    /**
     * 显示文字发布界面
     */
    showTextPublish() {
      if (this.renderer) {
        this.renderer.showTextPublishModal();
      }
    }

    /**
     * 显示文字发布弹窗
     */
    showTextPublishModal() {
      if (this.renderer) {
        this.renderer.showTextPublishModal();
      }
    }

    /**
     * 显示图片发布界面
     */
    showImagePublish() {
      if (this.renderer) {
        this.renderer.showImagePublishModal();
      }
    }

    /**
     * 显示图片发布弹窗
     */
    showImagePublishModal() {
      if (this.renderer) {
        this.renderer.showImagePublishModal();
      }
    }

    /**
     * 发送文字朋友圈
     * @param {string} content - 朋友圈内容
     */
    async sendTextCircle(content) {
      try {
        // 生成随机楼层ID
        const floorId = 'w' + Math.floor(Math.random() * 900 + 100);

        // 🌟 立即存储文字朋友圈数据到管理器中
        const currentUserName = this.getCurrentUserName();
        const circleData = {
          id: floorId,
          author: currentUserName, // 使用当前用户名，而不是{{user}}
          friendId: '483920',
          type: 'text',
          content: content,
          messageIndex: -1,
          latestActivityIndex: -1,
          replies: [],
          likes: 0,
          isLiked: false,
          timestamp: new Date().toISOString(),
        };

        // 立即存储到管理器中
        this.manager.friendsCircleData.set(floorId, circleData);
        console.log('[Friends Circle] 立即存储文字朋友圈数据:', circleData);

        // 触发界面更新
        this.dispatchUpdateEvent();

        // 构建朋友圈格式
        const circleFormat = `[朋友圈|{{user}}|483920|${floorId}|${content}]`;

        // 发送给AI
        await this.sendToAI(
          `用户发送朋友圈，请使用规定的朋友圈回复格式生成3-5条可能的好友回复，仅限有好友id的好友参与朋友圈回复。请注意，你是在为现有的用户朋友圈生成回复，只生成回复，禁止重复生成用户的朋友圈格式。\n${circleFormat}`,
        );

        // 🌟 手动触发一次朋友圈解析，确保用户发送的朋友圈被正确解析
        setTimeout(async () => {
          try {
            console.log('[Friends Circle] 手动触发朋友圈解析，确保用户发送的内容被解析...');
            await this.manager.refreshData(false); // 增量刷新
            if (this.isActive) {
              this.dispatchUpdateEvent();
            }
          } catch (error) {
            console.warn('[Friends Circle] 手动触发解析失败:', error);
          }
        }, 500); // 等待500ms让SillyTavern处理消息

        this.showToast('朋友圈已发送', 'success');
        this.hidePublishModal();
      } catch (error) {
        console.error('[Friends Circle] 发送文字朋友圈失败:', error);
        this.showToast('发送失败，请重试', 'error');
      }
    }

    /**
     * 发送图片朋友圈
     * @param {string} imageDescription - 图片描述
     * @param {string} textContent - 文字内容
     * @param {File} imageFile - 图片文件（可选）
     */
    async sendImageCircle(imageDescription, textContent, imageFile) {
      try {
        // 生成随机楼层ID
        const floorId = 's' + Math.floor(Math.random() * 900 + 100);

        let finalImageDesc = imageDescription;

        // 如果有图片文件，先上传
        if (imageFile && window.mobileUploadManager) {
          try {
            const uploadResult = await window.mobileUploadManager.uploadFile(imageFile);
            if (uploadResult && uploadResult.success) {
              finalImageDesc = '图片';
            }
          } catch (uploadError) {
            console.warn('[Friends Circle] 图片上传失败，使用描述文本:', uploadError);
          }
        }

        // 构建朋友圈格式
        let circleFormat;
        if (textContent && textContent.trim()) {
          circleFormat = `[朋友圈|{{user}}|483920|${floorId}|${finalImageDesc}|${textContent}]`;
        } else {
          circleFormat = `[朋友圈|{{user}}|483920|${floorId}|${finalImageDesc}]`;
        }

        // 发送给AI
        await this.sendToAI(
          `用户发送朋友圈，请使用规定的朋友圈回复格式生成3-5条可能的好友回复，仅限有好友id的好友参与朋友圈回复。请注意，你是在为现有的用户朋友圈生成回复，只生成回复，禁止重复生成用户的朋友圈格式。\n${circleFormat}`,
        );

        this.showToast('朋友圈已发送', 'success');
        this.hidePublishModal();
      } catch (error) {
        console.error('[Friends Circle] 发送图片朋友圈失败:', error);
        this.showToast('发送失败，请重试', 'error');
      }
    }

    /**
     * 处理文字发布
     * @param {HTMLElement} modal - 弹窗元素
     */
    handleTextPublish(modal = null) {
      if (!modal) {
        modal = document.querySelector('.friends-circle-text-publish-modal');
      }
      if (!modal) return;

      const textInput = modal.querySelector('.text-input');
      if (!textInput) return;

      const content = textInput.value.trim();
      if (!content) {
        this.showToast('请输入朋友圈内容', 'error');
        return;
      }

      // 发送文字朋友圈
      this.sendTextCircle(content);
      modal.remove();
    }

    /**
     * 处理图片发布
     */
    async handleImagePublish() {
      console.log('[Friends Circle] 开始处理图片发布...');
      console.log('[Friends Circle] this上下文检查:', {
        thisExists: !!this,
        thisConstructorName: this?.constructor?.name,
        hasSelectedImageFile: !!this?.selectedImageFile,
        selectedImageFileName: this?.selectedImageFile?.name,
        globalInstanceExists: !!window.friendsCircle,
        globalInstanceSame: window.friendsCircle === this,
        globalHasSelectedFile: !!window.friendsCircle?.selectedImageFile,
        globalSelectedFileName: window.friendsCircle?.selectedImageFile?.name,
      });

      // 如果当前实例没有文件，但全局实例有，则使用全局实例的文件
      if (!this.selectedImageFile && window.friendsCircle?.selectedImageFile) {
        console.log('[Friends Circle] 从全局实例恢复文件信息');
        this.selectedImageFile = window.friendsCircle.selectedImageFile;
        this.selectedImageElements = window.friendsCircle.selectedImageElements;
      }

      const modal = document.querySelector('.friends-circle-image-publish-modal');
      if (!modal) {
        console.error('[Friends Circle] 未找到发布弹窗');
        return;
      }

      const imageDescInput = modal.querySelector('.image-desc-input');
      const textInput = modal.querySelector('.text-input');
      const publishBtn = modal.querySelector('#friends-circle-publish-btn');
      const uploadStatus = modal.querySelector('#friends-circle-upload-status');
      const uploadText = modal.querySelector('#friends-circle-upload-text');
      const progressBar = modal.querySelector('#friends-circle-progress-bar');

      console.log('[Friends Circle] 弹窗元素检查:', {
        imageDescInput: !!imageDescInput,
        textInput: !!textInput,
        publishBtn: !!publishBtn,
        uploadStatus: !!uploadStatus,
        uploadText: !!uploadText,
        progressBar: !!progressBar,
      });

      if (!imageDescInput) {
        console.error('[Friends Circle] 图片描述输入框未找到');
        return;
      }

      const imageDescription = imageDescInput.value.trim();
      const textContent = textInput ? textInput.value.trim() : '';
      const imageFile = this.selectedImageFile;

      console.log('[Friends Circle] 发布数据检查:', {
        imageDescription: imageDescription,
        textContent: textContent,
        hasImageFile: !!imageFile,
        imageFileName: imageFile ? imageFile.name : 'none',
        selectedImageFileExists: !!this.selectedImageFile,
      });

      // 验证输入 - 至少需要图片描述或图片文件其中之一
      if (!imageDescription && !imageFile) {
        console.warn('[Friends Circle] 验证失败 - 缺少描述和图片文件');
        this.showToast('请输入图片描述或上传图片', 'error');
        return;
      }

      console.log('[Friends Circle] 发布验证通过:', {
        hasDescription: !!imageDescription,
        hasImageFile: !!imageFile,
        imageFileName: imageFile ? imageFile.name : 'none',
      });

      try {
        // 禁用发布按钮，显示上传状态
        if (publishBtn) {
          publishBtn.disabled = true;
          publishBtn.textContent = '发布中...';
        }

        let uploadResult = null;
        let finalImageDescription = imageDescription || '图片';

        // 如果有图片文件，先上传
        if (imageFile) {
          console.log('[Friends Circle] 开始上传图片文件:', imageFile.name);

          // 显示上传状态
          if (uploadStatus) {
            uploadStatus.style.display = 'block';
            if (uploadText) uploadText.textContent = '正在上传图片...';
            if (progressBar) progressBar.style.width = '30%';
          }

          // 使用SillyTavern原生附件系统
          if (!window.attachmentSender) {
            throw new Error('图片上传功能未就绪');
          }

          // 直接使用simulateFileInputUpload，让SillyTavern处理附件
          uploadResult = await window.attachmentSender.simulateFileInputUpload(imageFile);

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || '图片上传失败');
          }

          console.log('[Friends Circle] 图片已附加到SillyTavern:', uploadResult);

          // 更新进度
          if (progressBar) progressBar.style.width = '70%';
          if (uploadText) uploadText.textContent = '图片已附加，正在发布...';

          // 如果没有描述，使用文件名作为描述
          if (!imageDescription) {
            finalImageDescription = `我的图片: ${uploadResult.fileName}`;
          }
        }

        // 更新进度
        if (progressBar) progressBar.style.width = '90%';
        if (uploadText) uploadText.textContent = '正在发布朋友圈...';

        // 发送朋友圈
        await this.sendImageCircleWithUpload(finalImageDescription, textContent, uploadResult);

        // 完成
        if (progressBar) progressBar.style.width = '100%';
        if (uploadText) uploadText.textContent = '发布成功！';

        // 不要立即清理SillyTavern附件状态，让SillyTavern自然处理附件消息
        // this.clearSillyTavernAttachment();

        // 延迟关闭弹窗
        setTimeout(() => {
          modal.remove();
          this.showToast('朋友圈发布成功！', 'success');
        }, 1000);
      } catch (error) {
        console.error('[Friends Circle] 图片朋友圈发布失败:', error);

        // 恢复按钮状态
        if (publishBtn) {
          publishBtn.disabled = false;
          publishBtn.textContent = '发布';
        }

        // 隐藏上传状态
        if (uploadStatus) {
          uploadStatus.style.display = 'none';
        }

        this.showToast(error.message || '发布失败，请重试', 'error');
      }
    }

    /**
     * 发送带上传结果的图片朋友圈
     */
    async sendImageCircleWithUpload(imageDescription, textContent, uploadResult) {
      try {
        // 生成随机楼层ID
        const floorId = 's' + Math.floor(Math.random() * 900 + 100);

        // 从uploadResult中获取文件名
        const fileName = uploadResult?.file?.name || uploadResult?.fileName || '图片';

        // 构建朋友圈格式
        let circleFormat;
        if (textContent && textContent.trim()) {
          circleFormat = `[朋友圈|{{user}}|483920|${floorId}|我的图片: ${fileName}|${textContent}]`;
        } else {
          circleFormat = `[朋友圈|{{user}}|483920|${floorId}|我的图片: ${fileName}]`;
        }

        console.log('[Friends Circle] 发送朋友圈格式:', circleFormat);

        // 🌟 立即存储朋友圈数据到管理器中，不等待SillyTavern处理
        const currentUserName = this.getCurrentUserName();

        // 尝试立即获取图片URL（如果可能的话）
        let imageUrl = null;
        try {
          // 检查是否有已上传的图片URL可用
          if (uploadResult && uploadResult.fileUrl && uploadResult.fileUrl !== 'attached_to_sillytavern') {
            imageUrl = uploadResult.fileUrl;
            console.log('[Friends Circle] 使用上传结果中的图片URL:', imageUrl);
          } else {
            // 尝试从SillyTavern获取最新的图片URL
            const recentImageUrl = await this.tryGetRecentImageUrl();
            if (recentImageUrl) {
              imageUrl = recentImageUrl;
              console.log('[Friends Circle] 获取到最新图片URL:', imageUrl);
            }
          }
        } catch (error) {
          console.warn('[Friends Circle] 获取图片URL失败，将使用占位符:', error);
        }

        const circleData = {
          id: floorId,
          author: currentUserName, // 使用当前用户名，而不是{{user}}
          friendId: '483920',
          type: 'visual',
          imageDescription: `我的图片: ${fileName}`,
          imageUrl: imageUrl, // 添加图片URL字段
          content: textContent || '',
          messageIndex: -1,
          latestActivityIndex: -1,
          replies: [],
          likes: 0,
          isLiked: false,
          timestamp: new Date().toISOString(),
        };

        // 立即存储到管理器中
        this.manager.friendsCircleData.set(floorId, circleData);
        console.log('[Friends Circle] 立即存储图片朋友圈数据:', circleData);

        // 触发界面更新
        this.dispatchUpdateEvent();

        // 构建完整的消息，包含指导文本
        const fullMessage = `用户发送朋友圈，请使用规定的朋友圈回复格式生成3-5条可能的好友回复，仅限有好友id的好友参与朋友圈回复。请注意，你是在为现有的用户朋友圈生成回复，只生成回复，禁止重复生成用户的朋友圈格式。\n${circleFormat}`;

        // 发送朋友圈格式消息，SillyTavern会自动附加图片
        await this.sendToAI(fullMessage);

        // 🌟 手动触发一次朋友圈解析，确保用户发送的朋友圈被正确解析
        setTimeout(async () => {
          try {
            console.log('[Friends Circle] 手动触发朋友圈解析，确保用户发送的内容被解析...');
            await this.manager.refreshData(false); // 增量刷新
            if (this.isActive) {
              this.dispatchUpdateEvent();
            }
          } catch (error) {
            console.warn('[Friends Circle] 手动触发解析失败:', error);
          }
        }, 500); // 等待500ms让SillyTavern处理消息

        // 等待SillyTavern处理附件消息
        if (uploadResult && uploadResult.success) {
          console.log('[Friends Circle] 等待SillyTavern处理附件消息...');

          // 延迟处理，让SillyTavern有时间处理附件
          setTimeout(async () => {
            try {
              // 尝试从SillyTavern聊天数据中提取真实的图片URL
              await this.extractImageFromSillyTavern(floorId, fileName, textContent);
            } catch (error) {
              console.warn('[Friends Circle] 提取图片信息失败:', error);
              // 即使提取失败，朋友圈也已经发送成功了
            } finally {
              // 在处理完成后清理SillyTavern附件状态
              this.clearSillyTavernAttachment();
            }
          }, 2000); // 等待2秒让SillyTavern处理
        }

        console.log('[Friends Circle] 图片朋友圈发送成功');
      } catch (error) {
        console.error('[Friends Circle] 发送图片朋友圈失败:', error);
        throw error;
      }
    }

    /**
     * 尝试立即获取最新的图片URL
     * @returns {Promise<string|null>} 图片URL或null
     */
    async tryGetRecentImageUrl() {
      try {
        // 使用SillyTavern.getContext()获取聊天数据
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            const chatMessages = context.chat;

            // 检查最近的消息中是否有图片
            const recentMessages = chatMessages.slice(-3); // 检查最近3条消息
            for (const message of recentMessages.reverse()) {
              if (message.extra && message.extra.image) {
                console.log('[Friends Circle] 找到最新图片URL:', message.extra.image);
                return message.extra.image;
              }
            }
          }
        }

        return null;
      } catch (error) {
        console.warn('[Friends Circle] 获取最新图片URL失败:', error);
        return null;
      }
    }

    /**
     * 从SillyTavern提取图片信息
     */
    async extractImageFromSillyTavern(floorId, imageDescription, textContent) {
      try {
        console.log('[Friends Circle] 开始从SillyTavern提取图片信息...');

        // 使用正确的方法获取SillyTavern聊天数据（参考message-app.js）
        let chatMessages = null;

        // 优先使用SillyTavern.getContext().chat
        if (
          typeof window !== 'undefined' &&
          window.SillyTavern &&
          typeof window.SillyTavern.getContext === 'function'
        ) {
          const context = window.SillyTavern.getContext();
          if (context && context.chat && Array.isArray(context.chat)) {
            chatMessages = context.chat;
            console.log('[Friends Circle] 使用SillyTavern.getContext()获取聊天数据:', chatMessages.length, '条消息');
          }
        }

        // 备用方案：从全局变量获取
        if (!chatMessages) {
          const chat = window['chat'];
          if (chat && Array.isArray(chat)) {
            chatMessages = chat;
            console.log('[Friends Circle] 使用全局变量获取聊天数据:', chatMessages.length, '条消息');
          }
        }

        if (!chatMessages || !Array.isArray(chatMessages)) {
          throw new Error('无法访问SillyTavern聊天数据');
        }

        // 查找最近的消息中的图片信息
        const recentMessages = chatMessages.slice(-5); // 检查最近5条消息
        let imageUrl = null;
        let fileName = null;

        console.log(
          '[Friends Circle] 检查最近的消息:',
          recentMessages.map(m => ({
            content: m.mes || m.content,
            extra: m.extra,
            hasImage: !!(m.extra && m.extra.image),
          })),
        );

        for (const message of recentMessages.reverse()) {
          if (message.extra && message.extra.image) {
            imageUrl = message.extra.image;
            fileName = imageUrl.split('/').pop();
            console.log('[Friends Circle] 找到图片信息:', { imageUrl, fileName });
            break;
          }
        }

        // 如果没有找到，尝试从消息内容中解析（参考message-renderer.js的实现）
        if (!imageUrl) {
          console.log('[Friends Circle] 未在extra中找到图片，尝试从消息内容解析...');

          for (const message of recentMessages.reverse()) {
            const content = message.mes || message.content || '';

            // 检查是否包含朋友圈格式的图片信息
            if (content.includes('我的图片:') || content.includes('[朋友圈|')) {
              const imageRegex = /我的图片:\s*([^|\]]+)/;
              const match = content.match(imageRegex);

              if (match) {
                fileName = match[1].trim();
                console.log('[Friends Circle] 从消息解析到图片文件名:', fileName);

                // 使用AttachmentSender构建图片URL（参考message-renderer.js）
                if (window.attachmentSender && typeof window.attachmentSender.buildImageUrl === 'function') {
                  // 获取当前用户名
                  const userName = this.getCurrentUserName();
                  imageUrl = window.attachmentSender.buildImageUrl(userName, fileName);
                } else {
                  // 备用方案：使用相对路径，与SillyTavern保持一致
                  const userName = this.getCurrentUserName();
                  imageUrl = `/user/images/${userName}/${fileName}`;
                }

                console.log('[Friends Circle] 构建的图片URL:', imageUrl);
                break;
              }
            }
          }
        }

        if (imageUrl) {
          // 构建完整的图片URL
          const fullImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

          // 🌟 更新已存在的朋友圈数据，而不是重新创建
          const existingData = this.manager.friendsCircleData.get(floorId);
          if (existingData) {
            // 更新现有数据的图片信息
            existingData.imageUrl = fullImageUrl;
            existingData.imageFileName = fileName;
            if (imageDescription && imageDescription !== existingData.imageDescription) {
              existingData.imageDescription = imageDescription;
            }

            console.log('[Friends Circle] 更新已存在朋友圈的图片信息:', {
              id: floorId,
              imageUrl: fullImageUrl,
              imageFileName: fileName,
            });
          } else {
            // 如果不存在（不应该发生），则创建新数据
            const currentUserName = this.getCurrentUserName();
            const circleData = {
              id: floorId,
              author: currentUserName, // 使用真实用户名
              friendId: '483920',
              type: 'visual',
              imageDescription: imageDescription,
              imageUrl: fullImageUrl,
              imageFileName: fileName,
              content: textContent || '',
              messageIndex: -1,
              latestActivityIndex: -1,
              replies: [],
              likes: 0,
              isLiked: false,
              timestamp: new Date().toISOString(),
            };

            this.manager.friendsCircleData.set(floorId, circleData);
            console.log('[Friends Circle] 创建新的图片朋友圈数据:', circleData);
          }

          // 触发界面更新
          this.dispatchUpdateEvent();
        } else {
          console.warn('[Friends Circle] 未找到图片信息，保持占位符显示');
        }
      } catch (error) {
        console.error('[Friends Circle] 提取图片信息失败:', error);
        throw error;
      }
    }

    /**
     * 清理SillyTavern附件状态
     */
    clearSillyTavernAttachment() {
      try {
        console.log('[Friends Circle] 清理SillyTavern附件状态...');

        // 查找并点击SillyTavern的文件重置按钮
        const resetButton = document.getElementById('file_form_reset');
        if (resetButton) {
          console.log('[Friends Circle] 找到SillyTavern重置按钮，准备点击');
          resetButton.click();
          console.log('[Friends Circle] SillyTavern附件已重置');
        } else {
          console.log('[Friends Circle] 未找到SillyTavern重置按钮');

          // 备用方案：直接清空文件输入框
          const fileInput = document.getElementById('file_form_input');
          if (fileInput) {
            fileInput.value = '';
            console.log('[Friends Circle] 文件输入框已清空（备用方案）');
          }
        }
      } catch (error) {
        console.error('[Friends Circle] 清理附件状态时出错:', error);
      }
    }

    /**
     * 派发更新事件
     */
    dispatchUpdateEvent() {
      const event = new CustomEvent('friendsCircleUpdate', {
        detail: {
          timestamp: Date.now(),
          circles: this.manager.getSortedFriendsCircles(),
        },
      });
      window.dispatchEvent(event);
    }

    /**
     * 测试视觉朋友圈解析
     */
    testVisualCircleParsing() {
      console.log('[Friends Circle] 开始测试朋友圈解析...');

      // 测试正确格式
      const correctFormats = [
        '[朋友圈|夏阳|200005|s102|一张自拍照。金色的短发被汗水浸湿，几缕发丝贴在饱满的额头上。他正对着镜头露出一个大大的、灿烂的笑容，背景是清晨洒满阳光的沿江跑道。|今天也是元气满满的一天！]',
        '[朋友圈|秦倦|500002|w101|有点无聊，有没有人出来吃夜宵？]',
        '[朋友圈回复|夏阳|300004|w101|秦倦老师，我正好有空，我可以嘛？]',
      ];

      // 测试错误格式（不应该被匹配）
      const incorrectFormats = [
        '- 序号: 001 - 时间: 2025年8月22日午后',
        '| 名字 | 身份 | 性格核心 | 心理状态 | 性经验 | 重要道具 |',
        '| 沐夕 | 娱乐圈新人 | 温柔体贴，略带羞涩 | 平静，正在浏览信息 | 有 | 手机 |',
        '剧情总结:沐夕在午后查看了朋友圈，看到了秦倦、夏阳、朝沐雨和温屿发布的动态',
      ];

      console.log('=== 测试正确格式 ===');
      correctFormats.forEach((content, index) => {
        console.log(`测试 ${index + 1}: ${content}`);
        this.manager.testVisualCircleParsing(content);
      });

      console.log('=== 测试错误格式（不应该匹配） ===');
      incorrectFormats.forEach((content, index) => {
        console.log(`测试 ${index + 1}: ${content}`);
        this.manager.testVisualCircleParsing(content);
      });
    }

    /**
     * 调试聊天内容获取
     */
    async debugChatContent() {
      console.log('=== 调试聊天内容获取 ===');

      try {
        const chatContent = await this.getChatContent();
        console.log('获取到的聊天内容长度:', chatContent.length);
        console.log('聊天内容前500字符:', chatContent.substring(0, 500));

        // 检查是否包含朋友圈格式
        const friendsCircleMatches = chatContent.match(/\[朋友圈[^\]]*\]/g);
        console.log('找到的朋友圈格式数量:', friendsCircleMatches?.length || 0);
        if (friendsCircleMatches) {
          console.log('朋友圈格式内容:', friendsCircleMatches);
        }

        // 检查是否包含表格格式
        const tableMatches = chatContent.match(/\|[^|]*\|/g);
        console.log('找到的表格格式数量:', tableMatches?.length || 0);
        if (tableMatches && tableMatches.length > 0) {
          console.log('表格格式示例:', tableMatches.slice(0, 5));
        }

        // 使用新的解析方法测试
        console.log('=== 使用新解析方法测试 ===');
        const circles = this.manager.parseFriendsCircleData(chatContent);
        console.log('解析到的朋友圈数量:', circles.size);

        circles.forEach((circle, id) => {
          console.log(`朋友圈 ${id}:`, {
            author: circle.author,
            type: circle.type,
            content: circle.content?.substring(0, 100) + '...',
            imageDescription: circle.imageDescription?.substring(0, 100) + '...',
          });
        });
      } catch (error) {
        console.error('调试聊天内容获取失败:', error);
      }
    }

    /**
     * 调试监听系统状态
     */
    debugListenerStatus() {
      console.log('=== 朋友圈监听系统调试信息 ===');
      console.log('监听器状态:', this.eventListener?.isListening);
      console.log('朋友圈激活状态:', this.isActive);
      console.log('当前消息数量:', this.eventListener?.getCurrentMessageCount());
      console.log('上次消息数量:', this.eventListener?.lastMessageCount);

      // 检查可用的事件系统
      console.log('可用的事件系统:');
      console.log('- window.SillyTavern:', !!window.SillyTavern);
      console.log('- window.SillyTavern.getContext:', !!window.SillyTavern?.getContext);

      if (window.SillyTavern?.getContext) {
        const context = window.SillyTavern.getContext();
        console.log('- context:', !!context);
        console.log('- context.eventSource:', !!context?.eventSource);
        console.log('- context.event_types:', !!context?.event_types);
        console.log('- context.event_types.MESSAGE_RECEIVED:', context?.event_types?.MESSAGE_RECEIVED);
      }

      console.log('- eventOn函数:', typeof eventOn);
      console.log('- tavern_events:', typeof tavern_events);
      console.log('- window.parent.eventSource:', !!window.parent?.eventSource);
      console.log('- window.eventSource:', typeof window.eventSource);

      // 检查聊天数据获取
      console.log('=== 聊天数据获取测试 ===');
      this.testChatDataAccess();

      // 强制触发一次检查
      if (this.eventListener) {
        console.log('强制触发消息检查...');
        this.eventListener.checkForNewMessages();
      }
    }

    /**
     * 测试聊天数据获取
     */
    async testChatDataAccess() {
      console.log('[Debug] 测试聊天数据获取...');

      // 方法1: SillyTavern.getContext
      if (window.SillyTavern?.getContext) {
        try {
          const context = window.SillyTavern.getContext();
          console.log('[Debug] SillyTavern.getContext():', !!context);
          if (context?.chat) {
            console.log('[Debug] context.chat 长度:', context.chat.length);
            console.log('[Debug] 最后一条消息:', context.chat[context.chat.length - 1]?.mes?.substring(0, 100));
          }
        } catch (error) {
          console.log('[Debug] SillyTavern.getContext 错误:', error);
        }
      }

      // 方法2: contextMonitor
      if (window.contextMonitor?.getCurrentChatMessages) {
        try {
          const chatData = await window.contextMonitor.getCurrentChatMessages();
          console.log('[Debug] contextMonitor 数据:', !!chatData);
          if (chatData?.messages) {
            console.log('[Debug] contextMonitor 消息数量:', chatData.messages.length);
          }
        } catch (error) {
          console.log('[Debug] contextMonitor 错误:', error);
        }
      }

      // 方法3: 父窗口
      if (window.parent?.chat) {
        try {
          console.log('[Debug] window.parent.chat 长度:', window.parent.chat.length);
        } catch (error) {
          console.log('[Debug] window.parent.chat 错误:', error);
        }
      }
    }

    /**
     * 重启监听系统
     */
    restartListener() {
      console.log('[Friends Circle] 重启监听系统...');
      if (this.eventListener) {
        this.eventListener.stopListening();
        setTimeout(() => {
          this.eventListener.startListening();
        }, 1000);
      }
    }

    /**
     * 全面调试朋友圈系统
     */
    debugAll() {
      console.log('=== 朋友圈系统全面调试 ===');

      // 1. 基本状态
      console.log('1. 基本状态:');
      console.log('- 朋友圈实例:', !!this);
      console.log('- 管理器实例:', !!this.manager);
      console.log('- 渲染器实例:', !!this.renderer);
      console.log('- 事件监听器实例:', !!this.eventListener);
      console.log('- 朋友圈激活状态:', this.isActive);

      // 2. 数据状态
      console.log('2. 数据状态:');
      const circles = this.manager?.getSortedFriendsCircles() || [];
      console.log('- 朋友圈数量:', circles.length);
      circles.forEach((circle, index) => {
        console.log(`- 朋友圈 ${index + 1}:`, {
          id: circle.id,
          type: circle.type,
          author: circle.author,
          hasImageDescription: !!circle.imageDescription,
          hasContent: !!circle.content,
        });
      });

      // 3. DOM状态
      console.log('3. DOM状态:');
      const circleElements = document.querySelectorAll('.circle-item');
      console.log('- 页面上的朋友圈元素数量:', circleElements.length);

      // 4. 发布弹窗状态
      console.log('4. 发布弹窗状态:');
      const publishModal = document.querySelector('.friends-circle-publish-modal');
      console.log('- 发布弹窗存在:', !!publishModal);
      if (publishModal) {
        console.log('- 弹窗可见性:', window.getComputedStyle(publishModal).display);
        console.log('- 弹窗位置:', publishModal.getBoundingClientRect());
      }

      // 5. 监听系统状态
      this.debugListenerStatus();

      // 6. 测试发布弹窗
      console.log('5. 测试发布弹窗功能:');
      if (this.renderer) {
        console.log('- 尝试显示发布弹窗...');
        this.renderer.showPublishModal();
      }
    }

    /**
     * 强制激活朋友圈（修复激活问题）
     */
    async forceActivate() {
      console.log('[Friends Circle] 强制激活朋友圈...');

      // 1. 强制设置激活状态
      this.isActive = true;
      console.log('[Friends Circle] 激活状态已设置为 true');

      // 2. 确保header正确显示
      this.updateHeader();

      // 3. 强制刷新数据
      await this.refreshFriendsCircle();

      // 4. 启动监听器
      if (this.eventListener) {
        this.eventListener.startListening();
        console.log('[Friends Circle] 监听器已启动');
      }

      // 5. 检查结果
      const circles = this.manager?.getSortedFriendsCircles() || [];
      console.log('[Friends Circle] 强制激活完成，朋友圈数量:', circles.length);

      return circles.length > 0;
    }

    /**
     * 测试新的排序方案
     */
    testNewSortingSystem() {
      console.log('=== 测试新的基于消息位置的排序方案 ===');

      // 获取当前朋友圈数据
      const circles = this.manager.getSortedFriendsCircles();

      console.log('朋友圈排序结果:');
      circles.forEach((circle, index) => {
        console.log(`${index + 1}. ${circle.author} (${circle.id}):`, {
          messageIndex: circle.messageIndex,
          latestActivityIndex: circle.latestActivityIndex,
          repliesCount: circle.replies?.length || 0,
          content: circle.content?.substring(0, 30) + '...',
        });
      });

      // 验证排序是否正确
      let isCorrectlySorted = true;
      for (let i = 1; i < circles.length; i++) {
        if (circles[i - 1].latestActivityIndex < circles[i].latestActivityIndex) {
          isCorrectlySorted = false;
          console.error(
            `排序错误: 位置 ${i - 1} 的朋友圈活动位置 (${
              circles[i - 1].latestActivityIndex
            }) 小于位置 ${i} 的朋友圈活动位置 (${circles[i].latestActivityIndex})`,
          );
        }
      }

      if (isCorrectlySorted) {
        console.log('✅ 排序验证通过：朋友圈按最新活动位置正确排序');
      } else {
        console.error('❌ 排序验证失败：存在排序错误');
      }

      console.log('=== 排序测试完成 ===');
      return { circles, isCorrectlySorted };
    }

    /**
     * 测试增量更新系统
     */
    testIncrementalUpdate() {
      console.log('=== 测试增量更新系统 ===');

      console.log('当前状态:');
      console.log('- 朋友圈数量:', this.manager.friendsCircleData.size);
      console.log('- 上次处理消息索引:', this.manager.lastProcessedMessageIndex);

      // 强制触发一次增量更新
      console.log('强制触发增量更新...');
      this.manager.refreshData(false);

      console.log('=== 增量更新测试完成 ===');
    }

    /**
     * 验证数据持久性
     */
    verifyDataPersistence() {
      console.log('=== 验证朋友圈数据持久性 ===');

      const manager = this.manager;
      console.log('管理器实例ID:', manager.constructor.name);
      console.log('朋友圈数据大小:', manager.friendsCircleData.size);
      console.log('上次处理索引:', manager.lastProcessedMessageIndex);

      // 检查全局实例
      console.log('全局实例存在:', !!window.friendsCircle);
      console.log('全局实例与当前实例相同:', window.friendsCircle === this);

      if (window.messageApp) {
        console.log('MessageApp朋友圈实例存在:', !!window.messageApp.friendsCircle);
        console.log('MessageApp实例与全局实例相同:', window.messageApp.friendsCircle === window.friendsCircle);
      }

      // 显示朋友圈数据
      const circles = manager.getSortedFriendsCircles();
      console.log('朋友圈列表:');
      circles.forEach((circle, index) => {
        console.log(`${index + 1}. ${circle.author} (${circle.id}): ${circle.replies?.length || 0} 条回复`);
      });

      console.log('=== 数据持久性验证完成 ===');
    }

    /**
     * 强制刷新朋友圈数据（用于测试）
     */
    async forceRefresh() {
      console.log('=== 强制刷新朋友圈数据 ===');

      try {
        // 强制全量刷新
        await this.manager.refreshData(true);

        // 更新界面
        if (this.isActive) {
          this.dispatchUpdateEvent();
        }

        console.log('强制刷新完成，朋友圈数量:', this.manager.friendsCircleData.size);
      } catch (error) {
        console.error('强制刷新失败:', error);
      }

      console.log('=== 强制刷新完成 ===');
    }

    /**
     * 检查当前页面状态
     */
    checkPageStatus() {
      console.log('=== 页面状态检查 ===');

      // 检查message-app状态
      if (window.messageApp) {
        console.log('- messageApp存在:', true);
        console.log('- currentMainTab:', window.messageApp.currentMainTab);
        console.log('- currentView:', window.messageApp.currentView);
        console.log('- friendsCircle实例:', !!window.messageApp.friendsCircle);
        console.log('- friendsCircle激活状态:', window.messageApp.friendsCircle?.isActive);
      } else {
        console.log('- messageApp存在:', false);
      }

      // 检查全局朋友圈实例
      console.log('- window.friendsCircle存在:', !!window.friendsCircle);
      console.log('- window.friendsCircle激活状态:', window.friendsCircle?.isActive);

      // 检查DOM状态
      const friendsCirclePage = document.querySelector('.friends-circle-page');
      console.log('- 朋友圈页面DOM存在:', !!friendsCirclePage);

      return {
        messageAppExists: !!window.messageApp,
        currentTab: window.messageApp?.currentMainTab,
        friendsCircleActive: window.friendsCircle?.isActive,
        domExists: !!friendsCirclePage,
      };
    }

    /**
     * 测试弹窗交互
     */
    testModalInteraction() {
      console.log('[Friends Circle Debug] 测试弹窗交互...');

      const modal = document.querySelector('.friends-circle-publish-modal');
      if (!modal) {
        console.log('[Friends Circle Debug] 弹窗不存在，先显示弹窗');
        this.showPublishModal();
        setTimeout(() => this.testModalInteraction(), 200);
        return;
      }

      console.log('[Friends Circle Debug] 找到弹窗，测试按钮点击...');

      const textBtn = modal.querySelector('.text-btn');
      const imageBtn = modal.querySelector('.image-btn');
      const closeBtn = modal.querySelector('.modal-close');
      const overlay = modal.querySelector('.modal-overlay');

      if (textBtn) {
        console.log('[Friends Circle Debug] 手动触发文字按钮点击事件');
        textBtn.click();

        // 也尝试直接调用方法
        setTimeout(() => {
          console.log('[Friends Circle Debug] 直接调用showTextPublishModal方法');
          this.renderer.showTextPublishModal();
        }, 1000);
      }

      if (closeBtn) {
        setTimeout(() => {
          console.log('[Friends Circle Debug] 测试关闭按钮');
          closeBtn.click();
        }, 2000);
      }
    }

    /**
     * 测试文字发布弹窗
     */
    testTextPublishModal() {
      console.log('[Friends Circle Debug] 测试文字发布弹窗...');

      const modal = document.querySelector('.friends-circle-text-publish-modal');
      if (!modal) {
        console.log('[Friends Circle Debug] 文字发布弹窗不存在');
        return;
      }

      console.log('[Friends Circle Debug] 找到文字发布弹窗');

      // 检查弹窗样式
      const modalStyle = window.getComputedStyle(modal);
      console.log('[Friends Circle Debug] 文字弹窗样式:', {
        display: modalStyle.display,
        position: modalStyle.position,
        zIndex: modalStyle.zIndex,
        visibility: modalStyle.visibility,
        opacity: modalStyle.opacity,
        pointerEvents: modalStyle.pointerEvents,
      });

      // 检查按钮
      const cancelBtn = modal.querySelector('.cancel-btn');
      const sendBtn = modal.querySelector('.send-btn');
      const closeBtn = modal.querySelector('.modal-close');
      const textInput = modal.querySelector('.text-input');

      console.log('[Friends Circle Debug] 文字弹窗元素:', {
        cancelBtn: !!cancelBtn,
        sendBtn: !!sendBtn,
        closeBtn: !!closeBtn,
        textInput: !!textInput,
      });

      // 测试输入框
      if (textInput) {
        console.log('[Friends Circle Debug] 测试输入框...');
        textInput.value = '测试文字内容';
        textInput.dispatchEvent(new Event('input'));
        console.log('[Friends Circle Debug] 输入框值:', textInput.value);
      }

      // 测试按钮点击
      if (cancelBtn) {
        setTimeout(() => {
          console.log('[Friends Circle Debug] 测试取消按钮');
          cancelBtn.click();
        }, 1000);
      }
    }

    /**
     * 强制修复弹窗交互问题
     */
    fixModalInteraction() {
      console.log('[Friends Circle Debug] 强制修复弹窗交互...');

      // 查找所有弹窗
      const publishModal = document.querySelector('.friends-circle-publish-modal');
      const textModal = document.querySelector('.friends-circle-text-publish-modal');

      [publishModal, textModal].forEach((modal, index) => {
        if (!modal) return;

        const modalType = index === 0 ? '发布选择' : '文字发布';
        console.log(`[Friends Circle Debug] 修复${modalType}弹窗...`);

        // 强制设置样式
        modal.style.zIndex = '99999';
        modal.style.pointerEvents = 'auto';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';

        // 修复内容区域
        const content = modal.querySelector('.modal-content');
        if (content) {
          content.style.pointerEvents = 'auto';
          content.style.zIndex = '100000';
          content.style.position = 'relative';
        }

        // 修复所有按钮
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(btn => {
          btn.style.pointerEvents = 'auto';
          btn.style.zIndex = '100001';
          btn.style.position = 'relative';

          // 添加调试点击事件
          btn.addEventListener(
            'click',
            e => {
              console.log(`[Friends Circle Debug] 按钮被点击:`, btn.className, e);
            },
            true,
          );
        });

        // 修复输入框
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.style.pointerEvents = 'auto';
          input.style.zIndex = '100001';
        });

        console.log(`[Friends Circle Debug] ${modalType}弹窗修复完成`);
      });
    }
  }

  // 导出类到全局
  window.FriendsCircleManager = FriendsCircleManager;
  window.FriendsCircleEventListener = FriendsCircleEventListener;
  window.FriendsCircleRenderer = FriendsCircleRenderer;
  window.FriendsCircle = FriendsCircle;

  console.log('[Friends Circle] 朋友圈模块加载完成');
}
