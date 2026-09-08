import test from "node:test";
import assert from "node:assert/strict";

import {
  canRequestTalentFromProfile,
  canViewTalentPrivateContent,
  hideTalentPrivateContent,
} from "./public-profile-access.ts";
import type { Talent } from "../types/talent.ts";

const talent: Talent = {
  id: 1,
  user_id: "talent-user",
  name_en: "Talent",
  name_ar: "موهبة",
  category_en: "Model",
  category_ar: "عارض",
  image_url: "https://cdn.example.com/profile.jpg",
  featured: false,
  sort_order: null,
  published: true,
  status: "approved",
  instagram: "https://instagram.com/example",
  tiktok: "example",
  snapchat: "example",
  whatsapp: "+966500000000",
  portfolio_url: "https://portfolio.example.com",
  portfolio_links: ["https://portfolio.example.com/work"],
  video_intro: "https://video.example.com/intro",
  showreel_url: "https://video.example.com/showreel",
};

test("public projection removes private media and external talent links", () => {
  const projected = hideTalentPrivateContent(talent);
  assert.equal(projected.instagram, null);
  assert.equal(projected.tiktok, null);
  assert.equal(projected.snapchat, null);
  assert.equal(projected.whatsapp, null);
  assert.equal(projected.portfolio_url, null);
  assert.equal(projected.portfolio_links, null);
  assert.equal(projected.video_intro, null);
  assert.equal(projected.showreel_url, null);
  assert.equal(projected.private_access_granted, false);
});

test("approved active publisher can view private talent content", () => {
  assert.equal(canViewTalentPrivateContent({ userId: "publisher-user", accountType: "publisher", approvalStatus: "approved", profileStatus: "active" }, talent.user_id), true);
});

test("pending or inactive publisher cannot view private talent content", () => {
  assert.equal(canViewTalentPrivateContent({ userId: "publisher-user", accountType: "publisher", approvalStatus: "pending", profileStatus: "active" }, talent.user_id), false);
  assert.equal(canViewTalentPrivateContent({ userId: "publisher-user", accountType: "publisher", approvalStatus: "approved", profileStatus: "suspended" }, talent.user_id), false);
});

test("talent owner and admin can view private talent content", () => {
  assert.equal(canViewTalentPrivateContent({ userId: "talent-user", accountType: "talent" }, talent.user_id), true);
  assert.equal(canViewTalentPrivateContent({ userId: "admin-user", accountType: "admin" }, talent.user_id), true);
});

test("only approved active publisher can request talent from profile", () => {
  assert.equal(canRequestTalentFromProfile({ userId: "publisher-user", accountType: "publisher", approvalStatus: "approved", profileStatus: "active" }), true);
  assert.equal(canRequestTalentFromProfile({ userId: "publisher-user", accountType: "publisher", approvalStatus: "pending", profileStatus: "active" }), false);
});
