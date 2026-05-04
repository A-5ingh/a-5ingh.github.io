---
title: "Building GitVitae"
date: "2026-04-02"
tags: [portfolio, react, vibe-coding, open-source]
excerpt: "Git-Vitae: an open source portfolio and resume generator that deploys to GitHub Pages."
---
# GitVitae

## Need for GitVitae

You fill in one YAML config file with your details. You get a live portfolio site, two resume formats (a modern two-column layout and a clean ATS-friendly classic), and a PDF export button. Fork the repo, fill in the file, enable GitHub Pages in your settings. That’s it.

It’s free to host permanently. Your data lives in a repo you own. No subscription, no platform lock-in — though worth noting: the data is structured for this tool’s YAML schema, so switching tools later means reformatting it.

[![How to use GitVitae](https://i.ytimg.com/an_webp/iUoFmcTKmW8/mqdefault_6s.webp?du=3000&sqp=CNyz4M8G&rs=AOn4CLAK5PZ6FZw1o70pnwngOaUXLuUZKg)](https://www.youtube.com/watch?v=iUoFmcTKmW8 "How to use GitVitae")

**One honest tradeoff**: your URL will be `yourgitusername.github.io` by default. That's not a clean professional URL. A custom domain fixes it and costs around $12/year through any registrar — point it at GitHub Pages in your repo settings and you're done.

→ [Live demo](https://git-vitae.github.io) · [Fork the repo](https://github.com/git-vitae/git-vitae.github.io/fork) · [How to set it up](https://git-vitae.github.io/#/setup)

## How to get started
 - [Fork the repo](https://github.com/git-vitae/git-vitae.github.io/fork).
 - Edit `portfolio.config.yaml` with your details — it's commented, non-programmers can handle it.
 - Enable GitHub Pages in your repo settings (Settings → Pages → Deploy from branch → main).
 - Your portfolio is live.

**PRs welcome if you improve it.**
