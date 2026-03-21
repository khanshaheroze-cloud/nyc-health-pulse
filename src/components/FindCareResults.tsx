"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

/* ---------- Types (mirror API route) ---------- */
type ProviderCategory =
  | "primary-care" | "dental" | "mental-health" | "obgyn"
  | "pediatrics" | "eye-care" | "physical-therapy" | "specialist"
  | "facility" | "other" | "all";

interface Provider {
  name: string;
  category: ProviderCategory;
  categoryLabel: string;
  specialty: string;
  address: string;
  city: string;
  zip: string;
  borough: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  credential: string;
  npi: string | null;
  facilityName: string | null;
  telehealth: boolean;
  source: "nppes" | "nys" | "cms";
  insuranceNote: string;
}

/* ---------- Dynamic map (SSR-disabled) ---------- */
const FindCareMap = dynamic(() => import("./_FindCareMapImpl").then((m) => m.FindCareMapImpl), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-surface border border-border rounded-xl flex items-center justify-center text-dim text-sm">
      Loading map…
    </div>
  ),
});

/* ---------- Constants ---------- */
const CATEGORIES: { value: ProviderCategory; label: string; icon: string }[] = [
  { value: "all", label: "All Providers", icon: "🔍" },
  { value: "primary-care", label: "Primary Care", icon: "🩺" },
  { value: "dental", label: "Dental", icon: "🦷" },
  { value: "mental-health", label: "Mental Health", icon: "🧠" },
  { value: "obgyn", label: "OB-GYN", icon: "👶" },
  { value: "pediatrics", label: "Pediatrics", icon: "🧒" },
  { value: "eye-care", label: "Eye Care", icon: "👁" },
  { value: "physical-therapy", label: "Therapy / Rehab", icon: "🏃" },
  { value: "specialist", label: "Specialists", icon: "⚕" },
  { value: "facility", label: "Facilities", icon: "🏥" },
];

const RADIUS_OPTIONS = [
  { value: 1, label: "1 mile", zips: 1 },
  { value: 2, label: "2 miles", zips: 3 },
  { value: 3, label: "3 miles", zips: 5 },
  { value: 5, label: "5 miles", zips: 8 },
];

const CATEGORY_COLORS: Record<string, string> = {
  "primary-care": "bg-hp-green/10 text-hp-green",
  dental: "bg-hp-cyan/10 text-hp-cyan",
  "mental-health": "bg-hp-blue/10 text-hp-blue",
  obgyn: "bg-hp-pink/10 text-hp-pink",
  pediatrics: "bg-hp-orange/10 text-hp-orange",
  "eye-care": "bg-hp-purple/10 text-hp-purple",
  "physical-therapy": "bg-hp-yellow/10 text-hp-yellow",
  specialist: "bg-hp-red/10 text-hp-red",
  facility: "bg-border text-dim",
  other: "bg-border text-dim",
};

