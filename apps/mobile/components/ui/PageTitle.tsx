import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

interface PageTitleProps {
  children: string;
}

export function PageTitle({ children }: PageTitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
});
