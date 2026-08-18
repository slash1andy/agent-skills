---
name: wp-production-safety
description: "Use when a WordPress change touches durable data, migrations, external side effects, payments, webhooks, scheduled jobs, releases, or live operations. Enforces replay-safe implementation and recovery evidence."
compatibility: "Targets WordPress 7.0+ (PHP 7.4.0+). Filesystem-based agent with bash + node."
---

# WordPress production safety

## When to use

Load this skill alongside the domain skill when work changes durable state, crosses an external system boundary, runs asynchronously, or can disrupt an installed site during deployment or rollback.

Do not use it for isolated copy, style, or documentation edits with no runtime effect.

## Inputs required

- Target repository, supported WordPress/PHP versions, and installed dependency versions when behavior is release-sensitive.
- Affected state and side effects: options, metadata, custom tables, files, queues, webhooks, payments, email, or remote APIs.
- Deployment model, expected concurrency, retry source, and recovery or rollback requirement.

## Procedure

1. **Trace the real path.** Identify every caller, write, side effect, retry entry point, and observable terminal state. Use installed source for exact runtime signatures when current documentation and the target version differ.
2. **Define replay semantics.** Choose the stable identity for one logical operation. Make duplicate, delayed, reordered, and concurrent delivery converge without duplicating irreversible effects.
3. **Use platform storage contracts.** Prefer public WordPress APIs and the active domain's supported data stores. Do not couple object behavior to assumed post, table, or cache storage.
4. **Version durable work.** Gate schema or data changes by durable progress. Advance progress only after committed writes succeed; use stable cursors rather than shifting page offsets.
5. **Keep mixed versions safe.** During rolling deployment or interrupted upgrades, preserve old reads or dual-compatible state until every supported reader can move forward. Unsupported environments should fail before partial activation.
6. **Design recovery before rollout.** Specify what happens after interruption, timeout, ambiguous remote outcome, exhausted retry, downgrade, and rollback. Never use live payments or customer data as test fixtures.
7. **Leave one executable proof.** Add the smallest test that fails on replay, interruption, or compatibility regression. Run focused checks, then the repository's applicable gates.

## Verification

- Re-run the same logical operation and prove one durable result and one irreversible side effect.
- Interrupt immediately before and after each progress commit; resume without skipped or duplicated records.
- Exercise duplicate and reordered webhook/action delivery plus concurrent workers when those paths exist.
- Verify both current and minimum supported storage/runtime modes actually touched by the change.
- Record exact commands, outcomes, skipped environments, and the remaining release approval boundary.

## Failure modes / debugging

- A timestamp or page number is usually not a stable operation identity or migration cursor.
- A retry-safe database write can still duplicate email, payment, or remote API effects.
- A compatibility declaration is not evidence; test the implementation on the declared surface.
- Successful CI does not authorize deployment, publication, credentials, or live mutations.

## Escalation

Stop for a human decision when the change can discard data, repeat an irreversible effect, alter payment or authorization behavior, or has no tested recovery path.
