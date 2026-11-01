
import os
import logging
import asyncio
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv

from app.ai_service.prompts import build_prompt

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = (
    os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    .strip()
    .removeprefix("models/")
)

SMS_MAX_CHARS = 160
MAX_ATTEMPTS = 3


def count_words(text: str) -> int:
    """Count whitespace-separated words."""
    return len(re.findall(r"\S+", text.strip()))


def clean_content(text: str) -> str:
    """Remove Markdown code fences and unnecessary whitespace."""
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def limit_sms(text: str, max_chars: int = SMS_MAX_CHARS) -> str:
    """Keep SMS within the character limit."""
    text = clean_content(text)

    if len(text) <= max_chars:
        return text

    sentences = re.split(r"(?<=[.!?।])\s+", text)
    result = ""

    for sentence in sentences:
        candidate = (result + " " + sentence).strip()

        if len(candidate) <= max_chars:
            result = candidate
        elif not result:
            for word in sentence.split():
                candidate = (result + " " + word).strip()

                if len(candidate) > max_chars:
                    break

                result = candidate

            break
        else:
            break

    if result:
        return result

    return text[:max_chars]


async def generate_campaign_content(
    topic: str,
    audience: str,
    language: str,
    content_type: str,
    tone: str,
    word_limit: int,
    key_points: str = "",
    campaign_type: str = "Awareness",
) -> str:
    """Generate campaign content using Gemini and campaign templates."""

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from backend/.env"
        )

    if not isinstance(word_limit, int) or isinstance(word_limit, bool):
        raise RuntimeError("Word limit must be an integer.")

    if not 20 <= word_limit <= 500:
        raise RuntimeError("Word limit must be between 20 and 500.")

    if not all(
        isinstance(value, str) and value.strip()
        for value in (
            topic,
            audience,
            language,
            content_type,
            tone,
            campaign_type,
        )
    ):
        raise RuntimeError(
            "All required content fields must be provided."
        )

    if not isinstance(key_points, str):
        raise RuntimeError("Key points must be text.")

    if len(key_points) > 2000:
        raise RuntimeError(
            "Key points must not exceed 2000 characters."
        )

    channel = content_type.strip().lower()
    is_sms = channel == "sms"

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/{GEMINI_MODEL}:generateContent"
    )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    timeout = httpx.Timeout(
        connect=15.0,
        read=90.0,
        write=30.0,
        pool=15.0,
    )

    best_content = ""

    # Convert newline-separated key points into a list.
    points = [
        point.strip()
        for point in key_points.splitlines()
        if point.strip()
    ]

    # Build the prompt once from prompts.py.
    prompt = build_prompt(
        campaign_type=campaign_type,
        topic=topic,
        audience=audience,
        tone=tone,
        language=language,
        channel=content_type,
        length=(
            "SMS short"
            if is_sms
            else f"{word_limit} words"
        ),
        key_points=points,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(MAX_ATTEMPTS):
            current_prompt = prompt

            if attempt > 0:
                current_prompt += """
RETRY REQUIREMENTS:
- Correct any previous length or formatting problem.
- Preserve the most important information.
- Follow the requested campaign template and channel limits.
- Return only the finished message.
"""

            payload = {
                "contents": [
                    {"parts": [{"text": current_prompt}]}
                ],
                "generationConfig": {
                    "temperature": 0.3 if is_sms else 0.4,
                    "maxOutputTokens": 1024,
                },
            }

            try:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                )

            except httpx.TimeoutException as exc:
                logger.warning(
                    "Gemini timeout on attempt %s/%s",
                    attempt + 1,
                    MAX_ATTEMPTS,
                )

                if attempt < MAX_ATTEMPTS - 1:
                    await asyncio.sleep(2 * (attempt + 1))
                    continue

                raise RuntimeError(
                    "Gemini timed out. Please try again."
                ) from exc

            except httpx.RequestError as exc:
                logger.warning(
                    "Gemini connection failed on attempt %s/%s",
                    attempt + 1,
                    MAX_ATTEMPTS,
                )

                if attempt < MAX_ATTEMPTS - 1:
                    await asyncio.sleep(2 * (attempt + 1))
                    continue

                raise RuntimeError(
                    "Could not connect to Gemini. Check your internet."
                ) from exc

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    details = error_data.get(
                        "error", {}
                    ).get("message", response.text)
                except ValueError:
                    details = response.text

                logger.error(
                    "Gemini HTTP %s: %s",
                    response.status_code,
                    details,
                )

                if response.status_code in (401, 403):
                    raise RuntimeError(
                        "Gemini authentication failed. Check API settings."
                    )

                if response.status_code == 404:
                    raise RuntimeError(
                        f"Gemini model '{GEMINI_MODEL}' is unavailable."
                    )

                if response.status_code == 429:
                    raise RuntimeError(
                        "Gemini rate limit or quota reached. Try again later."
                    )

                if response.status_code in (500, 502, 503, 504):
                    if attempt < MAX_ATTEMPTS - 1:
                        await asyncio.sleep(2 * (attempt + 1))
                        continue

                    raise RuntimeError(
                        "Gemini is temporarily unavailable. Try again later."
                    )

                raise RuntimeError(
                    f"Gemini request failed with HTTP {response.status_code}."
                )

            try:
                data = response.json()
                candidates = data.get("candidates", [])

                parts = (
                    candidates[0]
                    .get("content", {})
                    .get("parts", [])
                    if candidates
                    else []
                )

                generated_text = clean_content(
                    "\n".join(
                        part["text"]
                        for part in parts
                        if isinstance(part.get("text"), str)
                    )
                )

            except (
                ValueError,
                IndexError,
                AttributeError,
                TypeError,
            ):
                generated_text = ""

            if not generated_text:
                logger.warning("Gemini returned empty content.")

                if attempt < MAX_ATTEMPTS - 1:
                    await asyncio.sleep(1)
                    continue

                raise RuntimeError(
                    "Gemini returned empty content. Please try again."
                )

            actual_words = count_words(generated_text)
            actual_chars = len(generated_text)

            logger.info(
                "Attempt %s/%s: words=%s, chars=%s, SMS=%s",
                attempt + 1,
                MAX_ATTEMPTS,
                actual_words,
                actual_chars,
                is_sms,
            )

            if is_sms and actual_chars <= SMS_MAX_CHARS:
                return generated_text

            if not is_sms and actual_words <= word_limit:
                return generated_text

            # Retain the shortest oversized response as a fallback.
            if (
                not best_content
                or (
                    is_sms
                    and len(generated_text) < len(best_content)
                )
                or (
                    not is_sms
                    and actual_words < count_words(best_content)
                )
            ):
                best_content = generated_text

            if attempt < MAX_ATTEMPTS - 1:
                await asyncio.sleep(1)

    # Final safeguard for SMS.
    if is_sms and best_content:
        safe_content = limit_sms(best_content, SMS_MAX_CHARS)

        if safe_content and len(safe_content) <= SMS_MAX_CHARS:
            return safe_content

        raise RuntimeError(
            "Could not create an SMS within 160 characters. Please retry."
        )

    # Preserve the word limit for other channels.
    if best_content:
        words = best_content.split()
        safe_content = " ".join(words[:word_limit]).strip()

        if safe_content:
            return safe_content

    raise RuntimeError(
        "Unable to generate content. Please try again."
    )
