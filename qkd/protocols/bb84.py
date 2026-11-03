import random
from typing import Dict, Any, Optional
from ..core.basis import getRandomBasis
from ..core.qubit import Qubit
from ..core.channel import QuantumChannel
from ..attacks.eve import Eavesdropper
from ..postprocessing.sifting import sift_keys
from ..postprocessing.qber import estimate_qber
from ..postprocessing.cascade import CascadeReconciliation
from ..postprocessing.privacy import PrivacyAmplification


class BB84Simulation:
    """
    BB84 Quantum Key Distribution Protocol coordinator.
    """

    @classmethod
    def run(
        cls,
        qubits: int = 1200,
        noise_rate: float = 0.0,
        loss_rate: float = 0.0,
        eve_intercept_rate: float = 0.0,
        sample_fraction: float = 0.25,
        qber_threshold: float = 0.11,
        enable_error_correction: bool = True,
        enable_privacy_amplification: bool = True
    ) -> Dict[str, Any]:
        # 1. Alice generates random bits and random bases
        alice_bits = [random.choice([0, 1]) for _ in range(qubits)]
        alice_bases = [getRandomBasis() for _ in range(qubits)]

        # 2. Channel & Eavesdropper
        eve = Eavesdropper(eve_intercept_rate) if eve_intercept_rate > 0 else None
        channel = QuantumChannel(noise_rate, loss_rate, eve)

        bob_bases = []
        bob_bits = []

        for i in range(qubits):
            qubit = Qubit.prepare(alice_bits[i], alice_bases[i])
            delivered = channel.transmit(qubit, i)
            if delivered is None:
                bob_bases.append(None)
                bob_bits.append(None)
            else:
                b_basis = getRandomBasis()
                bob_bases.append(b_basis)
                bob_bits.append(delivered.measure(b_basis))

        # 3. Sifting
        sifting = sift_keys(alice_bases, bob_bases, alice_bits, bob_bits)

        # 4. QBER Estimation
        qber_result = estimate_qber(
            sifting['alice_sifted'],
            sifting['bob_sifted'],
            sample_fraction,
            qber_threshold
        )

        if not qber_result['is_secure']:
            return {
                'aborted': True,
                'reason': f"QBER ({qber_result['qber']*100:.2f}%) exceeded threshold ({qber_threshold*100:.1f}%)",
                'qubits': qubits,
                'sifting': sifting,
                'qber_result': qber_result,
                'reconciliation': None,
                'privacy': None,
                'final_key': None
            }

        # 5. Cascade Reconciliation
        alice_key = qber_result['alice_key']
        bob_key = qber_result['bob_key']
        reconciliation = None

        if enable_error_correction and alice_key:
            cascade = CascadeReconciliation()
            reconciliation = cascade.reconcile(alice_key, bob_key, qber_result['qber'])
            alice_key = reconciliation['alice_reconciled']
            bob_key = reconciliation['bob_reconciled']

        # 6. Privacy Amplification
        privacy = None
        final_alice = alice_key
        final_bob = bob_key

        if enable_privacy_amplification and alice_key:
            target_len = PrivacyAmplification.calculate_target_length(
                len(alice_key),
                qber_result['qber'],
                reconciliation['parity_checks'] if reconciliation else 0
            )
            alice_pa = PrivacyAmplification.apply_toeplitz(alice_key, target_len)
            bob_pa = PrivacyAmplification.apply_toeplitz(bob_key, target_len, alice_pa['seed_bits'])

            privacy = {
                'target_length': target_len,
                'alice_hex': alice_pa['hex_key'],
                'bob_hex': bob_pa['hex_key'],
                'match': alice_pa['hex_key'] == bob_pa['hex_key']
            }
            final_alice = alice_pa['final_key_bits']
            final_bob = bob_pa['final_key_bits']

        keys_match = (final_alice == final_bob)

        return {
            'aborted': False,
            'qubits': qubits,
            'noise_rate': noise_rate,
            'loss_rate': loss_rate,
            'eve_intercept_rate': eve_intercept_rate,
            'sifting': sifting,
            'qber_result': qber_result,
            'reconciliation': reconciliation,
            'privacy': privacy,
            'keys_match': keys_match,
            'shared_key_length': len(final_alice),
            'final_key': {
                'alice': final_alice,
                'bob': final_bob,
                'hex': privacy['alice_hex'] if privacy else ""
            }
        }

