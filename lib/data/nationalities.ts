export type NationalityDefinition = {
  slug: string;
  ar: string;
  en: string;
  countryAr: string;
  countryEn: string;
  code: string;
};

const DEFINITIONS: Array<[string, string, string, string, string]> = [
  ["AF", "أفغاني", "Afghan", "أفغانستان", "Afghanistan"], ["AL", "ألباني", "Albanian", "ألبانيا", "Albania"], ["DZ", "جزائري", "Algerian", "الجزائر", "Algeria"], ["AD", "أندوري", "Andorran", "أندورا", "Andorra"], ["AO", "أنغولي", "Angolan", "أنغولا", "Angola"], ["AG", "أنتيغوي وبربودي", "Antiguan and Barbudan", "أنتيغوا وبربودا", "Antigua and Barbuda"], ["AR", "أرجنتيني", "Argentine", "الأرجنتين", "Argentina"], ["AM", "أرميني", "Armenian", "أرمينيا", "Armenia"], ["AU", "أسترالي", "Australian", "أستراليا", "Australia"], ["AT", "نمساوي", "Austrian", "النمسا", "Austria"], ["AZ", "أذربيجاني", "Azerbaijani", "أذربيجان", "Azerbaijan"],
  ["BS", "باهامي", "Bahamian", "الباهاما", "Bahamas"], ["BH", "بحريني", "Bahraini", "البحرين", "Bahrain"], ["BD", "بنغلاديشي", "Bangladeshi", "بنغلاديش", "Bangladesh"], ["BB", "بربادوسي", "Barbadian", "بربادوس", "Barbados"], ["BY", "بيلاروسي", "Belarusian", "بيلاروس", "Belarus"], ["BE", "بلجيكي", "Belgian", "بلجيكا", "Belgium"], ["BZ", "بليزي", "Belizean", "بليز", "Belize"], ["BJ", "بنيني", "Beninese", "بنين", "Benin"], ["BT", "بوتاني", "Bhutanese", "بوتان", "Bhutan"], ["BO", "بوليفي", "Bolivian", "بوليفيا", "Bolivia"], ["BA", "بوسني", "Bosnian", "البوسنة والهرسك", "Bosnia and Herzegovina"], ["BW", "بوتسواني", "Botswanan", "بوتسوانا", "Botswana"], ["BR", "برازيلي", "Brazilian", "البرازيل", "Brazil"], ["BN", "بروناوي", "Bruneian", "بروناي", "Brunei"], ["BG", "بلغاري", "Bulgarian", "بلغاريا", "Bulgaria"], ["BF", "بوركينابي", "Burkinabe", "بوركينا فاسو", "Burkina Faso"], ["BI", "بوروندي", "Burundian", "بوروندي", "Burundi"],
  ["CV", "رأس أخضري", "Cape Verdean", "الرأس الأخضر", "Cape Verde"], ["KH", "كمبودي", "Cambodian", "كمبوديا", "Cambodia"], ["CM", "كاميروني", "Cameroonian", "الكاميرون", "Cameroon"], ["CA", "كندي", "Canadian", "كندا", "Canada"], ["CF", "أفريقي أوسطي", "Central African", "جمهورية أفريقيا الوسطى", "Central African Republic"], ["TD", "تشادي", "Chadian", "تشاد", "Chad"], ["CL", "تشيلي", "Chilean", "تشيلي", "Chile"], ["CN", "صيني", "Chinese", "الصين", "China"], ["CO", "كولومبي", "Colombian", "كولومبيا", "Colombia"], ["KM", "قمري", "Comorian", "جزر القمر", "Comoros"], ["CG", "كونغولي", "Congolese", "الكونغو", "Republic of the Congo"], ["CD", "كونغولي ديمقراطي", "Congolese", "جمهورية الكونغو الديمقراطية", "DR Congo"], ["CR", "كوستاريكي", "Costa Rican", "كوستاريكا", "Costa Rica"], ["CI", "إيفواري", "Ivorian", "ساحل العاج", "Cote d'Ivoire"], ["HR", "كرواتي", "Croatian", "كرواتيا", "Croatia"], ["CU", "كوبي", "Cuban", "كوبا", "Cuba"], ["CY", "قبرصي", "Cypriot", "قبرص", "Cyprus"], ["CZ", "تشيكي", "Czech", "التشيك", "Czechia"],
  ["DK", "دنماركي", "Danish", "الدنمارك", "Denmark"], ["DJ", "جيبوتي", "Djiboutian", "جيبوتي", "Djibouti"], ["DM", "دومينيكي", "Dominican", "دومينيكا", "Dominica"], ["DO", "دومينيكاني", "Dominican", "جمهورية الدومينيكان", "Dominican Republic"],
  ["EC", "إكوادوري", "Ecuadorian", "الإكوادور", "Ecuador"], ["EG", "مصري", "Egyptian", "مصر", "Egypt"], ["SV", "سلفادوري", "Salvadoran", "السلفادور", "El Salvador"], ["GQ", "غيني استوائي", "Equatorial Guinean", "غينيا الاستوائية", "Equatorial Guinea"], ["ER", "إريتري", "Eritrean", "إريتريا", "Eritrea"], ["EE", "إستوني", "Estonian", "إستونيا", "Estonia"], ["SZ", "إسواتيني", "Swazi", "إسواتيني", "Eswatini"], ["ET", "إثيوبي", "Ethiopian", "إثيوبيا", "Ethiopia"],
  ["FJ", "فيجي", "Fijian", "فيجي", "Fiji"], ["FI", "فنلندي", "Finnish", "فنلندا", "Finland"], ["FR", "فرنسي", "French", "فرنسا", "France"],
  ["GA", "غابوني", "Gabonese", "الغابون", "Gabon"], ["GM", "غامبي", "Gambian", "غامبيا", "Gambia"], ["GE", "جورجي", "Georgian", "جورجيا", "Georgia"], ["DE", "ألماني", "German", "ألمانيا", "Germany"], ["GH", "غاني", "Ghanaian", "غانا", "Ghana"], ["GR", "يوناني", "Greek", "اليونان", "Greece"], ["GD", "غرينادي", "Grenadian", "غرينادا", "Grenada"], ["GT", "غواتيمالي", "Guatemalan", "غواتيمالا", "Guatemala"], ["GN", "غيني", "Guinean", "غينيا", "Guinea"], ["GW", "غيني بيساوي", "Bissau-Guinean", "غينيا بيساو", "Guinea-Bissau"], ["GY", "غياني", "Guyanese", "غيانا", "Guyana"],
  ["HT", "هايتي", "Haitian", "هايتي", "Haiti"], ["HN", "هندوراسي", "Honduran", "هندوراس", "Honduras"], ["HU", "مجري", "Hungarian", "المجر", "Hungary"],
  ["IS", "آيسلندي", "Icelandic", "آيسلندا", "Iceland"], ["IN", "هندي", "Indian", "الهند", "India"], ["ID", "إندونيسي", "Indonesian", "إندونيسيا", "Indonesia"], ["IR", "إيراني", "Iranian", "إيران", "Iran"], ["IQ", "عراقي", "Iraqi", "العراق", "Iraq"], ["IE", "أيرلندي", "Irish", "أيرلندا", "Ireland"], ["IL", "إسرائيلي", "Israeli", "إسرائيل", "Israel"], ["IT", "إيطالي", "Italian", "إيطاليا", "Italy"],
  ["JM", "جامايكي", "Jamaican", "جامايكا", "Jamaica"], ["JP", "ياباني", "Japanese", "اليابان", "Japan"], ["JO", "أردني", "Jordanian", "الأردن", "Jordan"],
  ["KZ", "كازاخستاني", "Kazakh", "كازاخستان", "Kazakhstan"], ["KE", "كيني", "Kenyan", "كينيا", "Kenya"], ["KI", "كيريباتي", "I-Kiribati", "كيريباتي", "Kiribati"], ["KP", "كوري شمالي", "North Korean", "كوريا الشمالية", "North Korea"], ["KR", "كوري جنوبي", "South Korean", "كوريا الجنوبية", "South Korea"], ["KW", "كويتي", "Kuwaiti", "الكويت", "Kuwait"], ["KG", "قيرغيزي", "Kyrgyz", "قيرغيزستان", "Kyrgyzstan"],
  ["LA", "لاوسي", "Lao", "لاوس", "Laos"], ["LV", "لاتفي", "Latvian", "لاتفيا", "Latvia"], ["LB", "لبناني", "Lebanese", "لبنان", "Lebanon"], ["LS", "ليسوتي", "Basotho", "ليسوتو", "Lesotho"], ["LR", "ليبيري", "Liberian", "ليبيريا", "Liberia"], ["LY", "ليبي", "Libyan", "ليبيا", "Libya"], ["LI", "ليختنشتايني", "Liechtensteiner", "ليختنشتاين", "Liechtenstein"], ["LT", "ليتواني", "Lithuanian", "ليتوانيا", "Lithuania"], ["LU", "لوكسمبورغي", "Luxembourgish", "لوكسمبورغ", "Luxembourg"],
  ["MG", "مدغشقري", "Malagasy", "مدغشقر", "Madagascar"], ["MW", "ملاوي", "Malawian", "ملاوي", "Malawi"], ["MY", "ماليزي", "Malaysian", "ماليزيا", "Malaysia"], ["MV", "مالديفي", "Maldivian", "المالديف", "Maldives"], ["ML", "مالي", "Malian", "مالي", "Mali"], ["MT", "مالطي", "Maltese", "مالطا", "Malta"], ["MH", "مارشالي", "Marshallese", "جزر مارشال", "Marshall Islands"], ["MR", "موريتاني", "Mauritanian", "موريتانيا", "Mauritania"], ["MU", "موريشيوسي", "Mauritian", "موريشيوس", "Mauritius"], ["MX", "مكسيكي", "Mexican", "المكسيك", "Mexico"], ["FM", "ميكرونيزي", "Micronesian", "ميكرونيزيا", "Micronesia"], ["MD", "مولدوفي", "Moldovan", "مولدوفا", "Moldova"], ["MC", "موناكي", "Monegasque", "موناكو", "Monaco"], ["MN", "منغولي", "Mongolian", "منغوليا", "Mongolia"], ["ME", "مونتينيغري", "Montenegrin", "الجبل الأسود", "Montenegro"], ["MA", "مغربي", "Moroccan", "المغرب", "Morocco"], ["MZ", "موزمبيقي", "Mozambican", "موزمبيق", "Mozambique"], ["MM", "ميانماري", "Burmese", "ميانمار", "Myanmar"],
  ["NA", "ناميبي", "Namibian", "ناميبيا", "Namibia"], ["NR", "ناوروي", "Nauruan", "ناورو", "Nauru"], ["NP", "نيبالي", "Nepali", "نيبال", "Nepal"], ["NL", "هولندي", "Dutch", "هولندا", "Netherlands"], ["NZ", "نيوزيلندي", "New Zealander", "نيوزيلندا", "New Zealand"], ["NI", "نيكاراغوي", "Nicaraguan", "نيكاراغوا", "Nicaragua"], ["NE", "نيجري", "Nigerien", "النيجر", "Niger"], ["NG", "نيجيري", "Nigerian", "نيجيريا", "Nigeria"], ["MK", "مقدوني شمالي", "Macedonian", "مقدونيا الشمالية", "North Macedonia"], ["NO", "نرويجي", "Norwegian", "النرويج", "Norway"],
  ["OM", "عماني", "Omani", "عُمان", "Oman"],
  ["PK", "باكستاني", "Pakistani", "باكستان", "Pakistan"], ["PW", "بالاوي", "Palauan", "بالاو", "Palau"], ["PS", "فلسطيني", "Palestinian", "فلسطين", "Palestine"], ["PA", "بنمي", "Panamanian", "بنما", "Panama"], ["PG", "بابوا غيني", "Papua New Guinean", "بابوا غينيا الجديدة", "Papua New Guinea"], ["PY", "باراغواياني", "Paraguayan", "باراغواي", "Paraguay"], ["PE", "بيروفي", "Peruvian", "بيرو", "Peru"], ["PH", "فلبيني", "Filipino", "الفلبين", "Philippines"], ["PL", "بولندي", "Polish", "بولندا", "Poland"], ["PT", "برتغالي", "Portuguese", "البرتغال", "Portugal"],
  ["QA", "قطري", "Qatari", "قطر", "Qatar"],
  ["RO", "روماني", "Romanian", "رومانيا", "Romania"], ["RU", "روسي", "Russian", "روسيا", "Russia"], ["RW", "رواندي", "Rwandan", "رواندا", "Rwanda"],
  ["KN", "كيتسي ونيفيسي", "Kittitian and Nevisian", "سانت كيتس ونيفيس", "Saint Kitts and Nevis"], ["LC", "سانت لوسي", "Saint Lucian", "سانت لوسيا", "Saint Lucia"], ["VC", "فنسنتي", "Vincentian", "سانت فنسنت والغرينادين", "Saint Vincent and the Grenadines"], ["WS", "ساموي", "Samoan", "ساموا", "Samoa"], ["SM", "سان ماريني", "Sammarinese", "سان مارينو", "San Marino"], ["ST", "ساوتومي", "Sao Tomean", "ساو تومي وبرينسيب", "Sao Tome and Principe"], ["SA", "سعودي", "Saudi", "السعودية", "Saudi Arabia"], ["SN", "سنغالي", "Senegalese", "السنغال", "Senegal"], ["RS", "صربي", "Serbian", "صربيا", "Serbia"], ["SC", "سيشيلي", "Seychellois", "سيشل", "Seychelles"], ["SL", "سيراليوني", "Sierra Leonean", "سيراليون", "Sierra Leone"], ["SG", "سنغافوري", "Singaporean", "سنغافورة", "Singapore"], ["SK", "سلوفاكي", "Slovak", "سلوفاكيا", "Slovakia"], ["SI", "سلوفيني", "Slovenian", "سلوفينيا", "Slovenia"], ["SB", "سليماني", "Solomon Islander", "جزر سليمان", "Solomon Islands"], ["SO", "صومالي", "Somali", "الصومال", "Somalia"], ["ZA", "جنوب أفريقي", "South African", "جنوب أفريقيا", "South Africa"], ["SS", "جنوب سوداني", "South Sudanese", "جنوب السودان", "South Sudan"], ["ES", "إسباني", "Spanish", "إسبانيا", "Spain"], ["LK", "سريلانكي", "Sri Lankan", "سريلانكا", "Sri Lanka"], ["SD", "سوداني", "Sudanese", "السودان", "Sudan"], ["SR", "سورينامي", "Surinamese", "سورينام", "Suriname"], ["SE", "سويدي", "Swedish", "السويد", "Sweden"], ["CH", "سويسري", "Swiss", "سويسرا", "Switzerland"], ["SY", "سوري", "Syrian", "سوريا", "Syria"],
  ["TW", "تايواني", "Taiwanese", "تايوان", "Taiwan"], ["TJ", "طاجيكي", "Tajik", "طاجيكستان", "Tajikistan"], ["TZ", "تنزاني", "Tanzanian", "تنزانيا", "Tanzania"], ["TH", "تايلاندي", "Thai", "تايلاند", "Thailand"], ["TL", "تيموري", "Timorese", "تيمور الشرقية", "Timor-Leste"], ["TG", "توغولي", "Togolese", "توغو", "Togo"], ["TO", "تونغي", "Tongan", "تونغا", "Tonga"], ["TT", "ترينيدادي وتوباغوني", "Trinidadian and Tobagonian", "ترينيداد وتوباغو", "Trinidad and Tobago"], ["TN", "تونسي", "Tunisian", "تونس", "Tunisia"], ["TR", "تركي", "Turkish", "تركيا", "Turkey"], ["TM", "تركماني", "Turkmen", "تركمانستان", "Turkmenistan"], ["TV", "توفالوي", "Tuvaluan", "توفالو", "Tuvalu"],
  ["UG", "أوغندي", "Ugandan", "أوغندا", "Uganda"], ["UA", "أوكراني", "Ukrainian", "أوكرانيا", "Ukraine"], ["AE", "إماراتي", "Emirati", "الإمارات", "United Arab Emirates"], ["GB", "بريطاني", "British", "المملكة المتحدة", "United Kingdom"], ["US", "أمريكي", "American", "الولايات المتحدة", "United States"], ["UY", "أوروغواياني", "Uruguayan", "أوروغواي", "Uruguay"], ["UZ", "أوزبكي", "Uzbek", "أوزبكستان", "Uzbekistan"],
  ["VU", "فانواتي", "Ni-Vanuatu", "فانواتو", "Vanuatu"], ["VA", "فاتيكاني", "Vatican", "الفاتيكان", "Vatican City"], ["VE", "فنزويلي", "Venezuelan", "فنزويلا", "Venezuela"], ["VN", "فيتنامي", "Vietnamese", "فيتنام", "Vietnam"],
  ["YE", "يمني", "Yemeni", "اليمن", "Yemen"], ["ZM", "زامبي", "Zambian", "زامبيا", "Zambia"], ["ZW", "زيمبابوي", "Zimbabwean", "زيمبابوي", "Zimbabwe"],
];

export const NATIONALITIES: NationalityDefinition[] = DEFINITIONS.map(([code, ar, en, countryAr, countryEn]) => ({
  code,
  slug: code.toLowerCase(),
  ar,
  en,
  countryAr,
  countryEn,
}));

export function getNationalityBySlug(slug?: string | null) {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  return NATIONALITIES.find((nationality) => nationality.slug === normalized) ?? null;
}

export function getNationalityByCode(code?: string | null) {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return NATIONALITIES.find((nationality) => nationality.code === normalized) ?? null;
}

export function findNationality(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return NATIONALITIES.find((nationality) =>
    [nationality.code, nationality.slug, nationality.ar, nationality.en, nationality.countryAr, nationality.countryEn]
      .some((candidate) => candidate.toLowerCase() === normalized),
  ) ?? null;
}
