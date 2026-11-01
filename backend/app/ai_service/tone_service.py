import re


TONE_KEYWORDS = {
    "urgent": [
        "urgent",
        "immediately",
        "emergency",
        "now",
        "alert",
        "warning",
        "deadline",
        "act quickly",
    ],
    "friendly": [
        "welcome",
        "thank you",
        "please",
        "together",
        "help",
        "community",
        "support",
        "let us",
        "let's",
        "friends",
        "loved ones",
    ],
    "formal": [
        "therefore",
        "hereby",
        "regarding",
        "accordingly",
        "official",
        "authority",
        "department",
        "notice",
    ],
    "harsh": [
        "stupid",
        "foolish",
        "useless",
        "idiot",
        "shameful",
        "ridiculous",
    ],
}


POSITIVE_WORDS = {
    "good",
    "great",
    "healthy",
    "safe",
    "help",
    "support",
    "protect",
    "prevention",
    "care",
    "success",
    "positive",
    "together",
    "effective",
    "benefit",
    "improve",
    "happy",
    "thank",
    "welcome",
}


NEGATIVE_WORDS = {
    "bad",
    "danger",
    "dangerous",
    "harm",
    "harmful",
    "sick",
    "disease",
    "illness",
    "risk",
    "unsafe",
    "failure",
    "wrong",
    "threat",
    "death",
    "severe",
}


TRANSITIONS = {
    "however",
    "therefore",
    "furthermore",
    "moreover",
    "because",
    "although",
    "finally",
    "first",
    "second",
    "next",
    "then",
    "also",
    "instead",
    "consequently",
}


def _words(text: str) -> list:
    """Extract lowercase English word tokens."""

    return re.findall(r"\b[a-zA-Z]+\b", text.lower())


def _contains_phrase(text: str, phrase: str) -> bool:
    """Check for a keyword or phrase."""

    pattern = (
        r"(?<!\w)"
        + re.escape(phrase.lower())
        + r"(?!\w)"
    )

    return bool(re.search(pattern, text.lower()))


def _count_phrases(text: str, phrases: list) -> int:
    """Count configured phrases found in the text."""

    return sum(
        1
        for phrase in phrases
        if _contains_phrase(text, phrase)
    )


def _detect_tone(text: str) -> str:
    """Detect the dominant tone using keyword matching."""

    scores = {
        tone: _count_phrases(text, phrases)
        for tone, phrases in TONE_KEYWORDS.items()
    }

    priority = [
        "harsh",
        "urgent",
        "formal",
        "friendly",
    ]

    detected = "neutral"
    highest_score = 0

    for tone in priority:
        if scores[tone] > highest_score:
            highest_score = scores[tone]
            detected = tone

    return detected


def _calculate_sentiment(words: list) -> dict:
    """Calculate a simple word-based sentiment estimate."""

    if not words:
        return {
            "sentiment": "neutral",
            "sentiment_score": 50,
        }

    positive_count = sum(
        1 for word in words if word in POSITIVE_WORDS
    )

    negative_count = sum(
        1 for word in words if word in NEGATIVE_WORDS
    )

    total = positive_count + negative_count

    if total == 0:
        return {
            "sentiment": "neutral",
            "sentiment_score": 50,
        }

    score = round((positive_count / total) * 100)

    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "sentiment_score": score,
    }


def _calculate_readability(text: str, words: list) -> dict:
    """Estimate readability from sentence and word lengths."""

    word_count = len(words)

    if word_count == 0:
        return {
            "readability_score": 0,
            "readability_level": "Unknown",
        }

    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?।。！？]+", text)
        if sentence.strip()
    ]

    sentence_count = max(len(sentences), 1)

    average_sentence_length = word_count / sentence_count

    average_word_length = (
        sum(len(word) for word in words) / word_count
    )

    score = 100

    if average_sentence_length > 15:
        score -= min(
            30,
            int(average_sentence_length - 15) * 2,
        )

    if average_sentence_length > 25:
        score -= 15

    if average_word_length > 6:
        score -= min(
            20,
            int(average_word_length - 6) * 5,
        )

    score = max(0, min(100, score))

    if score >= 80:
        level = "Easy"
    elif score >= 60:
        level = "Moderate"
    else:
        level = "Difficult"

    return {
        "readability_score": score,
        "readability_level": level,
    }


def _calculate_clarity(text: str, words: list) -> int:
    """Estimate clarity using sentence length and transitions."""

    if not words:
        return 0

    score = 100

    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?।。！？]+", text)
        if sentence.strip()
    ]

    for sentence in sentences:
        if len(_words(sentence)) > 30:
            score -= 5

    transition_count = sum(
        1 for word in words if word in TRANSITIONS
    )

    if transition_count > max(5, len(sentences) * 2):
        score -= 5

    return max(0, min(100, score))


