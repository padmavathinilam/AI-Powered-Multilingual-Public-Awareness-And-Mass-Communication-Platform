import sqlite3

from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL.startswith("sqlite:///"):
    raise RuntimeError(
        "This migration script supports SQLite only."
    )

db_path = DATABASE_URL.replace("sqlite:///", "", 1)

if db_path == ":memory:":
    raise RuntimeError(
        "Cannot migrate an in-memory database with this script."
    )

conn = sqlite3.connect(db_path)

try:
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(messages)")
    columns = {row[1] for row in cursor.fetchall()}

    if not columns:
        raise RuntimeError(
            "The messages table was not found. "
            "Check the configured database path."
        )

    if "opened_at" not in columns:
        cursor.execute(
            "ALTER TABLE messages ADD COLUMN opened_at DATETIME"
        )
        print("Added opened_at")

    if "clicked_at" not in columns:
        cursor.execute(
            "ALTER TABLE messages ADD COLUMN clicked_at DATETIME"
        )
        print("Added clicked_at")

    conn.commit()
    print("Message table migration completed.")

except Exception:
    conn.rollback()
    raise

finally:
    conn.close()