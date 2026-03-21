/**
 * Schema.org Dataset JSON-LD helpers for SEO structured data.
 * Used on section pages to describe the public health datasets displayed.
 */

const SITE_URL = "https://pulsenyc.app";

const CREATOR = {
  "@type": "Organization" as const,
  name: "Pulse NYC",
  url: SITE_URL,
};

const NYC_SPATIAL = {
  "@type": "Place" as const,
  name: "New York City, NY",
};

const NYC_OPEN_DATA_LICENSE = "https://opendata.cityofnewyork.us/overview/#termsofuse";
const CDC_DATA_LICENSE = "https://www.cdc.gov/other/information.html";
const CENSUS_LICENSE = "https://www.census.gov/data/developers/about/terms-of-service.html";

export interface DatasetJsonLdInput {
  name: string;
  description: string;
  /** Path segment, e.g. "/air-quality" */
  pagePath: string;
  license?: string;
  /** e.g. "2020-01-01/.." for ongoing, or "2016/2017" */
  temporalCoverage: string;
  /** Array of source API URLs */
  distribution: { name: string; contentUrl: string }[];
  /** Key metric names displayed on the page */
  variableMeasured: string[];
}

export function buildDatasetJsonLd(datasets: DatasetJsonLdInput[]) {
  const items = datasets.map((d) => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: d.name,
    description: d.description,
    url: `${SITE_URL}${d.pagePath}`,
    creator: CREATOR,
    license: d.license ?? NYC_OPEN_DATA_LICENSE,
    temporalCoverage: d.temporalCoverage,
    spatialCoverage: NYC_SPATIAL,
    distribution: d.distribution.map((dist) => ({
      "@type": "DataDownload",
      name: dist.name,
      contentUrl: dist.contentUrl,
    })),
    variableMeasured: d.variableMeasured,
  }));

  return items.length === 1 ? items[0] : items;
}

export function datasetJsonLdString(datasets: DatasetJsonLdInput[]): string {
  return JSON.stringify(buildDatasetJsonLd(datasets));
}

// Pre-built license constants for convenience
export { NYC_OPEN_DATA_LICENSE, CDC_DATA_LICENSE, CENSUS_LICENSE };
