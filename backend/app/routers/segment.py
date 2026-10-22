from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, func, exists
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.segment import Segment
from app.models.audience_member import AudienceMember
from app.models.message import Message
from app.schemas.segment import SegmentCreate, SegmentUpdate, SegmentPreview

router = APIRouter(prefix="/api/segments", tags=["Segments"])


ALLOWED_FIELDS = {
    "age": AudienceMember.age,
    "gender": AudienceMember.gender,
    "city": AudienceMember.city,
    "state": AudienceMember.state,
    "preferred_language": AudienceMember.preferred_language,
    "occupation": AudienceMember.occupation,
    "organization_department": AudienceMember.organization_department,
    "consent_status": AudienceMember.consent_status,
}

TEXT_FIELDS = {
    "gender",
    "city",
    "state",
    "preferred_language",
    "occupation",
    "organization_department",
    "consent_status",
}

NUMERIC_FIELDS = {"age"}

ENGAGEMENT_FIELDS = {
    "message_status",
    "message_opened",
    "link_clicked",
    "campaign_id",
}

ALLOWED_OPERATORS = {
    "equals",
    "not_equals",
    "greater_than",
    "greater_than_or_equal",
    "less_than",
    "less_than_or_equal",
    "contains",
    "in",
    "between",
    "is_empty",
    "is_not_empty",
}


def validate_filter_rules(rule_data: dict[str, Any]) -> tuple[str, list]:
    if not isinstance(rule_data, dict):
        raise HTTPException(
            status_code=400,
            detail="Filter rules must be a JSON object",
        )

    logic = str(rule_data.get("logic", "AND")).upper()
    rules = rule_data.get("rules", [])

    if logic not in ("AND", "OR"):
        raise HTTPException(
            status_code=400,
            detail="Logic must be AND or OR",
        )

    if not isinstance(rules, list):
        raise HTTPException(
            status_code=400,
            detail="'rules' must be a list",
        )

    for rule in rules:
        if not isinstance(rule, dict):
            raise HTTPException(
                status_code=400,
                detail="Every rule must be a JSON object",
            )

        field = rule.get("field")
        operator = rule.get("operator")

        if field not in ALLOWED_FIELDS and field not in ENGAGEMENT_FIELDS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported filter field: {field}",
            )

        if operator not in ALLOWED_OPERATORS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported operator: {operator}",
            )

        value = rule.get("value")

        if operator not in {"is_empty", "is_not_empty"} and "value" not in rule:
            raise HTTPException(
                status_code=400,
                detail=f"A value is required for operator '{operator}'",
            )

        if operator == "between":
            if field not in NUMERIC_FIELDS:
                raise HTTPException(
                    status_code=400,
                    detail="'between' is supported for age only",
                )

            if not isinstance(value, list) or len(value) != 2:
                raise HTTPException(
                    status_code=400,
                    detail="'between' requires [minimum, maximum]",
                )

            try:
                minimum = float(value[0])
                maximum = float(value[1])
            except (TypeError, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail="Age range values must be numeric",
                )

            if minimum > maximum:
                raise HTTPException(
                    status_code=400,
                    detail="Minimum value cannot exceed maximum value",
                )

        if operator in {
            "greater_than",
            "greater_than_or_equal",
            "less_than",
            "less_than_or_equal",
        }:
            if field not in NUMERIC_FIELDS:
                raise HTTPException(
                    status_code=400,
                    detail="Numeric comparisons are supported for age only",
                )
            try:
                float(value)
            except (TypeError, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail="Age comparison value must be numeric",
                )

        if operator == "contains" and field not in TEXT_FIELDS | {"message_status"}:
            raise HTTPException(
                status_code=400,
                detail="'contains' requires a text field",
            )

        if operator == "in" and not isinstance(value, list):
            raise HTTPException(
                status_code=400,
                detail="'in' requires a list value",
            )

        if field == "message_status" and operator not in {
            "equals", "not_equals", "contains", "in"
        }:
            raise HTTPException(
                status_code=400,
                detail="message_status supports equals, not_equals, contains, and in",
            )

        if field in {"message_opened", "link_clicked"}:
            if operator not in {"equals", "not_equals"}:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field} supports equals and not_equals",
                )
            if str(value).lower() not in {"true", "false"}:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field} value must be true or false",
                )

        if field == "campaign_id":
            if operator not in {"equals", "not_equals", "in"}:
                raise HTTPException(
                    status_code=400,
                    detail="campaign_id supports equals, not_equals, and in",
                )

            values = value if isinstance(value, list) else [value]
            try:
                if any(int(item) < 1 for item in values):
                    raise ValueError
            except (TypeError, ValueError):
                raise HTTPException(
                    status_code=400,
                    detail="campaign_id must contain positive integers",
                )

        if field in ALLOWED_FIELDS and field not in NUMERIC_FIELDS:
            if operator in {
                "greater_than",
                "greater_than_or_equal",
                "less_than",
                "less_than_or_equal",
                "between",
            }:
                raise HTTPException(
                    status_code=400,
                    detail="Numeric operators are supported for age only",
                )

    return logic, rules


