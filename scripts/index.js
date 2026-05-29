// @ts-check

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const BLOGS_JSON = path.join(__dirname, "..", "blogs.json");
const PRIOR_JSON = path.join(__dirname, "..", "priority.json");
const BLOGS_DIR = path.join(__dirname, "..", "blogs");
const REPO_RAW = "https://raw.githubusercontent.com/SiLuyla/disform_blogs/main";
const VALIDATION_MSGS = [];

function hashData(data, pageContent = "") {
  const { meta, ...userFields } = data;
  return crypto
    .createHash("md5")
    .update(JSON.stringify(userFields) + pageContent)
    .digest("hex");
}

async function fetchGithubUser(username, cache) {
  if (cache[username]) return cache[username];
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok)
    throw new Error(`GitHub API error (${res.status}) for user: ${username}`);
  const data = await res.json();
  cache[username] = {
    name: data.name || data.login,
    avatar: data.avatar_url,
    username: data.login,
  };
  return cache[username];
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadingTime(content) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 200);
}

function warn(slug, msg) {
  const full = `[${slug}] ${msg}`;
  VALIDATION_MSGS.push(full);
  console.warn(`  ⚠  ${full}`);
}

function info(msg) {
  console.log(`  ℹ  ${msg}`);
}

function getPlaceholderImage() {
  return `${REPO_RAW}/images/thumbnail.png`;
}

function isValidBlogData(data, slug) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    warn(slug, "data.json is not a valid object");
    return false;
  }

  const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;
  const isValidDate = (value) => {
    if (typeof value !== "string" || !value.trim()) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return !Number.isNaN(new Date(value).getTime());
    }
    return !Number.isNaN(Date.parse(value));
  };

  let valid = true;
  if (!isNonEmptyString(data.title)) {
    warn(slug, 'missing required field: "title"');
    valid = false;
  }
  if (!isNonEmptyString(data.description)) {
    warn(slug, 'missing required field: "description"');
    valid = false;
  }
  if (!isNonEmptyString(data.author)) {
    warn(slug, 'missing required field: "author" (GitHub username string)');
    valid = false;
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    warn(slug, 'missing required field: "tags" (non-empty array)');
    valid = false;
  } else if (!data.tags.every(isNonEmptyString)) {
    warn(slug, '"tags" must be an array of non-empty strings');
    valid = false;
  }
  if (data.date !== undefined && !isValidDate(data.date)) {
    warn(slug, `invalid date format: "${data.date}" (expected YYYY-MM-DD)`);
    valid = false;
  }
  if (
    data.thumbnail !== undefined &&
    data.thumbnail !== null &&
    !isNonEmptyString(data.thumbnail)
  ) {
    warn(slug, '"thumbnail" must be a non-empty string (filename or URL)');
    valid = false;
  }

  return valid;
}

function isValidPage(pagePath, slug) {
  if (!fs.existsSync(pagePath)) {
    warn(slug, "page.md not found");
    return false;
  }
  const content = fs.readFileSync(pagePath, "utf-8").trim();
  if (content.length === 0) {
    warn(slug, "page.md is empty");
    return false;
  }
  if (content.length < 50) {
    warn(slug, `page.md too short (${content.length} chars, min 50)`);
    return false;
  }
  if (!/^#{1,6}\s+.+/m.test(content)) {
    warn(slug, "page.md must contain at least one heading (# heading)");
    return false;
  }
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) {
    warn(slug, `page.md too few words (${wordCount}, min 50)`);
    return false;
  }
  if (!/[a-zA-Z]{3,}/.test(content)) {
    warn(slug, "page.md must contain at least 3 consecutive letters");
    return false;
  }
  return true;
}

function getExistingBlogs() {
  if (!fs.existsSync(BLOGS_JSON)) return [];
  try {
    return JSON.parse(fs.readFileSync(BLOGS_JSON, "utf-8"));
  } catch {
    return [];
  }
}

function resolveThumbnail(thumbnailFile, slug) {
  if (!thumbnailFile) return null;
  if (isValidUrl(thumbnailFile)) return thumbnailFile;
  const localPath = path.join(__dirname, "..", "images", thumbnailFile);
  if (fs.existsSync(localPath)) {
    const stats = fs.statSync(localPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    if (stats.size > 500 * 1024) {
      warn(slug, `thumbnail image is ${sizeKB}KB (recommended max 500KB)`);
    }
    return `${REPO_RAW}/images/${thumbnailFile}`;
  }
  warn(slug, `thumbnail "${thumbnailFile}" not found in images/ directory`);
  return null;
}

function extractHeadings(content) {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const found = [];
  const slugMap = new Map();
  let match;
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const base = slugify(text);
    const count = slugMap.get(base) ?? 0;
    slugMap.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    found.push({ id, text, level });
  }

  return found;
}

