import { router, usePathname, type Href } from "expo-router";
import {
  Bell,
  BookOpenText,
  CircleHelp,
  BriefcaseBusiness,
  CirclePlus,
  ClipboardList,
  Grid2X2,
  Home,
  Languages,
  LogIn,
  Menu,
  MessageCircle,
  Settings,
  User,
  UserRound,
  UsersRound,
  X,
} from "lucide-react-native";
import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { colors, spacing } from "@/src/theme/tokens";

type NavItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  href: string;
  icon: typeof Home;
  primary?: boolean;
};

const HIDE_ALL = new Set(["/", "/+not-found"]);
const HIDE_BOTTOM = new Set(["/login", "/account-type", "/register", "/verify-email", "/setup-account", "/forgot-password", "/reset-password"]);

function rawPush(href: string) {
  router.push(href as Href);
}

export function NativeAppChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const session = useSessionContext();
  const { locale, setLocale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const isArabic = locale === "ar";
  const hideAll = HIDE_ALL.has(pathname);
  const hideBottom = HIDE_BOTTOM.has(pathname);
  const isAuthenticatedAppAccount = session.status === "talent" || session.status === "publisher";

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  function navigate(href: string) {
    if (href === pathname) return;
    setNavigating(true);
    rawPush(href);
  }

  const items = useMemo<NavItem[]>(() => {
    if (session.status === "talent") {
      return [
        { key: "home", labelAr: "الرئيسية", labelEn: "Home", href: "/talent-home", icon: Home },
        { key: "opportunities", labelAr: "الفرص", labelEn: "Opportunities", href: "/opportunities", icon: BriefcaseBusiness },
        { key: "profile", labelAr: "ملفي", labelEn: "My profile", href: "/profile", icon: UserRound, primary: true },
        { key: "applications", labelAr: "طلباتي", labelEn: "Applications", href: "/applications", icon: ClipboardList },
        { key: "notifications", labelAr: "الإشعارات", labelEn: "Notifications", href: "/notifications", icon: Bell },
      ];
    }
    if (session.status === "publisher") {
      return [
        { key: "home", labelAr: "الرئيسية", labelEn: "Home", href: "/publisher-home", icon: Home },
        { key: "talents", labelAr: "المواهب", labelEn: "Talents", href: "/talents", icon: UsersRound },
        { key: "publish", labelAr: "نشر", labelEn: "Publish", href: "/create-opportunity", icon: CirclePlus, primary: true },
        { key: "opportunities", labelAr: "الفرص", labelEn: "Opportunities", href: "/opportunities", icon: BriefcaseBusiness },
        { key: "account", labelAr: "حسابي", labelEn: "Account", href: "/account", icon: User },
      ];
    }
    return [
      { key: "home", labelAr: "الرئيسية", labelEn: "Home", href: "/public-home", icon: Home },
      { key: "talents", labelAr: "المواهب", labelEn: "Talents", href: "/talents", icon: UsersRound },
      { key: "join", labelAr: "انضم", labelEn: "Join", href: "/account-type", icon: CirclePlus, primary: true },
      { key: "opportunities", labelAr: "الفرص", labelEn: "Opportunities", href: "/opportunities", icon: BriefcaseBusiness },
      { key: "login", labelAr: "دخول", labelEn: "Login", href: "/login", icon: LogIn },
    ];
  }, [session.status]);

  function isActive(item: NavItem) {
    if (item.key === "home") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (hideAll) return <View style={styles.flex}>{children}</View>;

  return (
    <View style={styles.shell}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.headerRow, !isArabic && styles.rowReverse]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isArabic ? "الحساب" : "Account"}
            onPress={() => navigate(isAuthenticatedAppAccount ? "/account" : "/login")}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Grid2X2 size={22} color={colors.textSecondary} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isArabic ? "الرئيسية" : "Home"}
            onPress={() => navigate(session.status === "talent" ? "/talent-home" : session.status === "publisher" ? "/publisher-home" : "/public-home")}
            style={({ pressed }) => [styles.logoButton, pressed && styles.pressed]}
          >
            <Image
              source={isArabic ? require("../../assets/logo.ar.png") : require("../../assets/logo.en.png")}
              resizeMode="contain"
              style={styles.logo}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isArabic ? "فتح القائمة" : "Open menu"}
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Menu size={25} color={colors.textSecondary} strokeWidth={1.7} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {!hideBottom ? (
        <View style={[styles.bottomNav, isArabic && styles.rowReverse, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            const label = isArabic ? item.labelAr : item.labelEn;
            if (item.primary) {
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={() => navigate(item.href)}
                  style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
                >
                  <View style={[styles.primaryCircle, active && styles.primaryCircleActive]}>
                    <Icon size={28} color="#070707" strokeWidth={1.9} />
                  </View>
                  <Text style={styles.primaryLabel}>{label}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => navigate(item.href)}
                style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
              >
                <Icon size={23} color={active ? colors.goldSoft : "rgba(255,255,255,0.48)"} strokeWidth={active ? 2.2 : 1.7} />
                <Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
                <View style={[styles.navDot, active && styles.navDotActive]} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {navigating ? (
        <View pointerEvents="none" style={styles.navigationFeedback}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.navigationFeedbackText}>{isArabic ? "جارٍ الانتقال…" : "Loading…"}</Text>
        </View>
      ) : null}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.drawer, isArabic ? styles.drawerRight : styles.drawerLeft, { paddingTop: insets.top + spacing.md }]}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={[styles.drawerTitle, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "القائمة" : "Menu"}</Text>
                <Text style={[styles.drawerSubtitle, { textAlign: isArabic ? "right" : "left" }]}>{isArabic ? "تصفح ملامح" : "Explore MLAMH"}</Text>
              </View>
              <Pressable onPress={() => setMenuOpen(false)} style={styles.closeButton}>
                <X size={21} color={colors.textSecondary} />
              </Pressable>
            </View>

            <DrawerLink label={isArabic ? "المواهب" : "Talents"} icon={UsersRound} onPress={() => { setMenuOpen(false); navigate("/talents"); }} isArabic={isArabic} />
            <DrawerLink label={isArabic ? "الفرص" : "Opportunities"} icon={BriefcaseBusiness} onPress={() => { setMenuOpen(false); navigate("/opportunities"); }} isArabic={isArabic} />
            {!isAuthenticatedAppAccount ? (
              <DrawerLink label={isArabic ? "للناشرين" : "For Publishers"} icon={Grid2X2} onPress={() => { setMenuOpen(false); navigate("/publishers"); }} isArabic={isArabic} />
            ) : (
              <DrawerLink label={isArabic ? "الرسائل" : "Messages"} icon={MessageCircle} onPress={() => { setMenuOpen(false); navigate("/messages"); }} isArabic={isArabic} />
            )}
            <DrawerLink label={isArabic ? "مشهد ملامح" : "MLAMH Scene"} icon={BookOpenText} onPress={() => { setMenuOpen(false); navigate("/scene"); }} isArabic={isArabic} />
            <View style={styles.drawerDivider} />
            <DrawerLink label={isArabic ? "الإعدادات" : "Settings"} icon={Settings} onPress={() => { setMenuOpen(false); navigate("/settings"); }} isArabic={isArabic} />
            <DrawerLink label={isArabic ? "المساعدة والدعم" : "Help & support"} icon={CircleHelp} onPress={() => { setMenuOpen(false); navigate("/settings"); }} isArabic={isArabic} />
            <View style={styles.drawerDivider} />
            <DrawerLink
              label={isArabic ? "English" : "العربية"}
              icon={Languages}
              onPress={() => { setMenuOpen(false); void setLocale(isArabic ? "en" : "ar"); }}
              isArabic={isArabic}
            />
            <DrawerLink
              label={!isAuthenticatedAppAccount ? (isArabic ? "تسجيل الدخول" : "Sign in") : (isArabic ? "حسابي" : "Account")}
              icon={!isAuthenticatedAppAccount ? LogIn : User}
              onPress={() => { setMenuOpen(false); navigate(isAuthenticatedAppAccount ? "/account" : "/login"); }}
              isArabic={isArabic}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DrawerLink({ label, icon: Icon, onPress, isArabic }: { label: string; icon: typeof Home; onPress: () => void; isArabic: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.drawerLink, isArabic && styles.rowReverse, pressed && styles.pressed]}>
      <View style={styles.drawerIcon}><Icon size={20} color={colors.goldSoft} strokeWidth={1.7} /></View>
      <Text style={[styles.drawerLinkText, { textAlign: isArabic ? "right" : "left" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shell: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: "#050505", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  headerRow: { height: 64, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoButton: { flex: 1, height: 60, alignItems: "center", justifyContent: "center", marginHorizontal: spacing.md },
  logo: { width: 142, height: 58 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  bottomNav: { minHeight: 78, flexDirection: "row", alignItems: "flex-end", backgroundColor: "rgba(3,3,3,0.98)", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)", paddingHorizontal: 2 },
  navItem: { flex: 1, minWidth: 0, height: 72, alignItems: "center", justifyContent: "center", gap: 4, position: "relative" },
  navLabel: { color: "rgba(255,255,255,0.48)", fontSize: 10, fontWeight: "500", maxWidth: 72 },
  navLabelActive: { color: colors.goldSoft },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "transparent" },
  navDotActive: { backgroundColor: colors.goldSoft },
  primaryCircle: { position: "absolute", top: -25, width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderColor: "#050505", backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  primaryCircleActive: { backgroundColor: "#E1C579" },
  primaryLabel: { color: colors.goldSoft, fontSize: 10, fontWeight: "600", marginTop: 32 },
  navigationFeedback: { position: "absolute", top: 82, alignSelf: "center", zIndex: 50, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(8,8,8,0.96)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  navigationFeedbackText: { color: colors.textSecondary, fontSize: 10, fontWeight: "600" },
  modalRoot: { flex: 1, flexDirection: "row" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.68)" },
  drawer: { position: "absolute", top: 0, bottom: 0, width: "86%", maxWidth: 360, backgroundColor: "#090909", borderColor: "rgba(255,255,255,0.10)", paddingHorizontal: spacing.lg },
  drawerRight: { right: 0, borderLeftWidth: 1 },
  drawerLeft: { left: 0, borderRightWidth: 1 },
  drawerHeader: { minHeight: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", marginBottom: spacing.lg },
  drawerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  drawerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  closeButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" },
  drawerLink: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: 18, paddingHorizontal: spacing.sm, marginBottom: 6 },
  rowReverse: { flexDirection: "row-reverse" },
  drawerIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: "rgba(201,169,98,0.18)", backgroundColor: "rgba(201,169,98,0.06)", alignItems: "center", justifyContent: "center" },
  drawerLinkText: { flex: 1, color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: "600" },
  drawerDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: spacing.md },
});
