import { BaseService } from "../base/BaseService";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { PublisherRepository } from "@/lib/repositories/publishers/PublisherRepository";

export class PublisherService extends BaseService {
  static async getAll() {
    return PublisherRepository.getAll();
  }

  static async approve(id: number) {
    this.assert(id > 0, "Invalid publisher id");

    await PublisherRepository.updateVerification(id, true);

    await createEvent({
      type: EVENT_TYPES.publisher_verified,
      target: EVENT_TARGETS.PUBLISHER,
      targetId: id,
      actorId: "admin",
      metadata: {
        publisherId: id,
      },
    });
  }

  static async markPending(id: number) {
    this.assert(id > 0, "Invalid publisher id");

    await PublisherRepository.updateVerification(id, false);
  }
}