
// losses.js
// All loss functions + feature extractors live here.

window.EDGE_TARGET = 0.40;
window.LAPLACIAN_TARGET = 0.0;
window.CONTRAST_TARGET = 0.0001;
window.BRIGHTNESS_TARGET = 0.3;
window.NEIGHBOR_CORR_TARGET = 0.9; // tune ~1e-3 – 1e-1
window.LOWPASS_SIGMA = 1.5;     // blur scale (frequency cutoff)
window.LOWPASS_TARGET = 0.05;  // how much low-frequency content

window.SOLO_LOSSES = new Set();


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

function gaussianKernel1D(sigma) {
  const radius = Math.ceil(3 * sigma);
  const size = radius * 2 + 1;
  const vals = [];

  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    vals.push(v);
    sum += v;
  }

  return tf.tensor1d(vals.map(v => v / sum), 'float32');
}


// -------------------------------------------
// LOSSES
// -------------------------------------------

// 1) Edge density
function loss_edge({ final }) {
  const edgeMean = edgeMeanFromVisible(final);
  const diff = edgeMean.sub(EDGE_TARGET);
  const out = diff.square().mean();
  edgeMean.dispose();
  diff.dispose();
  return out;
}

// 2) Laplacian Smoothness
function loss_laplacianSmooth({ final }) {
  return tf.tidy(() => {
    const V = final.slice(
      [0, 0, 0, 0],
      [final.shape[0], final.shape[1], final.shape[2], 1]
    );

    const lap = tf.conv2d(V, laplacianKernel(), 1, "same");
    const energy = lap.square().mean().div(16.0);

    const diff = energy.sub(LAPLACIAN_TARGET);
    return diff.square();
  });
}

// 3) Global Contrast
function loss_globalContrast({ final }) {
  return tf.tidy(() => {
    const V = final.slice(
      [0,0,0,0],
      [final.shape[0], final.shape[1], final.shape[2], 1]
    );

    const mean = V.mean();
    const mad = V.sub(mean).abs().mean();
    return mad.sub(CONTRAST_TARGET).square();
  });
}

// 4) Mean Brightness target
function loss_meanBrightness({ final }) {
  return tf.tidy(() => {
    const V = final.slice(
      [0, 0, 0, 0],
      [final.shape[0], final.shape[1], final.shape[2], 1]
    );

    const mean = V.mean();
    const diff = mean.sub(BRIGHTNESS_TARGET);
    return diff.square();
  });
}


// 5) Symmetry loss (param: vertical, 4-fold, radial) (placeholder)
function loss_symmetry({ final, symmetryMode="vertical" }) {
  return zeroLikeScalar(final);
}

// 6) Neighbor Correlation Target
function loss_neighborCorr({ final }) {
  return tf.tidy(() => {
    const [B, H, W, C] = final.shape;

    const V = final.slice([0, 0, 0, 0], [B, H, W, 1]);

    // Horizontal neighbors
    const V0x = V.slice([0, 0, 0, 0], [B, H, W - 1, 1]);
    const V1x = V.slice([0, 0, 1, 0], [B, H, W - 1, 1]);

    // Vertical neighbors
    const V0y = V.slice([0, 0, 0, 0], [B, H - 1, W, 1]);
    const V1y = V.slice([0, 1, 0, 0], [B, H - 1, W, 1]);

    const dx = V0x.sub(V1x).square().mean();
    const dy = V0y.sub(V1y).square().mean();

    const corr = dx.add(dy);
    const diff = corr.sub(NEIGHBOR_CORR_TARGET);

    return diff.square();
  });
}



// 7) Fractal Self-Similarity (placeholder)
function loss_fractal({ final }) {
  return zeroLikeScalar(final);
}

// 8) Lowpass Frequency Preference
function loss_lowpass({ final }) {
  return tf.tidy(() => {
    const [B, H, W, C] = final.shape;
    const V = final.slice([0,0,0,0], [B,H,W,1]);

    const k = gaussianKernel1D(LOWPASS_SIGMA);

    // horizontal blur
    const kx = k.reshape([1, k.size, 1, 1]);
    const blurX = tf.conv2d(V, kx, 1, "same");

    // vertical blur
    const ky = k.reshape([k.size, 1, 1, 1]);
    const blur = tf.conv2d(blurX, ky, 1, "same");

    const energy = blur.square().mean();
    const diff = energy.sub(LOWPASS_TARGET);

    return diff.square();
  });
}


// -------------------------------------------
// Registry + weights
// -------------------------------------------

const LOSS_WEIGHTS = {
  edge: 0.0,
  laplacian: 0.0,
  contrast: 0.0,
  brightness: 0.0,
  symmetry: 0.0,
  neighborCorr: 0.0,
  fractal: 0.0,
  blur: 1.0,
};

const registry = {
  edge: loss_edge,
  laplacian: loss_laplacianSmooth,
  contrast: loss_globalContrast,
  brightness: loss_meanBrightness,
  symmetry: loss_symmetry,
  neighborCorr: loss_neighborCorr,
  fractal: loss_fractal,
  blur: loss_lowpass,
};

// -------------------------------------------
// Total loss
// -------------------------------------------

function computeTotalLoss({ init, final, symmetryMode="vertical" }) {
  let total = null;
  const useSolo = SOLO_LOSSES.size > 0;

  for (const name in registry) {

    // SOLO LOGIC
    if (useSolo && !SOLO_LOSSES.has(name)) continue;

    const w = LOSS_WEIGHTS[name];
    if (!w) continue;

    const fn = registry[name];
    const l = (name === "symmetry")
      ? fn({ init, final, symmetryMode })
      : fn({ init, final });

    const weighted = l.mul(w);
    total = total ? total.add(weighted) : weighted;
  }

  return total ?? tf.zeros([1]);
}
