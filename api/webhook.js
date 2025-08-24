// Vercel serverless function to handle Slack events
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const MAX_REQUESTS = 2;
const HISTORY_FILE = '/tmp/request_history.json';

function getStoredHistory() {
    try {
        if (existsSync(HISTORY_FILE)) {
            const data = readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Error reading history file:', error);
    }
    return [];
}

function saveHistory(history) {
    try {
        writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.log('Error saving history file:', error);
    }
}

function addToHistory(requestData) {
    const history = getStoredHistory();
    history.unshift(requestData);
    if (history.length > MAX_REQUESTS) {
        history.splice(MAX_REQUESTS);
    }
    saveHistory(history);
}

export default function handler(req, res) {
    // 记录所有请求（包括GET请求用于调试）
    const requestData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        url: req.url
    };
    
    addToHistory(requestData);
    
    // 只处理POST请求
    if (req.method === 'POST') {
        const { 
            type, 
            challenge, 
            token,
            team_id,
            api_app_id,
            event,
            event_id,
            event_time,
            authed_users,
            authorizations
        } = req.body;
        
        console.log('Received POST request:', { 
            type, 
            team_id,
            api_app_id,
            event_type: event?.type,
            challenge: challenge ? 'present' : 'missing' 
        });
        
        // URL验证挑战 - 按照官方文档要求处理
        if (type === 'url_verification') {
            console.log('URL verification challenge received:', challenge);
            
            // 验证challenge存在
            if (!challenge) {
                return res.status(400).json({ error: 'Missing challenge parameter' });
            }
            
            // 按照官方文档，可以用多种格式返回challenge
            // 这里使用JSON格式（最常用）
            return res.status(200).json({ challenge });
        }
        
        // 事件回调 - 按照官方文档解析完整的事件结构
        if (type === 'event_callback') {
            console.log('Event callback received:', {
                team_id,
                api_app_id,
                event_id,
                event_time,
                event_type: event?.type,
                event_subtype: event?.subtype,
                user: event?.user,
                channel: event?.channel,
                text: event?.text?.substring(0, 100) // 只记录前100个字符
            });
            
            // 快速响应Slack（3秒内）
            res.status(200).json({ ok: true });
            
            // 处理不同类型的事件
            if (event) {
                processSlackEvent(event, {
                    team_id,
                    api_app_id,
                    event_id,
                    event_time,
                    authed_users,
                    authorizations
                });
            }
            
            return;
        }
        
        // 其他类型的请求
        console.log('Other request type:', type);
        return res.status(200).json({ ok: true });
    }
    
    // GET请求 - 用于健康检查
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'ok', 
            message: 'Slack webhook endpoint is running',
            timestamp: new Date().toISOString()
        });
    }
    
    // 其他方法不支持
    return res.status(405).json({ error: 'Method not allowed' });
}

// 处理Slack事件的函数
function processSlackEvent(event, context) {
    const { type, subtype, user, channel, text, ts, thread_ts } = event;
    
    console.log(`Processing event: ${type}${subtype ? ` (${subtype})` : ''}`);
    
    switch (type) {
        case 'message':
            handleMessageEvent(event, context);
            break;
        case 'app_mention':
            handleAppMentionEvent(event, context);
            break;
        case 'member_joined_channel':
            handleMemberJoinedEvent(event, context);
            break;
        case 'reaction_added':
            handleReactionAddedEvent(event, context);
            break;
        default:
            console.log(`Unhandled event type: ${type}`);
    }
}

// 处理消息事件
function handleMessageEvent(event, context) {
    const { subtype, user, channel, text, ts, bot_id } = event;
    
    // 忽略机器人消息和系统消息
    if (bot_id || subtype) {
        console.log(`Ignoring message with subtype: ${subtype} or bot_id: ${bot_id}`);
        return;
    }
    
    console.log(`Message from user ${user} in channel ${channel}: ${text?.substring(0, 100)}`);
    
    // 这里可以添加你的消息处理逻辑
    // 例如：关键词回复、AI处理等
}

// 处理@提及事件
function handleAppMentionEvent(event, context) {
    const { user, channel, text, ts } = event;
    
    console.log(`App mentioned by user ${user} in channel ${channel}: ${text?.substring(0, 100)}`);
    
    // 这里可以添加@提及的处理逻辑
    // 例如：回复用户、执行特定命令等
}

// 处理用户加入频道事件
function handleMemberJoinedEvent(event, context) {
    const { user, channel } = event;
    
    console.log(`User ${user} joined channel ${channel}`);
    
    // 这里可以添加欢迎消息逻辑
}

// 处理表情反应事件
function handleReactionAddedEvent(event, context) {
    const { user, reaction, item } = event;
    
    console.log(`User ${user} added reaction ${reaction} to message ${item?.ts}`);
    
    // 这里可以添加表情反应的处理逻辑
}

// 导出函数供其他API使用
export function getRequestHistory() {
    return getStoredHistory();
}

export function clearRequestHistory() {
    saveHistory([]);
}