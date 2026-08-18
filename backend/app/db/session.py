import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.db.base import Base

# Import models so Base metadata is populated
from backend.app.models.complaint import Complaint, ComplaintEvent, ComplaintDocument, AIRun, AIProposal  # noqa

logger = logging.getLogger(__name__)

def create_db_engine():
    # Attempt PostgreSQL if specified and reachable
    if settings.DATABASE_URL and "postgresql" in settings.DATABASE_URL:
        try:
            pg_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 2}
            )
            with pg_engine.connect() as conn:
                pass
            logger.info("Connected successfully to PostgreSQL database.")
            return pg_engine
        except Exception as e:
            logger.warning(f"PostgreSQL connection unavailable ({e}). Using SQLite fallback.")
    
    # SQLite fallback
    sqlite_engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )
    logger.info("Initialized SQLite database engine: complaints.db")
    return sqlite_engine

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Auto-initialize tables immediately
Base.metadata.create_all(bind=engine)

def init_db():
    """Create all tables in database and apply non-destructive SQLite column migrations"""
    Base.metadata.create_all(bind=engine)
    
    # Auto-add missing columns to SQLite if table was created in an earlier phase
    if "sqlite" in str(engine.url):
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check ai_proposals columns
            try:
                result = conn.execute(text("PRAGMA table_info(ai_proposals);")).fetchall()
                existing_cols = {row[1] for row in result}
                if "proposed_changes" not in existing_cols:
                    conn.execute(text("ALTER TABLE ai_proposals ADD COLUMN proposed_changes JSON;"))
                if "evidence" not in existing_cols:
                    conn.execute(text("ALTER TABLE ai_proposals ADD COLUMN evidence TEXT;"))
                if "rejection_reason" not in existing_cols:
                    conn.execute(text("ALTER TABLE ai_proposals ADD COLUMN rejection_reason TEXT;"))
                conn.commit()
            except Exception as e:
                logger.debug(f"SQLite column migration check info: {e}")

    logger.info("Database tables initialized successfully.")

def get_active_db_type() -> str:
    """Return whether the active database engine is PostgreSQL or SQLite fallback"""
    return "postgresql" if "postgresql" in str(engine.url) else "sqlite"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
