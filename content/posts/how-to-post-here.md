---
title: How to post on this page
kind: blog
date: 2026-11-27
summary: A starter post that shows everything a post can do. Copy it, change it, or delete it.
tags: [how-to, writing]
cover: ep02-edit
draft: true
---

Every post is one Markdown file in `content/posts/`. The file name becomes the link, so `my-first-post.md` lives at **/writing/my-first-post**.

The block between the two `---` lines at the top holds the post's details. Everything under it is the post itself.

## Writing

Type like you would in a notes app. A blank line starts a new paragraph.
A single line break stays a line break.

Use `**two stars**` for **a highlighter stroke**, `*one star*` for *italics*, and `[text](https://example.com)` for [a link](https://heyishant.com/work).

- Lists start with a dash
- like this
- and get orange bullets

> A line that starts with ">" turns into a hand-written note in the margin.

## Pictures

Put images in `public/posts/<the-post's-file-name>/` and write `![what's in it](photo.jpg "a caption")`. One image on its own line becomes a taped photo:

![Ishant's desk](/img/photo/ep02-desk-1280.webp "the desk, circa house of growth")

A few images on back-to-back lines become a little gallery:

![Set design for a shoot](/img/photo/set-gc-1280.webp "set one")
![Another angle of the set](/img/photo/set-gc-2-1280.webp "set two")

## Videos

Paste a YouTube link on its own line and it plays right here:

https://www.youtube.com/watch?v=4ys_Tyxy-Ac

Or show any piece from the Work page, with the same player, by writing its id from `content/works.ts`:

[[work: ck-meta-hidden-cashback-app, ck-meta-stop-coupon-hunting]]

---

## Publishing

While a post has `draft: true`, it only shows on the preview site. Delete that line, rebuild, and it's live.
