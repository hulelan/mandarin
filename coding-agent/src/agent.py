"""Agent loop — the core orchestration between LLM and tools."""

import json
import os
from dataclasses import dataclass, field

from src.llm.client import LLMClient, Message
from src.tools import get_tool_definitions, execute_tool


SYSTEM_PROMPT = """You are a coding assistant. You help users with software engineering tasks by reading, writing, and editing code, running commands, and searching codebases.

You have access to the following tools:
- read_file: Read file contents
- write_file: Write/create files
- edit_file: Make targeted edits to files
- bash: Execute shell commands
- grep: Search file contents with regex
- glob: Find files by pattern
- list_directory: List directory contents

Guidelines:
- Read files before editing them.
- Use edit_file for targeted changes, write_file for new files or complete rewrites.
- Prefer specific tool calls over bash when possible (e.g., read_file over cat).
- Be concise in your responses.
- When you're done with a task, say so clearly.

Working directory: {cwd}
"""


@dataclass
class AgentConfig:
    max_turns: int = 20
    auto_approve_tools: bool = False  # If False, ask user before dangerous tools
    dangerous_tools: tuple[str, ...] = ("bash", "write_file", "edit_file")


@dataclass
class Agent:
    client: LLMClient
    config: AgentConfig = field(default_factory=AgentConfig)
    messages: list[Message] = field(default_factory=list)

    def __post_init__(self):
        if not self.messages:
            self.messages = [
                Message(role="system", content=SYSTEM_PROMPT.format(cwd=os.getcwd()))
            ]

    def run(self, user_input: str, approve_fn=None) -> str:
        """Run the agent loop for a user message. Returns the final text response.

        approve_fn: callable(tool_name, args) -> bool. If None, auto-approves everything.
        """
        self.messages.append(Message(role="user", content=user_input))
        tools = get_tool_definitions()

        for turn in range(self.config.max_turns):
            # Call the LLM
            response = self.client.chat(self.messages, tools=tools)
            self.messages.append(response)

            # If no tool calls, we're done — return the text response
            if not response.tool_calls:
                return response.content or ""

            # Process each tool call
            for tool_call in response.tool_calls:
                fn = tool_call["function"]
                tool_name = fn["name"]

                # Parse arguments
                try:
                    args = json.loads(fn["arguments"]) if isinstance(fn["arguments"], str) else fn["arguments"]
                except json.JSONDecodeError:
                    args = {}

                # Permission check
                if approve_fn and tool_name in self.config.dangerous_tools:
                    if not approve_fn(tool_name, args):
                        result = "Tool call denied by user."
                        self.messages.append(Message(
                            role="tool",
                            content=result,
                            tool_call_id=tool_call.get("id", ""),
                            name=tool_name,
                        ))
                        continue

                # Execute the tool
                result = execute_tool(tool_name, args)

                # Truncate very long results
                if len(result) > 10000:
                    result = result[:10000] + "\n... (truncated)"

                self.messages.append(Message(
                    role="tool",
                    content=result,
                    tool_call_id=tool_call.get("id", ""),
                    name=tool_name,
                ))

        return "(max turns reached)"

    def reset(self):
        """Clear conversation history."""
        self.messages = [
            Message(role="system", content=SYSTEM_PROMPT.format(cwd=os.getcwd()))
        ]
