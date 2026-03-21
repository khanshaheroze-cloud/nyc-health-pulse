"use client";

import { useState } from "react";

interface Violation {
  violationid?: string;
  boroid?: string;
  block?: string;
  lot?: string;
  streetname?: string;
  housenumber?: string;
  apartment?: string;
  zip?: string;
  currentstatus?: string;
  currentstatusdate?: string;
  violationstatus?: string;
  class?: string;
  novdescription?: string;
  inspectiondate?: string;
}

interface Complaint {
  complaintid?: string;
  status?: string;
  statusdate?: string;
  statusid?: string;
  majorcategory?: string;
  minorcategory?: string;
}

interface Summary {
  total: number;
  open: number;
  classA: number;
  classB: number;
  classC: number;
  recentComplaints: number;
}

interface SearchResult {
  violations: Violation[];
  complaints: Complaint[];
  summary: Summary;
  error?: string;
}

const BOROUGHS = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];

// NYC average open violations per building (rough estimate from HPD data)
const NYC_AVG_OPEN_VIOLATIONS = 4;

function classBadge(cls?: string) {
  switch (cls) {
    case "C":
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-hp-red/15 text-hp-red border border-hp-red/20">
          C
        </span>
      );
    case "B":
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-hp-orange/15 text-hp-orange border border-hp-orange/20">
          B
        </span>
      );
    case "A":
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-dim/10 text-dim border border-border">
          A
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-dim/10 text-muted border border-border">
          ?
        </span>
      );
  }
}

