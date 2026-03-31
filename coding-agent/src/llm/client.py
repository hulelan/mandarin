"""LLM client supporting Ollama and any OpenAI-compatible API."""

import json
from dataclasses import dataclass, field

import httpx


@dataclass
class Message:
    role: str  # "system", "user", "assistant", "tool"
    content: str | None = None
    tool_calls: list[dict] | None = None
    tool_call_id: str | None = None
    name: str | None = None

    def to_dict(self) -> dict:
        d: dict = {"role": self.role}
        if self.content is not None:
            d["content"] = self.content
        if self.tool_calls is not None:
            d["tool_calls"] = self.tool_calls
        if self.tool_call_id is not None:
            d["tool_call_id"] = self.tool_call_id
        if self.name is not None:
            d["name"] = self.name
        return d


@dataclass
class LLMClient:
    """Connects to Ollama or any OpenAI-compatible endpoint."""

    base_url: str = "http://localhost:11434/v1"  # Ollama default
    model: str = "qwen2.5:14b"  # Adjust to whatever you have in ollama
    api_key: str = "ollama"  # Ollama doesn't need a real key
    timeout: float = 120.0

    def chat(
        self,
        messages: list[Message],
        tools: list[dict] | None = None,
    ) -> Message:
        """Send a chat completion request and return the assistant message."""
        payload: dict = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "stream": False,
        }
        if tools:
            payload["tools"] = tools

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            resp.raise_for_status()

        data = resp.json()
        choice = data["choices"][0]["message"]

        return Message(
            role="assistant",
            content=choice.get("content"),
            tool_calls=choice.get("tool_calls"),
        )