async def improve_campaign_tone(
    content: str,
    target_tone: str,
) -> str:
    """Rewrite campaign content using the requested tone."""

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from backend/.env"
        )

    allowed_tones = {
        "Friendly",
        "Formal",
        "Persuasive",
        "Informative",
        "Urgent",
    }

    if target_tone not in allowed_tones:
        raise ValueError("Unsupported target tone.")

    content = content.strip()

    if not content:
        raise ValueError("Content cannot be empty.")

    prompt = f"""
You are an expert public-awareness campaign editor.

Rewrite the following content in a {target_tone} tone.

Requirements:
- Preserve the original meaning and important facts.
- Do not invent facts, statistics, or contact information.
- Use clear and accessible language.
- Preserve the original language.
- Return only the rewritten content.

Original content:
{content}
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/{GEMINI_MODEL}:generateContent"
    )

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048,
        },
    }

    timeout = httpx.Timeout(
        connect=15.0,
        read=90.0,
        write=30.0,
        pool=15.0,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            url,
            headers=headers,
            json=payload,
        )

    if response.is_error:
        logger.error(
            "Gemini tone improvement failed: status=%s body=%s",
            response.status_code,
            response.text[:500],
        )
        raise RuntimeError(
            "The AI service could not improve the content."
        )

    data = response.json()

    try:
        improved_content = (
            data["candidates"][0]["content"]["parts"][0]["text"]
        )
    except (KeyError, IndexError, TypeError) as exc:
        logger.error(
            "Gemini returned an unexpected response."
        )
        raise RuntimeError(
            "The AI service returned an invalid response."
        ) from exc

    improved_content = clean_content(improved_content)

    if not improved_content:
        raise RuntimeError(
            "The AI service returned empty content."
        )

    return improved_content
