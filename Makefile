.PHONY: dev test test-run coverage

# ── Dev local ──────────────────────────────────────────────

dev:
	npm run dev

# ── Tests ──────────────────────────────────────────────────

test:
	npm run test

test-run:
	npm run test:run

# ── Coverage ───────────────────────────────────────────────

coverage:
	npm run test:coverage