/** Keep infrastructure diagnostics out of the learning and management UI. */
export function internErrorMessage(
  message: string | undefined,
  fallback = "Something went wrong. Please try again.",
) {
  if (
    !message ||
    /prisma|invocation|connectorerror|database|sqlstate|expected role|internal server error/i.test(
      message,
    )
  )
    return fallback;
  return message;
}
