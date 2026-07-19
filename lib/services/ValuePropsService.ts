import { ValuePropsRepository } from "@/lib/repositories/ValuePropsRepository";

import type { UpdateHomepageValuePropInput } from "@/lib/types/value-props";

export class ValuePropsService {
  static async getAll() {
    return ValuePropsRepository.getAll();
  }

  static async getAllForAdmin() {
    return ValuePropsRepository.getAllForAdmin();
  }

  static async getById(id: number) {
    return ValuePropsRepository.getById(id);
  }

  static async update(
    id: number,
    data: UpdateHomepageValuePropInput,
  ) {
    return ValuePropsRepository.update(id, data);
  }
}