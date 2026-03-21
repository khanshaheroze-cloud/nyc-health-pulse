import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Multi-source NYC provider search                                   */
/*  1. NPPES NPI Registry — ALL licensed providers (individuals)       */
/*  2. NYS Health Facility — facilities with lat/lng + phone           */
/*  3. CMS Doctors & Clinicians — Medicare-enrolled (specialty labels) */
/* ------------------------------------------------------------------ */

const NPPES_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1";
const NYS_API = "https://health.data.ny.gov/resource/vn5v-hh5r.json";
const CMS_API = "https://data.cms.gov/provider-data/api/1/datastore/query/mj5m-pzi6/0";

/* ---- Types ---- */
export type ProviderCategory =
  | "primary-care"
  | "dental"
  | "mental-health"
  | "obgyn"
  | "pediatrics"
  | "eye-care"
  | "physical-therapy"
  | "specialist"
  | "facility"
  | "other";

export interface Provider {
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

/* ---- Helpers ---- */

const COUNTY_TO_BOROUGH: Record<string, string> = {
  "New York": "Manhattan",
  Kings: "Brooklyn",
  Queens: "Queens",
  Bronx: "Bronx",
  Richmond: "Staten Island",
};

const CITY_TO_BOROUGH: Record<string, string> = {
  "NEW YORK": "Manhattan",
  MANHATTAN: "Manhattan",
  BROOKLYN: "Brooklyn",
  BRONX: "Bronx",
  "STATEN ISLAND": "Staten Island",
  QUEENS: "Queens",
  // Queens neighborhoods
  JAMAICA: "Queens", FLUSHING: "Queens", ASTORIA: "Queens",
  "LONG ISLAND CITY": "Queens", "FOREST HILLS": "Queens",
  "JACKSON HEIGHTS": "Queens", BAYSIDE: "Queens",
  "REGO PARK": "Queens", WOODSIDE: "Queens", ELMHURST: "Queens",
  "FRESH MEADOWS": "Queens", "KEW GARDENS": "Queens",
  RIDGEWOOD: "Queens", "HOWARD BEACH": "Queens",
  "OZONE PARK": "Queens", "WOODHAVEN": "Queens",
  "RICHMOND HILL": "Queens", "SOUTH OZONE PARK": "Queens",
  "FAR ROCKAWAY": "Queens", "ROCKAWAY PARK": "Queens",
  "BELLE HARBOR": "Queens", "COLLEGE POINT": "Queens",
  "CORONA": "Queens", "EAST ELMHURST": "Queens",
  "GLEN OAKS": "Queens", "HOLLIS": "Queens",
  "LITTLE NECK": "Queens", "MASPETH": "Queens",
  "MIDDLE VILLAGE": "Queens", "OAKLAND GARDENS": "Queens",
  "SUNNYSIDE": "Queens", "WHITESTONE": "Queens",
  "CAMBRIA HEIGHTS": "Queens", "LAURELTON": "Queens",
  "ROSEDALE": "Queens", "SAINT ALBANS": "Queens",
  "SPRINGFIELD GARDENS": "Queens", "SOUTH RICHMOND HILL": "Queens",
  "FLORAL PARK": "Queens", "BRIARWOOD": "Queens",
  // Bronx neighborhoods
  "SOUTH BRONX": "Bronx",
  // Brooklyn neighborhoods
  "BROOKLYN HEIGHTS": "Brooklyn",
  // Manhattan neighborhoods
  "HARLEM": "Manhattan",
};

function classifyTaxonomy(desc: string): { category: ProviderCategory; label: string } {
  const d = (desc || "").toLowerCase();
  if (d.includes("family") || d.includes("internal medicine") || d.includes("general practice") || d.includes("nurse practitioner") || d.includes("physician assistant"))
    return { category: "primary-care", label: "Primary Care" };
  if (d.includes("dent") || d.includes("orthodont") || d.includes("endodont") || d.includes("periodont") || d.includes("oral"))
    return { category: "dental", label: "Dental" };
  if (d.includes("psychi") || d.includes("psycho") || d.includes("social work") || d.includes("mental") || d.includes("counsel") || d.includes("marriage") || d.includes("behavioral"))
    return { category: "mental-health", label: "Mental Health" };
  if (d.includes("obstet") || d.includes("gynec") || d.includes("midwi"))
    return { category: "obgyn", label: "OB-GYN" };
  if (d.includes("pediat"))
    return { category: "pediatrics", label: "Pediatrics" };
  if (d.includes("ophthalm") || d.includes("optom"))
    return { category: "eye-care", label: "Eye Care" };
  if (d.includes("physical therap") || d.includes("occupational therap") || d.includes("speech") || d.includes("chiropract"))
    return { category: "physical-therapy", label: "Therapy / Rehab" };
  if (d.includes("cardio") || d.includes("dermat") || d.includes("orthop") || d.includes("neurolog") || d.includes("oncol") || d.includes("urolog") || d.includes("gastro") || d.includes("pulmon") || d.includes("endocrin") || d.includes("rheumat") || d.includes("allerg") || d.includes("surgeon") || d.includes("surgery") || d.includes("anesthesi") || d.includes("radiol") || d.includes("patholog") || d.includes("podiatr"))
    return { category: "specialist", label: "Specialist" };
  return { category: "other", label: desc || "Healthcare Provider" };
}

function classifyCmsSpec(spec: string): { category: ProviderCategory; label: string } {
  const s = (spec || "").toUpperCase();
  if (["INTERNAL MEDICINE", "FAMILY PRACTICE", "GENERAL PRACTICE", "NURSE PRACTITIONER", "PHYSICIAN ASSISTANT"].some(x => s.includes(x)))
    return { category: "primary-care", label: "Primary Care" };
  if (s.includes("DENTIST") || s.includes("ORAL") || s.includes("ORTHODONT"))
    return { category: "dental", label: "Dental" };
  if (["PSYCHIATRY", "PSYCHOLOGY", "SOCIAL WORKER", "CLINICAL PSYCHOLOGIST", "COUNSELOR", "MENTAL"].some(x => s.includes(x)))
    return { category: "mental-health", label: "Mental Health" };
  if (s.includes("OBSTETRICS") || s.includes("GYNECOL"))
    return { category: "obgyn", label: "OB-GYN" };
  if (s.includes("PEDIATRIC"))
    return { category: "pediatrics", label: "Pediatrics" };
  if (s.includes("OPHTHALMOL") || s.includes("OPTOMETR"))
    return { category: "eye-care", label: "Eye Care" };
  if (["PHYSICAL THERAP", "OCCUPATIONAL THERAP", "SPEECH", "CHIROPRACT"].some(x => s.includes(x)))
    return { category: "physical-therapy", label: "Therapy / Rehab" };
  if (["CARDIOLOGY", "DERMATOLOGY", "ORTHOPEDIC", "NEUROLOGY", "ONCOLOGY", "UROLOGY", "GASTROENTEROLOGY", "PULMONOLOGY", "ENDOCRINOLOGY", "RHEUMATOLOGY", "ALLERGY", "SURGERY", "ANESTHESIOLOGY", "RADIOLOGY", "PATHOLOGY", "PODIATRY"].some(x => s.includes(x)))
    return { category: "specialist", label: "Specialist" };
  return { category: "other", label: spec || "Healthcare Provider" };
}

function classifyNysFacility(desc: string, name: string, ownership: string): { insuranceNote: string } {
  const n = (name || "").toLowerCase();
  const o = (ownership || "").toLowerCase();
  if (n.includes("health + hospitals") || n.includes("bellevue") || n.includes("elmhurst") || n.includes("jacobi") || n.includes("kings county") || n.includes("lincoln med") || n.includes("harlem hosp") || n.includes("woodhull") || n.includes("coney island hosp") || n.includes("north central bronx") || o.includes("city") || o.includes("public"))
    return { insuranceNote: "Accepts all patients — no insurance needed" };
  if (n.includes("community health") || n.includes("federally qualified") || n.includes("fqhc") || n.includes("ryan health") || n.includes("urban health plan") || n.includes("charles b. wang"))
    return { insuranceNote: "Sliding scale fees — accepts Medicaid & uninsured" };
  if ((desc || "").toLowerCase().includes("hospital"))
    return { insuranceNote: "Most major insurances accepted" };
  return { insuranceNote: "Contact facility for insurance info" };
}

function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw;
}

