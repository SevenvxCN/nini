// ==Mobile Custom API Config==
// @name         Mobile Custom API Configuration
// @version      1.0.0
// @description  移动端自定义API配置管理器，支持多种API服务商
// @author       cd
// @license      MIT

/**
 * 移动端自定义API配置管理器
 * 移植自论坛应用和real-time-status-bar插件的API配置功能
 */
class MobileCustomAPIConfig {
    constructor() {
        this.isInitialized = false;
        this.currentSettings = this.getDefaultSettings();
        this.supportedProviders = this.getSupportedProviders();

        // 初始化Gemini的内置URL
        this.geminiUrl = this.supportedProviders.gemini.defaultUrl;

        // 绑定到全局窗口对象
        window.mobileCustomAPIConfig = this;

        console.log('[Mobile API Config] 自定义API配置管理器已创建');
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            enabled: false,
            provider: 'openai', // 修改：默认使用OpenAI
            apiUrl: '',
            apiKey: '',
            model: '',
            temperature: 0.8,
            maxTokens: 30000,
            useProxy: false,
            proxyUrl: '',
            timeout: 30000,
            retryCount: 3,
            // 高级设置
            customHeaders: {},
            systemPrompt: '',
            streamEnabled: false
        };
    }

    /**
     * 获取支持的API服务商配置
     */
    getSupportedProviders() {
        return {
            openai: {
                name: 'OpenAI',
                defaultUrl: 'https://api.openai.com',
                urlSuffix: 'v1/chat/completions',
                modelsEndpoint: 'v1/models',
                defaultModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
                authType: 'Bearer',
                requiresKey: true,
                icon: '🤖'
            },
            gemini: {
                name: 'Google Gemini',
                defaultUrl: 'https://generativelanguage.googleapis.com',
                urlSuffix: 'v1beta/models/{model}:generateContent',
                modelsEndpoint: 'v1beta/models',
                defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
                authType: 'Key',
                requiresKey: true,
                icon: '💎'
            },
            custom: {
                name: '自定义API',
                defaultUrl: '',
                urlSuffix: 'chat/completions',
                modelsEndpoint: 'models',
                defaultModels: [],
                authType: 'Bearer',
                requiresKey: true,
                icon: '⚙️'
            }
        };
    }

    /**
     * 初始化API配置管理器
     */
    async initialize() {
        try {
            await this.loadSettings();
            this.createUI();
            this.bindEvents();
            this.isInitialized = true;

            console.log('[Mobile API Config] ✅ 自定义API配置管理器初始化完成');
            console.log('[Mobile API Config] 📋 当前设置:', {
                provider: this.currentSettings.provider,
                enabled: this.currentSettings.enabled,
                apiUrl: this.currentSettings.apiUrl || '(未设置)',
                hasApiKey: !!this.currentSettings.apiKey,
                model: this.currentSettings.model || '(未设置)',
                支持的服务商: Object.keys(this.supportedProviders)
            });
            return true;
        } catch (error) {
            console.error('[Mobile API Config] ❌ 初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        try {
            const savedSettings = localStorage.getItem('mobile_custom_api_settings');
            if (savedSettings) {
                this.currentSettings = { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) };
            }

            console.log('[Mobile API Config] 设置已加载:', this.currentSettings);
        } catch (error) {
            console.error('[Mobile API Config] 加载设置失败:', error);
            this.currentSettings = this.getDefaultSettings();
        }
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        try {
            localStorage.setItem('mobile_custom_api_settings', JSON.stringify(this.currentSettings));
            console.log('[Mobile API Config] 设置已保存');

            // 触发设置更新事件
            document.dispatchEvent(new CustomEvent('mobile-api-config-updated', {
                detail: this.currentSettings
            }));

            return true;
        } catch (error) {
            console.error('[Mobile API Config] 保存设置失败:', error);
            return false;
        }
    }

    /**
     * 创建API配置UI
     */
    createUI() {
        // 创建触发按钮
        this.createTriggerButton();

        // 创建配置面板
        this.createConfigPanel();
    }

    /**
     * 创建触发按钮
     */
    createTriggerButton() {
        // 检查是否已存在按钮
        if (document.getElementById('mobile-api-config-trigger')) {
            return;
        }

        const triggerButton = document.createElement('button');
        triggerButton.id = 'mobile-api-config-trigger';
        triggerButton.className = 'mobile-api-config-btn';
        triggerButton.innerHTML = '🔧';
        triggerButton.title = 'API配置';
        triggerButton.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #8B5CF6, #EF4444);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            z-index: 9997;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // 悬停效果
        triggerButton.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
        });

        triggerButton.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        });

        // 点击事件
        triggerButton.addEventListener('click', () => {
            this.showConfigPanel();
        });

        document.body.appendChild(triggerButton);
        console.log('[Mobile API Config] ✅ 触发按钮已创建');
    }

    /**
     * 创建配置面板
     */
    createConfigPanel() {
        if (document.getElementById('mobile-api-config-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'mobile-api-config-panel';
        panel.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            backdrop-filter: blur(5px);
        `;

        const content = document.createElement('div');
        content.className = 'mobile-api-config-content';
        content.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        content.innerHTML = this.getConfigPanelHTML();
        panel.appendChild(content);
        document.body.appendChild(panel);

        console.log('[Mobile API Config] ✅ 配置面板已创建');
    }

    /**
     * 获取配置面板HTML
     */
    getConfigPanelHTML() {
        const providers = this.supportedProviders;
        const settings = this.currentSettings;

        return `
            <div class="mobile-api-config-header">
                <h3 style="margin: 0 0 20px 0; color: #333; text-align: center;">
                    ⚙️ API配置
                </h3>
                <button id="close-api-config" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
            </div>

            <div class="mobile-api-config-form">
                <!-- 启用开关 -->
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 10px; font-weight: 500;">
                        <input type="checkbox" id="api-enabled" ${settings.enabled ? 'checked' : ''}>
                        启用自定义API
                    </label>
                </div>

                <!-- 服务商选择 -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">API服务商:</label>
                    <select id="api-provider" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; background-color: #fff; color: #000;">
                        ${Object.entries(providers).map(([key, provider]) =>
                            `<option value="${key}" ${key === settings.provider ? 'selected' : ''}>${provider.icon} ${provider.name}</option>`
                        ).join('')}
                    </select>
                </div>

                <!-- API URL -->
                <div style="margin-bottom: 15px;" id="api-url-section">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">API URL:</label>
                    <input type="text" id="api-url" placeholder="https://api.openai.com"
                           value="${settings.apiUrl}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;background-color: #fff;color: #000;">
                    <small style="color: #666; font-size: 12px;">留空使用默认URL</small>
                </div>

                <!-- API密钥 -->
                <div style="margin-bottom: 15px;" id="api-key-section">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">API密钥:</label>
                    <div style="position: relative;">
                        <input type="password" id="api-key" placeholder="sk-... 或 AIza..."
                               value="${settings.apiKey}"
                               style="width: 100%; padding: 8px 35px 8px 8px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;background-color: #fff;color: #000;">
                        <button type="button" id="toggle-api-key" style="
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                            background: none;
                            border: none;
                            cursor: pointer;
                            color: #666;
                        ">👁️</button>
                    </div>
                </div>

                <!-- 模型选择 -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">模型:</label>
                    <div style="display: flex; gap: 10px;">
                        <select id="api-model" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">选择模型...</option>
                        </select>
                        <button type="button" id="refresh-models" style="
                            padding: 8px 15px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">📥</button>
                    </div>
                </div>

                <!-- 高级设置 -->
                <details style="margin-bottom: 15px;">
                    <summary style="cursor: pointer; font-weight: 500; margin-bottom: 10px;color: #000;">⚙️ 高级设置</summary>

                    <div style="margin-left: 15px;">
                        <!-- 温度 -->
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;color: #000;">温度 (0-2):</label>
                            <input type="range" id="api-temperature" min="0" max="2" step="0.1"
                                   value="${settings.temperature}"
                                   style="width: 100%;">
                            <span id="temperature-value" style="font-size: 12px; color: #666;">${settings.temperature}</span>
                        </div>

                        <!-- 最大令牌数 -->
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">最大令牌数:</label>
                            <input type="number" id="api-max-tokens" min="1" max="80000"
                                   value="${settings.maxTokens}"
                                   style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px;background-color: #fff;color: #000;">
                        </div>

                        <!-- 系统提示词 -->
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">系统提示词:</label>
                            <textarea id="api-system-prompt" rows="3"
                                      placeholder="可选的系统提示词..."
                                      style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; resize: vertical; box-sizing: border-box;">${settings.systemPrompt}</textarea>
                        </div>
                    </div>
                </details>

                <!-- 按钮组 -->
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" id="test-api-connection" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 500;
                    ">🧪 测试连接</button>

                    <button type="button" id="save-api-config" style="
                        flex: 1;
                        padding: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 500;
                    ">💾 保存配置</button>
                </div>

                <!-- 状态显示 -->
                <div id="api-config-status" style="
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 5px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    font-size: 14px;
                    display: none;
                "></div>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭面板
        $(document).on('click', '#close-api-config', () => {
            this.hideConfigPanel();
        });

        // 点击面板外部关闭
        $(document).on('click', '#mobile-api-config-panel', (e) => {
            if (e.target.id === 'mobile-api-config-panel') {
                this.hideConfigPanel();
            }
        });

        // 服务商选择变化
        $(document).on('change', '#api-provider', (e) => {
            this.onProviderChange(e.target.value);
        });

        // 密钥显示切换
        $(document).on('click', '#toggle-api-key', () => {
            const keyInput = document.getElementById('api-key');
            const isPassword = keyInput.type === 'password';
            keyInput.type = isPassword ? 'text' : 'password';
            document.getElementById('toggle-api-key').textContent = isPassword ? '🙈' : '👁️';
        });

        // 温度滑块
        $(document).on('input', '#api-temperature', (e) => {
            document.getElementById('temperature-value').textContent = e.target.value;
        });

        // 刷新模型列表
        $(document).on('click', '#refresh-models', () => {
            this.refreshModels();
        });

        // 测试连接
        $(document).on('click', '#test-api-connection', () => {
            this.testConnection();
        });

        // 保存配置
        $(document).on('click', '#save-api-config', () => {
            this.saveConfigFromUI();
        });
    }

    /**
     * 显示配置面板
     */
    showConfigPanel() {
        const panel = document.getElementById('mobile-api-config-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateUIFromSettings();

            // 确保URL显示状态正确
            const currentProvider = this.currentSettings.provider;
            this.onProviderChange(currentProvider);
        }
    }

    /**
     * 隐藏配置面板
     */
    hideConfigPanel() {
        const panel = document.getElementById('mobile-api-config-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 当服务商选择变化时
     */
    onProviderChange(providerKey) {
        const provider = this.supportedProviders[providerKey];
        if (!provider) return;

        console.log('[Mobile API Config] 服务商切换:', providerKey, provider);

        // 处理URL输入框的显示/隐藏
        const urlSection = document.getElementById('api-url-section');
        const urlInput = document.getElementById('api-url');

        if (providerKey === 'gemini') {
            // Gemini: 隐藏URL输入框，使用内置URL
            if (urlSection) {
                urlSection.style.display = 'none';
            }
            // 内部设置Gemini的URL，但不显示给用户
            this.geminiUrl = provider.defaultUrl;
        } else {
            // OpenAI和自定义API: 显示URL输入框让用户编辑
            if (urlSection) {
                urlSection.style.display = 'block';
            }

            // 恢复或设置非Gemini服务商的URL
            if (urlInput) {
                // 如果之前保存过这个服务商的URL，则恢复；否则使用默认值
                const savedUrl = this.getNonGeminiUrl(providerKey);
                urlInput.value = savedUrl || provider.defaultUrl;
                urlInput.placeholder = provider.defaultUrl;
            }
        }

        // 更新API密钥占位符
        const keyInput = document.getElementById('api-key');
        if (keyInput) {
            if (providerKey === 'openai') {
                keyInput.placeholder = 'sk-...';
            } else if (providerKey === 'gemini') {
                keyInput.placeholder = 'AIza...';
            } else {
                keyInput.placeholder = '输入API密钥...';
            }
        }

        // 显示/隐藏密钥输入框
        const keySection = document.getElementById('api-key-section');
        if (keySection) {
            keySection.style.display = provider.requiresKey ? 'block' : 'none';
        }

        // 更新模型列表
        this.updateModelList(provider.defaultModels);
    }

    /**
     * 获取非Gemini服务商的保存URL
     */
    getNonGeminiUrl(providerKey) {
        const saved = localStorage.getItem(`mobile_api_url_${providerKey}`);
        return saved || '';
    }

    /**
     * 保存非Gemini服务商的URL
     */
    saveNonGeminiUrl(providerKey, url) {
        if (providerKey !== 'gemini') {
            localStorage.setItem(`mobile_api_url_${providerKey}`, url);
        }
    }

    /**
     * 更新模型列表
     */
    updateModelList(models) {
        const modelSelect = document.getElementById('api-model');
        if (!modelSelect) return;

        modelSelect.innerHTML = '<option value="">选择模型...</option>';

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === this.currentSettings.model) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
    }

    /**
     * 从UI更新设置
     */
    updateUIFromSettings() {
        const settings = this.currentSettings;

        // 更新各个字段
        const elements = {
            'api-enabled': settings.enabled,
            'api-provider': settings.provider,
            'api-url': settings.apiUrl,
            'api-key': settings.apiKey,
            'api-model': settings.model,
            'api-temperature': settings.temperature,
            'api-max-tokens': settings.maxTokens,
            'api-system-prompt': settings.systemPrompt
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });

        // 更新温度显示
        const tempValue = document.getElementById('temperature-value');
        if (tempValue) {
            tempValue.textContent = settings.temperature;
        }
    }

    /**
     * 从UI保存配置
     */
    async saveConfigFromUI() {
        try {
            const provider = document.getElementById('api-provider')?.value || 'openai';
            let apiUrl;

            if (provider === 'gemini') {
                // Gemini使用内置的URL
                apiUrl = this.geminiUrl || this.supportedProviders.gemini.defaultUrl;
            } else {
                // 其他服务商从输入框获取URL并保存
                apiUrl = document.getElementById('api-url')?.value || '';
                this.saveNonGeminiUrl(provider, apiUrl);
            }

            // 收集UI数据
            const formData = {
                enabled: document.getElementById('api-enabled')?.checked || false,
                provider: provider,
                apiUrl: apiUrl,
                apiKey: document.getElementById('api-key')?.value || '',
                model: document.getElementById('api-model')?.value || '',
                temperature: parseFloat(document.getElementById('api-temperature')?.value || 0.8),
                maxTokens: parseInt(document.getElementById('api-max-tokens')?.value || 1500),
                systemPrompt: document.getElementById('api-system-prompt')?.value || ''
            };

            // 验证必填字段
            const providerConfig = this.supportedProviders[formData.provider];
            if (providerConfig?.requiresKey && !formData.apiKey) {
                this.showStatus('❌ 请填写API密钥', 'error');
                return;
            }

            // 更新设置
            this.currentSettings = { ...this.currentSettings, ...formData };

            // 保存到localStorage
            const saved = await this.saveSettings();

            if (saved) {
                this.showStatus('✅ 配置已保存', 'success');
                setTimeout(() => {
                    this.hideConfigPanel();
                }, 1500);
            } else {
                this.showStatus('❌ 保存失败', 'error');
            }

        } catch (error) {
            console.error('[Mobile API Config] 保存配置失败:', error);
            this.showStatus('❌ 保存失败: ' + error.message, 'error');
        }
    }

    /**
     * 刷新模型列表
     */
    async refreshModels() {
        const provider = document.getElementById('api-provider')?.value || this.currentSettings.provider;
        let apiUrl;

        if (provider === 'gemini') {
            // Gemini使用内置的URL，不从输入框获取
            apiUrl = this.geminiUrl || this.supportedProviders.gemini.defaultUrl;
        } else {
            // 其他服务商从输入框获取URL
            apiUrl = document.getElementById('api-url')?.value || '';
        }

        const apiKey = document.getElementById('api-key')?.value || '';

        console.log('[Mobile API Config] 开始刷新模型列表:', {
            provider,
            apiUrl: apiUrl ? '已设置' : '未设置',
            apiKey: apiKey ? '已设置' : '未设置',
            isGemini: provider === 'gemini'
        });

        if (!apiUrl) {
            this.showStatus('❌ 请先填写API URL', 'error');
            return;
        }

        if (!apiKey) {
            this.showStatus('❌ 请先填写API密钥', 'error');
            return;
        }

        this.showStatus('🔄 正在获取模型列表...', 'info');

        try {
            const models = await this.fetchModels(provider, apiUrl, apiKey);

            if (models && models.length > 0) {
                this.updateModelList(models);
                this.showStatus(`✅ 已获取 ${models.length} 个模型`, 'success');
                console.log('[Mobile API Config] 成功获取模型列表:', models);
            } else {
                // 使用默认模型列表
                const defaultModels = this.supportedProviders[provider]?.defaultModels || [];
                this.updateModelList(defaultModels);
                this.showStatus(`⚠️ 使用默认模型列表 (${defaultModels.length} 个)`, 'warning');
                console.warn('[Mobile API Config] 使用默认模型列表:', defaultModels);
            }
        } catch (error) {
            console.error('[Mobile API Config] 获取模型失败:', error);

            // 使用默认模型列表作为备选
            const defaultModels = this.supportedProviders[provider]?.defaultModels || [];
            if (defaultModels.length > 0) {
                this.updateModelList(defaultModels);
                this.showStatus(`⚠️ 网络请求失败，使用默认模型列表 (${defaultModels.length} 个)`, 'warning');
            } else {
                this.showStatus('❌ 获取模型失败: ' + error.message, 'error');
            }
        }
    }

        /**
     * 获取模型列表 (完全兼容real-time-status-bar逻辑)
     */
    async fetchModels(provider, apiUrl, apiKey) {
        const providerConfig = this.supportedProviders[provider];
        if (!providerConfig) {
            throw new Error('不支持的服务商');
        }

        // 构建模型列表URL
        let modelsUrl = apiUrl.trim();
        if (!modelsUrl.endsWith('/')) {
            modelsUrl += '/';
        }

        // 根据不同服务商构建正确的URL
        if (provider === 'gemini') {
            // Gemini API使用特殊的URL结构
            if (!modelsUrl.includes('/v1beta/models')) {
                if (modelsUrl.endsWith('/v1/')) {
                    modelsUrl = modelsUrl.replace('/v1/', '/v1beta/models');
                } else {
                    modelsUrl += 'v1beta/models';
                }
            }
        } else {
            // OpenAI和自定义API使用标准URL构建
            if (modelsUrl.endsWith('/v1/')) {
                modelsUrl += 'models';
            } else if (!modelsUrl.includes('/models')) {
                modelsUrl += 'models';
            }
        }

        // 构建请求头
        const headers = { 'Content-Type': 'application/json' };

        // 根据服务商设置正确的认证方式
        if (providerConfig.requiresKey && apiKey) {
            if (provider === 'gemini') {
                // Gemini API使用URL参数传递key
                modelsUrl += `?key=${apiKey}`;
            } else {
                // OpenAI和自定义API使用Bearer认证
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        console.log('[Mobile API Config] 请求模型列表:', {
            provider: provider,
            url: modelsUrl.replace(apiKey || '', '[HIDDEN]'),
            headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : undefined }
        });

        try {
            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: headers
                // 移除timeout，因为某些浏览器不支持
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Mobile API Config] 模型列表请求失败:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[Mobile API Config] 模型列表原始响应:', data);

            // 根据不同服务商解析响应
            let models = [];
            if (provider === 'gemini') {
                // Gemini API响应格式：{ models: [{ name: "models/gemini-pro", ... }] }
                if (data.models && Array.isArray(data.models)) {
                    models = data.models
                        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
                        .map(model => model.name.replace('models/', ''));
                } else {
                    console.warn('[Mobile API Config] Gemini API响应格式异常:', data);
                    // 如果没有返回期望的格式，使用默认模型
                    models = providerConfig.defaultModels;
                }
            } else {
                // OpenAI兼容格式
                if (data.data && Array.isArray(data.data)) {
                    // 标准OpenAI格式
                    models = data.data.map(model => model.id);
                } else if (Array.isArray(data)) {
                    // 直接数组格式
                    models = data.map(model => model.id || model.name || model);
                } else {
                    console.warn('[Mobile API Config] OpenAI兼容API响应格式异常:', data);
                    models = providerConfig.defaultModels;
                }
            }

            const filteredModels = models.filter(model => typeof model === 'string' && model.length > 0);
            console.log('[Mobile API Config] 解析后的模型列表:', filteredModels);

            return filteredModels.length > 0 ? filteredModels : providerConfig.defaultModels;

        } catch (fetchError) {
            console.error('[Mobile API Config] 网络请求失败:', fetchError);
            // 如果网络请求失败，返回默认模型列表
            return providerConfig.defaultModels;
        }
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        const provider = document.getElementById('api-provider')?.value || this.currentSettings.provider;
        let apiUrl;

        if (provider === 'gemini') {
            // Gemini使用内置的URL，不从输入框获取
            apiUrl = this.geminiUrl || this.supportedProviders.gemini.defaultUrl;
        } else {
            // 其他服务商从输入框获取URL
            apiUrl = document.getElementById('api-url')?.value || '';
        }

        const apiKey = document.getElementById('api-key')?.value || '';
        const model = document.getElementById('api-model')?.value || '';

        if (!apiUrl) {
            this.showStatus('❌ 请先填写API URL', 'error');
            return;
        }

        const providerConfig = this.supportedProviders[provider];
        if (providerConfig?.requiresKey && !apiKey) {
            this.showStatus('❌ 请先填写API密钥', 'error');
            return;
        }

        if (!model) {
            this.showStatus('❌ 请先选择模型', 'error');
            return;
        }

        this.showStatus('🧪 正在测试连接...', 'info');

        try {
            const result = await this.testAPICall(provider, apiUrl, apiKey, model);
            if (result.success) {
                this.showStatus('✅ 连接测试成功!', 'success');
            } else {
                this.showStatus('❌ 连接测试失败: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('[Mobile API Config] 连接测试失败:', error);
            this.showStatus('❌ 连接测试失败: ' + error.message, 'error');
        }
    }

    /**
     * 执行API测试调用
     */
    async testAPICall(provider, apiUrl, apiKey, model) {
        const providerConfig = this.supportedProviders[provider];

        // 构建请求URL
        let requestUrl = apiUrl.trim();
        if (!requestUrl.endsWith('/')) {
            requestUrl += '/';
        }

        // 根据不同服务商构建URL
        if (provider === 'gemini') {
            // Gemini API使用特殊的URL结构，并通过URL参数传递API key
            requestUrl += providerConfig.urlSuffix.replace('{model}', model);
            if (apiKey) {
                requestUrl += `?key=${apiKey}`;
            }
        } else {
            // OpenAI和自定义API使用标准URL构建
            requestUrl += providerConfig.urlSuffix.replace('{model}', model);
        }

        // 构建请求头
        const headers = { 'Content-Type': 'application/json' };

        // 根据服务商设置正确的认证方式
        if (providerConfig.requiresKey && apiKey && provider !== 'gemini') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // 构建请求体
        const requestBody = this.buildTestRequestBody(provider, model);

        console.log('[Mobile API Config] 测试请求:', {
            provider: provider,
            url: requestUrl.replace(apiKey || '', '[HIDDEN]'),
            headers: { ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : undefined },
            body: requestBody
        });

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: 15000
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        console.log('[Mobile API Config] 测试响应:', data);

        return { success: true, data: data };
    }

    /**
     * 构建测试请求体 (OpenAI兼容格式)
     */
    buildTestRequestBody(provider, model) {
        const testMessage = "Hello! This is a test message from Mobile API Config.";

        if (provider === 'gemini') {
            // Gemini API格式
            return {
                contents: [{
                    parts: [{ text: testMessage }]
                }],
                generationConfig: {
                    maxOutputTokens: 50,
                    temperature: 0.7
                }
            };
        } else {
            // OpenAI兼容格式（用于OpenAI和自定义API）
            return {
                model: model,
                messages: [{ role: 'user', content: testMessage }],
                max_tokens: 50,
                temperature: 0.7
            };
        }
    }

    /**
     * 显示状态信息
     */
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('api-config-status');
        if (!statusDiv) return;

        const colors = {
            info: '#17a2b8',
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107'
        };

        statusDiv.style.display = 'block';
        statusDiv.style.color = colors[type] || colors.info;
        statusDiv.textContent = message;

        // 自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 获取当前API配置（供外部调用）
     */
    getCurrentConfig() {
        return { ...this.currentSettings };
    }

    /**
     * 执行API调用（供其他模块使用）
     */
    async callAPI(messages, options = {}) {
        if (!this.currentSettings.enabled) {
            throw new Error('自定义API未启用');
        }

        const provider = this.currentSettings.provider;
        let apiUrl;

        if (provider === 'gemini') {
            // Gemini使用内置的URL
            apiUrl = this.geminiUrl || this.supportedProviders.gemini.defaultUrl;
        } else {
            // 其他服务商使用配置中的URL
            apiUrl = this.currentSettings.apiUrl || this.supportedProviders[provider]?.defaultUrl;
        }

        const apiKey = this.currentSettings.apiKey;
        const model = this.currentSettings.model;

        if (!apiUrl || !model) {
            throw new Error('API配置不完整');
        }

        const providerConfig = this.supportedProviders[provider];
        if (providerConfig?.requiresKey && !apiKey) {
            throw new Error('缺少API密钥');
        }

        // CORS警告检查
        if (provider === 'gemini' && window.location.protocol === 'http:') {
            console.warn('⚠️ [Mobile API Config] CORS警告: 从浏览器直接调用Gemini API可能被CORS策略阻止');
            console.warn('建议通过后端代理或使用HTTPS来避免CORS问题');
        }

        // 构建请求
        let requestUrl = apiUrl.trim();
        if (!requestUrl.endsWith('/')) {
            requestUrl += '/';
        }

        // 根据不同服务商构建URL
        if (provider === 'gemini') {
            // Gemini API使用特殊的URL结构，并通过URL参数传递API key
            requestUrl += providerConfig.urlSuffix.replace('{model}', model);
            if (apiKey) {
                requestUrl += `?key=${apiKey}`;
            }
        } else {
            // OpenAI和自定义API使用标准URL构建
            requestUrl += providerConfig.urlSuffix.replace('{model}', model);
        }

        const headers = { 'Content-Type': 'application/json' };

        // 根据服务商设置正确的认证方式
        if (providerConfig.requiresKey && apiKey && provider !== 'gemini') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const requestBody = this.buildRequestBody(provider, model, messages, options);

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            timeout: this.currentSettings.timeout || 30000
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API调用失败: HTTP ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return this.parseAPIResponse(provider, data);
    }

    /**
     * 构建API请求体 (OpenAI兼容格式)
     */
    buildRequestBody(provider, model, messages, options) {
        const settings = this.currentSettings;

        if (provider === 'gemini') {
            // Gemini API格式
            const contents = [];

            // 转换消息格式
            messages.forEach(msg => {
                if (msg.role === 'system') {
                    // 系统消息作为第一个用户消息的前缀
                    if (contents.length === 0) {
                        contents.push({
                            parts: [{ text: msg.content + '\n\n' }]
                        });
                    }
                } else if (msg.role === 'user') {
                    const existingText = contents.length > 0 ? contents[contents.length - 1].parts[0].text : '';
                    if (contents.length > 0 && !contents[contents.length - 1].role) {
                        // 合并到现有的系统消息中
                        contents[contents.length - 1].parts[0].text = existingText + msg.content;
                    } else {
                        contents.push({
                            parts: [{ text: msg.content }]
                        });
                    }
                } else if (msg.role === 'assistant') {
                    contents.push({
                        role: 'model',
                        parts: [{ text: msg.content }]
                    });
                }
            });

            // 添加系统提示词
            if (settings.systemPrompt && contents.length === 0) {
                contents.push({
                    parts: [{ text: settings.systemPrompt }]
                });
            }

            return {
                contents: contents,
                generationConfig: {
                    maxOutputTokens: options.maxTokens || settings.maxTokens,
                    temperature: options.temperature || settings.temperature,
                    ...options.customParams
                }
            };
        } else {
            // OpenAI兼容格式（用于OpenAI和自定义API）
            const body = {
                model: model,
                messages: messages,
                max_tokens: options.maxTokens || settings.maxTokens,
                temperature: options.temperature || settings.temperature,
                ...options.customParams
            };

            // 添加系统提示词
            if (settings.systemPrompt) {
                body.messages = [
                    { role: 'system', content: settings.systemPrompt },
                    ...body.messages
                ];
            }

            return body;
        }
    }

    /**
     * 解析API响应 (OpenAI兼容格式)
     */
    parseAPIResponse(provider, data) {
        if (provider === 'gemini') {
            // Gemini API响应格式
            return {
                content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
                usage: data.usageMetadata
            };
        } else {
            // OpenAI兼容格式（用于OpenAI和自定义API）
            return {
                content: data.choices?.[0]?.message?.content || '',
                usage: data.usage
            };
        }
    }

    /**
     * 检查API是否可用
     */
    isAPIAvailable() {
        return this.currentSettings.enabled &&
               this.currentSettings.apiUrl &&
               this.currentSettings.model &&
               (
                   !this.supportedProviders[this.currentSettings.provider]?.requiresKey ||
                   this.currentSettings.apiKey
               );
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentSettings: { ...this.currentSettings, apiKey: this.currentSettings.apiKey ? '[HIDDEN]' : '' },
            supportedProviders: Object.keys(this.supportedProviders),
            isAPIAvailable: this.isAPIAvailable(),
            providerConfig: this.supportedProviders[this.currentSettings.provider] || null
        };
    }

    /**
     * 调试函数：检查当前配置状态
     */
    debugConfig() {
        console.group('🔧 [Mobile API Config] 配置调试信息');
        console.log('✅ 初始化状态:', this.isInitialized);
        console.log('📋 当前设置:', {
            provider: this.currentSettings.provider,
            enabled: this.currentSettings.enabled,
            apiUrl: this.currentSettings.apiUrl || '(未设置)',
            hasApiKey: !!this.currentSettings.apiKey,
            model: this.currentSettings.model || '(未设置)',
            temperature: this.currentSettings.temperature,
            maxTokens: this.currentSettings.maxTokens
        });
        console.log('🌐 支持的服务商:', Object.keys(this.supportedProviders));
        console.log('⚙️ 当前Provider配置:', this.supportedProviders[this.currentSettings.provider]);
        console.log('🔗 API可用性:', this.isAPIAvailable());

        // 获取当前UI中的值
        const currentProvider = document.getElementById('api-provider')?.value;
        const currentUrl = document.getElementById('api-url')?.value;
        const currentKey = document.getElementById('api-key')?.value;

        console.log('🔧 UI元素状态:', {
            'api-provider': currentProvider || '(未找到)',
            'api-url': currentUrl || '(未找到)',
            'api-key': document.getElementById('api-key') ? (currentKey ? '已填写' : '未填写') : '(未找到)',
            'api-model': document.getElementById('api-model')?.value || '(未找到)'
        });

        // 测试URL构建
        const provider = currentProvider || this.currentSettings.provider || 'gemini';
        const apiUrl = currentUrl || this.currentSettings.apiUrl || this.supportedProviders[provider]?.defaultUrl;
        if (apiUrl) {
            const modelsUrl = this.buildModelsUrl(provider, apiUrl);
            console.log('🔗 当前Provider:', provider);
            console.log('🔗 基础URL:', apiUrl);
            console.log('🔗 预期的模型URL:', modelsUrl);

            // 检查URL是否正确
            if (provider === 'gemini' && !modelsUrl.includes('v1beta')) {
                console.warn('⚠️ 警告: Gemini URL应该包含v1beta，当前URL可能不正确');
            }
        }

        console.groupEnd();
    }

    /**
     * 构建模型列表URL（用于调试）
     */
    buildModelsUrl(provider, apiUrl) {
        let modelsUrl = apiUrl.trim();
        if (!modelsUrl.endsWith('/')) {
            modelsUrl += '/';
        }

        if (provider === 'gemini') {
            if (!modelsUrl.includes('/v1beta/models')) {
                if (modelsUrl.endsWith('/v1/')) {
                    modelsUrl = modelsUrl.replace('/v1/', '/v1beta/models');
                } else {
                    modelsUrl += 'v1beta/models';
                }
            }
        } else {
            if (modelsUrl.endsWith('/v1/')) {
                modelsUrl += 'models';
            } else if (!modelsUrl.includes('/models')) {
                modelsUrl += 'models';
            }
        }

        return modelsUrl;
    }

    /**
     * 手动测试模型获取（调试用）
     */
    async testModelFetch() {
        console.log('[Mobile API Config] 🧪 开始手动测试模型获取...');

        const provider = document.getElementById('api-provider')?.value || this.currentSettings.provider;
        const apiUrl = document.getElementById('api-url')?.value || this.currentSettings.apiUrl;
        const apiKey = document.getElementById('api-key')?.value || this.currentSettings.apiKey;

        console.log('测试参数:', { provider, apiUrl: apiUrl ? '已设置' : '未设置', apiKey: apiKey ? '已设置' : '未设置' });

        if (!apiUrl || !apiKey) {
            console.error('缺少必要参数');
            return;
        }

        try {
            const models = await this.fetchModels(provider, apiUrl, apiKey);
            console.log('✅ 测试成功，获取到模型:', models);
            return models;
        } catch (error) {
            console.error('❌ 测试失败:', error);
            return null;
        }
    }
}

// 自动初始化
jQuery(document).ready(() => {
    // 等待一小段时间确保其他模块加载完成
    setTimeout(() => {
        if (!window.mobileCustomAPIConfig) {
            const apiConfig = new MobileCustomAPIConfig();
            apiConfig.initialize().then(success => {
                if (success) {
                    console.log('[Mobile API Config] ✅ 自定义API配置模块已就绪');
                } else {
                    console.error('[Mobile API Config] ❌ 自定义API配置模块初始化失败');
                }
            });
            // 将实例设置为全局变量
            window.mobileCustomAPIConfig = apiConfig;
        }
    }, 1000);
});

// 导出类和实例到全局作用域
window.MobileCustomAPIConfig = MobileCustomAPIConfig;

// 全局辅助函数
window.fixGeminiConfig = function() {
    console.log('🔧 正在修复Gemini配置...');

    const config = window.mobileCustomAPIConfig;
    if (!config) {
        console.error('❌ API配置管理器未初始化');
        return;
    }

    // 强制设置正确的Gemini配置
    const providerSelect = document.getElementById('api-provider');

    if (providerSelect) {
        providerSelect.value = 'gemini';
    }

    // 触发provider change事件（这会自动隐藏URL输入框并设置内置URL）
    config.onProviderChange('gemini');

    console.log('✅ 配置已修复，请确保：');
    console.log('1. 已选择💎 Google Gemini服务商');
    console.log('2. URL输入框已隐藏（使用内置URL）');
    console.log('3. API密钥: 以AIza开头的Google AI API密钥');
    console.log('4. 点击📥按钮获取模型列表');

    // 显示调试信息
    config.debugConfig();
};

// 添加控制台提示
console.log(`
🚀 [Mobile API Config] 可用的调试命令:

   查看配置状态: window.mobileCustomAPIConfig.debugConfig()
   手动测试获取: await window.mobileCustomAPIConfig.testModelFetch()
   修复Gemini配置: window.fixGeminiConfig()
`);
