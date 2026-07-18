"""
Data models for Conversation Maker — v2.

v2 replaces the docx spec's abstract schema with the structure actually
observed across 15 real production decks (Countries/Japan x3 levels,
Everyday Life/Vacation x3 levels, Chores, Babies, Shopping), confirmed
with Pedro on 2026-07-18:

  - Objectives (3) and vocabulary theme are shared across all levels of
    the same topic — only the conversation depth changes per level.
  - Basic and Intermediate both use answer scaffolding (sentence starters
    / fill-in-the-blank); Advanced drops scaffolding entirely and asks
    fully open questions.
  - Conversation questions are grouped by subtopic (e.g. FOOD, ORIGAMI),
    not chunked at a fixed count.
  - Language Game (multiple choice, a/b/c) appears for Basic/Intermediate,
    not for Advanced.
  - Real decks also include a "Material Needed" slide (activity + class
    duration), an optional grammar aside ("Learning Time!"), and a
    closing slide that repeats the cover.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Literal, Optional

Language = Literal["english", "spanish"]
Level = Literal["basic", "intermediate", "advanced", "spanish_b1"]


@dataclass
class VocabularyItem:
    word: str
    translation: Optional[str] = None   # PT translation; None for Advanced
    contrast_with: Optional[str] = None  # e.g. "unexpensive" contrasted with "cheap"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class GrammarAside:
    """Optional grammar mini-lesson ("LEARNING TIME!" in real decks).
    Only included when the topic has a grammar point worth flagging."""

    teacher_instruction: str
    explanation: str
    example: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ConversationQuestion:
    number: int
    question: str
    answer_scaffold: Optional[str] = None  # sentence starter / options; None for Advanced

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ConversationGroup:
    """One subtopic cluster of questions (e.g. all FOOD questions).
    Maps loosely to one slide, but pagination.py may still split a large
    group across more than one slide."""

    subtopic: Optional[str]
    questions: list[ConversationQuestion] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"subtopic": self.subtopic, "questions": [q.to_dict() for q in self.questions]}


@dataclass
class GameQuestion:
    prompt: str
    options: list[str] = field(default_factory=list)  # exactly 3, a/b/c
    correct_answer: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MaterialInfo:
    activity: str = "Powerpoint Activity"
    duration_minutes: int = 20

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class LessonContent:
    language: Language
    topic: str
    level: Level

    cover_title: str = ""
    cover_subtitle: str = ""

    material: MaterialInfo = field(default_factory=MaterialInfo)

    # Shared across all levels of the same topic — generate once, reuse.
    objectives: list[str] = field(default_factory=list)  # exactly 3
    vocabulary: list[VocabularyItem] = field(default_factory=list)

    grammar_aside: Optional[GrammarAside] = None  # optional, topic-dependent

    intro_title: str = ""
    intro_text: str = ""

    video_title: Optional[str] = None

    conversation_groups: list[ConversationGroup] = field(default_factory=list)

    # Present for Basic/Intermediate, empty for Advanced.
    language_game: list[GameQuestion] = field(default_factory=list)

    evaluation: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "language": self.language,
            "topic": self.topic,
            "level": self.level,
            "cover_title": self.cover_title,
            "cover_subtitle": self.cover_subtitle,
            "material": self.material.to_dict(),
            "objectives": self.objectives,
            "vocabulary": [v.to_dict() for v in self.vocabulary],
            "grammar_aside": self.grammar_aside.to_dict() if self.grammar_aside else None,
            "intro_title": self.intro_title,
            "intro_text": self.intro_text,
            "video_title": self.video_title,
            "conversation_groups": [g.to_dict() for g in self.conversation_groups],
            "language_game": [g.to_dict() for g in self.language_game],
            "evaluation": self.evaluation,
        }

    def all_questions(self) -> list[ConversationQuestion]:
        out: list[ConversationQuestion] = []
        for group in self.conversation_groups:
            out.extend(group.questions)
        return out


@dataclass
class SlidePlanItem:
    layout: str
    content_ref: dict

    def to_dict(self) -> dict:
        return {"layout": self.layout, "content_ref": self.content_ref}
