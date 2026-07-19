import { FooterRepository } from "@/lib/repositories/FooterRepository";

export class FooterService {
  static getSettings() {
    return FooterRepository.getSettings();
  }

  static updateSettings(data: Record<string, unknown>) {
    return FooterRepository.updateSettings(data);
  }

  static getLinks() {
    return FooterRepository.getLinks();
  }

  static createLink(data: Record<string, unknown>) {
    return FooterRepository.createLink(data);
  }

  static updateLink({
    id,
    data,
  }: {
    id: number;
    data: Record<string, unknown>;
  }) {
    return FooterRepository.updateLink(id, data);
  }

  static deleteLink(id: number) {
    return FooterRepository.deleteLink(id);
  }
}