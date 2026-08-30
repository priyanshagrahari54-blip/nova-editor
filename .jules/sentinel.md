# Sentinel Security Journal

## 2026-08-30 - Prevent Information Leakage in AI Endpoint Errors
**Vulnerability:** Raw upstream API error messages and system exception messages were returned directly in API responses.
**Learning:** Returning unhandled exception messages (`error.message`) or verbose upstream vendor errors in HTTP responses can leak internal infrastructure details or API error internals to clients.
**Prevention:** Always sanitize server-side error messages returned to clients and log full details server-side if logger is present.
