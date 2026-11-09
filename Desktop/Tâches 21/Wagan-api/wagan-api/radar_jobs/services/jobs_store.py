"""Cache partagé du CSV traité (évite I/O pandas à chaque requête API)."""
import os
import time
import logging
import pandas as pd
import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

_CACHE = {"df": None, "mtime": 0, "ts": 0}
TTL = 60  # secondes


def _clean(df):
    return df.replace([np.inf, -np.inf, np.nan], [None, None, None])


def load_jobs_df():
    """Charge le CSV traité avec cache TTL + invalidation sur mtime. Retourne une copie ou None."""
    path = settings.PROCESSED_FILE
    if not os.path.exists(path):
        return None
    try:
        mtime = os.path.getmtime(path)
        now = time.time()
        if _CACHE["df"] is not None and _CACHE["mtime"] == mtime and (now - _CACHE["ts"] < TTL):
            return _CACHE["df"].copy()
        df = pd.read_csv(path)
        df = _clean(df)
        if 'id' not in df.columns:
            df = df.copy()
            df['id'] = df.index.astype(str)
        else:
            df['id'] = df['id'].astype(str)
        _CACHE["df"] = df
        _CACHE["mtime"] = mtime
        _CACHE["ts"] = now
        return df.copy()
    except Exception as e:
        logger.error(f"Erreur chargement CSV jobs: {e}")
        return None


def invalidate():
    _CACHE["df"] = None
    _CACHE["mtime"] = 0
    _CACHE["ts"] = 0
