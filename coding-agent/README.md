# claw — local coding agent

A minimal coding agent that uses open-source models (via Ollama) for routine coding tasks. Route the simple stuff here, save Claude for the hard problems.

## Quick Start

```bash
# Install Ollama (if you haven't)
brew install ollama

# Pull a coding model
ollama pull qwen2.5-coder:7b

# Install claw
cd coding-agent
pip install -e .

# Run interactively
python -m src

# Or one-shot
python -m src "list all Python files in this project"
```

## Usage

```bash
# Interactive REPL
python -m src

# Use a different model
python -m src --model codellama:13b

# Auto-approve all tool calls (no confirmations)
python -m src --auto-approve

# Point at a different API (e.g., vLLM, LM Studio, OpenRouter)
python -m src --base-url http://localhost:8080/v1 --api-key your-key
```

## Available Tools

| Tool | What it does |
|------|--------------|
| `read_file` | Read file contents with line numbers |
| `write_file` | Create or overwrite files |
| `edit_file` | Make targeted string replacements |
| `bash` | Execute shell commands |
| `grep` | Search file contents with regex |
| `glob` | Find files by pattern |
| `list_directory` | List directory contents |

## Architecture

```
User prompt
  → Agent loop (src/agent.py)
    → LLM client (src/llm/client.py) — sends to Ollama/OpenAI-compatible API
    → Tool calls parsed from response
    → Tool execution (src/tools/) — real file ops, bash, search
    → Results fed back to LLM
    → Repeat until LLM responds with text (no more tool calls)
  → Response displayed to user
```

## Swapping Models

Any model that supports OpenAI-compatible tool/function calling works:
- `qwen2.5-coder:7b` (default, good balance)
- `qwen2.5-coder:14b` (better reasoning)
- `codellama:13b`
- `deepseek-coder-v2:16b`
- Any model via OpenRouter, Together, etc. (just change --base-url and --api-key)
