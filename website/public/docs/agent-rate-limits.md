# Agent rate limits

| Tier | Auth | Read | Downloads |
|---|---|---|---|
| Anonymous | IP | 30 req/hour, burst 10/min | none (watermarked previews) |
| Free agent key (read-only) | API key / OAuth 2.1 | 60 req/min, 1,000/day | free assets via signed URL; no paid files |
| Studio plan | scoped key | 120 req/min, 50,000/day | 100/day licensed |
| Enterprise | key + Web Bot Auth (RFC 9421) | 1,000 req/min | negotiated + SLA |

Weighted quota units: search=1, preview=2, download=10, generation=50.
Global guardrails: per-agent-per-tool 60/5min, per-conversation 500/hour, per-tenant 10k/hour, per-tool-global 100 rps.

```http
RateLimit-Policy: "search";q=60;w=60, "daily";q=1000;w=86400
RateLimit: "search";r=42;t=18
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 18
```

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 18
RateLimit: "search";r=0;t=18
{"type":"https://orbital.example/problems/quota-exceeded","retry_after":18}
```

IETF draft-11 headers are still an Internet-Draft (not an RFC), so legacy `X-RateLimit-*` are sent too. MCP layers must surface 429s as structured `isError` tool results, never silently retry.
