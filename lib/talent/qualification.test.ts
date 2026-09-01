import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateTalentQualification,
  getTalentQualificationReasons,
  getValidTalentImage,
  isTalentPubliclyVisible,
  type TalentQualificationInput,
} from "./qualification.ts";

const baseTalent: TalentQualificationInput = {
  status: "approved",
  published: true,
  image_url: "https://cdn.example.com/profile.jpg",
  name_en: "Talent",
  primary_role: "model",
  city_slug: "riyadh",
  profile_approval_status: "approved",
  profile_status: "active",
};

test("qualified talent is derived without profile_completion or availability", () => {
  const result = evaluateTalentQualification(baseTalent);
  assert.equal(result.qualified, true);
  assert.equal(result.state, "qualified");
  assert.deepEqual(result.reasons, []);
});

test("gallery image is a valid fallback when image_url is missing", () => {
  assert.equal(
    getValidTalentImage({
      image_url: "",
      gallery_images: ["", "https://cdn.example.com/gallery.jpg"],
    }),
    "https://cdn.example.com/gallery.jpg",
  );
});

test("invalid image URLs are rejected", () => {
  assert.equal(
    getValidTalentImage({ image_url: "http://localhost/a.jpg", gallery_images: [] }),
    null,
  );
});

test("missing qualification fields return actionable Arabic reasons", () => {
  const evaluation = evaluateTalentQualification({
    ...baseTalent,
    image_url: null,
    gallery_images: [],
    city_slug: null,
    primary_role: null,
    category_slug: null,
    category_ar: null,
    category_en: null,
  });
  assert.equal(evaluation.state, "not_ready");
  assert.deepEqual(
    getTalentQualificationReasons(evaluation, "ar"),
    ["أضف صورة", "حدد تخصصك", "حدد مدينتك"],
  );
});

test("linked profile must be approved", () => {
  assert.equal(
    evaluateTalentQualification({ ...baseTalent, profile_approval_status: "pending" }).qualified,
    false,
  );
});

test("legacy published active talent without profiles row stays visible", () => {
  assert.equal(
    isTalentPubliclyVisible({
      ...baseTalent,
      status: "active",
      profile_approval_status: undefined,
      profile_status: undefined,
      primary_role: null,
      category_slug: "model",
    }),
    true,
  );
});

test("unsupported non-MVP category is not newly qualified", () => {
  const evaluation = evaluateTalentQualification({
    ...baseTalent,
    primary_role: null,
    category_slug: "content_creator",
    category_ar: "صانع محتوى",
    category_en: "Content creator",
  });

  assert.equal(evaluation.qualified, false);
  assert.ok(evaluation.reasons.includes("missing_role"));
  assert.equal(isTalentPubliclyVisible({
    ...baseTalent,
    primary_role: null,
    category_slug: "content_creator",
  }), false);
});

test("production nine-talents compatibility fixture remains public", () => {
  const fixture = [
    { id: 20, status: "approved", profile_approval_status: "approved" },
    { id: 22, status: "active", profile_approval_status: undefined },
    { id: 25, status: "approved", profile_approval_status: "approved" },
    { id: 58, status: "approved", profile_approval_status: "approved" },
    { id: 59, status: "approved", profile_approval_status: "approved" },
    { id: 61, status: "approved", profile_approval_status: "approved" },
    { id: 62, status: "approved", profile_approval_status: "approved" },
    { id: 64, status: "approved", profile_approval_status: "approved" },
    { id: 75, status: "approved", profile_approval_status: "approved" },
  ].map((row, index) => ({
    ...baseTalent,
    ...row,
    primary_role: index < 3 ? null : index < 6 ? "model" : "actor",
    category_slug: index < 3 ? (index === 0 ? "actor" : "model") : undefined,
    profile_status: row.profile_approval_status ? "active" : undefined,
  }));

  assert.equal(fixture.length, 9);
  assert.deepEqual(
    fixture.filter(isTalentPubliclyVisible).map((talent) => talent.id),
    [20, 22, 25, 58, 59, 61, 62, 64, 75],
  );
});

test("directory/direct visibility policy rejects pending and unpublished talents", () => {
  assert.equal(isTalentPubliclyVisible({ ...baseTalent, status: "pending" }), false);
  assert.equal(isTalentPubliclyVisible({ ...baseTalent, published: false }), false);
});
