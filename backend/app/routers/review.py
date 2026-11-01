
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/ai",
    tags=["AI Quality Review"],
)


# --------------------------------------------------
# REQUEST MODEL
# --------------------------------------------------

class ReviewRequest(BaseModel):
    content: str = Field(..., min_length=1)
    channel: str = "SMS"
    language: str = "English"
    date: Optional[str] = None
    place: Optional[str] = None
    contact: Optional[str] = None


# --------------------------------------------------
# RULE-BASED CONTENT QUALITY REVIEW
# --------------------------------------------------

def run_review(data: ReviewRequest):
    """
    Review campaign content for common quality and compliance risks.

    This is a rule-based review, not a substitute for professional
    fact-checking or a complete grammar-checking service.
    """

    content = data.content.strip()

    if not content:
        raise ValueError("Content cannot be empty.")

    issues = []

    def add_issue(
        severity: str,
        category: str,
        message: str,
        suggestion: str,
        text: str = "",
    ):
        issues.append({
            "severity": severity,
            "category": category,
            "message": message,
            "suggestion": suggestion,
            "text": text,
        })

    # --------------------------------------------------
    # 1. REQUIRED DATE CHECK
    # --------------------------------------------------

    date_pattern = (
        r"\b(today|tomorrow|monday|tuesday|wednesday|thursday|"
        r"friday|saturday|sunday|\d{1,2}[-/]\d{1,2}"
        r"(?:[-/]\d{2,4})?)\b"
    )

    if not data.date and not re.search(date_pattern, content, re.I):
        add_issue(
            "warning",
            "missing_date",
            "The content may be missing an event date.",
            "Add the event date if this message announces a scheduled event or campaign.",
        )

    # --------------------------------------------------
    # 2. REQUIRED PLACE CHECK
    # --------------------------------------------------

    place_pattern = r"\b(at|near|in|location|venue|address)\b"

    if not data.place and not re.search(place_pattern, content, re.I):
        add_issue(
            "warning",
            "missing_place",
            "The content may be missing a location.",
            "Add the event location if recipients need to attend in person.",
        )

    # --------------------------------------------------
    # 3. CONTACT INFORMATION CHECK
    # --------------------------------------------------

    contact_pattern = (
        r"\b(contact|call|helpline|phone|reach us)\b"
        r"|\b\d{10}\b"
    )

    if not data.contact and not re.search(contact_pattern, content, re.I):
        add_issue(
            "warning",
            "missing_contact",
            "No contact or helpline details were detected.",
            "Add an official contact number or helpline when required by your organization.",
        )

    # --------------------------------------------------
    # 4. SPACING AND CLARITY CHECKS
    # --------------------------------------------------

    if re.search(r"[ \t]{2,}", content):
        add_issue(
            "info",
            "spacing",
            "Extra spaces were found.",
            "Remove unnecessary consecutive spaces.",
        )

    if len(content.split()) < 5:
        add_issue(
            "warning",
            "unclear_content",
            "The message may not contain enough information.",
            "Explain the purpose of the message and what the recipient should know or do.",
            content,
        )

    # --------------------------------------------------
    # 5. ABUSIVE LANGUAGE CHECK
    # --------------------------------------------------

    banned_words = [
        "idiot",
        "stupid",
        "hate speech",
    ]

    for word in banned_words:
        match = re.search(
            rf"\b{re.escape(word)}\b",
            content,
            re.I,
        )

        if match:
            add_issue(
                "error",
                "abusive_language",
                f"Potentially abusive language detected: {match.group(0)}.",
                "Replace this wording with respectful and appropriate language.",
                match.group(0),
            )

    # --------------------------------------------------
    # 6. MISINFORMATION-RISK PHRASES
    # --------------------------------------------------

    risky_phrases = [
        "100% guaranteed",
        "cures all diseases",
        "no side effects",
        "guaranteed results",
    ]

    for phrase in risky_phrases:
        match = re.search(
            re.escape(phrase),
            content,
            re.I,
        )

        if match:
            add_issue(
                "error",
                "misinformation_risk",
                "A potentially exaggerated or unsupported claim was detected.",
                "Verify the claim using an authoritative source and replace it with evidence-based wording.",
                match.group(0),
            )

    # --------------------------------------------------
    # 7. CHANNEL LENGTH CHECK
    # --------------------------------------------------

    channel = data.channel.strip().lower()

    max_lengths = {
        "sms": 160,
        "whatsapp": 4096,
        "email": 10000,
        "social media": 2200,
    }

    limit = max_lengths.get(channel, 10000)

    if len(content) > limit:
        add_issue(
            "error",
            "length_limit",
            f"Content exceeds the {data.channel} limit of {limit} characters.",
            f"Shorten the message to {limit} characters or fewer.",
            content,
        )

    # --------------------------------------------------
    # 8. BASIC INSTRUCTION CLARITY CHECK
    # --------------------------------------------------

    action_words = [
        "please",
        "visit",
        "call",
        "register",
        "attend",
        "contact",
        "share",
        "avoid",
        "use",
        "wash",
        "keep",
        "check",
    ]

    if len(content.split()) >= 10 and not any(
        re.search(rf"\b{re.escape(word)}\b", content, re.I)
        for word in action_words
    ):
        add_issue(
            "info",
            "unclear_action",
            "No obvious action instruction was detected.",
            "Consider adding a clear action for the target audience.",
        )

    # --------------------------------------------------
    # 9. SCORE AND APPROVAL STATUS
    # --------------------------------------------------

    deductions = {
        "error": 25,
        "warning": 10,
        "info": 3,
    }

    score = max(
        0,
        100 - sum(
            deductions.get(issue["severity"], 0)
            for issue in issues
        ),
    )

    critical_issues = [
        issue for issue in issues
        if issue["severity"] == "error"
    ]

    passed = len(critical_issues) == 0

    severity_counts = {
        "error": sum(
            issue["severity"] == "error" for issue in issues
        ),
        "warning": sum(
            issue["severity"] == "warning" for issue in issues
        ),
        "info": sum(
            issue["severity"] == "info" for issue in issues
        ),
    }

    # --------------------------------------------------
    # 10. STRUCTURED REVIEW REPORT
    # --------------------------------------------------

    return {
        "overall_score": score,
        "passed": passed,
        "approval_blocked": not passed,
        "status": "passed" if passed else "failed",
        "total_issues": len(issues),
        "critical_issue_count": len(critical_issues),
        "severity_counts": severity_counts,
        "issues": issues,
        "suggested_fixes": [
            {
                "category": issue["category"],
                "suggestion": issue["suggestion"],
                "text": issue["text"],
            }
            for issue in issues
        ],
        "review_method": "rule-based heuristic",
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }


# --------------------------------------------------
# REVIEW API
# --------------------------------------------------

@router.post("/review")
def review_content(data: ReviewRequest):
    """Run quality and compliance checks on submitted content."""

    try:
        return run_review(data)

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Content review failed: {type(exc).__name__}",
        ) from exc
