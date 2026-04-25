import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

interface SectionLabelProps {
  children: string;
  icon?: string;
}

export function SectionLabel({ children, icon }: SectionLabelProps) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  icon: {
    fontSize: 11,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
  },
});
