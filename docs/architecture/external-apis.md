# External APIs

TaskFlow MVP **does not require external API integrations** beyond its core infrastructure services (Supabase for database/storage, which are platform services rather than external APIs). The application is self-contained with all business logic implemented in the ASP.NET Core backend.

**Rationale for No External APIs:**
- **Authentication:** Handled internally via ASP.NET Core Identity and JWT tokens (NFR10)
- **Email Services:** Email confirmation and notifications deferred to post-MVP (reduces complexity and cost)
- **Payment Processing:** Freemium model and paid plans deferred to post-MVP v2.0+ (focus on product-market fit first)
- **Analytics:** Built-in Fly.io metrics and Vercel analytics sufficient for MVP monitoring
- **File Storage:** Supabase Storage is part of infrastructure platform, not external integration
- **Search:** Full-text search via PostgreSQL's built-in capabilities, no need for Elasticsearch/Algolia
- **Real-Time Updates:** HTTP polling sufficient for MVP use cases (NFR requirement, no WebSocket/SignalR complexity)

**Post-MVP External API Considerations:**

When TaskFlow scales beyond MVP, the following external APIs may be integrated:

1. **Email Service (SendGrid, AWS SES, or Resend):**
   - Purpose: Transactional emails (email confirmation, password reset, task assignment notifications)
   - Priority: High for production launch
   - Integration Point: Background job triggered by ActivityLog events

2. **Payment Processing (Stripe):**
   - Purpose: Subscription billing for freemium-to-paid conversion
   - Priority: High once product-market fit validated (1000+ active users goal achieved)
   - Integration Point: New BillingController and SubscriptionService

3. **Error Tracking (Sentry):**
   - Purpose: Production error monitoring and alerting beyond basic Fly.io logs
   - Priority: Medium for production stability
   - Integration Point: ASP.NET Core middleware integration

4. **Calendar Integration (Google Calendar, Outlook Calendar APIs):**
   - Purpose: Sync task due dates to external calendars
   - Priority: Low, nice-to-have feature
   - Integration Point: New IntegrationService with OAuth flows

5. **Slack/Teams Integration:**
   - Purpose: Post task updates and comments to team channels
   - Priority: Medium for team collaboration enhancement
   - Integration Point: Webhook notifications from ActivityLog events

6. **OAuth Providers (Google, Microsoft, GitHub):**
   - Purpose: Social login to reduce registration friction
   - Priority: Medium for user acquisition
   - Integration Point: ASP.NET Core Identity external authentication

