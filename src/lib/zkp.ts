/**
 * Zero Knowledge Proof utilities for Hygieia Health Platform.
 *
 * Uses snarkjs (Groth16) to generate proofs in the browser that validate
 * patient health inputs are within valid medical ranges — without sending
 * raw values directly.  The proof + public signals are sent to the backend,
 * which verifies them before running the ML model.
 *
 * FALLBACK: If the ZKP artifacts (.wasm / .zkey) have not been compiled yet,
 * the module returns { mode: 'fallback' } so the caller can send raw data
 * to the original /predict/diabetes endpoint instead.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiabetesFormData {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  SkinThickness: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
}

export type ZKPResult =
  | { mode: 'zkp'; proof: Record<string, unknown>; publicSignals: string[] }
  | { mode: 'fallback' };

// ---------------------------------------------------------------------------
// Paths to compiled circuit artifacts served from public/zkp/
// ---------------------------------------------------------------------------

const WASM_PATH = '/zkp/diabetes_range.wasm';
const ZKEY_PATH = '/zkp/diabetes_range_final.zkey';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a static file exists by issuing a HEAD request. */
async function artifactExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Scale floating-point form values to integers for the Circom circuit.
 *   BMI                     → ×10   (1 decimal place)
 *   DiabetesPedigreeFunction → ×1000 (3 decimal places)
 *   Everything else          → Math.round
 */
function scaleInputs(data: DiabetesFormData) {
  return {
    pregnancies:       Math.round(data.Pregnancies),
    glucose:           Math.round(data.Glucose),
    bloodPressure:     Math.round(data.BloodPressure),
    skinThickness:     Math.round(data.SkinThickness),
    insulin:           Math.round(data.Insulin),
    bmi:               Math.round(data.BMI * 10),
    diabetesPedigree:  Math.round(data.DiabetesPedigreeFunction * 1000),
    age:               Math.round(data.Age),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to generate a Groth16 ZKP proof for the given diabetes form data.
 *
 * Returns `{ mode: 'zkp', proof, publicSignals }` on success, or
 * `{ mode: 'fallback' }` if ZKP artifacts are unavailable / proof fails.
 */
export async function generateDiabetesProof(
  data: DiabetesFormData,
): Promise<ZKPResult> {
  try {
    // 1. Check if compiled artifacts exist
    const [wasmOk, zkeyOk] = await Promise.all([
      artifactExists(WASM_PATH),
      artifactExists(ZKEY_PATH),
    ]);

    if (!wasmOk || !zkeyOk) {
      console.warn(
        'ZKP artifacts not found — falling back to direct prediction. ' +
        'Run build_circuit.sh to enable ZKP.',
      );
      return { mode: 'fallback' };
    }

    // 2. Load snarkjs from CDN (avoids webpack bundling issues with Node.js modules)
    const snarkjs = await loadSnarkjs();
    if (!snarkjs) {
      console.warn('Failed to load snarkjs — falling back to direct prediction.');
      return { mode: 'fallback' };
    }

    // 3. Scale inputs to integers
    const circuitInput = scaleInputs(data);

    // 4. Generate the Groth16 proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      WASM_PATH,
      ZKEY_PATH,
    );

    console.log('✓ ZKP proof generated successfully');
    return { mode: 'zkp', proof, publicSignals };
  } catch (err) {
    console.warn('ZKP proof generation failed, falling back to direct prediction:', err);
    return { mode: 'fallback' };
  }
}

// ---------------------------------------------------------------------------
// snarkjs CDN loader (avoids webpack trying to bundle Node.js modules)
// ---------------------------------------------------------------------------

const SNARKJS_CDN = 'https://cdn.jsdelivr.net/npm/snarkjs@0.7.4/build/snarkjs.min.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snarkjsCache: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSnarkjs(): Promise<any> {
  // Return cached instance
  if (snarkjsCache) return snarkjsCache;

  // Check if already loaded on window (e.g. from a previous call)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).snarkjs) {
    snarkjsCache = (window as any).snarkjs;
    return snarkjsCache;
  }

  // Load via script tag
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const script = document.createElement('script');
    script.src = SNARKJS_CDN;
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snarkjsCache = (window as any).snarkjs;
      resolve(snarkjsCache);
    };
    script.onerror = () => {
      console.warn('Failed to load snarkjs from CDN');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}
