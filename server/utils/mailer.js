const nodemailer = require('nodemailer')

// ─── TRANSPORTER SETUP ───────────────────────────────────
console.log('[Mail] Initializing transporter...')
console.log('[Mail] Config:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 4)}...` : 'NOT SET',
  from: process.env.EMAIL_FROM || 'NOT SET'
})

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log('[Mail] ✅ SMTP connection verified — ready to send'))
  .catch(err => console.error('[Mail] ❌ SMTP connection FAILED:', err.message))

// ─── SEND MAIL ───────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  console.log(`[Mail] Attempting to send → to: ${to} | subject: "${subject}"`)
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    })
    console.log(`[Mail] ✅ Sent successfully → messageId: ${info.messageId}, to: ${to}`)
    return info
  } catch (err) {
    console.error(`[Mail] ❌ Failed to send → to: ${to} | subject: "${subject}"`)
    console.error('[Mail] Error details:', err)
    // Don't rethrow — caller handles gracefully
  }
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────

const poolJoinEmailToJoiner = ({ joinerName, poolTitle, ownerName, platform }) => ({
  subject: `You joined the pool: ${poolTitle} 🎉`,
  html: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#03A6A1 0%,#028A86 100%);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px">You're in! 🎉</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">You've successfully joined a pool</p>
      </div>
      <div style="padding:24px">
        <p style="font-size:16px;color:#333">Hi <strong>${joinerName}</strong>,</p>
        <p style="font-size:15px;color:#555">You've successfully joined the pool <strong style="color:#03A6A1">${poolTitle}</strong>.</p>
        <div style="background:#F8F9FA;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #03A6A1">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Pool Organizer</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#333">${ownerName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Platform</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#FF4F0F">${(platform || 'custom').charAt(0).toUpperCase() + (platform || 'custom').slice(1)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Joined At</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#333">${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
          </table>
        </div>
        <p style="color:#FF4F0F;font-size:14px;background:#FFF5F0;padding:12px 16px;border-radius:8px;margin:16px 0">⚡ Head over to the pool and add your product links so the orderer can place a combined order!</p>
      </div>
      <div style="background:#F8F9FA;padding:16px 24px;text-align:center;border-top:1px solid #eee">
        <p style="color:#aaa;font-size:12px;margin:0">CommunityCollab — Collaborate. Share. Thrive.</p>
      </div>
    </div>
  `
})

const poolJoinEmailToOwner = ({ ownerName, joinerName, poolTitle, currentParticipants, maxParticipants }) => ({
  subject: `New member joined your pool: ${poolTitle}`,
  html: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;padding:0;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#FF4F0F 0%,#E64500 100%);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px">New Member! 🙌</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Someone joined your pool</p>
      </div>
      <div style="padding:24px">
        <p style="font-size:16px;color:#333">Hi <strong>${ownerName}</strong>,</p>
        <p style="font-size:15px;color:#555"><strong style="color:#03A6A1">${joinerName}</strong> has joined your pool <strong>${poolTitle}</strong>.</p>
        <div style="background:#F8F9FA;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #FF4F0F">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Participants</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#333">${currentParticipants} / ${maxParticipants}</td></tr>
          </table>
        </div>
        ${currentParticipants >= maxParticipants ? '<p style="color:#03A6A1;font-weight:600;text-align:center;font-size:15px">🎯 Your pool is now full!</p>' : ''}
      </div>
      <div style="background:#F8F9FA;padding:16px 24px;text-align:center;border-top:1px solid #eee">
        <p style="color:#aaa;font-size:12px;margin:0">CommunityCollab — Collaborate. Share. Thrive.</p>
      </div>
    </div>
  `
})

const eventJoinEmail = ({ userName, eventTitle, eventDate, eventLocation, organizerName }) => ({
  subject: `You registered for: ${eventTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
      <h2 style="color:#03A6A1">You're registered, ${userName}!</h2>
      <p>You've successfully registered for <strong>${eventTitle}</strong>.</p>
      <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0">
        <p><strong>Organizer:</strong> ${organizerName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
    </div>
  `
})

const skillConnectionEmail = ({ userName, skillName, otherUserName, type }) => ({
  subject: `Skill connection ${type === 'request' ? 'request' : 'accepted'}: ${skillName}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
      <h2 style="color:#03A6A1">Hi ${userName}!</h2>
      <p>${type === 'request'
        ? `<strong>${otherUserName}</strong> wants to connect with you for <strong>${skillName}</strong>.`
        : `<strong>${otherUserName}</strong> accepted your skill connection request for <strong>${skillName}</strong>.`
      }</p>
      <p>Log in to CommunityCollab to respond and schedule your first session.</p>
      <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
    </div>
  `
})

const resourceRequestEmail = ({ ownerName, requesterName, resourceTitle, startDate, endDate }) => ({
  subject: `New borrow request for: ${resourceTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
      <h2 style="color:#03A6A1">Hi ${ownerName}!</h2>
      <p><strong>${requesterName}</strong> wants to borrow your resource: <strong>${resourceTitle}</strong>.</p>
      <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0">
        <p><strong>From:</strong> ${startDate}</p>
        <p><strong>To:</strong> ${endDate}</p>
      </div>
      <p>Log in to approve or reject this request.</p>
      <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
    </div>
  `
})

const assistanceResponseEmail = ({ posterName, responderName, postTitle }) => ({
  subject: `Someone responded to your assistance post: ${postTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#FFE3BB;border-radius:12px">
      <h2 style="color:#03A6A1">Hi ${posterName}!</h2>
      <p><strong>${responderName}</strong> responded to your post: <strong>${postTitle}</strong>.</p>
      <p>Log in to review and accept their offer.</p>
      <p style="color:#888;font-size:12px">CommunityCollab — Collaborate. Share. Thrive.</p>
    </div>
  `
})

module.exports = {
  sendMail,
  poolJoinEmailToJoiner,
  poolJoinEmailToOwner,
  eventJoinEmail,
  skillConnectionEmail,
  resourceRequestEmail,
  assistanceResponseEmail
}
