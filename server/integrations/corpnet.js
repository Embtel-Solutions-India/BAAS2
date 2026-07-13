/**
 * CorpNet Integration Stub
 * Implement when CorpNet API credentials are available.
 * Standard interface — all integrations must export these three functions.
 */

async function createOrder(payload) {
  throw new Error('CorpNet integration not configured');
}

async function getOrderStatus(externalId) {
  throw new Error('CorpNet integration not configured');
}

async function uploadDocument(orderId, filePath) {
  throw new Error('CorpNet integration not configured');
}

module.exports = { createOrder, getOrderStatus, uploadDocument };
