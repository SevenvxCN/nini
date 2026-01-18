// ==SillyTavern Weibo Control App==
// @name         Weibo Control App for Mobile Extension
// @version      1.0.0
// @description  微博控制应用，处理发博弹窗、用户交互等功能
// @author       Assistant

/**
 * 微博控制应用类
 * 负责处理发博弹窗、用户名修改、账户切换等控制功能
 */
class WeiboControlApp {
  constructor() {
    this.isDialogOpen = false;
    this.currentDialog = null;
    this.isProcessing = false;

    this.init();
  }

  init() {
    console.log('[Weibo Control] 微博控制应用初始化');
    this.createDialogContainer();
  }

  /**
   * 创建弹窗容器
   */
  createDialogContainer() {
    // 检查是否已存在容器
    if (document.getElementById('weibo-dialog-container')) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'weibo-dialog-container';
    container.className = 'weibo-dialog-container';
    container.style.display = 'none';

    // 添加到手机容器中
    const phoneContainer = document.querySelector('.mobile-phone-container');
    if (phoneContainer) {
      phoneContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    console.log('[Weibo Control] 弹窗容器已创建');
  }

  /**
   * 显示发博弹窗
   */
  showPostDialog() {
    if (this.isDialogOpen) {
      console.log('[Weibo Control] 弹窗已打开，忽略重复请求');
      return;
    }

    try {
      console.log('[Weibo Control] 显示发博弹窗');

      const currentUsername = this.getCurrentUsername();
      const accountType = this.getCurrentAccountType();

      const dialogHTML = `
        <div class="weibo-dialog-overlay">
          <div class="weibo-dialog">
            <div class="dialog-header">
              <h3>发微博</h3>
              <button class="close-btn" onclick="window.weiboControlApp.closeDialog()">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="dialog-content">
              <div class="user-info">
                <div class="user-avatar">
                  ${this.generateAvatarHTML(currentUsername)}
                </div>
                <div class="user-details">
                  <div class="username">${currentUsername}</div>
                  <div class="account-badge">${accountType}</div>
                </div>
              </div>

              <div class="post-input-section">
                <textarea
                  id="weibo-post-content"
                  placeholder="分享新鲜事..."
                  maxlength="140"
                  rows="4"
                ></textarea>
                <div class="char-count">
                  <span id="char-counter">0</span>/140
                </div>
              </div>

              <div class="post-options">
                <div class="option-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>添加位置</span>
                </div>
                <div class="option-item">
                  <i class="fas fa-hashtag"></i>
                  <span>添加话题</span>
                </div>
                <div class="option-item">
                  <i class="fas fa-at"></i>
                  <span>@好友</span>
                </div>
              </div>
            </div>

            <div class="dialog-footer">
              <button class="cancel-btn" onclick="window.weiboControlApp.closeDialog()">
                取消
              </button>
              <button class="post-btn" onclick="window.weiboControlApp.submitPost()" disabled>
                发布
              </button>
            </div>
          </div>
        </div>
      `;

      this.showDialog(dialogHTML);
      this.bindPostDialogEvents();
    } catch (error) {
      console.error('[Weibo Control] 显示发博弹窗失败:', error);
      this.showErrorToast('显示发博弹窗失败');
    }
  }

  /**
   * 显示弹窗
   */
  showDialog(html) {
    const container = document.getElementById('weibo-dialog-container');
    if (!container) {
      console.error('[Weibo Control] 弹窗容器不存在');
      return;
    }

    container.innerHTML = html;
    container.style.display = 'block';
    this.isDialogOpen = true;

    // 添加动画效果
    setTimeout(() => {
      const dialog = container.querySelector('.weibo-dialog');
      if (dialog) {
        dialog.classList.add('show');
      }
    }, 10);

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭弹窗
   */
  closeDialog() {
    const container = document.getElementById('weibo-dialog-container');
    if (!container) return;

    const dialog = container.querySelector('.weibo-dialog');
    if (dialog) {
      dialog.classList.remove('show');
    }

    setTimeout(() => {
      container.style.display = 'none';
      container.innerHTML = '';
      this.isDialogOpen = false;
      this.currentDialog = null;

      // 恢复背景滚动
      document.body.style.overflow = '';
    }, 200);

    console.log('[Weibo Control] 弹窗已关闭');
  }

  /**
   * 绑定发博弹窗事件
   */
  bindPostDialogEvents() {
    // 绑定文本输入事件
    const textarea = document.getElementById('weibo-post-content');
    const charCounter = document.getElementById('char-counter');
    const postBtn = document.querySelector('.dialog-footer .post-btn');

    if (textarea && charCounter && postBtn) {
      textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        charCounter.textContent = length;

        // 更新按钮状态
        if (length > 0 && length <= 140) {
          postBtn.disabled = false;
          postBtn.classList.add('enabled');
        } else {
          postBtn.disabled = true;
          postBtn.classList.remove('enabled');
        }

        // 字数超限提示
        if (length > 140) {
          charCounter.style.color = '#ff4757';
        } else {
          charCounter.style.color = '#666';
        }
      });

      // 自动聚焦
      textarea.focus();
    }

    // 绑定选项点击事件
    document.querySelectorAll('.post-options .option-item').forEach(item => {
      item.addEventListener('click', () => {
        const icon = item.querySelector('i');
        const text = item.querySelector('span').textContent;

        if (textarea) {
          let insertText = '';

          if (icon.classList.contains('fa-hashtag')) {
            insertText = '#话题# ';
          } else if (icon.classList.contains('fa-at')) {
            insertText = '@用户 ';
          } else if (icon.classList.contains('fa-map-marker-alt')) {
            insertText = '[位置] ';
          }

          if (insertText) {
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);

            textarea.value = textBefore + insertText + textAfter;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + insertText.length;
            textarea.focus();

            // 触发input事件更新字数统计
            textarea.dispatchEvent(new Event('input'));
          }
        }
      });
    });

