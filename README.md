# Contributing to DisForm Blog

Thank you for your interest in contributing to the DisForm blog! This guide covers everything you need, from setting up your post to running the build script.

---

## Overview

The DisForm blog is powered by a GitHub-hosted content system. All blog posts live in this repository as Markdown files, and a central `blogs.json` file acts as the index. The website fetches this file at runtime to discover and display posts.

---

## Repository Structure

```
disform_blogs/
├── blogs.json                      # Master index (auto-generated, do not edit)
├── images/
│   └── your-post-slug/
│       └── thumbnail.png           # Post thumbnail (16:9 recommended)
└── blogs/
    └── your-post-slug/
        ├── page.md                 # Your post content in Markdown
        ├── data.json               # Your post metadata (you write this)
        └── meta.json               # Generated metadata (auto-generated, do not edit)
```

Every post gets its own folder under `blogs/` and optionally its own folder under `images/`.

---

## Quick Start

```bash
# 1. Create your post folder
mkdir blogs/my-post-title

# 2. Add your content and metadata
touch blogs/my-post-title/page.md
touch blogs/my-post-title/data.json

# 3. Build the index
node scripts/index.js
```

---

## data.json Reference

The `data.json` file holds all metadata for your post. Every field in the schema below is required.

### Full Example

```json
{
  "title": "Getting Started with DisForm",
  "description": "A beginner-friendly guide to setting up DisForm for your Discord server. Covers installation, configuration, and your first form.",
  "thumbnail": "thumbnail.png",
  "tags": ["guide", "discord", "setup"],
  "date": "2026-05-26",
  "author": "your-github-username"
}
```

### Field Reference

| Field         | Type         | Required | Description                                                         |
| ------------- | ------------ | -------- | ------------------------------------------------------------------- |
| `title`       | `string`     | Yes      | Post title shown on the card and post page.                         |
| `description` | `string`     | Yes      | Short summary shown in the card preview.                            |
| `thumbnail`   | `string`     | Yes      | Image filename relative to `images/your-post-slug/`, or a full URL. |
| `tags`        | `string[]`   | Yes      | Array of tag strings for filtering. Min 1, max 5.                   |
| `date`        | `YYYY-MM-DD` | Yes      | Publication date in `YYYY-MM-DD` format.                            |
| `author`      | `string`     | Yes      | Your GitHub username. Used to fetch your name and avatar.           |

### Drafts

Add `"draft": true` to your `data.json` to exclude a post from the build output. Drafts are ignored by default and only included when you pass the `--drafts` flag.

```json
{
  "draft": true,
  "title": "Work in Progress",
  ...
}
```

### Slugs

Slugs are auto generated from your folder name. The script will rename the folder automatically. For example, a folder named `Getting Started` becomes `getting-started`. Make sure folder names are unique to avoid slug collisions.

### Tags

Use existing tags where possible to keep filtering consistent. You may introduce new tags, but keep them short and generic.

---

## Writing Your Post

### File Location

Create your Markdown file at:

```
blogs/your-post-slug/page.md
```

Do **not** include YAML front matter. All metadata lives in `data.json`.

### Minimum Requirements

The build script validates your `page.md` before indexing it. Your post must:

- Contain at least one heading (`#`, `##`, etc.)
- Be at least 50 words long
- Not be empty or contain only whitespace

### Post Template

```markdown
## Introduction

Start with a brief intro. What is this post about and who is it for?

---

## Section One

Your content here. Use headers to break up long posts.

### Subsection

More detail here.

## Section Two

Continue your post...

---

## Conclusion

Wrap up with key takeaways or next steps.
```

---

## Supported Markdown

The blog renderer supports GitHub Flavored Markdown (GFM) plus syntax highlighting.

### Headings

```markdown
# H1 ~ you only can use this ONCE at the very top!

## H2 ~ use for main sections

### H3 ~ use for subsections

#### H4 ~ use sparingly
```

> Avoid `# H1`! The post title is rendered separately from the page header.

### Code Blocks

````markdown
```typescript
const hello = (name: string): string => {
  return `Hello, ${name}!`;
};
```
````

### Other Elements

```markdown
`inline code`

[Link text](https://example.com)

![Alt text](https://example.com/image.png)

> Blockquote or callout

| Column A | Column B |
| -------- | -------- |
| Value 1  | Value 2  |

- Unordered list item
  - Nested item

1. Ordered list item

---
```

---

## Images & Thumbnails

### Thumbnail Requirements

