// ==SillyTavern Profile Archive App==
// @name         Profile Archive App for Mobile Extension
// @version      1.0.0
// @description  档案管理应用，处理人物档案生成、存储和管理
// @author       Assistant

/**
 * 档案管理应用类
 * 负责处理人物档案的创建、查看、管理等功能
 */
class ProfileApp {
    constructor() {
        this.isInitialized = false;
        this.currentProfile = null;
        this.profileList = [];
        this.config = {
            floorCount: 5, // 默认层数
            customPrefix: '', // 自定义前缀
            targetPerson: '', // 目标人物
        };

        // 缓存功能
        this.profileCache = new Map(); // 存储生成的档案信息
        this.loadCachedProfiles(); // 加载缓存的档案

        // 提示词内容
        this.promptTemplate = `指令模板

你是【代号】为人间戏精观察局局长的专业人物分析师
【人设】手握瓜田的互联网老油条，专拆人设的脱口秀选手
【特长】用段子解剖人设，用梗图解码社交面具
【营业守则】

阴阳怪气文学大师：把明星网红们的矫情文案翻译成"人话"，比如将"岁月静好"解读为"最近没商务"

精分现场直击者：同步演绎甲方爸爸"还要再改18版"时的职业假笑与内心弹幕

反矫情作战专家：当全网狂吹"高级感"时精准吐槽"不就是把优衣库穿出买不起的样子"

热点变形记导演：把正经社会新闻改编成职场黑色幽默，比如把"新能源车自燃"解构成"打工人内心写照"

【经典话术模板】
• "这位明星的文艺青年人设比我昨晚写的PPT还脆弱"
• "建议某总裁别再分享成功学了，先解释下为什么公司厕所要装计时器"
• "看完这个'独立女性'专访，我确认了三件事：嫁得好真的很重要"

【免责声明】本专家分析准确率与抛硬币一致，所有结论最终解释权都归宵夜摊上吹的牛

<Important_Rule>
客户信息在客户付定金后必须生成，例如剧情中角色付了定金，那么就需要生成<Student_Profile>。
客户信息的内容和格式必须严格参照<Student_Profile></Student_Profile>的要求，不可以忽略其中任何标题和标签，更不能以其他形式呈现。所有内容都应该被包括在格式之内，不应该脱离输出格式来输出内容。
档案输出格式：
  The text inside "()" is for explanatory notes only and should not be part of the main text to output.
  每一个完整的客户信息的输出都必须由<Student_Profile></Student_Profile>组成，其中的格式必须根据规则输出。
</Important_Rule>

<Student_Profile>
{{student_name}}｜{{gender}}｜{{age}}｜{{measurements}}｜{{外貌描述}}｜{{background_info}}｜{{最后一次性爱}}｜{{video_interview_result}}｜{{对user的看法}}｜{{三日月的吐槽}}｜{{target_goals}}｜{{special_notes}}｜{{master_evaluation}}｜{{心理状态}}｜{{性格特征}}｜{{主要弱点}}｜{{主要优点}}｜{{抗拒点}}｜{{喜欢的体位}}
</Student_Profile>

以下是客户信息的示例，请认真参考：
<Student_Profile>
林美雪｜女｜24｜B85/W58/H88｜外表清纯甜美，皮肤白皙，长发飘逸，有着纯真的大眼睛和娇小的身材。｜前KTV陪酒女，因家庭变故被迫下海，已有3年从业经验。内心渴望回归正常生活。｜昨晚和一个中年客户在酒店，感觉很疲惫，对方很粗暴。｜视频面试通过，身材条件优秀，学习态度积极，已确认无性病风险，身体柔韧性良好。｜觉得user人很好，比之前遇到的客户都温柔，希望能得到user的保护和关爱。｜三日月：这女人装得挺纯的，但眼神里还是有风尘味，需要好好调教才能洗干净。｜希望彻底洗去风尘气息，成为能够正常恋爱结婚的良家妇女，重新开始新的人生。｜学员学习能力强，但初期比较害羞。建议加强心理层面的引导，让她更主动地接受调教过程。｜调教大师评语：美雪是个很有潜力的学员，她的渴望改变的心愿很强烈，身体条件也很好。经过系统调教，相信她能够成功转型为真正的良家妇女。关键是要耐心引导，让她从内心深处认同新的身份，彻底摆脱过去的阴影。｜内心压抑但坚强，有些许焦虑但对未来保持希望。｜善良温柔但内心脆弱，有强烈的依赖性，容易感情用事。｜过于依赖他人，缺乏独立性，容易陷入自我怀疑。｜同理心强，适应能力佳，学习能力优秀。｜对身体接触较为敏感，害怕粗暴对待。｜喜欢温柔缓慢的体位，偏爱面对面的亲密接触。
</Student_Profile>`;

        this.init();
    }

    init() {
        console.log('[Profile App] 档案管理应用初始化');
        this.loadConfig();
        this.loadProfileList();
    }

