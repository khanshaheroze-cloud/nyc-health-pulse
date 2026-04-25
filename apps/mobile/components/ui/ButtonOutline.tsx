import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, fonts } from '../../theme/tokens';

interface ButtonOutlineProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function ButtonOutline({ label, onPress, style }: ButtonOutlineProps) {
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
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.accentSage,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    color: colors.accentSage,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});
