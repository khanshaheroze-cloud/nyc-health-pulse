/* ── VenueCard — one card, web parity (LiveResultsStrip card, July 14 2026) ──
 * Renders SERVER intelligence only: category chip, walk, top pick with
 * cal · protein · estPrice ("est." when isGeneric), DOHMH grade OR "NYS
 * retail food store" (never a fake grade), tone-colored hours chip,
 * "✓ Fits your day", and "Log this →". Guidance venues render their
 * ordering tip instead of a pick — honestly framed, visibly not ranked.
 */
import { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts, radius, tabularNums } from "../../theme/tokens";
import { Chip } from "../ui/Chip";
import { orderPriceLabel, formatWalk } from "../../lib/results";
import type { ApiRestaurant } from "../../lib/types";

function hoursTone(tone: "open" | "closed" | "unknown"): "hours-open" | "hours-closed" | "hours-unknown" {
  return tone === "open" ? "hours-open" : tone === "closed" ? "hours-closed" : "hours-unknown";
}

export const VenueCard = memo(function VenueCard({
  venue,
  onPress,
  onLog,
  fitsCalLeft,
  compact = false,
}: {
  venue: ApiRestaurant;
  onPress: (venue: ApiRestaurant) => void;
  /** Called with the top pick when "Log this →" is tapped. */
  onLog?: (venue: ApiRestaurant) => void;
  /** Remaining calories today (nutrition tracker); null/undefined = no chip. */
  fitsCalLeft?: number | null;
  /** Carousel variant — tighter spacing, no log button. */
  compact?: boolean;
}) {
  const pick = venue.topPicks[0];
  const fits =
    fitsCalLeft != null && fitsCalLeft > 0 && pick != null && pick.calories > 0 && pick.calories <= fitsCalLeft;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(venue)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${venue.restaurantName}. ${pick ? `Top pick ${pick.name}, ${pick.calories} calories, ${pick.protein} grams protein.` : "Ordering guidance available."} ${venue.hoursChip?.label ?? ""}`}
    >
      {venue.categoryChip && (
        <Chip tone="category" icon={venue.categoryChip.icon} label={venue.categoryChip.label} />
      )}

      <Text style={styles.name} numberOfLines={1}>
        {venue.restaurantName}
      </Text>

      {venue.verifiedBadge === "verified" && (
        <View style={styles.badgeRow}>
          <Chip tone="verified" label={`✓ Menu verified${venue.verifiedAt ? ` ${new Date(venue.verifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}`} />
        </View>
      )}
      {venue.verifiedBadge === "needs-recheck" && (
        <View style={styles.badgeRow}>
          <Chip tone="recheck" label="⟳ Verified — needs re-check" />
        </View>
      )}

      {(venue.locationCount ?? 1) > 1 && (
        <Text style={styles.locations}>
          {venue.locationCount} locations nearby · nearest {venue.walkMinutes} min
        </Text>
      )}

      <View style={styles.chipRow}>
        <Chip tone="walk" label={formatWalk(venue)} />
        {pick && pick.protein > 0 && <Chip tone="protein" label={`${pick.protein}g protein`} />}
        {pick && pick.calories > 0 && (
          <Chip tone="cal" label={`${venue.isGeneric ? "~" : ""}${pick.calories} cal`} />
        )}
        {venue.grade ? (
          <Chip tone="grade" label={`Grade ${venue.grade}`} accessibilityLabel={`Health inspection grade ${venue.grade}`} />
        ) : venue.source === "places" ? (
          <Chip
            tone="nys"
            label="NYS retail food store"
            accessibilityLabel="Licensed by New York State Agriculture and Markets, no city letter grade"
          />
        ) : null}
        <Chip tone="price" label={venue.priceTier} />
        {venue.hoursChip && <Chip tone={hoursTone(venue.hoursChip.tone)} label={venue.hoursChip.label} />}
        {fits && fitsCalLeft != null && (
          <Chip tone="fits" label={`✓ Fits your day — ${fitsCalLeft.toLocaleString()} cal left`} />
        )}
      </View>

      <View style={styles.orderRow}>
        {pick ? (
          <Text style={styles.orderText} numberOfLines={2}>
            <Text style={styles.orderLabel}>Order: </Text>
            {pick.name}
            <Text style={[styles.orderPrice, tabularNums]}> — {orderPriceLabel(venue)}</Text>
            {venue.isGeneric && <Text style={styles.est}> est.</Text>}
            {pick.overCalTarget && <Text style={styles.overCal}> over the 600-cal target</Text>}
          </Text>
        ) : (
          <Text style={styles.orderText} numberOfLines={2}>
            <Text style={styles.orderLabel}>Smart ordering tips</Text>
            {venue.orderingTip ? ` — ${venue.orderingTip}` : " inside"}
          </Text>
        )}
      </View>

      {!compact && pick && onLog && (
        <TouchableOpacity
          onPress={() => onLog(venue)}
          style={styles.logBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Log ${pick.name}`}
        >
          <Text style={styles.logBtnText}>Log this →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  cardCompact: { width: 260, marginRight: 10, marginBottom: 0 },
  name: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
    marginTop: 4,
    marginBottom: 2,
  },
  badgeRow: { marginTop: 2, marginBottom: 2 },
  locations: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginBottom: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, marginBottom: 10 },
  orderRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    borderStyle: "dashed",
    paddingTop: 8,
  },
  orderText: { fontSize: 13, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, lineHeight: 18 },
  orderLabel: { color: colors.textPrimary, fontFamily: `${fonts.body}_700Bold` },
  orderPrice: { color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  est: { fontSize: 11, color: colors.textMuted },
  overCal: { fontSize: 11, color: colors.caution },
  logBtn: { marginTop: 8, alignSelf: "flex-start", minHeight: 24, justifyContent: "center" },
  logBtnText: { fontSize: 12, color: colors.accentSage, fontFamily: `${fonts.body}_700Bold` },
});
