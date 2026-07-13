/**
 * Northwest Registered Agents Integration Stub
 * Implement when Northwest API credentials are available.
 */

async function createOrder(payload) {
  throw new Error('Northwest integration not configured');
}

async function getOrderStatus(externalId) {
  throw new Error('Northwest integration not configured');
}

async function uploadDocument(orderId, filePath) {
  throw new Error('Northwest integration not configured');
}

module.exports = { createOrder, getOrderStatus, uploadDocument };
