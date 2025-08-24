// API endpoint to clear request history
import { clearRequestHistory } from './webhook.js';

export default function handler(req, res) {
    if (req.method === 'POST') {
        clearRequestHistory();
        return res.status(200).json({ message: 'Requests cleared' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}