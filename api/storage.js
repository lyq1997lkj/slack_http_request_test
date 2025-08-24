// 简单的内存存储方案
let requestHistory = [];
const MAX_REQUESTS = 2;

export function addRequest(requestData) {
    requestHistory.unshift(requestData);
    if (requestHistory.length > MAX_REQUESTS) {
        requestHistory = requestHistory.slice(0, MAX_REQUESTS);
    }
    console.log('Added request, total:', requestHistory.length);
}

export function getRequests() {
    console.log('Getting requests, total:', requestHistory.length);
    return [...requestHistory]; // 返回副本
}

export function clearRequests() {
    requestHistory = [];
    console.log('Cleared all requests');
}