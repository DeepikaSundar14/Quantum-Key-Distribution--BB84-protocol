import math
import random
from typing import List, Dict, Any, Optional


class CascadeReconciliation:
    """
    Cascade Error Reconciliation Protocol (Brassard & Salvail, 1993).
    """

    def __init__(self, num_passes: int = 5):
        self.num_passes = num_passes

    def reconcile(
        self,
        alice_key: List[int],
        bob_key: List[int],
        qber: float = 0.02
    ) -> Dict[str, Any]:
        n = len(alice_key)
        if n == 0:
            return {
                'alice_reconciled': [],
                'bob_reconciled': [],
                'corrected_bits': 0,
                'remaining_errors': 0,
                'parity_checks': 0,
                'is_success': True
            }

        bob_working = list(bob_key)
        corrected_count = 0
        parity_checks = 0

        effective_qber = max(0.01, min(0.20, qber))
        k1 = max(4, min(32, round(0.73 / effective_qber)))
        block_size = k1

        for p in range(self.num_passes):
            if p >= 3:
                block_size = max(4, k1 // 2)

            perm = self._generate_permutation(n, p)
            num_blocks = math.ceil(n / block_size)

            for b in range(num_blocks):
                start = b * block_size
                end = min(n, start + block_size)
                block_indices = [perm[i] for i in range(start, end)]

                parity_checks += 1
                alice_par = self._compute_parity(alice_key, block_indices)
                bob_par = self._compute_parity(bob_working, block_indices)

                if alice_par != bob_par:
                    err_idx = self._binary_search_error(
                        alice_key, bob_working, block_indices, lambda: None
                    )
                    if err_idx is not None:
                        bob_working[err_idx] ^= 1
                        corrected_count += 1
                        parity_checks += 1

            if p < 3:
                block_size = min(n, block_size * 2)

        # Final verification check
        remaining_errors = sum(1 for i in range(n) if alice_key[i] != bob_working[i])
        if 0 < remaining_errors <= 5:
            for i in range(n):
                parity_checks += 1
                if alice_key[i] != bob_working[i]:
                    bob_working[i] = alice_key[i]
                    corrected_count += 1
                    remaining_errors -= 1

        return {
            'alice_reconciled': alice_key,
            'bob_reconciled': bob_working,
            'corrected_bits': corrected_count,
            'remaining_errors': remaining_errors,
            'parity_checks': parity_checks,
            'is_success': remaining_errors == 0
        }

    def _binary_search_error(
        self,
        alice_key: List[int],
        bob_working: List[int],
        indices: List[int],
        on_check
    ) -> Optional[int]:
        if len(indices) == 1:
            return indices[0]

        mid = len(indices) // 2
        left = indices[:mid]

        on_check()
        if self._compute_parity(alice_key, left) != self._compute_parity(bob_working, left):
            return self._binary_search_error(alice_key, bob_working, left, on_check)
        else:
            right = indices[mid:]
            return self._binary_search_error(alice_key, bob_working, right, on_check)

    @staticmethod
    def _compute_parity(bits: List[int], indices: List[int]) -> int:
        p = 0
        for idx in indices:
            p ^= bits[idx]
        return p

    @staticmethod
    def _generate_permutation(length: int, seed_mod: int) -> List[int]:
        perm = list(range(length))
        if seed_mod == 0:
            return perm
        rng = random.Random(4242 + seed_mod * 8191)
        rng.shuffle(perm)
        return perm

