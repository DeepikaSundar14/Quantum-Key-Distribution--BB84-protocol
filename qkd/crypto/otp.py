import hashlib
from typing import List, Dict, Any


class OneTimePad:
    """
    Information-Theoretically Secure One-Time Pad (Vernam Cipher).
    """

    @staticmethod
    def encrypt(plaintext: str, key_bits: List[int]) -> Dict[str, Any]:
        text_bytes = plaintext.encode('utf-8')
        required_bits = len(text_bytes) * 8

        if len(key_bits) < required_bits:
            raise ValueError(
                f"Insufficient key length: {required_bits} bits needed, {len(key_bits)} available."
            )

        cipher_bytes = bytearray(len(text_bytes))
        for byte_idx in range(len(text_bytes)):
            key_byte = 0
            for bit_idx in range(8):
                bit = key_bits[byte_idx * 8 + bit_idx]
                key_byte |= (bit << (7 - bit_idx))
            cipher_bytes[byte_idx] = text_bytes[byte_idx] ^ key_byte

        return {
            'plaintext': plaintext,
            'ciphertext_hex': cipher_bytes.hex(),
            'key_used_bits': required_bits
        }

    @staticmethod
    def decrypt(ciphertext_hex: str, key_bits: List[int]) -> str:
        cipher_bytes = bytes.fromhex(ciphertext_hex)
        required_bits = len(cipher_bytes) * 8

        if len(key_bits) < required_bits:
            raise ValueError("Insufficient key length for decryption.")

        plain_bytes = bytearray(len(cipher_bytes))
        for byte_idx in range(len(cipher_bytes)):
            key_byte = 0
            for bit_idx in range(8):
                bit = key_bits[byte_idx * 8 + bit_idx]
                key_byte |= (bit << (7 - bit_idx))
            plain_bytes[byte_idx] = cipher_bytes[byte_idx] ^ key_byte

        return plain_bytes.decode('utf-8')

