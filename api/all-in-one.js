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
        
        if (hasSlackSignature && hasSlackTimestamp) {
            return {
                source: 'Slack官方',
                isSlack: true,
                confidence: 'high',
                details: `签名验证 + 时间戳${hasSlackRetry ? ' + 重试' : ''}`
            };
        }
        
        if (isSlackUserAgent) {
            return {
                source: 'Slack机器人',
                isSlack: true,
                confidence: 'medium',
                details: 'User-Agent包含Slack标识'
            };
        }
        
        if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
            const referer = headers['referer'] || '';
            if (referer.includes(headers['host'])) {
                return {
                    source: '调试页面',
                    isSlack: false,
                    confidence: 'high',
                    details: `浏览器请求 (${userAgent.split(' ')[0]})`
                };
            }
            return {
                source: '外部浏览器',
                isSlack: false,
                confidence: 'high',
                details: `浏览器请求 (${userAgent.split(' ')[0]})`
            };
        }
        
        if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('Postman')) {
            return {
                source: 'API工具',
                isSlack: false,
                confidence: 'high',
                details: userAgent.split('/')[0]
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
        userId: req.body?.event?.user || null,
        channelId: req.body?.event?.channel || null,
        messageText: req.body?.event?.text ? req.body.event.text.substring(0, 100) : null
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