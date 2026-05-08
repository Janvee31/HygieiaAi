# ZKP Setup Guide — Hygieia Health Platform

This project uses **Zero Knowledge Proofs (ZKP)** to verify patient health data integrity before running ML predictions. The ZKP circuit validates that inputs are within valid medical ranges using Groth16 proofs — raw health values never leave the browser unverified.

> **Note:** The app works without ZKP setup — it gracefully falls back to direct prediction mode. Follow these steps only when you want to enable ZKP protection.

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| **Node.js ≥ 16** | Runtime for snarkjs CLI |
| **npm** | Package manager |
| **Rust (cargo)** | Required to build circom compiler |

---

## Step-by-Step Setup

### Step 1: Install Rust

Rust is needed to compile the Circom compiler.

**Linux / macOS:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Windows:**
Download and run the installer from [https://rustup.rs](https://rustup.rs)

Verify:
```bash
cargo --version
```

---

### Step 2: Install Circom

```bash
cargo install --git https://github.com/iden3/circom.git
```

Verify:
```bash
circom --version
```

---

### Step 3: Install snarkjs globally

```bash
npm install -g snarkjs
```

Verify:
```bash
snarkjs --version
```

---

### Step 4: Build the ZKP circuit

```bash
cd backend/zkp
bash build_circuit.sh
```

This will:
1. Compile the Circom circuit → generates `.wasm` and `.r1cs`
2. Run Powers of Tau ceremony → generates `.ptau`
3. Run Groth16 trusted setup → generates `.zkey`
4. Export verification key → generates `verification_key.json`

---

### Step 5: Copy artifacts to frontend

The browser needs the `.wasm` and `.zkey` files to generate proofs client-side:

```bash
# From the project root:
mkdir -p public/zkp
cp backend/zkp/artifacts/diabetes_range_js/diabetes_range.wasm public/zkp/
cp backend/zkp/artifacts/diabetes_range_final.zkey public/zkp/
```

---

### Step 6: Install frontend dependencies

```bash
npm install
```

This pulls in the project's frontend dependencies. snarkjs is loaded from CDN at runtime — no npm package needed.

---

### Step 7: Run the app

**Frontend:**
```bash
npm run dev
```

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8001
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                     │
│                                                         │
│  1. Patient fills form (glucose, BMI, age, etc.)        │
│  2. snarkjs generates Groth16 proof locally              │
│     - Proves all inputs are in valid medical ranges     │
│     - Outputs values as public signals                  │
│  3. Sends { proof, publicSignals } to backend           │
│     (raw form values are NOT sent as plain JSON)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI (Backend)                       │
│                                                         │
│  4. Verifies proof using snarkjs CLI                    │
│     - Checks proof against verification_key.json        │
│  5. If VALID → extracts values from public signals      │
│     → runs ML model → returns prediction                │
│  6. If INVALID → returns 403 error                      │
└─────────────────────────────────────────────────────────┘
```

## Fallback Behavior

If ZKP artifacts are not compiled (steps 4-5 not done), the app automatically falls back to **Standard Mode** — form data is sent directly to `/predict/diabetes` as before. A grey lock icon on the diabetes page indicates this mode.

Once ZKP is set up, a green lock icon with **"ZK Protected"** confirms that proofs are being generated and verified.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `circom: command not found` | Run `cargo install --git https://github.com/iden3/circom.git` |
| `snarkjs: command not found` | Run `npm install -g snarkjs` |
| Build script fails on Windows | Use WSL or Git Bash to run `build_circuit.sh` |
| Grey lock icon persists | Check that `.wasm` and `.zkey` files exist in `public/zkp/` |
| Backend returns "verification key not found" | Run `build_circuit.sh` — the backend reads `backend/zkp/artifacts/verification_key.json` |
