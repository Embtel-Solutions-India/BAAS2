/**
 * Harbor Compliance Integration Stub
 * Implement when Harbor API credentials are available.
 */

async function createOrder(payload) {
  throw new Error('Harbor Compliance integration not configured');
}

async function getOrderStatus(externalId) {
  throw new Error('Harbor Compliance integration not configured');
}

async function uploadDocument(orderId, filePath) {
  throw new Error('Harbor Compliance integration not configured');
}

module.exports = { createOrder, getOrderStatus, uploadDocument };
