import { BaseRepository } from "./base/BaseRepository";

export class FooterRepository extends BaseRepository {
  static async getSettings() {
    return this.client()
      .from("footer_settings")
      .select("*")
      .single();
  }

  static async updateSettings(
    values: Record<string, unknown>,
  ) {
    return this.client()
      .from("footer_settings")
      .update(values)
      .eq("id", 1)
      .select()
      .single();
  }

  static async getLinks() {
    return this.client()
      .from("footer_links")
      .select("*")
      .order("section")
      .order("sort_order");
  }

  static async createLink(
    values: Record<string, unknown>,
  ) {
    return this.client()
      .from("footer_links")
      .insert(values)
      .select()
      .single();
  }

  static async updateLink(
    id: number,
    values: Record<string, unknown>,
  ) {
    return this.client()
      .from("footer_links")
      .update(values)
      .eq("id", id)
      .select()
      .single();
  }

  static async deleteLink(id: number) {
    return this.client()
      .from("footer_links")
      .delete()
      .eq("id", id);
  }
}