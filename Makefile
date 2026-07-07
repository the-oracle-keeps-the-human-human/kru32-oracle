# kru32-oracle — Codex Team Management
# ใช้ maw verbs เท่านั้น ห้าม raw tmux

TEAM = kru32-team
SESSION = 81-kru32

.PHONY: team-up team-down team-status team-peek help

help: ## Show available commands
	@echo "kru32-oracle team commands:"
	@echo "  make team-up      — เปิดทีม (maw team up)"
	@echo "  make team-down    — ปิดทีม (maw team down)"
	@echo "  make team-status  — ดูสถานะ (maw team status)"
	@echo "  make team-peek    — peek ทุก coder (maw peek)"

team-up: ## เปิดทีมจาก charter
	maw team up $(TEAM)

team-down: ## ปิดทีมทั้งหมด
	maw team down $(TEAM)

team-status: ## ดูสถานะทีม
	maw team status $(TEAM)

team-peek: ## peek ทุก coder
	@for w in research compile coder-1 coder-2 qa designer; do \
		echo "=== $$w ==="; \
		maw peek $(SESSION):$$w --lines 5 2>/dev/null || true; \
	done
