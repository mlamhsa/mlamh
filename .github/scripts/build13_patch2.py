from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f"pattern missing in {path}: {old[:160]!r}")
    p.write_text(s.replace(old,new,count))

# Expand public talent contract with public gallery media.
replace('lib/mobile/public-talent-contract.ts','  imageUrl: string | null;','  imageUrl: string | null;\n  galleryImages: string[];')
replace('lib/mobile/public-talent-contract.ts','    imageUrl: talent.image_url || null,','    imageUrl: talent.image_url || null,\n    galleryImages: [...new Set([...(Array.isArray(talent.gallery_images) ? talent.gallery_images : []), ...(Array.isArray(talent.photos) ? talent.photos : []), ...(Array.isArray(talent.full_body_photos) ? talent.full_body_photos : [])].filter((value): value is string => typeof value === "string" && Boolean(value.trim())))].slice(0, 12),')
replace('apps/mobile/lib/talents.ts','  imageUrl: string | null;','  imageUrl: string | null;\n  galleryImages: string[];')

# Stronger directory filters end to end.
replace('apps/mobile/lib/talents.ts','  heightMax?: string;\n  page?: number;','  heightMax?: string;\n  language?: string;\n  dialect?: string;\n  skill?: string;\n  availability?: string;\n  readyToTravel?: "true" | "";\n  page?: number;')
replace('apps/mobile/lib/talents.ts','  append(params, "heightMax", filters.heightMax?.trim());\n  append(params, "page", filters.page ?? 1);','  append(params, "heightMax", filters.heightMax?.trim());\n  append(params, "language", filters.language?.trim());\n  append(params, "dialect", filters.dialect?.trim());\n  append(params, "skill", filters.skill?.trim());\n  append(params, "availability", filters.availability?.trim());\n  append(params, "readyToTravel", filters.readyToTravel);\n  append(params, "page", filters.page ?? 1);')
replace('lib/talent/public-directory-filters.ts','  heightMax?: string;\n};','  heightMax?: string;\n  language?: string;\n  dialect?: string;\n  skill?: string;\n  availability?: string;\n  readyToTravel?: string;\n};')
replace('lib/talent/public-directory-filters.ts','    heightMax,\n  });','    heightMax,\n    language: filters.language,\n    dialect: filters.dialect,\n    skill: filters.skill,\n    availability: filters.availability,\n    readyToTravel: filters.readyToTravel === "true" ? true : undefined,\n  });')
replace('app/api/mobile/talents/route.ts','      heightMax: url.searchParams.get("heightMax") || undefined,','      heightMax: url.searchParams.get("heightMax") || undefined,\n      language: url.searchParams.get("language") || undefined,\n      dialect: url.searchParams.get("dialect") || undefined,\n      skill: url.searchParams.get("skill") || undefined,\n      availability: url.searchParams.get("availability") || undefined,\n      readyToTravel: url.searchParams.get("readyToTravel") || undefined,')

replace('lib/supabase/public-talents.ts','  heightMax?: number | null;\n};','  heightMax?: number | null;\n  language?: string;\n  dialect?: string;\n  skill?: string;\n  availability?: string;\n  readyToTravel?: boolean;\n};')
needle='function matchesAdvancedFilters(talent: Talent, options: GetPublicTalentsOptions) {\n  if (!matchesGender(talent, options.gender)) return false;\n  if (!matchesNationality(talent, options.nationality)) return false;'
replacement=needle+'\n  const includes = (values: string[] | null | undefined, requested?: string) => !requested || (Array.isArray(values) && values.some((value) => value.toLowerCase().includes(requested.toLowerCase())));\n  if (!includes(talent.languages, options.language)) return false;\n  if (!includes(talent.dialects, options.dialect)) return false;\n  if (!includes(talent.skills, options.skill)) return false;\n  if (options.availability && String(talent.availability_status ?? "").toLowerCase() !== options.availability.toLowerCase()) return false;\n  if (options.readyToTravel === true && talent.ready_to_travel !== true) return false;'
replace('lib/supabase/public-talents.ts',needle,replacement)

# Wire the new filter controls in the mobile directory.
replace('apps/mobile/app/talents/index.tsx','  heightMax: "",\n  page: 1,','  heightMax: "",\n  language: "",\n  dialect: "",\n  skill: "",\n  availability: "",\n  readyToTravel: "",\n  page: 1,')
old='''          <View style={[styles.twoColumns, isRtl && styles.rowRtl]}>
            <FilterInput value={draft.ageMin ?? ""} onChange={(ageMin) => setDraft((current) => ({ ...current, ageMin: numeric(ageMin) }))} placeholder={isArabic ? "من" : "Min"} isRtl={isRtl} technical />
            <FilterInput value={draft.ageMax ?? ""} onChange={(ageMax) => setDraft((current) => ({ ...current, ageMax: numeric(ageMax) }))} placeholder={isArabic ? "إلى" : "Max"} isRtl={isRtl} technical />
          </View>'''
