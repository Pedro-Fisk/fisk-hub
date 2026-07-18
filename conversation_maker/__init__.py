"""
Conversation Maker — content generation module for language-teaching
conversation lessons. Content-only for now: given a language, topic,
level and optional grammar point, it returns structured lesson content
and an ordered slide plan. Slide design/export (pptx or Canva) is a
separate stage, not part of this module.

Public API:

    from conversation_maker import LessonRequest, run_request

    request = LessonRequest(
        language="english",
        topic="going shopping",
        level_choice="basic",       # basic | intermediate | advanced | all_levels
        grammar_point=None,          # e.g. "past simple", or None for no Grammar Point slide
    )
    outputs = run_request(request)   # 1 output, or 3 if level_choice == "all_levels"
    for output in outputs:
        output.to_dict()             # {"content": {...}, "slides": [...]}

Currently `generate_lesson` (in generator.py) calls a local mock — no
Claude API key required yet. Once console.anthropic.com billing is set
up, only generator.py needs to change; models.py, level_rules.py,
pagination.py and workflow.py are stable regardless of where content
comes from.
"""

from .generator import build_user_prompt, generate_lesson, SYSTEM_PROMPT
from .models import (
    ConversationGroup,
    ConversationQuestion,
    GameQuestion,
    GrammarAside,
    LessonContent,
    MaterialInfo,
    SlidePlanItem,
    VocabularyItem,
)
from .pagination import build_slide_plan
from .workflow import LessonRequest, LessonOutput, run_request

__all__ = [
    "LessonRequest",
    "LessonOutput",
    "run_request",
    "generate_lesson",
    "build_user_prompt",
    "SYSTEM_PROMPT",
    "build_slide_plan",
    "LessonContent",
    "VocabularyItem",
    "ConversationGroup",
    "ConversationQuestion",
    "GameQuestion",
    "GrammarAside",
    "MaterialInfo",
    "SlidePlanItem",
]
