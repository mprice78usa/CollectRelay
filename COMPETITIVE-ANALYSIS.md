# CollectRelay — Competitive Analysis & Roadmap

*Last updated: March 11, 2026*

---

## Competitive Landscape

### Direct Competitors (Document Collection for Real Estate/Mortgage)

| Feature | **CollectRelay** | **Floify** ($49+/mo) | **Collect** ($129/mo) | **FileInvite** ($29+/mo) |
|---|---|---|---|---|
| Client portal (no login) | ✅ Magic links | ✅ Borrower portal | ✅ Client portal | ✅ Client portal |
| Checklist templates | ✅ 4 starter + custom | ✅ Doc templates | ✅ Request templates | ✅ Reusable templates |
| File upload | ✅ Drag & drop, 50MB | ✅ 12 docs per request | ✅ Up to 2GB | ✅ Large files |
| E-signatures | ✅ Built-in (draw/type) | ✅ Via DocuSign | ✅ Via DocuSign | ✅ Built-in |
| AI document summaries | ✅ Workers AI | ✅ Dynamic AI (new 2026) | ❌ | ❌ |
| Real-time comments | ✅ Per-item threads | ⚠️ Basic messaging | ⚠️ Basic | ⚠️ Basic |
| Review workflow (Accept/Reject/Waive) | ✅ Built-in | ⚠️ Basic status | ❌ | ❌ |
| Key dates/milestones | ✅ Timeline + calendar | ❌ | ❌ | ❌ |
| Partner access (read-only) | ✅ Lender/title roles | ⚠️ Referral portal | ❌ | ❌ |
| Deal tracking ($, commission) | ✅ Built-in | ❌ (LOS feature) | ❌ | ❌ |
| Webhooks | ✅ 8 event types | ⚠️ Via integrations | ✅ Zapier | ❌ No API |
| SMS notifications | ✅ Built-in | ✅ | ❌ | ❌ |
| Auto reminders | ✅ Configurable interval | ✅ | ✅ | ✅ |
| White-label | ❌ Not yet | ✅ | ✅ | ❌ |
| LOS integration (Encompass etc.) | ❌ Not yet | ✅ Deep integration | ❌ | ❌ |
| SOC 2 compliance | ❌ Not yet | ✅ | ✅ | ✅ |
| Mobile app | ❌ | ✅ iOS/Android | ❌ | ❌ |

### Adjacent Competitors
- **Dotloop** ($31.99+/mo) — transaction management + e-sign, not document collection
- **SkySlope** (custom pricing) — compliance-focused transaction management
- **Juniper Square** ($750+/mo) — investment/fund management, different market

---

## Where CollectRelay Wins

1. **All-in-one transaction view** — docs + deal tracking + milestones + partner access + review workflow
2. **AI summaries** — ahead of everyone except Floify, and ours runs free via Workers AI
3. **Built-in e-signatures** — no DocuSign dependency or extra cost
4. **Per-item comment threads** — true collaboration, surprisingly rare
5. **Webhook signing** — HMAC-SHA256 is enterprise-grade; most competitors only offer Zapier

---

## Improvement Roadmap (Priority Order)

### 🔴 Critical (blocking growth)
1. **Zapier / Make integration** — agents use Zapier, not raw webhooks
2. **Email delivery (transactional)** — magic links/reminders must be reliable (Resend/Postmark/SendGrid)
3. **Onboarding flow** — guided "create your first transaction" experience, time-to-value < 5 min

### 🟡 Important (competitive parity)
4. **White-label / custom branding** — logo on client portal, premium feature
5. **Document library** — store commonly-used forms, attach to any transaction
6. **Bulk actions** — download all as ZIP, bulk status change, bulk reminders
7. **Client-side PWA + push notifications** — improve client response rates

### 🟢 Nice to Have (differentiation)
8. **Activity dashboard** — filterable activity feed across all transactions
9. **Reporting / analytics** — avg completion time, items pending by agent, response rates
10. **Team management** — multiple agents per workspace with role-based access

---

## Pricing Strategy

### Recommended Tier Structure

| | **Free** | **Pro** | **Team** | **Enterprise** |
|---|---|---|---|---|
| **Price** | $0/mo | $29/mo | $79/mo | Custom |
| **Transactions** | 3 active | Unlimited | Unlimited | Unlimited |
| **Templates** | Starter 4 only | Unlimited custom | Unlimited | Unlimited |
| **AI summaries** | 10/month | 100/month | 500/month | Unlimited |
| **E-signatures** | ✅ | ✅ | ✅ | ✅ |
| **Webhooks** | ❌ | ✅ | ✅ | ✅ |
| **Team members** | 1 | 1 | 5 | Unlimited |
| **White-label** | ❌ | ❌ | ✅ | ✅ |
| **Partner access** | ❌ | ✅ | ✅ | ✅ |
| **Priority support** | ❌ | ❌ | ✅ | ✅ |
| **Zapier/API** | ❌ | ✅ | ✅ | ✅ |
| **Annual price** | $0 | $290/yr | $790/yr | Custom |

### Growth Flywheel
```
Agent signs up (free) → Creates transaction → Client gets magic link
                                                      ↓
                                        Client sees "Powered by CollectRelay"
                                                      ↓
                                        Client's OTHER agent discovers tool
                                                      ↓
                                              New agent signs up (free)
```

---

## Sources
- Floify — HousingWire 2026 Mortgage Tech100: https://floridanewswire.com/floify-named-to-housingwires-2026-mortgage-tech100-list-for-ai-powered-point-of-sale-innovation-national-news/
- Floify Pricing & Reviews — Capterra: https://www.capterra.com/p/138124/Floify/
- Collect (useCollect) Pricing: https://www.usecollect.com/pricing
- FileInvite Pricing & Features — Capterra: https://www.capterra.com/p/138728/FileInvite/
- Dotloop Pricing — Capterra: https://www.capterra.com/p/136372/dotloop/
- PLG Benchmarks 2026 — ProductLed: https://productled.com/blog/product-led-growth-benchmarks
- State of PLG in SaaS 2026 — UserGuiding: https://userguiding.com/blog/state-of-plg-in-saas
- 2026 SaaS Pricing Playbook — Monetizely: https://www.getmonetizely.com/blogs/the-2026-saas-pricing-playbook-how-13-100m-arr-companies-evolved-their-models
- Best Document Collection Software 2026: https://thedigitalprojectmanager.com/tools/best-document-collection-software/
