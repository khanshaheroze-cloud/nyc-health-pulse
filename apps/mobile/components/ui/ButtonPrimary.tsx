import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, fonts } from '../../theme/tokens';

interface ButtonPrimaryProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function ButtonPrimary({ label, onPress, style }: ButtonPrimaryProps) {
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
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});
