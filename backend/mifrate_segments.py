
from sqlalchemy import inspect, text
from app.database import engine


def migrate_segments():
    inspector = inspect(engine)

    if "segments" not in inspector.get_table_names():
        print("ERROR: segments table not found.")
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("segments")
    }

    columns_to_add = {
        "filter_rules": "JSON",
        "created_at": "DATETIME",
        "updated_at": "DATETIME",
    }

    with engine.begin() as connection:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE segments "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )
                print(f"Added column: {column_name}")
            else:
                print(f"Already exists: {column_name}")

    print("Migration completed successfully!")


if __name__ == "__main__":
    migrate_segments()
