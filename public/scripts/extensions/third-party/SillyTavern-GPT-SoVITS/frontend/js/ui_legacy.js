console.log("🔵 [UI] TTS_UI.js 开始加载...");
window.TTS_UI = window.TTS_UI || {};

(function(scope) {
    let CTX = {
        CACHE: null,
        API_URL: "",
        Utils: null,
        Callbacks: {}
    };

    scope.init = function(context) {
        CTX = context;
        if ($('#tts-manager-btn').length === 0) {
            console.log("✅ [UI] UI模块挂载/重置");
            scope.initFloatingButton();
        }
    };

    scope.initFloatingButton = function() {
        if ($('#tts-manager-btn').length > 0) return;
        $('body').append(`<div id="tts-manager-btn">🔊 TTS配置</div>`);
        if (CTX.Utils && CTX.Utils.makeDraggable) {
            CTX.Utils.makeDraggable($('#tts-manager-btn'), scope.showDashboard);
        } else {
            $('#tts-manager-btn').click(scope.showDashboard);
        }
    };

    scope.showDashboard = function() {
        // 1. 清理旧面板
        $('#tts-dashboard-overlay').remove();

        // 2. 获取当前配置数据
        const settings = CTX.CACHE.settings || {};
        const currentBase = settings.base_dir || "";
        const currentCache = settings.cache_dir || "";
        const currentLang = settings.default_lang || "default";
        const isEnabled = settings.enabled !== false;

        const savedConfig = localStorage.getItem('tts_plugin_remote_config');
        const config = savedConfig ? JSON.parse(savedConfig) : { useRemote: false, ip: "" };
        const isRemote = config.useRemote;
        const remoteIP = config.ip;

        // 3. 构建 HTML 结构
        // 注意：这里删除了 <style> 标签，完全依赖你的外部 CSS 文件
        const html = `
    <div id="tts-dashboard-overlay" class="tts-overlay">

        <div id="tts-dashboard" class="tts-panel">
            <div class="tts-header">
                <h3 style="margin:0; font-size:16px; font-weight:bold;">🎧 语音配置中心</h3>
                <button class="tts-close" onclick="$('#tts-dashboard-overlay').remove()"
                        style="background:transparent; border:none; color:inherit; font-size:24px; padding:0 10px;">×</button>
            </div>

            <div class="tts-content">
                <div class="tts-card">
                    <div class="tts-card-title">🔌 系统状态</div>
                    <label class="tts-switch-row">
                        <span class="tts-switch-label">启用 TTS 插件</span>
                        <input type="checkbox" id="tts-master-switch" class="tts-toggle" ${isEnabled ? 'checked' : ''}>
                    </label>
                    <label class="tts-switch-row">
                        <span class="tts-switch-label">收到消息自动朗读</span>
                        <input type="checkbox" id="tts-toggle-auto" class="tts-toggle" ${settings.auto_generate ? 'checked' : ''}>
                    </label>
                </div>

                <div class="tts-card">
                    <div class="tts-card-title">📡 连接模式</div>
                    <label class="tts-switch-row">
                        <span class="tts-switch-label">远程模式 (局域网部署用)</span>
                        <input type="checkbox" id="tts-remote-switch" class="tts-toggle" ${isRemote ? 'checked' : ''}>
                    </label>
                    <div id="tts-remote-input-area" style="display:${isRemote ? 'block' : 'none'}; margin-top:10px; padding-top:10px; border-top:1px dashed #444;">
                        <div class="tts-input-label">电脑端 IP</div>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="tts-remote-ip" class="tts-modern-input" value="${remoteIP}" placeholder="192.168.x.x">
                            <button id="tts-save-remote" class="btn-primary">保存</button>
                        </div>
                    </div>
                </div>

                <div class="tts-card">
                    <div class="tts-card-title">🎨 视觉体验</div>
                    <label class="tts-switch-row">
                        <span class="tts-switch-label">美化卡专用模式</span>
                        <input type="checkbox" id="tts-iframe-switch" class="tts-toggle" ${settings.iframe_mode ? 'checked' : ''}>
                    </label>

                    <div class="tts-input-row">
                        <span class="tts-input-label">气泡风格</span>
                        <div class="tts-custom-select" id="style-dropdown" style="margin-top:5px;">
                            <div class="select-trigger" data-value="default">
                                <span>🌿 森野·极简</span>
                                <i class="arrow-icon">▼</i>
                            </div>
                            <div class="select-options">
                                <div class="option-item" data-value="default">🌿 森野·极简</div>
                                <div class="option-item" data-value="cyberpunk">⚡ 赛博·霓虹</div>
                                <div class="option-item" data-value="ink">✒️ 水墨·烟雨</div>
                                <div class="option-item" data-value="kawaii">💎 幻彩·琉璃</div>
                                <div class="option-item" data-value="bloom">🌸 花信·初绽</div>
                                <div class="option-item" data-value="rouge">💋 魅影·微醺</div>
                                <div class="option-item" data-value="holo">🛸 星舰·光环</div>
                                <div class="option-item" data-value="scroll">📜 羊皮·史诗</div>
                                <div class="option-item" data-value="steampunk">⚙️ 蒸汽·机械</div>
                                <div class="option-item" data-value="classic">📼 旧日·回溯</div>
                            </div>
                        </div>
                        <input type="hidden" id="style-selector" value="default">
                    </div>
                </div>

                <div class="tts-card">
                    <div class="tts-card-title">📂 路径与语言配置</div>

                    <div class="tts-input-row">
                        <span class="tts-input-label">🗣️ 参考音频语言 (文件夹)</span>
                        <select id="tts-lang-select" class="tts-modern-input">
                            <option value="default" ${currentLang === 'default' ? 'selected' : ''}>Default (根目录)</option>
                            <option value="Chinese" ${currentLang === 'Chinese' ? 'selected' : ''}>Chinese (中文)</option>
                            <option value="Japanese" ${currentLang === 'Japanese' ? 'selected' : ''}>Japanese (日语)</option>
                            <option value="English" ${currentLang === 'English' ? 'selected' : ''}>English (英语)</option>
                        </select>
                        <div style="font-size:11px; color:#888; margin-top:4px;">对应 reference_audios 下的子文件夹名</div>
                    </div>
                    <div class="tts-input-row" style="margin-top:10px;">
                        <span class="tts-input-label">模型路径</span>
                        <input type="text" id="tts-base-path" class="tts-modern-input" value="${currentBase}" placeholder="绝对路径">
                    </div>

                    <div class="tts-input-row">
                        <span class="tts-input-label">输出路径</span>
                        <input type="text" id="tts-cache-path" class="tts-modern-input" value="${currentCache}" placeholder="绝对路径">
                    </div>

                    <div style="text-align:right; margin-top:12px;">
                        <button id="tts-btn-save-paths" class="btn-primary">保存配置</button>
                    </div>
                </div>

                <div class="tts-card">
                    <div class="tts-card-title">🔗 角色绑定</div>
                     <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="tts-new-char" class="tts-modern-input" style="flex: 1; min-width: 0;" placeholder="角色名">

                        <select id="tts-new-model" class="tts-modern-input" style="flex: 2; min-width: 0;">
                            <option>...</option>
                        </select>
                    </div>

                    <button id="tts-btn-bind-new" class="btn-primary" style="width:100%">➕ 绑定</button>
                    <div class="tts-list-zone" style="margin-top:15px;">
                        <div id="tts-mapping-list" class="tts-list-container" style="border:none; background:transparent;"></div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `;

        $('body').append(html);
        scope.renderDashboardList();
        scope.renderModelOptions();

        // 重新绑定事件
        scope.bindEvents();
    };

    scope.bindEvents = function() {
        // Iframe 模式切换
        $('#tts-iframe-switch').change(async function() {
            const isChecked = $(this).is(':checked');
            const $label = $(this).parent();
            const originalText = $label.text();
            $label.text("正在保存设置...");

            try {
                // 调用 API
                await window.TTS_API.updateSettings({ iframe_mode: isChecked });

                CTX.CACHE.settings.iframe_mode = isChecked;
                localStorage.setItem('tts_plugin_iframe_mode', isChecked);

                alert(`已${isChecked ? '开启' : '关闭'}美化卡模式。\n页面即将刷新...`);
                location.reload();

            } catch(e) {
                console.error("保存失败", e);
                alert("保存失败");
                $label.text(originalText);
                $(this).prop('checked', !isChecked);
            }
        });

        // ===========================================
        // ✅ 【新增】自定义下拉菜单初始化 (回显修正)
        // ===========================================
        const currentStyle = (CTX.CACHE.settings && CTX.CACHE.settings.bubble_style)
        || document.body.getAttribute('data-bubble-style')
        || 'default';

        // 1. 根据当前的 style 值 (如 'kawaii')，去选项列表里找对应的元素
        const $targetOption = $(`.option-item[data-value="${currentStyle}"]`);

        // 2. 如果找到了，就把它的文字 (如 '💎 幻彩·琉璃') 填进显示框里
        if ($targetOption.length > 0) {
            $('#style-dropdown .select-trigger span').text($targetOption.text()); // 更新文字
            $('#style-dropdown .select-trigger').attr('data-value', currentStyle); // 更新颜色
            $('#style-selector').val(currentStyle); // 更新隐藏域
        }
        // 远程连接开关
        $('#tts-remote-switch').change(function() {
            const checked = $(this).is(':checked');
            if(checked) $('#tts-remote-input-area').slideDown();
            else {
                $('#tts-remote-input-area').slideUp();
                const ip = $('#tts-remote-ip').val().trim();
                localStorage.setItem('tts_plugin_remote_config', JSON.stringify({ useRemote: false, ip: ip }));
                location.reload();
            }
        });

        $('#tts-save-remote').click(function() {
            const ip = $('#tts-remote-ip').val().trim();
            if(!ip) { alert("请输入 IP 地址"); return; }
            localStorage.setItem('tts_plugin_remote_config', JSON.stringify({ useRemote: true, ip: ip }));
            alert("设置已保存，即将刷新。");
            location.reload();
        });

        $('#tts-master-switch').change(function() { CTX.Callbacks.toggleMasterSwitch($(this).is(':checked')); });
        $('#tts-toggle-auto').change(function() { CTX.Callbacks.toggleAutoGenerate($(this).is(':checked')); });

        $('#tts-lang-select').val(CTX.CACHE.settings.default_lang || 'default');
        $('#tts-lang-select').change(async function() {
            const lang = $(this).val();
            CTX.CACHE.settings.default_lang = lang;
            await window.TTS_API.updateSettings({ default_lang: lang });
        });

        $('#tts-btn-save-paths').click(async function() {
            const btn = $(this);
            const oldText = btn.text();
            btn.text('保存中...').prop('disabled', true);
            const base = $('#tts-base-path').val().trim();
            const cache = $('#tts-cache-path').val().trim();

            const success = await CTX.Callbacks.saveSettings(base, cache);
            if(success) {
                alert('设置已保存！');
                CTX.Callbacks.refreshData().then(() => scope.renderModelOptions());
            } else {
                alert('保存失败，请检查控制台。');
            }
            btn.text(oldText).prop('disabled', false);
        });

        // ===========================================
        // 【优化】以下 3 个操作改为调用 window.TTS_API
        // ===========================================

        // 1. 绑定新角色
        $('#tts-btn-bind-new').click(async function() {
            const charName = $('#tts-new-char').val().trim();
            const modelName = $('#tts-new-model').val();
            if(!charName || !modelName) { alert('请填写角色名并选择模型'); return; }

            try {
                await window.TTS_API.bindCharacter(charName, modelName);
                await CTX.Callbacks.refreshData();
                scope.renderDashboardList();
                $('#tts-new-char').val('');
            } catch(e) {
                console.error(e);
                alert("绑定失败，请检查后端日志");
            }
        });

        // 2. 创建新文件夹
        $('#tts-btn-create-folder').click(async function() {
            const fName = $('#tts-create-folder-name').val().trim();
            if(!fName) return;

            try {
                await window.TTS_API.createModelFolder(fName);
                alert('创建成功！');
                CTX.Callbacks.refreshData().then(scope.renderModelOptions);
                $('#tts-create-folder-name').val('');
            } catch(e) {
                console.error(e);
                alert('创建失败，可能文件夹已存在。');
            }
        });
    };
    // ===========================================
    // ✅ 【恢复】下拉菜单交互逻辑
    // ===========================================
    // 1. 点击展开/收起
    $('#style-dropdown .select-trigger').off('click').on('click', function(e) {
        e.stopPropagation(); // 防止冒泡
        $(this).parent().toggleClass('open');
    });

    // 2. 点击选项
    $('.option-item').off('click').on('click', async function(e) {
        e.stopPropagation();
        const val = $(this).attr('data-value');
        const txt = $(this).text();
        const $container = $(this).closest('.tts-custom-select');

        // 更新 UI 显示
        $container.find('.select-trigger span').text(txt);
        $container.find('.select-trigger').attr('data-value', val);
        $('#style-selector').val(val);

        // 关闭菜单
        $container.removeClass('open');

        // 保存设置
        try {
            // 如果你有 API 更新设置的方法：
            if(window.TTS_API && window.TTS_API.updateSettings) {
                await window.TTS_API.updateSettings({ bubble_style: val });
            }
            // 更新本地缓存
            if(CTX.CACHE && CTX.CACHE.settings) {
                CTX.CACHE.settings.bubble_style = val;
            }
            console.log("样式已切换为:", val);
        } catch(err) {
            console.error("样式保存失败", err);
        }
    });

    // 3. 点击外部关闭菜单
    $(document).off('click.closeDropdown').on('click.closeDropdown', function() {
        $('.tts-custom-select').removeClass('open');
    });

    scope.renderModelOptions = function() {
        const $select = $('#tts-new-model');
        const currentVal = $select.val();
        $select.empty().append('<option disabled value="">选择模型...</option>');
        const models = CTX.CACHE.models || {};
        if (Object.keys(models).length === 0) { $select.append('<option disabled>暂无模型文件夹</option>'); return; }
        Object.keys(models).forEach(k => { $select.append(`<option value="${k}">${k}</option>`); });
        if(currentVal) $select.val(currentVal);
        else $select.find('option:first').next().prop('selected', true);
    };

    scope.renderDashboardList = function() {
        const c = $('#tts-mapping-list').empty();
        const mappings = CTX.CACHE.mappings || {};
        if (Object.keys(mappings).length === 0) { c.append('<div class="tts-empty">暂无绑定记录</div>'); return; }
        Object.keys(mappings).forEach(k => {
            c.append(`
                <div class="tts-list-item">
                    <span class="col-name">${k}</span>
                    <span class="col-model">➡ ${mappings[k]}</span>
                    <div class="col-action"><button class="btn-red" onclick="window.TTS_UI.handleUnbind('${k}')">解绑</button></div>
                </div>
            `);
        });
    };

    // 3. 解绑操作 (优化后)
    scope.handleUnbind = async function(c) {
        if(!confirm(`确定要解绑角色 "${c}" 吗？`)) return;

        try {
            await window.TTS_API.unbindCharacter(c);
            await CTX.Callbacks.refreshData();
            scope.renderDashboardList();
            // 重置状态
            $(`.voice-bubble[data-voice-name="${c}"]`).attr('data-status', 'waiting').removeClass('error playing ready');
        } catch(e) {
            console.error(e);
            alert("解绑失败");
        }
    };

})(window.TTS_UI);
