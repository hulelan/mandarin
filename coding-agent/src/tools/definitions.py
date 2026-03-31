"""Tool implementations — the actual code that runs when the model calls a tool."""

import os
import re
import subprocess
import glob as globmod
from pathlib import Path


def read_file(file_path: str, offset: int = 0, limit: int = 2000) -> str:
    """Read a file and return its contents with line numbers."""
    path = Path(file_path).resolve()
    if not path.exists():
        return f"Error: File not found: {file_path}"
    if not path.is_file():
        return f"Error: Not a file: {file_path}"
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        selected = lines[offset : offset + limit]
        numbered = [f"{i + offset + 1}\t{line}" for i, line in enumerate(selected)]
        return "\n".join(numbered)
    except Exception as e:
        return f"Error reading file: {e}"


def write_file(file_path: str, content: str) -> str:
    """Write content to a file, creating directories as needed."""
    path = Path(file_path).resolve()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return f"Successfully wrote {len(content)} bytes to {file_path}"
    except Exception as e:
        return f"Error writing file: {e}"


def edit_file(file_path: str, old_string: str, new_string: str) -> str:
    """Replace old_string with new_string in a file."""
    path = Path(file_path).resolve()
    if not path.exists():
        return f"Error: File not found: {file_path}"
    try:
        text = path.read_text(encoding="utf-8")
        count = text.count(old_string)
        if count == 0:
            return "Error: old_string not found in file"
        if count > 1:
            return f"Error: old_string found {count} times — must be unique. Provide more context."
        text = text.replace(old_string, new_string, 1)
        path.write_text(text, encoding="utf-8")
        return f"Successfully edited {file_path}"
    except Exception as e:
        return f"Error editing file: {e}"


def bash(command: str, timeout: int = 30) -> str:
    """Execute a bash command and return stdout + stderr."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.getcwd(),
        )
        output = ""
        if result.stdout:
            output += result.stdout
        if result.stderr:
            output += ("\n" if output else "") + result.stderr
        if result.returncode != 0:
            output += f"\n(exit code {result.returncode})"
        return output.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return f"Error: Command timed out after {timeout}s"
    except Exception as e:
        return f"Error: {e}"


def grep(pattern: str, path: str = ".", include: str = "") -> str:
    """Search file contents using regex. Returns matching lines with file paths."""
    cmd = f"grep -rn --color=never"
    if include:
        cmd += f" --include='{include}'"
    cmd += f" '{pattern}' {path}"

    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=15
        )
        lines = result.stdout.strip().splitlines()
        if len(lines) > 50:
            lines = lines[:50] + [f"... ({len(lines) - 50} more matches)"]
        return "\n".join(lines) if lines else "No matches found"
    except subprocess.TimeoutExpired:
        return "Error: Search timed out"


def glob_search(pattern: str, path: str = ".") -> str:
    """Find files matching a glob pattern."""
    try:
        base = Path(path).resolve()
        matches = sorted(base.glob(pattern))
        # Filter out hidden dirs, node_modules, .git, etc.
        filtered = [
            str(m.relative_to(base))
            for m in matches
            if not any(
                p.startswith(".") or p in ("node_modules", "__pycache__", ".venv")
                for p in m.relative_to(base).parts
            )
        ]
        if len(filtered) > 50:
            filtered = filtered[:50] + [f"... ({len(filtered) - 50} more)"]
        return "\n".join(filtered) if filtered else "No files found"
    except Exception as e:
        return f"Error: {e}"


def list_directory(path: str = ".") -> str:
    """List files and directories in a path."""
    try:
        p = Path(path).resolve()
        if not p.exists():
            return f"Error: Path not found: {path}"
        entries = sorted(p.iterdir(), key=lambda x: (not x.is_dir(), x.name))
        lines = []
        for e in entries:
            if e.name.startswith(".") and e.name not in (".env.example",):
                continue
            prefix = "📁 " if e.is_dir() else "   "
            lines.append(f"{prefix}{e.name}")
        return "\n".join(lines) if lines else "(empty directory)"
    except Exception as e:
        return f"Error: {e}"
