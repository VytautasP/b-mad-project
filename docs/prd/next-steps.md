# Next Steps

## Epic 4 Planning Reference

- Epic 4 UX refinement backlog: [4.0-ux-friendly-ui-refinement-prioritized.md](./4.0-ux-friendly-ui-refinement-prioritized.md)
- Individual implementation stories: [../stories/4.1-task-details-page-quick-inspect-modal-split.md](../stories/4.1-task-details-page-quick-inspect-modal-split.md) through [../stories/4.8-ux-performance-optimizations-dense-views.md](../stories/4.8-ux-performance-optimizations-dense-views.md)

---

## UX Expert Prompt

```
@ux I need your help designing the user interface for TaskFlow based on the PRD.

Context: TaskFlow is a lightweight task management system with hierarchical tasks, time tracking, and team collaboration. Target users are freelancers and small teams who need professional features without enterprise complexity.

Key Documents:
- docs/prd.md (Product Requirements Document)
- docs/brief.md (Project Brief with personas)

Primary Request:
Review the PRD's "User Interface Design Goals" section and create wireframes/mockups for these core screens:
1. Login/Registration
2. My Tasks Dashboard (list view)
3. Task Detail Panel (slide-out)
4. Tree View (hierarchy visualization)
5. Timeline/Gantt View
6. Time Tracking UI (timer widget)

Design Priorities:
- Minimalist, content-focused interface (Linear/Notion aesthetic)
- Inline editing everywhere (no modal dialogs)
- Status/priority visual indicators consistent across views
- Mobile-responsive layouts
- Material Design 3 or PrimeNG component library (zero-budget constraint)

Deliverables:
- Wireframes for core screens
- Component library recommendation (Material vs. PrimeNG)
- Navigation structure
- Interaction patterns documentation
- Accessibility compliance notes (WCAG AA)

Timeline: Optional, not blocking architecture work. Deliver when ready.
```

---

## Architect Prompt

```
@dev enter create architecture mode

I've completed the PRD for TaskFlow, a lightweight task management system with hierarchical tasks, integrated time tracking, and team collaboration features. The project is ready for architecture design.

Key Documents:
- docs/prd.md (Product Requirements Document) - READ THIS FIRST
- docs/brief.md (Project Brief with detailed context)

Project Context:
- **Goal**: MVP in 6 weeks, solo developer, zero budget constraint
- **Stack**: Angular 17+ frontend, .NET 8 Web API backend, PostgreSQL database
- **Deployment**: Firebase/Netlify (frontend), Azure/VPS (backend), ElephantSQL/Supabase (database)
- **Key Features**: Recursive task hierarchy (unlimited nesting), multi-user assignment, dual time tracking (timer + manual), Gantt view, comments with @mentions, activity logging

Critical Requirements:
- 25 Functional Requirements (FR1-FR25) - see PRD Requirements section
- 20 Non-Functional Requirements (NFR1-NFR20) - performance, security, scalability targets
- 3 Epics, 26 Stories with detailed acceptance criteria - see Epic sections

Technical Priorities:
1. **Recursive Hierarchy Performance**: Design database schema with CTE optimization for 10-15 level nesting
2. **Time Tracking Precision**: Architecture for timer persistence and time aggregation rollup
3. **Security**: JWT authentication, bcrypt password hashing, HTTPS everywhere, CSRF/XSS protection
4. **Zero-Budget Constraints**: All dependencies must be open-source (MIT/Apache), free tier hosting

Architecture Deliverables Needed:
- Database schema (ER diagram with all entities, relationships, indexes)
- API endpoint specifications (RESTful routing, request/response schemas)
- Frontend component architecture (Angular modules, services, state management)
- Security architecture (auth flow, token handling, authorization patterns)
- Deployment architecture (CI/CD pipeline, hosting configuration)
- Performance optimization strategy (caching, pagination, query optimization)
- Testing strategy (unit, integration, E2E approaches)

Known Complexity Areas:
- Recursive CTE queries for hierarchy (Task.ParentTaskId self-reference)
- Time rollup calculations across parent-child chains
- Gantt library selection and integration (Frappe Gantt vs. DHTMLX vs. custom)
- Real-time timer persistence using localStorage

Please review the PRD comprehensively and create the architecture document following your standard architecture template. Focus on pragmatic solutions that balance the zero-budget constraint with professional-grade technical quality.

Start by confirming you've read the PRD and brief, then proceed with architecture creation.
```
