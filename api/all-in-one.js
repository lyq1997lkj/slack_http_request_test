// 一体化的Slack webhook处理器
let requestHistory = [];
const MAX_REQUESTS = 2;

export default function handler(req, res) {
    // 处理CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 记录请求
    const requestData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        url: req.url
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