function cityToBorough(city: string): string {
  return CITY_TO_BOROUGH[(city || "").toUpperCase()] || city || "";
}

/* ---- NPPES taxonomy → category filter mapping ---- */
const TAXONOMY_FILTERS: Record<string, string[]> = {
  "primary-care": ["Family Medicine", "Internal Medicine", "General Practice", "Nurse Practitioner", "Physician Assistant"],
  dental: ["Dentist", "Dental", "Orthodont", "Endodont", "Periodont"],
  "mental-health": ["Psychiatry", "Psychologist", "Social Worker", "Mental Health", "Counselor", "Marriage"],
  obgyn: ["Obstetrics", "Gynecology", "Midwife"],
  pediatrics: ["Pediatrics"],
  "eye-care": ["Ophthalmology", "Optometry"],
  "physical-therapy": ["Physical Therapist", "Occupational Therapist", "Chiropractor", "Speech"],
  specialist: ["Cardiology", "Dermatology", "Orthop", "Neurology", "Oncology", "Urology", "Gastroenterology", "Pulmonology", "Podiatrist", "Surgery"],
};

/* ---- Fetchers ---- */

async function fetchNppes(zips: string[], category?: string): Promise<Provider[]> {
  // Pick taxonomy filter if category specified
  let taxonomyParam = "";
  if (category && category !== "all" && category !== "facility" && TAXONOMY_FILTERS[category]) {
    // NPPES taxonomy_description does partial match; use first term
    taxonomyParam = `&taxonomy_description=${encodeURIComponent(TAXONOMY_FILTERS[category][0])}`;
  }

  const requests = zips.slice(0, 5).map(async (zip) => {
    try {
      const url = `${NPPES_API}&postal_code=${zip}&enumeration_type=NPI-1&limit=200${taxonomyParam}`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results) return [];

      return (data.results as any[]).map((r): Provider => {
        const basic = r.basic || {};
        const addr = (r.addresses || []).find((a: any) => a.address_purpose === "LOCATION") || r.addresses?.[0] || {};
        const primaryTax = (r.taxonomies || []).find((t: any) => t.primary) || r.taxonomies?.[0] || {};
        const { category: cat, label } = classifyTaxonomy(primaryTax.desc || "");

        const credential = basic.credential || "";
        const name = basic.organization_name
          || `${basic.first_name || ""} ${basic.last_name || ""}${credential ? `, ${credential}` : ""}`.trim();

        return {
          name,
          category: cat,
          categoryLabel: label,
          specialty: primaryTax.desc || "",
          address: addr.address_1 || "",
          city: addr.city || "",
          zip: addr.postal_code?.slice(0, 5) || zip,
          borough: cityToBorough(addr.city || ""),
          phone: formatPhone(addr.telephone_number),
          lat: null,
          lng: null,
          credential,
          npi: r.number || null,
          facilityName: null,
          telehealth: false,
          source: "nppes",
          insuranceNote: "Contact provider for insurance info",
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(requests);
  return results.flat();
}

async function fetchCms(zips: string[], category?: string): Promise<Provider[]> {
  const requests = zips.slice(0, 5).map(async (zip) => {
    try {
      let url = `${CMS_API}?limit=200&conditions[0][property]=zip_code&conditions[0][value]=${zip}&conditions[0][operator]=%3D`;

      // Add specialty filter
      if (category && category !== "all" && category !== "facility") {
        const specMap: Record<string, string[]> = {
          "primary-care": ["INTERNAL MEDICINE", "FAMILY PRACTICE", "GENERAL PRACTICE", "NURSE PRACTITIONER"],
          dental: ["DENTIST"],
          "mental-health": ["PSYCHIATRY", "CLINICAL PSYCHOLOGIST", "CLINICAL SOCIAL WORKER"],
          obgyn: ["OBSTETRICS/GYNECOLOGY"],
          pediatrics: ["PEDIATRIC MEDICINE"],
          "eye-care": ["OPHTHALMOLOGY", "OPTOMETRY"],
          "physical-therapy": ["PHYSICAL THERAPIST", "OCCUPATIONAL THERAPIST", "CHIROPRACTIC"],
          specialist: ["CARDIOLOGY", "DERMATOLOGY", "ORTHOPEDIC SURGERY", "NEUROLOGY"],
        };
        const specs = specMap[category];
        if (specs?.length) {
          url += `&conditions[1][property]=pri_spec&conditions[1][value]=${encodeURIComponent(specs[0])}&conditions[1][operator]=%3D`;
        }
      }

      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results) return [];

      return (data.results as any[]).map((r): Provider => {
        const { category: cat, label } = classifyCmsSpec(r.pri_spec || "");
        const name = `${r.provider_first_name || ""} ${r.provider_last_name || ""}${r.cred ? `, ${r.cred}` : ""}`.trim();

        return {
          name,
          category: cat,
          categoryLabel: label,
          specialty: r.pri_spec || "",
          address: r.adr_ln_1 || "",
          city: r.citytown || "",
          zip: (r.zip_code || zip).slice(0, 5),
          borough: cityToBorough(r.citytown || ""),
          phone: formatPhone(r.telephone_number),
          lat: null,
          lng: null,
          credential: r.cred || "",
          npi: r.npi || null,
          facilityName: r.facility_name || null,
          telehealth: r.telehlth === "Y",
          source: "cms",
          insuranceNote: r.ind_assgn === "Y" ? "Accepts Medicare assignment" : "Contact provider for insurance info",
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(requests);
  return results.flat();
}

async function fetchNysFacilities(zips: string[]): Promise<Provider[]> {
  try {
    const zipFilter = zips.map((z) => `'${z}'`).join(",");
    const where = `fac_zip in(${zipFilter}) AND latitude IS NOT NULL AND longitude IS NOT NULL`;
    const url = `${NYS_API}?$where=${encodeURIComponent(where)}&$limit=200&$order=facility_name ASC`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const raw: any[] = await res.json();

    return raw.filter((r) => r.latitude && r.longitude).map((r): Provider => {
      const desc = r.description || "";
      const { insuranceNote } = classifyNysFacility(desc, r.facility_name || "", r.ownership_type || "");
      const d = desc.toLowerCase();
      let category: ProviderCategory = "facility";
      let categoryLabel = "Facility";
      if (d.includes("hospital") && !d.includes("nursing")) { category = "facility"; categoryLabel = "Hospital"; }
      else if (d.includes("mental") || d.includes("psychiatric") || d.includes("behavioral")) { category = "mental-health"; categoryLabel = "Mental Health Facility"; }
      else if (d.includes("nursing") || d.includes("residential")) { category = "facility"; categoryLabel = "Nursing / Residential"; }

      return {
        name: r.facility_name || "Unknown Facility",
        category,
        categoryLabel,
        specialty: desc,
        address: r.address1 || "",
        city: r.city || "",
        zip: r.fac_zip || "",
        borough: COUNTY_TO_BOROUGH[r.county] || r.county || "",
        phone: formatPhone(r.fac_phone),
        lat: parseFloat(r.latitude),
        lng: parseFloat(r.longitude),
        credential: "",
        npi: null,
        facilityName: r.facility_name || null,
        telehealth: false,
        source: "nys",
        insuranceNote,
      };
    });
  } catch {
    return [];
  }
}

/* ---- Main handler ---- */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const zipsParam = searchParams.get("zips"); // comma-separated zip codes
  const category = searchParams.get("category") || "all";
  const sourcesParam = searchParams.get("sources") || "all"; // "nppes", "cms", "nys", or "all"

  if (!zipsParam) {
    return NextResponse.json({ providers: [], count: 0 });
  }

  const zips = zipsParam.split(",").map((z) => z.trim()).filter(Boolean).slice(0, 10);

  try {
    const wantNppes = sourcesParam === "all" || sourcesParam === "nppes";
    const wantCms = sourcesParam === "all" || sourcesParam === "cms";
    const wantNys = sourcesParam === "all" || sourcesParam === "nys";

    const [nppesResults, cmsResults, nysResults] = await Promise.all([
      wantNppes ? fetchNppes(zips, category) : Promise.resolve([]),
      wantCms ? fetchCms(zips, category) : Promise.resolve([]),
      wantNys && (category === "all" || category === "facility") ? fetchNysFacilities(zips) : Promise.resolve([]),
    ]);

    // Deduplicate by NPI (prefer CMS over NPPES since CMS has cleaner specialty names)
    const npiSeen = new Set<string>();
    const merged: Provider[] = [];

    // CMS first (better specialty data)
    for (const p of cmsResults) {
      if (p.npi) npiSeen.add(p.npi);
      merged.push(p);
    }

    // NPPES (only if NPI not already seen from CMS)
    for (const p of nppesResults) {
      if (p.npi && npiSeen.has(p.npi)) continue;
      if (p.npi) npiSeen.add(p.npi);
      merged.push(p);
    }

    // NYS facilities (no NPI overlap concern)
    for (const p of nysResults) {
      merged.push(p);
    }

    // Filter by category if specified (CMS/NPPES may return extras)
    let filtered = category === "all"
      ? merged
      : merged.filter((p) => p.category === category);

    return NextResponse.json({
      providers: filtered,
      count: filtered.length,
      sources: {
        nppes: nppesResults.length,
        cms: cmsResults.length,
        nys: nysResults.length,
      },
    });
  } catch (err) {
    console.error("Find Care API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
