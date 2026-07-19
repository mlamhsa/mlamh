create table if not exists public.homepage_value_props (
    id bigint generated always as identity primary key,

    icon_key text not null,

    title_ar text not null,
    title_en text not null,

    description_ar text not null,
    description_en text not null,

    sort_order int not null default 0,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger homepage_value_props_updated_at
before update on public.homepage_value_props
for each row
execute procedure public.update_updated_at_column();

insert into public.homepage_value_props
(
    icon_key,
    title_ar,
    title_en,
    description_ar,
    description_en,
    sort_order
)
values
(
    'shield',
    'جودة احترافية',
    'Professional Quality',
    'منصة تربط أفضل المواهب بالفرص المناسبة.',
    'A platform connecting the best talents with the right opportunities.',
    1
),
(
    'globe',
    'انتشار عالمي',
    'Global Reach',
    'الوصول إلى ناشرين وعملاء من مختلف أنحاء العالم.',
    'Reach publishers and clients from around the world.',
    2
),
(
    'zap',
    'فرص أسرع',
    'Faster Opportunities',
    'اكتشف الفرص وتقدم لها بسهولة.',
    'Discover and apply for opportunities quickly.',
    3
);