#!/usr/bin/env python3
"""
Quantum Key Distribution (QKD) Simulator - Python Runner
"""
import sys
from qkd.protocols.bb84 import BB84Simulation
from qkd.protocols.e91 import E91Simulation
from qkd.crypto.otp import OneTimePad


def main():
    print("=" * 68)
    print("  ⚛️  QUANTUM KEY DISTRIBUTION (QKD) - PYTHON ENGINE  ⚛️")
    print("=" * 68)

    # 1. Run BB84 without eavesdropper
    print("\n[+] Running BB84 (No Eve):")
    res1 = BB84Simulation.run(qubits=1200, noise_rate=0.015, eve_intercept_rate=0.0)
    print(f"  • Qubits: {res1['qubits']}, Sifted: {res1['sifting']['length']}")
    print(f"  • QBER: {res1['qber_result']['qber']*100:.2f}% (Secure: {res1['qber_result']['is_secure']})")
    print(f"  • Final Key Length: {res1['shared_key_length']} bits")
    print(f"  • Alice & Bob Match: {res1['keys_match']}")

    # Encrypt OTP
    secret_msg = "QKD::QUANTUM_ENCRYPTED"
    enc = OneTimePad.encrypt(secret_msg, res1['final_key']['alice'])
    dec = OneTimePad.decrypt(enc['ciphertext_hex'], res1['final_key']['bob'])
    print(f"  • Plaintext: {secret_msg}")
    print(f"  • Ciphertext: {enc['ciphertext_hex']}")
    print(f"  • Decrypted: {dec} (Match: {dec == secret_msg})")

    # 2. Run BB84 with Eve (35% interception)
    print("\n[+] Running BB84 with Eve (35% interception):")
    res2 = BB84Simulation.run(qubits=1200, noise_rate=0.015, eve_intercept_rate=0.35)
    print(f"  • QBER: {res2['qber_result']['qber']*100:.2f}%")
    print(f"  • Aborted: {res2['aborted']} -> Reason: {res2.get('reason')}")

    # 3. Run E91 Bell Test
    print("\n[+] Running E91 Entanglement Simulation:")
    res3 = E91Simulation.run(pairs=3000, eve_intercept_rate=0.0)
    print(f"  • CHSH Parameter S: {res3['chsh_s']:.4f} (Classical <= 2.0, Quantum Max: 2.8284)")
    print(f"  • Bell Violated: {res3['bell_violated']}")
    print(f"  • Secure Channel: {res3['is_secure']}")

    print("\n✨ All simulations completed successfully! ✨")


if __name__ == "__main__":
    main()

