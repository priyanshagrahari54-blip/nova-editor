# NOVA — Autonomous Product Content Operations OS

Status: product direction and implementation contract. This document is a specification, not a claim that every capability is already implemented.

## 1. Product thesis

Nova should not compete as another prompt-to-image editor. It should help a seller or creative agency operate the complete product-content lifecycle: ingest product facts and media, create channel-specific assets, validate factual accuracy and channel rules, obtain human approval, export/publish safely, and preserve an auditable history.

**Positioning:** "One verified product record. Every market-ready listing and creative asset. Reviewed before it goes live."

The defensibility hypothesis is operational: structured product records, brand policies, category-specific validation, correction history, approval workflows, integrations, and measured outcomes compound with use. A model wrapper or prompt library is not a moat. No software is literally AI-proof; the goal is to become embedded in a customer's real workflow and system of record.

## 2. Market evidence and limits

The 2026 ChannelEngine Marketplace Seller Trends research (550 decision-makers across France, Germany, Netherlands, UK and US) reports:
- 82% adopting or considering AI in marketplace operations.
- 3 in 5 still mostly manual or partly automated.
- 45% frequently experience inaccurate/outdated listings and 45% inconsistent product content across marketplaces.
- 25% cite managing content across marketplaces, including localization, as a frequent challenge.

Amazon's seller image guidance requires accurate representation and category/channel-specific technical rules; image mismatch can undermine buyer confidence and contribute to returns.

These are problem signals, not proof of low competition or willingness to pay. The market is competitive in image generation, editing, PIM, feed management and marketplace integration. Nova must validate a narrow segment before broadening.

## 3. Initial customer wedge

Primary ICP:
- Small and mid-sized product brands and marketplace sellers with 20–2,000 SKUs.
- Creative/ecommerce agencies managing multiple seller catalogs.
- Initial categories: apparel/accessories, home & living, beauty/personal care (subject to stricter claims/compliance checks).

Geography:
- India-first workflows (Amazon.in, Flipkart, Shopify, Instagram; language variants including English and Hindi).
- International-ready data model and export profiles for Amazon US/UK/EU, Etsy, Shopify and social channels. Do not promise direct publishing until official API approval and integration tests exist.

Avoid initially targeting enterprise retailers with complex ERP/PIM procurement or promising a universal marketplace connector.

## 4. Core product system

### A. Product Truth Record (the foundation)
Each SKU has a structured, versioned record:
- SKU, GTIN/identifier when available, title, category, brand, materials, dimensions, weight, colour, variants, included accessories, country of origin, care/use instructions, claims and source references.
- Original media and provenance (upload/source, timestamp, owner, hash).
- Confirmed facts vs AI-inferred suggestions clearly separated.
- Missing/contradictory fields surfaced as questions, never silently invented.

### B. Brand Memory
Per brand/workspace:
- Logo, palette, typography, tone, image composition, lighting, backgrounds, model rules, prohibited claims and approved examples.
- Versioned brand guide with approval owner.
- AI may propose changes but cannot silently rewrite locked rules.

### C. AI Creative Studio
Pluggable provider adapters, not hard-coded to one vendor:
- Text: listing copy, translations, attributes, FAQs, campaign concepts.
- Image: background/scene generation and editing around the original product.
- Video: storyboard, captions, localization and short-form assembly where a provider is configured.
- Model router: capability, latency, quality, privacy, commercial rights and estimated cost; fallback only when policy permits.
- Zero-cost mode: local/browser tools and manually supplied assets; no promise of unlimited free cloud generation.
- Every provider must be opt-in/configured, with quota, timeout, retry, and cost ceilings.

### D. Product Identity Guard
Compare output against source assets and Product Truth Record:
- Detect likely changes in silhouette, colour, label/text, count, accessories, dimensions and material cues.
- Use deterministic checks where possible (dimensions, exact text, file metadata, required background/size) and model-based visual comparison only as a risk signal.
- Show evidence, confidence and severity. Never claim perfect verification.
- High-risk output is blocked from export/publish until a human approves or corrects it.

