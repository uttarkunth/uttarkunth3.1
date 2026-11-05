# Uttarkunth 3.1 — Four-Department Operational Structure

---

## 1. The Four Operational Departments

All operational staff are organized into four primary business departments corresponding to the four pillars of Uttarkunth:

| # | Department Name | Canonical Slug | Legacy DB Code | Primary Desk Route | Scope of Responsibilities |
|---|---|---|---|---|---|
| 1 | **UTTARKUNTH STAYS** | `stays` | `stays_curation` | `/admin/properties` | Property onboarding & moderation, staged host edits, room units, availability blocks, host/co-host verification, and stay bookings. |
| 2 | **UTTARKUNTH PRODUCTS** | `products` | `marketplace_compliance` | `/admin/products` | Artisan/seller applications, Modulo-36 Indian GSTIN verification, FSSAI/AYUSH/Organic/GI licence inspection, product curation, and buyer inquiries. |
| 3 | **UTTARKUNTH PRODUCTIONS** | `productions` | `productions` | `/admin/productions` | Filmmaker & creator profiles, documentary/media proposals, regional storytelling slates, and copyright/takedown workflows. |
| 4 | **UTTARKUNTH COMMUNITY** | `community` | `community` | `/admin/community` | Village development initiatives, volunteer/fellowship applications, community stories moderation, and cultural preservation projects. |

---

## 2. Centralized Shared Functions (`founder_office`)

HR, Finance, Legal & Compliance, Technology, Customer Support, and Platform Administration are **not** separate operational departments. They are centralized under the Founder Office (`founder_office`) and executed via the **Founder Command Centre (`admin.uttarkunth.com`)**, with individual capabilities delegable only via explicit Founder permission grants (`staff_permission_assignments`).

---

## 3. Granular Action Permission Mapping

`/lib/staff-rbac-shared.ts` maps action-specific permissions to canonical RBAC keys and enforces strict departmental boundaries:

- **Stays**: `stays.properties.view`, `stays.properties.create`, `stays.properties.edit`, `stays.properties.approve`, `stays.properties.publish`, `stays.hosts.verify`, `stays.bookings.view`, `stays.bookings.manage`
- **Products**: `products.sellers.view`, `products.sellers.verify`, `products.sellers.approve`, `products.products.create`, `products.products.approve`, `products.items.approve`, `products.items.publish`, `products.orders.manage`
- **Productions**: `productions.proposals.view`, `productions.proposals.review`, `productions.proposals.approve`, `productions.projects.manage`, `productions.content.approve`
- **Community**: `community.members.view`, `community.applications.review`, `community.projects.manage`, `community.initiatives.manage`, `community.stories.moderate`
- **Founder Governance**: `governance.staff.invite`, `governance.staff.approve`, `governance.staff.suspend`, `governance.staff.terminate`, `governance.permissions.assign`, `governance.dual_approve`
