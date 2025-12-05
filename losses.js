
// losses.js
// All loss functions + feature extractors live here.

window.EDGE_TARGET = 0.40;

// -------------------------------------------
// Utilities
// -------------------------------------------

function zeroLikeScalar(x) {
  return tf.zeros([1]);
}

// Move Sobel kernels here (loss-only usage)
const sobel = {
  kx: tf.tensor4d([[-1,0,1],[-2,0,2],[-1,0,1]].flat(), [3,3,1,1], 'float32'),
  ky: tf.tensor4d([[-1,-2,-1],[0,0,0],[1,2,1]].flat(), [3,3,1,1], 'float32')
};

// Shared extractor: Edge magnitude (moved from model.js)
function edgeMeanFromVisible(state) {
  const eps = 1e-6;
  return tf.tidy(() => {
    const V = state.slice([0,0,0,0], [state.shape[0], state.shape[1], state.shape[2], 1]);
    const gx = tf.conv2d(V, sobel.kx, 1, "same");
    const gy = tf.conv2d(V, sobel.ky, 1, "same");
    const mag = gx.square().add(gy.square()).add(eps).sqrt();
    const norm = mag.div(4.0);   // normalize
    return norm.mean();
  });
}

// For Laplacian smoothness
function laplacianKernel() {
  return tf.tensor4d(
    [0,1,0, 1,-4,1, 0,1,0], [3,3,1,1], 'float32'
  );
}

// For FFT
function fft2dScalar(img) {
  // img: [B,H,W,1]
  const c = tf.complex(img, tf.zerosLike(img));
  const f = tf.spectral.fft2d(c);
  return f;
}

// -------------------------------------------
// LOSSES
// -------------------------------------------

// 1) Edge density (real implementation)
function loss_edge({ final }) {
  const edgeMean = edgeMeanFromVisible(final);
  const diff = edgeMean.sub(EDGE_TARGET);
  const out = diff.square().mean();
  edgeMean.dispose();
  diff.dispose();
  return out;
}

// 2) Laplacian Smoothness Target (placeholder)
function loss_laplacianSmooth({ final }) {
  return zeroLikeScalar(final);
}

// 3) Global Contrast (placeholder)
function loss_globalContrast({ final }) {
  return zeroLikeScalar(final);
}

// 4) Mean Brightness target (placeholder)
function loss_meanBrightness({ final }) {
  return zeroLikeScalar(final);
}

// 5) Symmetry loss (param: vertical, 4-fold, radial) (placeholder)
function loss_symmetry({ final, symmetryMode="vertical" }) {
  return zeroLikeScalar(final);
}

// 6) Neighbor Correlation Target (placeholder)
function loss_neighborCorr({ final }) {
  return zeroLikeScalar(final);
}

// 7) Fractal Self-Similarity (placeholder)
function loss_fractal({ final }) {
  return zeroLikeScalar(final);
}

// 8) FFT Frequency Preference (placeholder)
function loss_fft({ final }) {
  return zeroLikeScalar(final);
}

// -------------------------------------------
// Registry + weights
// -------------------------------------------

const LOSS_WEIGHTS = {
  edge: 1.0,
  laplacian: 0.0,
  contrast: 0.0,
  brightness: 0.0,
  symmetry: 0.0,
  neighborCorr: 0.0,
  fractal: 0.0,
  fft: 0.0,
};

const registry = {
  edge: loss_edge,
  laplacian: loss_laplacianSmooth,
  contrast: loss_globalContrast,
  brightness: loss_meanBrightness,
  symmetry: loss_symmetry,
  neighborCorr: loss_neighborCorr,
  fractal: loss_fractal,
  fft: loss_fft,
};

// -------------------------------------------
// Total loss
// -------------------------------------------

function computeTotalLoss({ init, final, symmetryMode="vertical" }) {
  let total = null;

  for (const name in registry) {
    const w = LOSS_WEIGHTS[name];
    if (!w) continue;

    const fn = registry[name];

    const l = (name === "symmetry")
      ? fn({ init, final, symmetryMode })
      : fn({ init, final });

    const weighted = l.mul(w);

    if (total === null) total = weighted;
    else total = total.add(weighted);
  }

  if (total === null) total = tf.zeros([1]);
  return total;
}


