alter table public.investor_relations_settings
  add column if not exists master_brief_ar text not null default '',
  add column if not exists master_brief_en text not null default '';

update public.investor_relations_settings
set
  master_brief_en = case
    when coalesce(trim(master_brief_en), '') = '' then coalesce(master_brief, '')
    else master_brief_en
  end,
  master_brief_ar = case
    when coalesce(trim(master_brief_ar), '') = '' then 'ملامح منصة سعودية للمواهب تركز حاليًا على الممثلين والمودلز، وتربط المواهب بالناشرين مثل شركات الإنتاج والوكالات والعلامات التجارية ومنظمي الفعاليات وأصحاب المشاريع. رحلة العمل الأساسية هي: مواهب مهنية موثوقة → فرصة أو موجز من الناشر → طلبات مؤهلة أو قائمة ترشيح مُدارة → اختيار → محادثة مباشرة وحجز. ملامح تعمل حاليًا في السعودية، وبنيتها التقنية مهيأة للتوسع إلى أسواق خليجية ودولية. تتطور قدرات الذكاء الاصطناعي في التأهيل والمطابقة وإنشاء الفرص وذكاء النمو والعمليات. عند التواصل مع المستثمرين يجب تقديم ملامح كسوق تقني وطبقة تشغيل لاكتشاف المواهب والكاستينغ، وليس كوكالة مواهب تقليدية.'
    else master_brief_ar
  end
where id = 1;
