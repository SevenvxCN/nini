import test from 'node:test';
import assert from 'node:assert/strict';

import { SUMMARY_SYSTEM_PROMPT } from '../app-src/prompts/system-prompt.js';
import { createHistoryCompactionController } from '../app-src/runtime/history-compaction.js';

test('history summary prompt preserves structured cross-domain memory', () => {
    assert.match(SUMMARY_SYSTEM_PROMPT, /目标是省上下文，不是失忆/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /# 当前目标/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /# 已确认内容/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /# 关键细节/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /# 未解决问题 \/ 下一步/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /# 用户偏好与约束/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /技术排查/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /写卡\/小说\/剧情/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /闲聊\/长期协作/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /不超过 10000 tokens/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /先判断对话类型/);
    assert.match(SUMMARY_SYSTEM_PROMPT, /不要把具体事实洗成/);
});

test('history compaction source includes full archived tool details', async () => {
    const longToolDetail = [
        '12 export const fragileConfig = true;',
        '13 export function boot() {}',
        'x'.repeat(1200),
        '1401 exactTechnicalMarkerAfterOldTinyLimit();',
    ].join('\n');
    const state = {
        messages: [
            { role: 'user', content: '检查这个配置为什么失效。' },
            {
                role: 'assistant',
                content: '',
                toolCalls: [{
                    name: 'Read',
                    arguments: '{"filePath":"modules/demo.js"}',
                }],
            },
            {
                role: 'tool',
                toolName: 'Read',
                content: '{}',
            },
            { role: 'assistant', content: '结论是 fragileConfig 没有被导出。' },
            { role: 'user', content: '继续。' },
        ],
        archivedTurnCount: 0,
        historySummary: '旧结论：modules/old.js 里有 pending 状态。',
        contextStats: { usedTokens: 999 },
        progressLabel: '',
        uiMessageWindowLimit: 100,
    };
    let summarySource = '';
    let summaryRequest = null;
    const controller = createHistoryCompactionController({
        state,
        render() {},
        persistSession() {},
        showToast() {},
        getActiveProviderConfig() {
            return { temperature: 0.7, maxTokens: 12000 };
        },
        formatToolResultDisplay(message) {
            assert.equal(message.toolName, 'Read');
            return {
                summary: '已读取文件：modules/demo.js',
                details: longToolDetail,
            };
        },
        buildTextWithAttachmentSummary(text) {
            return text;
        },
        trimForSummary(text, limit = 1800) {
            const normalized = String(text || '').replace(/\s+/g, ' ').trim();
            if (normalized.length <= limit) return normalized;
            return `${normalized.slice(0, limit)}…`;
        },
        SUMMARY_SYSTEM_PROMPT,
        DEFAULT_PRESERVED_TURNS: 1,
        MIN_PRESERVED_TURNS: 1,
        SUMMARY_TRIGGER_TOKENS: 1,
        HISTORY_SUMMARY_MAX_TOKENS: 10000,
        buildContextMeterLabel() {
            return '999 tokens';
        },
        async forceUpdateContextStats() {
            state.contextStats.usedTokens = 999;
        },
        toProviderMessages(messages) {
            return messages;
        },
    });

    await controller.ensureContextBudget({
        async chat(request) {
            summaryRequest = request;
            summarySource = request.messages[0].content;
            return { text: '压缩后的摘要' };
        },
    }, new AbortController().signal);

    assert.equal(summaryRequest?.maxTokens, 10000);
    assert.match(summarySource, /已有历史摘要（当前记忆底稿/);
    assert.match(summarySource, /modules\/old\.js/);
    assert.match(summarySource, /工具输出详情:\n12 export const fragileConfig = true/);
    assert.match(summarySource, /exactTechnicalMarkerAfterOldTinyLimit/);
    assert.equal(state.uiMessageWindowLimit, 5);
});
