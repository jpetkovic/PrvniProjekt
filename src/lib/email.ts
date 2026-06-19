// E-mail sender using Gmail SMTP via nodemailer.
//
// Set GMAIL_USER (the Gmail address) and GMAIL_APP_PASSWORD (a 16-char
// Google "App password", NOT your normal password — requires 2FA enabled on
// the account). Without them (e.g. local dev) the message is logged to the
// console so the flow stays testable.
//
// App password: https://myaccount.google.com/apppasswords

import nodemailer from "nodemailer";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const user = process.env.GMAIL_USER?.trim();
// Google shows app passwords with spaces ("abcd efgh ijkl mnop"); strip any
// whitespace so a copy-paste with spaces still works.
const rawPass = process.env.GMAIL_APP_PASSWORD;
const pass = rawPass?.replace(/\s+/g, "") || undefined;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  const from = process.env.EMAIL_FROM ?? `PrvniProjekt <${user ?? "noreply"}>`;

  if (!user || !pass) {
    console.info(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — would send to ${to}\nFrom: ${from}\nSubject: ${subject}\n${text ?? html}`
    );
    return { delivered: false as const };
  }

  // Production-safe diagnostics (no secret leaked): helps debug 535 BadCredentials.
  console.info(
    `[email] SMTP login → user=${user} from="${from}" passLength=${pass.length} appPasswordHadSpaces=${/\s/.test(rawPass ?? "")}`
  );
  // TODO: TEMPORARY DEBUG — reveals the full password. Dev-only. REMOVE once
  // e-mail sending works; never leave secret logging in long-term.
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[email][DEBUG] GMAIL_APP_PASSWORD=${pass}`);
  }

  await getTransporter().sendMail({ from, to, subject, html, text });
  return { delivered: true as const };
}

export async function sendVerificationEmail(to: string, link: string) {
  const subject = "Potvrď svou e-mailovou adresu";
  const text = `Vítej v PrvníProjekt!\n\nPotvrď svou adresu kliknutím na odkaz:\n${link}\n\nOdkaz platí 24 hodin. Pokud sis účet nezakládal/a, tento e-mail ignoruj.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2>Vítej v PrvníProjekt!</h2>
      <p>Pro dokončení registrace potvrď svou e-mailovou adresu:</p>
      <p>
        <a href="${link}"
           style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:10px 20px;border-radius:9999px">
          Potvrdit e-mail
        </a>
      </p>
      <p style="color:#666;font-size:13px">
        Nebo zkopíruj odkaz: <br /><a href="${link}">${link}</a>
      </p>
      <p style="color:#666;font-size:13px">
        Odkaz platí 24 hodin. Pokud sis účet nezakládal/a, tento e-mail ignoruj.
      </p>
    </div>`;

  return sendEmail({ to, subject, html, text });
}
