"""
Quantum Key Distribution (QKD) Research & Simulation Package
"""

from .core.basis import Basis, getRandomBasis
from .core.qubit import Qubit
from .core.channel import QuantumChannel
from .attacks.eve import Eavesdropper
from .postprocessing.sifting import sift_keys
from .postprocessing.qber import estimate_qber, binary_entropy
from .postprocessing.cascade import CascadeReconciliation
from .postprocessing.privacy import PrivacyAmplification
from .crypto.otp import OneTimePad
from .protocols.bb84 import BB84Simulation
from .protocols.e91 import E91Simulation

__version__ = "1.0.0"
__all__ = [
    "Basis",
    "getRandomBasis",
    "Qubit",
    "QuantumChannel",
    "Eavesdropper",
    "sift_keys",
    "estimate_qber",
    "binary_entropy",
    "CascadeReconciliation",
    "PrivacyAmplification",
    "OneTimePad",
    "BB84Simulation",
    "E91Simulation",
]

