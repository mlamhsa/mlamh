import { router } from "expo-router";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { getSceneFeed, searchScene } from "@/src/domains/scene/api";
import type { SceneArticle, SceneFeedResponse } from "@/src/domains/scene/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function SceneFeedScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const DirectionArrow = isArabic ? ChevronLeft : ChevronRight;
  const [data, setData] = useState<SceneFeedResponse | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SceneArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try { setData(await getSceneFeed(locale)); } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, [locale]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) { setSearchResults([]); setSearching(false); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      void searchScene(normalized, locale)
        .then((result) => setSearchResults(result.items))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [locale, query]);

  const isSearch = query.trim().length >= 2;
  const latest = useMemo(() => data?.latest ?? [], [data?.latest]);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        <View style={styles.hero}>
          <View style={[styles.row, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
            <BookOpen size={18} color={colors.gold} />
            <Text style={styles.eyebrow}>{isArabic ? "مشهد ملامح" : "MLAMH SCENE"}</Text>
          </View>
          <Text style={[styles.title, { textAlign: align }]}>{isArabic ? "معرفة تصنع حضورك" : "Knowledge that shapes your presence"}</Text>
          <Text style={[styles.subtitle, { textAlign: align }]}>{isArabic ? "أدلة، قصص، تقارير ومحتوى عملي للمواهب والناشرين داخل ملامح." : "Guides, stories, reports, and practical knowledge for talent and publishers."}</Text>
        </View>

        <View style={[styles.searchBox, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
          <Search size={18} color={colors.gold} />
          <TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث في مشهد ملامح..." : "Search MLAMH Scene..."} placeholderTextColor="rgba(255,255,255,0.28)" style={[styles.searchInput, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} />
        </View>

        {loading ? <Text style={styles.stateText}>{isArabic ? "جارٍ تحميل المشهد..." : "Loading Scene..."}</Text> : null}
        {!loading && error ? <StateCard text={isArabic ? "تعذر تحميل مشهد ملامح." : "Unable to load MLAMH Scene."} action={isArabic ? "إعادة المحاولة" : "Retry"} onPress={() => void load()} /> : null}

        {!loading && !error && data ? (
          <>
            {data.categories.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
                {data.categories.map((category) => (
                  <Pressable key={category.id} onPress={() => router.push(`/scene/category/${category.slug}` as never)} style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {isSearch ? (
              <Section title={isArabic ? "نتائج البحث" : "Search results"} isArabic={isArabic}>
                {searching ? <Text style={styles.stateText}>{isArabic ? "جارٍ البحث..." : "Searching..."}</Text> : searchResults.length ? searchResults.map((article) => <ArticleCard key={article.id} article={article} isArabic={isArabic} DirectionArrow={DirectionArrow} />) : <Text style={styles.stateText}>{isArabic ? "لا توجد نتائج مطابقة." : "No matching results."}</Text>}
              </Section>
            ) : (
              <>
                {data.lead ? <LeadCard article={data.lead} isArabic={isArabic} DirectionArrow={DirectionArrow} /> : null}
                {latest.length ? <Section title={isArabic ? "الأحدث" : "Latest"} isArabic={isArabic}>{latest.map((article) => <ArticleCard key={article.id} article={article} isArabic={isArabic} DirectionArrow={DirectionArrow} />)}</Section> : null}
                {data.reports.length ? <Section title={isArabic ? "تقارير" : "Reports"} isArabic={isArabic}>{data.reports.map((article) => <ArticleCard key={article.id} article={article} isArabic={isArabic} DirectionArrow={DirectionArrow} />)}</Section> : null}
                {data.stories.length ? <Section title={isArabic ? "قصص" : "Stories"} isArabic={isArabic}>{data.stories.map((article) => <ArticleCard key={article.id} article={article} isArabic={isArabic} DirectionArrow={DirectionArrow} />)}</Section> : null}
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function LeadCard({ article, isArabic, DirectionArrow }: { article: SceneArticle; isArabic: boolean; DirectionArrow: typeof ChevronRight }) {
  return <Pressable onPress={() => router.push(`/scene/article/${article.slug}` as never)} style={styles.leadCard}>
    {article.coverImageUrl ? <Image source={{ uri: article.coverImageUrl }} style={styles.leadImage} /> : null}
    <Text style={[styles.leadTitle, { textAlign: isArabic ? "right" : "left" }]}>{article.title}</Text>
    <Text style={[styles.leadExcerpt, { textAlign: isArabic ? "right" : "left" }]} numberOfLines={3}>{article.excerpt}</Text>
    <View style={[styles.readRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}><Text style={styles.readText}>{isArabic ? "اقرأ الآن" : "Read now"}</Text><DirectionArrow size={15} color={colors.gold} /></View>
  </Pressable>;
}

function ArticleCard({ article, isArabic, DirectionArrow }: { article: SceneArticle; isArabic: boolean; DirectionArrow: typeof ChevronRight }) {
  return <Pressable onPress={() => router.push(`/scene/article/${article.slug}` as never)} style={[styles.articleCard, isArabic && styles.rowReverse]}>
    <View style={styles.articleCopy}><Text style={[styles.articleTitle, { textAlign: isArabic ? "right" : "left" }]} numberOfLines={2}>{article.title}</Text><Text style={[styles.articleExcerpt, { textAlign: isArabic ? "right" : "left" }]} numberOfLines={2}>{article.excerpt}</Text></View>
    <DirectionArrow size={16} color={colors.gold} />
  </Pressable>;
}

function Section({ title, children, isArabic }: { title: string; children: React.ReactNode; isArabic: boolean }) { return <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{title}</Text><View style={styles.sectionList}>{children}</View></View>; }
function StateCard({ text, action, onPress }: { text: string; action: string; onPress: () => void }) { return <View style={styles.stateCard}><Text style={styles.stateText}>{text}</Text><Pressable onPress={onPress} style={styles.retry}><Text style={styles.retryText}>{action}</Text></Pressable></View>; }

const styles = StyleSheet.create({ rowReverse:{flexDirection:"row-reverse"},safeArea:{flex:1,backgroundColor:colors.background},content:{paddingHorizontal:spacing.lg,paddingBottom:56},hero:{paddingTop:spacing.xl},row:{alignItems:"center",gap:spacing.sm},eyebrow:{color:colors.gold,fontSize:10,fontWeight:"800",letterSpacing:1.4},title:{color:colors.textPrimary,fontSize:31,lineHeight:39,fontWeight:"700",marginTop:spacing.md},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:22,marginTop:spacing.sm},searchBox:{minHeight:52,alignItems:"center",gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,marginTop:spacing.lg,backgroundColor:colors.surface},searchInput:{flex:1,color:colors.textPrimary,fontSize:14},categories:{gap:spacing.sm,paddingVertical:spacing.lg},categoryChip:{borderWidth:1,borderColor:"rgba(201,169,98,0.28)",backgroundColor:"rgba(201,169,98,0.07)",borderRadius:999,paddingHorizontal:spacing.md,paddingVertical:9},categoryText:{color:colors.gold,fontSize:11,fontWeight:"700"},leadCard:{borderWidth:1,borderColor:"rgba(201,169,98,0.22)",backgroundColor:"rgba(201,169,98,0.05)",borderRadius:radius.xl,overflow:"hidden",padding:spacing.lg},leadImage:{width:"100%",height:190,borderRadius:radius.lg,marginBottom:spacing.md},leadTitle:{color:colors.textPrimary,fontSize:23,lineHeight:31,fontWeight:"700"},leadExcerpt:{color:colors.textSecondary,fontSize:12,lineHeight:21,marginTop:spacing.sm},readRow:{alignItems:"center",gap:6,marginTop:spacing.md},readText:{color:colors.gold,fontSize:11,fontWeight:"700"},section:{marginTop:spacing.xl},sectionTitle:{color:colors.textPrimary,fontSize:17,fontWeight:"800",marginBottom:spacing.md},sectionList:{gap:spacing.sm},articleCard:{minHeight:92,flexDirection:"row",alignItems:"center",gap:spacing.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.lg,padding:spacing.md},articleCopy:{flex:1},articleTitle:{color:colors.textPrimary,fontSize:14,lineHeight:20,fontWeight:"700"},articleExcerpt:{color:colors.textMuted,fontSize:10,lineHeight:17,marginTop:4},stateCard:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.xl,padding:spacing.lg,marginTop:spacing.xl,alignItems:"center"},stateText:{color:colors.textMuted,fontSize:12,lineHeight:20,textAlign:"center",marginTop:spacing.md},retry:{marginTop:spacing.md,borderRadius:999,backgroundColor:colors.gold,paddingHorizontal:spacing.lg,paddingVertical:10},retryText:{color:"#090909",fontSize:11,fontWeight:"800"}});
