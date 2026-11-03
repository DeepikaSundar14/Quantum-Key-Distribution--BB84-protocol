import random
from typing import Optional
from .qubit import Qubit
from .basis import getRandomBasis
from ..attacks.eve import Eavesdropper


class QuantumChannel:
    """
    Physical optical channel with noise, attenuation loss, and eavesdropping.
    """

    def __init__(
        self,
        noise_rate: float = 0.0,
        loss_rate: float = 0.0,
        eavesdropper: Optional[Eavesdropper] = None
    ):
        self.noise_rate = max(0.0, min(1.0, noise_rate))
        self.loss_rate = max(0.0, min(1.0, loss_rate))
        self.eavesdropper = eavesdropper

    def transmit(self, qubit: Qubit, index: int) -> Optional[Qubit]:
        """
        Transmit qubit from Alice to Bob.
        """
        # Fiber loss check
        if self.loss_rate > 0.0 and random.random() < self.loss_rate:
            return None

        flying = qubit

        # Eve interception
        if self.eavesdropper is not None:
            flying = self.eavesdropper.intercept(flying, index)

        # Environmental noise
        if self.noise_rate > 0.0 and random.random() < self.noise_rate:
            flying = Qubit.prepare(random.choice([0, 1]), getRandomBasis())

        return flying

