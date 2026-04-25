import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  tone?: 'sage' | 'warm' | 'sky' | 'peach';
  accent?: boolean;
  style?: ViewStyle;
}

const toneBg: Record<string, string> = {
  sage: colors.surfaceSage,
  warm: colors.surfaceWarm,
  sky: colors.surfaceSky,
  peach: colors.surfacePeach,
};

export function Card({ children, tone, accent, style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        tone ? { backgroundColor: toneBg[tone] } : undefined,
        accent ? styles.accent : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  accent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accentSage,
  },
});
