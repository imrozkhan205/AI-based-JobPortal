function env(name) {
  const value = process.env[name];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getFromAddress() {
  return env("EMAIL_FROM") || env("GMAIL_USER") || env("SMTP_USER") || "";
}

function getTransportConfig() {
  const smtpHost = env("SMTP_HOST");
  const smtpUser = env("SMTP_USER");
  const smtpPass = env("SMTP_PASS");
  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(env("SMTP_PORT") || 587);
    const secure =
      String(env("SMTP_SECURE") || "").toLowerCase() === "true" || port === 465;

    return {
      host: smtpHost,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };
  }

  const gmailUser = env("GMAIL_USER");
  const gmailPass = env("GMAIL_APP_PASSWORD");
  if (gmailUser && gmailPass) {
    return {
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    };
  }

  return null;
}

async function getNodemailer() {
  try {
    const mod = await import("nodemailer");
    return mod.default || mod;
  } catch (error) {
    return null;
  }
}

export async function sendMail({ to, subject, text }) {
  const transportConfig = getTransportConfig();
  const from = getFromAddress();

  if (!transportConfig || !from) {
    console.warn(
      "⚠️ Email not configured. Set EMAIL_FROM and either (GMAIL_USER + GMAIL_APP_PASSWORD) or SMTP_* env vars."
    );
    return { skipped: true };
  }

  const nodemailer = await getNodemailer();
  if (!nodemailer) {
    console.warn(
      "⚠️ nodemailer is not installed. Run: npm i nodemailer (in backend/)."
    );
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    const info = await transporter.sendMail({
      from,
      to: String(to || "").trim(),
      subject: String(subject || "").trim(),
      text: String(text || ""),
    });

    return { skipped: false, messageId: info?.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error?.message || error);
    throw error;
  }
}
