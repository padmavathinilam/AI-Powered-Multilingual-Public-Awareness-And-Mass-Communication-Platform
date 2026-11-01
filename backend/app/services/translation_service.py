
import hashlib
import os
import re
import secrets
from functools import lru_cache

from langdetect import DetectorFactory, detect, LangDetectException

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from sarvamai import SarvamAI


# Make language detection consistent between runs.
DetectorFactory.seed = 0


LANGUAGE_CODES = {
    "English": "en",
    "Hindi": "hi",
    "Kannada": "kn",
    "Tamil": "ta",
    "Telugu": "te",
    "Marathi": "mr",
    "Bengali": "bn",
    "Gujarati": "gu",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Urdu": "ur",
}

LANGUAGE_NAMES = {
    code: name for name, code in LANGUAGE_CODES.items()
}

# Sarvam API language codes.
SARVAM_LANGUAGE_CODES = {
    "en": "en-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "ur": "ur-IN",
}


@lru_cache(maxsize=2000)
def _cached_translation(
    text: str,
    source_code: str,
    target_code: str,
) -> str:
    return _translate_uncached(text, source_code, target_code)


def make_cache_key(
    text: str,
    source: str,
    target: str,
) -> str:
    """Create a stable cache key for a translation request."""
    value = f"{source.lower()}|{target.lower()}|{text}"
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


# Protect values that must not be translated.
PROTECTED_PATTERNS = [
    # Template placeholders: {{name}}, {name}, {user_id}
    r"\{\{.*?\}\}",
    r"\{[a-zA-Z_][a-zA-Z0-9_.-]*\}",

    # URLs and email addresses
    r"https?://[^\s<>]+",
    r"www\.[^\s<>]+",
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",

    # Dates
    r"\b\d{4}-\d{1,2}-\d{1,2}\b",
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",

    # Times
    r"\b\d{1,2}:\d{2}(?:\s?[APap][Mm])?\b",

    # Currency amounts
    r"(?:₹|â‚¹|Rs\.?|INR)\s?\d+(?:,\d{3})*(?:\.\d+)?",

    # Percentages
    r"\b\d+(?:\.\d+)?%",

    # Numbers
    r"\b\d+(?:,\d{3})*(?:\.\d+)?\b",
]

PROTECTED_PATTERN = re.compile(
    "|".join(f"(?:{pattern})" for pattern in PROTECTED_PATTERNS)
)


def protect_content(text: str):
    """Replace protected values with temporary tokens."""
    replacements = {}
    unique_id = secrets.token_hex(4).upper()

    def replace(match):
        token = f"ZXQ{unique_id}P{len(replacements):04d}QXZ"
        replacements[token] = match.group(0)
        return token

    protected_text = PROTECTED_PATTERN.sub(replace, text)

    return protected_text, replacements


def restore_content(text: str, replacements: dict) -> str:
    """Restore the original protected values."""
    for token, original in replacements.items():
        text = re.sub(
            re.escape(token),
            lambda _: original,
            text,
            flags=re.IGNORECASE,
        )

    remaining_tokens = re.findall(
        r"ZXQ[0-9A-F]+P\d{4}QXZ",
        text,
        flags=re.IGNORECASE,
    )

    if remaining_tokens:
        raise ValueError(
            "The translation engine changed a protected token. "
            "Please retry the translation."
        )

    return text


def _get_sarvam_client():
    """Create a Sarvam client using the configured API key."""
    api_key = os.getenv("SARVAM_API_KEY")

    if not api_key or not api_key.strip():
        raise RuntimeError(
            "SARVAM_API_KEY is not configured. "
            "Set it in your environment or backend .env file."
        )

    return SarvamAI(
        api_subscription_key=api_key.strip()
    )


def _translate_with_sarvam(
    text: str,
    source_code: str,
    target_code: str,
) -> str:
    """Translate text through Sarvam AI."""
    client = _get_sarvam_client()

    source_language = SARVAM_LANGUAGE_CODES[source_code]
    target_language = SARVAM_LANGUAGE_CODES[target_code]

    response = client.text.translate(
        input=text,
        source_language_code=source_language,
        target_language_code=target_language,
        model="sarvam-translate:v1",
    )

    translated = getattr(response, "translated_text", None)

    if not isinstance(translated, str) or not translated.strip():
        raise RuntimeError(
            "Sarvam returned an empty translation."
        )

    return translated


def _translate_uncached(
    text: str,
    source_code: str,
    target_code: str,
) -> str:
    """Translate using Sarvam AI and restore protected content."""
    protected_text, replacements = protect_content(text)

    translated = _translate_with_sarvam(
        protected_text,
        source_code,
        target_code,
    )

    return restore_content(translated, replacements)


def translate_text(
    text: str,
    source_language: str,
    target_language: str,
) -> str:
    """
    Translate text using Sarvam AI.

    Accepts language names such as 'English' and 'Kannada',
    or their supported two-letter language codes.
    """
    if not isinstance(text, str):
        raise ValueError("Text must be a string.")

    if not text.strip():
        return text

    source_code = LANGUAGE_CODES.get(
        source_language,
        source_language.lower()
        if isinstance(source_language, str)
        else "",
    )

    target_code = LANGUAGE_CODES.get(
        target_language,
        target_language.lower()
        if isinstance(target_language, str)
        else "",
    )

    if source_code not in LANGUAGE_NAMES:
        raise ValueError(
            f"Unsupported source language: {source_language}"
        )

    if target_code not in LANGUAGE_NAMES:
        raise ValueError(
            f"Unsupported target language: {target_language}"
        )

    if source_code == target_code:
        return text

    return _cached_translation(
        text,
        source_code,
        target_code,
    )


def clear_translation_cache():
    """Clear cached translations when needed."""
    _cached_translation.cache_clear()


def detect_language(text: str) -> dict:
    """Detect the language of input text."""
    if not isinstance(text, str) or not text.strip():
        raise ValueError(
            "Provide non-empty text for language detection."
        )

    try:
        detected_code = detect(text)
    except LangDetectException as exc:
        raise ValueError(
            "Unable to detect the language. Please enter more text."
        ) from exc

    language_name = LANGUAGE_NAMES.get(detected_code)

    if not language_name:
        raise ValueError(
            f"The detected language code '{detected_code}' "
            "is not supported by this application."
        )

    return {
        "language": language_name,
        "language_code": detected_code,
    }