### E. Channel Compliance Engine
Versioned, testable rules by marketplace, category, locale and asset role:
- Main image vs secondary image distinctions.
- Aspect ratio, resolution, file type, background, text/watermark restrictions, product occupancy, crop safety and required fields.
- Rule source URL, effective date, version and last verified date.
- Compliance result: PASS / REVIEW / FAIL with exact reason and remediation.
- Rules are advisory until checked against the current official seller policy; never imply marketplace endorsement.

### F. Multi-market Listing Compiler
Compile one Product Truth Record into:
- Channel-specific titles, bullets, descriptions, attributes and image/video asset packs.
- Locale-specific units, spelling, language and terminology.
- Explicit translation review for regulated or high-impact claims.
- Export CSV/ZIP/feed formats first; direct marketplace publishing later via official approved APIs.

### G. Human Approval & Audit
- Role-based reviewer/approver model for agencies and teams.
- Side-by-side source vs generated asset, fact diffs, rule failures, AI provider/model metadata and prompt provenance.
- Approve, reject, request correction, compare versions, restore prior version.
- Immutable audit events for material edits and publish/export decisions.
- No automatic publication for high-risk changes.

### H. Catalog Operations
- CSV import/export with column mapping and preview.
- Bulk jobs with pause/resume, per-SKU status, retry only failed items, deduplication and idempotency.
- Asset library organized by brand/SKU/channel/campaign/version.
- Change impact: when product facts or a channel rule changes, identify affected assets/listings and request regeneration/review.

### I. Performance Feedback Loop (later)
- Import seller-provided aggregate performance data (impressions, clicks, conversion, returns/reason codes) with explicit authorization.
- Correlate asset/listing variants with outcomes; distinguish correlation from causation.
- Suggest controlled experiments; never auto-claim uplift without sufficient evidence.
- Customer data is not pooled across tenants without explicit consent and privacy/legal review.

## 5. AI architecture

Use a provider-neutral orchestration layer:
1. Task classifier selects text/image/video/vision/translation/compliance task.
2. Policy gate checks tenant settings, privacy, allowed provider and data sensitivity.
3. Model router chooses only a configured provider with valid terms and cost ceiling.
4. Structured output schema validates response; retries are bounded.
5. Deterministic validators run before visual/model validators.
6. Confidence/risk engine routes uncertain or high-impact outputs to human review.
7. Artifact store records input references, output hash, provider/model/version, prompt template version, costs and reviewer decision.

AI must not be the source of truth for product specifications, safety claims, legal claims, certifications, inventory, pricing or marketplace policy. It can draft; authoritative sources and humans verify.

## 6. Security, privacy and trust requirements

- Tenant isolation at every data boundary; least-privilege roles.
- Private-by-default assets; signed short-lived URLs when cloud storage is added.
- Secrets only server-side; never expose provider keys in browser bundles.
- Explicit consent before sending customer assets to third-party AI providers.
- Retention/deletion/export controls and documented backups.
- Malware/file validation, upload limits, MIME sniffing, rate limits and abuse controls.
- Audit logs for access, export, approval and provider calls.
- No training on customer assets by default; only offer opt-in if provider terms support it.
- Avoid storing personal data not needed for the workflow.

## 7. Commercial and infrastructure constraints

Current user constraint: zero upfront spend. Build a useful local/browser-first foundation and use only free tiers whose terms permit the intended use. Do not build a business plan around free-tier loopholes or unlimited free GPU/API usage.

- Keep current editing experience working.
- Start with local-first Product Truth Records, CSV mapping, rule packs, deterministic image checks, export bundles and approval history.
- Cloud AI adapters are optional and disabled until a provider key and commercial terms are configured.
- Before commercial launch, choose hosting that permits commercial SaaS, add a durable database/object storage, backups, monitoring and abuse controls.
- Payment activation requires provider KYC, server-side signature verification, idempotent webhooks, subscription state, refund/cancellation flow and tax/legal review.
- Never collect card data directly.

## 8. Delivery sequence and acceptance gates

### Phase 0 — Validate the wedge (before broad build)
- Interview at least 15 sellers/agencies across India and 2–3 international markets.
- Collect 5 real, permissioned product catalogs (20+ SKUs each) and anonymize where needed.
- Observe actual time spent fixing listings, creating assets, checking rules and localizing.
- Ask for a paid pilot commitment or concrete workflow access, not just positive feedback.
- Continue only if repeated pain is confirmed in at least one narrow segment.

