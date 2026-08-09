# Hermes Agent support

Hermes Agent implements the Agent Skills standard and discovers skills under the active profile's `~/.hermes/skills/` directory. This fork adds a deterministic `hermes` build target and `hermes-global` installer target without changing the canonical skill sources.

## Build

```bash
node shared/scripts/skillpack-build.mjs --clean --targets=hermes
```

The generated pack is written to `dist/hermes/.hermes/skills/wordpress/`. The `wordpress` category keeps this pack separate from unrelated Hermes skills while preserving every skill's public name.

## Preview and install

```bash
node shared/scripts/skillpack-install.mjs --targets=hermes-global --dry-run
node shared/scripts/skillpack-install.mjs --targets=hermes-global
```

The installer replaces only same-named skill directories under `~/.hermes/skills/wordpress/`; it does not clear the category or touch other skills.

Start a new Hermes session or run `/reload-skills`, then verify discovery with `hermes skills list`. Invoke `/wordpress-router` at the start of broad WordPress work. Load `/wp-production-safety` alongside the domain skill when work touches durable state, retries, external side effects, or release recovery.

## Development checkout alternative

Hermes can also scan this repository's source `skills/` directory directly through `skills.external_dirs` in `config.yaml`. That keeps a development checkout live, but the directory remains writable when the Hermes process has filesystem access. Use an isolated worktree and review the Git diff before committing agent-authored changes.
