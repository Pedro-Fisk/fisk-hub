"""
Content generation interface — v2.

Two halves, same design as v1:

1. Prompt templates, now encoding the REAL structure (subtopic-grouped
   questions, scaffolding on Basic/Intermediate only, optional grammar
   point supplied by the teacher — never invented by the model).
2. generate_lesson() — calls _mock_generate() for now (no API key yet).
   Swap for a real Anthropic Messages API call later; nothing else in
   the project needs to change.

grammar_point: the teacher explicitly opts in via the form. If they leave
it blank, no Grammar Point slide is generated — the model must NOT invent
a grammar point on its own.
"""

from __future__ import annotations

from .level_rules import DEFAULT_DURATION_MINUTES, LEVEL_CONFIGS
from .models import (
    ConversationGroup,
    ConversationQuestion,
    GameQuestion,
    GrammarAside,
    LessonContent,
    MaterialInfo,
    VocabularyItem,
)

SYSTEM_PROMPT = """You are the content engine behind Conversation Maker, an \
authoring tool for language teachers. You generate ONLY slide content as \
structured JSON — you never design or lay out slides, that is handled by a \
fixed PowerPoint/Canva template downstream.

Structure to fill, in this fixed order: Cover, Material Needed, Objectives \
(exactly 3, describing the lesson regardless of level), Vocabulary \
(word list, with Portuguese translations for Basic/Intermediate, without \
translations for Advanced), an OPTIONAL Grammar Point block (INCLUDE IT \
ONLY IF the teacher explicitly supplied a grammar_point in the request — \
never invent one yourself), Introduction (title + short paragraph), an \
OPTIONAL video, Conversation (questions grouped by subtopic, e.g. FOOD, \
SHOPPING, TRAVEL), an OPTIONAL Language Game (multiple-choice quiz, only \
for Basic/Intermediate), and Evaluation (1-3 reflection questions).

Level behavior:
- Basic and Intermediate: every conversation question includes a short \
answer_scaffold (a sentence starter or 2-3 answer options), and a \
Language Game section is included.
- Advanced: conversation questions are fully open, no answer_scaffold, \
no Language Game, and roughly 10-12 questions with more depth/critical \
thinking than Basic/Intermediate's 6-9.

Respond with a single JSON object only, no prose, matching the schema \
described in the user message."""


def build_user_prompt(
    language: str, topic: str, level: str, grammar_point: str | None
) -> str:
    cfg = LEVEL_CONFIGS[level]
    grammar_line = (
        f"The teacher wants a Grammar Point block on: {grammar_point}."
        if grammar_point
        else "Do NOT include a Grammar Point block."
    )
    return f"""Language: {language}
Topic: {topic}
Level: {level} ({cfg.description})
{grammar_line}

Generate {cfg.min_questions}-{cfg.max_questions} conversation questions, \
grouped by subtopic. {"Include answer_scaffold for every question." if cfg.include_scaffold else "No answer_scaffold — open questions only."}
{"Include a Language Game (3-5 multiple-choice questions, a/b/c)." if cfg.include_language_game else "No Language Game for this level."}

Return JSON with keys: cover_title, cover_subtitle, material \
({{activity, duration_minutes}}), objectives (array of 3 strings), \
vocabulary (array of {{word, translation, contrast_with}}, translation/\
contrast_with null when not applicable), grammar_aside ({{teacher_instruction, \
explanation, example}} or null), intro_title, intro_text, video_title \
(string or null), conversation_groups (array of {{subtopic, questions: \
[{{number, question, answer_scaffold}}]}}), language_game (array of \
{{prompt, options (3 strings), correct_answer}}, [] if not applicable), \
evaluation (array of 1-3 reflection questions)."""


def _mock_generate(
    language: str, topic: str, level: str, grammar_point: str | None
) -> LessonContent:
    """Deterministic local stand-in so the pipeline runs without an API key."""

    cfg = LEVEL_CONFIGS[level]
    subtopics = ["Subtopic A", "Subtopic B", "Subtopic C"]
    n_questions = cfg.min_questions

    groups: list[ConversationGroup] = []
    per_group = max(1, n_questions // len(subtopics))
    counter = 1
    remaining = n_questions
    for i, subtopic in enumerate(subtopics):
        take = per_group if i < len(subtopics) - 1 else remaining
        questions = []
        for _ in range(take):
            questions.append(
                ConversationQuestion(
                    number=counter,
                    question=f"[MOCK] {level} question {counter} about {topic} ({subtopic})?",
                    answer_scaffold=(
                        f"[MOCK] I ... ({subtopic.lower()})" if cfg.include_scaffold else None
                    ),
                )
            )
            counter += 1
        remaining -= take
        groups.append(ConversationGroup(subtopic=subtopic, questions=questions))

    game = (
        [
            GameQuestion(
                prompt=f"[MOCK] Choose the correct option for {topic} #{i + 1}",
                options=["[MOCK] a", "[MOCK] b", "[MOCK] c"],
                correct_answer="[MOCK] a",
            )
            for i in range(3)
        ]
        if cfg.include_language_game
        else []
    )

    grammar_aside = (
        GrammarAside(
            teacher_instruction=f"[MOCK] Explain '{grammar_point}' on the whiteboard.",
            explanation=f"[MOCK] short explanation of {grammar_point}.",
            example=f"[MOCK] example sentence using {grammar_point}.",
        )
        if grammar_point
        else None
    )

    return LessonContent(
        language=language,
        topic=topic,
        level=level,
        cover_title=f"{topic.title()} — Conversation Lesson",
        cover_subtitle=f"{level.replace('_', ' ').title()} level",
        material=MaterialInfo(duration_minutes=DEFAULT_DURATION_MINUTES),
        objectives=[
            f"Talking about {topic}.",
            "Expanding vocabulary.",
            "Learning new expressions.",
        ],
        vocabulary=[
            VocabularyItem(
                word=f"[MOCK] word{i + 1}",
                translation=f"[MOCK] tradução{i + 1}" if cfg.include_scaffold else None,
            )
            for i in range(6)
        ],
        grammar_aside=grammar_aside,
        intro_title=f"[MOCK] Introducing {topic}",
        intro_text=f"[MOCK] Short intro paragraph about {topic} for a {level} class.",
        video_title=None,
        conversation_groups=groups,
        language_game=game,
        evaluation=[f"[MOCK] Did you enjoy talking about {topic}?"],
    )


def generate_lesson(
    language: str, topic: str, level: str, grammar_point: str | None = None
) -> LessonContent:
    """Public entry point used by workflow.py.

    TODO (once Claude API is configured): replace the body with a call to
    the Anthropic Messages API using SYSTEM_PROMPT as the system prompt and
    build_user_prompt(...) as the user message, then parse the JSON reply
    into a LessonContent instead of calling _mock_generate().

    Note: objectives and vocabulary should eventually be generated ONCE per
    topic and reused across all requested levels (see workflow.py), since
    real decks keep those identical across Basic/Intermediate/Advanced.
    """
    return _mock_generate(language, topic, level, grammar_point)
