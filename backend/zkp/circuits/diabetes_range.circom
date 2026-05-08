pragma circom 2.0.0;

/*
 * Diabetes Range Proof Circuit (Option 2: Integrity Proof)
 * 
 * Proves that patient health inputs fall within valid medical ranges.
 * Outputs the validated values as public signals so the backend ML
 * model can use them after verifying the proof.
 *
 * Scaling (Circom only supports integers):
 *   BMI:                     multiplied by 10   (e.g. 24.5 → 245)
 *   DiabetesPedigreeFunction: multiplied by 1000 (e.g. 0.52 → 520)
 *   All other fields:         integer values as-is
 */

// Decomposes `in` into `n` bits.
// Implicitly constrains 0 <= in < 2^n.
template Num2Bits(n) {
    signal input in;
    signal output out[n];

    var lc = 0;
    var e2 = 1;
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc += out[i] * e2;
        e2 = e2 + e2;
    }
    lc === in;
}

// Proves 0 <= in <= maxVal.
// Requires maxVal < 2^n.
template RangeProof(n) {
    signal input in;
    signal input maxVal;

    // in fits in n bits  →  0 <= in < 2^n
    component lower = Num2Bits(n);
    lower.in <== in;

    // (maxVal - in) fits in n bits  →  in <= maxVal
    component upper = Num2Bits(n);
    upper.in <== maxVal - in;
}

template DiabetesRangeProof() {
    // ── Private inputs (patient health data) ──────────────────────
    signal input pregnancies;          // integer
    signal input glucose;              // integer  mg/dL
    signal input bloodPressure;        // integer  mm Hg
    signal input skinThickness;        // integer  mm
    signal input insulin;              // integer  mu U/ml
    signal input bmi;                  // scaled ×10
    signal input diabetesPedigree;     // scaled ×1000
    signal input age;                  // integer  years

    // ── Public outputs (proven-valid values for ML model) ─────────
    signal output outPregnancies;
    signal output outGlucose;
    signal output outBloodPressure;
    signal output outSkinThickness;
    signal output outInsulin;
    signal output outBmi;
    signal output outDiabetesPedigree;
    signal output outAge;

    // ── Range checks ──────────────────────────────────────────────

    // Pregnancies: 0-20  (5 bits, 2^5 = 32)
    component rcPreg = RangeProof(5);
    rcPreg.in <== pregnancies;
    rcPreg.maxVal <== 20;

    // Glucose: 0-500  (9 bits, 2^9 = 512)
    component rcGlu = RangeProof(9);
    rcGlu.in <== glucose;
    rcGlu.maxVal <== 500;

    // Blood Pressure: 0-300  (9 bits, 2^9 = 512)
    component rcBP = RangeProof(9);
    rcBP.in <== bloodPressure;
    rcBP.maxVal <== 300;

    // Skin Thickness: 0-100  (7 bits, 2^7 = 128)
    component rcSkin = RangeProof(7);
    rcSkin.in <== skinThickness;
    rcSkin.maxVal <== 100;

    // Insulin: 0-1000  (10 bits, 2^10 = 1024)
    component rcIns = RangeProof(10);
    rcIns.in <== insulin;
    rcIns.maxVal <== 1000;

    // BMI (×10): 0-1000  (10 bits, 2^10 = 1024)
    component rcBmi = RangeProof(10);
    rcBmi.in <== bmi;
    rcBmi.maxVal <== 1000;

    // Diabetes Pedigree (×1000): 0-3000  (12 bits, 2^12 = 4096)
    component rcDPF = RangeProof(12);
    rcDPF.in <== diabetesPedigree;
    rcDPF.maxVal <== 3000;

    // Age: 0-150  (8 bits, 2^8 = 256)
    component rcAge = RangeProof(8);
    rcAge.in <== age;
    rcAge.maxVal <== 150;

    // ── Output validated values as public signals ─────────────────
    outPregnancies     <== pregnancies;
    outGlucose         <== glucose;
    outBloodPressure   <== bloodPressure;
    outSkinThickness   <== skinThickness;
    outInsulin         <== insulin;
    outBmi             <== bmi;
    outDiabetesPedigree <== diabetesPedigree;
    outAge             <== age;
}

component main = DiabetesRangeProof();
