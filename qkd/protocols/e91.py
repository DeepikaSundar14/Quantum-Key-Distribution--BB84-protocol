import math
import random
from typing import Dict, Any, List


class E91Simulation:
    """
    Ekert 91 Entanglement-based QKD Protocol with CHSH Bell Inequality test.
    """

    @classmethod
    def run(cls, pairs: int = 2500, eve_intercept_rate: float = 0.0) -> Dict[str, Any]:
        # Photon polarization angles in radians
        alice_angles = [0.0, math.pi / 8.0, math.pi / 4.0]
        bob_angles = [math.pi / 8.0, math.pi / 4.0, 3.0 * math.pi / 8.0]

        correlations: Dict[str, List[int]] = {
            '0,0': [],
            '0,2': [],
            '2,0': [],
            '2,2': []
        }

        alice_key = []
        bob_key = []

        for _ in range(pairs):
            a_idx = random.randint(0, 2)
            b_idx = random.randint(0, 2)
            theta_a = alice_angles[a_idx]
            theta_b = bob_angles[b_idx]

            eve_intercepted = (eve_intercept_rate > 0.0 and random.random() < eve_intercept_rate)

            if eve_intercepted:
                eve_angle = random.choice(alice_angles)
                eve_outcome = 1 if random.random() < 0.5 else -1

                p_a = 0.5 + 0.5 * math.cos(2.0 * (theta_a - eve_angle))
                alice_out = eve_outcome if random.random() < p_a else -eve_outcome

                p_b = 0.5 + 0.5 * math.cos(2.0 * (theta_b - eve_angle))
                bob_out = eve_outcome if random.random() < p_b else -eve_outcome
            else:
                # Entangled pair
                alice_out = 1 if random.random() < 0.5 else -1
                delta = theta_a - theta_b
                p_same = (1.0 + math.cos(2.0 * delta)) / 2.0
                bob_out = alice_out if random.random() < p_same else -alice_out

            # Key generating pairs: a2-b1 and a3-b2
            if (a_idx == 1 and b_idx == 0) or (a_idx == 2 and b_idx == 1):
                alice_key.append(1 if alice_out == 1 else 0)
                bob_key.append(1 if bob_out == 1 else 0)

            key = f"{a_idx},{b_idx}"
            if key in correlations:
                correlations[key].append(alice_out * bob_out)

        def mean(lst):
            return sum(lst) / len(lst) if lst else 0.0

        e_a1_b1 = mean(correlations['0,0'])
        e_a1_b3 = mean(correlations['0,2'])
        e_a3_b1 = mean(correlations['2,0'])
        e_a3_b3 = mean(correlations['2,2'])

        s = abs(e_a1_b1 - e_a1_b3 + e_a3_b1 + e_a3_b3)
        bell_violated = (s > 2.0)

        errors = sum(1 for i in range(len(alice_key)) if alice_key[i] != bob_key[i])
        error_rate = errors / len(alice_key) if alice_key else 0.0

        return {
            'pairs': pairs,
            'eve_intercept_rate': eve_intercept_rate,
            'chsh_s': s,
            'bell_violated': bell_violated,
            'is_secure': bell_violated and error_rate < 0.11,
            'raw_key_length': len(alice_key),
            'key_error_rate': error_rate,
            'alice_key': alice_key,
            'bob_key': bob_key
        }

