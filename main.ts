import {
  App,
  ItemView,
  MarkdownRenderer,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  requestUrl,
} from "obsidian";

const VIEW_TYPE = "lumen-ai-assistant";

interface AIAssistantSettings {
  apiKey: string;
  apiProvider: "anthropic" | "openai" | "minimax" | "kimi";
  model: string;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AIAssistantSettings = {
  apiKey: "",
  apiProvider: "anthropic",
  model: "claude-opus-4-7",
  systemPrompt:
    "你是一个 Obsidian 笔记 AI 助手。用户会给你当前笔记的内容，请基于笔记内容回答问题或执行操作。回答使用与用户相同的语言，简洁清晰。",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

interface OpenAIShape {
  choices: Array<{ message: { content: string } }>;
}
interface AnthropicShape {
  content: Array<{ text: string }>;
}
interface ErrorShape {
  error?: { message?: string };
  base_resp?: { status_msg?: string };
}

async function callAI(
  settings: AIAssistantSettings,
  messages: Message[],
  noteContext: string
): Promise<string> {
  const systemWithContext = noteContext
    ? `${settings.systemPrompt}\n\n当前笔记内容：\n\`\`\`\n${noteContext}\n\`\`\``
    : settings.systemPrompt;

  if (settings.apiProvider === "anthropic") {
    const res = await requestUrl({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      contentType: "application/json",
      headers: {
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 2048,
        system: systemWithContext,
        messages,
      }),
      throw: false,
    });
    if (res.status < 200 || res.status >= 300) {
      const err = res.json as ErrorShape;
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = res.json as AnthropicShape;
    return data.content[0].text;
  }

  // OpenAI-compatible chat completions endpoint (used by OpenAI, MiniMax, Kimi)
  const endpoints: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    minimax: "https://api.minimax.chat/v1/text/chatcompletion_v2",
    kimi: "https://api.moonshot.cn/v1/chat/completions",
  };

  const res = await requestUrl({
    url: endpoints[settings.apiProvider],
    method: "POST",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${settings.apiKey}` },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: "system", content: systemWithContext }, ...messages],
    }),
    throw: false,
  });

  if (res.status < 200 || res.status >= 300) {
    const err = res.json as ErrorShape;
    throw new Error(
      err?.error?.message || err?.base_resp?.status_msg || `HTTP ${res.status}`
    );
  }
  const data = res.json as OpenAIShape;
  return data.choices[0].message.content;
}

// ── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: "≡", label: "总结此页面", sublabel: "Summarize", prompt: "请帮我总结这篇笔记的核心内容，用3-5个要点概括。" },
  { icon: "Aα", label: "翻译此页面", sublabel: "Translate", prompt: "请将这篇笔记翻译成英文，保持原有的格式和结构。" },
  { icon: "🔍", label: "深度剖析", sublabel: "Deep Analysis", prompt: "请对这篇笔记进行深度剖析：挖掘隐藏的关联、识别思维模式、提出改进建议。" },
  { icon: "☑", label: "提取待办事项", sublabel: "Extract Tasks", prompt: "请从这篇笔记中提取所有待办事项，并按优先级分类整理。" },
  { icon: "✍️", label: "续写内容", sublabel: "Continue Writing", prompt: "请基于这篇笔记的风格和内容，帮我续写更多相关内容。" },
  { icon: "✨", label: "改写润色", sublabel: "Polish", prompt: "请帮我改写和润色这篇笔记，使其更加清晰流畅、专业。" },
];

// ── Confirm Modal ────────────────────────────────────────────────────────────

class ConfirmModal extends Modal {
  private message: string;
  private confirmText: string;
  private onConfirm: () => void;

  constructor(app: App, title: string, message: string, confirmText: string, onConfirm: () => void) {
    super(app);
    this.titleEl.setText(title);
    this.message = message;
    this.confirmText = confirmText;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createDiv({ cls: "lumen-modal-msg", text: this.message });

    const btnRow = contentEl.createDiv({ cls: "lumen-modal-btns" });
    const cancel = btnRow.createEl("button", { text: "取消" });
    cancel.addEventListener("click", () => this.close());

    const confirmBtn = btnRow.createEl("button", {
      text: this.confirmText,
      cls: "mod-warning",
    });
    confirmBtn.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── ItemView ─────────────────────────────────────────────────────────────────

class AIAssistantView extends ItemView {
  private plugin: AIAssistantPlugin;
  private messages: Message[] = [];
  private mode: "home" | "chat" = "home";
  private noteContext = "";
  private noteTitle = "";
  private selectedText = "";

  // DOM refs
  private bodyEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private contextLabelEl!: HTMLElement;
  private headerActionsEl!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: AIAssistantPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Lumen"; }
  getIcon() { return "sparkles"; }

  async onOpen() {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("ai-assistant-root");

    this.buildHeader(root);
    this.bodyEl = root.createDiv({ cls: "ai-body" });
    this.buildInputArea(root);

    // Listen for active file changes and selection changes
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refreshContext())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refreshContext())
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", () => this.refreshSelection())
    );
    // Poll selection changes (Obsidian has no native selection-change event)
    const selInterval = window.setInterval(() => this.refreshSelection(), 500);
    this.register(() => window.clearInterval(selInterval));

    await this.refreshContext();
    this.renderHome();
  }

  async onClose() {}

  private async refreshContext() {
    const file = this.app.workspace.getActiveFile();
    if (file instanceof TFile && file.extension === "md") {
      this.noteTitle = file.basename;
      this.noteContext = await this.app.vault.read(file);
    } else {
      this.noteTitle = "";
      this.noteContext = "";
    }
    this.refreshSelection();
  }

  private refreshSelection() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    // If focus is inside our own panel (e.g. the user clicked the input box),
    // keep the last known selection — clicking elsewhere clears the editor's
    // selection, which would wipe our context label otherwise.
    if (this.containerEl.contains(activeDocument.activeElement)) return;

    const sel = view.editor.getSelection().trim();
    if (sel === this.selectedText) return;
    this.selectedText = sel;
    this.updateContextLabel();
  }

  // Snapshot selection on mousedown, before focus transfers to the panel.
  private snapshotSelection() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    const sel = view.editor.getSelection().trim();
    if (sel && sel !== this.selectedText) {
      this.selectedText = sel;
      this.updateContextLabel();
    }
  }

  private updateContextLabel() {
    if (!this.contextLabelEl) return;
    if (this.selectedText) {
      const chars = this.selectedText.length;
      this.contextLabelEl.setText(`✏️ 选中 ${chars} 字`);
    } else if (this.noteTitle) {
      this.contextLabelEl.setText(`📄 ${this.noteTitle}`);
    } else {
      this.contextLabelEl.setText("无笔记上下文");
    }
  }

  // ── Header ────────────────────────────────────────────────────────────────

  private buildHeader(root: HTMLElement) {
    const header = root.createDiv({ cls: "ai-header" });

    const left = header.createDiv({ cls: "ai-header-left" });
    const avatar = left.createDiv({ cls: "ai-avatar" });
    avatar.createSpan({ text: "✦" });

    const info = left.createDiv();
    info.createDiv({ cls: "ai-header-title", text: "Lumen" });
    info.createDiv({ cls: "ai-header-sub", text: "AI for your vault" });

    this.headerActionsEl = header.createDiv({ cls: "ai-header-actions" });
    this.buildHeaderActions();
  }

  private buildHeaderActions() {
    this.headerActionsEl.empty();

    if (this.mode === "chat") {
      const backBtn = this.headerActionsEl.createEl("button", {
        cls: "ai-icon-btn",
        attr: { title: "返回主页", "aria-label": "返回主页" },
      });
      backBtn.createSpan({ text: "↩" });
      backBtn.addEventListener("click", () => this.goHome());
    }

    const newBtn = this.headerActionsEl.createEl("button", {
      cls: "ai-icon-btn",
      attr: { title: "新对话", "aria-label": "新对话" },
    });
    newBtn.createSpan({ text: "＋" });
    newBtn.addEventListener("click", () => this.goHome());
  }

  // ── Input area ────────────────────────────────────────────────────────────

  private buildInputArea(root: HTMLElement) {
    const area = root.createDiv({ cls: "ai-input-area" });

    // Context tag
    const ctxRow = area.createDiv({ cls: "ai-ctx-row" });
    const ctxTag = ctxRow.createDiv({ cls: "ai-ctx-tag" });
    this.contextLabelEl = ctxTag.createSpan({ text: "无笔记上下文" });
    this.updateContextLabel();

    // Input box
    const inputBox = area.createDiv({ cls: "ai-input-box" });
    this.inputEl = inputBox.createEl("textarea", {
      cls: "ai-textarea",
      attr: { placeholder: "使用 AI 处理各种任务...", rows: "1" },
    });
    // Snapshot selection before focus leaves the editor
    this.inputEl.addEventListener("mousedown", () => this.snapshotSelection());
    this.inputEl.addEventListener("input", () => this.updateSendBtn());
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this.sendMessage(this.inputEl.value);
      }
    });

    this.sendBtn = inputBox.createEl("button", { cls: "ai-send-btn" });
    this.sendBtn.createSpan({ text: "➤" });
    this.sendBtn.addEventListener("click", () => {
      void this.sendMessage(this.inputEl.value);
    });
    this.updateSendBtn();

    // Bottom hints
    const hints = area.createDiv({ cls: "ai-hints" });
    hints.createSpan({ cls: "ai-hint-action", text: "+ 添加上下文" });
    hints.createDiv(); // spacer
    hints.createSpan({ cls: "ai-hint-shortcut", text: "⏎ 发送 · ⇧⏎ 换行" });
  }

  private updateSendBtn() {
    const hasText = this.inputEl.value.trim().length > 0;
    this.sendBtn.toggleClass("active", hasText);
  }

  // ── Home view ─────────────────────────────────────────────────────────────

  private renderHome() {
    this.mode = "home";
    this.buildHeaderActions();
    this.bodyEl.empty();

    // Greeting
    const greet = this.bodyEl.createDiv({ cls: "ai-greeting" });
    greet.createDiv({ cls: "ai-greeting-icon", text: "🪨" });
    greet.createDiv({ cls: "ai-greeting-title", text: "嗨！我们做点什么？" });
    greet.createDiv({
      cls: "ai-greeting-sub",
      text: this.noteTitle
        ? `针对「${this.noteTitle}」的 AI 操作`
        : "输入问题或选择快捷操作",
    });

    // Quick actions
    const actions = this.bodyEl.createDiv({ cls: "ai-quick-actions" });
    for (const a of QUICK_ACTIONS) {
      const btn = actions.createEl("button", { cls: "ai-quick-btn" });
      btn.createSpan({ cls: "ai-quick-icon", text: a.icon });
      const text = btn.createDiv({ cls: "ai-quick-text" });
      text.createDiv({ cls: "ai-quick-label", text: a.label });
      text.createDiv({ cls: "ai-quick-sub", text: a.sublabel });
      btn.addEventListener("click", () => { void this.sendMessage(a.prompt); });
    }

    // Suggestion (only when there's a note)
    if (this.noteTitle) {
      this.bodyEl.createDiv({ cls: "ai-divider" });
      const sug = this.bodyEl.createDiv({ cls: "ai-suggestion" });
      sug.createDiv({
        cls: "ai-suggestion-label",
        text: "💡 基于笔记内容的建议",
      });
      const card = sug.createDiv({ cls: "ai-suggestion-card" });
      card.createDiv({
        text: "发现笔记中有待完成的任务，要不要让我帮你提取并整理待办清单？",
      });
      const sugBtn = card.createEl("button", {
        cls: "ai-suggestion-btn",
        text: "提取待办 →",
      });
      sugBtn.addEventListener("click", () => {
        void this.sendMessage(QUICK_ACTIONS[3].prompt);
      });
    }
  }

  // ── Chat view ─────────────────────────────────────────────────────────────

  private renderChat() {
    this.mode = "chat";
    this.buildHeaderActions();
    this.bodyEl.empty();

    for (const msg of this.messages) {
      this.renderBubble(msg);
    }
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
  }

  private renderBubble(msg: Message, isNew = false) {
    const wrap = this.bodyEl.createDiv({ cls: "ai-bubble-wrap" });

    if (msg.role === "assistant") {
      const meta = wrap.createDiv({ cls: "ai-bubble-meta" });
      meta.createSpan({ cls: "ai-bubble-avatar", text: "✦" });
      meta.createSpan({ cls: "ai-bubble-name", text: "AI 助手" });
    }

    const bubble = wrap.createDiv({
      cls: `ai-bubble ai-bubble-${msg.role}`,
    });

    if (msg.content === "__thinking__") {
      const dots = bubble.createDiv({ cls: "ai-thinking" });
      dots.createSpan({ cls: "ai-dot" });
      dots.createSpan({ cls: "ai-dot" });
      dots.createSpan({ cls: "ai-dot" });
    } else if (msg.role === "assistant") {
      // Render the AI reply as real markdown via Obsidian's renderer.
      const md = bubble.createDiv({ cls: "lumen-md" });
      void MarkdownRenderer.render(this.app, msg.content, md, "", this);
    } else {
      // User message: plain text, preserve line breaks
      bubble.setText(msg.content);
    }

    if (msg.role === "assistant" && msg.content !== "__thinking__") {
      const actions = wrap.createDiv({ cls: "ai-bubble-actions" });

      if (this.selectedText) {
        const replaceBtn = actions.createEl("button", {
          cls: "ai-action-btn ai-action-btn--primary",
          text: "替换选中",
          attr: { title: "用 AI 回复替换笔记中当前选中的文字" },
        });
        replaceBtn.addEventListener("click", () => this.replaceSelection(msg.content));
      }

      const insertBtn = actions.createEl("button", {
        cls: "ai-action-btn",
        text: "插入末尾",
      });
      insertBtn.addEventListener("click", () => { void this.appendToNote(msg.content); });

      const overwriteBtn = actions.createEl("button", {
        cls: "ai-action-btn ai-action-btn--danger",
        text: "覆写全文",
        attr: { title: "用 AI 回复替换整篇笔记内容（不可撤销）" },
      });
      overwriteBtn.addEventListener("click", () => { void this.overwriteNote(msg.content); });

      const copyBtn = actions.createEl("button", { cls: "ai-action-btn", text: "复制" });
      copyBtn.addEventListener("click", () => {
        void (async () => {
          await navigator.clipboard.writeText(msg.content);
          copyBtn.setText("已复制");
          window.setTimeout(() => copyBtn.setText("复制"), 1500);
        })();
      });

      actions.createEl("button", {
        cls: "ai-action-btn",
        text: "重试",
      }).addEventListener("click", () => {
        const lastUser = [...this.messages].reverse().find((m) => m.role === "user");
        if (lastUser) void this.sendMessage(lastUser.content, true);
      });
    }

    if (isNew) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    }

    return { bubble, wrap };
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  private async sendMessage(text: string, isRetry = false) {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!this.plugin.settings.apiKey) {
      new Notice("请先在插件设置中填写 API key");
      return;
    }

    if (!isRetry) {
      this.messages.push({ role: "user", content: trimmed });
    } else {
      // drop last assistant message for retry
      const idx = [...this.messages].map((m) => m.role).lastIndexOf("assistant");
      if (idx !== -1) this.messages.splice(idx, 1);
    }

    this.inputEl.value = "";
    this.updateSendBtn();

    // Switch to chat and render user message
    if (this.mode !== "chat") {
      this.mode = "chat";
      this.buildHeaderActions();
      this.bodyEl.empty();
      for (const msg of this.messages) this.renderBubble(msg);
    } else {
      if (!isRetry) {
        this.renderBubble({ role: "user", content: trimmed }, true);
      }
    }

    // Thinking bubble
    const thinkingMsg: Message = { role: "assistant", content: "__thinking__" };
    const { wrap: thinkWrap } = this.renderBubble(thinkingMsg, true);

    // Use selected text as context if available, otherwise whole note
    const context = this.selectedText
      ? `以下是用户选中的文字片段：\n\`\`\`\n${this.selectedText}\n\`\`\``
      : this.noteContext;

    try {
      const reply = await callAI(
        this.plugin.settings,
        this.messages.filter((m) => m.content !== "__thinking__"),
        context
      );
      const aiMsg: Message = { role: "assistant", content: reply };
      this.messages.push(aiMsg);

      // Replace thinking bubble
      thinkWrap.remove();
      this.renderBubble(aiMsg, true);
    } catch (err) {
      thinkWrap.remove();
      const errText = err instanceof Error ? err.message : String(err);
      new Notice(`AI 请求失败：${errText}`);
      const errMsg: Message = { role: "assistant", content: `❌ 请求失败：${errText}` };
      this.messages.push(errMsg);
      this.renderBubble(errMsg, true);
    }
  }

  private goHome() {
    this.messages = [];
    this.renderHome();
  }

  // ── Insert into note ──────────────────────────────────────────────────────

  private getActiveFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("请先打开一个 Markdown 笔记");
      return null;
    }
    return file;
  }

