import os
import sys
from pathlib import Path


def _ensure_resume_rag_on_path():
    override = os.getenv("RESUME_RAG_PATH")

    if override:
        resume_rag_path = Path(override).expanduser().resolve()
    else:
        resume_rag_path = (
            Path(__file__).resolve().parents[2] / "resume-rag"
        )

    resume_rag_str = str(resume_rag_path)

    if resume_rag_str not in sys.path:
        sys.path.insert(0, resume_rag_str)

    # Prefer resume-rag's own venv packages (qdrant, sentence-transformers)
    # so chatgpt_replica does not need a duplicate heavy install.
    site_packages = list(
        resume_rag_path.glob("venv/lib/python*/site-packages")
    )

    for package_path in site_packages:
        package_str = str(package_path)

        if package_str not in sys.path:
            sys.path.insert(0, package_str)

    return resume_rag_path


def get_resume_context(question):
    """
    Retrieve resume chunks for a question.

    Returns a plain-text context string.
    On failure, returns "" so chat can continue without crashing.
    """

    try:
        _ensure_resume_rag_on_path()

        from retriever import (
            format_chunks_for_prompt,
            semantic_search,
        )

        results, _intent = semantic_search(question)

        return format_chunks_for_prompt(results)

    except Exception as error:
        print("Resume RAG retrieval failed:", error)
        return ""
