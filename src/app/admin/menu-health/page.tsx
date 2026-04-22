import { Metadata } from "next";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Menu Health Dashboard | Pulse NYC Admin",
  robots: "noindex, nofollow",
};

const CHAIN_DIR = path.join(process.cwd(), "src/data/eat-smart/menus");
const TEMPLATE_DIR = path.join(process.cwd(), "src/data/eat-smart/cuisine-templates");
const CHAIN_SLA = 90;
const TEMPLATE_SLA = 180;

interface MenuStatus {
  file: string;
  name: string;
  itemCount: number;
  lastUpdated: string | null;
  ageDays: number | null;
  oldestVerified: string | null;
  verifiedDays: number | null;
  hasSourceRefs: boolean;
  sla: number;
  status: "fresh" | "aging" | "stale";
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function scanDir(dir: string, sla: number): MenuStatus[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
  return files.sort().map((file) => {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const itemCount = (content.match(/id:\s*"/g) || []).length;
    const lastUpdatedMatch = content.match(/lastUpdated:\s*"([^"]+)"/);
    const lastUpdated = lastUpdatedMatch?.[1] ?? null;
    const ageDays = daysSince(lastUpdated);
    const verifiedDates = [...content.matchAll(/lastVerified:\s*"([^"]+)"/g)].map((m) => m[1]);
    const oldestVerified = verifiedDates.length > 0 ? verifiedDates.sort()[0] : null;
    const verifiedDays = daysSince(oldestVerified);
    const hasSourceRefs = verifiedDates.length > 0;
    const status: MenuStatus["status"] =
      ageDays !== null && ageDays > sla ? "stale" : ageDays !== null && ageDays > sla * 0.5 ? "aging" : "fresh";
    return { file: file.replace(".ts", ""), name: file.replace(".ts", ""), itemCount, lastUpdated, ageDays, oldestVerified, verifiedDays, hasSourceRefs, sla, status };
  });
}

export default function MenuHealthPage() {
  const chains = scanDir(CHAIN_DIR, CHAIN_SLA);
  const templates = scanDir(TEMPLATE_DIR, TEMPLATE_SLA);
  const totalItems = chains.reduce((s, c) => s + c.itemCount, 0);
  const staleCount = [...chains, ...templates].filter((m) => m.status === "stale").length;
  const agingCount = [...chains, ...templates].filter((m) => m.status === "aging").length;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 font-[family-name:var(--font-dm-sans)]">
      <h1 className="text-2xl font-bold text-hp-text mb-1">Menu Health Dashboard</h1>
      <p className="text-hp-dim text-sm mb-8">Internal tool — monitors Eat Smart menu freshness and coverage.</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Kpi label="Chain Menus" value={chains.length} />
        <Kpi label="Templates" value={templates.length} />
        <Kpi label="Total Items" value={totalItems} />
        <Kpi label="Issues" value={staleCount + agingCount} color={staleCount > 0 ? "red" : agingCount > 0 ? "amber" : "green"} />
      </div>

      {/* Chain table */}
      <h2 className="text-lg font-semibold text-hp-text mb-3">Chain Menus <span className="text-hp-dim text-sm font-normal">({CHAIN_SLA}-day SLA)</span></h2>
      <MenuTable rows={chains} />

      {/* Template table */}
      <h2 className="text-lg font-semibold text-hp-text mt-8 mb-3">Cuisine Templates <span className="text-hp-dim text-sm font-normal">({TEMPLATE_SLA}-day SLA)</span></h2>
      <MenuTable rows={templates} />

      <p className="text-xs text-hp-muted mt-8">
        Generated at build time. Run <code className="bg-hp-surface px-1 rounded">npm run audit-menus</code> for CLI output.
      </p>
    </main>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  const c = color === "red" ? "text-hp-red" : color === "amber" ? "text-hp-orange" : color === "green" ? "text-hp-green" : "text-hp-text";
  return (
    <div className="bg-white rounded-xl border border-hp-border p-4">
      <p className="text-xs text-hp-dim uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${c} font-[family-name:var(--font-fraunces)]`}>{value}</p>
    </div>
  );
}

function MenuTable({ rows }: { rows: MenuStatus[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hp-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-hp-surface text-hp-dim text-left">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium text-center">Items</th>
            <th className="px-3 py-2 font-medium">Last Updated</th>
            <th className="px-3 py-2 font-medium">Oldest Verified</th>
            <th className="px-3 py-2 font-medium text-center">Sources</th>
            <th className="px-3 py-2 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.file} className="border-t border-hp-border hover:bg-hp-surface/50">
              <td className="px-3 py-2 font-medium text-hp-text">{r.name}</td>
              <td className="px-3 py-2 text-center">{r.itemCount}</td>
              <td className="px-3 py-2 text-hp-dim">{r.lastUpdated ?? "—"} <span className="text-hp-muted">({r.ageDays ?? "?"}d)</span></td>
              <td className="px-3 py-2 text-hp-dim">{r.oldestVerified ?? "—"} {r.verifiedDays !== null && <span className="text-hp-muted">({r.verifiedDays}d)</span>}</td>
              <td className="px-3 py-2 text-center">{r.hasSourceRefs ? "✓" : "✗"}</td>
              <td className="px-3 py-2 text-center">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: MenuStatus["status"] }) {
  if (status === "stale") return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Stale</span>;
  if (status === "aging") return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Aging</span>;
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Fresh</span>;
}
