#!/usr/bin/env node

const { BB84Simulation } = require('./protocols/bb84');
const { E91Simulation } = require('./protocols/e91');
const { OneTimePad } = require('./crypto/otp');

// Terminal color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  blue: '\x1b[34m'
};

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}======================================================================
  ⚛️  QUANTUM KEY DISTRIBUTION (QKD) SIMULATION SUITE  ⚛️
  Information-Theoretic Security Powered by Quantum Mechanics
======================================================================${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    protocol: 'bb84',
    qubits: 1200,
    eve: 0.0,
    noise: 0.015,
    message: 'QKD::TOP_SECRET_ALPHA'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--protocol' && args[i + 1]) options.protocol = args[++i].toLowerCase();
    else if (arg === '--qubits' && args[i + 1]) options.qubits = parseInt(args[++i], 10);
    else if (arg === '--pairs' && args[i + 1]) options.qubits = parseInt(args[++i], 10);
    else if (arg === '--eve' && args[i + 1]) options.eve = parseFloat(args[++i]);
    else if (arg === '--noise' && args[i + 1]) options.noise = parseFloat(args[++i]);
    else if (arg === '--message' && args[i + 1]) options.message = args[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage:
  node src/cli.js [options]

Options:
  --protocol <name>   Protocol to run: 'bb84' (default) or 'e91'
  --qubits <number>   Number of qubits/pulses to simulate (default: 1000)
  --eve <rate>        Eve interception probability 0.0 to 1.0 (default: 0.0)
  --noise <rate>      Environmental channel noise 0.0 to 1.0 (default: 0.02)
  --message <text>    Secret message to encrypt with One-Time Pad
  --help, -h          Show this help message
`);
      process.exit(0);
    }
  }

  return options;
}

function runBB84(options) {
  console.log(`\n${colors.bold}Running BB84 Protocol Simulation...${colors.reset}`);
  console.log(`  • Qubits Transmitted:   ${options.qubits}`);
  console.log(`  • Channel Noise Rate:   ${(options.noise * 100).toFixed(1)}%`);
  console.log(`  • Eve Intercept Rate:   ${(options.eve * 100).toFixed(1)}% (${options.eve > 0 ? colors.red + 'EVE ACTIVE' : colors.green + 'NO EAVESDROPPER'}${colors.reset})`);

  const result = BB84Simulation.run({
    qubits: options.qubits,
    noiseRate: options.noise,
    eveInterceptRate: options.eve
  });

  console.log(`\n${colors.bold}[1] Classical Sifting Phase:${colors.reset}`);
  console.log(`  • Raw Sifted Bits:      ${result.sifting.siftedLength} (${(result.sifting.siftingEfficiency * 100).toFixed(1)}% basis match)`);

  console.log(`\n${colors.bold}[2] QBER Estimation & Security Check:${colors.reset}`);
  const qberPct = (result.qberResult.qber * 100).toFixed(2);
  const threshPct = (result.qberResult.threshold * 100).toFixed(1);
  const qberColor = result.qberResult.isSecure ? colors.green : colors.red;

  console.log(`  • Sample Size Revealed: ${result.qberResult.sampleSize} bits`);
  console.log(`  • Measured QBER:        ${qberColor}${qberPct}%${colors.reset} (Threshold: ${threshPct}%)`);
  console.log(`  • Channel Status:       ${result.qberResult.isSecure ? colors.green + '✓ SECURE CHANNEL - PROCEED' : colors.red + '⚠️ EAVESDROPPER DETECTED - ABORT!'}${colors.reset}`);

  if (result.aborted) {
    console.log(`\n${colors.red}${colors.bold}⛔ PROTOCOL ABORTED:${colors.reset} ${result.reason}`);
    console.log(`${colors.yellow}Security proof holds: Eve's interception was caught through quantum state disturbance!${colors.reset}\n`);
    return;
  }

  console.log(`\n${colors.bold}[3] Cascade Error Reconciliation:${colors.reset}`);
  console.log(`  • Parity Checks:        ${result.reconciliation.parityChecksExchanged}`);
  console.log(`  • Errors Corrected:     ${result.reconciliation.correctedBits}`);
  console.log(`  • Key Reconciled:       ${result.reconciliation.isSuccess ? colors.green + '✓ 100% BIT MATCH' : colors.yellow + 'REMAINING ERRORS'}${colors.reset}`);

  console.log(`\n${colors.bold}[4] Privacy Amplification (Toeplitz Hashing):${colors.reset}`);
  console.log(`  • Final Key Length:     ${result.sharedKeyLength} bits (${Math.floor(result.sharedKeyLength / 8)} bytes)`);
  console.log(`  • Key Checksum (Hex):   ${colors.cyan}${result.finalKey.hex.slice(0, 32)}...${colors.reset}`);
  console.log(`  • Alice & Bob Match:    ${result.keysMatch ? colors.green + '✓ IDENTICAL KEYS' : colors.red + 'MISMATCH'}${colors.reset}`);

  // One-Time Pad Demo
  console.log(`\n${colors.bold}[5] Cryptographic Application (One-Time Pad):${colors.reset}`);
  try {
    const encrypted = OneTimePad.encrypt(options.message, result.finalKey.alice);
    const decrypted = OneTimePad.decrypt(encrypted.ciphertextHex, result.finalKey.bob);

    console.log(`  • Plaintext:            "${colors.bold}${options.message}${colors.reset}"`);
    console.log(`  • Ciphertext (Hex):     ${colors.yellow}${encrypted.ciphertextHex}${colors.reset}`);
    console.log(`  • Bob Decrypted:        "${colors.green}${decrypted}${colors.reset}"`);
    console.log(`  • Verification:         ${decrypted === options.message ? colors.green + '✓ PERFECT DECRYPTION' : colors.red + 'FAILED'}${colors.reset}`);
  } catch (err) {
    console.log(`  ${colors.yellow}Notice: Message too long for generated key length. Trying AES-256-GCM session key...${colors.reset}`);
    const aesEncrypted = OneTimePad.encryptAES(options.message, result.finalKey.alice);
    const aesDecrypted = OneTimePad.decryptAES(aesEncrypted.ciphertext, aesEncrypted.iv, aesEncrypted.authTag, result.finalKey.bob);
    console.log(`  • AES-256 Ciphertext:   ${aesEncrypted.ciphertext}`);
    console.log(`  • Bob Decrypted:        "${colors.green}${aesDecrypted}${colors.reset}"`);
  }

  console.log(`\n${colors.green}${colors.bold}✨ Simulation completed successfully! ✨${colors.reset}\n`);
}

