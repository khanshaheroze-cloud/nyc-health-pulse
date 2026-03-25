"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Violation {
  violationid?: string;
  housenumber?: string;
  streetname?: string;
  apartment?: string;
  zip?: string;
  currentstatus?: string;
  currentstatusdate?: string;
  class?: string;
  novdescription?: string;
  inspectiondate?: string;
}

interface HpdComplaint {
  complaintid?: string;
  status?: string;
  statusdate?: string;
  majorcategory?: string;
  minorcategory?: string;
}

interface DobViolation {
  id?: string;
  type?: string;
  category?: string;
  date?: string;
  dispositionDate?: string;
  dispositionComments?: string;
  ecbPenaltyStatus?: string;
}

interface EcbViolation {
  id?: string;
  status?: string;
  type?: string;
  date?: string;
  penaltyDue: number;
  amountPaid: number;
  severity?: string;
}

interface ThreeOneOne {
  id?: string;
  date?: string;
  type?: string;
  descriptor?: string;
  status?: string;
  resolution?: string;
  borough?: string;
}

interface Summary {
  hpdViolations: number;
  hpdOpen: number;
  classA: number;
  classB: number;
  classC: number;
  openClassC: number;
  hpdComplaints: number;
  openHpdComplaints: number;
  recentHpdComplaints: number;
  dobViolations: number;
  ecbViolations: number;
  ecbPenaltyDue: number;
  ecbAmountPaid: number;
  threeOneOne: number;
}

interface SearchResult {
  address: string;
  score: number;
  grade: string;
  violations: Violation[];
  hpdComplaints: HpdComplaint[];
  dobViolations: DobViolation[];
  ecbViolations: EcbViolation[];
  threeOneOne: ThreeOneOne[];
  summary: Summary;
  error?: string;
}

type Tab = "overview" | "hpd-violations" | "hpd-complaints" | "dob-violations" | "ecb-fines" | "311";

const BOROUGHS = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function gradeStyle(grade: string) {
  if (grade === "A") return { color: "text-hp-green", bg: "bg-hp-green/10", border: "border-hp-green/25" };
  if (grade === "B") return { color: "text-hp-blue", bg: "bg-hp-blue/10", border: "border-hp-blue/25" };
  if (grade === "C") return { color: "text-hp-yellow", bg: "bg-hp-yellow/10", border: "border-hp-yellow/25" };
  if (grade === "D") return { color: "text-hp-orange", bg: "bg-hp-orange/10", border: "border-hp-orange/25" };
  return { color: "text-hp-red", bg: "bg-hp-red/10", border: "border-hp-red/25" };
}

function statusDot(bad: boolean) {
  return bad
    ? <span className="w-2 h-2 rounded-full bg-hp-red flex-shrink-0" />
    : <span className="w-2 h-2 rounded-full bg-hp-green flex-shrink-0" />;
}

function warningDot(warn: boolean) {
  return warn
    ? <span className="w-2 h-2 rounded-full bg-hp-orange flex-shrink-0" />
    : <span className="w-2 h-2 rounded-full bg-hp-green flex-shrink-0" />;
}

