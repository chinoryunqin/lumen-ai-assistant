# Lumen

> 为 Obsidian 笔记点亮 AI 之光 · AI for your Obsidian vault

Lumen 是一个嵌入 Obsidian 右侧栏的 AI 助手面板，灵感来自 Notion AI。它能读取当前笔记、执行常用操作（总结、翻译、深度剖析、提取待办、续写、润色），并把结果直接写回文件 —— 不只是聊天展示。

支持四家服务商：**Anthropic Claude**、**OpenAI GPT**、**MiniMax 海螺**、**Kimi 月之暗面**。

---

## ✨ 功能

- **侧栏面板** — 右侧悬浮式 AI 面板，不打断写作流
- **6 个快捷操作** — 一键总结 / 翻译 / 深度剖析 / 提取待办 / 续写 / 润色
- **当前笔记上下文** — 自动读取活动笔记内容作为 AI 上下文
- **选区上下文** — 选中文字后只针对选区操作（点击面板不丢失选区）
- **多轮对话** — 保留对话历史，支持追问
- **直接写文件** — AI 回复可一键
  - 替换选中文字
  - 追加到笔记末尾
  - 覆写整篇笔记（弹窗确认）
- **多服务商** — Claude / GPT / MiniMax / Kimi 一键切换
- **测试连接** — 配置完一键验证 API Key 和模型是否正确

---

## 📦 安装

### 通过 Obsidian 社区插件市场（推荐，发布后）

1. **设置 → 第三方插件 → 浏览**
2. 搜索 `Lumen` → 安装 → 启用

### 手动安装

1. 下载最新 release 中的 `main.js`、`manifest.json`、`styles.css`
2. 放到你的 vault 的 `.obsidian/plugins/lumen-ai-assistant/` 文件夹下
3. **设置 → 第三方插件** → 关闭安全模式 → 启用 **Lumen**

---

## ⚙️ 配置

打开 **设置 → Lumen**，填写：

| 字段 | 说明 |
|---|---|
| API 提供商 | Anthropic / OpenAI / MiniMax / Kimi 任选 |
| API Key | 从所选服务商的开发者平台获取 |
| 模型 | 默认会自动填入最新推荐模型，可手动覆盖 |
| 系统提示词 | AI 的行为指令，可留空使用默认 |

填完后点击 **测试连接** 按钮验证是否生效。

### API Key 获取

- **Anthropic Claude**：<https://console.anthropic.com/>
- **OpenAI GPT**：<https://platform.openai.com/api-keys>
- **MiniMax 海螺**：<https://platform.minimax.io/>
- **Kimi 月之暗面**：<https://platform.moonshot.cn/>

---

## 🚀 使用

1. 打开任意 Markdown 笔记
2. 点击左侧工具栏的 **✦** 图标（或命令面板搜 `打开 Lumen`）
3. 在右侧面板里选择快捷操作，或直接输入问题
4. AI 回复下方提供四个操作：
   - **替换选中**（仅在笔记中选中文字时显示）
   - **插入末尾**
   - **覆写全文**（红色，二次确认）
   - **复制** / **重试**

### 命令

| 命令 | 说明 |
|---|---|
| `打开 Lumen AI 助手面板` | 打开/激活右侧面板 |

---

## 🔒 隐私 & 安全

- API Key **仅保存在本地**（Obsidian 的 `data.json`），不会上传到任何第三方
- 笔记内容只会在你**主动触发 AI 操作时**发送给所选服务商
- 不收集任何使用统计、不发送任何遥测数据
- 如需删除已保存的配置，禁用插件即可（`data.json` 会保留），或手动删除 `.obsidian/plugins/lumen-ai-assistant/data.json`

---

## 🛠️ 开发

```bash
git clone https://github.com/<your-username>/lumen-ai-assistant
cd lumen-ai-assistant
npm install
npm run dev    # watch 模式
npm run build  # 生产构建
```

构建产物（`main.js`）会输出到根目录。

---

## 📄 License

[MIT](./LICENSE)
