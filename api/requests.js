// API endpoint to get request history
import { getRequestHistory } from './webhook.js';

export default function handler(req, res) {
    if (req.method === 'GET') {
        // 返回请求历史
        const history = getRequestHistory();
        return res.status(200).json(history);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}