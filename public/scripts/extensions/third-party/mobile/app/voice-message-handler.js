/**
 * Voice Message Handler - 语音消息交互处理器
 * 实现语音消息的播放动画、文本转换和流式传输效果
 */

// 避免重复定义
if (typeof window.VoiceMessageHandler === 'undefined') {

class VoiceMessageHandler {
    constructor() {
        this.activeVoiceMessage = null;
        this.streamingTimeouts = [];
        this.init();
    }

    init() {
        console.log('[Voice Message] 语音消息处理器初始化完成');
        this.bindEvents();
        this.setupExistingVoiceMessages();
        this.addVoiceWaveformCSS();
    }

    /**
     * 添加语音波形动画CSS
     */
    addVoiceWaveformCSS() {
        const styleId = 'voice-waveform-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .voice-waveform {
                display: flex;
                align-items: center;
                gap: 2px;
                height: 20px;
            }

            .wave-bar {
                width: 3px;
                background: #007bff;
                border-radius: 1.5px;
                animation: wave-pulse 1.5s ease-in-out infinite;
                min-height: 4px;
                max-height: 18px;
            }

            /* 给每个波形条不同的动画延迟和频率 */
            .wave-bar:nth-child(1) {
                animation-delay: 0s;
                animation-duration: 1.2s;
            }

            .wave-bar:nth-child(2) {
                animation-delay: 0.1s;
                animation-duration: 1.4s;
            }

            .wave-bar:nth-child(3) {
                animation-delay: 0.2s;
                animation-duration: 1.1s;
            }

            .wave-bar:nth-child(4) {
                animation-delay: 0.3s;
                animation-duration: 1.6s;
            }

            .wave-bar:nth-child(5) {
                animation-delay: 0.4s;
                animation-duration: 1.3s;
            }

            .wave-bar:nth-child(6) {
                animation-delay: 0.5s;
                animation-duration: 1.5s;
            }

            .wave-bar:nth-child(7) {
                animation-delay: 0.6s;
                animation-duration: 1.7s;
            }

            @keyframes wave-pulse {
                0%, 100% {
                    height: 4px;
                    opacity: 0.6;
                }
                50% {
                    height: 18px;
                    opacity: 1;
                }
            }

            /* 播放状态下的动画更活跃 */
            .playing .wave-bar {
                animation-duration: 0.8s !important;
            }

            .playing .wave-bar:nth-child(1) { animation-delay: 0s; }
            .playing .wave-bar:nth-child(2) { animation-delay: 0.1s; }
            .playing .wave-bar:nth-child(3) { animation-delay: 0.2s; }
            .playing .wave-bar:nth-child(4) { animation-delay: 0.3s; }
            .playing .wave-bar:nth-child(5) { animation-delay: 0.4s; }
            .playing .wave-bar:nth-child(6) { animation-delay: 0.5s; }
            .playing .wave-bar:nth-child(7) { animation-delay: 0.6s; }
        `;
        document.head.appendChild(style);
        console.log('[Voice Message] 语音波形动画CSS已添加');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 使用事件代理处理动态添加的语音消息（支持发送和接收）
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.closest) {
                const voiceContent = target.closest('.message-received[title="语音"] .message-content, .message-sent[title="语音"] .message-content');
                if (voiceContent) {
                    this.handleVoiceMessageClick(voiceContent);
                }
            }
        });

        // 处理语音播放按钮点击
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.closest && target.closest('.voice-play-btn')) {
                event.stopPropagation(); // 阻止冒泡到message-content
                this.handleVoicePlayClick(target.closest('.voice-play-btn'));
            }
        });
    }

    /**
     * 设置现有的语音消息
     */
    setupExistingVoiceMessages() {
        const voiceMessages = document.querySelectorAll('.message-received[title="语音"], .message-sent[title="语音"]');
        voiceMessages.forEach(message => {
            this.setupVoiceMessage(message);
        });
    }

    /**
     * 设置单个语音消息
     */
    setupVoiceMessage(messageElement) {
        const messageContent = messageElement.querySelector('.message-content');
        const messageText = messageElement.querySelector('.message-text');

        if (!messageContent) return;

        // 确保文本初始隐藏
        if (messageText) {
            messageText.classList.remove('visible', 'streaming');
        }

        // 添加语音控制界面（如果不存在）
        this.addVoiceControls(messageContent);
    }

    /**
     * 添加语音控制界面
     */
    addVoiceControls(messageContent) {
        // 检查是否已经存在语音控制界面
        if (messageContent.querySelector('.voice-content')) {
            return;
        }

        const voiceContent = document.createElement('div');
        voiceContent.className = 'voice-content';

        const voiceControl = document.createElement('div');
        voiceControl.className = 'voice-control';

        // 播放按钮
        const playBtn = document.createElement('button');
        playBtn.className = 'voice-play-btn';
        playBtn.innerHTML = '';
        playBtn.title = '播放语音';

        // 时长显示
        const duration = document.createElement('div');
        duration.className = 'voice-duration';
        duration.textContent = this.getReasonableDuration(messageContent);

        // 语音波形
        const waveform = document.createElement('div');
        waveform.className = 'voice-waveform';
        for (let i = 0; i < 7; i++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            waveform.appendChild(bar);
        }

        // 状态指示器
        const status = document.createElement('div');
        status.className = 'voice-status';

        voiceControl.appendChild(playBtn);
        voiceControl.appendChild(duration);
        voiceControl.appendChild(waveform);

        voiceContent.appendChild(voiceControl);
        voiceContent.appendChild(status);

        // 将语音内容插入到message-meta之后
        const messageMeta = messageContent.querySelector('.message-meta');
        if (messageMeta && messageMeta.nextSibling) {
            messageContent.insertBefore(voiceContent, messageMeta.nextSibling);
        } else {
            messageContent.appendChild(voiceContent);
        }
    }

    /**
     * 根据文字内容生成合理的语音时长
     */
    getReasonableDuration(messageContent) {
        // 获取消息文字内容
        const messageText = messageContent.querySelector('.message-text');
        let textContent = '';

        if (messageText) {
            textContent = messageText.textContent || messageText.innerText || '';
        }

        // 如果没有文字内容，使用默认值
        if (!textContent.trim()) {
            textContent = '在的呢';
        }

        // 计算字符数（中文、英文、数字等）
        const charCount = textContent.trim().length;

        // 中文语音语速：大约每秒2.5-3.5个字
        // 基础时长：字符数 / 语速，再加上一些随机变化
        const baseSecondsPerChar = 0.3; // 约每秒3个字
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3的随机因子

        let totalSeconds = Math.ceil(charCount * baseSecondsPerChar * randomFactor);

        // 最短1秒，最长90秒
        totalSeconds = Math.max(1, Math.min(90, totalSeconds));

        // 转换为分:秒格式
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        console.log(`[Voice Message] 文字"${textContent}"(${charCount}字) -> 时长${minutes}:${seconds.toString().padStart(2, '0')}`);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 处理语音消息点击
     */
    handleVoiceMessageClick(messageContent) {
        const messageElement = messageContent.closest('.message-received[title="语音"], .message-sent[title="语音"]');
        const messageText = messageElement.querySelector('.message-text');

        if (!messageText) return;

        // 如果文本已显示，则隐藏
        if (messageText.classList.contains('visible')) {
            this.hideVoiceText(messageText);
        } else {
            // 显示并开始流式传输
            this.showVoiceTextWithStreaming(messageText);
        }
    }

    /**
     * 处理语音播放按钮点击
     */
    handleVoicePlayClick(playBtn) {
        const voiceContent = playBtn.closest('.voice-content');
        const messageContent = playBtn.closest('.message-content');

        if (voiceContent.classList.contains('playing')) {
            this.stopVoicePlay(voiceContent, messageContent);
        } else {
            this.startVoicePlay(voiceContent, messageContent, playBtn);
        }
    }

    /**
     * 开始语音播放
     */
    startVoicePlay(voiceContent, messageContent, playBtn) {
        // 停止其他正在播放的语音
        if (this.activeVoiceMessage && this.activeVoiceMessage !== voiceContent) {
            this.stopVoicePlay(this.activeVoiceMessage.voiceContent, this.activeVoiceMessage.messageContent);
        }

        this.activeVoiceMessage = { voiceContent, messageContent };

        // 添加播放状态
        voiceContent.classList.add('playing');
        messageContent.classList.add('playing');
        playBtn.innerHTML = '';
        playBtn.title = '暂停播放';

        // 模拟播放完成（3-8秒后自动停止）
        const playDuration = 3000 + Math.random() * 5000;
        setTimeout(() => {
            if (voiceContent.classList.contains('playing')) {
                this.stopVoicePlay(voiceContent, messageContent);
            }
        }, playDuration);
    }

    /**
     * 停止语音播放
     */
    stopVoicePlay(voiceContent, messageContent) {
        voiceContent.classList.remove('playing');
        messageContent.classList.remove('playing');

        const playBtn = voiceContent.querySelector('.voice-play-btn');
        if (playBtn) {
            playBtn.innerHTML = '';
            playBtn.title = '播放语音';
        }

        if (this.activeVoiceMessage && this.activeVoiceMessage.voiceContent === voiceContent) {
            this.activeVoiceMessage = null;
        }
    }

    /**
     * 显示语音文本并进行流式传输
     */
    showVoiceTextWithStreaming(messageText) {
        // 清除之前的定时器
        this.clearStreamingTimeouts();

        const originalText = messageText.textContent || messageText.innerText || '在的呢';

        // 显示文本容器
        messageText.style.display = 'block';
        messageText.classList.add('visible', 'streaming');
        messageText.textContent = '';

        console.log('[Voice Message] 开始流式传输:', originalText);

        // 流式传输效果
        let currentIndex = 0;
        const streamText = () => {
            if (currentIndex < originalText.length) {
                messageText.textContent = originalText.substring(0, currentIndex + 1);
                currentIndex++;

                // 随机延迟，模拟真实的语音识别速度
                const delay = 50 + Math.random() * 100;
                const timeout = setTimeout(streamText, delay);
                this.streamingTimeouts.push(timeout);
            } else {
                // 流式传输完成
                messageText.classList.remove('streaming');
                console.log('[Voice Message] 流式传输完成');
            }
        };

        // 开始流式传输
        const timeout = setTimeout(streamText, 300);
        this.streamingTimeouts.push(timeout);
    }

    /**
     * 隐藏语音文字
     */
    hideVoiceText(messageText) {
        this.clearStreamingTimeouts();

        messageText.classList.remove('visible', 'streaming');

        // 动画结束后隐藏
        setTimeout(() => {
            if (!messageText.classList.contains('visible')) {
                messageText.style.display = 'none';
            }
        }, 300);

        console.log('[Voice Message] 隐藏语音文字');
    }

    /**
     * 清除流式传输定时器
     */
    clearStreamingTimeouts() {
        this.streamingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.streamingTimeouts = [];
    }

    /**
     * 处理新增的语音消息
     */
    handleNewVoiceMessage(messageElement) {
        if (messageElement.matches('.message-received[title="语音"], .message-sent[title="语音"]')) {
            this.setupVoiceMessage(messageElement);
            console.log('[Voice Message] 设置新的语音消息');
        }
    }

    /**
     * 获取当前播放状态
     */
    getPlayingStatus() {
        return {
            isPlaying: !!this.activeVoiceMessage,
            currentMessage: this.activeVoiceMessage
        };
    }

    /**
     * 停止所有播放
     */
    stopAllPlaying() {
        if (this.activeVoiceMessage) {
            this.stopVoicePlay(this.activeVoiceMessage.voiceContent, this.activeVoiceMessage.messageContent);
        }
        this.clearStreamingTimeouts();
    }

    /**
     * 调试方法
     */
    debug() {
        console.log('[Voice Message] 调试信息:', {
            activeVoiceMessage: !!this.activeVoiceMessage,
            streamingTimeouts: this.streamingTimeouts.length,
            voiceMessages: document.querySelectorAll('.message-received[title="语音"], .message-sent[title="语音"]').length
        });
    }
}

// 创建全局实例
window.VoiceMessageHandler = VoiceMessageHandler;

// 如果页面已加载，立即创建实例
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.voiceMessageHandler = new VoiceMessageHandler();
        console.log('[Voice Message] 全局实例已创建');
    });
} else {
    window.voiceMessageHandler = new VoiceMessageHandler();
    console.log('[Voice Message] 全局实例已创建');
}

// 监听新消息添加
if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node;
                    // 检查新添加的节点是否是语音消息
                    if (element.matches && element.matches('.message-received[title="语音"], .message-sent[title="语音"]')) {
                        window.voiceMessageHandler?.handleNewVoiceMessage(element);
                    }

                    // 检查子节点中是否有语音消息
                    const voiceMessages = element.querySelectorAll && element.querySelectorAll('.message-received[title="语音"], .message-sent[title="语音"]');
                    if (voiceMessages && voiceMessages.length > 0) {
                        voiceMessages.forEach(msg => {
                            window.voiceMessageHandler?.handleNewVoiceMessage(msg);
                        });
                    }
                }
            });
        });
    });

    // 观察消息容器的变化
    const messagesContainer = document.querySelector('.messages-container') || document.body;
    observer.observe(messagesContainer, {
        childList: true,
        subtree: true
    });

    console.log('[Voice Message] MutationObserver 已启动');
}

} // 结束 if (typeof window.VoiceMessageHandler === 'undefined') 检查
