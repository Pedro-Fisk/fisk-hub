"""
Slide pagination — v2.

Real decks group conversation questions by subtopic (one slide per group,
splitting only if the group is too big for the level's per-slide cap) and
show 3 vocabulary words per slide. Never shrink fonts to fit; split into
more slides instead.
"""

from .level_rules import (
    GAME_QUESTIONS_PER_SLIDE,
    LEVEL_CONFIGS,
    VOCABULARY_WORDS_PER_SLIDE,
)
from .models import ConversationGroup, LessonContent, SlidePlanItem


def _chunk(items: list, size: int) -> list[list]:
    return [items[i : i + size] for i in range(0, len(items), size)] or [[]]


def paginate_vocabulary(vocabulary: list) -> list[SlidePlanItem]:
    return [
        SlidePlanItem(layout="Vocabulary", content_ref={"words": [w.to_dict() for w in chunk]})
        for chunk in _chunk(vocabulary, VOCABULARY_WORDS_PER_SLIDE)
        if chunk
    ]


def paginate_conversation(groups: list[ConversationGroup], level: str) -> list[SlidePlanItem]:
    max_per_slide = LEVEL_CONFIGS[level].max_questions_per_slide
    slides: list[SlidePlanItem] = []

    for group in groups:
        for chunk in _chunk(group.questions, max_per_slide):
            if not chunk:
                continue
            slides.append(
                SlidePlanItem(
                    layout="Conversation",
                    content_ref={
                        "subtopic": group.subtopic,
                        "questions": [q.to_dict() for q in chunk],
                    },
                )
            )

    return slides


def paginate_language_game(game_questions: list) -> list[SlidePlanItem]:
    return [
        SlidePlanItem(layout="Language Game", content_ref={"questions": [q.to_dict() for q in chunk]})
        for chunk in _chunk(game_questions, GAME_QUESTIONS_PER_SLIDE)
        if chunk
    ]


def build_slide_plan(lesson: LessonContent) -> list[SlidePlanItem]:
    """Fixed section order (confirmed with Pedro): Cover, Material Needed,
    Objectives, Vocabulary, [Grammar Point if requested], Introduction,
    [Video if provided], Conversation, [Language Game if the level has one],
    Evaluation, Closing."""

    plan: list[SlidePlanItem] = []

    plan.append(SlidePlanItem(
        layout="Cover",
        content_ref={"title": lesson.cover_title, "subtitle": lesson.cover_subtitle},
    ))

    plan.append(SlidePlanItem(
        layout="Material Needed",
        content_ref=lesson.material.to_dict(),
    ))

    plan.append(SlidePlanItem(
        layout="Objectives",
        content_ref={"objectives": lesson.objectives},
    ))

    plan.extend(paginate_vocabulary(lesson.vocabulary))

    if lesson.grammar_aside is not None:
        plan.append(SlidePlanItem(
            layout="Grammar Point",
            content_ref=lesson.grammar_aside.to_dict(),
        ))

    plan.append(SlidePlanItem(
        layout="Introduction Title",
        content_ref={"title": lesson.intro_title},
    ))
    plan.append(SlidePlanItem(
        layout="Introduction Text",
        content_ref={"text": lesson.intro_text},
    ))

    if lesson.video_title:
        plan.append(SlidePlanItem(layout="Video", content_ref={"title": lesson.video_title}))

    plan.extend(paginate_conversation(lesson.conversation_groups, lesson.level))

    if lesson.language_game:
        plan.extend(paginate_language_game(lesson.language_game))

    plan.append(SlidePlanItem(
        layout="Evaluation",
        content_ref={"questions": lesson.evaluation},
    ))

    plan.append(SlidePlanItem(
        layout="Closing",
        content_ref={"title": lesson.cover_title},
    ))

    return plan
