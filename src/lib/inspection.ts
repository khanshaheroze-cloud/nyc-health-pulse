/* DOHMH 43nn-pn8j returns ONE ROW PER INSPECTION (× violation), so any code
 * that takes "the first row" for a venue shows an arbitrary — often the
 * oldest — inspection. July 5 2026 audit: R40 (CAMIS 50096385) rendered
 * "Inspected Apr 2023" while DOHMH has a graded Apr 2026 cycle inspection.
 *
 * Rule: everywhere a venue shows a grade + date, use the MOST RECENT GRADED
 * inspection (max inspection_date where grade is present). If the venue has
 * never been graded, fall back to the latest inspection, labeled "not yet
 * graded" by the caller.
 */

export interface InspectionRow {
  grade?: string | null;
  inspection_date?: string | null;
}

export interface LatestInspection {
  grade: string | null;
  inspectedAt: string | null;
  /** true = venue has inspections but none carries a grade */
  notYetGraded: boolean;
}

export function latestGradedInspection(rows: InspectionRow[]): LatestInspection {
  let bestGraded: InspectionRow | null = null;
  let bestAny: InspectionRow | null = null;
  for (const r of rows) {
    const d = r.inspection_date ?? "";
    if (!bestAny || d > (bestAny.inspection_date ?? "")) bestAny = r;
    if (r.grade && r.grade.trim()) {
      if (!bestGraded || d > (bestGraded.inspection_date ?? "")) bestGraded = r;
    }
  }
  if (bestGraded) {
    return { grade: bestGraded.grade!, inspectedAt: bestGraded.inspection_date ?? null, notYetGraded: false };
  }
  return { grade: null, inspectedAt: bestAny?.inspection_date ?? null, notYetGraded: bestAny != null };
}