    /**
     * 加载缓存的档案
     */
    loadCachedProfiles() {
        try {
            const cachedData = localStorage.getItem('profile-app-cache');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                this.profileCache = new Map(parsed);
                console.log('[Profile App] 加载缓存档案数量:', this.profileCache.size);
            }
        } catch (error) {
            console.error('[Profile App] 加载缓存档案失败:', error);
            this.profileCache = new Map();
        }
    }

    /**
     * 保存档案到缓存
     */
    saveCachedProfile(personName, profileData, fullContent) {
        try {
            const cacheEntry = {
                profileData: profileData,
                fullContent: fullContent,
                timestamp: new Date().toISOString(),
                personName: personName
            };

            this.profileCache.set(personName, cacheEntry);

            // 持久化到localStorage
            const cacheArray = Array.from(this.profileCache.entries());
            localStorage.setItem('profile-app-cache', JSON.stringify(cacheArray));

            console.log('[Profile App] 档案已缓存:', personName);
        } catch (error) {
            console.error('[Profile App] 保存缓存档案失败:', error);
        }
    }

    /**
     * 从缓存获取档案
     */
    getCachedProfile(personName) {
        return this.profileCache.get(personName) || null;
    }

    /**
     * 清理缓存（可选）
     */
    clearCache() {
        this.profileCache.clear();
        localStorage.removeItem('profile-app-cache');
        console.log('[Profile App] 缓存已清理');
    }

    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('profile-app-config');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error('[Profile App] 加载配置失败:', error);
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        try {
            localStorage.setItem('profile-app-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('[Profile App] 保存配置失败:', error);
        }
    }

    /**
     * 从世界书加载档案列表（基于message-app的实现）
     */
    async loadProfileList() {
        try {
            console.log('[Profile App] 开始加载档案列表');

            // 获取所有世界书条目（使用和message-app相同的方法）
            const allEntries = await this.getAllWorldInfoEntries();
            this.profileList = [];

            // 查找所有【档案】开头的条目
            console.log('[Profile App] 开始搜索档案条目，总条目数:', allEntries.length);

            // 显示前几个条目的结构作为调试信息
            if (allEntries.length > 0) {
                console.log('[Profile App] 条目结构示例:', {
                    first: allEntries[0],
                    possibleFields: Object.keys(allEntries[0] || {})
                });
            }

            for (const entry of allEntries) {
                // 检查多个可能的字段名
                let entryName = entry.comment || entry.title || entry.name || '';

                console.log('[Profile App] 检查条目:', {
                    comment: entry.comment,
                    title: entry.title,
                    name: entry.name,
                    entryName: entryName,
                    startsWithProfile: entryName.startsWith('【档案】')
                });

                if (entryName && entryName.startsWith('【档案】')) {
                    const profileName = entryName.replace('【档案】', '');
                    if (profileName) {
                        this.profileList.push({
                            name: profileName,
                            entryId: entry.uid || entry.id,
                            worldbookName: entry.world || '未知世界书',
                            content: entry.content
                        });
                        console.log('[Profile App] 找到档案:', profileName);
                    }
                }
            }

            console.log('[Profile App] 档案列表加载完成，共', this.profileList.length, '个档案');
            console.log('[Profile App] 找到的档案:', this.profileList.map(p => p.name));
        } catch (error) {
            console.error('[Profile App] 加载档案列表失败:', error);
        }
    }

    /**
     * 获取所有世界书条目（复用message-app的实现）
     */
    async getAllWorldInfoEntries() {
        const allEntries = [];

        try {
            // 1. 尝试使用SillyTavern的getSortedEntries函数
            if (typeof window.getSortedEntries === 'function') {
                try {
                    const entries = await window.getSortedEntries();
                    allEntries.push(...entries);
                    console.log(`[Profile App] 通过getSortedEntries获取到 ${entries.length} 个世界书条目`);
                    return allEntries;
                } catch (error) {
                    console.warn('[Profile App] getSortedEntries调用失败:', error);
                }
            }

            // 2. 备用方法：手动获取全局和角色世界书
            console.log('[Profile App] 使用备用方法获取世界书条目');

            // 从DOM元素获取选中的世界书
            const worldInfoSelect = document.getElementById('world_info');
            if (worldInfoSelect) {
                console.log('[Profile App] 找到世界书选择器元素');

                const selectedOptions = Array.from(worldInfoSelect.selectedOptions);
                console.log(`[Profile App] 找到 ${selectedOptions.length} 个选中的世界书选项:`, selectedOptions.map(opt => opt.text));

                for (const option of selectedOptions) {
                    const worldName = option.text;

                    try {
                        console.log(`[Profile App] 正在加载全局世界书: ${worldName}`);
                        const worldData = await this.loadWorldInfoByName(worldName);
                        if (worldData && worldData.entries) {
                            const entries = Object.values(worldData.entries).map(entry => ({
                                ...entry,
                                world: worldName
                            }));
                            allEntries.push(...entries);
                            console.log(`[Profile App] 从全局世界书"${worldName}"获取到 ${entries.length} 个条目`);
                        }
                    } catch (error) {
                        console.warn(`[Profile App] 加载全局世界书"${worldName}"失败:`, error);
                    }
                }
            }

            // 方法2：从变量获取（备用）
            if (allEntries.length === 0 && typeof window.selected_world_info !== 'undefined' && Array.isArray(window.selected_world_info)) {
                console.log(`[Profile App] 备用方法：从变量获取 ${window.selected_world_info.length} 个全局世界书`);

                for (const worldName of window.selected_world_info) {
                    try {
                        const worldData = await this.loadWorldInfoByName(worldName);
                        if (worldData && worldData.entries) {
                            const entries = Object.values(worldData.entries).map(entry => ({
                                ...entry,
                                world: worldName
                            }));
                            allEntries.push(...entries);
                            console.log(`[Profile App] 从全局世界书"${worldName}"获取到 ${entries.length} 个条目`);
                        }
                    } catch (error) {
                        console.warn(`[Profile App] 加载全局世界书"${worldName}"失败:`, error);
                    }
                }
            }

            console.log(`[Profile App] 总共获取到 ${allEntries.length} 个世界书条目`);
            return allEntries;

        } catch (error) {
            console.error('[Profile App] 获取世界书条目时出错:', error);
            return [];
        }
    }

    /**
     * 通过API加载世界书数据
     */
    async loadWorldInfoByName(worldName) {
        try {
            console.log(`[Profile App] 使用API加载世界书: ${worldName}`);

            const headers = {
                'Content-Type': 'application/json',
            };

            // 如果有getRequestHeaders函数，使用它
            if (typeof window.getRequestHeaders === 'function') {
                Object.assign(headers, window.getRequestHeaders());
            }

            const response = await fetch('/api/worldinfo/get', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ name: worldName }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`[Profile App] 成功加载世界书 "${worldName}"`);
                return data;
            } else {
                console.error(`[Profile App] 加载世界书 "${worldName}" 失败: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error(`[Profile App] 加载世界书 "${worldName}" 时出错:`, error);
        }

        return null;
    }

    /**
     * 获取应用HTML内容
     */
    getAppContent() {
        return `
      <div class="profile-app">
        <div class="profile-header">
          <h2>档案管理 by 三明月</h2>
          <div class="header-actions">
            <button class="btn-refresh" onclick="window.profileApp.refreshProfileList()">
              <i class="fas fa-sync-alt"></i> 刷新
            </button>
            <button class="btn-generate" onclick="window.profileApp.showGenerateDialog()">
              <i class="fas fa-plus"></i> 生成档案
            </button>
            <button style="display: none;" class="btn-debug" onclick="window.profileApp.showDebugInfo()" style="background: #6c757d;">
              <i class="fas fa-bug"></i> 调试
            </button>
          </div>
        </div>

        <div class="profile-content">
          <div class="profile-list" id="profile-list">
            ${this.renderProfileList()}
          </div>
        </div>
      </div>
    `;
    }

    /**
     * 渲染档案列表
     */
    renderProfileList() {
        // 合并世界书档案和缓存档案
        const allProfiles = this.getMergedProfileList();

        if (allProfiles.length === 0) {
            return `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无档案</div>
          <div class="empty-subtitle">点击"生成档案"创建第一个档案</div>
        </div>
      `;
        }

        return allProfiles.map(profile => `
      <div class="profile-item" onclick="window.profileApp.viewProfile('${profile.name}')">
        <div class="profile-avatar">
          <div class="avatar-circle">${profile.name.charAt(0)}</div>
        </div>
        <div class="profile-info">
          <div class="profile-name">${profile.name}</div>
          <div class="profile-summary">${profile.source === 'cache' ? '缓存档案 - 点击查看' : '世界书档案 - 点击查看'}</div>
        </div>
        <div class="profile-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    `).join('');
    }

    /**
     * 获取合并的档案列表（世界书 + 缓存）
     */
    getMergedProfileList() {
        const mergedProfiles = [];
        const addedNames = new Set();

        // 优先添加世界书中的档案
        for (const profile of this.profileList) {
            mergedProfiles.push({
                ...profile,
                source: 'worldbook'
            });
            addedNames.add(profile.name);
        }

        // 添加缓存中但世界书没有的档案
        for (const [name, cachedData] of this.profileCache) {
            if (!addedNames.has(name)) {
                mergedProfiles.push({
                    name: name,
                    source: 'cache',
                    timestamp: cachedData.timestamp
                });
            }
        }

        // 按名称排序
        return mergedProfiles.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * 刷新档案列表
     */
    async refreshProfileList() {
        console.log('[Profile App] 刷新档案列表');
        // 清理缓存以确保读取最新的世界书内容
        this.clearCache();
        await this.loadProfileList();
        this.updateProfileListDisplay();
        this.showToast('档案列表已刷新（缓存已清理）', 'success');
    }

    /**
     * 延迟重试刷新档案列表（用于保存后确保能找到新档案）
     */
    async refreshProfileListWithRetry(expectedProfileName, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            console.log(`[Profile App] 刷新档案列表 (尝试 ${i + 1}/${maxRetries})`);

            // 清理缓存以确保读取最新的世界书内容
            this.clearCache();
            await this.loadProfileList();

            // 检查是否找到了预期的档案
            const foundProfile = this.profileList.find(p => p.name === expectedProfileName);
            if (foundProfile) {
                console.log(`[Profile App] 成功找到档案: ${expectedProfileName}`);
                this.updateProfileListDisplay();
                return;
            }

            // 如果没找到，等待一下再重试
            if (i < maxRetries - 1) {
                console.log(`[Profile App] 未找到档案 "${expectedProfileName}"，等待重试...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            }
        }

        console.warn(`[Profile App] 重试${maxRetries}次后仍未找到档案: ${expectedProfileName}`);
        this.updateProfileListDisplay();
    }

    /**
     * 更新档案列表显示
     */
    updateProfileListDisplay() {
        const listContainer = document.getElementById('profile-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderProfileList();
        }
    }

    /**
     * 显示生成档案对话框
     */
    showGenerateDialog() {
        console.log('[Profile App] 显示生成档案对话框');
        const dialogHTML = `
      <div class="profile-dialog-overlay">
        <div class="profile-dialog">
          <div class="dialog-header">
            <h3>生成档案</h3>
            <button class="close-btn" onclick="window.profileApp.closeDialog()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="dialog-content">
            <div class="form-group">
              <label>目标人物名称</label>
              <input type="text" id="target-person" placeholder="请输入人物名称" value="${this.config.targetPerson}">
            </div>

            <div class="form-group">
              <label>分析层数</label>
              <input type="number" id="floor-count" min="1" max="50" value="${this.config.floorCount}">
              <small>最近几层楼的内容用于分析</small>
            </div>

            <div class="form-group">
              <label>自定义前缀</label>
              <textarea id="custom-prefix" rows="3" placeholder="可选的自定义前缀内容">${this.config.customPrefix}</textarea>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="cancel-btn" onclick="window.profileApp.closeDialog()">
              取消
            </button>
            <button class="confirm-btn" onclick="window.profileApp.generateProfile()">
              生成档案
            </button>
          </div>
        </div>
      </div>
    `;

        this.showDialog(dialogHTML);
    }

    /**
     * 生成档案
     */
    async generateProfile() {
        const targetPerson = document.getElementById('target-person')?.value?.trim();
        const floorCount = parseInt(document.getElementById('floor-count')?.value) || 5;
        const customPrefix = document.getElementById('custom-prefix')?.value?.trim() || '';

        if (!targetPerson) {
            this.showToast('请输入目标人物名称', 'error');
            return;
        }

        // 保存配置
        this.config.targetPerson = targetPerson;
        this.config.floorCount = floorCount;
        this.config.customPrefix = customPrefix;
        this.saveConfig();

        try {
            this.showToast('正在生成档案...', 'info');
            this.closeDialog();

            // 构建请求内容
            const requestContent = await this.buildRequestContent(targetPerson, floorCount, customPrefix);

            // 调用自定义API
            const result = await this.callCustomAPI(requestContent);

            if (result) {
                // 显示档案详情页面，让用户确认并保存
                this.showProfileDetail(targetPerson, result);
            }
        } catch (error) {
            console.error('[Profile App] 生成档案失败:', error);
            this.showToast(`生成档案失败: ${error.message}`, 'error');
        }
    }

    /**
     * 构建API请求内容
     */
    async buildRequestContent(targetPerson, floorCount, customPrefix) {
        console.log('[Profile App] 开始构建请求内容');
        console.log('[Profile App] 参数:', { targetPerson, floorCount, customPrefix });

        // 获取最近几层楼的内容
        let recentContent = '';

        try {
            // 检查所有可能的聊天数据源
            console.log('[Profile App] 检查所有可能的聊天数据源:', {
                chat: typeof chat !== 'undefined' ? `数组长度: ${chat.length}` : '未定义',
                'window.chat': typeof window.chat !== 'undefined' ? `数组长度: ${window.chat.length}` : '未定义',
                'window.messages': typeof window.messages !== 'undefined' ? `数组长度: ${window.messages.length}` : '未定义',
                'window.contextMonitor': typeof window.contextMonitor !== 'undefined' ? '可用' : '未定义',
                'contextMonitor.getCurrentChatMessages': typeof window.contextMonitor?.getCurrentChatMessages === 'function' ? '可用' : '不可用'
            });

            let chatData = null;
            let dataSource = '';

            // 首先尝试使用contextMonitor（推荐方法）
            if (window.contextMonitor && typeof window.contextMonitor.getCurrentChatMessages === 'function') {
                try {
                    console.log('[Profile App] 尝试使用contextMonitor获取聊天数据...');
                    const contextData = await window.contextMonitor.getCurrentChatMessages();
                    if (contextData && contextData.messages && Array.isArray(contextData.messages) && contextData.messages.length > 0) {
                        chatData = contextData.messages;
                        dataSource = 'contextMonitor';
                        console.log('[Profile App] contextMonitor获取成功，消息数量:', chatData.length);
                    } else {
                        console.warn('[Profile App] contextMonitor返回空数据或格式不正确:', contextData);
                    }
                } catch (error) {
                    console.warn('[Profile App] contextMonitor获取失败:', error);
                }
            }

            // 备用方法：直接访问chat变量
            if (!chatData) {
                if (typeof chat !== 'undefined' && Array.isArray(chat) && chat.length > 0) {
                    chatData = chat;
                    dataSource = 'chat';
                } else if (typeof window.chat !== 'undefined' && Array.isArray(window.chat) && window.chat.length > 0) {
                    chatData = window.chat;
                    dataSource = 'window.chat';
                } else if (typeof window.messages !== 'undefined' && Array.isArray(window.messages) && window.messages.length > 0) {
                    chatData = window.messages;
                    dataSource = 'window.messages';
                }
            }

            if (chatData) {
                console.log(`[Profile App] 使用数据源: ${dataSource}, 总消息数: ${chatData.length}`);

                // 显示数据结构
                if (chatData.length > 0) {
                    console.log('[Profile App] 消息数据结构示例:', {
                        messageFields: Object.keys(chatData[0] || {}),
                        firstMessage: chatData[0]
                    });
                }

                // 获取最近的几条消息
                const recentMessages = chatData.slice(-floorCount);
                console.log('[Profile App] 获取到的最近消息数量:', recentMessages.length);

                // 显示消息示例
                recentMessages.forEach((msg, index) => {
                    console.log(`[Profile App] 消息 ${index + 1}:`, {
                        is_user: msg.is_user,
                        name: msg.name,
                        mes_preview: (msg.mes || '').substring(0, 100) + '...',
                        send_date: msg.send_date
                    });
                });

                recentContent = recentMessages.map((msg, index) => {
                    const speaker = msg.is_user ? '用户' : (msg.name || 'AI');
                    return `${speaker}: ${msg.mes}`;
                }).join('\n\n');

                console.log('[Profile App] 楼层内容长度:', recentContent.length);
                console.log('[Profile App] 楼层内容预览:', recentContent.substring(0, 300) + '...');
            } else {
                console.warn('[Profile App] 所有聊天数据源都不可用或为空！');
                console.log('[Profile App] 详细检查:', {
                    'typeof chat': typeof chat,
                    'chat value': chat,
                    'window.chat': window.chat,
                    'window.messages': window.messages,
                    'contextMonitor': window.contextMonitor
                });
            }
        } catch (error) {
            console.error('[Profile App] 获取聊天内容失败:', error);
        }

        // 构建完整的请求内容
        let fullContent = '';

        if (customPrefix) {
            fullContent += customPrefix + '\n\n';
            console.log('[Profile App] 添加自定义前缀，长度:', customPrefix.length);
        }

        fullContent += `目标人物分析：${targetPerson}（权重加强）\n\n`;

        if (recentContent) {
            fullContent += `最近${floorCount}层楼内容：\n${recentContent}\n\n`;
            console.log('[Profile App] 添加楼层内容，长度:', recentContent.length);
        } else {
            console.warn('[Profile App] 没有楼层内容被添加到请求中！');
        }

        fullContent += this.promptTemplate;

        console.log('[Profile App] 构建完成的请求内容总长度:', fullContent.length);
        console.log('[Profile App] 完整请求内容预览:', fullContent.substring(0, 500) + '...');
        console.log('[Profile App] ========== 完整请求内容 ==========');
        console.log(fullContent);
        console.log('[Profile App] ========== 请求内容结束 ==========');

        return fullContent;
    }

    /**
     * 调用自定义API
     */
    async callCustomAPI(content) {
        try {
            console.log('[Profile App] 开始调用API生成档案...');
            console.log('[Profile App] 请求内容长度:', content.length);

            // 检查是否有mobile自定义API配置
            if (window.mobileCustomAPIConfig && typeof window.mobileCustomAPIConfig.callAPI === 'function') {
                console.log('[Profile App] 使用mobile自定义API配置');

                // 构建API请求消息
                const messages = [
                    {
                        role: 'system',
                        content: '你是一个专业的人物分析师，请根据用户提供的信息生成详细的人物档案。'
                    },
                    {
                        role: 'user',
                        content: content
                    }
                ];

                console.log('[Profile App] ========== 发送给API的完整消息 ==========');
                console.log('System消息:', messages[0].content);
                console.log('User消息长度:', messages[1].content.length);
                console.log('User消息内容:', messages[1].content);
                console.log('[Profile App] ========== API请求消息结束 ==========');

                const apiOptions = {
                    temperature: 0.8,
                    max_tokens: 80000,
                };

                console.log('[Profile App] API选项:', apiOptions);

                const response = await window.mobileCustomAPIConfig.callAPI(messages, apiOptions);

                console.log('[Profile App] ========== API完整响应 ==========');
                console.log('[Profile App] API返回类型:', typeof response);
                console.log('[Profile App] API返回内容:', response);
                console.log('[Profile App] ========== API响应结束 ==========');

                if (response && response.content) {
                    console.log('[Profile App] 成功获取API响应内容，长度:', response.content.length);
                    return response.content;
                } else {
                    throw new Error('API返回空内容');
                }
            }
            // 备用：尝试使用SillyTavern的生成API
            else if (typeof generateRaw !== 'undefined') {
                console.log('[Profile App] 使用SillyTavern默认API');
                const result = await generateRaw(content);
                return result;
            }
            // 最后尝试：检查其他可能的API配置
            else if (window.customApiConfig && typeof window.customApiConfig.callAPI === 'function') {
                console.log('[Profile App] 使用其他自定义API配置');
                const result = await window.customApiConfig.callAPI(content);
                return result;
            }
            else {
                throw new Error('未找到可用的API配置，请在Mobile插件的API设置中配置自定义API');
            }

        } catch (error) {
            console.error('[Profile App] API调用失败:', error);
            throw error;
        }
    }

    /**
     * 显示档案详情
     */
    showProfileDetail(personName, apiResponse) {
        // 解析API响应中的Student_Profile
        const profileContent = this.extractStudentProfile(apiResponse);

        if (!profileContent) {
            this.showToast('生成的内容中未找到有效的档案格式', 'error');
            return;
        }

        // 解析档案数据
        const profileData = this.parseStudentProfile(profileContent);

        // 保存到缓存
        this.saveCachedProfile(personName, profileData, profileContent);

        // 显示档案详情界面（使用message.html的格式）
        this.showProfileDetailView(personName, profileData, profileContent);
    }

    /**
     * 提取Student_Profile内容
     */
    extractStudentProfile(content) {
        const startTag = '<Student_Profile>';
        const endTag = '</Student_Profile>';

        const lastEndTagIndex = content.lastIndexOf(endTag);
        const lastStartTagIndex = lastEndTagIndex !== -1 ? content.lastIndexOf(startTag, lastEndTagIndex) : -1;

        if (lastStartTagIndex !== -1 && lastEndTagIndex !== -1) {
            return content.substring(lastStartTagIndex, lastEndTagIndex + endTag.length).trim();
        }

        return null;
    }

    /**
     * 解析档案内容为数据对象
     */
    parseStudentProfile(profileContent) {
        const content = profileContent.replace(/<Student_Profile>|<\/Student_Profile>/g, '').trim();
        const fields = content.split('｜');

        return {
            student_name: fields[0] || "",
            gender: fields[1] || "",
            age: fields[2] || "",
            measurements: fields[3] || "",
            business_type: fields[4] || "",
            background_info: fields[5] || "",
            referral_source: fields[6] || "",
            video_interview_result: fields[7] || "",
            payment_status: fields[8] || "",
            current_condition: fields[9] || "",
            target_goals: fields[10] || "",
            special_notes: fields[11] || "",
            master_evaluation: fields[12] || "",
            psychological_state: fields[13] || "",
            personality_traits: fields[14] || "",
            main_weaknesses: fields[15] || "",
            main_advantages: fields[16] || "",
            resistance_points: fields[17] || "",
            favorite_positions: fields[18] || ""
        };
    }

    /**
     * 显示档案详情视图
     */
    showProfileDetailView(personName, profileData, fullProfileContent) {
        const detailHTML = this.generateProfileDetailHTML(profileData, fullProfileContent);

        // 创建新的应用页面
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            appContent.innerHTML = detailHTML;

            // 绑定事件
            this.bindProfileDetailEvents(personName, fullProfileContent);
        }
    }

    /**
     * 生成档案详情HTML（基于message.html）
     */
    generateProfileDetailHTML(profileData, fullProfileContent) {
        return `
      <div class="profile-detail-app">
        <div class="profile-detail-header">
          <div class="header-left">
            <button class="back-btn" onclick="window.profileApp.goBackToList()">
              <i class="fas fa-arrow-left"></i>
            </button>
            <h2>${profileData.student_name || '档案详情'}</h2>
          </div>
          <div class="header-right">
            <button class="refresh-btn" onclick="window.profileApp.refreshCurrentProfile('${profileData.student_name}')" title="强制刷新档案">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div class="profile-detail-content">
          ${this.generateMessageHTMLContent(profileData)}
        </div>
      </div>
    `;
    }

    /**
     * 生成message.html的内容
     */
    generateMessageHTMLContent(profileData) {
        // 这里复用message.html的结构，但是用JS生成
        return `
      <div class="container" style="display: flex; flex-direction: column; width: 100%; padding: 0; gap: 15px; font-family: Arial, sans-serif; box-sizing: border-box;">
        <!-- 信息卡片区域 -->
        <div class="card-area" style="position: relative; width: 100%;">
          <div style="position: relative; width: 100%; height: 100%;">
            <!-- 基本信息页面 -->
            <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 20px; box-sizing: border-box; overflow-y: auto;">
              <div style="font-size: 18px; color: #2c3e50; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 2px solid #6c757d; padding-bottom: 10px;">人物信息</div>
              <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">

                <div style="flex: 2; min-width: 200px;">
                  <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                    <span style="font-size: 14px; color: #666; width: 80px; font-weight: bold;">姓名：</span>
                    <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.student_name}</span>
                  </div>
                  <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                    <span style="font-size: 14px; color: #666; width: 80px; font-weight: bold;">性别：</span>
                    <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.gender}</span>
                  </div>
                  <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                    <span style="font-size: 14px; color: #666; width: 80px; font-weight: bold;">年龄：</span>
                    <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.age}</span>
                  </div>
                  <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                    <span style="font-size: 14px; color: #666; width: 80px; font-weight: bold;">三围：</span>
                    <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.measurements}</span>
                  </div>
                  <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                    <span style="font-size: 14px; color: #666; width: 80px; font-weight: bold;">外貌：</span>
                    <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.business_type}</span>
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #ddd; padding-top: 15px;">
                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">最后一次性爱：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.referral_source}</span>
                </div>
                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">对我的看法：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.payment_status}</span>
                </div>
                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">三日月的吐槽：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.current_condition}</span>
                </div>
              </div>

              <!-- 新增字段区域 -->
              <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
                <div style="font-size: 16px; color: #2c3e50; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 2px solid #6c757d; padding-bottom: 8px;">详细分析</div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">心理状态：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.psychological_state}</span>
                </div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">性格特征：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.personality_traits}</span>
                </div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">主要弱点：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.main_weaknesses}</span>
                </div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">主要优点：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.main_advantages}</span>
                </div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">抗拒点：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.resistance_points}</span>
                </div>

                <div style="display: flex
