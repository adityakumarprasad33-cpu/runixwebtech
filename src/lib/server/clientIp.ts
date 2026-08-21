/**
 * Authoritative Client IP Resolver for Netlify Serverless Environments.
 * Strictly derives the remote client IP from Netlify's injected cryptographic header.
 * Rejects untrusted forwarded header chains and prevents collapsing requests onto 127.0.0.1 in production.
 */
export function getTrustedClientIp(req: Request): string {
  // 1. Netlify's cryptographically trusted client connection IP
  const netlifyIp = req.headers.get("x-nf-client-connection-ip");
  if (netlifyIp && netlifyIp.trim()) {
    return netlifyIp.trim();
  }

  // 2. Local development fallback only
  if (process.env.NODE_ENV === "development") {
    const rawForwarded = req.headers.get("x-forwarded-for");
    if (rawForwarded) {
      return rawForwarded.split(",")[0].trim();
    }
    return "127.0.0.1";
  }

  // In production, if Netlify's client IP header is absent, return an unroutable identifier
  // so the caller can reject or log the malformed request rather than sharing bucket keys
  return "untrusted-origin-missing-client-ip";
}
