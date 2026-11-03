import random
from typing import Optional, List, Dict, Any
from ..core.basis import Basis, getRandomBasis
from ..core.qubit import Qubit


class Eavesdropper:
    """
    Simulates Eve performing an intercept-resend attack on the quantum channel.
    """

    def __init__(self, intercept_rate: float = 0.0):
        self.intercept_rate = max(0.0, min(1.0, intercept_rate))
        self.intercepted_count = 0
        self.known_bits: List[Dict[str, Any]] = []

    def intercept(self, qubit: Qubit, index: int) -> Qubit:
        """
        Intercept photon with probability intercept_rate.
        """
        if random.random() >= self.intercept_rate:
            return qubit

        self.intercepted_count += 1
        eve_basis = getRandomBasis()
        measured_bit = qubit.measure(eve_basis)

        self.known_bits.append({
            'index': index,
            'basis': eve_basis,
            'bit': measured_bit
        })

        # Eve re-prepares and forwards to Bob
        return Qubit.prepare(measured_bit, eve_basis)

