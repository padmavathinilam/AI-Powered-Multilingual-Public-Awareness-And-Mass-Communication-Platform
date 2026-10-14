import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./ai_publicconnect.db"
    )

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "development-secret-key"
    )

    API_KEY = os.getenv(
        "API_KEY",
        ""
    )


settings = Settings()