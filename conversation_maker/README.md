# Conversation Maker — content generation prototype

Stage 1: the content-generation logic only, no UI, no Claude API call yet.

**v2** (current): built from 15 real production decks Pedro sent
(Countries/Japan x3 levels, Everyday Life/Vacation x3 levels, Chores,
Babies, Shopping), which turned out to diverge a lot from the original
`Conversation_Maker_Complete_Specification_for_Claude.docx`. Pedro
confirmed on 2026-07-18 that the real-deck pattern is the source of truth
going forward; the docx spec and the Canva design `TEMPLATE - CONVERSATION
MAKER` are visual/structural references only, not literal rules.

## What changed from v1 → v2

- Objectives (always 3) and the vocabulary list are shared across all
  levels of the same topic — generated once, reused. Only conversation
  depth changes per level.
- Basic and Intermediate both use answer scaffolding (sentence starters /
  fill-in-the-blank); Advanced drops it entirely for fully open questions.
- Conversation questions are grouped by subtopic (e.g. FOOD, SHOPPING),
  not chunked at a fixed "4 per slide" — group size varies by level
  (`max_questions_per_slide` in `level_rules.py`).
- Language Game (multiple-choice quiz) is generated for Basic/Intermediate,
  skipped for Advanced.
- Added: Material Needed slide (activity + duration), a Closing slide, and
  an **optional Grammar Point block**. The grammar point is a field the
  teacher fills in on the form (`LessonRequest.grammar_point`) — if left
  blank, no Grammar Point slide is generated. The model never invents one
  on its own.
- Section order is fixed and always the same (`level_rules.MASTER_LAYOUTS_ORDER`).

## Files

- `__init__.py` — public API of the package (`LessonRequest`, `run_request`, etc.).
- `models.py` — data schema (`LessonContent`, `VocabularyItem`,
  `ConversationGroup`, `GameQuestion`, `GrammarAside`, `MaterialInfo`).
- `level_rules.py` — question-count ranges, scaffold/game rules, and
  per-slide pagination caps per level. Several numbers are estimates
  from a small sample — flagged in the module docstring.
- `pagination.py` — turns a `LessonContent` into an ordered slide plan
  following the fixed section order.
- `workflow.py` — the wizard: language → topic → grammar point (optional)
  → level. "All Levels" always produces three separate decks, never one
  merged deck.
- `generator.py` — Claude prompt templates (system + user) plus a local
  mock generator so the pipeline runs without an API key. Swapping the
  mock for a real Anthropic API call is a one-function change (see the
  TODO in `generate_lesson`).
- `cli.py` — run the wizard from the terminal.

## Use it as a module

This folder is a Python package (`conversation_maker/`, with `__init__.py`).
Run everything from the directory that *contains* this folder (i.e. the
repo root):

```python
from conversation_maker import LessonRequest, run_request

request = LessonRequest(
    language="english",
    topic="going shopping",
    level_choice="basic",   # basic | intermediate | advanced | all_levels
    grammar_point=None,      # e.g. "past simple", or None for no Grammar Point slide
)
outputs = run_request(request)   # 1 output, or 3 if level_choice == "all_levels"
outputs[0].to_dict()             # {"content": {...}, "slides": [...]}
```

## Try it from the terminal

```bash
pip install -r requirements.txt        # only needed once generator.py calls the real API
python3 -m conversation_maker.cli --demo   # fixed demo cases, saves JSON to sample_output/
python3 -m conversation_maker.cli          # interactive mode, asks for topic/grammar point/level
```

## Open questions before Stage 2 (export to slides)

1. **Output format.** Final decks will be generated in two forms: native
   `.pptx` (python-pptx) and Canva (via autofill). Need to confirm the
   *same* `LessonContent` JSON feeds both exporters.
2. **Intermediate question count** (6-9) and **per-slide caps**
   (basic/intermediate=2, advanced=4) are inferred from a handful of
   examples — worth recalibrating against more decks if the pattern
   isn't consistent.
3. **Spanish B1** has no example deck yet — currently modeled after
   Basic/Intermediate (scaffolding + game). Confirm once a Spanish
   example is available.
