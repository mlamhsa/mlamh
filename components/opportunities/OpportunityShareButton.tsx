"use client";

type ShareButtonProps = {
  title: string;
};

export default function OpportunityShareButton({ title }: ShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("تم نسخ رابط الفرصة");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-[#c8a45d]/40 px-5 py-3 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
    >
      مشاركة الفرصة
    </button>
  );
}