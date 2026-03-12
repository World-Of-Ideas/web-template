# Checklist: Adding a New Page

Use this checklist every time you add a new page to the webapp.

## File Creation

- [ ] Create `src/app/{route}/page.tsx`
- [ ] Export `metadata` or `generateMetadata()` with title, description, openGraph
- [ ] Add canonical URL via metadata
- [ ] Add JSON-LD structured data appropriate to the page type
- [ ] Use semantic HTML (`<main>`, `<article>`, `<section>` as appropriate)
- [ ] Ensure exactly one `<h1>` on the page

## Common Page Elements

- [ ] **Breadcrumbs**: page renders breadcrumb trail, `BreadcrumbList` JSON-LD emitted
- [ ] **FAQs**: page has FAQ accordion section (data from D1 `pages.faqs` or `posts.faqs`), `FAQPage` JSON-LD emitted (skip if no FAQs)
- [ ] **Related pages**: page has related pages card row (data from D1 `pages.relatedPages` or auto-queried by tags)
- [ ] Add breadcrumb label to `src/config/navigation.ts` if route segment needs a custom display name

## SEO

- [ ] Page has a unique, descriptive `<title>` via metadata (30-60 chars ideal)
- [ ] Page has a unique `description` meta tag (120-160 chars ideal)
- [ ] Page has Open Graph tags (title, description, image)
- [ ] Page has Twitter card meta tags
- [ ] If the page has an image, it has an `alt` attribute
- [ ] JSON-LD structured data is valid (test at https://search.google.com/test/rich-results)

## Sitemap

- [ ] Add the page URL to `src/app/sitemap.ts` static pages array
- [ ] Set appropriate `changeFrequency` and `priority`
- [ ] If the page is dynamic (like blog posts), ensure it's included via D1 query

## Feature Toggle

- [ ] If the page belongs to a toggleable feature, add `notFound()` guard checking `settings.features`
- [ ] Ensure sitemap.ts respects the feature toggle for this page

## Navigation

- [ ] If the page should appear in the header/footer, add it to `src/config/navigation.ts` with appropriate `feature` key

## D1 Pages Table

- [ ] Add a row for the page in `src/db/seed.ts` (slug, title, FAQs, related pages, metadata)
- [ ] Add initial FAQ content for the page

## Responsiveness

- [ ] Page renders correctly on mobile (< 640px)
- [ ] Page renders correctly on tablet (640px - 1024px)
- [ ] Page renders correctly on desktop (> 1024px)

## Testing

- [ ] Page loads in `npm run dev` without errors
- [ ] Page works in `npm run preview:uat` (Cloudflare Workers preview)
- [ ] Run Lighthouse — target 100 SEO score
- [ ] Verify the page appears in `/sitemap.xml`
- [ ] Verify breadcrumbs, FAQs, and related pages render correctly