  private getEditor(): import("obsidian").Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) { new Notice("请先打开一个 Markdown 笔记"); return null; }
    return view.editor;
  }

  private replaceSelection(content: string) {
    const editor = this.getEditor();
    if (!editor) return;
    if (!editor.getSelection().trim()) {
      new Notice("请先在笔记中选中要替换的文字");
      return;
    }
    editor.replaceSelection(content);
    this.selectedText = "";
    this.updateContextLabel();
    new Notice("✅ 已替换选中内容");
  }

  private async appendToNote(content: string) {
    const file = this.getActiveFile();
    if (!file) return;
    const current = await this.app.vault.read(file);
    await this.app.vault.modify(file, current.trimEnd() + "\n\n" + content);
    new Notice("✅ 已追加到笔记末尾");
  }

  private async overwriteNote(content: string) {
    const file = this.getActiveFile();
    if (!file) return;
    new ConfirmModal(
      this.app,
      "覆写整篇笔记？",
      `这将用 AI 回复替换「${file.basename}」的全部内容。文件历史仍可恢复。`,
      "确认覆写",
      () => {
        void (async () => {
          await this.app.vault.modify(file, content);
          this.noteContext = content;
          new Notice("✅ 笔记已覆写");
        })();
      }
    ).open();
  }
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

