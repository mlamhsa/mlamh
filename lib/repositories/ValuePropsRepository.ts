import { createAdminClient } from "@/lib/supabase/admin";

import type {
  HomepageValueProp,
  UpdateHomepageValuePropInput,
} from "@/lib/types/value-props";

export class ValuePropsRepository {
  static async getAll() {
    const supabase = createAdminClient();

    return supabase
      .from("homepage_value_props")
      .select("*")
      .order("sort_order", {
        ascending: true,
      });
  }

  static async getAllForAdmin() {
    const supabase = createAdminClient();

    return supabase
      .from("homepage_value_props")
      .select("*")
      .order("sort_order", {
        ascending: true,
      });
  }

  static async update(
    id: number,
    data: UpdateHomepageValuePropInput,
  ) {
    const supabase = createAdminClient();

    return supabase
      .from("homepage_value_props")
      .update(data)
      .eq("id", id)
      .select()
      .single();
  }

  static async getById(id: number) {
    const supabase = createAdminClient();

    return supabase
      .from("homepage_value_props")
      .select("*")
      .eq("id", id)
      .single<HomepageValueProp>();
  }
}