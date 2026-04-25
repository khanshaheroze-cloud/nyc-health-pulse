import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

interface RingGaugeProps {
  value: number;
  max: number;
  color: string;
  size: number;
  label?: string;
  unit?: string;
}

export function RingGauge({ value, max, color, size, label, unit }: RingGaugeProps) {
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(value, 0), max);
  const strokeDashoffset = circumference * (1 - clamped / max);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.borderLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Fill */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color }]}>{Math.round(clamped)}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontFamily: `${fonts.display}_400Regular`,
  },
  unit: {
    fontSize: 9,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: -2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`,
    marginTop: 4,
  },
});
