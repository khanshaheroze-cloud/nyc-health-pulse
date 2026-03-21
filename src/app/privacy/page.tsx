import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pulse NYC privacy policy — what data we collect, how we use it, and your rights.",
};

const LAST_UPDATED = "March 4, 2026";

export default function PrivacyPage() {
  return (
    <SectionShell
      icon="🔒"
      title="Privacy Policy"
      description={`Last updated ${LAST_UPDATED}`}
      accentColor="rgba(91,156,245,.10)"
    >
      <div className="max-w-3xl mx-auto space-y-6 text-[13px] text-dim leading-relaxed">

        <Section title="Overview">
          <p>
            Pulse NYC is a free public health information dashboard. We do not require accounts,
            do not track individual users, and do not sell any data. This policy explains the
            limited data interactions that occur when you use the app.
          </p>
        </Section>

        <Section title="Data We Do NOT Collect">
          <ul className="space-y-1.5">
            {[
              "We do not require account creation or login.",
              "We do not collect your name, location, age, or any personally identifying information.",
              "We do not use cookies or cross-site tracking.",
              "We do not run advertising networks or sell data to third parties.",
              "We do not use Google Analytics, Meta Pixel, or any behavioral tracking services.",
            ].map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-hp-green flex-shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Data Stored on Your Device">
          <p>
            Pulse NYC stores a small amount of data in your browser&apos;s <strong className="text-text">localStorage</strong> — this data never leaves your device:
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex gap-2">
              <span className="text-hp-blue flex-shrink-0">•</span>
              <span><strong className="text-text">Saved neighborhoods</strong> — the list of UHF neighborhoods you star/save is stored locally under the key <code className="bg-border/60 px-1 rounded text-[11px]">pulse-saved-neighborhoods</code>. You can clear this at any time by clicking "Clear all" in the saved panel or clearing your browser storage.</span>
            </li>
          </ul>
          <p className="mt-2">
            No localStorage data is transmitted to our servers.
          </p>
        </Section>

        <Section title="Email Newsletter (Optional)">
          <p>
            If you choose to subscribe to the weekly health digest, we collect only your
            <strong className="text-text"> email address</strong>. This is processed through
            <strong className="text-text"> Resend</strong> (resend.com), our transactional
            email provider. Your email is:
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex gap-2"><span className="text-hp-blue flex-shrink-0">•</span><span>Used only to send the weekly Pulse NYC digest</span></li>
            <li className="flex gap-2"><span className="text-hp-blue flex-shrink-0">•</span><span>Never shared with third parties or used for advertising</span></li>
            <li className="flex gap-2"><span className="text-hp-blue flex-shrink-0">•</span><span>Removable at any time — email <a href="mailto:unsubscribe@pulsenyc.app" className="text-hp-blue hover:underline">unsubscribe@pulsenyc.app</a> or use the unsubscribe link in any digest</span></li>
          </ul>
          <p className="mt-2 text-muted text-[11px]">
            Resend&apos;s privacy policy: <a href="https://resend.com/legal/privacy-policy" className="text-hp-blue hover:underline" target="_blank" rel="noreferrer">resend.com/legal/privacy-policy</a>
          </p>
        </Section>

        <Section title="Server Logs">
          <p>
            Pulse NYC is hosted on <strong className="text-text">Vercel</strong> (vercel.com).
            Vercel automatically retains standard web server logs (IP address, browser type,
            pages visited, timestamps) for security and performance purposes. These logs are
            retained for up to 30 days per Vercel&apos;s policy and are not accessible to or
            analyzed by Pulse NYC operators for any user-level tracking.
          </p>
          <p className="mt-2 text-muted text-[11px]">
            Vercel&apos;s privacy policy: <a href="https://vercel.com/legal/privacy-policy" className="text-hp-blue hover:underline" target="_blank" rel="noreferrer">vercel.com/legal/privacy-policy</a>
          </p>
        </Section>

        <Section title="Data Sources">
          <p>
            All health data displayed in Pulse NYC comes from official government and public sources.
            We access these through their public APIs — no personal health information is involved.
            Sources include:
          </p>
          <ul className="mt-2 space-y-1 text-[12px]">
            {[
              "NYC Department of Health and Mental Hygiene (DOHMH)",
              "U.S. Census Bureau — American Community Survey (ACS)",
              "CDC PLACES — Centers for Disease Control and Prevention",
              "EPA AirNow — U.S. Environmental Protection Agency",
              "NYC Open Data (Socrata) — data.cityofnewyork.us",
            ].map(s => (
              <li key={s} className="flex gap-2">
                <span className="text-muted flex-shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Browser Notifications (Optional)">
          <p>
            On the Air Quality page, you may opt in to receive browser push notifications when
            the AQI rises above 100 (Unhealthy for Sensitive Groups). This uses the
            <strong className="text-text"> Web Notifications API</strong> — your browser manages
            permission. No notification data is stored on our servers. You can revoke permission
            at any time in your browser settings.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            Pulse NYC does not knowingly collect any information from children under 13. The app
            displays publicly available government health statistics and is informational only.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If we make material changes to this policy, we will update the "Last updated" date
            at the top of this page. Continued use of the app after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this privacy policy? Email{" "}
            <a href="mailto:privacy@pulsenyc.app" className="text-hp-blue hover:underline">
              privacy@pulsenyc.app
            </a>
          </p>
        </Section>

      </div>
    </SectionShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-[14px] font-bold text-text mb-3">{title}</h2>
      <div className="text-[13px] text-dim leading-relaxed">{children}</div>
    </div>
  );
}
