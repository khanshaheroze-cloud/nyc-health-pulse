import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../theme/tokens';

interface ChipProps {
  label: string;
  variant: 'good' | 'warn' | 'alert';
}

const chipTheme = {
  good: { bg: '#E8F0EA', text: '#4A7C59', dot: '#4A7C59' },
  warn: { bg: '#FBF1DD', text: '#8A6A2C', dot: '#C4964A' },
  alert: { bg: '#FBE6E2', text: '#8B3A2E', dot: '#C45A4A' },
};

export function Chip({ label, variant }: ChipProps) {
  const theme = chipTheme[variant];

  return (
    <View style={[styles.chip, { backgroundColor: theme.bg, borderColor: theme.bg }]}>
      <View style={[styles.dot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});
