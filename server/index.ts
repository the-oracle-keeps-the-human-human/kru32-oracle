import { readdir, stat, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const PORT = 3232;
const CLAUDE_DIR = join(homedir(), ".claude", "projects");

interface SessionInfo {
  project: string;
  file: string;
  sizeKB: number;
  modifiedAt: string;
  messageCount: number;
}

interface UsageStats {
  timestamp: string;
  claude: {
    activeSessions: number;
    totalSessions: number;
    todayMessages: number;
    todayInputTokens: number;
    todayOutputTokens: number;
    sessions: SessionInfo[];
  };
  codex: {
    activePanes: number;
    worktrees: string[];
  };
}

async function findJsonlFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = await findJsonlFiles(fullPath);
        results.push(...sub);
      } else if (entry.name.endsWith(".jsonl")) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

async function countMessages(path: string): Promise<{ messages: number; inputTokens: number; outputTokens: number }> {
  try {
    const content = await readFile(path, "utf-8");
    const lines = content.trim().split("\n");
    let messages = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    for (const line of lines.slice(-200)) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === "human" || obj.type === "assistant") messages++;
        if (obj.usage) {
          inputTokens += obj.usage.input_tokens || 0;
          outputTokens += obj.usage.output_tokens || 0;
        }
      } catch {
        // skip malformed lines
      }
    }
    return { messages, inputTokens, outputTokens };
  } catch {
    return { messages: 0, inputTokens: 0, outputTokens: 0 };
  }
}

async function getCodexWorktrees(): Promise<string[]> {
  try {
    const { stdout } = Bun.spawnSync(["git", "worktree", "list", "--porcelain"]);
    const text = new TextDecoder().decode(stdout);
    return text
      .split("\n")
      .filter((l) => l.startsWith("worktree "))
      .map((l) => l.replace("worktree ", ""))
      .filter((p) => p.includes("codex") || p.includes("worktree"));
  } catch {
    return [];
  }
}

async function getCodexPaneCount(): Promise<number> {
  try {
    const { stdout } = Bun.spawnSync(["tmux", "list-panes", "-a", "-F", "#{pane_current_command}"]);
    const text = new TextDecoder().decode(stdout);
    return text.split("\n").filter((l) => l.includes("codex") || l.includes("omx")).length;
  } catch {
    return 0;
  }
}

async function collectStats(): Promise<UsageStats> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const allFiles = await findJsonlFiles(CLAUDE_DIR);

  const sessions: SessionInfo[] = [];
  let todayMessages = 0;
  let todayInputTokens = 0;
  let todayOutputTokens = 0;
  let activeSessions = 0;

  for (const file of allFiles) {
    try {
      const s = await stat(file);
      const modStr = s.mtime.toISOString();
      const isToday = modStr.startsWith(todayStr);
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const isActive = s.mtime.getTime() > fiveMinAgo;

      if (isActive) activeSessions++;

      const projectPath = file.replace(CLAUDE_DIR + "/", "").split("/")[0];

      if (isToday) {
        const { messages, inputTokens, outputTokens } = await countMessages(file);
        todayMessages += messages;
        todayInputTokens += inputTokens;
        todayOutputTokens += outputTokens;

        sessions.push({
          project: decodeURIComponent(projectPath.replace(/-/g, "/")),
          file: basename(file),
          sizeKB: Math.round(s.size / 1024),
          modifiedAt: modStr,
          messageCount: messages,
        });
      }
    } catch {
      // skip
    }
  }

  sessions.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  const codexPanes = await getCodexPaneCount();
  const codexWorktrees = await getCodexWorktrees();

  return {
    timestamp: now.toISOString(),
    claude: {
      activeSessions,
      totalSessions: allFiles.length,
      todayMessages,
      todayInputTokens,
      todayOutputTokens,
      sessions: sessions.slice(0, 10),
    },
    codex: {
      activePanes: codexPanes,
      worktrees: codexWorktrees,
    },
  };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/usage") {
      const stats = await collectStats();
      return new Response(JSON.stringify(stats, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/api/usage/stream") {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = async () => {
            try {
              const stats = await collectStats();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
            } catch (e) {
              controller.enqueue(encoder.encode(`data: {"error":"${e}"}\n\n`));
            }
          };
          await send();
          const interval = setInterval(send, 5000);
          req.signal.addEventListener("abort", () => clearInterval(interval));
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/api/summary") {
      const stats = await collectStats();
      const summary = [
        `Active: ${stats.claude.activeSessions}`,
        `Today: ${stats.claude.todayMessages} msgs`,
        `In: ${Math.round(stats.claude.todayInputTokens / 1000)}k tok`,
        `Out: ${Math.round(stats.claude.todayOutputTokens / 1000)}k tok`,
        `Codex: ${stats.codex.activePanes} panes`,
      ].join("\n");
      return new Response(summary, {
        headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response("kru32-oracle usage server running", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`kru32-oracle usage server running on http://localhost:${PORT}`);
console.log(`  GET /api/usage        — full JSON stats`);
console.log(`  GET /api/usage/stream  — SSE stream (5s interval)`);
console.log(`  GET /api/summary      — plain text for ESP32`);
