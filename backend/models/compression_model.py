"""
SENTINEL-DISK Pro — Compression Optimization Model

Implements the compression algorithm selector and file system analysis.
Uses a rule-based classifier (simulating a trained Random Forest) that
selects the optimal compression algorithm per file type.
"""


# Algorithm selection rules (simulating RF classifier output)
COMPRESSION_ALGORITHMS = {
    "brotli": {"name": "Brotli", "ratio": 4.0, "best_for": "text/code"},
    "lzma": {"name": "LZMA", "ratio": 2.5, "best_for": "documents"},
    "gzip": {"name": "gzip", "ratio": 3.0, "best_for": "databases/logs"},
    "optipng": {"name": "OptiPNG", "ratio": 1.3, "best_for": "PNG images"},
    "skip": {"name": "Skip", "ratio": 1.0, "best_for": "pre-compressed"},
}

# Extension → algorithm mapping (from trained classifier)
EXTENSION_MAP = {
    # Text/Code → Brotli
    ".txt": "brotli", ".md": "brotli", ".csv": "brotli",
    ".py": "brotli", ".js": "brotli", ".jsx": "brotli",
    ".ts": "brotli", ".tsx": "brotli", ".html": "brotli",
    ".css": "brotli", ".json": "brotli", ".xml": "brotli",
    ".yaml": "brotli", ".yml": "brotli", ".log": "brotli",
    ".sh": "brotli", ".bat": "brotli", ".c": "brotli",
    ".cpp": "brotli", ".h": "brotli", ".java": "brotli",
    ".rs": "brotli", ".go": "brotli", ".rb": "brotli",
    # Documents → LZMA
    ".pdf": "lzma", ".doc": "lzma", ".docx": "lzma",
    ".xls": "lzma", ".xlsx": "lzma", ".ppt": "lzma",
    ".pptx": "lzma", ".odt": "lzma", ".rtf": "lzma",
    # Databases → gzip
    ".db": "gzip", ".sqlite": "gzip", ".sql": "gzip",
    ".bak": "gzip", ".dump": "gzip",
    # Images → OptiPNG (only PNG)
    ".png": "optipng", ".bmp": "optipng", ".tiff": "optipng",
    # Pre-compressed → Skip
    ".jpg": "skip", ".jpeg": "skip", ".mp4": "skip",
    ".mp3": "skip", ".zip": "skip", ".gz": "skip",
    ".rar": "skip", ".7z": "skip", ".webp": "skip",
    ".mov": "skip", ".avi": "skip", ".mkv": "skip",
    ".flac": "skip", ".aac": "skip", ".wma": "skip",
}


def select_algorithm(extension: str, entropy: float = 0.0, size_bytes: int = 0) -> dict:
    """
    Select optimal compression algorithm for a file.
    High entropy (>7.5) files are likely already compressed → skip.
    """
    ext = extension.lower()

    # High entropy = already compressed
    if entropy > 7.5:
        algo_key = "skip"
    else:
        algo_key = EXTENSION_MAP.get(ext, "gzip")

    algo = COMPRESSION_ALGORITHMS[algo_key]
    estimated_savings = 0
    if algo_key != "skip" and size_bytes > 0:
        estimated_savings = size_bytes * (1 - 1 / algo["ratio"])

    return {
        "algorithm": algo_key,
        "algorithm_name": algo["name"],
        "compression_ratio": algo["ratio"],
        "estimated_savings_bytes": int(estimated_savings),
        "best_for": algo["best_for"],
    }


def get_optimization_mode(health_score: float) -> dict:
    """
    Determine optimization aggressiveness based on drive health.
    """
    if health_score >= 80:
        return {
            "mode": "normal",
            "description": "Standard compression — no restrictions",
            "write_reduction_target": 0.15,
            "actions": [
                "Compress new text and document files",
                "Standard log rotation",
            ],
        }
    elif health_score >= 60:
        return {
            "mode": "conservative",
            "description": "Conservative — batch writes, defer temp files",
            "write_reduction_target": 0.35,
            "actions": [
                "Batch small writes into larger sequential ops",
                "Defer temporary file creation",
                "Compress documents and code files",
                "Optimize database dumps",
            ],
        }
    elif health_score >= 40:
        return {
            "mode": "aggressive",
            "description": "Aggressive — read-only cold data, heavy batching",
            "write_reduction_target": 0.55,
            "actions": [
                "Set cold data partitions to read-only",
                "Heavy write batching (16KB minimum)",
                "Consolidate all log files",
                "Compress everything compressible",
                "Defer non-critical writes",
            ],
        }
    else:
        return {
            "mode": "emergency",
            "description": "⚠️ Emergency — minimal writes, backup immediately",
            "write_reduction_target": 0.70,
            "actions": [
                "BACKUP ALL CRITICAL DATA IMMEDIATELY",
                "Minimal writes only (OS-critical)",
                "All non-essential services paused",
                "Data migration wizard activated",
                "Read-only mode for all user data",
            ],
        }
