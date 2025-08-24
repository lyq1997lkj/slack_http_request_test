# Slack事件类型说明

根据Slack Events API官方文档，这里列出了常见的事件类型和它们的结构。

## 事件回调结构

所有事件回调都遵循以下基本结构：

```json
{
    "token": "verification_token",
    "team_id": "T1234567890",
    "api_app_id": "A1234567890",
    "event": {
        "type": "event_type",
        // 事件特定字段
    },
    "type": "event_callback",
    "event_id": "Ev1234567890",
    "event_time": 1234567890,
    "authed_users": ["U1234567890"],
    "authorizations": [
        {
            "enterprise_id": "E1234567890",
            "team_id": "T1234567890",
            "user_id": "U1234567890",
            "is_bot": false,
            "is_enterprise_install": false
        }
    ]
}
```

## 常见事件类型

### 1. message - 消息事件

用户在频道中发送消息时触发。

```json
{
    "type": "message",
    "channel": "C1234567890",
    "user": "U1234567890",
    "text": "Hello world",
    "ts": "1234567890.123456",
    "event_ts": "1234567890.123456",
    "channel_type": "channel"
}
```

**重要字段：**
- `channel`: 频道ID
- `user`: 发送消息的用户ID
- `text`: 消息内容
- `ts`: 消息时间戳
- `subtype`: 消息子类型（如果存在）

**注意：** 机器人消息会包含 `bot_id` 字段，通常需要忽略。

### 2. app_mention - @提及事件

用户在消息中@提及你的应用时触发。

```json
{
    "type": "app_mention",
    "channel": "C1234567890",
    "user": "U1234567890",
    "text": "<@U0987654321> hello",
    "ts": "1234567890.123456",
    "event_ts": "1234567890.123456"
}
```

### 3. member_joined_channel - 用户加入频道

用户加入频道时触发。

```json
{
    "type": "member_joined_channel",
    "channel": "C1234567890",
    "user": "U1234567890",
    "ts": "1234567890.123456",
    "event_ts": "1234567890.123456",
    "inviter": "U0987654321"
}
```

### 4. reaction_added - 表情反应添加

用户给消息添加表情反应时触发。

```json
{
    "type": "reaction_added",
    "user": "U1234567890",
    "reaction": "thumbsup",
    "item": {
        "type": "message",
        "channel": "C1234567890",
        "ts": "1234567890.123456"
    },
    "item_user": "U0987654321",
    "event_ts": "1234567890.123456"
}
```

### 5. file_shared - 文件分享

用户在频道中分享文件时触发。

```json
{
    "type": "file_shared",
    "channel_id": "C1234567890",
    "file_id": "F1234567890",
    "user_id": "U1234567890",
    "file": {
        "id": "F1234567890",
        "name": "example.txt",
        "mimetype": "text/plain",
        "size": 1024
    },
    "event_ts": "1234567890.123456"
}
```

## 事件订阅配置

在Slack应用设置中，你需要订阅相应的事件：

### Bot Events (机器人事件)
- `message.channels` - 公开频道消息
- `message.groups` - 私有频道消息
- `message.im` - 直接消息
- `message.mpim` - 多人直接消息
- `app_mention` - @提及应用
- `member_joined_channel` - 用户加入频道
- `reaction_added` - 添加表情反应
- `file_shared` - 文件分享

### User Events (用户事件)
需要用户OAuth授权才能接收。

## 调试技巧

1. **检查事件类型**: 确保订阅了正确的事件类型
2. **验证权限**: 确保应用有访问相应频道的权限
3. **过滤机器人消息**: 避免处理机器人自己发送的消息
4. **处理子类型**: 某些消息有 `subtype` 字段，可能需要特殊处理
5. **快速响应**: 必须在3秒内响应Slack的请求

## 常见问题

### Q: 为什么收不到消息事件？
A: 检查以下几点：
- 应用是否已安装到工作区
- 是否订阅了正确的事件类型
- 机器人是否被邀请到相应频道
- URL验证是否通过

### Q: 如何区分用户消息和机器人消息？
A: 机器人消息通常包含 `bot_id` 字段或特定的 `subtype`。

### Q: 如何处理线程消息？
A: 线程消息会包含 `thread_ts` 字段，指向主消息的时间戳。