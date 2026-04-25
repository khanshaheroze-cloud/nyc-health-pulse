import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../../theme/tokens';

interface StatTileProps {
  value: string;
  label: string;
  dot?: string;
}

export function StatTile({ value, label, dot }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.valueRow}>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: `${fonts.display}_400Regular`,
    color: colors.textPrimary,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
