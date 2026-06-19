// Minimal, dependency-free e-mail sender.
//
// In production set RESEND_API_KEY and EMAIL_FROM to send real e-mails via the
// Resend HTTP API (https://resend.com). Without an API key (e.g. local dev) the
// message is logged to the console so the flow stays testable.

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set — would send to ${to}\nSubject: ${subject}\n${text ?? html}`
    );
    return { delivered: false as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`E-mail se nepodařilo odeslat: ${res.status} ${detail}`);
  }

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
