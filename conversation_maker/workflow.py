"""
Wizard logic — v2.

Form fields the teacher fills in:
  - language: english | spanish
  - topic: free text
  - level_choice: basic | intermediate | advanced | all_levels (English only;
    Spanish always generates the single B1 version)
  - grammar_point: optional free text. If left blank, NO Grammar Point
    slide is generated — this is always the teacher's explicit choice,
    never something the model decides on its own.

Confirmed with Pedro (2026-07-18):
  - "All Levels" always produces three SEPARATE decks (Basic + Intermediate
    + Advanced), never one merged deck.
  - Objectives and the vocabulary word list are the same across all levels
    of the same topic — only conversation depth/scaffolding changes. So
    when generating "all levels", objectives/vocabulary are generated once
    and reused (vocabulary translations are stripped for Advanced, matching
    the real decks).
  - Section order is fixed always (see level_rules.MASTER_LAYOUTS_ORDER).
"""

from dataclasses import dataclass, replace
from typing import Literal

from .generator import generate_lesson
from .models import LessonContent, VocabularyItem
from .pagination import build_slide_plan

LevelChoice = Literal["basic", "intermediate", "advanced", "all_levels"]

ENGLISH_LEVELS = ("basic", "intermediate", "advanced")


@dataclass
class LessonRequest:
    language: Literal["english", "spanish"]
    topic: str
    level_choice: LevelChoice | None = None  # required if language == "english"
    grammar_point: str | None = None          # teacher's explicit opt-in, or None


@dataclass
class LessonOutput:
    lesson: LessonContent
    slide_plan: list

    def to_dict(self) -> dict:
        return {
            "content": self.lesson.to_dict(),
            "slides": [s.to_dict() for s in self.slide_plan],
        }


def _apply_shared_topic_content(lesson: LessonContent, objectives: list[str],
                                 vocabulary: list[VocabularyItem]) -> LessonContent:
    """Reuse objectives/vocabulary generated for the first level across the
    other levels of the same topic, stripping translations for Advanced."""

    from .level_rules import LEVEL_CONFIGS
    cfg = LEVEL_CONFIGS[lesson.level]

    shared_vocab = [
        VocabularyItem(
            word=v.word,
            translation=v.translation if cfg.include_scaffold else None,
            contrast_with=v.contrast_with,
        )
        for v in vocabulary
    ]
    return replace(lesson, objectives=list(objectives), vocabulary=shared_vocab)


def run_request(request: LessonRequest) -> list[LessonOutput]:
    """Executes one teacher request and returns one LessonOutput per level
    actually generated (always 1, except English + all_levels -> 3)."""

    if request.language == "spanish":
        levels = ["spanish_b1"]
    else:
        if request.level_choice is None:
            raise ValueError("English requests must specify a level_choice.")
        levels = list(ENGLISH_LEVELS) if request.level_choice == "all_levels" else [request.level_choice]

    outputs: list[LessonOutput] = []
    shared_objectives: list[str] | None = None
    shared_vocabulary: list[VocabularyItem] | None = None

    for level in levels:
        lesson = generate_lesson(
            language=request.language,
            topic=request.topic,
            level=level,
            grammar_point=request.grammar_point,
        )

        if shared_objectives is None:
            shared_objectives = lesson.objectives
            shared_vocabulary = lesson.vocabulary
        else:
            lesson = _apply_shared_topic_content(lesson, shared_objectives, shared_vocabulary)

        slide_plan = build_slide_plan(lesson)
        outputs.append(LessonOutput(lesson=lesson, slide_plan=slide_plan))

    return outputs
