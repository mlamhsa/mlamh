import { StyleSheet, Text, View } from "react-native";

export default function OpportunitiesScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Opportunities</Text>
      <Text style={styles.body}>Discover feed foundation is ready for API wiring.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#181818", padding: 24, paddingTop: 72 },
  title: { color: "#F5F1E8", fontSize: 34, fontWeight: "300" },
  body: { color: "#B9B0A2", marginTop: 12, fontSize: 16, lineHeight: 24 },
});
