"""
Local CLI for testing the wizard end to end, without any UI or API key.

Usage (run from the directory that CONTAINS the conversation_maker/ folder,
e.g. the repo root):
    python3 -m conversation_maker.cli --demo   # fixed demo cases, no input()
    python3 -m conversation_maker.cli          # interactive prompts

Output: prints a summary and saves JSON under conversation_maker/sample_output/.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .workflow import LessonRequest, run_request

OUT_DIR = Path(__file__).parent / "sample_output"


def ask(prompt: str, choices: list[str] | None = None) -> str:
    while True:
        raw = input(f"{prompt} ").strip().lower()
        if choices is None or raw in choices:
            return raw
        print(f"  (please answer one of: {', '.join(choices)})")


def interactive_request() -> LessonRequest:
    language = ask("Language? [english/spanish]", ["english", "spanish"])
    topic = input("Lesson topic? ").strip()

    grammar_raw = input(
        "Do you want to work on a specific grammar point with this topic? "
        "(leave blank for no) "
    ).strip()
    grammar_point = grammar_raw or None

    if language == "english":
        level = ask(
            "Level? [basic/intermediate/advanced/all_levels]",
            ["basic", "intermediate", "advanced", "all_levels"],
        )
        return LessonRequest(
            language="english", topic=topic, level_choice=level, grammar_point=grammar_point
        )
    return LessonRequest(language="spanish", topic=topic, grammar_point=grammar_point)


def demo_requests() -> list[LessonRequest]:
    return [
        LessonRequest(language="english", topic="going shopping", level_choice="all_levels"),
        LessonRequest(
            language="english",
            topic="babies",
            level_choice="basic",
            grammar_point="past simple of 'to be born' (was/were born)",
        ),
        LessonRequest(language="spanish", topic="la vida diaria"),
    ]


def save_and_print(request: LessonRequest, outputs) -> None:
    OUT_DIR.mkdir(exist_ok=True)
    for output in outputs:
        level = output.lesson.level
        topic_slug = request.topic.lower().replace(" ", "_")[:40]
        filename = OUT_DIR / f"{request.language}_{level}_{topic_slug}.json"
        data = output.to_dict()
        filename.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"\n=== {request.language} / {level} / '{request.topic}' "
              f"(grammar_point={request.grammar_point!r}) ===")
        print(f"saved: {filename}")
        print(f"slides: {len(output.slide_plan)} -> "
              f"{[s.layout for s in output.slide_plan]}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo", action="store_true", help="run fixed demo cases")
    args = parser.parse_args()

    if args.demo:
        for request in demo_requests():
            outputs = run_request(request)
            save_and_print(request, outputs)
        return

    request = interactive_request()
    outputs = run_request(request)
    save_and_print(request, outputs)


if __name__ == "__main__":
    sys.exit(main())