def _normalize_tone(tone: str) -> str:
    """Normalize supported tone names."""

    value = (tone or "Informative").strip().lower()

    aliases = {
        "informative": "informative",
        "information": "informative",
        "neutral": "neutral",
        "friendly": "friendly",
        "empathetic": "friendly",
        "persuasive": "friendly",
        "professional": "formal",
        "formal": "formal",
        "urgent": "urgent",
        "harsh": "harsh",
    }

    return aliases.get(value, value)


def _tone_matches(
    detected_tone: str,
    expected_tone: str,
) -> bool:
    """
    Determine whether the detected tone is acceptable.

    Informative public-awareness content may be neutral,
    friendly, or urgent.
    """

    expected = _normalize_tone(expected_tone)
    detected = _normalize_tone(detected_tone)

    if expected == "informative":
        return detected in {
            "informative",
            "neutral",
            "friendly",
            "urgent",
        }

    return detected == expected


def analyze_tone(
    text: str,
    expected_tone: str = "Informative",
) -> dict:
    """
    Analyze tone, sentiment, readability, and clarity.

    Returns the response structure used by the content pipeline.
    """

    if not text or not text.strip():
        return {
            "detected_tone": "neutral",
            "expected_tone": expected_tone,
            "tone_matches": False,
            "sentiment": "neutral",
            "sentiment_score": 50,
            "readability_score": 0,
            "readability_level": "Unknown",
            "clarity_score": 0,
            "word_count": 0,
            "character_count": 0,
            "warnings": ["The message is empty."],
            "suggestions": [
                "Generate or provide content before running tone analysis."
            ],
            "analysis_method": "rule-based heuristic",
        }

    text = text.strip()
    words = _words(text)

    word_count = len(words)
    character_count = len(text)

    detected_tone = _detect_tone(text)

    sentiment_result = _calculate_sentiment(words)

    readability_result = _calculate_readability(
        text,
        words,
    )

    clarity_score = _calculate_clarity(
        text,
        words,
    )

    tone_matches = _tone_matches(
        detected_tone,
        expected_tone,
    )

    warnings = []
    suggestions = []

    if not tone_matches:
        warnings.append(
            f"The detected tone is '{detected_tone}', "
            f"but the expected tone is '{expected_tone}'."
        )

        suggestions.append(
            f"Revise the message to better match the "
            f"requested '{expected_tone}' tone."
        )

    if word_count > 150:
        warnings.append(
            "Message exceeds 150 words."
        )

        suggestions.append(
            "Shorten the message for easier reading."
        )

    if text.count("!") > 2:
        warnings.append(
            "Message contains excessive exclamation marks."
        )

        suggestions.append(
            "Use one exclamation mark at most, where appropriate."
        )

    uppercase_words = re.findall(
        r"\b[A-Z]{4,}\b",
        text,
    )

    if len(uppercase_words) >= 3:
        warnings.append(
            "Message contains excessive uppercase words."
        )

        suggestions.append(
            "Avoid unnecessary uppercase words."
        )

    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?।。！？]+", text)
        if sentence.strip()
    ]

    long_sentence_count = sum(
        1
        for sentence in sentences
        if len(_words(sentence)) > 30
    )

    if long_sentence_count:
        warnings.append(
            "Message contains long sentences."
        )

        suggestions.append(
            "Break long sentences into shorter, clearer sentences."
        )

    if character_count > 1000:
        warnings.append(
            "Message contains more than 1000 characters."
        )

        suggestions.append(
            "Consider shortening the message for easier reading."
        )

    if readability_result["readability_level"] == "Difficult":
        suggestions.append(
            "Use simpler words and shorter sentences."
        )

    if clarity_score < 70:
        suggestions.append(
            "Improve the message structure and make instructions clearer."
        )

    suggestions = list(dict.fromkeys(suggestions))

    return {
        "detected_tone": detected_tone,
        "expected_tone": expected_tone,
        "tone_matches": tone_matches,
        "sentiment": sentiment_result["sentiment"],
        "sentiment_score": sentiment_result["sentiment_score"],
        "readability_score": readability_result["readability_score"],
        "readability_level": readability_result["readability_level"],
        "clarity_score": clarity_score,
        "word_count": word_count,
        "character_count": character_count,
        "warnings": warnings,
        "suggestions": suggestions,
        "analysis_method": "rule-based heuristic",
    }