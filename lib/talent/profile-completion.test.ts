import test from "node:test";
import assert from "node:assert/strict";

import { calculateProfileCompletion } from "../utils/profile-completion.ts";

const sharedStrongProfile = {
  image_url: "https://example.com/profile.jpg",
  city_slug: "riyadh",
  date_of_birth: "1995-01-01",
  bio_ar: "نبذة مهنية",
  languages: ["ar"],
  skills: ["camera"],
  availability_status: "available_now",
  portfolio_url: "https://example.com/portfolio",
  experience_years: 3,
};

test("non Actor/Model talent can reach 100% profile strength", () => {
  const completion = calculateProfileCompletion({
    ...sharedStrongProfile,
    primary_role: "voice_actor",
    showreel_url: "https://example.com/showreel",
    instagram: "https://instagram.com/example",
  });

  assert.equal(completion, 100);
});

test("actor can reach 100% without model-only measurements", () => {
  const completion = calculateProfileCompletion({
    ...sharedStrongProfile,
    primary_role: "actor",
    acting_age_min: 25,
    acting_age_max: 35,
    height_cm: 180,
    dialects: ["saudi"],
  });

  assert.equal(completion, 100);
});

test("model can reach 100% with model-specific details", () => {
  const completion = calculateProfileCompletion({
    ...sharedStrongProfile,
    primary_role: "model",
    modeling_types: ["commercial"],
    height_cm: 175,
    chest_size: 90,
    waist_size: 70,
    hip_size: 95,
  });

  assert.equal(completion, 100);
});

test("optional strength data is not confused with approval readiness", () => {
  const completion = calculateProfileCompletion({
    primary_role: "presenter",
    image_url: "https://example.com/profile.jpg",
    city_slug: "riyadh",
    date_of_birth: "1995-01-01",
  });

  assert.equal(completion, 30);
});