function classBadge(cls?: string) {
  const style = cls === "C" ? "bg-hp-red/15 text-hp-red border-hp-red/20"
    : cls === "B" ? "bg-hp-orange/15 text-hp-orange border-hp-orange/20"
    : "bg-dim/10 text-dim border-border";
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${style}`}>{cls ?? "?"}</span>;
}

function fmtDate(d?: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function BuildingHealthSearch() {
  const [address, setAddress] = useState("");
  const [borough, setBorough] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  async function handleSearch() {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setTab("overview");

    try {
      const params = new URLSearchParams({ address: address.trim() });
      if (borough) params.set("borough", borough);
      if (zip) params.set("zip", zip);

      const res = await fetch(`/api/building-health?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch building data");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const s = result?.summary;
  const gs = result ? gradeStyle(result.grade) : null;

  const TABS: { key: Tab; label: string; count?: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "hpd-violations", label: "HPD Violations", count: s ? String(s.hpdViolations) : undefined },
    { key: "hpd-complaints", label: "HPD Complaints", count: s ? String(s.hpdComplaints) : undefined },
    { key: "dob-violations", label: "DOB Violations", count: s ? String(s.dobViolations) : undefined },
    { key: "ecb-fines", label: "ECB Fines", count: s && s.ecbPenaltyDue > 0 ? fmtMoney(s.ecbPenaltyDue) : s ? "$0" : undefined },
    { key: "311", label: "311 History", count: s ? String(s.threeOneOne) : undefined },
  ];

  return (
    <div className="space-y-4">
      {/* Search form */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">Street Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="e.g. 123 Main St" className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text placeholder:text-muted focus-ring" />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">Borough</label>
            <select value={borough} onChange={(e) => setBorough(e.target.value)} className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-hp-green/40 focus:ring-1 focus:ring-hp-green/20 transition-colors">
              <option value="">Any borough</option>
              {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">Zip Code</label>
            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Optional" maxLength={5} className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:border-hp-green/40 focus:ring-1 focus:ring-hp-green/20 transition-colors" />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button onClick={handleSearch} disabled={loading || !address.trim()} className="w-full px-4 py-2 text-[13px] font-semibold rounded-lg bg-hp-green text-white hover:bg-hp-green/90 btn-press disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching</span> : "Search"}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted mt-2">
          Queries 5 NYC datasets: HPD violations &amp; complaints, DOB violations, ECB fines, and 311 history.
        </p>
      </div>

      {error && <div className="bg-hp-red/8 border border-hp-red/20 rounded-xl p-4 text-[13px] text-hp-red">{error}</div>}

      {/* ── Results ──────────────────────────────────────────────────── */}
      {result && s && gs && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === t.key ? "bg-hp-green/12 text-hp-green border border-hp-green/25" : "bg-surface border border-border text-dim hover:text-text"
                }`}
              >
                {t.label}
                {t.count != null && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tab === t.key ? "bg-hp-green/15" : "bg-bg"}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className={`${gs.bg} border ${gs.border} rounded-xl p-5`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${gs.bg} border-2 ${gs.border}`}>
                  <span className={`font-display text-3xl font-bold ${gs.color}`}>{result.grade}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-text">🏢 {result.address}</h3>
                  <p className={`text-[13px] font-semibold ${gs.color}`}>Building Health Score: {result.score}/100</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 py-2 px-3 bg-surface/60 rounded-lg">
                  {statusDot(s.openClassC > 0)}
                  <span className="text-[12px] text-text flex-1">HPD Violations</span>
                  <span className="text-[12px] font-bold text-text">{s.hpdViolations}</span>
                  {s.openClassC > 0 && <span className="text-[10px] text-hp-red font-semibold">({s.openClassC} Class C open)</span>}
                  {s.hpdOpen > 0 && s.openClassC === 0 && <span className="text-[10px] text-hp-orange font-semibold">({s.hpdOpen} open)</span>}
                </div>
                <div className="flex items-center gap-3 py-2 px-3 bg-surface/60 rounded-lg">
                  {warningDot(s.openHpdComplaints > 0)}
                  <span className="text-[12px] text-text flex-1">HPD Complaints</span>
                  <span className="text-[12px] font-bold text-text">{s.hpdComplaints}</span>
                  {s.openHpdComplaints > 0 && <span className="text-[10px] text-hp-orange font-semibold">({s.openHpdComplaints} open)</span>}
                </div>
                <div className="flex items-center gap-3 py-2 px-3 bg-surface/60 rounded-lg">
                  {warningDot(s.dobViolations > 0)}
                  <span className="text-[12px] text-text flex-1">DOB Violations</span>
                  <span className="text-[12px] font-bold text-text">{s.dobViolations}</span>
                </div>
                <div className="flex items-center gap-3 py-2 px-3 bg-surface/60 rounded-lg">
                  {statusDot(s.ecbPenaltyDue > 500)}
                  <span className="text-[12px] text-text flex-1">ECB Fines</span>
                  <span className="text-[12px] font-bold text-text">{fmtMoney(s.ecbPenaltyDue)}</span>
                  {s.ecbPenaltyDue > 0 && <span className="text-[10px] text-muted">outstanding</span>}
                </div>
                <div className="flex items-center gap-3 py-2 px-3 bg-surface/60 rounded-lg">
                  {warningDot(s.threeOneOne > 5)}
                  <span className="text-[12px] text-text flex-1">311 Complaints</span>
                  <span className="text-[12px] font-bold text-text">{s.threeOneOne}</span>
                  <span className="text-[10px] text-muted">recent</span>
                </div>
              </div>

              {s.openClassC > 0 && (
                <div className="bg-hp-red/8 border border-hp-red/20 rounded-lg px-4 py-3 mb-3">
                  <p className="text-[12px] font-bold text-hp-red">
                    ⚠️ {s.openClassC} OPEN CLASS C VIOLATION{s.openClassC > 1 ? "S" : ""} — Landlord must fix within 24 hours
                  </p>
                  {result.violations.find((v) => v.class === "C" && v.currentstatus?.toUpperCase() === "VIOLATION OPEN")?.novdescription && (
                    <p className="text-[11px] text-dim mt-1">
                      Most recent: &ldquo;{result.violations.find((v) => v.class === "C" && v.currentstatus?.toUpperCase() === "VIOLATION OPEN")!.novdescription!.slice(0, 120)}...&rdquo;
                    </p>
                  )}
                </div>
              )}

              {s.hpdViolations > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] text-muted mb-1">HPD Violation Classes</p>
                  <div className="flex h-3 rounded-full overflow-hidden bg-bg">
                    {s.classA > 0 && <div className="bg-dim/30" style={{ width: `${(s.classA / s.hpdViolations) * 100}%` }} />}
                    {s.classB > 0 && <div className="bg-hp-orange/50" style={{ width: `${(s.classB / s.hpdViolations) * 100}%` }} />}
                    {s.classC > 0 && <div className="bg-hp-red/60" style={{ width: `${(s.classC / s.hpdViolations) * 100}%` }} />}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-dim">A: {s.classA}</span>
                    <span className="text-[10px] text-hp-orange">B: {s.classB}</span>
                    <span className="text-[10px] text-hp-red">C: {s.classC}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <Link href="/neighborhood" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-semibold text-dim hover:text-text hover:border-hp-green/30 transition-all">
                  📍 Neighborhood profile
                </Link>
                <Link href="/food-safety" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-semibold text-dim hover:text-text hover:border-hp-green/30 transition-all">
                  🍽️ Restaurant grades nearby
                </Link>
              </div>
            </div>
          )}

          {/* ── HPD VIOLATIONS TAB ───────────────────────────────────── */}
          {tab === "hpd-violations" && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">HPD Violations ({s.hpdViolations}{s.hpdViolations >= 200 ? "+" : ""})</h4>
              {result.violations.length === 0 ? (
                <p className="text-[12px] text-dim">No HPD violations found.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {result.violations.map((v, i) => (
                    <div key={v.violationid || i} className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {classBadge(v.class)}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${v.currentstatus?.toUpperCase() === "VIOLATION OPEN" ? "bg-hp-red/10 text-hp-red" : "bg-hp-green/10 text-hp-green"}`}>
                            {v.currentstatus?.toUpperCase() === "VIOLATION OPEN" ? "Open" : "Closed"}
                          </span>
                          {v.apartment && <span className="text-[10px] text-muted">Apt {v.apartment}</span>}
                        </div>
                        <span className="text-[10px] text-muted flex-shrink-0">{fmtDate(v.inspectiondate)}</span>
                      </div>
                      {v.novdescription && <p className="text-[11px] text-dim leading-relaxed mt-1">{v.novdescription}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HPD COMPLAINTS TAB ───────────────────────────────────── */}
          {tab === "hpd-complaints" && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">HPD Complaints ({s.hpdComplaints})</h4>
              {result.hpdComplaints.length === 0 ? (
                <p className="text-[12px] text-dim">No HPD complaints found.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {result.hpdComplaints.map((c, i) => (
                    <div key={c.complaintid || i} className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold text-text">{c.majorcategory || "General"}</p>
                          {c.minorcategory && <p className="text-[11px] text-dim">{c.minorcategory}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.status?.toUpperCase() === "CLOSE" ? "bg-hp-green/10 text-hp-green" : "bg-hp-orange/10 text-hp-orange"}`}>
                            {c.status || "Unknown"}
                          </span>
                          <p className="text-[10px] text-muted mt-0.5">{fmtDate(c.statusdate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DOB VIOLATIONS TAB ───────────────────────────────────── */}
          {tab === "dob-violations" && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">DOB Violations ({s.dobViolations})</h4>
              {result.dobViolations.length === 0 ? (
                <p className="text-[12px] text-dim">No DOB violations found.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {result.dobViolations.map((d, i) => (
                    <div key={d.id || i} className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold text-text">{d.type || "Violation"}</p>
                          {d.category && <p className="text-[11px] text-dim">{d.category}</p>}
                          {d.dispositionComments && <p className="text-[10px] text-muted mt-1">{d.dispositionComments}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {d.ecbPenaltyStatus && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${d.ecbPenaltyStatus?.toUpperCase().includes("PAID") ? "bg-hp-green/10 text-hp-green" : "bg-hp-orange/10 text-hp-orange"}`}>
                              {d.ecbPenaltyStatus}
                            </span>
                          )}
                          <p className="text-[10px] text-muted mt-0.5">{fmtDate(d.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ECB FINES TAB ────────────────────────────────────────── */}
          {tab === "ecb-fines" && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">
                ECB/OATH Fines ({s.ecbViolations})
                {s.ecbPenaltyDue > 0 && <span className="text-hp-red ml-2">{fmtMoney(s.ecbPenaltyDue)} outstanding</span>}
              </h4>
              {s.ecbAmountPaid > 0 && <p className="text-[11px] text-hp-green mb-3">{fmtMoney(s.ecbAmountPaid)} already paid</p>}
              {result.ecbViolations.length === 0 ? (
                <p className="text-[12px] text-dim">No ECB/OATH violations found.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {result.ecbViolations.map((e, i) => (
                    <div key={e.id || i} className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold text-text">{e.type || "Violation"}</p>
                          {e.severity && <p className="text-[11px] text-dim">Severity: {e.severity}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {e.penaltyDue > 0 && <p className="text-[12px] font-bold text-hp-red">{fmtMoney(e.penaltyDue)}</p>}
                          {e.status && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${e.status?.toUpperCase().includes("RESOLVE") || e.status?.toUpperCase().includes("PAID") ? "bg-hp-green/10 text-hp-green" : "bg-hp-orange/10 text-hp-orange"}`}>
                              {e.status}
                            </span>
                          )}
                          <p className="text-[10px] text-muted mt-0.5">{fmtDate(e.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 311 HISTORY TAB ──────────────────────────────────────── */}
          {tab === "311" && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">311 Complaint History ({s.threeOneOne})</h4>
              {result.threeOneOne.length === 0 ? (
                <p className="text-[12px] text-dim">No 311 complaints found for this address.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {result.threeOneOne.map((t, i) => (
                    <div key={t.id || i} className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold text-text">{t.type}</p>
                          {t.descriptor && <p className="text-[11px] text-dim">{t.descriptor}</p>}
                          {t.resolution && <p className="text-[10px] text-muted mt-1">{t.resolution}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.status?.toUpperCase() === "CLOSED" || t.status?.toUpperCase() === "CLOSE" ? "bg-hp-green/10 text-hp-green" : "bg-hp-orange/10 text-hp-orange"}`}>
                            {t.status || "Open"}
                          </span>
                          <p className="text-[10px] text-muted mt-0.5">{fmtDate(t.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No results across all datasets */}
          {s.hpdViolations === 0 && s.hpdComplaints === 0 && s.dobViolations === 0 && s.ecbViolations === 0 && s.threeOneOne === 0 && (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-dim text-sm">No records found for this address across any dataset.</p>
              <p className="text-muted text-xs mt-1">Try adjusting the search or adding a borough. Some datasets only cover residential buildings.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
