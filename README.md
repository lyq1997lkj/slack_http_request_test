# Slack事件调试工具

一个简单的HTML页面，用于查看和调试Slack向你的URL发送的HTTP POST请求。

## 功能特性

- 显示最近的2个HTTP POST请求
- 实时显示请求头和请求体
- 自动处理Slack URL验证挑战
- 支持事件回调处理
- 30秒自动刷新

## 部署到Vercel

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 部署完成后，你会得到一个类似 `https://your-project.vercel.app` 的URL

## 配置Slack应用

### 步骤1：部署到Vercel
1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目并部署
3. 记录你的Vercel域名，例如：`https://your-project.vercel.app`

### 步骤2：配置Slack应用
1. 访问 [Slack API控制台](https://api.slack.com/apps)
2. 创建新应用或选择现有应用
3. 在左侧菜单中选择 "Event Subscriptions"
4. 启用Events并设置Request URL为：
   ```
   https://your-project.vercel.app/slack/events
   ```
5. Slack会自动发送URL验证请求，你应该看到绿色的"Verified"状态
6. 在"Subscribe to bot events"中添加你需要的事件类型：
   - `message.channels` - 频道消息
   - `message.groups` - 私有频道消息
   - `message.im` - 直接消息
   - `app_mention` - @提及机器人

### 步骤3：安装应用到工作区
1. 在左侧菜单选择 "Install App"
2. 点击 "Install to Workspace"
3. 授权应用访问你的工作区

## 使用方法

### 调试界面
1. 访问 `https://your-project.vercel.app` 查看主调试界面
2. 访问 `https://your-project.vercel.app/test.html` 进行功能测试

### 测试流程
1. 先在测试页面验证webhook端点工作正常
2. 配置Slack应用的Event Subscriptions URL
3. 在Slack频道中发送消息或@提及机器人
4. 在调试界面中查看收到的请求详情

### 调试信息说明
- **绿色边框** - URL验证请求
- **蓝色边框** - 事件回调请求
- **时间戳** - 请求接收时间
- **Headers** - HTTP请求头（包含Slack签名验证信息）
- **Body** - 请求体内容（事件数据）

### 事件解析功能
工具现在能够正确解析Slack Events API的完整结构：

- **团队信息**: `team_id`, `api_app_id`
- **事件详情**: `event_id`, `event_time`, `event_type`
- **用户信息**: `user`, `channel`, `text`
- **授权信息**: `authed_users`, `authorizations`

支持的事件类型：
- `message` - 频道消息
- `app_mention` - @提及应用
- `member_joined_channel` - 用户加入频道
- `reaction_added` - 表情反应

详细的事件类型说明请查看 `EVENTS.md` 文件。

## 文件结构

- `index.html` - 主页面，显示请求历史
- `api/webhook.js` - 处理Slack事件的API端点
- `api/requests.js` - 获取请求历史的API端点
- `api/clear.js` - 清空请求历史的API端点
- `vercel.json` - Vercel配置文件

## 注意事项

由于Vercel的无状态特性，请求历史在函数重启后会丢失。如需持久化存储，建议使用数据库或外部存储服务。

## 调试提示

- 检查请求头中的 `x-slack-signature` 和 `x-slack-request-timestamp` 用于验证请求来源
- 查看请求体中的 `type` 字段来区分不同类型的请求
- 注意 `event` 字段中包含的具体事件数据