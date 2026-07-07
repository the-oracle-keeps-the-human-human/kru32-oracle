# GPT-5.4 Prompting for Codex

## Core Philosophy

Prompt Codex like an **operator**, not a collaborator. Establish explicit contracts about what done looks like, output shape, and follow-through behavior.

## Fundamental Rules

1. One clear task per Codex run
2. Tell Codex what done looks like
3. Add explicit grounding and verification rules
4. Prefer better prompt contracts over raising reasoning
5. Use XML tags consistently for stable structure

## Default Prompt Recipe

Every prompt should contain:
1. `<task>` -- Concrete job and context
2. `<structured_output_contract>` or `<compact_output_contract>` -- Output shape
3. `<default_follow_through_policy>` -- When to keep going vs stop

## Optional Blocks

- `<completeness_contract>` -- Don't stop at first answer
- `<verification_loop>` -- Checkpoint before finalizing
- `<missing_context_gating>` -- Don't guess missing facts
- `<grounding_rules>` -- Evidence-based reasoning
- `<action_safety>` -- Keep changes tightly scoped
- `<dig_deeper_nudge>` -- Check second-order failures
- `<research_mode>` -- Separate facts from inferences
- `<citation_rules>` -- Back claims with references

## Concrete Recipes

- **Diagnosis**: task + compact output + follow-through + verification + missing context
- **Narrow Fix**: task + structured output + completeness + verification + action safety
- **Root-Cause Review**: task + structured output + grounding + dig deeper + verification
- **Research**: task + structured output + research mode + citation rules

## Anti-Patterns

1. Vague task framing ("let me know what you think")
2. Missing output contract
3. No follow-through default
4. Asking for more reasoning instead of better contracts
5. Mixing unrelated jobs into one run
6. Unsupported certainty demands
7. Long natural-language over structural blocks

## Key Insight

Better prompt contracts beat reasoning appeals. Use structured blocks to guide Codex toward correct answers. Tighten the contract before asking Codex to "think harder."
