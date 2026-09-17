import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSceneArticle } from "@/src/domains/scene/api";
import type { SceneArticle } from "@/src/domains/scene/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function SceneArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const articleSlug = typeof slug === "string" ? slug : "";
  const [article, setArticle] = useState<SceneArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!articleSlug) { setError(true); setLoading(false); return; }
    setLoading(true); setError(false);
    try { const result = await getSceneArticle(articleSlug, locale); setArticle(result.article); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [articleSlug, locale]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, isArabic && styles.rowReverse]}><Pressable onPress={() => router.back()} style={styles.back}><BackIcon size={20} color={colors.textSecondary} /></Pressable><Text style={styles.headerLabel}>{isArabic ? "مشهد ملامح" : "MLAMH SCENE"}</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <Text style={styles.stateText}>{isArabic ? "جارٍ تحميل المقال..." : "Loading article..."}</Text> : null}
        {!loading && error ? <View style={styles.stateCard}><Text style={styles.stateText}>{isArabic ? "تعذر تحميل المقال." : "Unable to load article."}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Retry"}</Text></Pressable></View> : null}
        {!loading && !error && article ? <>
          {article.coverImageUrl ? <Image source={{ uri: article.coverImageUrl }} accessibilityLabel={article.coverImageAlt || article.title} style={styles.cover} /> : null}
          <Text style={[styles.type, { textAlign: align }]}>{article.contentType.toUpperCase()}</Text>
          <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{article.title}</Text>
          {article.excerpt ? <Text style={[styles.excerpt, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{article.excerpt}</Text> : null}
          <View style={[styles.metaRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>{article.authorName ? <Text style={styles.meta}>{article.authorName}</Text> : null}{article.readTimeMinutes ? <Text style={styles.meta}>{article.readTimeMinutes} {isArabic ? "دقيقة قراءة" : "min read"}</Text> : null}</View>
          <Text style={[styles.body, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{article.content}</Text>
          {article.tags.length ? <View style={[styles.tags, isArabic && styles.rowReverse]}>{article.tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}</View> : null}
        </> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({rowReverse:{flexDirection:"row-reverse"},safeArea:{flex:1,backgroundColor:colors.background},header:{minHeight:64,flexDirection:"row",alignItems:"center",gap:spacing.md,paddingHorizontal:spacing.lg,borderBottomWidth:1,borderBottomColor:colors.border},back:{width:42,height:42,borderWidth:1,borderColor:colors.border,borderRadius:21,alignItems:"center",justifyContent:"center"},headerLabel:{color:colors.gold,fontSize:10,fontWeight:"800",letterSpacing:1.2},content:{padding:spacing.lg,paddingBottom:64},cover:{width:"100%",height:230,borderRadius:radius.xl,marginBottom:spacing.lg},type:{color:colors.gold,fontSize:10,fontWeight:"800",letterSpacing:1.2},title:{color:colors.textPrimary,fontSize:30,lineHeight:39,fontWeight:"700",marginTop:spacing.sm},excerpt:{color:colors.textSecondary,fontSize:15,lineHeight:25,marginTop:spacing.md},metaRow:{alignItems:"center",gap:spacing.md,marginTop:spacing.md},meta:{color:colors.textMuted,fontSize:10},body:{color:colors.textPrimary,fontSize:15,lineHeight:28,marginTop:spacing.xl},tags:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm,marginTop:spacing.xl},tag:{borderWidth:1,borderColor:colors.border,borderRadius:999,paddingHorizontal:spacing.md,paddingVertical:7},tagText:{color:colors.textMuted,fontSize:10},stateCard:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.xl,padding:spacing.lg,alignItems:"center"},stateText:{color:colors.textMuted,fontSize:12,lineHeight:20,textAlign:"center",marginTop:spacing.lg},retry:{marginTop:spacing.md,borderRadius:999,backgroundColor:colors.gold,paddingHorizontal:spacing.lg,paddingVertical:10},retryText:{color:"#090909",fontSize:11,fontWeight:"800"}});
