from sqlalchemy import inspect, text

from app.core.database import engine


MIGRATIONS = {
    "campaigns": [
        ("campaign_type", "VARCHAR(50) NOT NULL DEFAULT 'Awareness'"),
        ("target_segments", "JSON NOT NULL DEFAULT '[]'"),
        ("channels", "JSON NOT NULL DEFAULT '[]'"),
        ("priority", "VARCHAR(20) NOT NULL DEFAULT 'Normal'"),
    ],
    "templates": [
        ("title", "VARCHAR(200)"),
        ("category", "VARCHAR(100) NOT NULL DEFAULT 'General'"),
        ("body", "TEXT"),
        ("tags", "JSON NOT NULL DEFAULT '[]'"),
    ],
}


def main():
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table_name, columns in MIGRATIONS.items():
            if table_name not in tables:
                raise RuntimeError(
                    f"Table '{table_name}' does not exist. "
                    "Check your DATABASE_URL before continuing."
                )

            existing = {
                column["name"]
                for column in inspect(connection).get_columns(table_name)
            }

            for column_name, definition in columns:
                if column_name in existing:
                    print(f"{table_name}.{column_name}: already exists")
                    continue

                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        f'ADD COLUMN "{column_name}" {definition}'
                    )
                )
                print(f"Added {table_name}.{column_name}")

    print("Task 6 database migration completed.")


if __name__ == "__main__":
    main()