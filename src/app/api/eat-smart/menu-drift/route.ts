import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CHAIN_DIR = path.join(process.cwd(), "src/data/eat-smart/menus");
const TEMPLATE_DIR = path.join(process.cwd(), "src/data/eat-smart/cuisine-templates");
const CHAIN_SLA = 90;
const TEMPLATE_SLA = 180;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

interface DriftIssue {
  file: string;
  type: "chain" | "template";
  issue: string;
  severity: "warning" | "critical";
}

function scanForDrift(dir: string, sla: number, type: "chain" | "template"): DriftIssue[] {
  const issues: DriftIssue[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    const name = file.replace(".ts", "");

    const lastUpdatedMatch = content.match(/lastUpdated:\s*"([^"]+)"/);
    if (lastUpdatedMatch) {
      const days = daysSince(lastUpdatedMatch[1]);
      if (days > sla) {
        issues.push({ file: name, type, issue: `Menu is ${days}d old (SLA: ${sla}d)`, severity: "critical" });
      } else if (days > sla * 0.75) {
        issues.push({ file: name, type, issue: `Menu is ${days}d old — approaching ${sla}d SLA`, severity: "warning" });
      }
    }

    const verifiedDates = [...content.matchAll(/lastVerified:\s*"([^"]+)"/g)].map((m) => m[1]);
    if (type === "chain" && verifiedDates.length === 0) {
      issues.push({ file: name, type, issue: "No source references found", severity: "warning" });
    }

    if (verifiedDates.length > 0) {
      const oldest = verifiedDates.sort()[0];
      const vDays = daysSince(oldest);
      if (vDays > sla) {
        issues.push({ file: name, type, issue: `Oldest source verification is ${vDays}d old`, severity: "critical" });
      }
    }

    const itemCount = (content.match(/id:\s*"/g) || []).length;
    if (type === "chain" && itemCount < 10) {
      issues.push({ file: name, type, issue: `Only ${itemCount} items (target: 12-15)`, severity: "warning" });
    }
    if (type === "template" && itemCount < 8) {
      issues.push({ file: name, type, issue: `Only ${itemCount} items (target: 10-12)`, severity: "warning" });
    }
  }

  return issues;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.DIGEST_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chainIssues = scanForDrift(CHAIN_DIR, CHAIN_SLA, "chain");
  const templateIssues = scanForDrift(TEMPLATE_DIR, TEMPLATE_SLA, "template");
  const allIssues = [...chainIssues, ...templateIssues];

  const critical = allIssues.filter((i) => i.severity === "critical");
  const warnings = allIssues.filter((i) => i.severity === "warning");

  if (critical.length > 0) {
    console.warn(`[menu-drift] ${critical.length} critical issue(s) found`);
    for (const c of critical) console.warn(`  ❌ ${c.type}/${c.file}: ${c.issue}`);
  }

  return NextResponse.json({
    scannedAt: new Date().toISOString(),
    summary: {
      totalChains: fs.readdirSync(CHAIN_DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts").length,
      totalTemplates: fs.readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts").length,
      criticalCount: critical.length,
      warningCount: warnings.length,
      healthy: allIssues.length === 0,
    },
    issues: allIssues,
  });
}