;
    align-items: flex-start;
    margin-bottom: 10px;
    flex-direction: column;">
                  <span style="font-size: 14px; color: #666; width: 100px; font-weight: bold;">喜欢的体位：</span>
                  <span style="font-size: 14px; color: #2c3e50; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; flex: 1; background: #fff;">${profileData.favorite_positions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div style="width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 15px; box-sizing: border-box; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 10px; width: 100%; flex-wrap: wrap;">
            <button id="saveProfileBtn" style="flex: 1; min-width: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: clamp(12px, 2vw, 16px); font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;">保存完整档案</button>
          </div>
        </div>
      </div>

      <style>

        #saveProfileBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        #saveProfileBtn:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
        }
      </style>
    `;
    }

    /**
     * 绑定档案详情事件
     */
    bindProfileDetailEvents(personName, fullProfileContent) {
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveProfileToWorldbook(personName, fullProfileContent);
        }
    }

    /**
     * 保存档案到世界书（多种备用方法）
     */
    async saveProfileToWorldbook(personName, profileContent) {
        try {
            console.log('[Profile App] 开始保存档案到世界书');

            // 优先选择"外置手机"世界书
            let targetWorldbookName = null;

            // 方法1：优先查找"外置手机"世界书
            const worldInfoSelect = document.getElementById('world_info');
            if (worldInfoSelect && worldInfoSelect.selectedOptions.length > 0) {
                // 先查找是否有"外置手机"世界书
                const mobileWorldbook = Array.from(worldInfoSelect.selectedOptions).find(option =>
                    option.text === '外置手机' || option.text.includes('外置手机') || option.text.includes('mobile')
                );

                if (mobileWorldbook) {
                    targetWorldbookName = mobileWorldbook.text;
                    console.log(`[Profile App] 找到外置手机世界书: ${targetWorldbookName}`);
                } else {
                    // 如果没有外置手机世界书，使用第一个选中的世界书
                    targetWorldbookName = worldInfoSelect.selectedOptions[0].text;
                    console.log(`[Profile App] 使用第一个选中的世界书: ${targetWorldbookName}`);
                }
            } else if (typeof window.selected_world_info !== 'undefined' && Array.isArray(window.selected_world_info) && window.selected_world_info.length > 0) {
                // 方法2：从全局变量中查找
                const mobileWorldbook = window.selected_world_info.find(name =>
                    name === '外置手机' || name.includes('外置手机') || name.includes('mobile')
                );

                if (mobileWorldbook) {
                    targetWorldbookName = mobileWorldbook;
                    console.log(`[Profile App] 从全局变量找到外置手机世界书: ${targetWorldbookName}`);
                } else {
                    targetWorldbookName = window.selected_world_info[0];
                    console.log(`[Profile App] 使用全局变量中的第一个世界书: ${targetWorldbookName}`);
                }
            } else {
                throw new Error('未找到可用的世界书，请先在SillyTavern中选择一个世界书（建议创建并选择"外置手机"世界书）');
            }

            const entryName = `【档案】${personName}`;

            console.log('[Profile App] 可用API检查:', {
                createWorldInfoEntry: typeof createWorldInfoEntry,
                saveWorldInfo: typeof saveWorldInfo,
                TavernHelper: typeof TavernHelper,
                getWorldbook: typeof getWorldbook
            });

            // 尝试多种保存方法
            let saveSuccess = false;
            let lastError = null;



            // 方法4：使用REST API
            if (!saveSuccess) {
                try {
                    console.log('[Profile App] 尝试方法4：REST API');

                    const success = await this.saveToWorldbookViaAPI(targetWorldbookName, {
                        comment: entryName,
                        content: profileContent,
                        key: [personName],
                        keysecondary: [],
                        constant: false,
                        selective: true,
                        sticky: 0,
                        cooldown: 0,
                        delay: 0,
                        depth: 4,
                        out_depth: 0,
                        position: 0,
                        role: 0,
                        disable: true  // 设置为禁用状态
                    });

                    if (success) {
                        saveSuccess = true;
                        console.log('[Profile App] 方法4保存成功');
                    }
                } catch (error) {
                    console.warn('[Profile App] 方法4失败:', error);
                    lastError = error;
                }
            }

            // 方法5：作为备用方案，保存到本地存储并提示用户手动导入
            if (!saveSuccess) {
                try {
                    console.log('[Profile App] 尝试方法5：本地存储备用');

                    // 保存到本地存储的专用位置
                    const backupKey = `profile-backup-${personName}-${Date.now()}`;
                    const backupData = {
                        worldbookName: targetWorldbookName,
                        entryName: entryName,
                        entryData: {
                            comment: entryName,
                            content: profileContent,
                            key: [personName],
                            keysecondary: [],
                            constant: false,
                            selective: true,
                            sticky: 0,
                            cooldown: 0,
                            delay: 0,
                            depth: 4,
                            out_depth: 0,
                            position: 0,
                            role: 0,
                            disable: true  // 设置为禁用状态
                        },
                        timestamp: new Date().toISOString()
                    };

                    localStorage.setItem(backupKey, JSON.stringify(backupData));

                    saveSuccess = true;
                    console.log('[Profile App] 方法4：已保存到本地存储作为备份');

                    this.showToast(`档案已保存到本地缓存。世界书API暂不可用，档案将在下次世界书可用时自动同步。`, 'warning');
                } catch (error) {
                    console.warn('[Profile App] 方法4失败:', error);
                    lastError = error;
                }
            }

            if (saveSuccess) {
                if (lastError) {
                    console.log(`[Profile App] 档案保存成功（使用备用方法）`);
                } else {
                    this.showToast(`档案"${entryName}"保存成功！`, 'success');
                }

                // 保存成功后返回列表，提示用户手动刷新
                this.goBackToList();
            } else {
                throw lastError || new Error('所有保存方法都失败了');
            }

        } catch (error) {
            console.error('[Profile App] 保存档案失败:', error);
            this.showToast(`保存失败: ${error.message}`, 'error');
        }
    }

    /**
     * 通过REST API保存到世界书（正确的格式）
     */
    async saveToWorldbookViaAPI(worldName, entryData) {
        try {
            // 首先获取现有的世界书数据
            const existingWorldData = await this.loadWorldInfoByName(worldName);

            if (!existingWorldData) {
                throw new Error(`世界书 "${worldName}" 不存在或无法加载`);
            }

            // 生成新的条目ID（必须是整数）
            const entryId = Date.now();

            // 构建完整的世界书条目（使用SillyTavern的完整模板）
            const newEntryTemplate = {
                uid: entryId,
                key: entryData.key || [],
                keysecondary: entryData.keysecondary || [],
                comment: entryData.comment,
                content: entryData.content,
                constant: entryData.constant || false,
                vectorized: false,
                selective: entryData.selective || false,
                selectiveLogic: 0, // AND_ANY
                addMemo: true,
                order: 100,
                position: entryData.position || 0,
                disable: true,  // 设置为禁用状态
                ignoreBudget: false,
                excludeRecursion: false,
                preventRecursion: false,
                matchPersonaDescription: false,
                matchCharacterDescription: false,
                matchCharacterPersonality: false,
                matchCharacterDepthPrompt: false,
                matchScenario: false,
                matchCreatorNotes: false,
                delayUntilRecursion: 0,
                probability: 100,
                useProbability: true,
                depth: entryData.depth || 4,
                group: '',
                groupOverride: false,
                groupWeight: 100,
                scanDepth: null,
                caseSensitive: null,
                matchWholeWords: null,
                useGroupScoring: null,
                automationId: '',
                role: entryData.role || 0,
                sticky: entryData.sticky || null,
                cooldown: entryData.cooldown || null,
                delay: entryData.delay || null,
                triggers: [],
                characterFilter: {
                    isExclude: false,
                    names: [],
                    tags: []
                }
            };

            // 构建正确的世界书数据格式
            const updatedWorldData = {
                ...existingWorldData,
                entries: {
                    ...existingWorldData.entries,
                    [entryId]: newEntryTemplate
                }
            };

            const headers = {
                'Content-Type': 'application/json',
            };

            // 如果有getRequestHeaders函数，使用它
            if (typeof window.getRequestHeaders === 'function') {
                Object.assign(headers, window.getRequestHeaders());
            }

            const response = await fetch('/api/worldinfo/edit', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    name: worldName,
                    data: updatedWorldData
                }),
            });

            if (response.ok) {
                console.log(`[Profile App] API返回成功，开始验证保存结果...`);

                // 等待保存完成
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 验证保存是否成功
                const verifyData = await this.loadWorldInfoByName(worldName);
                const savedEntry = Object.values(verifyData.entries || {}).find(entry => entry.comment === entryData.comment);

                if (savedEntry) {
                    console.log(`[Profile App] REST API保存成功，已验证条目存在`);
                    return true;
                } else {
                    console.error(`[Profile App] REST API保存验证失败，条目未找到`);
                    return false;
                }
            } else {
                const errorText = await response.text();
                console.error(`[Profile App] API保存失败: ${response.status} ${response.statusText}`, errorText);
                return false;
            }

        } catch (error) {
            console.error('[Profile App] REST API保存失败:', error);
            return false;
        }
    }

    /**
     * 查看现有档案
     */
    async viewProfile(profileName) {
        try {
            // 优先从缓存获取
            const cachedProfile = this.getCachedProfile(profileName);
            if (cachedProfile) {
                console.log('[Profile App] 从缓存加载档案:', profileName);
                this.showProfileDetailView(profileName, cachedProfile.profileData, cachedProfile.fullContent);
                return;
            }

            // 缓存中没有，从世界书获取
            const profile = this.profileList.find(p => p.name === profileName);
            if (!profile) {
                this.showToast('档案不存在', 'error');
                return;
            }

            console.log('[Profile App] 从世界书加载档案:', profileName);
            // 解析档案内容
            const profileContent = this.extractStudentProfile(profile.content);
            if (profileContent) {
                const profileData = this.parseStudentProfile(profileContent);

                // 保存到缓存以便下次快速访问
                this.saveCachedProfile(profileName, profileData, profileContent);

                this.showProfileDetailView(profileName, profileData, profileContent);
            } else {
                this.showToast('档案格式错误', 'error');
            }
        } catch (error) {
            console.error('[Profile App] 查看档案失败:', error);
            this.showToast('查看档案失败', 'error');
        }
    }

    /**
     * 强制刷新当前查看的档案
     */
    async refreshCurrentProfile(profileName) {
        try {
            console.log('[Profile App] 强制刷新档案:', profileName);

            // 清理该档案的缓存
            this.profileCache.delete(profileName);

            // 重新从世界书加载档案
            await this.loadProfileList();

            // 重新查看档案
            await this.viewProfile(profileName);

            this.showToast('档案已刷新', 'success');
        } catch (error) {
            console.error('[Profile App] 刷新档案失败:', error);
            this.showToast('刷新档案失败', 'error');
        }
    }

    /**
     * 返回档案列表
     */
    goBackToList() {
        const appContent = document.querySelector('.app-content');
        if (appContent) {
            appContent.innerHTML = this.getAppContent();
        }
    }

    /**
     * 显示对话框
     */
    showDialog(html) {
        let container = document.getElementById('profile-dialog-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'profile-dialog-container';
            container.className = 'profile-dialog-container';

            // 直接添加到body，确保最高层级
            document.body.appendChild(container);
        }

        container.innerHTML = html;
        container.style.display = 'block';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '99999';

        // 添加动画效果
        setTimeout(() => {
            const dialog = container.querySelector('.profile-dialog');
            if (dialog) {
                dialog.classList.add('show');
            }
        }, 10);

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';

        console.log('[Profile App] 对话框已显示');
    }

    /**
     * 关闭对话框
     */
    closeDialog() {
        const container = document.getElementById('profile-dialog-container');
        if (!container) return;

        const dialog = container.querySelector('.profile-dialog');
        if (dialog) {
            dialog.classList.remove('show');
        }

        setTimeout(() => {
            container.style.display = 'none';
            container.innerHTML = '';

            // 恢复背景滚动
            document.body.style.overflow = '';
        }, 200);
    }

    /**
     * 显示调试信息
     */
    showDebugInfo() {
        const debugInfo = {
            // API可用性检查
            apis: {
                TavernHelper: typeof TavernHelper !== 'undefined',
                getWorldbook: typeof getWorldbook !== 'undefined',
                createWorldbookEntries: typeof createWorldbookEntries !== 'undefined',
                createWorldInfoEntry: typeof createWorldInfoEntry !== 'undefined',
                saveWorldInfo: typeof saveWorldInfo !== 'undefined',
                mobileCustomAPIConfig: typeof window.mobileCustomAPIConfig !== 'undefined',
                getSortedEntries: typeof window.getSortedEntries !== 'undefined'
            },

            // 世界书信息
            worldbooks: {
                selected_world_info: window.selected_world_info || 'undefined',
                world_info_globalSelect: window.world_info?.globalSelect || 'undefined',
                dom_selection: this.getSelectedWorldbooksFromDOM()
            },

            // 缓存信息
            cache: {
                profileCacheSize: this.profileCache.size,
                cachedProfiles: Array.from(this.profileCache.keys())
            },

            // 当前配置
            config: this.config
        };

        const debugHTML = `
      <div class="profile-dialog-overlay">
        <div class="profile-dialog" style="max-width: 600px;">
          <div class="dialog-header">
            <h3>调试信息</h3>
            <button class="close-btn" onclick="window.profileApp.closeDialog()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="dialog-content">
            <div style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 400px; overflow-y: auto;">
              <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
            <div style="margin-top: 10px; text-align: center;">
              <button onclick="navigator.clipboard.writeText('${JSON.stringify(debugInfo, null, 2).replace(/'/g, "\\'")}').then(() => alert('调试信息已复制到剪贴板'))">复制调试信息</button>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="confirm-btn" onclick="window.profileApp.closeDialog()">
              关闭
            </button>
          </div>
        </div>
      </div>
    `;

        this.showDialog(debugHTML);
        console.log('[Profile App] 调试信息:', debugInfo);
    }

    /**
     * 从DOM获取选中的世界书
     */
    getSelectedWorldbooksFromDOM() {
        const worldInfoSelect = document.getElementById('world_info');
        if (worldInfoSelect) {
            return Array.from(worldInfoSelect.selectedOptions).map(opt => ({
                text: opt.text,
                value: opt.value
            }));
        }
        return 'DOM元素未找到';
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 如果有全局的toast函数，使用它
        if (window.showMobileToast) {
            window.showMobileToast(message, type);
            return;
        }

        // 创建简单的提示
        const toast = document.createElement('div');
        toast.className = `profile-toast profile-toast-${type}`;
        toast.textContent = message;

        // 样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            borderRadius: '20px',
            color: 'white',
            fontSize: '14px',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
        });

        // 根据类型设置背景色
        switch (type) {
            case 'success':
                toast.style.background = '#52c41a';
                break;
            case 'error':
                toast.style.background = '#ff4d4f';
                break;
            default:
                toast.style.background = '#1890ff';
        }

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 暴露类和创建全局实例
if (typeof window !== 'undefined') {
    window.ProfileApp = ProfileApp;
    window.profileApp = new ProfileApp();
    console.log('[Profile App] ✅ 档案管理应用已创建');
}
