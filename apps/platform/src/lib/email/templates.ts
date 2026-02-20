const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://commitcamp.com";
const BRAND_COLOR = "#7c3aed";
const ACCENT_COLOR = "#00d4ff";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CommitCamp</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                  <span style="color:${BRAND_COLOR}">Commit</span>Camp
                </span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#13131f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;">
                You're receiving this because you have notifications enabled.<br/>
                <a href="${SITE_URL}/settings" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Manage preferences</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:rgba(255,255,255,0.4);text-decoration:underline;">commitcamp.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:28px;padding:14px 28px;background:linear-gradient(135deg,${BRAND_COLOR},${ACCENT_COLOR});color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">${text}</a>`;
}

function avatarCircle(name: string): string {
  const initial = (name || "?")[0].toUpperCase();
  return `<div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,${BRAND_COLOR},${ACCENT_COLOR});text-align:center;line-height:44px;font-size:18px;font-weight:700;color:#ffffff;vertical-align:middle;">${initial}</div>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

export function likeNotificationEmail(data: {
  recipientName: string;
  actorName: string;
  postTitle: string;
  postUrl: string;
}): { subject: string; html: string } {
  const subject = `❤️ ${data.actorName} liked your post`;
  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${ACCENT_COLOR};text-transform:uppercase;letter-spacing:1px;">New Like</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Someone liked your post!</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
      <tr>
        <td style="vertical-align:middle;padding-right:14px;width:50px;">${avatarCircle(data.actorName)}</td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">${data.actorName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">liked your post</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:18px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.8px;">Your Post</p>
          <p style="margin:0;font-size:15px;color:#ffffff;font-weight:500;">${data.postTitle}</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">${ctaButton("View Post", data.postUrl)}</div>
  `);
  return { subject, html };
}

export function commentNotificationEmail(data: {
  recipientName: string;
  actorName: string;
  commentPreview: string;
  postTitle: string;
  postUrl: string;
}): { subject: string; html: string } {
  const subject = `💬 ${data.actorName} commented on your post`;
  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${ACCENT_COLOR};text-transform:uppercase;letter-spacing:1px;">New Comment</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">You have a new comment</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
      <tr>
        <td style="vertical-align:top;padding-right:14px;width:50px;">${avatarCircle(data.actorName)}</td>
        <td style="vertical-align:top;">
          <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#ffffff;">${data.actorName}</p>
          <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;font-style:italic;">"${data.commentPreview}"</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:18px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.8px;">On Your Post</p>
          <p style="margin:0;font-size:15px;color:#ffffff;font-weight:500;">${data.postTitle}</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">${ctaButton("Read & Reply", data.postUrl)}</div>
  `);
  return { subject, html };
}

export function followNotificationEmail(data: {
  recipientName: string;
  actorName: string;
  actorUsername: string;
  actorBio?: string;
}): { subject: string; html: string } {
  const profileUrl = `${SITE_URL}/profile/${data.actorUsername}`;
  const subject = `🚀 ${data.actorName} started following you`;
  const html = baseTemplate(`
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${ACCENT_COLOR};text-transform:uppercase;letter-spacing:1px;">New Follower</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">You have a new follower!</h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:24px;">
      <tr>
        <td align="center" style="padding-bottom:16px;">${avatarCircle(data.actorName)}</td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${data.actorName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.4);">@${data.actorUsername}</p>
          ${data.actorBio ? `<p style="margin:14px 0 0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;max-width:320px;text-align:center;">${data.actorBio}</p>` : ""}
        </td>
      </tr>
    </table>

    <div style="text-align:center;">${ctaButton("View Profile", profileUrl)}</div>
  `);
  return { subject, html };
}

export function levelUpNotificationEmail(data: {
  recipientName: string;
  newLevel: number;
  xpPoints: number;
}): { subject: string; html: string } {
  const subject = `⚡ Level Up! You reached Level ${data.newLevel}`;
  const html = baseTemplate(`
    <div style="text-align:center;padding:10px 0 30px;">
      <div style="display:inline-block;width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${BRAND_COLOR},${ACCENT_COLOR});text-align:center;line-height:80px;font-size:36px;">⚡</div>
    </div>

    <div style="text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${ACCENT_COLOR};text-transform:uppercase;letter-spacing:1px;">Achievement Unlocked</p>
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;">Level Up!</h1>
      <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.6);">Congratulations, <strong style="color:#ffffff;">${data.recipientName}</strong>!</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(0,212,255,0.08));border:1px solid rgba(124,58,237,0.3);border-radius:16px;padding:28px;">
      <tr>
        <td align="center">
          <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">You are now</p>
          <p style="margin:0;font-size:52px;font-weight:800;background:linear-gradient(135deg,${BRAND_COLOR},${ACCENT_COLOR});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Level ${data.newLevel}</p>
          <p style="margin:14px 0 0;font-size:14px;color:rgba(255,255,255,0.5);">${data.xpPoints.toLocaleString()} XP Total</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.7;">
      Keep committing to your growth. Every post, comment, and contribution levels you up. 🚀
    </p>

    <div style="text-align:center;">${ctaButton("View My Profile", `${SITE_URL}/feed`)}</div>
  `);
  return { subject, html };
}
