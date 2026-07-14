const Admin             = require('./Admin');
const Client            = require('./Client');
const Company           = require('./Company');
const CompanyMember     = require('./CompanyMember');
const Service           = require('./Service');
const Order             = require('./Order');
const OrderStatusHistory = require('./OrderStatusHistory');
const Document          = require('./Document');
const Message           = require('./Message');
const Notification      = require('./Notification');
const Invoice           = require('./Invoice');
const Payment           = require('./Payment');
const ActivityLog       = require('./ActivityLog');
const RegisteredAgent   = require('./RegisteredAgent');
const AnnualReport      = require('./AnnualReport');
const BoiFiling         = require('./BoiFiling');
const EmailVerification  = require('./EmailVerification');
const PasswordReset     = require('./PasswordReset');
const Blog              = require('./Blog');
const QuickBooksToken   = require('./QuickBooksToken');
const Conversation      = require('./Conversation');
const ChatMessage       = require('./ChatMessage');

function toRow(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id !== undefined) {
    obj.id = obj._id;
    delete obj._id;
  }
  delete obj.__v;
  return obj;
}

function toRows(docs) {
  if (!docs) return docs;
  return docs.map(toRow);
}

module.exports = {
  Admin,
  Client,
  Company,
  CompanyMember,
  Service,
  Order,
  OrderStatusHistory,
  Document,
  Message,
  Notification,
  Invoice,
  Payment,
  ActivityLog,
  RegisteredAgent,
  AnnualReport,
  BoiFiling,
  EmailVerification,
  PasswordReset,
  Blog,
  QuickBooksToken,
  Conversation,
  ChatMessage,
  toRow,
  toRows
};
