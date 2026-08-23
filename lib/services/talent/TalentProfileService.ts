import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
export type TalentProfile = Record<string, unknown>;

export class TalentProfileService {
  /* =========================
     AGE
  ========================= */

  static calculateAge(dateOfBirth?: string | null): number | null {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return Math.max(age, 0);
  }

  /* =========================
     PROFILE COMPLETION
  ========================= */

  static calculateCompletion(profile?: TalentProfile): number {
    if (!profile) {
      return 0;
    }
  
    return calculateProfileCompletion(
      profile as Parameters<
        typeof calculateProfileCompletion
      >[0],
    );
  }

  /* =========================
     OPTIONS
  ========================= */

  static localizeOptions(
    options: { value: string; label: string }[],
    isArabic: boolean,
    labelsMap?: Record<string, string>
  ) {
    if (!isArabic || !labelsMap) {
      return options;
    }

    return options.map((option) => ({
      ...option,
      label: labelsMap[option.label] ?? option.label,
    }));
  }
}