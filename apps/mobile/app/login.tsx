import { StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>MLAMH</Text>
      <Text style={styles.body}>Authentication screen foundation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F1E8", padding: 24, paddingTop: 72 },
  title: { color: "#D4A017", fontSize: 20, fontWeight: "600" },
  body: { color: "#2E2E2E", marginTop: 18, fontSize: 30, fontWeight: "300" },
});
