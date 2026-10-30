# Safety rules (WP-CLI)

Use this file before running any write operations.

## Golden rules

- Assume production is **unsafe** unless explicitly confirmed.
- Always confirm targeting:
  - `--path` (WordPress root)
  - `--url` (multisite / specific site targeting)
- Prefer a backup (`wp db export`) before risky operations.
- Prefer `--dry-run` where available (especially `search-replace`).

## High-risk commands (require explicit confirmation)

- `wp db reset`
- `wp db import` (overwrites data)
- `wp search-replace` (can affect serialized data and URLs)
- bulk deletes (`wp post delete --force --all`, `wp user delete --reassign`, etc.)
- plugin/theme mass updates on production

## Isolated local plugin fixtures

- Verify actual WordPress/PHP versions inside existing images before selecting dependencies; an untagged cached image can contain an older core than a previous fixture's documented image tag. Pin the chosen image digest and read runtime versions back.
- Execute strict-types PHP fixtures through `wp eval 'require "/workspace/fixture.php";'`, not `wp eval-file`; some WP-CLI eval-file wrappers prepend code and make `declare(strict_types=1)` fatal.
- Make non-secret bind-mount roots traversable by the container runtime UID (usually 0755); a 0644 file inside a host-owned 0700 mount directory remains unreadable. Keep host parent directories, credentials and logs private.
- Supply a genuine current-user `X-WP-Nonce` on internal REST requests when the product distinguishes first-party access from external automation. Do not enable external API access to make a CLI fixture pass.
- Preserve native role policy during UX audits. If a canonical staff role passes endpoint authorization but its UI hides the action under a legacy capability, record the mismatch rather than broadening the role to conceal it. Separate installation acceptance from workflow acceptance.

## Logging

Treat installation output as potentially secret-bearing: WP-CLI can print a generated administrator password. Redact credential lines before saving or returning output, and verify the installed URL, prefix and runtime versions before activating fixtures; successful installation alone does not establish the requested target. Retain only sanitized receipts.

For ops scripts, log:

- date/time
- environment (dev/staging/prod)
- exact WP-CLI commands with secret values replaced by placeholders
- exit codes

