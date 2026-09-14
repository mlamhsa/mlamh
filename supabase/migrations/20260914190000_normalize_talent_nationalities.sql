-- Normalize legacy nationality values to the ISO-backed registry used by MLAMH.
--
-- Safe rollout note:
-- This migration is intended to ship with the application changes that read both
-- legacy and canonical nationality values. It deliberately leaves unknown values
-- (including the historical `other` value) untouched so no user choice is guessed.

with nationality_map(alias, code, english_name) as (
  values
    ('sa', 'sa', 'Saudi'), ('saudi', 'sa', 'Saudi'),
    ('ae', 'ae', 'Emirati'), ('emirati', 'ae', 'Emirati'),
    ('bh', 'bh', 'Bahraini'), ('bahraini', 'bh', 'Bahraini'),
    ('kw', 'kw', 'Kuwaiti'), ('kuwaiti', 'kw', 'Kuwaiti'),
    ('qa', 'qa', 'Qatari'), ('qatari', 'qa', 'Qatari'),
    ('om', 'om', 'Omani'), ('omani', 'om', 'Omani'),
    ('ye', 'ye', 'Yemeni'), ('yemeni', 'ye', 'Yemeni'),
    ('iq', 'iq', 'Iraqi'), ('iraqi', 'iq', 'Iraqi'),
    ('jo', 'jo', 'Jordanian'), ('jordanian', 'jo', 'Jordanian'),
    ('ps', 'ps', 'Palestinian'), ('palestinian', 'ps', 'Palestinian'),
    ('sy', 'sy', 'Syrian'), ('syrian', 'sy', 'Syrian'),
    ('lb', 'lb', 'Lebanese'), ('lebanese', 'lb', 'Lebanese'),
    ('eg', 'eg', 'Egyptian'), ('egyptian', 'eg', 'Egyptian'),
    ('sd', 'sd', 'Sudanese'), ('sudanese', 'sd', 'Sudanese'),
    ('so', 'so', 'Somali'), ('somali', 'so', 'Somali'),
    ('ly', 'ly', 'Libyan'), ('libyan', 'ly', 'Libyan'),
    ('tn', 'tn', 'Tunisian'), ('tunisian', 'tn', 'Tunisian'),
    ('dz', 'dz', 'Algerian'), ('algerian', 'dz', 'Algerian'),
    ('ma', 'ma', 'Moroccan'), ('moroccan', 'ma', 'Moroccan'),
    ('mr', 'mr', 'Mauritanian'), ('mauritanian', 'mr', 'Mauritanian'),
    ('dj', 'dj', 'Djiboutian'), ('djiboutian', 'dj', 'Djiboutian'),
    ('km', 'km', 'Comorian'), ('comorian', 'km', 'Comorian'),
    ('pk', 'pk', 'Pakistani'), ('pakistani', 'pk', 'Pakistani'),
    ('in', 'in', 'Indian'), ('indian', 'in', 'Indian'),
    ('bd', 'bd', 'Bangladeshi'), ('bangladeshi', 'bd', 'Bangladeshi'),
    ('ph', 'ph', 'Filipino'), ('filipino', 'ph', 'Filipino'),
    ('id', 'id', 'Indonesian'), ('indonesian', 'id', 'Indonesian'),
    ('my', 'my', 'Malaysian'), ('malaysian', 'my', 'Malaysian'),
    ('tr', 'tr', 'Turkish'), ('turkish', 'tr', 'Turkish'),
    ('us', 'us', 'American'), ('american', 'us', 'American'),
    ('gb', 'gb', 'British'), ('british', 'gb', 'British'),
    ('fr', 'fr', 'French'), ('french', 'fr', 'French'),
    ('de', 'de', 'German'), ('german', 'de', 'German'),
    ('es', 'es', 'Spanish'), ('spanish', 'es', 'Spanish'),
    ('it', 'it', 'Italian'), ('italian', 'it', 'Italian'),
    ('ir', 'ir', 'Iranian'), ('iranian', 'ir', 'Iranian')
), resolved as (
  select
    t.id,
    m.code,
    m.english_name
  from public.talents t
  join nationality_map m
    on lower(trim(coalesce(nullif(t.nationality_slug, ''), nullif(t.nationality, ''), ''))) = m.alias
)
update public.talents t
set
  nationality_slug = r.code,
  nationality = r.english_name
from resolved r
where t.id = r.id
  and (
    t.nationality_slug is distinct from r.code
    or t.nationality is distinct from r.english_name
  );
