// --- NCA model (grayscale + hidden), F=8, T=10 ---
// deep magic happens here
const GRID_W = 64, GRID_H = 64;
const STATE_CH = 2;       // [V, H]
const F = 8; // conv features  
const H_DECAY = 0.99;     // hidden decay each step
let k1, b1, k2, b2;
let showHidden = false;


let latestDisplayData = null; // Uint8Array RGBA 64*64*4
let displayDirty = true;      // mark when we need refresh
let params = null;        // {k1,b1,k2,b2}
// let sobel = null;         // {kx, ky}
let renderState = null;   // [1,H,W,2] for preview/inference

function initModel() {
  if (!params) params = initiateParams();
  if (!renderState) renderState = randomState(1, GRID_H, GRID_W);
}

function initiateParams() {
  // Conv3x3: in=2, out=F
  k1 = tf.variable(tf.randomNormal([3, 3, STATE_CH, F], 0, 0.1, 'float32'));
  b1 = tf.variable(tf.zeros([F]));
  // Conv1x1 head: in=F, out=2 (delta for [V,H])
  k2 = tf.variable(tf.randomNormal([1, 1, F, STATE_CH], 0, 0.1, 'float32'));
  b2 = tf.variable(tf.zeros([STATE_CH]));
  return { k1, b1, k2, b2 };
}


function randomState(batch, h, w) {
  return tf.tidy(() => {
    const V = tf.randomUniform([batch, h, w, 1], 0, 1, 'float32');
    const H = tf.zeros([batch, h, w, 1], 'float32');
    return tf.concat([V, H], 3); // [B,H,W,2]
  });
}

function step(state) {
  // state: [B,H,W,2]
  const { k1, b1, k2, b2 } = params;
  return tf.tidy(() => {
    let x = tf.conv2d(state, k1, 1, 'same').add(b1); // [B,H,W,F]
    x = tf.relu(x);
    const delta = tf.conv2d(x, k2, 1, 'same').add(b2); // [B,H,W,2]

    const V = state.slice([0,0,0,0],[state.shape[0], state.shape[1], state.shape[2], 1]);
    const H = state.slice([0,0,0,1],[state.shape[0], state.shape[1], state.shape[2], 1]);

    const dV = delta.slice([0,0,0,0],[state.shape[0], state.shape[1], state.shape[2], 1]);
    const dH = delta.slice([0,0,0,1],[state.shape[0], state.shape[1], state.shape[2], 1]);

    const Vn = V.add(dV).clipByValue(0, 1);
    const Hn = H.mul(H_DECAY).add(dH);

    return tf.concat([Vn, Hn], 3);
  });
}

function runRollout(state, steps = T_STEPS) {
  let s = state;
  for (let i = 0; i < steps; i++) s = step(s);
  return s;
}


// Expose a one-shot inference: grows renderState by T steps
function inferOnceFullRollout() {
  const before = renderState.mean().dataSync()[0];
  renderState = tf.tidy(() => runRollout(renderState, 1));
  const after = renderState.mean().dataSync()[0];
  displayDirty = true;
}

function resetRenderState() {
  if (renderState) renderState.dispose();
  renderState = randomState(1, GRID_H, GRID_W);
  displayDirty = true;
}


async function updateDisplayData() {
  const C = tf.tidy(() => {
    const ch = showHidden ? 1 : 0; // 0 = visible, 1 = hidden
    return renderState.slice(
      [0, 0, 0, ch],
      [1, GRID_H, GRID_W, 1]
    );
  });

  const rgba = tf.tidy(() => {
    const v = showHidden
      ? C.tanh().mul(0.5).add(0.5) // map hidden to [0,1]
      : C;                         // visible already [0,1]

    let rgb = v.concat([v, v], 3);
    if (showHidden) {
      const r = v;
      const g = v;
      const b = v.mul(0.6).add(0.4);   // push mid-grays toward blue

      rgb = tf.concat([r, g, b], 3);
    }
    const a = tf.onesLike(v);
    return rgb.concat(a, 3);
  });

  latestDisplayData = await rgba.data();

  C.dispose();
  rgba.dispose();
  displayDirty = false;
}


function resetParams() {
  if (k1 && k2 && b1 && b2) {
    k1.dispose();
    b1.dispose();
    k2.dispose();
    b2.dispose();
  }
  params = initiateParams();
  console.log("model parameters reset");
}

