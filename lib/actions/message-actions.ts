"use server";

import {
  closeConversationAction as closeConversationSecure,
  markConversationReadAction as markConversationReadSecure,
  reportMessageAction as reportMessageSecure,
  sendMessageAction as sendMessageSecure,
} from "@/lib/actions/message-actions-secure";

export async function sendMessageAction(formData: FormData) {
  return sendMessageSecure(formData);
}

export async function markConversationReadAction(conversationId: number) {
  return markConversationReadSecure(conversationId);
}

export async function reportMessageAction(formData: FormData) {
  return reportMessageSecure(formData);
}

export async function closeConversationAction(formData: FormData) {
  return closeConversationSecure(formData);
}
