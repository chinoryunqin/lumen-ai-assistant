<div align="center">

# ✦ Lumen

**AI assistant for your notes — inspired by Notion AI**

*为你的笔记点亮 AI 之光 · 灵感来自 Notion AI*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/chinoryunqin/lumen-ai-assistant)](https://github.com/chinoryunqin/lumen-ai-assistant/releases)
[![Min Obsidian](https://img.shields.io/badge/Obsidian-1.7.2%2B-7c6fcd)](https://obsidian.md/)

[English](#english) · [中文](#中文)

</div>

---

<a id="english"></a>

## ✦ English

Lumen is a Notion AI–style right‑sidebar panel that reads your active note, runs quick actions on it, and writes the result back to the file. Bring your own API key for **Claude**, **GPT**, **Minimax**, or **Kimi** — pick one, switch any time.

### Why Lumen?

| | |
|---|---|
| 🧠 **Context‑aware** | Reads the active note automatically. Select text to scope the request to just that selection. |
| ⚡ **Six built‑in actions** | Summarize, translate, deep analysis, extract tasks, continue writing, polish — one click each. |
| 💬 **Chat with follow‑ups** | Every quick action opens a conversation. Ask follow‑ups, refine, retry. |
| ✍️ **Edits files directly** | "Replace selection", "Append to note", "Overwrite file" — Lumen actually writes, not just chats. |
| 🔌 **Bring your own model** | Anthropic Claude · OpenAI GPT · Minimax 海螺 · Kimi 月之暗面. One‑click switch. |
| 🔒 **Local‑first** | API key stays in your vault's local config. No telemetry, no servers, no analytics. |

### Install

#### Via the Community plugin directory *(once approved)*

1. **Settings → Community plugins → Browse**
2. Search `Lumen` → **Install** → **Enable**

#### Manually

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/chinoryunqin/lumen-ai-assistant/releases/latest)
2. Drop them into `<your-vault>/.obsidian/plugins/lumen-ai-assistant/`
3. **Settings → Community plugins** → toggle on **Lumen**

### Configure

Open **Settings → Lumen** and fill in:

| Field | What goes here |
|---|---|
| **API provider** | One of Anthropic, OpenAI, Minimax, Kimi |
| **API key** | From the provider's console (see below) |
| **Model** | Auto‑filled with the latest recommended; override if you want a different tier |
| **System prompt** | Optional. Customize the assistant's behavior |

Then click **Test connection** to confirm everything works.

#### Where to get an API key

| Provider | Console |
|---|---|
| Anthropic (Claude) | <https://console.anthropic.com/> |
| OpenAI (GPT) | <https://platform.openai.com/api-keys> |
| Minimax (海螺) | <https://platform.minimax.io/> |
| Kimi (Moonshot) | <https://platform.moonshot.cn/> |

### Use it

1. Open any Markdown note
2. Click the **✦** ribbon icon on the left, or run **Lumen: Open panel** from the command palette
3. From the home screen, either:
   - Click one of the six quick actions, or
   - Type your own question into the input box
4. After the AI replies, use the buttons under the response:

| Button | What it does |
|---|---|
| **Replace selection** | Replaces the currently selected text in your note (only shown when something is selected) |
| **Append to note** | Adds the reply to the end of the active note |
| **Overwrite file** | Replaces the entire file content (with a confirmation modal — useful for whole‑note translations or rewrites) |
| Copy · Retry | Standard utilities |

**Tip:** Lumen remembers your text selection even when you click into the input box, so you can select a paragraph in your note, then type a custom instruction without losing the selection.

### Privacy & security

- 🔒 **Your API key is stored locally** in `<vault>/.obsidian/plugins/lumen-ai-assistant/data.json`. It is never sent anywhere except the provider's API.
- 🌐 **Network use:** the plugin makes outbound requests **only when you trigger an AI action**, and only to the provider you selected. Endpoints used:
  - `https://api.anthropic.com`
  - `https://api.openai.com`
  - `https://api.minimax.chat`
  - `https://api.moonshot.cn`
- 📊 **No telemetry.** No analytics. No usage data leaves your machine.
- 🗑️ **To wipe state**, disable the plugin and delete `data.json` in the plugin folder.

### Development

```bash
git clone https://github.com/chinoryunqin/lumen-ai-assistant
cd lumen-ai-assistant
npm install
npm run dev    # watch mode
npm run lint   # run the official eslint-plugin-obsidianmd checks
npm run build  # production build
```

The build output `main.js` is committed via GitHub releases, not into the repo.

### License

[MIT](./LICENSE) © 2026 rick

---

<a id="中文"></a>

## ✦ 中文

Lumen 是一个嵌入右侧栏的 AI 助手面板，灵感来自 Notion AI。它会自动读取你当前打开的笔记，对其执行常用操作（总结、翻译、分析、润色等），并把结果**直接写回文件** —— 不只是聊天。

支持四家服务商：**Claude**、**GPT**、**Minimax**（海螺）、**Kimi**（月之暗面）。一键切换，自带 API Key。

### 为什么用 Lumen？

| | |
|---|---|
| 🧠 **上下文感知** | 自动读取当前笔记。选中一段文字，操作只针对选区。 |
| ⚡ **六个快捷操作** | 总结 / 翻译 / 深度剖析 / 提取待办 / 续写 / 润色 —— 一键触发。 |
| 💬 **多轮对话** | 每次操作都打开一个对话，可追问、可重试。 |
| ✍️ **直接编辑文件** | 替换选中 / 追加到末尾 / 覆写全文 —— AI 真的会改文件，不是只展示。 |
| 🔌 **自带模型** | Anthropic Claude · OpenAI GPT · Minimax 海螺 · Kimi 月之暗面，随时切换。 |
| 🔒 **本地优先** | API Key 只保存在你的 vault 本地配置里。零遥测、零分析、零服务器。 |

### 安装

#### 通过社区插件市场 *（上架后）*

1. **设置 → 第三方插件 → 浏览**
2. 搜 `Lumen` → **安装** → **启用**

#### 手动安装

1. 从[最新 release](https://github.com/chinoryunqin/lumen-ai-assistant/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`
2. 丢到 `<你的vault>/.obsidian/plugins/lumen-ai-assistant/` 里
3. **设置 → 第三方插件** → 打开 **Lumen** 的开关

### 配置

打开 **设置 → Lumen**，填：

| 字段 | 说明 |
|---|---|
| **API 提供商** | Anthropic / OpenAI / Minimax / Kimi 任选一个 |
| **API Key** | 从所选服务商的开发者平台获取（见下表）|
| **模型** | 默认会自动填入当前推荐模型，可手动覆盖 |
| **系统提示词** | 可选，自定义 AI 的行为指令 |

填完点 **测试连接** 一键验证是否生效。

#### API Key 在哪获取

| 服务商 | 地址 |
|---|---|
| Anthropic (Claude) | <https://console.anthropic.com/> |
| OpenAI (GPT) | <https://platform.openai.com/api-keys> |
| Minimax (海螺) | <https://platform.minimax.io/> |
| Kimi (月之暗面) | <https://platform.moonshot.cn/> |

### 使用

1. 打开任意一篇 Markdown 笔记
2. 点击左侧工具栏的 **✦** 图标，或在命令面板搜 **Lumen: 打开面板**
3. 在主页面：
   - 点击六个快捷操作之一，或
   - 在输入框里输入自定义指令
4. AI 回复下方的按钮：

| 按钮 | 作用 |
|---|---|
| **替换选中** | 用 AI 回复替换笔记中当前选中的文字（只在有选区时显示） |
| **插入末尾** | 把 AI 回复追加到笔记最末尾 |
| **覆写全文** | 用 AI 回复替换整个文件内容（有弹窗确认，适合整篇翻译/重写场景） |
| 复制 · 重试 | 工具按钮 |

**提示**：选中笔记里的文字，然后点击 Lumen 输入框 —— 选区状态会被保留，你可以一边看着选中文字，一边输入自定义指令。

### 隐私 & 安全

- 🔒 **API Key 只存本地**，路径 `<vault>/.obsidian/plugins/lumen-ai-assistant/data.json`。除了服务商 API 之外不会发往任何地方。
- 🌐 **联网范围**：仅在你**主动触发 AI 操作**时发请求，且只到你选的那家服务商。端点：
  - `https://api.anthropic.com`
  - `https://api.openai.com`
  - `https://api.minimax.chat`
  - `https://api.moonshot.cn`
- 📊 **零遥测**。不收集任何使用数据。
- 🗑️ **想清空配置**：禁用插件后删掉插件目录里的 `data.json` 即可。

### 开发

```bash
git clone https://github.com/chinoryunqin/lumen-ai-assistant
cd lumen-ai-assistant
npm install
npm run dev    # watch 模式
npm run lint   # 跑官方 eslint-plugin-obsidianmd 规则
npm run build  # 生产构建
```

构建产物 `main.js` 通过 GitHub release 分发，不进仓库。

### 许可

[MIT](./LICENSE) © 2026 rick

---

<div align="center">

Made with ☕ and Claude · Star ⭐ if you find it useful

</div>
