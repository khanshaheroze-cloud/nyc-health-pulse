import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

interface MacroBarProps {
  value: number;
  max: number;
  label?: string;
}

export function MacroBar({ value, max, label }: MacroBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_600SemiBold`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  track: {
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.surfaceWarm,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.accentSage,
  },
});
