-- Seed data for local development
-- Run with: npm run db:seed:local

-- ============================================================
-- System Pages (7 rows)
-- ============================================================

INSERT OR REPLACE INTO pages (slug, parent_slug, title, description, content, faqs, related_pages, cover_image, metadata, published, sort_order, updated_at) VALUES
('home', NULL, 'Home', 'Welcome to our product — the best way to solve your problem.', NULL,
  '[{"question":"What is this product?","answer":"A tool designed to help you launch and grow your product faster."},{"question":"When does it launch?","answer":"We are currently in pre-launch. Join the waitlist to be the first to know!"},{"question":"Is the waiting list free?","answer":"Yes, signing up for the waiting list is completely free."}]',
  '[{"title":"Join the Waitlist","description":"Be the first to get access.","href":"/waitlist"},{"title":"Read the Blog","description":"Tips and insights from our team.","href":"/blog"}]',
  NULL, NULL, 1, 0, datetime('now')),

('waitlist', NULL, 'Waitlist', 'Join our waiting list and be the first to get access.',
  '[{"type":"heading","text":"Join the Waiting List","level":2},{"type":"paragraph","text":"Sign up below to reserve your spot. Each referral moves you up the list!"}]',
  '[{"question":"How does the referral system work?","answer":"Share your unique referral link. Each friend who signs up moves you 5 positions up the list."},{"question":"When will I get access?","answer":"We will send invites in order of position. Early signups and active referrers get access first."},{"question":"Can I sign up more than once?","answer":"No, each email can only be registered once. If you try again, we will show your existing dashboard."}]',
  '[{"title":"Enter the Giveaway","description":"Win prizes while you wait.","href":"/giveaway"},{"title":"Read the Blog","description":"Stay updated with our latest posts.","href":"/blog"}]',
  NULL, '{"boostFactor":5}', 1, 1, datetime('now')),

('giveaway', NULL, 'Giveaway', 'Enter our giveaway for a chance to win amazing prizes.',
  '[{"type":"heading","text":"Enter the Giveaway","level":2},{"type":"paragraph","text":"Complete actions below for bonus entries. The more entries, the better your chances!"}]',
  '[{"question":"How do bonus entries work?","answer":"Each completed action (sharing, following, referring) gives you extra entries into the draw."},{"question":"When is the giveaway drawn?","answer":"The draw will happen on the end date shown on the page. Winners will be notified by email."},{"question":"Who is eligible?","answer":"Anyone who enters before the end date. You must be 18 or older."}]',
  '[{"title":"Join the Waitlist","description":"Get early access to the product.","href":"/waitlist"},{"title":"Read the Blog","description":"Learn more about what we are building.","href":"/blog"}]',
  NULL, '{"endDate":"2026-12-31T00:00:00Z","prizeTitle":"Premium Lifetime Access","prizeDescription":"Win a lifetime premium subscription.","bonusEntries":{"share":3,"follow":2,"referral":5}}', 1, 2, datetime('now')),

('contact', NULL, 'Contact', 'Get in touch with our team.',
  '[{"type":"heading","text":"Contact Us","level":2},{"type":"paragraph","text":"Have a question, partnership inquiry, or just want to say hi? Fill out the form below."}]',
  '[{"question":"How long until I hear back?","answer":"We typically respond within 24-48 hours on business days."},{"question":"Can I partner with you?","answer":"Absolutely! Use the contact form and mention partnership in your message."}]',
  '[{"title":"Join the Waitlist","description":"Sign up for early access.","href":"/waitlist"},{"title":"Read the Blog","description":"Check out our latest updates.","href":"/blog"}]',
  NULL, NULL, 1, 3, datetime('now')),

('blog', NULL, 'Blog', 'Insights, tutorials, and updates from our team.', NULL,
  NULL, NULL, NULL, NULL, 1, 4, datetime('now')),

('terms', NULL, 'Terms of Use', 'Terms of use for our product and services.',
  '[{"type":"heading","text":"Terms of Use","level":2},{"type":"paragraph","text":"By using our services, you agree to these terms. Please read them carefully."},{"type":"heading","text":"1. Acceptance of Terms","level":3},{"type":"paragraph","text":"By accessing or using our service, you agree to be bound by these Terms of Use and our Privacy Policy."},{"type":"heading","text":"2. Use of Service","level":3},{"type":"paragraph","text":"You may use our service only for lawful purposes and in accordance with these terms."},{"type":"heading","text":"3. Intellectual Property","level":3},{"type":"paragraph","text":"All content and materials available on the service are the property of the company."}]',
  NULL, NULL, NULL, NULL, 1, 5, datetime('now')),

('privacy', NULL, 'Privacy Policy', 'How we collect, use, and protect your data.',
  '[{"type":"heading","text":"Privacy Policy","level":2},{"type":"paragraph","text":"Your privacy is important to us. This policy explains how we handle your personal information."},{"type":"heading","text":"1. Information We Collect","level":3},{"type":"paragraph","text":"We collect information you provide directly, such as your name and email address when you sign up for the waitlist."},{"type":"heading","text":"2. How We Use Information","level":3},{"type":"paragraph","text":"We use your information to provide and improve our services, send you updates, and communicate with you."},{"type":"heading","text":"3. Data Security","level":3},{"type":"paragraph","text":"We implement appropriate security measures to protect your personal information."}]',
  NULL, NULL, NULL, NULL, 1, 6, datetime('now'));

-- ============================================================
-- Sample Blog Posts (3 posts)
-- ============================================================

