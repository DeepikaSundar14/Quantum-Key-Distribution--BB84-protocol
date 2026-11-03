import unittest
from qkd.protocols.bb84 import BB84Simulation
from qkd.protocols.e91 import E91Simulation
from qkd.crypto.otp import OneTimePad


class TestQKD(unittest.TestCase):
    def test_bb84_secure_run(self):
        result = BB84Simulation.run(qubits=1000, noise_rate=0.0, eve_intercept_rate=0.0)
        self.assertFalse(result['aborted'])
        self.assertTrue(result['keys_match'])
        self.assertGreater(result['shared_key_length'], 0)
        self.assertEqual(result['qber_result']['qber'], 0.0)

    def test_bb84_eavesdropping_detection(self):
        result = BB84Simulation.run(qubits=1200, noise_rate=0.0, eve_intercept_rate=0.6)
        self.assertTrue(result['aborted'])
        self.assertGreater(result['qber_result']['qber'], 0.11)

    def test_e91_bell_inequality(self):
        result = E91Simulation.run(pairs=3000, eve_intercept_rate=0.0)
        self.assertGreater(result['chsh_s'], 2.4)
        self.assertTrue(result['bell_violated'])

    def test_otp_encryption_decryption(self):
        msg = "Quantum Top Secret 2026"
        key_bits = [1, 0, 1, 1, 0, 0, 1, 0] * len(msg.encode('utf-8'))
        enc = OneTimePad.encrypt(msg, key_bits)
        dec = OneTimePad.decrypt(enc['ciphertext_hex'], key_bits)
        self.assertEqual(dec, msg)


if __name__ == '__main__':
    unittest.main()

