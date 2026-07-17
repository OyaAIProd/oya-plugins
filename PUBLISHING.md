# Publishing the Oya plugins

Three plugins, two distribution channels:

- **Claude Code** and **Codex** install from a **git marketplace** — publish = push this
  `plugins/` tree to a public repo.
- **OpenCode** installs from **npm** — publish = `npm publish` the `opencode/` package
  (or push a `plugins-v*` tag to run `.github/workflows/release-oya-plugins.yaml`).

> Names below use the placeholders `OyaAIProd/oya-plugins` (git repo) and `@oya-ai` (npm scope).
> Replace them with the real ones you own before publishing. This monorepo's GitHub org is
> `A2ABaseAI`; the marketplace repo must be **public** (Claude Code / Codex clone it).

## 1. Claude Code + Codex — publish the marketplace repo

The repo root must equal the contents of this `plugins/` folder so the marketplace files
resolve (`.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, and the
`./claude-code` / `./codex` plugin paths).

```bash
# from the monorepo root — split plugins/ into a standalone tree and push it
git subtree split --prefix plugins -b oya-plugins-publish
git push git@github.com:OyaAIProd/oya-plugins.git oya-plugins-publish:main
```

(or copy `plugins/` into a fresh public repo and push normally.)

Users then install:

```bash
# Claude Code
/plugin marketplace add OyaAIProd/oya-plugins
/plugin install oya@oya-plugins

# Codex
codex plugin marketplace add OyaAIProd/oya-plugins
codex plugin install oya
```

## 2. OpenCode — publish to npm

Option A — CI (matches the oya-cli release flow):

```bash
# bump plugins/opencode/package.json "version" to X.Y.Z first, then:
git tag plugins-vX.Y.Z
git push origin plugins-vX.Y.Z   # runs release-oya-plugins.yaml -> npm publish
```

Requires a repo secret `NPM_TOKEN` (an npm automation token with publish rights to the
`@oya-ai` scope).

Option B — manual:

```bash
cd plugins/opencode
npm login                 # once, as a user with @oya-ai publish rights
npm publish --access public
```

Users then install by adding it to `opencode.json`:

```json
{ "plugin": ["@oya-ai/opencode-plugin"] }
```

## Pre-publish checklist

- [ ] Real git repo slug + npm scope substituted everywhere (this file, the plugin READMEs,
      `plugins/opencode/package.json` `repository`/`bugs`, and `frontend/src/app/oya/page.tsx`).
- [ ] `@oya-ai` npm org exists and you can publish to it.
- [ ] Marketplace repo is **public**.
- [ ] `cd plugins/opencode && npm publish --dry-run` looks right.
- [ ] Verified end to end in each tool (the Codex `mcp.json` connector shape and the OpenCode
      `@opencode-ai/plugin` tool API were written from docs, not run in-tool).
