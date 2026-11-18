// Interns use a deliberately small API surface even if custom staff permissions
// were accidentally retained when their role changed.
const INTERN_PROCEDURES = new Set([
  "interns.overview",
  "interns.saveLog",
  "interns.deleteLog",
  "interns.saveProfile",
  "interns.saveSubmission",
  "interns.tasks",
  "messages.unreadCount",
  "messages.suggestions",
  "messages.listConversations",
  "messages.getMessages",
  "messages.sendMessage",
  "messages.markRead",
  "messages.createConversation",
  "users.search",
  "users.getProfile",
  "users.heartbeat",
  "users.changePassword",
  "users.updateProfile",
]);

export function internProcedureAllowed(path: string) {
  return path.startsWith("intern.") || INTERN_PROCEDURES.has(path);
}

export const INTERN_CONTACT_ROLES = [
  "ADMIN",
  "MEMBER",
  "USER",
  "ACCOUNTANT",
] as const;