def build_filter(rule_data: dict[str, Any]):
    logic, rules = validate_filter_rules(rule_data)
    conditions = []

    for rule in rules:
        field_name = rule["field"]
        operator = rule["operator"]
        value = rule.get("value")

        # Engagement rules use EXISTS so members are not duplicated
        # when they have multiple messages.
        if field_name in ENGAGEMENT_FIELDS:
            if field_name == "message_status":
                status = func.lower(Message.status)

                if operator == "equals":
                    message_condition = status == str(value).lower()
                elif operator == "not_equals":
                    message_condition = status == str(value).lower()
                    conditions.append(
                        ~exists().where(
                            Message.audience_member_id == AudienceMember.id,
                            message_condition,
                        )
                    )
                    continue
                elif operator == "contains":
                    message_condition = Message.status.ilike(f"%{value}%")
                else:
                    message_condition = status.in_(
                        [str(item).lower() for item in value]
                    )

            elif field_name == "message_opened":
                is_opened = str(value).lower() == "true"
                if operator == "not_equals":
                    is_opened = not is_opened

                message_condition = (
                    Message.opened_at.is_not(None)
                    if is_opened
                    else Message.opened_at.is_(None)
                )

            elif field_name == "link_clicked":
                is_clicked = str(value).lower() == "true"
                if operator == "not_equals":
                    is_clicked = not is_clicked

                message_condition = (
                    Message.clicked_at.is_not(None)
                    if is_clicked
                    else Message.clicked_at.is_(None)
                )

            else:  # campaign_id
                if operator == "equals":
                    message_condition = Message.campaign_id == int(value)
                elif operator == "not_equals":
                    conditions.append(
                        ~exists().where(
                            Message.audience_member_id == AudienceMember.id,
                            Message.campaign_id == int(value),
                        )
                    )
                    continue
                else:
                    message_condition = Message.campaign_id.in_(
                        [int(item) for item in value]
                    )

            conditions.append(
                exists().where(
                    Message.audience_member_id == AudienceMember.id,
                    message_condition,
                )
            )
            continue

        column = ALLOWED_FIELDS[field_name]

        if operator == "equals":
            condition = (
                column.ilike(str(value))
                if field_name in TEXT_FIELDS and value is not None
                else column == value
            )

        elif operator == "not_equals":
            condition = (
                column.is_(None) | column.notilike(str(value))
                if field_name in TEXT_FIELDS and value is not None
                else column != value
            )

        elif operator == "greater_than":
            condition = column > float(value)

        elif operator == "greater_than_or_equal":
            condition = column >= float(value)

        elif operator == "less_than":
            condition = column < float(value)

        elif operator == "less_than_or_equal":
            condition = column <= float(value)

        elif operator == "contains":
            condition = column.ilike(f"%{value}%")

        elif operator == "in":
            if not value:
                condition = column.in_([])
            elif field_name in TEXT_FIELDS:
                condition = func.lower(column).in_(
                    [str(item).lower() for item in value]
                )
            else:
                condition = column.in_(value)

        elif operator == "between":
            condition = column.between(float(value[0]), float(value[1]))

        elif operator == "is_empty":
            condition = (
                column.is_(None) | (func.trim(column) == "")
                if field_name in TEXT_FIELDS
                else column.is_(None)
            )

        elif operator == "is_not_empty":
            condition = (
                column.is_not(None) & (func.trim(column) != "")
                if field_name in TEXT_FIELDS
                else column.is_not(None)
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported operator: {operator}",
            )

        conditions.append(condition)

    if not conditions:
        return None

    return and_(*conditions) if logic == "AND" else or_(*conditions)


def get_segment_query(db: Session, filter_rules: dict[str, Any]):
    query = db.query(AudienceMember)
    condition = build_filter(filter_rules or {"logic": "AND", "rules": []})

    if condition is not None:
        query = query.filter(condition)

    return query