class AIAssistantSettingTab extends PluginSettingTab {
  plugin: AIAssistantPlugin;

  constructor(app: App, plugin: AIAssistantPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API 提供商")
      .setDesc("选择 AI 服务提供商")
      .addDropdown((d) =>
        d
          .addOption("anthropic", "Anthropic (Claude)")
          .addOption("openai", "OpenAI (GPT)")
          // eslint-disable-next-line obsidianmd/ui/sentence-case -- "MiniMax" is the official brand capitalization
          .addOption("minimax", "MiniMax (海螺 AI)")
          .addOption("kimi", "Kimi (月之暗面)")
          .setValue(this.plugin.settings.apiProvider)
          .onChange(async (v) => {
            this.plugin.settings.apiProvider = v as "anthropic" | "openai" | "minimax" | "kimi";
            const defaults: Record<string, string> = {
              anthropic: "claude-opus-4-7",
              openai: "gpt-5.5",
              minimax: "MiniMax-M2.7",
              kimi: "kimi-k2.6",
            };
            this.plugin.settings.model = defaults[v];
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName("API key")
      .setDesc(
        this.plugin.settings.apiProvider === "anthropic"
          ? "Anthropic API key（以 sk-ant- 开头）"
          : this.plugin.settings.apiProvider === "minimax"
          ? "MiniMax API key（在 minimax.chat 平台获取）"
          : this.plugin.settings.apiProvider === "kimi"
          ? "Kimi API key（在 platform.moonshot.cn 获取）"
          : "OpenAI API key（以 sk- 开头）"
      )
      .addText((t) =>
        t
          // eslint-disable-next-line obsidianmd/ui/sentence-case -- "sk-" is the actual API key prefix used by Anthropic/OpenAI/Kimi
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("模型")
      .setDesc("使用的 AI 模型")
      .addText((t) =>
        t
          .setValue(this.plugin.settings.model)
          .onChange(async (v) => {
            this.plugin.settings.model = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("系统提示词")
      .setDesc("AI 助手的行为指令（可留空使用默认）")
      .addTextArea((t) =>
        t
          .setValue(this.plugin.settings.systemPrompt)
          .onChange(async (v) => {
            this.plugin.settings.systemPrompt = v;
            await this.plugin.saveSettings();
          })
      );

    // ── Test button ──────────────────────────────────────────────────────────
    const testSetting = new Setting(containerEl)
      .setName("测试配置")
      .setDesc("发送一条测试消息，验证 API key 和模型是否配置正确");

    const resultEl = containerEl.createDiv({ cls: "ai-test-result" });

    testSetting.addButton((btn) =>
      btn
        .setButtonText("测试连接")
        .setCta()
        .onClick(async () => {
          if (!this.plugin.settings.apiKey) {
            resultEl.setText("❌ 请先填写 API key");
            resultEl.className = "ai-test-result ai-test-fail";
            return;
          }
          btn.setButtonText("测试中...").setDisabled(true);
          resultEl.setText("");
          resultEl.className = "ai-test-result";
          try {
            const reply = await callAI(
              this.plugin.settings,
              [{ role: "user", content: '回复"ok"，不要多说任何内容。' }],
              ""
            );
            resultEl.setText(`✅ 连接成功！模型回复：${reply.trim().slice(0, 60)}`);
            resultEl.className = "ai-test-result ai-test-ok";
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            resultEl.setText(`❌ 连接失败：${msg}`);
            resultEl.className = "ai-test-result ai-test-fail";
          } finally {
            btn.setButtonText("测试连接").setDisabled(false);
          }
        })
    );
  }
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export default class AIAssistantPlugin extends Plugin {
  settings!: AIAssistantSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new AIAssistantView(leaf, this));

    // Ribbon icon
    this.addRibbonIcon("sparkles", "Lumen AI 助手", () => this.activateView());

    // Command palette
    this.addCommand({
      id: "open-panel",
      name: "打开面板",
      callback: () => this.activateView(),
    });

    this.addSettingTab(new AIAssistantSettingTab(this.app, this));
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<AIAssistantSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