new=old+'''\n          <Text style={[styles.filterLabel, directionText(isRtl)]}>{isArabic ? "الطول (سم)" : "Height (cm)"}</Text>
          <View style={[styles.twoColumns, isRtl && styles.rowRtl]}>
            <FilterInput value={draft.heightMin ?? ""} onChange={(heightMin) => setDraft((current) => ({ ...current, heightMin: numeric(heightMin) }))} placeholder={isArabic ? "من" : "Min"} isRtl={isRtl} technical />
            <FilterInput value={draft.heightMax ?? ""} onChange={(heightMax) => setDraft((current) => ({ ...current, heightMax: numeric(heightMax) }))} placeholder={isArabic ? "إلى" : "Max"} isRtl={isRtl} technical />
          </View>
          <FilterInput value={draft.language ?? ""} onChange={(language) => setDraft((current) => ({ ...current, language }))} placeholder={isArabic ? "اللغة" : "Language"} isRtl={isRtl} />
          <FilterInput value={draft.dialect ?? ""} onChange={(dialect) => setDraft((current) => ({ ...current, dialect }))} placeholder={isArabic ? "اللهجة" : "Dialect"} isRtl={isRtl} />
          <FilterInput value={draft.skill ?? ""} onChange={(skill) => setDraft((current) => ({ ...current, skill }))} placeholder={isArabic ? "المهارة" : "Skill"} isRtl={isRtl} />
          <View style={[styles.chips, isRtl && styles.rowRtl]}>
            <Pressable onPress={() => setDraft((current) => ({ ...current, availability: current.availability === "available_now" ? "" : "available_now" }))} style={[styles.chip, draft.availability === "available_now" && styles.chipActive]}><Text style={[styles.chipText, draft.availability === "available_now" && styles.chipTextActive]}>{isArabic ? "متاح الآن" : "Available now"}</Text></Pressable>
            <Pressable onPress={() => setDraft((current) => ({ ...current, readyToTravel: current.readyToTravel === "true" ? "" : "true" }))} style={[styles.chip, draft.readyToTravel === "true" && styles.chipActive]}><Text style={[styles.chipText, draft.readyToTravel === "true" && styles.chipTextActive]}>{isArabic ? "متاح للسفر" : "Open to travel"}</Text></Pressable>
          </View>'''
replace('apps/mobile/app/talents/index.tsx',old,new)

# Talent profile: use app locale, translate system tokens, add gallery, and improve CTA language.
replace('apps/mobile/app/talents/[slug].tsx','import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";','import { isRtlLocale } from "@/lib/i18n";\nimport { useAppLocale } from "@/lib/locale-context";')
replace('apps/mobile/app/talents/[slug].tsx','  const locale = getDeviceLocale();','  const { locale } = useAppLocale();')
replace('apps/mobile/app/talents/[slug].tsx','  const facts = [item.city, item.age ? `${item.age} ${isArabic ? "سنة" : "years"}` : null, item.heightCm ? `${item.heightCm} cm` : null, item.nationality].filter(Boolean);','  const facts = [item.city, item.age ? `${item.age} ${isArabic ? "سنة" : "years"}` : null, item.heightCm ? `${item.heightCm} cm` : null, displayToken(item.nationality, locale)].filter(Boolean);')
replace('apps/mobile/app/talents/[slug].tsx','    { label: isArabic ? "التوفر" : "Availability", value: item.availabilityStatus },','    { label: isArabic ? "التوفر" : "Availability", value: displayToken(item.availabilityStatus, locale) },')
replace('apps/mobile/app/talents/[slug].tsx','      {item.bio ? <Section','      {item.galleryImages.length ? <Section title={isArabic ? "معرض الصور" : "Gallery"} styles={styles} isRtl={isRtl}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.galleryRow, isRtl && styles.rowRtl]}>{item.galleryImages.map((url,index)=><Image key={`${url}-${index}`} source={{uri:url}} style={styles.galleryImage} resizeMode="cover" />)}</ScrollView></Section> : null}\n      {item.bio ? <Section')
replace('apps/mobile/app/talents/[slug].tsx','<ChipList values={[...item.languages, ...item.dialects]} styles={styles} isRtl={isRtl} />','<ChipList values={[...item.languages, ...item.dialects].map((value)=>displayToken(value,locale))} styles={styles} isRtl={isRtl} />')
replace('apps/mobile/app/talents/[slug].tsx','<ChipList values={item.skills} styles={styles} isRtl={isRtl} />','<ChipList values={item.skills.map((value)=>displayToken(value,locale))} styles={styles} isRtl={isRtl} />')
replace('apps/mobile/app/talents/[slug].tsx','{isArabic ? "أنشئ فرصة لهذه الموهبة" : "Create an opportunity"}','{isArabic ? "دعوة الموهبة إلى فرصة" : "Invite talent to an opportunity"}')
replace('apps/mobile/app/talents/[slug].tsx','function Section({ title, styles, isRtl, children }','function displayToken(value:string|null|undefined,locale:"ar"|"en"){if(!value)return null;const map:Record<string,{ar:string;en:string}>={available_now:{ar:"متاح الآن",en:"Available now"},arabic:{ar:"العربية",en:"Arabic"},english:{ar:"الإنجليزية",en:"English"},acting:{ar:"تمثيل",en:"Acting"},voice_over:{ar:"تعليق صوتي",en:"Voice over"},saudi:{ar:"سعودي",en:"Saudi"},najdi:{ar:"نجدي",en:"Najdi"},hijazi:{ar:"حجازي",en:"Hijazi"},gulf:{ar:"خليجي",en:"Gulf"}};return map[value.toLowerCase()]?.[locale]??value.replace(/_/g," ");}\nfunction Section({ title, styles, isRtl, children }')
replace('apps/mobile/app/talents/[slug].tsx','section: { borderTopWidth: 1,','galleryRow:{gap:10,paddingVertical:2},galleryImage:{width:150,height:190,borderRadius:16,backgroundColor:theme.grayElevated}, section: { borderTopWidth: 1,')
