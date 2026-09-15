export type MobilePublicTalent = {
  id: number;
  slug: string;
  name: string;
  role: "actor" | "model" | null;
  city: string | null;
  countryCode: string | null;
  imageUrl: string | null;
  galleryImages: string[];
  featured: boolean;
  verified: boolean;
  gender: string | null;
  nationality: string | null;
  age: number | null;
  heightCm: number | null;
  bio: string | null;
  languages: string[];
  dialects: string[];
  skills: string[];
  experienceYears: number | null;
  availabilityStatus: string | null;
  readyToTravel: boolean | null;
};

export type MobileTalentDirectoryResponse =
  | {
      ok: true;
      items: MobilePublicTalent[];
      total: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
  | {
      ok: false;
      code: string;
    };