def serialize_segment(segment: Segment):
    return {
        "id": segment.id,
        "name": segment.name,
        "description": segment.description,
        "filter_rules": segment.filter_rules or {
            "logic": "AND",
            "rules": [],
        },
        "created_at": segment.created_at,
        "updated_at": segment.updated_at,
    }


def serialize_member(member: AudienceMember):
    return {
        "id": member.id,
        "name": member.name,
        "email": member.email,
        "phone": member.phone,
        "age": member.age,
        "gender": member.gender,
        "city": member.city,
        "state": member.state,
        "preferred_language": member.preferred_language,
        "occupation": member.occupation,
        "organization_department": member.organization_department,
        "consent_status": member.consent_status,
        "created_at": member.created_at,
    }


@router.get("/")
def get_segments(db: Session = Depends(get_db)):
    segments = db.query(Segment).order_by(Segment.id.desc()).all()
    result = []

    for segment in segments:
        data = serialize_segment(segment)
        try:
            data["size"] = get_segment_query(
                db,
                segment.filter_rules or {"logic": "AND", "rules": []},
            ).count()
        except HTTPException:
            data["size"] = 0

        result.append(data)

    return result


@router.post("/")
def create_segment(segment: SegmentCreate, db: Session = Depends(get_db)):
    rules = segment.filter_rules or {"logic": "AND", "rules": []}
    validate_filter_rules(rules)

    new_segment = Segment(
        name=segment.name,
        description=segment.description,
        filter_rules=rules,
    )

    db.add(new_segment)
    db.commit()
    db.refresh(new_segment)

    result = serialize_segment(new_segment)
    result["size"] = get_segment_query(db, rules).count()
    return result


@router.get("/{segment_id}")
def get_segment(segment_id: int, db: Session = Depends(get_db)):
    segment = db.query(Segment).filter(Segment.id == segment_id).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    result = serialize_segment(segment)
    result["size"] = get_segment_query(
        db,
        segment.filter_rules or {"logic": "AND", "rules": []},
    ).count()

    return result


@router.put("/{segment_id}")
def update_segment(
    segment_id: int,
    segment: SegmentUpdate,
    db: Session = Depends(get_db),
):
    existing = db.query(Segment).filter(Segment.id == segment_id).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Segment not found")

    updates = segment.model_dump(exclude_unset=True)

    if "filter_rules" in updates:
        validate_filter_rules(
            updates["filter_rules"] or {"logic": "AND", "rules": []}
        )

    for key, value in updates.items():
        setattr(existing, key, value)

    existing.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing)

    result = serialize_segment(existing)
    result["size"] = get_segment_query(
        db,
        existing.filter_rules or {"logic": "AND", "rules": []},
    ).count()

    return result


@router.delete("/{segment_id}")
def delete_segment(segment_id: int, db: Session = Depends(get_db)):
    existing = db.query(Segment).filter(Segment.id == segment_id).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Segment not found")

    db.delete(existing)
    db.commit()

    return {"message": "Segment deleted successfully"}


@router.post("/preview")
def preview_segment(
    preview: SegmentPreview,
    db: Session = Depends(get_db),
):
    query = get_segment_query(db, preview.filter_rules)
    sample_size = max(1, min(preview.sample_size, 100))

    return {
        "count": query.count(),
        "sample": [
            serialize_member(member)
            for member in query.limit(sample_size).all()
        ],
    }


@router.get("/{segment_id}/members")
def get_segment_members(
    segment_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    segment = db.query(Segment).filter(Segment.id == segment_id).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    query = get_segment_query(
        db,
        segment.filter_rules or {"logic": "AND", "rules": []},
    )

    total = query.count()

    members = (
        query.order_by(AudienceMember.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "segment_id": segment.id,
        "segment_name": segment.name,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "members": [serialize_member(member) for member in members],
    }


@router.get("/{segment_id}/language-distribution")
def get_language_distribution(
    segment_id: int,
    db: Session = Depends(get_db),
):
    segment = db.query(Segment).filter(Segment.id == segment_id).first()

    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    query = get_segment_query(
        db,
        segment.filter_rules or {"logic": "AND", "rules": []},
    )

    rows = (
        query.with_entities(
            AudienceMember.preferred_language,
            func.count(AudienceMember.id),
        )
        .group_by(AudienceMember.preferred_language)
        .all()
    )

    return {
        "segment_id": segment.id,
        "distribution": [
            {
                "language": language or "Not specified",
                "count": count,
            }
            for language, count in rows
        ],
    }