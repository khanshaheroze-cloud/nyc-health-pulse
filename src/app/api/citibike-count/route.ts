export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      "https://gbfs.citibikenyc.com/gbfs/en/station_status.json",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Citi Bike API ${res.status}`);
    const data = await res.json();
    const stations: { num_bikes_available: number }[] =
      data?.data?.stations ?? [];
    const totalBikes = stations.reduce(
      (sum, s) => sum + (s.num_bikes_available ?? 0),
      0
    );
    return Response.json({
      totalBikes,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { totalBikes: null, timestamp: new Date().toISOString() },
      { status: 502 }
    );
  }
}
