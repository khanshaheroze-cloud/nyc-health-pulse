import { NextResponse } from "next/server";
import { Resend } from "resend";
import { neighborhoods } from "@/lib/neighborhoodData";
import {
  fetchCitywideAirQuality,
  fetchCovidByBorough,
  fetchCriticalViolationsCount,
  fetchWaterQuality,
} from "@/lib/liveData";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.DIGEST_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const fromEmail = process.env.DIGEST_FROM_EMAIL ?? "Pulse NYC <updates@pulsenyc.app>";

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const resend = new Resend(apiKey);

  // Fetch live KPIs
  const [airData, covidData, violations, waterData] = await Promise.all([
    fetchCitywideAirQuality(),
    fetchCovidByBorough(),
    fetchCriticalViolationsCount(),
    fetchWaterQuality(),
  ]);

  const pm25 = airData?.pm25.toFixed(1) ?? "6.7";
  const totalHosp = covidData?.reduce((s, d) => s + d.hosp, 0) ?? 1763;
  const critViol = violations ?? 990;
  const waterPct = waterData
    ? ((1 - waterData.coliformDetected / waterData.totalSamples) * 100).toFixed(1)
    : "99.9";

  // Neighborhood spotlight (week-of-year index)
  const weekOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const spotlight = neighborhoods[weekOfYear % neighborhoods.length];

  // Fetch top headlines
  let headlines: { title: string; url: string; source: string }[] = [];
  try {
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const newsRes = await fetch(`${origin}/api/news`);
    const newsData = await newsRes.json();
    headlines = (newsData.items ?? []).slice(0, 3);
  } catch {
    // skip
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#FAFAF7;color:#1A1D1A;font-family:'Plus Jakarta Sans',system-ui,sans-serif;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">

    <!-- Header -->
    <div style="background:#ffffff;border:1px solid #E8E4DE;border-radius:16px;padding:24px;margin-bottom:20px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(45,212,160,0.10);border:1px solid rgba(45,212,160,0.20);border-radius:100px;padding:4px 12px;margin-bottom:12px">
        <span style="width:6px;height:6px;border-radius:50%;background:#6B9E7A;display:inline-block"></span>
        <span style="color:#4A7C59;font-size:11px;font-weight:700;letter-spacing:2px">WEEKLY DIGEST</span>
      </div>
      <h1 style="margin:0 0 4px;font-size:28px;font-weight:900;color:#1A1D1A">Pulse NYC</h1>
      <p style="margin:0;color:#5C635C;font-size:13px">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
    </div>

    <!-- KPIs -->
    <div style="margin-bottom:20px">
      <h2 style="color:#1A1D1A;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">This Week's Metrics</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${[
          { label: "Air Quality (PM2.5)", value: `${pm25} μg/m³`, color: "#4A7C59" },
          { label: "COVID Hosp (90d)",    value: totalHosp.toLocaleString(), color: "#2850AD" },
          { label: "Critical Food Violations", value: critViol.toLocaleString(), color: "#7c3aed" },
          { label: "Water Safety",        value: `${waterPct}% clean`, color: "#0891b2" },
        ].map(({ label, value, color }) => `
        <div style="background:#ffffff;border:1px solid #E8E4DE;border-radius:12px;padding:16px;border-top:3px solid ${color}">
          <div style="color:#5C635C;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">${label}</div>
          <div style="color:${color};font-size:24px;font-weight:700">${value}</div>
        </div>`).join("")}
      </div>
    </div>

    ${headlines.length > 0 ? `
    <!-- Headlines -->
    <div style="margin-bottom:20px">
      <h2 style="color:#1A1D1A;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">NYC Health Headlines</h2>
      <div style="background:#ffffff;border:1px solid #E8E4DE;border-radius:12px;overflow:hidden">
        ${headlines.map((h, i) => `
        <a href="${h.url}" style="display:block;padding:14px 16px;text-decoration:none;${i > 0 ? "border-top:1px solid #e2e8e4;" : ""}">
          <div style="color:#8A918A;font-size:10px;margin-bottom:4px">${h.source}</div>
          <div style="color:#1A1D1A;font-size:13px;line-height:1.4">${h.title}</div>
        </a>`).join("")}
      </div>
    </div>
    ` : ""}

    <!-- Neighborhood spotlight -->
    <div style="margin-bottom:20px">
      <h2 style="color:#1A1D1A;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px">Neighborhood Spotlight</h2>
      <div style="background:#ffffff;border:1px solid #E8E4DE;border-radius:12px;padding:16px">
        <div style="margin-bottom:12px">
          <div style="color:#1A1D1A;font-size:16px;font-weight:700">${spotlight.name}</div>
          <div style="color:#5C635C;font-size:11px">${spotlight.borough} · Pop. ${spotlight.population.toLocaleString()}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="color:#8A918A;font-size:9px;text-transform:uppercase;letter-spacing:1px">Asthma ED</div><div style="color:#dc2626;font-size:14px;font-weight:600">${spotlight.metrics.asthmaED}/10K</div></div>
          <div><div style="color:#8A918A;font-size:9px;text-transform:uppercase;letter-spacing:1px">Life Exp.</div><div style="color:#4A7C59;font-size:14px;font-weight:600">${spotlight.metrics.lifeExp}y</div></div>
          <div><div style="color:#8A918A;font-size:9px;text-transform:uppercase;letter-spacing:1px">Poverty</div><div style="color:#d97706;font-size:14px;font-weight:600">${spotlight.metrics.poverty}%</div></div>
        </div>
        <a href="https://pulsenyc.app/neighborhood/${spotlight.slug}" style="display:inline-block;margin-top:12px;color:#2850AD;font-size:11px;font-weight:600;text-decoration:none">View full profile →</a>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px">
      <a href="https://pulsenyc.app" style="display:inline-block;background:#4A7C59;color:#ffffff;font-size:13px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none">
        View Live Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8e4;padding-top:16px;text-align:center">
      <p style="color:#8A918A;font-size:10px;margin:0">Pulse NYC · pulsenyc.app · Weekly digest</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Frequency filter: ?frequency=daily sends only to daily subscribers
  const url = new URL(req.url);
  const reqFreq = url.searchParams.get("frequency") ?? "weekly";
  const isDaily = reqFreq === "daily";
  const subjectLabel = isDaily ? "Daily" : "Weekly";

  // Get contacts — firstName stores frequency preference ("daily" or "weekly")
  let contacts: { email: string; firstName?: string | null }[] = [];
  try {
    const listRes = await resend.contacts.list({ audienceId });
    const all = (listRes.data?.data ?? []).filter(
      (c: { unsubscribed?: boolean }) => !c.unsubscribed
    ) as { email: string; firstName?: string | null }[];
    // Daily cron sends to daily subscribers; weekly cron sends to weekly + unset
    contacts = isDaily
      ? all.filter(c => c.firstName === "daily")
      : all.filter(c => c.firstName !== "daily");
  } catch {
    return NextResponse.json({ error: "Failed to fetch contacts." }, { status: 500 });
  }

  let sent = 0;
  for (const contact of contacts) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: contact.email,
        subject: `Pulse NYC — ${subjectLabel} Digest ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        html,
      });
      sent++;
    } catch {
      // skip failed sends
    }
  }

  return NextResponse.json({ sent, frequency: reqFreq });
}
