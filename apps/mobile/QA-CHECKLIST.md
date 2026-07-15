# PulseNYC Android — Manual Device QA Checklist (v1)

Run on a real device (or the dev-client emulator) before every store build.
Automated coverage: `npm test` (47 tests) + `npm run typecheck` must be green first.

## Cold start & location
- [ ] Cold start signed-out → onboarding (first run only) → Overview renders with skeletons, no crash
- [ ] Grant location → results reflect your position; origin line reads "Near Current location · wrong? Update location"
- [ ] Deny location → app still fully works from "Long Island City (default)"; origin line says so honestly
- [ ] Warm start → Eat Smart results < 3s
- [ ] No screen is gated on sign-in ("No account" promise): Overview, Eat Smart, Log, Profile, scan, verify all reachable signed-out

## Offline
- [ ] Airplane mode → Eat Smart renders the saved seed + "Offline — showing saved results near {cell}" banner
- [ ] Log a pick offline → appears in Log; Profile shows "waiting to sync"
- [ ] Verify a spot offline → "Saved — will upload later"; reconnect + reopen → Profile pending count drops to 0

## Results integrity (web parity)
- [ ] Sort chips (PulseScore/Protein/Calories/Distance/Protein per $) churned 10× → list never duplicates, never grows
- [ ] Filters (High protein / Under $15 / Quick / Open now) subset the same fetched set — no refetch spinner
- [ ] Under-$15 promise: every ranked card ≤ $15 (or $/$$ band); over-$15 only under "WORTH A SPLURGE"
- [ ] Guidance venues show "Smart ordering tips", never rank, never show a phantom order
- [ ] Late night (after 10pm): known-closed venues don't rank; label reads "Late Night"
- [ ] Places bodega card: "NYS retail food store", NEVER a letter grade; DOHMH venues show their real grade
- [ ] "est." + ~cal prefix on every generic card; ±15% disclaimer in the sheet
- [ ] Google attribution visible under the map and at the list end whenever hours/status render

## Venue sheet
- [ ] Tap card → sheet: name, cuisine·walk, real address, grade + "Inspected Mon YYYY", hours chip
- [ ] Get directions → Google Maps opens at the STOREFRONT (place-anchored, not a block-face dot)
- [ ] "🚫 This place is closed" → "✓ Flagged for review" (check /admin/metrics data_reports)
- [ ] Share order → share sheet contains pick + macros + pulsenyc.app link
- [ ] ＋ on a pick → meal sheet → logs to the chosen slot → Log tab shows it → rings update
- [ ] "✓ Fits your day" chip recalculates after logging (log a big meal → chip disappears on big picks)

## Map
- [ ] Score-bubble pins for ranked venues; tap opens the sheet (never a dead pin)
- [ ] Excluded venues render dimmed ✕ pins; tap → bubble with livenessLabel + sheet shows the reason banner

## Community verification (end-to-end)
- [ ] Venue sheet → "📸 Verify this spot" → camera → capture → preview → Submit
- [ ] Success screen shows extracted-item count; Profile count increments
- [ ] Submission appears in /admin/metrics queue with photo + extracted items (needs the 20260714 migration)
- [ ] Approve in the queue → verified_record JSON renders for copy-paste
- [ ] GPS far from venue (emulator: set location elsewhere) → submission flagged REMOTE in the queue

## Design & accessibility
- [ ] Fraunces renders on hero/titles (serif, no FOUT flash on cold start), Inter everywhere else
- [ ] Time-aware hero at dawn/day/dusk/night: greeting text contrast ≥ 4.5:1 on all variants
- [ ] TalkBack pass on the Eat Smart list: cards announce name + pick + macros + hours; chips have labels
- [ ] Font scaling 130%: cards wrap without clipping; tab bar labels intact
- [ ] All tap targets ≥ 44dp (chips are informational text, not targets)

## Scan & log
- [ ] Barcode scan (packaged food) → result card → Log → entry in today's log with the right meal slot
- [ ] Read Menu (OCR) → items ranked; no crash on a non-menu photo

## Notifications & privacy
- [ ] Meal nudges default OFF; no notification prompt on first run (only from Profile → Notifications opt-in)
- [ ] Profile → Privacy screen renders; link opens pulsenyc.app/privacy
