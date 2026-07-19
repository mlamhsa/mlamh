import { HomepageRepository } from "@/lib/repositories/HomepageRepository";

export class HomepageService {
  static getHero() {
    return HomepageRepository.getHero();
  }

  static getHeroForAdmin() {
    return HomepageRepository.getHeroForAdmin();
  }

  static updateHero({
    id,
    data,
  }: {
    id: number;
    data: Record<string, unknown>;
  }) {
    return HomepageRepository.updateHero(id, data);
  }

  static getHeroCards() {
    return HomepageRepository.getHeroCards();
  }

  static getHeroCardsForAdmin() {
    return HomepageRepository.getHeroCardsForAdmin();
  }

  static updateHeroCard({
    id,
    data,
  }: {
    id: number;
    data: Record<string, unknown>;
  }) {
    return HomepageRepository.updateHeroCard(id, data);
  }
}