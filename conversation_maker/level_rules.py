"""
Level rules — v2, calibrated against 15 real production decks (not the
docx spec's abstract numbers). See models.py docstring for the sourcing.

ASSUMPTIONS still open for Pedro to confirm:
  - Intermediate question count (6-9) is an estimate; the one Japan
    example had 9, the Vacation example had the same 6 as Basic. Real
    decks are not fully consistent with each other here.
  - Spanish B1 mirrors Basic/Intermediate style (scaffolding + game)
    since the spec just says "single communicative version" and no
    Spanish example deck was provided yet.
  - Max questions per slide by level (basic/intermediate=2, advanced=4)
    is inferred from the examples, not a documented rule. Real decks
    ranged 1-4 depending on how much text a scaffold needed.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class LevelConfig:
    min_questions: int
    max_questions: int
    include_scaffold: bool       # sentence-starter / fill-in-the-blank support
    include_language_game: bool  # multiple-choice quiz section
    max_questions_per_slide: int
    description: str


LEVEL_CONFIGS: dict[str, LevelConfig] = {
    "basic": LevelConfig(
        min_questions=6,
        max_questions=8,
        include_scaffold=True,
        include_language_game=True,
        max_questions_per_slide=2,
        description="Scaffolded questions (sentence starters / answer options).",
    ),
    "intermediate": LevelConfig(
        min_questions=6,
        max_questions=9,
        include_scaffold=True,
        include_language_game=True,
        max_questions_per_slide=2,
        description="Same scaffolding style as Basic, slightly more questions.",
    ),
    "advanced": LevelConfig(
        min_questions=10,
        max_questions=12,
        include_scaffold=False,
        include_language_game=False,
        max_questions_per_slide=4,
        description="Fully open questions, no scaffolding, no language game.",
    ),
    "spanish_b1": LevelConfig(
        min_questions=6,
        max_questions=8,
        include_scaffold=True,
        include_language_game=True,
        max_questions_per_slide=2,
        description="Single communicative version, Basic/Intermediate style.",
    ),
}

# Fixed slide order (Pedro confirmed: always fixed, never decided per topic).
# Grammar Point is included only when the teacher explicitly asks for one in
# the form (LessonRequest.grammar_point) — never auto-decided by the model.
# Language Game is included only for levels where LEVEL_CONFIGS[level].include_language_game
# is True. Introduction and Evaluation are always present.
MASTER_LAYOUTS_ORDER = [
    "Cover",
    "Material Needed",
    "Objectives",
    "Vocabulary",
    "Grammar Point",       # optional — only if teacher requested a grammar point
    "Introduction Title",
    "Introduction Text",
    "Video",                # optional — only if teacher supplied a video link
    "Conversation",
    "Language Game",        # optional — only for Basic/Intermediate
    "Evaluation",
    "Closing",
]

DEFAULT_DURATION_MINUTES = 20
VOCABULARY_WORDS_PER_SLIDE = 3
GAME_QUESTIONS_PER_SLIDE = 1