/* ---------- NYC zip code centers for distance computation ---------- */
const NYC_ZIP_CENTERS: Record<string, [number, number]> = {
  // Manhattan
  "10001":[40.7484,-73.9967],"10002":[40.7157,-73.9863],"10003":[40.7317,-73.9893],
  "10004":[40.6993,-74.0384],"10005":[40.7069,-74.0089],"10006":[40.7094,-74.0132],
  "10007":[40.7135,-74.0078],"10009":[40.7265,-73.9797],"10010":[40.7390,-73.9826],
  "10011":[40.7418,-74.0002],"10012":[40.7258,-73.9981],"10013":[40.7197,-74.0027],
  "10014":[40.7340,-74.0054],"10016":[40.7459,-73.9781],"10017":[40.7527,-73.9729],
  "10018":[40.7549,-73.9926],"10019":[40.7654,-73.9859],"10020":[40.7587,-73.9787],
  "10021":[40.7694,-73.9588],"10022":[40.7582,-73.9675],"10023":[40.7764,-73.9823],
  "10024":[40.7860,-73.9762],"10025":[40.7990,-73.9664],"10026":[40.8028,-73.9529],
  "10027":[40.8117,-73.9530],"10028":[40.7767,-73.9536],"10029":[40.7919,-73.9441],
  "10030":[40.8180,-73.9433],"10031":[40.8249,-73.9484],"10032":[40.8382,-73.9425],
  "10033":[40.8500,-73.9351],"10034":[40.8677,-73.9234],"10035":[40.7972,-73.9348],
  "10036":[40.7592,-73.9903],"10037":[40.8137,-73.9378],"10038":[40.7085,-74.0024],
  "10039":[40.8241,-73.9380],"10040":[40.8582,-73.9298],
  // Brooklyn
  "11201":[40.6935,-73.9897],"11203":[40.6497,-73.9344],"11204":[40.6189,-73.9845],
  "11205":[40.6944,-73.9667],"11206":[40.7018,-73.9430],"11207":[40.6614,-73.8935],
  "11208":[40.6654,-73.8713],"11209":[40.6208,-74.0303],"11210":[40.6283,-73.9462],
  "11211":[40.7128,-73.9537],"11212":[40.6631,-73.9128],"11213":[40.6711,-73.9363],
  "11214":[40.5993,-73.9960],"11215":[40.6683,-73.9826],"11216":[40.6809,-73.9492],
  "11217":[40.6824,-73.9779],"11218":[40.6434,-73.9764],"11219":[40.6328,-73.9965],
  "11220":[40.6393,-74.0165],"11221":[40.6923,-73.9275],"11222":[40.7275,-73.9470],
  "11223":[40.5970,-73.9735],"11224":[40.5765,-73.9889],"11225":[40.6628,-73.9543],
  "11226":[40.6465,-73.9564],"11228":[40.6169,-74.0131],"11229":[40.6013,-73.9439],
  "11230":[40.6220,-73.9661],"11231":[40.6795,-74.0007],"11232":[40.6568,-74.0058],
  "11233":[40.6784,-73.9192],"11234":[40.6088,-73.9102],"11235":[40.5839,-73.9491],
  "11236":[40.6394,-73.9018],"11237":[40.7037,-73.9213],"11238":[40.6793,-73.9633],
  "11239":[40.6480,-73.8797],
  // Queens
  "11101":[40.7477,-73.9387],"11102":[40.7720,-73.9238],"11103":[40.7625,-73.9127],
  "11104":[40.7443,-73.9205],"11105":[40.7784,-73.9068],"11106":[40.7619,-73.9307],
  "11354":[40.7681,-73.8272],"11355":[40.7508,-73.8210],"11356":[40.7850,-73.8432],
  "11357":[40.7862,-73.8115],"11358":[40.7610,-73.7960],"11360":[40.7807,-73.7815],
  "11361":[40.7636,-73.7728],"11362":[40.7575,-73.7361],"11363":[40.7720,-73.7466],
  "11364":[40.7459,-73.7609],"11365":[40.7395,-73.7947],"11366":[40.7289,-73.7913],
  "11367":[40.7299,-73.8227],"11368":[40.7498,-73.8527],"11369":[40.7633,-73.8716],
  "11370":[40.7646,-73.8925],"11372":[40.7517,-73.8832],"11373":[40.7388,-73.8784],
  "11374":[40.7246,-73.8627],"11375":[40.7211,-73.8456],"11377":[40.7440,-73.9059],
  "11378":[40.7240,-73.9097],"11379":[40.7174,-73.8798],"11385":[40.7004,-73.8883],
  "11411":[40.6937,-73.7363],"11412":[40.6978,-73.7594],"11413":[40.6720,-73.7539],
  "11414":[40.6575,-73.8449],"11415":[40.7082,-73.8280],"11416":[40.6848,-73.8497],
  "11417":[40.6759,-73.8437],"11418":[40.6993,-73.8355],"11419":[40.6873,-73.8246],
  "11420":[40.6739,-73.8171],"11421":[40.6935,-73.8570],"11422":[40.6588,-73.7358],
  "11423":[40.7154,-73.7681],"11427":[40.7303,-73.7459],"11428":[40.7206,-73.7417],
  "11429":[40.7097,-73.7389],"11432":[40.7155,-73.7925],"11433":[40.6985,-73.7868],
  "11434":[40.6764,-73.7759],"11435":[40.7011,-73.8090],"11436":[40.6762,-73.7968],
  // Bronx
  "10451":[40.8206,-73.9238],"10452":[40.8373,-73.9234],"10453":[40.8528,-73.9126],
  "10454":[40.8085,-73.9168],"10455":[40.8150,-73.9085],"10456":[40.8315,-73.9079],
  "10457":[40.8465,-73.8992],"10458":[40.8629,-73.8882],"10459":[40.8251,-73.8936],
  "10460":[40.8418,-73.8790],"10461":[40.8459,-73.8427],"10462":[40.8410,-73.8571],
  "10463":[40.8806,-73.9056],"10464":[40.8684,-73.8032],"10465":[40.8228,-73.8217],
  "10466":[40.8905,-73.8468],"10467":[40.8734,-73.8713],"10468":[40.8695,-73.9000],
  "10469":[40.8695,-73.8472],"10470":[40.8951,-73.8676],"10471":[40.8985,-73.8994],
  "10472":[40.8298,-73.8686],"10473":[40.8192,-73.8586],"10474":[40.8118,-73.8854],
  "10475":[40.8773,-73.8273],
  // Staten Island
  "10301":[40.6434,-74.0770],"10302":[40.6318,-74.1370],"10303":[40.6317,-74.1573],
  "10304":[40.6077,-74.0920],"10305":[40.5967,-74.0753],"10306":[40.5725,-74.1275],
  "10307":[40.5109,-74.2421],"10308":[40.5512,-74.1484],"10309":[40.5285,-74.2195],
  "10310":[40.6325,-74.1164],"10312":[40.5451,-74.1800],"10314":[40.5981,-74.1632],
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearbyZips(lat: number, lng: number, radiusMiles: number): string[] {
  return Object.entries(NYC_ZIP_CENTERS)
    .filter(([, [zLat, zLng]]) => haversineDistance(lat, lng, zLat, zLng) <= radiusMiles + 0.5)
    .sort(([, [aLat, aLng]], [, [bLat, bLng]]) =>
      haversineDistance(lat, lng, aLat, aLng) - haversineDistance(lat, lng, bLat, bLng)
    )
    .map(([zip]) => zip);
}

function getZipFromLatLng(lat: number, lng: number): string {
  let closest = "10001";
  let minDist = Infinity;
  for (const [zip, [zLat, zLng]] of Object.entries(NYC_ZIP_CENTERS)) {
    const d = haversineDistance(lat, lng, zLat, zLng);
    if (d < minDist) { minDist = d; closest = zip; }
  }
  return closest;
}

/* ---------- Main Component ---------- */
export function FindCareResults() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [searched, setSearched] = useState(false);

  // Filters
  const [category, setCategory] = useState<ProviderCategory>("all");
  const [radius, setRadius] = useState(1);

  // Location
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userZip, setUserZip] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [zipInput, setZipInput] = useState("");

  // Selected provider detail
  const [selected, setSelected] = useState<Provider | null>(null);

  // Source counts
  const [sourceCounts, setSourceCounts] = useState({ nppes: 0, cms: 0, nys: 0 });

  const fetchRef = useRef(0);

  /* --- Geolocation --- */
  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        const zip = getZipFromLatLng(lat, lng);
        setUserZip(zip);
        setZipInput(zip);
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function submitZip() {
    const zip = zipInput.trim();
    if (zip.length !== 5) return;
    const coords = NYC_ZIP_CENTERS[zip];
    if (coords) {
      setUserLat(coords[0]);
      setUserLng(coords[1]);
    } else {
      setUserLat(40.7128);
      setUserLng(-74.006);
    }
    setUserZip(zip);
    setLocationStatus("granted");
  }

  /* --- Search --- */
  const search = useCallback(async () => {
    if (!userLat || !userLng || !userZip) return;

    const id = ++fetchRef.current;
    setLoading(true);
    setError(null);
    setSearched(true);

    const nearbyZips = getNearbyZips(userLat, userLng, radius);
    const zips = nearbyZips.length > 0 ? nearbyZips : [userZip];

    try {
      const params = new URLSearchParams({
        zips: zips.slice(0, 8).join(","),
        category: category,
      });

      const res = await fetch(`/api/find-care?${params.toString()}`);
      if (id !== fetchRef.current) return; // stale
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setProviders(data.providers || []);
      setSourceCounts(data.sources || { nppes: 0, cms: 0, nys: 0 });
    } catch {
      if (id === fetchRef.current) setError("Couldn't load providers. Please try again.");
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [userLat, userLng, userZip, radius, category]);

  // Auto-search when location or filters change
  useEffect(() => {
    if (userZip) search();
  }, [search, userZip]);

  /* --- Map-ready providers (only those with lat/lng) --- */
  const mappable = providers.filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="space-y-4">
      {/* Location input */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-2.5">Find providers near you</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={requestLocation}
            disabled={locationStatus === "loading"}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2.5 rounded-lg bg-hp-green/10 text-hp-green border border-hp-green/20 hover:bg-hp-green/20 transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
            </svg>
            {locationStatus === "loading" ? "Locating…" : "Use my location"}
          </button>
          <span className="text-[12px] text-muted self-center hidden sm:block">or</span>
          <div className="flex gap-1.5 flex-1">
            <input
              type="text"
              placeholder="Enter NYC ZIP code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={(e) => e.key === "Enter" && submitZip()}
              className="flex-1 sm:max-w-[160px] text-[13px] px-3.5 py-2.5 rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:border-hp-green/40 transition-colors"
            />
            <button
              onClick={submitZip}
              disabled={zipInput.length !== 5}
              className="text-[12px] font-semibold px-4 py-2.5 rounded-lg bg-hp-green text-white hover:bg-hp-green/90 transition-colors disabled:opacity-40 disabled:bg-border disabled:text-dim"
            >
              Search
            </button>
          </div>
        </div>
        {locationStatus === "denied" && (
          <p className="text-[11px] text-hp-red mt-2">Location access denied. Enter your ZIP code instead.</p>
        )}
        {locationStatus === "granted" && userZip && (
          <p className="text-[11px] text-hp-green mt-2">
            Searching near {userZip} · {radius === 1 ? "1 mile" : `${radius} miles`} radius
          </p>
        )}
      </div>

      {/* Empty state */}
      {!searched && !loading && (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-[15px] font-bold text-text mb-1">Enter your location to get started</h3>
          <p className="text-[12px] text-dim max-w-md mx-auto leading-relaxed">
            Search thousands of NYC healthcare providers — doctors, dentists, therapists, specialists, clinics, and more.
            Use your location or enter a ZIP code above.
          </p>
        </div>
      )}

      {/* Filters (only show after search) */}
      {searched && (
        <>
          <div className="flex flex-wrap gap-2">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                    category === c.value
                      ? "bg-hp-green/10 text-hp-green border-hp-green/20"
                      : "text-dim border-border hover:text-text hover:bg-surface"
                  }`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Radius */}
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-dim hover:text-text transition-colors cursor-pointer focus:outline-none focus:border-hp-green/40"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              {/* Results count */}
              <p className="text-[12px] text-dim">
                {loading ? "Searching…" : `${providers.length} providers found`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Source info */}
              {!loading && providers.length > 0 && (
                <p className="text-[10px] text-muted hidden sm:block">
                  {sourceCounts.cms > 0 && `${sourceCounts.cms} CMS`}
                  {sourceCounts.nppes > 0 && ` · ${sourceCounts.nppes} NPI`}
                  {sourceCounts.nys > 0 && ` · ${sourceCounts.nys} facilities`}
                </p>
              )}

              {/* View toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setView("list")}
                  className={`text-[11px] font-semibold px-3 py-1.5 transition-colors ${view === "list" ? "bg-hp-green/10 text-hp-green" : "text-dim hover:text-text bg-surface"}`}
                >
                  List
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`text-[11px] font-semibold px-3 py-1.5 transition-colors border-l border-border ${view === "map" ? "bg-hp-green/10 text-hp-green" : "text-dim hover:text-text bg-surface"}`}
                >
                  Map{mappable.length > 0 ? ` (${mappable.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="bg-hp-red/10 border border-hp-red/20 rounded-xl p-4 text-[12px] text-hp-red">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <div className="w-6 h-6 border-2 border-hp-green/30 border-t-hp-green rounded-full animate-spin" />
          <p className="text-[12px] text-dim">Searching NPPES, CMS & NYS registries…</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          {view === "list" ? (
            <div className="space-y-1.5">
              {providers.map((p, i) => (
                <ProviderCard key={`${p.npi || p.name}-${i}`} provider={p} onSelect={setSelected} />
              ))}

              {providers.length === 0 && !error && (
                <div className="bg-surface border border-border rounded-xl p-8 text-center">
                  <p className="text-dim text-sm">No providers found for this search.</p>
                  <p className="text-muted text-xs mt-1">Try a larger radius or different category.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {mappable.length > 0 ? (
                <FindCareMap
                  facilities={mappable.map((p) => ({
                    name: p.name,
                    type: p.category as any,
                    typeLabel: p.categoryLabel,
                    address: p.address,
                    city: p.city,
                    zip: p.zip,
                    borough: p.borough,
                    phone: p.phone,
                    lat: p.lat!,
                    lng: p.lng!,
                    insurance: "contact" as any,
                    insuranceLabel: p.insuranceNote,
                    ownership: "",
                    distance: undefined,
                  }))}
                  userLat={userLat}
                  userLng={userLng}
                  onSelect={(f) => {
                    const match = providers.find((p) => p.name === f.name && p.address === f.address);
                    if (match) setSelected(match);
                  }}
                />
              ) : (
                <div className="bg-surface border border-border rounded-xl p-8 text-center">
                  <p className="text-dim text-sm">No map pins available for individual providers.</p>
                  <p className="text-muted text-xs mt-1">Map shows facilities with known coordinates. Switch to List view to see all providers.</p>
                </div>
              )}

              {/* Also show list below map for individual providers */}
              {providers.length > mappable.length && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-muted mb-2">
                    All providers (list)
                  </p>
                  <div className="space-y-1.5">
                    {providers.filter((p) => !p.lat).map((p, i) => (
                      <ProviderCard key={`list-${p.npi || p.name}-${i}`} provider={p} onSelect={setSelected} compact />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Detail panel */}
      {selected && <ProviderDetail provider={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ---------- Provider Card ---------- */
function ProviderCard({ provider: p, onSelect, compact }: { provider: Provider; onSelect: (p: Provider) => void; compact?: boolean }) {
  const colors = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;

  return (
    <button
      onClick={() => onSelect(p)}
      className={`w-full text-left bg-surface border border-border rounded-xl hover:border-hp-green/30 transition-colors group ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${colors}`}>
              {p.categoryLabel}
            </span>
            {p.telehealth && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-hp-blue/10 text-hp-blue">
                Telehealth
              </span>
            )}
            {p.source === "nys" && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">
                Verified Facility
              </span>
            )}
          </div>
          <h4 className="text-[13px] font-bold text-text group-hover:text-hp-green transition-colors truncate">
            {p.name}
          </h4>
          {p.specialty && p.specialty !== p.categoryLabel && (
            <p className="text-[10px] text-muted mt-0.5 truncate">{p.specialty}</p>
          )}
          <p className="text-[11px] text-dim mt-0.5 truncate">
            {p.address}{p.city ? `, ${p.city}` : ""} {p.zip}
            {p.borough && <span className="text-muted ml-1">· {p.borough}</span>}
          </p>
          {p.facilityName && (
            <p className="text-[10px] text-muted mt-0.5 truncate">{p.facilityName}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {p.phone && (
            <p className="text-[10px] text-dim">{p.phone}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------- Provider Detail Panel ---------- */
function ProviderDetail({ provider: p, onClose }: { provider: Provider; onClose: () => void }) {
  const colors = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-text/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full border border-border text-dim hover:text-text hover:bg-surface transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors}`}>
            {p.categoryLabel}
          </span>
          {p.telehealth && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-hp-blue/10 text-hp-blue border border-hp-blue/20">
              Telehealth Available
            </span>
          )}
        </div>

        <h3 className="text-[17px] font-display font-bold text-text mb-0.5">{p.name}</h3>
        {p.specialty && <p className="text-[12px] text-dim mb-2">{p.specialty}</p>}

        <p className="text-[12px] text-dim mb-1">
          {p.address}{p.city ? `, ${p.city}` : ""}, NY {p.zip}
          {p.borough && <span className="text-muted ml-1">· {p.borough}</span>}
        </p>

        {p.facilityName && (
          <p className="text-[11px] text-muted mb-3">{p.facilityName}</p>
        )}

        {/* Insurance info */}
        <div className="bg-surface border border-border rounded-lg p-3 mb-4">
          <p className="text-[10px] font-bold tracking-[1px] uppercase text-muted mb-1">Insurance</p>
          <p className="text-[12px] text-dim">{p.insuranceNote}</p>
          {p.source === "nys" && p.insuranceNote.includes("Accepts all") && (
            <p className="text-[10px] text-muted mt-1">NYC Health + Hospitals facilities provide care to all New Yorkers regardless of insurance status.</p>
          )}
        </div>

        {/* NPI */}
        {p.npi && (
          <p className="text-[10px] text-muted mb-3">NPI: {p.npi}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {p.phone && (
            <a
              href={`tel:${p.phone.replace(/\D/g, "")}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2.5 rounded-lg bg-hp-green/10 text-hp-green border border-hp-green/20 hover:bg-hp-green/20 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.address}, ${p.city}, NY ${p.zip}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2.5 rounded-lg border border-border text-dim hover:text-text hover:bg-surface transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Directions
          </a>
        </div>

        <p className="text-[9px] text-muted mt-4 text-center">
          Source: {p.source === "cms" ? "CMS Doctors & Clinicians" : p.source === "nppes" ? "NPPES NPI Registry" : "NYS Health Facility Registry"} · Always call ahead to confirm availability
        </p>
      </div>
    </div>
  );
}
