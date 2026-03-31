"""Interactive CLI for the coding agent."""

import argparse
import json
import os
import sys

from src.llm.client import LLMClient
from src.agent import Agent, AgentConfig


BANNER = """
╔═══════════════════════════════════════╗
║  🐾 claw — local coding agent        ║
║  Type your request, or /help          ║
╚═══════════════════════════════════════╝
"""

HELP_TEXT = """
Commands:
  /help          Show this help
  /model NAME    Switch model (e.g., /model qwen2.5-coder:14b)
  /reset         Clear conversation history
  /tools         List available tools
  /auto          Toggle auto-approve mode (skip tool confirmations)
  /quit          Exit

Tips:
  - Multi-line input: end a line with \\ to continue
  - Prefix with ! to run a shell command directly
"""


def prompt_approve(tool_name: str, args: dict) -> bool:
    """Ask user to approve a tool call."""
    # Format args nicely
    if tool_name == "bash":
        detail = args.get("command", "")
    elif tool_name == "write_file":
        content = args.get("content", "")
        detail = f"{args.get('file_path', '?')} ({len(content)} bytes)"
    elif tool_name == "edit_file":
        detail = args.get("file_path", "?")
    else:
        detail = json.dumps(args, ensure_ascii=False)[:100]

    print(f"\n  🔧 {tool_name}: {detail}")
    try:
        answer = input("  Allow? [Y/n] ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return False
    return answer in ("", "y", "yes")


def main():
    parser = argparse.ArgumentParser(description="claw — local coding agent")
    parser.add_argument("--model", default="qwen2.5:14b", help="Ollama model name")
    parser.add_argument("--base-url", default="http://localhost:11434/v1", help="LLM API base URL")
    parser.add_argument("--api-key", default="ollama", help="API key (default: ollama)")
    parser.add_argument("--auto-approve", action="store_true", help="Skip tool confirmations")
    parser.add_argument("--max-turns", type=int, default=20, help="Max agent turns per request")
    parser.add_argument("prompt", nargs="*", help="Optional one-shot prompt (non-interactive)")
    args = parser.parse_args()

    client = LLMClient(
        base_url=args.base_url,
        model=args.model,
        api_key=args.api_key,
    )
    config = AgentConfig(
        max_turns=args.max_turns,
        auto_approve_tools=args.auto_approve,
    )
    agent = Agent(client=client, config=config)

    approve_fn = None if config.auto_approve_tools else prompt_approve

    # One-shot mode
    if args.prompt:
        prompt_text = " ".join(args.prompt)
        try:
            result = agent.run(prompt_text, approve_fn=approve_fn)
            print(result)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        return

    # Interactive REPL
    print(BANNER)
    print(f"  Model: {args.model}")
    print(f"  Auto-approve: {'on' if config.auto_approve_tools else 'off'}")
    print(f"  Working dir: {os.getcwd()}")
    print()

    while True:
        try:
            user_input = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not user_input:
            continue

        # Shell passthrough
        if user_input.startswith("!"):
            os.system(user_input[1:])
            continue

        # Slash commands
        if user_input.startswith("/"):
            cmd = user_input.split()[0].lower()
            rest = user_input[len(cmd):].strip()

            if cmd == "/help":
                print(HELP_TEXT)
            elif cmd == "/quit" or cmd == "/exit":
                print("Bye!")
                break
            elif cmd == "/reset":
                agent.reset()
                print("Conversation cleared.")
            elif cmd == "/model":
                if rest:
                    client.model = rest
                    print(f"Switched to model: {rest}")
                else:
                    print(f"Current model: {client.model}")
            elif cmd == "/tools":
                from src.tools import TOOL_REGISTRY
                for name in TOOL_REGISTRY:
                    desc = TOOL_REGISTRY[name]["schema"]["function"]["description"]
                    print(f"  {name:20s} {desc[:60]}")
            elif cmd == "/auto":
                config.auto_approve_tools = not config.auto_approve_tools
                approve_fn = None if config.auto_approve_tools else prompt_approve
                print(f"Auto-approve: {'on' if config.auto_approve_tools else 'off'}")
            else:
                print(f"Unknown command: {cmd}. Type /help for help.")
            continue

        # Run the agent
        try:
            result = agent.run(user_input, approve_fn=approve_fn)
            if result:
                print(f"\n{result}\n")
        except KeyboardInterrupt:
            print("\n(interrupted)")
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    main()
