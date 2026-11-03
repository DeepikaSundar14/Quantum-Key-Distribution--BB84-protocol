/**
 * Pure Node.js Git Repository Initializer (zero dependencies).
 * Generates valid Git object database (.git/objects), HEAD, and commits.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const GIT_DIR = path.join(REPO_ROOT, '.git');

// Try system git first
function trySystemGit() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    console.log('[+] System git detected. Initializing with git CLI...');
    execSync('git init -b main', { cwd: REPO_ROOT, stdio: 'inherit' });
    execSync('git add .', { cwd: REPO_ROOT, stdio: 'inherit' });
    execSync('git commit -m "feat: initial Quantum Key Distribution (QKD) framework"', { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log('[✓] Git repository successfully initialized and committed with git CLI.');
    return true;
  } catch (err) {
    return false;
  }
}

// Pure JS fallback
function writeGitObject(type, data) {
  const header = `${type} ${data.length}\0`;
  const store = Buffer.concat([Buffer.from(header, 'binary'), data]);
  const sha = crypto.createHash('sha1').update(store).digest('hex');

  const dir = path.join(GIT_DIR, 'objects', sha.slice(0, 2));
  const file = path.join(dir, sha.slice(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(file)) {
    const compressed = zlib.deflateSync(store);
    fs.writeFileSync(file, compressed);
  }

  return sha;
}

function writeBlob(filePath) {
  const content = fs.readFileSync(filePath);
  return writeGitObject('blob', content);
}

function writeTree(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => e.name !== '.git' && e.name !== 'node_modules');

  // Git requires entries sorted by name (directories sorted with trailing slash)
  entries.sort((a, b) => {
    const nameA = a.isDirectory() ? a.name + '/' : a.name;
    const nameB = b.isDirectory() ? b.name + '/' : b.name;
    return nameA.localeCompare(nameB);
  });

  const treeBuffers = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    let mode, sha;

    if (entry.isDirectory()) {
      mode = '40000';
      sha = writeTree(fullPath);
    } else {
      mode = '100644';
      sha = writeBlob(fullPath);
    }

    const shaBuf = Buffer.from(sha, 'hex');
    const header = Buffer.from(`${mode} ${entry.name}\0`, 'binary');
    treeBuffers.push(Buffer.concat([header, shaBuf]));
  }

  const treeData = Buffer.concat(treeBuffers);
  return writeGitObject('tree', treeData);
}

function initPureGit() {
  console.log('[*] System git CLI not found in PATH. Creating native Git repository via Node engine...');

  fs.mkdirSync(path.join(GIT_DIR, 'objects'), { recursive: true });
  fs.mkdirSync(path.join(GIT_DIR, 'refs', 'heads'), { recursive: true });
  fs.mkdirSync(path.join(GIT_DIR, 'refs', 'tags'), { recursive: true });

  fs.writeFileSync(path.join(GIT_DIR, 'HEAD'), 'ref: refs/heads/main\n');
  fs.writeFileSync(path.join(GIT_DIR, 'config'), `[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false\n\tlogallrefupdates = true\n\tsymlinks = false\n\tignorecase = true\n`);
  fs.writeFileSync(path.join(GIT_DIR, 'description'), 'Unnamed repository; edit this file to name the repository.\n');

  // Build tree
  const treeSha = writeTree(REPO_ROOT);

  // Author & Committer timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const timezone = '+0000';
  const author = `Quantum Dev <quantum@qkd.local> ${timestamp} ${timezone}`;
  const commitMsg = "feat: initial Quantum Key Distribution (QKD) framework\n\n- Implemented BB84 protocol (Alice, Bob, Eve, sifting, QBER)\n- Implemented E91 protocol with CHSH Bell Inequality test\n- Added Cascade error reconciliation and Toeplitz privacy amplification\n- Integrated One-Time Pad & AES-256-GCM encryption\n- Interactive Web Lab visualizer and automated CI workflows\n";

  const commitData = Buffer.from(
    `tree ${treeSha}\nauthor ${author}\ncommitter ${author}\n\n${commitMsg}`
  );
  const commitSha = writeGitObject('commit', commitData);

  // Update refs/heads/main
  fs.writeFileSync(path.join(GIT_DIR, 'refs', 'heads', 'main'), commitSha + '\n');

  console.log(`[✓] Native Git repository initialized successfully!`);
  console.log(`    Commit SHA: ${commitSha}`);
  console.log(`    Branch: main`);
}

function main() {
  if (!trySystemGit()) {
    initPureGit();
  }
}

main();

