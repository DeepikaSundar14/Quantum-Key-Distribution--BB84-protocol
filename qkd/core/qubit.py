import math
import random
from typing import Tuple
from .basis import Basis


class Qubit:
    """
    Representation of a single qubit state in 2D Hilbert space.
    State: |ψ> = α|0> + β|1>, where |α|² + |β|² = 1.
    """

    def __init__(self, alpha: float = 1.0, beta: float = 0.0):
        norm = math.sqrt(alpha * alpha + beta * beta)
        if norm == 0:
            norm = 1.0
        self.alpha = alpha / norm
        self.beta = beta / norm
        self.is_collapsed = False

    @classmethod
    def prepare(cls, bit: int, basis: Basis) -> 'Qubit':
        """
        Prepare qubit according to classical bit and basis.
        """
        sqrt2_inv = 1.0 / math.sqrt(2.0)
        if basis == Basis.RECTILINEAR:
            return cls(1.0, 0.0) if bit == 0 else cls(0.0, 1.0)
        elif basis == Basis.DIAGONAL:
            return cls(sqrt2_inv, sqrt2_inv) if bit == 0 else cls(sqrt2_inv, -sqrt2_inv)
        raise ValueError(f"Unknown basis: {basis}")

    def measure(self, basis: Basis) -> int:
        """
        Measure qubit in given basis and collapse quantum state.
        Returns measured bit (0 or 1).
        """
        sqrt2_inv = 1.0 / math.sqrt(2.0)
        if basis == Basis.RECTILINEAR:
            p0 = self.alpha * self.alpha
        elif basis == Basis.DIAGONAL:
            amp_plus = (self.alpha + self.beta) * sqrt2_inv
            p0 = amp_plus * amp_plus
        else:
            raise ValueError(f"Unknown basis: {basis}")

        p0 = max(0.0, min(1.0, p0))
        result = 0 if random.random() < p0 else 1

        # State collapse
        if basis == Basis.RECTILINEAR:
            self.alpha = 1.0 if result == 0 else 0.0
            self.beta = 0.0 if result == 0 else 1.0
        else:
            self.alpha = sqrt2_inv
            self.beta = sqrt2_inv if result == 0 else -sqrt2_inv

        self.is_collapsed = True
        return result

    def measure_angle(self, theta: float) -> int:
        """
        Measure along angle theta (radians) for Bell CHSH tests.
        Returns eigenvalue +1 or -1.
        """
        proj = self.alpha * math.cos(theta) + self.beta * math.sin(theta)
        p_plus = max(0.0, min(1.0, proj * proj))
        self.is_collapsed = True
        return 1 if random.random() < p_plus else -1