async function loadBlogs({ includeDrafts = false } = {}) {
  if (!fs.existsSync(BLOGS_DIR)) {
    console.error("blogs/ directory not found");
    fs.writeFileSync(BLOGS_JSON, "[]");
    return;
  }

  VALIDATION_MSGS.length = 0;
  const existing = getExistingBlogs();
  const existingMap = new Map(existing.map((b) => [b.slug, b]));
  const githubCache = {};
  const results = [];
  const priority = [];
  const seenTitles = new Set();

  const blogDirs = fs
    .readdirSync(BLOGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  console.log(
    `\nScanning ${blogDirs.length} blog director${blogDirs.length === 1 ? "y" : "ies"}...\n`,
  );

  for (const slug of blogDirs) {
    const dataPath = path.join(BLOGS_DIR, slug, "data.json");
    const pagePath = path.join(BLOGS_DIR, slug, "page.md");
    const metaPath = path.join(BLOGS_DIR, slug, "meta.json");

    if (!fs.existsSync(dataPath)) {
      warn(slug, "no data.json found, skipping");
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (e) {
      warn(slug, `invalid JSON in data.json: ${e.message}`);
      continue;
    }

    if (data.draft === true && !includeDrafts) {
      info(`"${data.title}" is a draft, skipping (use --drafts to include)`);
      continue;
    }

    const pageContent = fs.existsSync(pagePath)
      ? fs.readFileSync(pagePath, "utf-8")
      : "";

    const currentHash = hashData(data, pageContent);
    const cached = existingMap.get(slugify(slug));

    if (cached && cached._hash === currentHash && fs.existsSync(metaPath)) {
      console.log(`  ✓ ${slug} (unchanged)`);
      const resultData = {
        slug: cached.slug,
        title: data.title,
        description: data.description,
        thumbnail: cached.thumbnail,
        tags: data.tags || [],
        date: data.date || null,
        author: cached.author,
        _hash: currentHash,
      };

      if (data.priority === true) priority.push(resultData);
      results.push(resultData);
      continue;
    }

    if (cached) console.log(`  ~ ${slug} (changed)`);
    if (!isValidBlogData(data, slug)) {
      warn(slug, "validation failed, skipping");
      continue;
    }

    if (seenTitles.has(data.title.toLowerCase())) {
      warn(slug, `duplicate title "${data.title}"`);
      continue;
    }
    seenTitles.add(data.title.toLowerCase());

    if (!isValidPage(pagePath, slug)) {
      continue;
    }

    let author;
    try {
      author = await fetchGithubUser(data.author, githubCache);
    } catch (e) {
      warn(slug, `GitHub fetch failed for "${data.author}": ${e.message}`);
      continue;
    }

    const readingTime = estimateReadingTime(pageContent);
    const resolvedDate = data.date ? new Date(data.date).toISOString() : null;
    const resolvedSlug = slugify(slug);
    let resolvedThumbnail = resolveThumbnail(data.thumbnail ?? null, slug);
    const resolvedToC = extractHeadings(pageContent);

    if (!resolvedThumbnail) {
      resolvedThumbnail = getPlaceholderImage();
    }

    const meta = {
      ...data,
      slug: resolvedSlug,
      thumbnail: resolvedThumbnail,
      date: resolvedDate,
      readingTime,
      author,
      toc: resolvedToC,
      content: pageContent,
    };

    delete data.draft;
    fs.writeFileSync(metaPath, JSON.stringify(meta));

    const resultData = {
      slug: resolvedSlug,
      title: data.title,
      description: data.description,
      thumbnail: resolvedThumbnail,
      tags: data.tags || [],
      date: resolvedDate,
      author,
      _hash: currentHash,
    };

    if (data.priority === true) priority.push(resultData);
    results.push(resultData);
    console.log(`  ✓ ${slug} (loaded)`);
  }

  fs.writeFileSync(BLOGS_JSON, JSON.stringify(results));
  fs.writeFileSync(PRIOR_JSON, JSON.stringify(priority));
  console.log(`\nDone ~ ${results.length} blog(s) indexed\n`);

  if (VALIDATION_MSGS.length > 0) {
    console.warn(
      `Validation ${VALIDATION_MSGS.length === 1 ? "issue" : "issues"}:\n`,
    );
    for (const msg of VALIDATION_MSGS) {
      console.warn(`  ${msg}`);
    }
    console.warn("");
  }
}

async function renameDirs() {
  if (!fs.existsSync(BLOGS_DIR)) return;

  const blogDirs = fs
    .readdirSync(BLOGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let renamed = 0;
  for (const name of blogDirs) {
    const slug = slugify(name);
    if (slug === name) continue;
    const oldPath = path.join(BLOGS_DIR, name);
    const newPath = path.join(BLOGS_DIR, slug);
    if (fs.existsSync(newPath)) {
      console.warn(`  ⚠  skip rename "${name}" → "${slug}" (target exists)`);
      continue;
    }
    fs.renameSync(oldPath, newPath);
    console.log(`  ~ renamed: "${name}" → "${slug}"`);
    renamed++;
  }
  if (renamed > 0) console.log("");
}

function watchMode() {
  console.log("\nWatching for changes... (Ctrl+C to stop)\n");
  let timeout = null;
  const debouncedBuild = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      console.log("\nChange detected, rebuilding...\n");
      try {
        await renameDirs();
        await loadBlogs();
      } catch (e) {
        console.error("Build failed:", e.message);
      }
      console.log("Watching for changes... (Ctrl+C to stop)\n");
    }, 500);
  };

  try {
    fs.watch(BLOGS_DIR, { recursive: true }, debouncedBuild);
    fs.watch(path.join(__dirname, "..", "images"), debouncedBuild);
  } catch (e) {
    console.error("Watch error:", e.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const includeDrafts = args.includes("--drafts");
  const watch = args.includes("--watch");

  await renameDirs();
  await loadBlogs({ includeDrafts });

  if (watch) {
    watchMode();
  }
}

module.exports = {
  slugify,
  estimateReadingTime,
  hashData,
  isValidUrl,
  isValidBlogData,
  isValidPage,
  resolveThumbnail,
  extractHeadings,
  loadBlogs,
  renameDirs,
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
