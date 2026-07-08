import { createAdminClient } from "@/lib/supabase/admin";

export abstract class BaseRepository {
  protected static client() {
    return createAdminClient();
  }
}