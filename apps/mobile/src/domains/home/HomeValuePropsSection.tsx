import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Globe,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import type { MobileHomeValueProp } from "@/src/domains/home/types";
import { colors, radius, spacing } from "@/src/theme/tokens";

type Props = {
  isArabic: boolean;
  items: MobileHomeValueProp[];
};

export function HomeValuePropsSection({ isArabic, items }: Props) {
  const align = isArabic ? "right" : "left";
  const visibleItems = items.slice(0, 4);

  if (visibleItems.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.eyebrow, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
        {isArabic ? "لماذا ملامح" : "WHY MLAMH"}
      </Text>
      <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
        {isArabic
          ? "كل ما تحتاجه لاكتشاف الموهبة المناسبة، في مكان واحد."
          : "Everything you need to discover the right talent, in one place."}
      </Text>
      <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
        {isArabic
          ? "ملامح تجمع المواهب، الجهات، والفرص داخل تجربة واحدة مصممة لتكون أسرع، أوضح، وأكثر احترافية."
          : "MLAMH brings talents, organizations, and opportunities into one experience built to be faster, clearer, and more professional."}
      </Text>

      <View style={styles.cards}>
        {visibleItems.map((item, index) => {
          const Icon = getIcon(item.iconKey);
          return (
            <View key={item.id} style={[styles.card, index === 0 && styles.primaryCard]}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <Icon size={18} color={colors.gold} />
                </View>
                <Text style={styles.indexText}>0{index + 1}</Text>
              </View>
              <Text style={[styles.cardTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.title}</Text>
              <Text style={[styles.cardText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.description}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.proofStrip}>
        <ProofRow icon={Shield} text={isArabic ? "مراجعة واعتماد للملفات" : "Profile review and approval"} isArabic={isArabic} />
        <ProofRow icon={Building2} text={isArabic ? "فرص من جهات تبحث عن مواهب" : "Opportunities from organizations looking for talent"} isArabic={isArabic} />
        <ProofRow icon={Sparkles} text={isArabic ? "اكتشاف أسرع للمواهب المناسبة" : "Faster talent discovery"} isArabic={isArabic} />
      </View>
    </View>
  );
}

function ProofRow({ icon: Icon, text, isArabic }: { icon: LucideIcon; text: string; isArabic: boolean }) {
  return (
    <View style={[styles.proofRow, isArabic && styles.proofRowRtl]}>
      <Icon size={16} color={colors.gold} />
      <Text style={[styles.proofText, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{text}</Text>
    </View>
  );
}

function getIcon(iconKey: MobileHomeValueProp["iconKey"]): LucideIcon {
  switch (iconKey) {
    case "shield":
      return Shield;
    case "globe":
      return Globe;
    case "zap":
      return Zap;
    case "building":
      return Building2;
    case "clipboard":
      return ClipboardCheck;
    case "badge":
      return BadgeCheck;
    default:
      return Sparkles;
  }
}

const styles = StyleSheet.create({
  section: {
    marginTop: 44,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingTop: 36,
  },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "600" },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 36, fontWeight: "500", marginTop: 10 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 25, marginTop: spacing.lg },
  cards: { gap: spacing.md, marginTop: spacing.xxl },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  primaryCard: { borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.045)" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
    backgroundColor: "rgba(201,169,98,0.065)",
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { color: "rgba(255,255,255,0.22)", fontSize: 10 },
  cardTitle: { color: colors.textPrimary, fontSize: 21, lineHeight: 28, fontWeight: "500", marginTop: spacing.xl },
  cardText: { color: "rgba(255,255,255,0.44)", fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  proofStrip: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", gap: spacing.md },
  proofRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  proofRowRtl: { flexDirection: "row-reverse" },
  proofText: { flex: 1, color: "rgba(255,255,255,0.48)", fontSize: 13, lineHeight: 20 },
});