| Property         | Requirement                           |
| ---------------- | ------------------------------------- |
| Aspect ratio     | 16:9                                  |
| Recommended size | 1280×720px or 1920×1080px             |
| Format           | PNG or JPG                            |
| Max file size    | 500KB                                 |
| Location         | `images/your-post-slug/thumbnail.png` |

### Raw GitHub URL Format

Reference your thumbnail or in-post images using their raw GitHub URL:

```
https://raw.githubusercontent.com/SiLuyla/disform_blogs/main/images/YOUR_SLUG/FILE_NAME.png
```

### In-Post Images

Place additional images in your slug's image folder and reference them in Markdown using their raw URL:

```
images/your-post-slug/step-1.png
images/your-post-slug/diagram.png
```

---

## Build Script

After writing your post and filling in `data.json`, run the build script to index your post and generate `meta.json`.

```bash
node scripts/index.js
```

### What the Script Does

1. **Renames folders** ~ slugifies any folder names that don't match their slug form (e.g. `My Post` → `my-post`).
2. **Validates** ~ checks that `data.json` is well-formed, all required fields are present, and `page.md` meets the minimum content requirements.
3. **Fetches author info** ~ calls the GitHub API to resolve your username into a display name and avatar URL.
4. **Generates `meta.json`** ~ writes a complete metadata file (slug, resolved thumbnail URL, reading time, table of contents, full content) into your post folder.
5. **Updates `blogs.json`** ~ rebuilds the master index used by the website.

### Caching

If your `data.json` hasn't changed since the last build, the script skips re-processing that post and reuses the cached entry from `blogs.json`. Only changed or new posts are fully rebuilt.

### CLI Flags

| Flag       | Description                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------- |
| _(none)_   | Build all non-draft posts.                                                                          |
| `--drafts` | Include posts with `"draft": true` in the build output.                                             |
| `--watch`  | Watch the `blogs/` and `images/` directories and rebuild automatically on changes (500ms debounce). |

```bash
# Include draft posts in the build
node scripts/index.js --drafts

# Watch mode, rebuilds on file changes
node scripts/index.js --watch

# Both flags together
node scripts/index.js --drafts --watch
```

### Validation Errors

If a post fails validation, the script prints a warning and skips that post, it will not appear in `blogs.json`. Common errors:

| Error                                | Fix                                                             |
| ------------------------------------ | --------------------------------------------------------------- |
| `missing required field: "title"`    | Add `title` to `data.json`.                                     |
| `invalid date format`                | Use `YYYY-MM-DD` format, e.g. `2026-05-26`.                     |
| `page.md not found`                  | Create `page.md` inside your post folder.                       |
| `page.md too few words`              | Write at least 50 words.                                        |
| `thumbnail "x" not found in images/` | Place the image file at `images/your-slug/x` or use a full URL. |
| `GitHub API error`                   | Check that your `author` field is a valid GitHub username.      |
| `duplicate title`                    | Each post must have a unique title.                             |

---

## Style Guide

### Writing

- Write in clear, plain English. Avoid jargon unless you explain it.
- Use second person ("you") to address the reader.
- Keep paragraphs short, 3 to 5 sentences max.
- Lead with the most important information.
- Prefer active voice.

### Tone

- Friendly and professional. Not overly casual, not corporate.
- Helpful first. Assume the reader is here to learn something.
- Avoid filler openers like "In this article, we will…" just start writing.

### Code Examples

- Always include working, copy-pasteable examples.
- Add comments to explain non-obvious lines.
- Prefer complete snippets over partial fragments where possible.

### Post Length

| Type                     | Recommended Length |
| ------------------------ | ------------------ |
| Quick tip / announcement | 300–600 words      |
| Tutorial / guide         | 800–1500 words     |
| Deep dive                | 1500–3000 words    |

---

## FAQ

**Can I edit someone else's post?**
Only maintainers may edit existing posts. If you spot a typo or error, open an issue describing it.

**Can I submit multiple posts at once?**
Please open a separate PR for each post to keep reviews focused.

**What if my slug is already taken?**
Choose a more specific name. For example, `discord-webhooks` → `discord-webhooks-advanced-patterns`.

**Do I need to be a DisForm user to contribute?**
No, but posts should be relevant to the DisForm community, Discord bots, forms, automation, web development, and related programming topics.

**How long does review take?**
Usually within a few days. Maintainers will leave comments on your PR if changes are needed.

**Can I include affiliate links or promotions?**
No. Posts must be purely informational.

**Why is my post not showing up after the build?**
Check the terminal output for validation warnings. Every skipped post prints a reason.

---

DisForm is not affiliated with Discord Inc.  
Built by SiLuyla Development
