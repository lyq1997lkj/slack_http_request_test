// 一体化的Slack webhook处理器
let requestHistory = [];
const MAX_REQUESTS = 10;

export default function handler(req, res) {
    // 处理CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 分析请求来源
    function analyzeRequestSource(headers, body) {
        const userAgent = headers['user-agent'] || '';
        const hasSlackSignature = !!headers['x-slack-signature'];
        const hasSlackTimestamp = !!headers['x-slack-request-timestamp'];
        const hasSlackRetry = !!headers['x-slack-retry-num'];
        const isSlackUserAgent = userAgent.includes('Slackbot') || userAgent.includes('Slack');
        const contentType = headers['content-type'] || '';
        const isSlackEvent = body && (body.type === 'url_verification' || body.type === 'event_callback');
        
        // 记录所有请求头用于调试
        console.log('Request headers:', Object.keys(headers).filter(key => key.toLowerCase().includes('slack')));
        console.log('User-Agent:', userAgent);
        console.log('Content-Type:', contentType);
        console.log('Body type:', body?.type);
        
        // 最高优先级：有Slack签名和时间戳
        if (hasSlackSignature && hasSlackTimestamp) {
            return {
                source: 'Slack官方',
                isSlack: true,
                confidence: 'high',
                details: `签名验证 + 时间戳${hasSlackRetry ? ' + 重试' : ''}`
            };
        }
        
        // 高优先级：Slack事件类型 + JSON内容
        if (isSlackEvent && contentType.includes('application/json')) {
            return {
                source: 'Slack事件',
                isSlack: true,
                confidence: 'high',
                details: `事件类型: ${body.type}`
            };
        }
        
        // 中等优先级：Slack User-Agent
        if (isSlackUserAgent) {
            return {
                source: 'Slack机器人',
                isSlack: true,
                confidence: 'medium',
                details: `User-Agent: ${userAgent.substring(0, 50)}...`
            };
        }
        
        // 检查是否是浏览器请求
        if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
            const referer = headers['referer'] || '';
            if (referer.includes(headers['host'])) {
                return {
                    source: '调试页面',
                    isSlack: false,
                    confidence: 'high',
                    details: `浏览器测试 (${userAgent.split(' ')[0]})`
                };
            }
            return {
                source: '外部浏览器',
                isSlack: false,
                confidence: 'high',
                details: `浏览器访问 (${userAgent.split(' ')[0]})`
            };
        }
        
        // API工具
        if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('Postman')) {
            return {
                source: 'API工具',
                isSlack: false,
                confidence: 'high',
                details: userAgent.split('/')[0]
            };
        }
        
        // 未知来源，但如果有Slack相关的body，可能是Slack请求
        if (isSlackEvent) {
            return {
                source: '可能的Slack请求',
                isSlack: true,
                confidence: 'low',
                details: `事件类型: ${body.type}, 但缺少签名`
            };
        }
        
        return {
            source: '未知来源',
            isSlack: false,
            confidence: 'low',
            details: userAgent || '无User-Agent'
        };
    }
    
    const sourceInfo = analyzeRequestSource(req.headers, req.body);
    
    // 记录请求
    const requestData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        source: sourceInfo,
        eventType: req.body?.type || null,
        eventSubType: req.body?.event?.type || null,
        challenge: req.body?.challenge ? 'present' : null,
        teamId: req.body?.team_id || null,
        apiAppId: req.body?.api_app_id || null,
        eventId: req.body?.event_id || null,
        eventTime: req.body?.event_time || null,
        userId: req.body?.event?.user || null,
        channelId: req.body?.event?.channel || null,
        messageText: req.body?.event?.text ? req.body.event.text.substring(0, 100) : null,
        messageTs: req.body?.event?.ts || null,
        threadTs: req.body?.event?.thread_ts || null,
        // 存储关键的请求头
        headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'x-slack-signature': req.headers['x-slack-signature'],
            'x-slack-request-timestamp': req.headers['x-slack-request-timestamp'],
            'x-slack-retry-num': req.headers['x-slack-retry-num'],
            'host': req.headers['host'],
            'referer': req.headers['referer']
        },
        // 存储完整的body用于详细查看
        body: req.body,
        query: req.query
    };
    
    // 添加到历史记录
    requestHistory.unshift(requestData);
    if (requestHistory.length > MAX_REQUESTS) {
        requestHistory = requestHistory.slice(0, MAX_REQUESTS);
    }
    
    console.log(`Request recorded. Total: ${requestHistory.length}`);
    
    // 根据查询参数决定返回什么
    if (req.query.action === 'history') {
        return res.status(200).json(requestHistory);
    }
    
    if (req.query.action === 'clear') {
        requestHistory = [];
        return res.status(200).json({ message: 'History cleared' });
    }
    
    // 处理POST请求（Slack事件）
    if (req.method === 'POST') {
        const { type, challenge, event, team_id, api_app_id } = req.body;
        
        console.log('Slack POST request:', { type, team_id, event_type: event?.type });
        
        // URL验证
        if (type === 'url_verification') {
            if (!challenge) {
                return res.status(400).json({ error: 'Missing challenge' });
            }
            return res.status(200).json({ challenge });
        }
        
        // 事件回调
        if (type === 'event_callback') {
            console.log('Event received:', event);
            return res.status(200).json({ ok: true });
        }
        
        return res.status(200).json({ ok: true });
    }
    
    // GET请求
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'Slack webhook is running',
            timestamp: new Date().toISOString(),
            totalRequests: requestHistory.length,
            endpoints: {
                history: '?action=history',
                clear: '?action=clear'
            }
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}