    // 绑定ESC键关闭
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isDialogOpen) {
        this.closeDialog();
      }
    });

    // 绑定点击遮罩关闭
    const overlay = document.querySelector('.weibo-dialog-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) {
          this.closeDialog();
        }
      });
    }
  }

  /**
   * 提交博文
   */
  async submitPost() {
    if (this.isProcessing) {
      console.log('[Weibo Control] 正在处理中，忽略重复提交');
      return;
    }

    const textarea = document.getElementById('weibo-post-content');
    if (!textarea) {
      console.error('[Weibo Control] 找不到文本输入框');
      return;
    }

    const content = textarea.value.trim();
    if (!content) {
      this.showErrorToast('请输入微博内容');
      return;
    }

    if (content.length > 140) {
      this.showErrorToast('微博内容不能超过140字');
      return;
    }

    try {
      this.isProcessing = true;

      // 更新按钮状态
      const postBtn = document.querySelector('.dialog-footer .post-btn');
      if (postBtn) {
        postBtn.disabled = true;
        postBtn.textContent = '发布中...';
      }

      console.log('[Weibo Control] 提交博文:', content);

      // 调用微博管理器发送博文
      if (window.weiboManager && window.weiboManager.sendPostToAPI) {
        const result = await window.weiboManager.sendPostToAPI(content);

        if (result) {
          this.showSuccessToast('微博发布成功');
          this.closeDialog();

          // 等待一下让内容被处理，然后刷新微博列表
          setTimeout(() => {
            if (window.weiboUI) {
              window.weiboUI.refreshWeiboList();
            }
          }, 1000);
        } else {
          throw new Error('微博发布失败');
        }
      } else {
        throw new Error('微博管理器未就绪');
      }
    } catch (error) {
      console.error('[Weibo Control] 提交博文失败:', error);
      this.showErrorToast(`发布失败: ${error.message}`);

      // 恢复按钮状态
      const postBtn = document.querySelector('.dialog-footer .post-btn');
      if (postBtn) {
        postBtn.disabled = false;
        postBtn.textContent = '发布';
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取当前用户名
   */
  getCurrentUsername() {
    if (window.weiboManager && window.weiboManager.getCurrentUsername) {
      return window.weiboManager.getCurrentUsername();
    }
    return '{{user}}';
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
   * 生成头像HTML
   */
  generateAvatarHTML(username) {
    if (window.weiboUI && window.weiboUI.generateAvatarHTML) {
      return window.weiboUI.generateAvatarHTML(username);
    }

    // 简单的备用头像
    const initial = username[0] || '?';
    return `<div class="author-avatar" style="background: #ff6b6b">${initial}</div>`;
  }

  /**
   * 显示成功提示
   */
  showSuccessToast(message) {
    this.showToast(message, 'success');
  }

  /**
   * 显示错误提示
   */
  showErrorToast(message) {
    this.showToast(message, 'error');
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

    // 否则创建简单的提示
    const toast = document.createElement('div');
    toast.className = `weibo-toast weibo-toast-${type}`;
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

  /**
   * 显示确认对话框
   */
  showConfirmDialog(title, message, onConfirm, onCancel) {
    const dialogHTML = `
      <div class="weibo-dialog-overlay">
        <div class="weibo-dialog confirm-dialog">
          <div class="dialog-header">
            <h3>${title}</h3>
          </div>

          <div class="dialog-content">
            <p>${message}</p>
          </div>

          <div class="dialog-footer">
            <button class="cancel-btn" onclick="window.weiboControlApp.handleConfirmCancel()">
              取消
            </button>
            <button class="confirm-btn" onclick="window.weiboControlApp.handleConfirmOk()">
              确定
            </button>
          </div>
        </div>
      </div>
    `;

    this.confirmCallback = onConfirm;
    this.cancelCallback = onCancel;
    this.showDialog(dialogHTML);
  }

  /**
   * 处理确认对话框的确定按钮
   */
  handleConfirmOk() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeDialog();
  }

  /**
   * 处理确认对话框的取消按钮
   */
  handleConfirmCancel() {
    if (this.cancelCallback) {
      this.cancelCallback();
    }
    this.closeDialog();
  }

  /**
   * 显示输入对话框
   */
  showInputDialog(title, placeholder, defaultValue, onConfirm, onCancel) {
    const dialogHTML = `
      <div class="weibo-dialog-overlay">
        <div class="weibo-dialog input-dialog">
          <div class="dialog-header">
            <h3>${title}</h3>
          </div>

          <div class="dialog-content">
            <input
              type="text"
              id="input-dialog-value"
              placeholder="${placeholder}"
              value="${defaultValue || ''}"
              maxlength="20"
            />
          </div>

          <div class="dialog-footer">
            <button class="cancel-btn" onclick="window.weiboControlApp.handleInputCancel()">
              取消
            </button>
            <button class="confirm-btn" onclick="window.weiboControlApp.handleInputOk()">
              确定
            </button>
          </div>
        </div>
      </div>
    `;

    this.inputConfirmCallback = onConfirm;
    this.inputCancelCallback = onCancel;
    this.showDialog(dialogHTML);

    // 自动聚焦并选中文本
    setTimeout(() => {
      const input = document.getElementById('input-dialog-value');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  /**
   * 处理输入对话框的确定按钮
   */
  handleInputOk() {
    const input = document.getElementById('input-dialog-value');
    const value = input ? input.value.trim() : '';

    if (this.inputConfirmCallback) {
      this.inputConfirmCallback(value);
    }
    this.closeDialog();
  }

  /**
   * 处理输入对话框的取消按钮
   */
  handleInputCancel() {
    if (this.inputCancelCallback) {
      this.inputCancelCallback();
    }
    this.closeDialog();
  }
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.weiboControlApp = new WeiboControlApp();
  console.log('[Weibo Control] ✅ 微博控制应用已创建');
}
