/**
 * Email notifications for the live chat.
 *  - Client sends a message  → email the admin(s)
 *  - Admin/staff replies      → email the client
 *
 * Anti-spam: only emails when the recipient is NOT currently online, and at most
 * once per conversation/side within a cooldown window. Fully fire-and-forget —
 * never throws, so it can't affect the chat flow.
 */
const { Client, Admin } = require('../models');
const Conversation = require('../models/Conversation');
const { sendMail } = require('../config/email');
const presence = require('../socket/presence');

const ENABLED = () => process.env.CHAT_EMAIL_NOTIFICATIONS !== 'false';   // on unless explicitly disabled
const COOLDOWN_MS = () => Math.max(0, Number(process.env.CHAT_NOTIFY_COOLDOWN_MIN || 5)) * 60 * 1000;
const FRONT = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

function withinCooldown(ts) {
  return ts ? (Date.now() - new Date(ts).getTime() < COOLDOWN_MS()) : false;
}

function emailHtml({ heading, intro, preview, ctaLabel, ctaUrl }) {
  return `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9f8f6;border-radius:16px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#d4001f,#a4001a);color:#fff;font-family:Georgia,serif;font-size:24px;font-weight:700">B</div>
        <div style="font-size:16px;font-weight:700;color:#111;margin-top:10px">Bay Area Accounting Solutions</div>
      </div>
      <div style="background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:14px;padding:26px">
        <h2 style="font-size:18px;color:#111;margin:0 0 10px">${heading}</h2>
        <p style="font-size:14px;color:#444;margin:0 0 16px">${intro}</p>
        <div style="border-left:3px solid #d4001f;background:#faf7f7;padding:12px 16px;border-radius:6px;font-size:15px;color:#222;line-height:1.5">${preview}</div>
        <div style="text-align:center;margin-top:24px">
          <a href="${ctaUrl}" style="display:inline-block;background:#d4001f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px">${ctaLabel}</a>
        </div>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.6;margin-top:20px;text-align:center">
        You're receiving this because of activity in your BAAS support chat.
      </p>
    </div>`;
}

function esc(s) {
  return String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

/** Send the appropriate email for a newly created chat message. */
async function notifyByEmail({ conversation, senderRole }) {
  try {
    if (!ENABLED()) return;
    const preview = esc((conversation.last_message || 'New message').toString().slice(0, 180));
    const fromClient = senderRole === 'client';

    if (fromClient) {
      // → notify admin(s). Skip if a staff member is already online, or in cooldown.
      if (presence.anyStaffOnline()) return;
      if (withinCooldown(conversation.last_notified_admin_at)) return;

      let recipients = [];
      if (process.env.CHAT_ADMIN_EMAIL) {
        recipients = [process.env.CHAT_ADMIN_EMAIL];
      } else {
        const admins = await Admin.find({ is_active: true }).select('email');
        recipients = admins.map(a => a.email).filter(Boolean);
      }
      if (!recipients.length && process.env.EMAIL_USER) recipients = [process.env.EMAIL_USER];
      if (!recipients.length) return;

      const client = await Client.findById(conversation.client_id).select('first_name last_name email');
      const name = client
        ? (`${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email)
        : `Client #${conversation.client_id}`;

      await sendMail({
        to: recipients.join(','),
        subject: `New chat message from ${name}`,
        html: emailHtml({
          heading: 'New client message',
          intro: `<b>${esc(name)}</b> sent a message in the support chat:`,
          preview,
          ctaLabel: 'Open Admin Chat',
          ctaUrl: `${FRONT()}/admin/chat`,
        }),
      });
      await Conversation.updateOne({ _id: conversation._id }, { $set: { last_notified_admin_at: new Date() } });
    } else {
      // → notify the client. Skip if the client is online, or in cooldown.
      const clientId = Number(conversation.client_id);
      if (presence.isOnline(clientId)) return;
      if (withinCooldown(conversation.last_notified_client_at)) return;

      const client = await Client.findById(conversation.client_id).select('first_name email');
      if (!client?.email) return;

      await sendMail({
        to: client.email,
        subject: 'New reply from BAAS Support',
        html: emailHtml({
          heading: 'New reply from BAAS Support',
          intro: `Hi ${esc(client.first_name || 'there')}, the BAAS team replied to your message:`,
          preview,
          ctaLabel: 'View & Reply',
          ctaUrl: `${FRONT()}/client-portal/chat`,
        }),
      });
      await Conversation.updateOne({ _id: conversation._id }, { $set: { last_notified_client_at: new Date() } });
    }
  } catch (err) {
    console.error('chatNotify email error:', err.message);
  }
}

module.exports = { notifyByEmail };
