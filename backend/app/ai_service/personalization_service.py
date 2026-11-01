import re

from app.ai_service.service import (
    clean_content,
    generate_campaign_content,
    limit_sms,
)


def fill_placeholders(message: str, recipient: dict) -> str:
    """Replace supported placeholders in a message."""

    values = {
        "name": recipient.get("name") or "there",
        "age": recipient.get("age") or "",
        "occupation": recipient.get("occupation") or "",
        "city": recipient.get("city") or "",
        "role": recipient.get("role") or "",
        "language": recipient.get("language") or "English",
        "segment": recipient.get("segment") or "",
    }

    def replace_match(match):
        key = match.group(1).strip().lower()

        if key in values:
            return str(values[key])

        return match.group(0)

    return re.sub(r"\{([a-zA-Z_]+)\}", replace_match, message)


def has_complete_ending(message: str) -> bool:
    """
    Check that the message contains actual text.

    Do not reject content merely because it lacks final punctuation.
    """

    if not message:
        return False

    return bool(message.strip())


async def create_ai_variant(
    base_message: str,
    segment: str,
    language: str = "English",
    channel: str = "WhatsApp",
    tone: str = "Informative",
    word_limit: int = 150,
    key_points: str = "",
) -> str:
    """
    Generate a personalized campaign message.

    Retries once if generation fails or returns an empty message.
    """

    if not base_message or not base_message.strip():
        raise ValueError("Base message cannot be empty.")

    if not segment or not segment.strip():
        raise ValueError("Audience segment cannot be empty.")

    if word_limit < 1:
        raise ValueError("Word limit must be greater than zero.")

    audience = segment.strip()
    requested_language = language or "English"
    requested_channel = channel or "WhatsApp"
    requested_tone = tone or "Informative"

    topic = f"""
Personalize the following public-awareness message.

TARGET AUDIENCE:
{audience}

LANGUAGE:
{requested_language}

CHANNEL:
{requested_channel}

TONE:
{requested_tone}

MAXIMUM WORD COUNT:
{word_limit}

KEY POINTS:
{key_points or "Preserve all important facts from the original message."}

ORIGINAL MESSAGE:
{base_message}

REQUIREMENTS:
1. Return only the final personalized message.
2. Write a complete, meaningful message.
3. Never stop in the middle of a sentence.
4. Adapt the language to the target audience.
5. Preserve important facts and safety instructions.
6. Do not invent medical facts or unsupported claims.
7. Use clear, simple language.
8. Follow the requested language and tone.
9. Keep the message within the word limit.
10. Avoid unnecessary exclamation marks.
11. Do not include explanations about the rewriting process.
12. Do not return an empty response.
13. Preserve all important public-health instructions.
"""

    last_error = None

    for attempt in range(2):
        try:
            generated = await generate_campaign_content(
                topic=topic,
                audience=audience,
                language=requested_language,
                content_type=requested_channel,
                tone=requested_tone,
                word_limit=word_limit,
                key_points=key_points,
                campaign_type="Awareness",
            )

            if not generated or not generated.strip():
                raise ValueError(
                    "The AI returned an empty personalized message."
                )

            result = clean_content(generated).strip()

            if not has_complete_ending(result):
                raise ValueError(
                    "The AI returned an empty personalized message."
                )

            if requested_channel.strip().lower() == "sms":
                result = limit_sms(result)

            if not result or not result.strip():
                raise ValueError(
                    "The final personalized message is empty."
                )

            return result.strip()

        except Exception as exc:
            last_error = exc

            if attempt == 0:
                continue

    raise ValueError(
        f"Personalization failed for '{audience}' after two attempts. "
        f"Last error: {last_error}"
    )