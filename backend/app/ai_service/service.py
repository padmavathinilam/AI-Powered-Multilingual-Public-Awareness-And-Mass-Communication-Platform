
import os
import logging
import asyncio
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = (
    os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    .strip()
    .removeprefix("models/")
)


def count_words(text: str) -> int:
    """Count whitespace-separated words."""
    return len(re.findall(r"\S+", text.strip()))


def clean_content(text: str) -> str:
    """Remove common Markdown wrappers from generated content."""
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def generate_campaign_content(
    topic: str,
    audience: str,
    language: str,
    content_type: str,
    tone: str,
    word_limit: int,
) -> str:

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from backend/.env"
        )

    if not 1 <= word_limit <= 2000:
        raise RuntimeError(
            "Word limit must be between 1 and 2000."
        )

    is_sms = content_type.strip().lower() == "sms"

    prompt = f"""
You are a professional public-awareness content writer for AI PublicConnect.

Create a complete, ready-to-publish public-awareness message.

Topic: {topic}
Target audience: {audience}
Required language: {language}
Content type: {content_type}
Tone: {tone}
Maximum requested length: {word_limit} words.

Requirements:
1. Write entirely in {language}, using its appropriate script.
2. Keep the message within the requested word limit.
3. Include a clear opening, useful information, practical advice,
   and a conclusion when appropriate for the content type.
4. Use simple, natural, culturally appropriate language.
5. Avoid repetition and unnecessary headings.
6. Never invent statistics, government schemes, dates, or contact details.
7. For health topics, provide general awareness rather than a diagnosis.
8. For SMS content, write a concise message suitable for a text message.
9. Complete every sentence.
10. Return only the finished content.
"""

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
    best_word_count = 0

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(3):
            current_prompt = prompt

            if attempt > 0:
                current_prompt += f"""

Improve the previous attempt. Return a complete, useful message
in {language}, within {word_limit} words. Avoid repetition.
Do not include an explanation or mention these instructions.
"""

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": current_prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 4096,
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
                    "Gemini timeout on attempt %s/3",
                    attempt + 1,
                )

                if best_content:
                    return best_content

                if attempt < 2:
                    await asyncio.sleep(2)
                    continue

                raise RuntimeError(
                    "Gemini timed out. Please try again."
                ) from exc

            except httpx.RequestError as exc:
                logger.exception("Gemini connection failed")

                if best_content:
                    return best_content

                raise RuntimeError(
                    "Could not connect to Gemini. "
                    "Check your internet connection."
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
                        "Gemini authentication failed. "
                        "Check API settings."
                    )

                if response.status_code == 404:
                    raise RuntimeError(
                        f"Gemini model '{GEMINI_MODEL}' is unavailable. "
                        "Check the model name and API availability."
                    )

                if response.status_code == 429:
                    raise RuntimeError(
                        "Gemini rate limit or quota reached. "
                        "Please try again later."
                    )

                if response.status_code in (500, 502, 503, 504):
                    if best_content:
                        return best_content

                    if attempt < 2:
                        await asyncio.sleep(2 * (attempt + 1))
                        continue

                    raise RuntimeError(
                        "Gemini is temporarily unavailable. "
                        "Please try again later."
                    )

                raise RuntimeError(
                    f"Gemini request failed with HTTP "
                    f"{response.status_code}: {details}"
                )

            try:
                data = response.json()
            except ValueError as exc:
                logger.error("Gemini returned invalid JSON")

                if attempt < 2:
                    await asyncio.sleep(1)
                    continue

                if best_content:
                    return best_content

                raise RuntimeError(
                    "Gemini returned an invalid response."
                ) from exc

            candidates = data.get("candidates", [])

            if not candidates:
                logger.warning("Gemini returned no candidates")

                if attempt < 2:
                    await asyncio.sleep(1)
                    continue

                if best_content:
                    return best_content

                raise RuntimeError(
                    "Gemini returned no content. Please try again."
                )

            candidate = candidates[0]
            finish_reason = candidate.get("finishReason", "")
            parts = candidate.get("content", {}).get("parts", [])

            generated_text = clean_content(
                "\n".join(
                    part["text"]
                    for part in parts
                    if isinstance(part.get("text"), str)
                )
            )

            if not generated_text:
                logger.warning("Gemini returned empty content")

                if attempt < 2:
                    await asyncio.sleep(1)
                    continue

                if best_content:
                    return best_content

                raise RuntimeError(
                    "Gemini returned empty content."
                )

            actual_words = count_words(generated_text)

            # Keep the longest usable response from all attempts.
            if actual_words > best_word_count:
                best_content = generated_text
                best_word_count = actual_words

            logger.info(
                "Attempt %s/3: words=%s, requested_limit=%s, "
                "finish_reason=%s",
                attempt + 1,
                actual_words,
                word_limit,
                finish_reason,
            )

            # Do not return an output that clearly exceeds the limit.
            if actual_words > word_limit:
                shortened_prompt = f"""
Rewrite this message in {language}, preserving its main information.
The maximum length is {word_limit} words.
Return only the rewritten message.

Message:
{generated_text}
"""
                prompt = shortened_prompt
                if attempt < 2:
                    await asyncio.sleep(1)
                    continue

            # For short content types, even a few words may be sufficient.
            minimum_words = min(
                word_limit,
                8 if is_sms else max(15, int(word_limit * 0.75)),
            )

            if (
                actual_words >= minimum_words
                and finish_reason != "MAX_TOKENS"
                and actual_words <= word_limit
            ):
                return generated_text

            if attempt < 2:
                logger.warning(
                    "Retrying incomplete or short response."
                )
                await asyncio.sleep(1)

    if best_content:
        logger.warning(
            "Returning best available response: %s words "
            "for a requested maximum of %s.",
            best_word_count,
            word_limit,
        )
        return best_content

    raise RuntimeError(
        "Unable to generate content. Please try again."
    )