function statusBadge(status?: string) {
  const isOpen = status?.toUpperCase() === "VIOLATION OPEN";
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
        isOpen
          ? "bg-hp-red/10 text-hp-red"
          : "bg-hp-green/10 text-hp-green"
      }`}
    >
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

function healthGrade(summary: Summary): {
  color: string;
  bg: string;
  border: string;
  label: string;
  emoji: string;
} {
  if (summary.classC > 0 || summary.open > 10) {
    return {
      color: "text-hp-red",
      bg: "bg-hp-red/8",
      border: "border-hp-red/20",
      label: "Needs Attention",
      emoji: "\u26a0\ufe0f",
    };
  }
  if (summary.open > 2) {
    return {
      color: "text-hp-yellow",
      bg: "bg-hp-yellow/8",
      border: "border-hp-yellow/20",
      label: "Some Issues",
      emoji: "\u26a0",
    };
  }
  return {
    color: "text-hp-green",
    bg: "bg-hp-green/8",
    border: "border-hp-green/20",
    label: "Good Standing",
    emoji: "\u2705",
  };
}

export function BuildingHealthSearch() {
  const [address, setAddress] = useState("");
  const [borough, setBorough] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

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

  const grade = result?.summary ? healthGrade(result.summary) : null;

  return (
    <div className="space-y-4">
      {/* Search form */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 123 Main St"
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:border-hp-green/40 focus:ring-1 focus:ring-hp-green/20 transition-colors"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">
              Borough
            </label>
            <select
              value={borough}
              onChange={(e) => setBorough(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-hp-green/40 focus:ring-1 focus:ring-hp-green/20 transition-colors"
            >
              <option value="">Any borough</option>
              {BOROUGHS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted block mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Optional"
              maxLength={5}
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:border-hp-green/40 focus:ring-1 focus:ring-hp-green/20 transition-colors"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !address.trim()}
              className="w-full px-4 py-2 text-[13px] font-semibold rounded-lg bg-hp-green text-white hover:bg-hp-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted mt-2">
          Enter the street number and name. Adding borough or zip helps narrow results for common street names.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-hp-red/8 border border-hp-red/20 rounded-xl p-4 text-[13px] text-hp-red">
          {error}
        </div>
      )}

      {/* Results */}
      {result && grade && (
        <>
          {/* Building Health Summary */}
          <div className={`${grade.bg} border ${grade.border} rounded-xl p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{grade.emoji}</span>
              <div>
                <h3 className={`font-display font-bold text-[18px] ${grade.color}`}>
                  {grade.label}
                </h3>
                {result.violations.length > 0 && result.violations[0].housenumber && (
                  <p className="text-[12px] text-dim">
                    {result.violations[0].housenumber} {result.violations[0].streetname}
                    {result.violations[0].zip ? `, ${result.violations[0].zip}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface/60 rounded-lg p-3 text-center">
                <p className="font-display font-bold text-[22px] text-text">
                  {result.summary.total}
                </p>
                <p className="text-[10px] text-dim font-medium">Total Violations</p>
              </div>
              <div className="bg-surface/60 rounded-lg p-3 text-center">
                <p className={`font-display font-bold text-[22px] ${result.summary.open > 0 ? "text-hp-red" : "text-hp-green"}`}>
                  {result.summary.open}
                </p>
                <p className="text-[10px] text-dim font-medium">Open Violations</p>
              </div>
              <div className="bg-surface/60 rounded-lg p-3 text-center">
                <p className={`font-display font-bold text-[22px] ${result.summary.classC > 0 ? "text-hp-red" : "text-text"}`}>
                  {result.summary.classC}
                </p>
                <p className="text-[10px] text-dim font-medium">Class C (Hazardous)</p>
              </div>
              <div className="bg-surface/60 rounded-lg p-3 text-center">
                <p className="font-display font-bold text-[22px] text-text">
                  {result.summary.recentComplaints}
                </p>
                <p className="text-[10px] text-dim font-medium">Complaints (1yr)</p>
              </div>
            </div>

            {/* Comparison */}
            <p className="text-[12px] text-dim mt-3">
              This building has <strong className="text-text">{result.summary.open} open violation{result.summary.open !== 1 ? "s" : ""}</strong>.
              The average NYC building with HPD records has ~{NYC_AVG_OPEN_VIOLATIONS} open violations.
              {result.summary.open <= 2 && " This building is in relatively good shape."}
              {result.summary.open > 2 && result.summary.open <= 10 && " There are some issues that may need attention."}
              {result.summary.open > 10 && " This is significantly above average and may indicate systemic maintenance issues."}
            </p>
          </div>

          {/* Class breakdown */}
          {result.summary.total > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">Violation Breakdown</h4>
              <div className="flex gap-2 mb-3">
                {[
                  { label: "Class A", count: result.summary.classA, cls: "bg-dim/10 text-dim" },
                  { label: "Class B", count: result.summary.classB, cls: "bg-hp-orange/10 text-hp-orange" },
                  { label: "Class C", count: result.summary.classC, cls: "bg-hp-red/10 text-hp-red" },
                ].map((item) => (
                  <div key={item.label} className={`flex-1 rounded-lg p-2.5 text-center ${item.cls}`}>
                    <p className="font-display font-bold text-[18px]">{item.count}</p>
                    <p className="text-[10px] font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
              {/* Bar visualization */}
              {result.summary.total > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden bg-bg">
                  {result.summary.classA > 0 && (
                    <div
                      className="bg-dim/30 transition-all"
                      style={{ width: `${(result.summary.classA / result.summary.total) * 100}%` }}
                      title={`Class A: ${result.summary.classA}`}
                    />
                  )}
                  {result.summary.classB > 0 && (
                    <div
                      className="bg-hp-orange/50 transition-all"
                      style={{ width: `${(result.summary.classB / result.summary.total) * 100}%` }}
                      title={`Class B: ${result.summary.classB}`}
                    />
                  )}
                  {result.summary.classC > 0 && (
                    <div
                      className="bg-hp-red/60 transition-all"
                      style={{ width: `${(result.summary.classC / result.summary.total) * 100}%` }}
                      title={`Class C: ${result.summary.classC}`}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Violations list */}
          {result.violations.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">
                Violations ({result.violations.length}{result.violations.length === 200 ? "+" : ""})
              </h4>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {result.violations.map((v, i) => (
                  <div
                    key={v.violationid || i}
                    className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {classBadge(v.class)}
                        {statusBadge(v.currentstatus)}
                        {v.apartment && (
                          <span className="text-[10px] text-muted">Apt {v.apartment}</span>
                        )}
                      </div>
                      {v.inspectiondate && (
                        <span className="text-[10px] text-muted flex-shrink-0">
                          {new Date(v.inspectiondate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {v.novdescription && (
                      <p className="text-[11px] text-dim leading-relaxed mt-1">
                        {v.novdescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints list */}
          {result.complaints.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-[12px] font-bold text-text mb-3">
                Recent Complaints ({result.complaints.length})
              </h4>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {result.complaints.map((c, i) => (
                  <div
                    key={c.complaintid || i}
                    className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[12px] font-semibold text-text">
                          {c.majorcategory || "General"}
                        </p>
                        {c.minorcategory && (
                          <p className="text-[11px] text-dim">{c.minorcategory}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.status?.toUpperCase() === "CLOSE"
                              ? "bg-hp-green/10 text-hp-green"
                              : "bg-hp-orange/10 text-hp-orange"
                          }`}
                        >
                          {c.status || "Unknown"}
                        </span>
                        {c.statusdate && (
                          <p className="text-[10px] text-muted mt-0.5">
                            {new Date(c.statusdate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {result.violations.length === 0 && result.complaints.length === 0 && (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-dim text-sm">No HPD records found for this address.</p>
              <p className="text-muted text-xs mt-1">
                Try adjusting the search or adding a borough. HPD data covers residential buildings only.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
