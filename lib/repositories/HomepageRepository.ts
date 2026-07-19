import { BaseRepository } from "./base/BaseRepository";

export class HomepageRepository extends BaseRepository {
  static async getHero() {
    return this.client()
      .from("homepage_hero")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  }

  static async getHeroForAdmin() {
    return this.client()
      .from("homepage_hero")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
  }

  static async updateHero(
    id: number,
    values: Record<string, unknown>,
  ) {
    return this.client()
      .from("homepage_hero")
      .update(values)
      .eq("id", id)
      .select()
      .single();
  }

  static async getHeroCards() {
    return this.client()
      .from("homepage_hero_cards")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
  }

  static async getHeroCardsForAdmin() {
    return this.client()
      .from("homepage_hero_cards")
      .select("*")
      .order("sort_order", { ascending: true });
  }

  static async updateHeroCard(
    id: number,
    values: Record<string, unknown>,
  ) {
    return this.client()
      .from("homepage_hero_cards")
      .update(values)
      .eq("id", id)
      .select()
      .single();
  }
}