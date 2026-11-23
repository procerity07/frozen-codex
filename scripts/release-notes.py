#!/usr/bin/env python3
"""Build GitHub release notes from the commits since the previous release.

Usage: release-notes.py <previous-tag-or-empty> <new-version> <commit-sha>
Each commit becomes a section: its subject as a heading, its body as the details.
Attribution trailers (Co-Authored-By, Claude-Session, Signed-off-by) are dropped.
"""
import subprocess
import sys

TRAILERS = ("co-authored-by:", "claude-session:", "signed-off-by:")


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def main() -> None:
    prev, version, sha = (sys.argv[1:] + ["", "", ""])[:3]
    has_prev = bool(prev) and subprocess.run(
        ["git", "rev-parse", "-q", "--verify", f"refs/tags/{prev}"], capture_output=True
    ).returncode == 0
    rng = [f"{prev}..HEAD"] if has_prev else ["-1"]
    raw = git("log", *rng, "--no-merges", "--reverse", "--format=%x1e%s%x1f%b")

    sections = []
    for entry in raw.split("\x1e"):
        if not entry.strip():
            continue
        subject, _, body = entry.partition("\x1f")
        lines = [l.rstrip() for l in body.splitlines() if not l.strip().lower().startswith(TRAILERS)]
        while lines and not lines[-1]:
            lines.pop()
        while lines and not lines[0]:
            lines.pop(0)
        sections.append(f"### {subject.strip()}\n" + ("\n".join(lines) + "\n" if lines else ""))

    out = [f"## Frozen Codex v{version}", ""]
    out.append(f"Changes since {prev}:" if has_prev else "Changes in this build:")
    out.append("")
    out.extend(sections or ["- Maintenance build.\n"])
    out.append("---")
    out.append(f"Install: download the APK below and open it on your phone (it updates the existing app)." )
    if sha:
        out.append(f"Built from commit {sha[:7]}.")
    print("\n".join(out))


if __name__ == "__main__":
    main()
