import { View, Text, StyleSheet } from "react-native";
import { ScoreBadge } from "./ScoreBadge";

interface MenuItemDisplay {
  id: string;
  name: string;
  calories: number;
  protein: number;
  pulseScore: number;
}

interface Props {
  restaurantName: string;
  cuisine: string;
  walkMinutes: number;
  items: MenuItemDisplay[];
}

export function SmartMenuCard({ restaurantName, cuisine, walkMinutes, items }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{restaurantName}</Text>
        <Text style={styles.distance}>{walkMinutes}min walk</Text>
      </View>
      <Text style={styles.cuisine}>{cuisine}</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.menuItem}>
          <View style={styles.left}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.macros}>
              {item.calories} cal · {item.protein}g protein
            </Text>
          </View>
          <ScoreBadge score={item.pulseScore} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#e2e8e4",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "700", color: "#1e2d2a" },
  distance: { fontSize: 12, color: "#8ba89c", fontWeight: "500" },
  cuisine: { fontSize: 12, color: "#5a7a6e", marginTop: 2, marginBottom: 12 },
  menuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0f4f2",
  },
  left: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1e2d2a" },
  macros: { fontSize: 11, color: "#8ba89c", marginTop: 2 },
});
