/**
 * Resilient JSON Fetcher for client-side API requests.
 * Safely parses server responses and handles non-JSON / HTML error pages (e.g. 500/502/404)
 * without throwing unhandled "SyntaxError: Unexpected token < is not valid JSON".
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  details?: any;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    let parsedData: any = null;
    if (rawText && (contentType.includes("application/json") || rawText.trim().startsWith("{") || rawText.trim().startsWith("["))) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        // Fallback if parsing fails
        parsedData = null;
      }
    }

    if (!res.ok) {
      let errorMsg = parsedData?.error || parsedData?.message;
      if (!errorMsg) {
        if (rawText && rawText.length < 120 && !rawText.includes("<") && !rawText.includes("Internal Server Error")) {
          errorMsg = rawText.trim();
        } else if (res.status >= 500) {
          errorMsg = "The server encountered a temporary issue while processing your request. Please try again.";
        } else {
          errorMsg = `Request failed with HTTP status ${res.status}`;
        }
      }

      return {
        ok: false,
        status: res.status,
        data: parsedData,
        error: errorMsg,
        details: parsedData?.details,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: (parsedData ?? { success: true }) as T,
    };
  } catch (err: any) {
    const isNetworkError = err?.name === "TypeError" || err?.message?.includes("fetch");
    const errorMsg = isNetworkError
      ? "Network connection issue. Please check your internet connection."
      : (err?.message || "An unexpected error occurred while communicating with the server.");

    return {
      ok: false,
      status: 0,
      data: null,
      error: errorMsg,
    };
  }
}

/**
 * Normalizes any external or staging URL to ensure it contains https://
 * and prevents relative URL resolution errors (e.g., runix.in/runix.ai).
 */
export function normalizeUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
