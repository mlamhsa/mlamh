import {
  createFooterLinkAction,
  deleteFooterLinkAction,
} from "@/app/admin/footer/footer-actions";

import { AdminActionButton } from "@/components/admin/ui/AdminActionButton";

import { FooterLinkForm } from "./FooterLinkForm";
import { FooterSectionCard } from "./FooterSectionCard";

type FooterLink = {
  id: number;
  section: string;
  label_ar: string;
  label_en: string;
  href: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
};

type FooterLinksCardProps = {
  links: FooterLink[];
};

const sections = [
  { key: "platform", label: "Platform" },
  { key: "talent", label: "Talent" },
  { key: "publisher", label: "Publisher" },
  { key: "legal", label: "Legal" },
  { key: "social", label: "Social" },
];

export function FooterLinksCard({
  links,
}: FooterLinksCardProps) {
  async function handleCreateLink(formData: FormData) {
    "use server";

    await createFooterLinkAction({
      section: formData.get("section"),
      label_ar: formData.get("label_ar"),
      label_en: formData.get("label_en"),
      href: formData.get("href"),
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_active: formData.get("is_active") === "on",
      open_in_new_tab:
        formData.get("open_in_new_tab") === "on",
    });
  }

  return (
    <FooterSectionCard
      title="Footer Links"
      description="Manage all footer navigation links and visibility."
    >
      <div className="grid gap-8">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-light text-white">
            Add New Link
          </h3>

          <div className="mt-5">
            <FooterLinkForm
              submitLabel="Add Link"
              action={handleCreateLink}
            />
          </div>
        </div>

        {sections.map((section) => {
          const sectionLinks = links.filter(
            (link) => link.section === section.key,
          );

          return (
            <div
              key={section.key}
              className="rounded-3xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-white">
                  {section.label}
                </h3>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40">
                  {sectionLinks.length}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {sectionLinks.length === 0 ? (
                  <p className="text-sm text-white/40">
                    No links added.
                  </p>
                ) : (
                  sectionLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {link.label_en}
                        </p>

                        <p
                          dir="rtl"
                          className="mt-1 text-xs text-white/40"
                        >
                          {link.label_ar}
                        </p>

                        <p className="mt-2 break-all text-xs text-gold">
                          {link.href}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] ${
                            link.is_active
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {link.is_active ? "Active" : "Hidden"}
                        </span>

                        <form
                          action={deleteFooterLinkAction.bind(
                            null,
                            link.id,
                          )}
                        >
                          <AdminActionButton
                            type="submit"
                            variant="danger"
                          >
                            Delete
                          </AdminActionButton>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FooterSectionCard>
  );
}