INSERT OR REPLACE INTO posts (slug, title, description, content, faqs, cover_image, author, tags, published, published_at, created_at, updated_at) VALUES
('welcome-to-our-product', 'Welcome to Our Product', 'Learn about what we are building and why it matters.',
  '[{"type":"paragraph","text":"We are excited to announce the launch of our product. This is the beginning of something great."},{"type":"heading","text":"Why We Built This","level":2},{"type":"paragraph","text":"We noticed a gap in the market and decided to build something that truly solves the problem."},{"type":"list","items":["Faster workflow","Better collaboration","Simpler interface"],"ordered":false},{"type":"callout","text":"Join our waitlist to be the first to try it out!","variant":"tip"},{"type":"cta","text":"Be the first to try it — join the waiting list!"}]',
  '[{"question":"When will the product launch?","answer":"We are targeting a launch within the next few months. Join the waitlist to stay updated."}]',
  NULL, 'Admin', '["launch","announcement","product"]', 1, datetime('now', '-7 days'), datetime('now', '-7 days'), datetime('now', '-7 days')),

('top-10-tips-for-productivity', 'Top 10 Tips for Productivity', 'Boost your productivity with these simple yet effective tips.',
  '[{"type":"paragraph","text":"Productivity is not about working harder — it is about working smarter. Here are our top tips."},{"type":"heading","text":"1. Start Your Day with a Plan","level":2},{"type":"paragraph","text":"Spend 10 minutes each morning outlining your top priorities for the day."},{"type":"heading","text":"2. Use the Two-Minute Rule","level":2},{"type":"paragraph","text":"If a task takes less than two minutes, do it immediately instead of adding it to your list."},{"type":"heading","text":"3. Batch Similar Tasks","level":2},{"type":"paragraph","text":"Group related tasks together to minimize context switching."},{"type":"quote","text":"The key is not to prioritize what is on your schedule, but to schedule your priorities."},{"type":"heading","text":"4. Take Regular Breaks","level":2},{"type":"paragraph","text":"Short breaks help maintain focus and prevent burnout. Try the Pomodoro technique."},{"type":"download","downloadUrl":"/uploads/productivity-checklist.pdf","downloadLabel":"Download Productivity Checklist"},{"type":"cta","text":"Want more productivity tips? Join our community!"}]',
  '[{"question":"How often should I take breaks?","answer":"Every 25-50 minutes of focused work, take a 5-10 minute break."}]',
  NULL, 'Admin', '["productivity","tips","workflow"]', 1, datetime('now', '-3 days'), datetime('now', '-3 days'), datetime('now', '-3 days')),

('the-future-of-remote-work', 'The Future of Remote Work', 'How remote work is evolving and what it means for your team.',
  '[{"type":"paragraph","text":"Remote work has transformed the way we think about offices, commutes, and collaboration."},{"type":"heading","text":"The Shift to Hybrid","level":2},{"type":"paragraph","text":"Many companies are adopting hybrid models that combine the best of remote and in-office work."},{"type":"image","image":"https://pub-placeholder.r2.dev/blog/remote-work/cover.webp","alt":"Team collaborating remotely"},{"type":"heading","text":"Tools That Enable Remote Work","level":2},{"type":"table","headers":["Tool","Category","Best For"],"rows":[["Slack","Communication","Quick messages"],["Zoom","Video","Meetings"],["Notion","Documentation","Knowledge base"]]},{"type":"callout","text":"Our product is designed with remote teams in mind.","variant":"info"},{"type":"cta","text":"Join the waitlist to see how we can help your remote team."}]',
  NULL,
  NULL, 'Admin', '["remote-work","future","collaboration"]', 1, datetime('now', '-1 days'), datetime('now', '-1 days'), datetime('now', '-1 days'));

-- ============================================================
-- Test Subscribers (5 rows)
-- Clean up first to ensure consistent autoincrement IDs on re-runs
-- ============================================================

DELETE FROM giveaway_actions;
DELETE FROM giveaway_entries;
DELETE FROM subscribers;
DELETE FROM sqlite_sequence WHERE name IN ('subscribers', 'giveaway_entries', 'giveaway_actions');

INSERT INTO subscribers (email, name, referral_code, referred_by, referral_count, position, status, created_at) VALUES
('alice@example.com', 'Alice Johnson', 'abc123', NULL, 2, 1, 'active', datetime('now', '-10 days')),
('bob@example.com', 'Bob Smith', 'def456', 'abc123', 0, 2, 'active', datetime('now', '-9 days')),
('carol@example.com', 'Carol Williams', 'ghi789', 'abc123', 1, 3, 'active', datetime('now', '-8 days')),
('dave@example.com', 'Dave Brown', 'jkl012', 'ghi789', 0, 4, 'active', datetime('now', '-7 days')),
('eve@example.com', 'Eve Davis', 'mno345', NULL, 0, 5, 'unsubscribed', datetime('now', '-6 days'));

-- ============================================================
-- Giveaway Entries (2 rows)
-- ============================================================

INSERT INTO giveaway_entries (email, subscriber_id, total_entries, created_at) VALUES
('alice@example.com', 1, 6, datetime('now', '-5 days')),
('bob@example.com', 2, 1, datetime('now', '-4 days'));

-- ============================================================
-- Giveaway Actions (for Alice)
-- ============================================================

INSERT INTO giveaway_actions (entry_id, action, bonus_entries, metadata, completed_at) VALUES
(1, 'twitter_share', 3, '{"tweetUrl":"https://twitter.com/alice/status/123"}', datetime('now', '-5 days')),
(1, 'twitter_follow', 2, NULL, datetime('now', '-4 days'));
