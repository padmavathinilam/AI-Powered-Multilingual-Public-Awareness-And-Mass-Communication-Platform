
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "ai_publicconnect.db"

print("Database:", DB_PATH)

if not DB_PATH.exists():
    raise FileNotFoundError(f"Database not found: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)

try:
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(segments)")
    columns = {row[1] for row in cursor.fetchall()}

    if not columns:
        raise RuntimeError(
            "The segments table does not exist in this database."
        )

    print("Existing columns:", sorted(columns))

    additions = {
        "filter_rules": "JSON",
        "created_at": "DATETIME",
        "updated_at": "DATETIME",
    }

    for name, column_type in additions.items():
        if name not in columns:
            cursor.execute(
                f"ALTER TABLE segments ADD COLUMN {name} {column_type}"
            )
            print(f"Added column: {name}")
        else:
            print(f"Already exists: {name}")

    conn.commit()

    cursor.execute("PRAGMA table_info(segments)")
    print("Updated columns:", [row[1] for row in cursor.fetchall()])

    print("Database migration completed.")

except Exception:
    conn.rollback()
    raise

finally:
    conn.close()
