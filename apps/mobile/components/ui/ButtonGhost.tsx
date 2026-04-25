import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, fonts } from '../../theme/tokens';

interface ButtonGhostProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function ButtonGhost({ label, onPress, style }: ButtonGhostProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});
