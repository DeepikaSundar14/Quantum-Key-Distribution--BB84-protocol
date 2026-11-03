import random
from enum import Enum


class Basis(str, Enum):
    RECTILINEAR = '+'  # Computational basis {|0>, |1>}
    DIAGONAL = 'x'     # Hadamard conjugate basis {|+>, |->}


BASES = [Basis.RECTILINEAR, Basis.DIAGONAL]


def getRandomBasis() -> Basis:
    """Return a randomly chosen basis."""
    return random.choice(BASES)

