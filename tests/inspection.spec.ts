import { test, expect } from "@playwright/test";
import { latestGradedInspection } from "../src/lib/inspection";

// July 5 2026 audit: R40 (CAMIS 50096385) rendered "Inspected Apr 2023" while
// DOHMH has a graded Apr 2026 cycle inspection. Fixture mirrors the live rows.

const R40_ROWS = [
  { grade: "A", inspection_date: "2026-04-03T00:00:00.000" },
  { grade: "A", inspection_date: "2026-04-03T00:00:00.000" },
  { grade: "A", inspection_date: "2023-04-08T00:00:00.000" },
  { grade: "A", inspection_date: "2023-04-08T00:00:00.000" },
];

test.describe("latestGradedInspection", () => {
  test("R40 fixture: picks the Apr 2026 graded cycle, not Apr 2023", () => {
    const r = latestGradedInspection(R40_ROWS);
    expect(r.grade).toBe("A");
    expect(r.inspectedAt).toContain("2026-04-03");
    expect(r.notYetGraded).toBe(false);
  });

  test("ungraded newest row: grade comes from the most recent GRADED row", () => {
    const r = latestGradedInspection([
      { grade: null, inspection_date: "2026-06-01T00:00:00.000" }, // ungraded re-inspection
      { grade: "B", inspection_date: "2025-11-10T00:00:00.000" },
      { grade: "A", inspection_date: "2024-02-01T00:00:00.000" },
    ]);
    expect(r.grade).toBe("B");
    expect(r.inspectedAt).toContain("2025-11-10");
  });

  test("never graded: falls back to latest inspection, flagged notYetGraded", () => {
    const r = latestGradedInspection([
      { grade: "", inspection_date: "2026-01-15T00:00:00.000" },
      { grade: null, inspection_date: "2025-09-01T00:00:00.000" },
    ]);
    expect(r.grade).toBeNull();
    expect(r.inspectedAt).toContain("2026-01-15");
    expect(r.notYetGraded).toBe(true);
  });

  test("empty rows: nulls, not yet graded false", () => {
    const r = latestGradedInspection([]);
    expect(r.grade).toBeNull();
    expect(r.inspectedAt).toBeNull();
    expect(r.notYetGraded).toBe(false);
  });
});
