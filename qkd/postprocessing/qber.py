import math
import random
from typing import List, Dict, Any


def binary_entropy(p: float) -> float:
    """Calculate Shannon binary entropy h2(p)."""
    if p <= 0.0 or p >= 1.0:
        return 0.0
    return -p * math.log2(p) - (1.0 - p) * math.log2(1.0 - p)


def estimate_qber(
    alice_sifted: List[int],
    bob_sifted: List[int],
    sample_fraction: float = 0.25,
    threshold: float = 0.11
) -> Dict[str, Any]:
    """
    Sacrifice a random sample of sifted bits to estimate channel error rate.
    """
    n = len(alice_sifted)
    if n == 0:
        return {
            'qber': 0.0,
            'is_secure': False,
            'sample_size': 0,
            'error_count': 0,
            'alice_key': [],
            'bob_key': [],
            'reason': 'Empty sifted key'
        }

    sample_size = max(1, min(n, round(n * sample_fraction)))
    sample_indices = set(random.sample(range(n), sample_size))

    error_count = sum(1 for idx in sample_indices if alice_sifted[idx] != bob_sifted[idx])
    qber = error_count / sample_size
    is_secure = qber <= threshold

    alice_key = [alice_sifted[i] for i in range(n) if i not in sample_indices]
    bob_key = [bob_sifted[i] for i in range(n) if i not in sample_indices]

    return {
        'qber': qber,
        'is_secure': is_secure,
        'threshold': threshold,
        'sample_size': sample_size,
        'error_count': error_count,
        'alice_key': alice_key,
        'bob_key': bob_key,
        'remaining_length': len(alice_key)
    }

