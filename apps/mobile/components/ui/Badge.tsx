import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../theme/tokens';

interface BadgeProps {
  label: string;
  variant: 'protein' | 'fiber' | 'smart';
}

const badgeTheme = {
  protein: { bg: '#E8F0EA', text: '#4A7C59' },
  fiber: { bg: '#EAF2DE', text: '#5A6E2E' },
  smart: { bg: '#EAF0F8', text: '#3B7CB8' },
};

export function Badge({ label, variant }: BadgeProps) {
  const theme = badgeTheme[variant];

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});
