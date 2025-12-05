// train.js

const optimizer = tf.train.adam(1e-3);
let trainCounter = 0;

function lossOnBatch(batchSize = 4) {
  const init = randomState(batchSize, GRID_H, GRID_W);

  let tSteps;
  if (fixed_n_steps) tSteps = MAX_T_STEPS;
  else tSteps = Math.floor(Math.random() * (MAX_T_STEPS - MIN_T_STEPS + 1)) + MIN_T_STEPS;

  const final = runRollout(init, tSteps);

  // === now fully modular ===
  const loss = computeTotalLoss({ init, final });

  init.dispose();
  final.dispose();

  return loss;
}

async function trainStep() {
  const cost = optimizer.minimize(() => lossOnBatch(4), true);
  const data = await cost.data();
  const l = data[0];

  cost.dispose();

  trainCounter++;
  displayDirty = true;

  lossHistory.push(l);
  if (lossHistory.length > MAX_HISTORY) lossHistory.shift();

  return l;
}

