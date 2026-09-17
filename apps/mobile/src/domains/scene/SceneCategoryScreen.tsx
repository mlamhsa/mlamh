import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSceneCategory } from "@/src/domains/scene/api";
import type { SceneCategoryResponse } from "@/src/domains/scene/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function SceneCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const DirectionArrow = isArabic ? ChevronLeft : ChevronRight;
  const categorySlug = typeof slug === "string" ? slug : "";
  const [data, setData] = useState<SceneCategoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!categorySlug) { setError(true); setLoading(false); return; }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try { setData(await getSceneCategory(categorySlug, locale)); } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, [categorySlug, locale]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, isArabic && styles.rowReverse]}>
        <Pressable onPress={() => router.back()} style={styles.back}><BackIcon size={20} color={colors.textSecondary} /></Pressable>
        <View style={styles.headerCopy}><Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "مشهد ملامح" : "MLAMH SCENE"}</Text><Text style={[styles.headerTitle, { textAlign: align }]} numberOfLines={1}>{data?.category.name ?? (isArabic ? "القسم" : "Category")}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}>
        {loading ? <Text style={styles.stateText}>{isArabic ? "جارٍ تحميل القسم..." : "Loading category..."}</Text> : null}
        {!loading && error ? <View style={styles.stateCard}><Text style={styles.stateText}>{isArabic ? "تعذر تحميل هذا القسم." : "Unable to load this category."}</Text></View> : null}
        {!loading && !error && data ? <>
          {data.category.description ? <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{data.category.description}</Text> : null}
          <View style={styles.list}>{data.articles.map((article) => <Pressable key={article.id} onPress={() => router.push(`/scene/article/${article.slug}` as never)} style={[styles.card, isArabic && styles.rowReverse]}><View style={styles.copy}><Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{article.title}</Text><Text style={[styles.excerpt, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} numberOfLines={3}>{article.excerpt}</Text><Text style={[styles.meta, { textAlign: align }]}>{article.readTimeMinutes ? `${article.readTimeMinutes} ${isArabic ? "دقيقة" : "min"}` : article.authorName}</Text></View><DirectionArrow size={16} color={colors.gold} /></Pressable>)}</View>
          {data.articles.length === 0 ? <Text style={styles.stateText}>{isArabic ? "لا توجد مقالات منشورة في هذا القسم بعد." : "No published articles in this category yet."}</Text> : null}
        </> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({rowReverse:{flexDirection:"row-reverse"},safeArea:{flex:1,backgroundColor:colors.background},header:{minHeight:68,flexDirection:"row",alignItems:"center",gap:spacing.md,paddingHorizontal:spacing.lg,borderBottomWidth:1,borderBottomColor:colors.border},back:{width:42,height:42,borderWidth:1,borderColor:colors.border,borderRadius:21,alignItems:"center",justifyContent:"center"},headerCopy:{flex:1},eyebrow:{color:colors.gold,fontSize:9,fontWeight:"800",letterSpacing:1.3},headerTitle:{color:colors.textPrimary,fontSize:18,fontWeight:"700",marginTop:2},content:{padding:spacing.lg,paddingBottom:56},description:{color:colors.textSecondary,fontSize:13,lineHeight:22,marginBottom:spacing.lg},list:{gap:spacing.md},card:{minHeight:112,flexDirection:"row",alignItems:"center",gap:spacing.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.xl,padding:spacing.lg},copy:{flex:1},title:{color:colors.textPrimary,fontSize:16,lineHeight:23,fontWeight:"700"},excerpt:{color:colors.textMuted,fontSize:11,lineHeight:18,marginTop:6},meta:{color:colors.gold,fontSize:9,marginTop:8},stateCard:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.xl,padding:spacing.lg},stateText:{color:colors.textMuted,fontSize:12,lineHeight:20,textAlign:"center",marginTop:spacing.lg}});
