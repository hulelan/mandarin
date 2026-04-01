# claw vs claw-code: Gap Analysis

## What we built vs the original repo

### What claw-code (GitHub) is
A **scaffold/mirror** of Claude Code's harness architecture. ~1,700 LOC of Python, zero external deps. 207 commands and 184 tools loaded from JSON snapshots, but **nothing actually executes** — tool calls return "would handle..." stubs. No real LLM connection. It's an architecture study, not a working agent.

### What we built
A **functional agent** — 7 tools that actually run, a real LLM client that talks to Ollama, and a working agent loop. ~700 LOC, one dependency (httpx). Simpler but actually works.

---

## What's missing (prioritized)

### High value — add these first

1. **Session persistence** — Save/load conversations to disk (JSON). Resume where you left off.
   - claw-code: `session_store.py`, `StoredSession` dataclass, `.port_sessions/` directory
   - Effort: ~50 LOC

2. **Transcript compaction** — Summarize old messages when context window gets long. Critical for local models with small context windows (4K-8K tokens).
   - claw-code: `query_engine.py` `compact_messages()`, `compact_after_turns` config
   - Effort: ~80 LOC

3. **Token budget tracking** — Count tokens, stop before hitting the model's limit.
   - claw-code: `UsageSummary` dataclass, `max_budget_tokens` config
   - Effort: ~40 LOC

### Medium value — nice to have

4. **Permission deny-lists** — Block specific tools or prefixes (e.g., `--deny-tool bash`).
   - claw-code: `permissions.py`, `ToolPermissionContext` with `deny_names` and `deny_prefixes`
   - Effort: ~30 LOC

5. **More CLI subcommands** — `route` (match prompt to tools), `summary`, `tools --query`, etc.
   - claw-code: 14+ subcommands in `main.py`
   - Effort: ~100 LOC

6. **Streaming responses** — Stream LLM output token-by-token instead of waiting for full response.
   - claw-code: `stream_submit_message()` in query engine
   - Effort: ~60 LOC

### Low value — completeness only

7. **207 command / 184 tool JSON snapshots** — The mirroring system. Only useful if you want to audit against the original Claude Code architecture.
   - claw-code: `reference_data/commands_snapshot.json`, `tools_snapshot.json`, 31 subsystem JSONs
   - Not useful for a working agent

8. **Multi-mode routing** — Remote, SSH, teleport, direct-connect, deep-link modes.
   - claw-code: `remote_runtime.py`, `direct_modes.py`
   - All stubs in claw-code anyway

9. **Parity audit** — Compare against archived TypeScript snapshot.
   - claw-code: `parity_audit.py`
   - Only relevant if you have the original archive

10. **Bootstrap graph / startup stages** — Formal pipeline for agent initialization.
    - claw-code: `bootstrap_graph.py`, 7-stage pipeline
    - Our agent just initializes directly, which is fine

---

## Architecture comparison

```
claw-code (scaffold):                    claw (ours, functional):
─────────────────────                    ────────────────────────
main.py (14 subcommands)                 cli.py (REPL + one-shot)
runtime.py (routing, bootstrap)          agent.py (agent loop)
query_engine.py (session orchestration)  llm/client.py (Ollama/OpenAI API)
commands.py (207 JSON stubs)             tools/registry.py (7 real tools)
tools.py (184 JSON stubs)                tools/definitions.py (implementations)
execution_registry.py (shim execution)   (tools execute directly)
session_store.py (persistence)           (not yet implemented)
transcript.py (history)                  (messages list in agent)
permissions.py (deny lists)              (simple approve_fn callback)
31 subsystem placeholder packages        (not needed)
reference_data/ (JSON snapshots)         (not needed)
```

## Recommended next steps

1. Add session persistence (`/save`, `/load` commands)
2. Add transcript compaction (summarize after N turns)
3. Add streaming output
4. Pull a coding-specific model: `ollama pull qwen2.5-coder:7b`
5. Port to its own repo when ready
