import { BriefcaseBusiness, CheckCircle2, ImagePlus, UserRound, type LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { HomePostJourneySections } from "@/src/domains/home/HomePostJourneySections";
import { colors, radius, spacing } from "@/src/theme/tokens";

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Props = {
  isArabic: boolean;
};

export function HomeHowItWorksSection({ isArabic }: Props) {
  const align = isArabic ? "right" : "left";
  const talentSteps: Step[] = [
    {
      icon: UserRound,
      title: isArabic ? "أنشئ ملفك" : "Create your profile",
      description: isArabic
        ? "أضف معلوماتك، مهاراتك، ومجالك الإبداعي."
        : "Add your details, skills, and creative field.",
    },
    {
      icon: ImagePlus,
      title: isArabic ? "اعرض أعمالك" : "Show your portfolio",
      description: isArabic
        ? "ارفع صورك وروابط أعمالك لتظهر بشكل احترافي."
        : "Upload visuals and work links to present yourself professionally.",
    },
    {
      icon: CheckCircle2,
      title: isArabic ? "ابدأ التقديم" : "Start applying",
      description: isArabic
        ? "استعرض الفرص وتابع طلباتك من مكان واحد."
        : "Discover opportunities and track applications in one place.",
    },
  ];

  const organizationSteps: Step[] = [
    {
      icon: BriefcaseBusiness,
      title: isArabic ? "أنشئ فرصة" : "Create opportunity",
      description: isArabic
        ? "انشر احتياجك وحدد نوع الموهبة المطلوبة."
        : "Post your needs and define the talent you’re looking for.",
    },
    {
      icon: UserRound,
      title: isArabic ? "راجع المتقدمين" : "Review applicants",
      description: isArabic
        ? "راجع الملفات والصور والمعلومات بسرعة ووضوح."
        : "Review profiles, portfolios, and details with clarity.",
    },
    {
      icon: CheckCircle2,
      title: isArabic ? "اختر الموهبة" : "Choose talent",
      description: isArabic
        ? "اتخذ قرارك بثقة وابدأ مشروعك القادم."
        : "Make confident decisions and move your project forward.",
    },
  ];

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.eyebrow}>{isArabic ? "كيف تعمل ملامح" : "HOW MLAMH WORKS"}</Text>
        <Text style={styles.title}>
          {isArabic ? "رحلة واضحة للطرفين." : "A clear path for both sides."}
        </Text>
        <Text style={styles.description}>
          {isArabic
            ? "سواء كنت موهبة تبحث عن فرصة، أو جهة تبحث عن الشخص المناسب، التجربة مصممة لتكون بسيطة واحترافية."
            : "Whether you are a talent looking for opportunities or an organization searching for the right person, the experience is simple and professional."}
        </Text>

        <JourneyCard title={isArabic ? "للمواهب" : "For Talents"} steps={talentSteps} align={align} />
        <JourneyCard title={isArabic ? "للجهات" : "For Organizations"} steps={organizationSteps} align={align} />
      </View>

      <HomePostJourneySections isArabic={isArabic} />
    </>
  );
}

function JourneyCard({ title, steps, align }: { title: string; steps: Step[]; align: "right" | "left" }) {
  return (
    <View style={styles.journeyCard}>
      <Text style={[styles.journeyLabel, { textAlign: align }]}>{title}</Text>
      <View style={styles.steps}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <View key={step.title} style={styles.stepCard}>
              <View style={styles.stepTop}>
                <View style={styles.stepIcon}>
                  <Icon size={17} color={colors.gold} />
                </View>
                <Text style={styles.stepIndex}>0{index + 1}</Text>
              </View>
              <Text style={[styles.stepTitle, { textAlign: align }]}>{step.title}</Text>
              <Text style={[styles.stepText, { textAlign: align }]}>{step.description}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 44,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingTop: 36,
    alignItems: "stretch",
  },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "600", textAlign: "center" },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 36, fontWeight: "500", marginTop: 10, textAlign: "center" },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.md, textAlign: "center" },
  journeyCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  journeyLabel: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  steps: { gap: spacing.md, marginTop: spacing.lg },
  stepCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(0,0,0,0.24)",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  stepTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,169,98,0.22)",
    backgroundColor: "rgba(201,169,98,0.06)",
  },
  stepIndex: { color: "rgba(255,255,255,0.22)", fontSize: 10 },
  stepTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 24, fontWeight: "500", marginTop: spacing.lg },
  stepText: { color: "rgba(255,255,255,0.44)", fontSize: 13, lineHeight: 22, marginTop: spacing.sm },
});
