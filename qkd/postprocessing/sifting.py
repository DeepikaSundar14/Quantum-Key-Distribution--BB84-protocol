from typing import List, Optional, Tuple, Dict, Any
from ..core.basis import Basis


def sift_keys(
    alice_bases: List[Basis],
    bob_bases: List[Optional[Basis]],
    alice_bits: List[int],
    bob_bits: List[Optional[int]]
) -> Dict[str, Any]:
    """
    Sift bits: compare bases over classical public channel.
    Retain only events where bases matched and photon arrived.
    """
    sifted_indices = []
    alice_sifted = []
    bob_sifted = []

    length = min(len(alice_bases), len(bob_bases))

    for i in range(length):
        if bob_bases[i] is None or bob_bits[i] is None:
            continue
        if alice_bases[i] == bob_bases[i]:
            sifted_indices.append(i)
            alice_sifted.append(alice_bits[i])
            bob_sifted.append(bob_bits[i])

    efficiency = len(sifted_indices) / length if length > 0 else 0.0

    return {
        'sifted_indices': sifted_indices,
        'alice_sifted': alice_sifted,
        'bob_sifted': bob_sifted,
        'efficiency': efficiency,
        'length': len(sifted_indices)
    }

