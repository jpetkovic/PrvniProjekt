import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

// Diagnostic endpoint: sends a single test e-mail to verify the Resend setup.
export async function POST(request: Request) {
  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const to = body.to?.trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Zadej platný e-mail" }, { status: 400 });
  }

  try {
    const result = await sendEmail({
      to,
      subject: "Testovací e-mail z PrvniProjekt",
      text: "Toto je testovací e-mail ověřující odesílání přes Resend. Pokud ti dorazil, odesílání funguje.",
      html: `<div style="font-family:system-ui,sans-serif">
        <h2>Testovací e-mail ✅</h2>
        <p>Toto je testovací e-mail z aplikace <strong>PrvniProjekt</strong>.</p>
        <p>Pokud ti dorazil, odesílání přes Resend funguje.</p>
      </div>`,
    });

    return NextResponse.json({
      ok: true,
      delivered: result.delivered,
      message: result.delivered
        ? `Testovací e-mail byl odeslán na ${to}.`
        : "Odesílání není nastavené (chybí RESEND_API_KEY) — e-mail by se jen vypsal do konzole.",
    });
  } catch (error) {
    console.error("Test e-mail failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Odeslání selhalo",
      },
      { status: 500 }
    );
  }
}
