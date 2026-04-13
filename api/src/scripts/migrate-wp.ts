/**
 * WordPress → CoinCraft DB migration script
 * Usage: npx ts-node src/scripts/migrate-wp.ts
 *
 * Fetches posts from https://staging.coincraft.io/wp-json/wp/v2/posts
 * and inserts them into the posts table (skips duplicates by slug).
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from '../db';
import { posts, categories, tags, postCategories, postTags } from '../db/schema';

const WP_BASE = 'https://staging.coincraft.io/wp-json/wp/v2';

interface WpPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  status: string;
  date_gmt: string;
  modified_gmt: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
    'wp:featuredmedia'?: Array<{ source_url?: string }>;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function fetchAllPosts(): Promise<WpPost[]> {
  const all: WpPost[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${WP_BASE}/posts?per_page=${perPage}&page=${page}&_embed=1&status=publish`;
    console.log(`Fetching page ${page}: ${url}`);

    const res = await fetch(url);
    if (res.status === 400) break; // no more pages
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching posts page ${page}`);
      break;
    }

    const data = (await res.json()) as WpPost[];
    if (!Array.isArray(data) || data.length === 0) break;

    all.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return all;
}

async function ensureCategory(name: string, slug: string): Promise<string> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(categories)
    .values({ name, slug })
    .returning({ id: categories.id });

  return created.id;
}

async function ensureTag(name: string, slug: string): Promise<string> {
  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(tags)
    .values({ name, slug })
    .returning({ id: tags.id });

  return created.id;
}

async function main() {
  console.log('Starting WordPress migration...');
  console.log(`Source: ${WP_BASE}`);

  const wpPosts = await fetchAllPosts();
  console.log(`\nFetched ${wpPosts.length} published posts from WordPress`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const wp of wpPosts) {
    try {
      // Check for duplicate slug
      const [existing] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, wp.slug))
        .limit(1);

      if (existing) {
        console.log(`  SKIP  [duplicate slug] ${wp.slug}`);
        skipped++;
        continue;
      }

      // Extract cover image from _embedded
      const coverImage =
        wp._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;

      // Extract terms (categories + tags) from _embedded
      const embeddedTerms = wp._embedded?.['wp:term'] ?? [];
      const wpCategories: Array<{ id: number; name: string; slug: string }> = [];
      const wpTags: Array<{ id: number; name: string; slug: string }> = [];

      for (const termGroup of embeddedTerms) {
        for (const term of termGroup) {
          if (term.taxonomy === 'category') {
            wpCategories.push(term);
          } else if (term.taxonomy === 'post_tag') {
            wpTags.push(term);
          }
        }
      }

      // Insert post
      const [created] = await db
        .insert(posts)
        .values({
          slug: wp.slug,
          title: stripHtml(wp.title.rendered),
          content: wp.content.rendered,
          excerpt: stripHtml(wp.excerpt.rendered) || null,
          coverImage,
          status: 'published',
          publishedAt: new Date(wp.date_gmt + 'Z'),
          createdAt: new Date(wp.date_gmt + 'Z'),
          updatedAt: new Date(wp.modified_gmt + 'Z'),
        })
        .returning({ id: posts.id });

      // Insert category relations
      for (const cat of wpCategories) {
        if (cat.slug === 'uncategorized') continue;
        const catId = await ensureCategory(cat.name, cat.slug);
        await db.insert(postCategories).values({ postId: created.id, categoryId: catId }).onConflictDoNothing();
      }

      // Insert tag relations
      for (const tag of wpTags) {
        const tagId = await ensureTag(tag.name, tag.slug);
        await db.insert(postTags).values({ postId: created.id, tagId }).onConflictDoNothing();
      }

      console.log(`  OK    [${wp.id}] ${stripHtml(wp.title.rendered)}`);
      inserted++;
    } catch (err) {
      console.error(`  ERROR [${wp.id}] ${wp.slug}:`, err);
      errors++;
    }
  }

  console.log('\n=== Migration complete ===');
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