function runE91(options) {
  console.log(`\n${colors.bold}Running Ekert 91 (E91) Protocol Simulation...${colors.reset}`);
  console.log(`  • Entangled Bell Pairs: ${options.qubits}`);
  console.log(`  • Eve Intercept Rate:   ${(options.eve * 100).toFixed(1)}%`);

  const result = E91Simulation.run({
    pairs: options.qubits,
    eveInterceptRate: options.eve
  });

  console.log(`\n${colors.bold}[1] CHSH Bell Inequality Test:${colors.reset}`);
  const S = result.chsh.S.toFixed(4);
  const sColor = result.chsh.bellViolated ? colors.green : colors.red;

  console.log(`  • CHSH Parameter S:     ${sColor}${S}${colors.reset} (Classical Bound: ≤ 2.0, Quantum Max: ≈ 2.8284)`);
  console.log(`  • Bell Inequality:      ${result.chsh.bellViolated ? colors.green + '✓ VIOLATED (Genuine Quantum Entanglement)' : colors.red + '✗ NOT VIOLATED (Classical / Eavesdropped)'}${colors.reset}`);

  console.log(`\n${colors.bold}[2] Raw Key Generation (Coincident Bases):${colors.reset}`);
  console.log(`  • Sifted Key Length:    ${result.keyGeneration.rawKeyLength} bits`);
  console.log(`  • Key Error Rate:       ${(result.keyGeneration.keyErrorRate * 100).toFixed(2)}%`);
  console.log(`  • Security Status:      ${result.chsh.isSecure ? colors.green + '✓ SECURE ENTANGLED CHANNEL' : colors.red + '⚠️ CHANNEL INSECURE / EVE DETECTED'}${colors.reset}\n`);
}

function main() {
  printBanner();
  const options = parseArgs();

  if (options.protocol === 'e91') {
    runE91(options);
  } else {
    runBB84(options);
  }
}

main();
