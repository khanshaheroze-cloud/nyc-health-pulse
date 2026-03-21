"use client";

import { useState } from "react";

interface Restaurant {
  camis: string;
  name: string;
  borough: string;
  zip: string;
  cuisine: string;
  grade: string;
  gradeDate: string;
  address: string;
  criticalCount: number;
}

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-hp-green/15", text: "text-hp-green" },
  B: { bg: "bg-hp-orange/15", text: "text-hp-orange" },
  C: { bg: "bg-hp-red/15", text: "text-hp-red" },
};

const BOROUGHS = ["", "Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];

function formatDate(iso: string) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function FoodSafetySearch() {
  const [query, setQuery]       = useState("");
  const [borough, setBorough]   = useState("");
  const [zip, setZip]           = useState("");
  const [results, setResults]   = useState<Restaurant[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !borough && !zip.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (borough) params.set("borough", borough);
      if (zip.trim()) params.set("zip", zip.trim());

      const res = await fetch(`/api/food-search?${params}`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold mb-3">Search Restaurant Inspections</h3>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          {/* Restaurant name */}
          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wider block mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Joe's Pizza"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors"
            />
          </div>

          {/* Borough */}
          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wider block mb-1">
              Borough
            </label>
            <select
              value={borough}
              onChange={e => setBorough(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text outline-none focus:border-hp-blue/50 transition-colors"
            >
              <option value="">All Boroughs</option>
              {BOROUGHS.filter(Boolean).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Zip Code */}
          <div>
            <label className="text-[10px] text-muted font-semibold uppercase tracking-wider block mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="e.g. 10001"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors"
              maxLength={5}
              inputMode="numeric"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || (!query.trim() && !borough && !zip.trim())}
            className="bg-hp-blue text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:bg-hp-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching…
              </span>
            ) : "Search"}
          </button>
        </div>

        <p className="text-[10px] text-muted mt-2">
          Search by name, borough, zip code, or any combination. Data from NYC DOHMH inspections.
        </p>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-hp-red/10 border border-hp-red/20 rounded-xl px-4 py-3">
          <p className="text-[12px] text-hp-red">{error}</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && !error && (
        <div className="mt-4">
          {results.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl px-4 py-6 text-center">
              <p className="text-dim text-[13px]">No restaurants found matching your search.</p>
              <p className="text-muted text-[11px] mt-1">Try a different name, borough, or zip code.</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted mb-2">
                Showing {results.length} of {total} result{total !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {results.map(r => {
                  const gradeStyle = GRADE_COLORS[r.grade] ?? { bg: "bg-border/40", text: "text-dim" };
                  return (
                    <div
                      key={r.camis}
                      className="bg-surface border border-border rounded-xl p-3.5 flex gap-3 items-start"
                    >
                      {/* Grade Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${gradeStyle.bg}`}>
                        <span className={`font-display font-bold text-[22px] ${gradeStyle.text}`}>
                          {r.grade || "?"}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-text truncate" title={r.name}>
                          {r.name}
                        </p>
                        <p className="text-[11px] text-dim truncate" title={r.address}>
                          {r.address}{r.zip ? `, ${r.zip}` : ""} {r.borough ? `\u00B7 ${r.borough}` : ""}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">{r.cuisine}</p>

                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted">
                            Inspected {formatDate(r.gradeDate)}
                          </span>
                          {r.criticalCount > 0 && (
                            <span className="text-[10px] font-semibold text-hp-red bg-hp-red/10 px-1.5 py-0.5 rounded">
                              {r.criticalCount} critical violation{r.criticalCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {r.criticalCount === 0 && (
                            <span className="text-[10px] font-semibold text-hp-green bg-hp-green/10 px-1.5 py-0.5 rounded">
                              No critical violations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
