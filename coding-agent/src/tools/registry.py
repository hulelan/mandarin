"""Tool registry — maps tool names to implementations and provides OpenAI-format schemas."""

import json
from src.tools.definitions import (
    read_file, write_file, edit_file, bash, grep, glob_search, list_directory,
)

# Tool schemas in OpenAI function-calling format
TOOL_REGISTRY = {
    "read_file": {
        "fn": read_file,
        "schema": {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read a file's contents with line numbers. Use offset/limit for large files.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "Absolute or relative path to the file"},
                        "offset": {"type": "integer", "description": "Line number to start from (0-indexed)", "default": 0},
                        "limit": {"type": "integer", "description": "Max lines to read", "default": 2000},
                    },
                    "required": ["file_path"],
                },
            },
        },
    },
    "write_file": {
        "fn": write_file,
        "schema": {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": "Write content to a file. Creates the file and parent directories if they don't exist.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "Path to write to"},
                        "content": {"type": "string", "description": "The full content to write"},
                    },
                    "required": ["file_path", "content"],
                },
            },
        },
    },
    "edit_file": {
        "fn": edit_file,
        "schema": {
            "type": "function",
            "function": {
                "name": "edit_file",
                "description": "Replace a unique string in a file with a new string. The old_string must appear exactly once.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "Path to the file to edit"},
                        "old_string": {"type": "string", "description": "The exact text to find (must be unique in the file)"},
                        "new_string": {"type": "string", "description": "The replacement text"},
                    },
                    "required": ["file_path", "old_string", "new_string"],
                },
            },
        },
    },
    "bash": {
        "fn": bash,
        "schema": {
            "type": "function",
            "function": {
                "name": "bash",
                "description": "Execute a bash command. Use for git, running tests, installing packages, etc.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "The bash command to execute"},
                        "timeout": {"type": "integer", "description": "Timeout in seconds", "default": 30},
                    },
                    "required": ["command"],
                },
            },
        },
    },
    "grep": {
        "fn": grep,
        "schema": {
            "type": "function",
            "function": {
                "name": "grep",
                "description": "Search file contents using regex pattern. Returns matching lines with file paths and line numbers.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Regex pattern to search for"},
                        "path": {"type": "string", "description": "Directory to search in", "default": "."},
                        "include": {"type": "string", "description": "File glob filter, e.g. '*.py'", "default": ""},
                    },
                    "required": ["pattern"],
                },
            },
        },
    },
    "glob": {
        "fn": glob_search,
        "schema": {
            "type": "function",
            "function": {
                "name": "glob",
                "description": "Find files matching a glob pattern. Example: '**/*.py' for all Python files.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Glob pattern (e.g. '**/*.ts', 'src/**/*.py')"},
                        "path": {"type": "string", "description": "Base directory to search from", "default": "."},
                    },
                    "required": ["pattern"],
                },
            },
        },
    },
    "list_directory": {
        "fn": list_directory,
        "schema": {
            "type": "function",
            "function": {
                "name": "list_directory",
                "description": "List files and directories in a given path.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Directory to list", "default": "."},
                    },
                    "required": [],
                },
            },
        },
    },
}


def get_tool_definitions() -> list[dict]:
    """Return all tool schemas for the LLM."""
    return [entry["schema"] for entry in TOOL_REGISTRY.values()]


def execute_tool(name: str, arguments: dict) -> str:
    """Execute a tool by name with the given arguments."""
    entry = TOOL_REGISTRY.get(name)
    if entry is None:
        return f"Error: Unknown tool '{name}'"
    try:
        return entry["fn"](**arguments)
    except TypeError as e:
        return f"Error calling {name}: {e}"
