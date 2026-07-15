"use client";

import { useCallback, useEffect, useState } from "react";

// Community Verification review queue (App v1 phase 5). Lives on
// /admin/metrics behind ADMIN_METRICS_SECRET. Approve builds the
// ready-to-merge verified-menu record (shown for copy-paste into
// src/data/verified-venues.json — the frozen surface is never mutated live).

interface ExtractedItem {
  name: string;
  price: number | null;
  calories: number | null;
  protein: number | null;
  source: string;
}

interface Submission {
  id: string;
  created_at: string;
  venue_name: string;
  address: string | null;
  camis: string | null;
  remote: boolean;
  distance_m: number | null;
  contributor_name: string | null;
  extracted: { items: ExtractedItem[]; notes?: string } | null;
  photoUrl: string | null;
}

export function VerificationQueue({ adminKey }: { adminKey: string }) {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/verify-submission?key=${encodeURIComponent(adminKey)}&status=pending`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubs(data.submissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    }
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(
    async (id: string, action: "approve" | "reject") => {
      setBusy(id);
      try {
        const res = await fetch(`/api/verify-submission?key=${encodeURIComponent(adminKey)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (data.verifiedRecord) setRecord(JSON.stringify(data.verifiedRecord, null, 2));
        setSubs((prev) => prev?.filter((s) => s.id !== id) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "review failed");
      } finally {
        setBusy(null);
      }
    },
    [adminKey],
  );

  if (error) return <p className="text-[12px] text-hp-red">Verification queue: {error}</p>;
  if (subs === null) return <p className="text-[12px] text-muted">Loading verification queue…</p>;
  if (subs.length === 0 && !record) return <p className="text-[12px] text-muted">No pending submissions.</p>;

  return (
    <div className="space-y-4">
      {subs.map((s) => (
        <div key={s.id} className="bg-surface border border-border rounded-2xl p-4 flex gap-4">
          {s.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={s.photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={s.photoUrl} alt={`Menu photo for ${s.venue_name}`} className="w-28 h-28 object-cover rounded-xl border border-border" />
            </a>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-text">
              {s.venue_name}
              {s.remote && (
                <span className="ml-2 text-[10px] font-bold text-hp-orange border border-hp-orange/40 rounded-full px-2 py-0.5">
                  REMOTE{s.distance_m != null ? ` · ${s.distance_m}m away` : ""}
                </span>
              )}
            </p>
            <p className="text-[11px] text-dim">
              {s.address ?? "no address"} · {s.camis ? `CAMIS ${s.camis}` : "no CAMIS"} · by{" "}
              {s.contributor_name || "a local"} · {new Date(s.created_at).toLocaleString()}
            </p>
            {s.extracted?.items?.length ? (
              <ul className="mt-1 text-[11px] text-dim max-h-24 overflow-y-auto">
                {s.extracted.items.slice(0, 8).map((i, idx) => (
                  <li key={idx}>
                    {i.name}
                    {i.price != null ? ` — $${i.price}` : ""}
                    {i.calories != null ? ` · ${i.calories} cal (${i.source})` : ""}
                  </li>
                ))}
                {s.extracted.items.length > 8 && <li>… {s.extracted.items.length - 8} more</li>}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-muted">No items extracted — review the photo.</p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => review(s.id, "approve")}
                disabled={busy === s.id}
                className="text-[11px] font-bold text-white bg-hp-green rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => review(s.id, "reject")}
                disabled={busy === s.id}
                className="text-[11px] font-bold text-hp-red border border-hp-red/40 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {record && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-[12px] font-bold text-text mb-1">
            Approved — merge this record into <code>src/data/verified-venues.json</code> and redeploy:
          </p>
          <pre className="text-[10px] text-dim bg-bg rounded-xl p-3 overflow-x-auto max-h-64">{record}</pre>
        </div>
      )}
    </div>
  );
}
