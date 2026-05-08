#!/bin/bash
set -e

#======================================================================
# Diabetes ZKP Circuit — Build Script
#
# Compiles the Circom circuit, runs trusted setup (Powers of Tau +
# Groth16), and exports the verification key.
#
# Output artifacts:
#   artifacts/diabetes_range_js/diabetes_range.wasm  (browser proving)
#   artifacts/diabetes_range_final.zkey              (browser proving)
#   artifacts/verification_key.json                  (backend verify)
#======================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Diabetes ZKP Circuit — Build Pipeline"
echo "============================================"
echo ""

# ── Dependency checks ──────────────────────────────────────────────

# 1. Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "  Install it from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# 2. npm
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "✓ npm $(npm --version)"

# 3. circom
if ! command -v circom &> /dev/null; then
    echo ""
    echo "ERROR: circom is not installed."
    echo ""
    echo "  To install circom you need Rust first:"
    echo "    1. Install Rust:  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "       (or visit https://rustup.rs)"
    echo "    2. Restart your terminal so 'cargo' is on PATH"
    echo "    3. Install circom:  cargo install --git https://github.com/iden3/circom.git"
    echo ""
    echo "  After installation, re-run this script."
    exit 1
fi
echo "✓ circom $(circom --version 2>&1 | head -1)"

# 4. snarkjs (install globally if missing)
if ! command -v snarkjs &> /dev/null; then
    echo ""
    echo "snarkjs not found globally — installing now..."
    npm install -g snarkjs
    echo ""
fi
echo "✓ snarkjs $(snarkjs --version 2>&1 | head -1 || echo 'installed')"

# ── Create output directory ───────────────────────────────────────

mkdir -p artifacts

# ── Step 1: Compile the circuit ───────────────────────────────────

echo ""
echo "[1/5] Compiling Circom circuit..."
circom circuits/diabetes_range.circom \
    --r1cs \
    --wasm \
    --sym \
    -o artifacts

echo "  → R1CS, WASM, and SYM files generated."

# ── Step 2: Powers of Tau ceremony ────────────────────────────────

echo ""
echo "[2/5] Running Powers of Tau ceremony (BN128, 2^12)..."
snarkjs powersoftau new bn128 12 artifacts/pot12_0000.ptau -v
snarkjs powersoftau contribute artifacts/pot12_0000.ptau artifacts/pot12_0001.ptau \
    --name="Hygieia Health ZKP" -v -e="hygieia health platform zkp entropy $(date +%s)"
snarkjs powersoftau prepare phase2 artifacts/pot12_0001.ptau artifacts/pot12_final.ptau -v

echo "  → Powers of Tau ceremony complete."

# ── Step 3: Groth16 setup ─────────────────────────────────────────

echo ""
echo "[3/5] Running Groth16 trusted setup..."
snarkjs groth16 setup \
    artifacts/diabetes_range.r1cs \
    artifacts/pot12_final.ptau \
    artifacts/diabetes_range_0000.zkey

snarkjs zkey contribute artifacts/diabetes_range_0000.zkey artifacts/diabetes_range_final.zkey \
    --name="Hygieia Contributor" -v -e="diabetes range proof contribution $(date +%s)"

echo "  → Groth16 proving key generated."

# ── Step 4: Export verification key ───────────────────────────────

echo ""
echo "[4/5] Exporting verification key..."
snarkjs zkey export verificationkey \
    artifacts/diabetes_range_final.zkey \
    artifacts/verification_key.json

echo "  → verification_key.json exported."

# ── Step 5: Summary ──────────────────────────────────────────────

echo ""
echo "[5/5] Build complete! Artifacts:"
echo ""
ls -lh artifacts/diabetes_range_js/diabetes_range.wasm 2>/dev/null || echo "  (wasm file)"
ls -lh artifacts/diabetes_range_final.zkey 2>/dev/null || echo "  (zkey file)"
ls -lh artifacts/verification_key.json 2>/dev/null || echo "  (vkey file)"
echo ""
echo "============================================"
echo "  Next steps:"
echo "  1. Copy browser artifacts to public/zkp/:"
echo "     cp artifacts/diabetes_range_js/diabetes_range.wasm ../../public/zkp/"
echo "     cp artifacts/diabetes_range_final.zkey ../../public/zkp/"
echo "  2. Start the app normally (npm run dev + uvicorn)"
echo "============================================"
