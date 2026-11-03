import math
import os
import secrets
from typing import List, Dict, Any, Optional
from .qber import binary_entropy


class PrivacyAmplification:
    """
    Privacy Amplification using Universal Hashing (Toeplitz Matrix over GF(2)).
    """

    @staticmethod
    def calculate_target_length(
        raw_length: int,
        qber: float,
        parity_bits_leaked: int = 0,
        security_param: int = 16
    ) -> int:
        if raw_length <= 0:
            return 0
        clamped_qber = max(0.0, min(0.25, qber))
        h2 = binary_entropy(2 * clamped_qber)
        theoretical_fraction = max(0.1, 1.0 - h2)
        target = math.floor(raw_length * theoretical_fraction - (parity_bits_leaked * 0.1) - security_param)
        return max(16, min(raw_length, target))

    @staticmethod
    def apply_toeplitz(
        key_bits: List[int],
        target_length: int,
        seed_bits: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        n = len(key_bits)
        m = min(target_length, n)

        if n == 0 or m == 0:
            return {'final_key_bits': [], 'hex_key': '', 'seed_bits': []}

        seed_length = n + m - 1
        if seed_bits is None or len(seed_bits) < seed_length:
            seed = [secrets.randbelow(2) for _ in range(seed_length)]
        else:
            seed = seed_bits

        final_key = [0] * m
        for i in range(m):
            s = 0
            for j in range(n):
                s ^= (key_bits[j] & seed[i - j + (n - 1)])
            final_key[i] = s

        hex_str = ""
        for i in range(0, len(final_key), 4):
            nibble = 0
            for b in range(4):
                if i + b < len(final_key):
                    nibble |= (final_key[i + b] << (3 - b))
            hex_str += format(nibble, 'x')

        return {
            'final_key_bits': final_key,
            'hex_key': hex_str,
            'seed_bits': seed
        }