### Phase 1 — Trustworthy local catalog core
Deliver:
- Product Truth Record schema and local persistence.
- CSV import, mapping, validation, deduplication and export.
- Brand Memory profile.
- Source media library and versioned asset metadata.
- Product completeness and contradiction report.

Acceptance:
- Import 500 test SKUs without losing rows.
- Invalid/missing fields are reported with row/field references.
- Export round-trips supported fields.
- Reload preserves data; export/backup and delete work.
- No fabricated product facts.

### Phase 2 — Compliance and identity QA
Deliver:
- Versioned rule packs for a narrow set of categories/channels.
- File metadata, dimension, crop and exact-text checks.
- Source/output comparison with risk explanations.
- PASS/REVIEW/FAIL and reviewer override with audit record.

Acceptance:
- Golden test set includes compliant and non-compliant assets.
- Every failure points to a rule and remediation.
- Uncertain visual checks produce REVIEW, not false PASS.
- Rule source/version is visible.

### Phase 3 — AI production pipeline
Deliver:
- Provider adapter interface, model router, structured task schemas.
- Listing drafts, translation drafts, image/video creative jobs.
- Prompt/template versioning, cost ceilings, retry limits and provider status.
- Human approval before high-risk export.

Acceptance:
- Works with no AI key in local-only mode.
- Provider outage does not corrupt project state.
- Every AI result has provenance and can be rejected/reverted.
- No secret appears in client bundle or logs.

### Phase 4 — Multi-channel export and agency workflow
Deliver:
- Channel-specific listing compiler and CSV/ZIP exports.
- Batch queue with pause/resume and retry.
- Brand/workspace roles and approval flow.
- Change-impact report.

Acceptance:
- Same source record compiles into different channel schemas without overwriting source facts.
- Failed SKU can retry independently.
- Reviewer actions are auditable.

### Phase 5 — Integrations and performance intelligence
Only after official API eligibility:
- Shopify, marketplace and social integrations using approved OAuth/API scopes.
- Seller-owned analytics imports.
- Experiment recommendations with uncertainty labels.
- Optional consented cross-border localization.

Acceptance:
- Least-privilege OAuth, token rotation/revocation, webhook verification and idempotency tests.
- No direct publishing without explicit approval and a rollback plan.

## 9. Differentiation scorecard

| Capability | Easy for competitors to copy? | Strategic value |
|---|---|---|
| Prompt-to-image/video | High | Low alone |
| More model providers | High | Medium convenience |
| Product Truth Record with evidence | Medium | High |
| Brand Memory + versioned approval | Medium | High |
| Channel/category/locale rule packs with provenance | Medium-high | High |
| Product identity QA + human audit | Medium-high | Very high |
| Change impact across a live catalog | Medium-high | Very high |
| Verified performance feedback per SKU | High to build, harder to accumulate | Very high |
| Agency workflows and integrations | Medium | High switching cost |

## 10. Go-to-market validation

- Offer a free catalog audit: seller supplies a sample CSV and 5–10 product images; Nova returns missing fields, inconsistent content, and image-rule issues. No claim of official marketplace certification.
- Publish useful, narrow tools/pages: Amazon main-image checker, product listing completeness checker, CSV field mapper, localization preview. Each must be genuinely functional, not SEO doorway pages.
- Recruit pilot sellers through relevant communities, seller associations, agencies and opt-in outreach; no scraping private data, mass spam or fake reviews.
- Create public case studies only with written permission and measured before/after workflow time.
- Measure activation (catalog imported, first issue found, first compliant export), repeat usage, retained catalogs, reviewer completion and willingness to pay.
- Do not equate visitors, waitlist entries or free users with customers.

## 11. Explicit non-goals for first release

- Do not promise fully autonomous publishing.
- Do not promise perfect product identity preservation or guaranteed conversion lift.
- Do not support every marketplace/category at launch.
- Do not build a generic chatbot as the main interface.
- Do not add paid AI APIs, GPU hosting, or payment checkout until costs, eligibility and budget are confirmed.
- Do not call the market low-competition until competitor mapping and customer interviews verify a defensible underserved segment.
