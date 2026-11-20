# Nova Studio: zero-budget growth and monetization

## Positioning
Nova Studio is a browser-based creative workspace for independent creators, freelancers, photo studios and small agencies. Public claims must match features that exist and have been tested. Do not advertise AI image generation, one-click object removal, guaranteed 4K exports, team collaboration, cloud storage or other capabilities until implemented and verified end to end.

## Funnel
1. Discovery: organic search, tutorial content, creator communities and opt-in directory launches.
2. Landing page: explain current value, show a real product demo and send visitors to /editor.
3. Activation: first successful media import, adjustment and export.
4. Retention: project history, useful tutorials, release notes and opt-in product emails.
5. Monetization: enable paid checkout only after legal, provider, pricing and usage-cost checks.
6. Advocacy: share links and later a server-verified referral programme.

## Free-first acquisition
- Publish one genuinely useful editing tutorial or short demo each week.
- Repurpose each demo into vertical clips, a written walkthrough and a changelog.
- Submit to product directories only when their current rules allow it; keep claims accurate.
- Answer relevant Reddit, Indie Hackers and creator-community questions without mass posting or unsolicited DMs.
- Build SEO pages around real workflows. Avoid doorway pages and fake comparisons.
- Use UTM parameters and privacy-respecting analytics only after consent and configuration.

## Referral limitations
The landing page creates a shareable URL with a locally generated referral code. It does not persist clicks on a server, attribute signups across devices, issue rewards or detect fraud. It is a share helper, not a commission programme. A real referral programme needs backend identity, durable attribution, verified paid conversion and abuse controls.

## Payments: disabled
No payment provider credentials or merchant approval are present in this repository. Do not collect card details directly or claim checkout is active.

Before enabling paid plans:
- Complete provider KYC and business verification.
- Confirm domestic/international payment and recurring-subscription eligibility.
- Publish legal business identity, contact details, privacy policy, terms, cancellation/refund policy and tax information.
- Set plan limits based on measured compute and AI provider costs.
- Verify payment signatures server-side; process idempotent webhooks; never grant paid access from a client redirect alone.
- Add subscription state, failed-payment grace period, cancellation and refund handling.
- Test successful, failed, duplicate, delayed and refunded payments in sandbox.

## Hosting and free-tier constraints
Vercel Hobby is for personal, non-commercial use; it is not a suitable long-term hosting plan for a commercial SaaS. Before monetizing, migrate to a host/plan whose terms explicitly permit commercial SaaS. GitHub Pages policy excludes sites primarily used for commercial transactions or SaaS. Re-check free-tier terms before launch.

## Metrics
Track landing sessions by source, editor CTA clicks, first import/export activation, returning users and voluntary feedback. Do not report visits, referrals or signups as paying customers. Do not promise revenue or customer targets.
