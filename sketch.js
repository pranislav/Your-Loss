// --- p5: small UI + render ---
let training = false;
let displayScale = 4; // 64→256
let animating = false;
let animStepsRemaining = 0;
let plotCanvas;
let lossHistory = [];
const MAX_HISTORY = 100;

// ---- Expose controls for UI buttons ----
window.toggleTraining = () => keyPressed({ key: 't' });
window.growOnce      = () => keyPressed({ key: 'g' });
window.toggleAnimation = () => keyPressed({ key: ' ' });
window.resetParams   = () => keyPressed({ key: 'p' });
window.resetVisuals  = () => keyPressed({ key: 'r' });
window.toggleFixedSteps = () => keyPressed({ key: 'f' });

function setup() {
  const MAIN_W = 64*displayScale
  const MAIN_H = 64*displayScale
  const PLOT_W = MAIN_W;
  const PLOT_H = 100;
  createCanvas(max(MAIN_W, PLOT_W), MAIN_H + PLOT_H + 20);

  createUI();

  plotCanvas = createGraphics(PLOT_W, PLOT_H); 

  // offscreen canvas for tf.toPixels()
  const c = document.createElement('canvas');
  c.width = GRID_W; c.height = GRID_H; c.id = 'offscreen64';
  c.style.display = 'none';
  document.body.appendChild(c);

  initModel();
  resetRenderState();
}


function draw() {
  // Update pixel buffer asynchronously only when needed
  if (displayDirty) {
    updateDisplayData();
    drawLossPlot(0, 64*4+10);
  }

  // If we have a buffer → draw it
  if (latestDisplayData) {
    loadPixels();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = (y * GRID_W + x) * 4;
        const r = latestDisplayData[i] * 255;
        const g = latestDisplayData[i+1] * 255;
        const b = latestDisplayData[i+2] * 255;
        for (let dy = 0; dy < displayScale; dy++) {
          for (let dx = 0; dx < displayScale; dx++) {
            const px = ( (y*displayScale + dy) * width + (x*displayScale + dx) ) * 4;
            pixels[px] = r;
            pixels[px+1] = g;
            pixels[px+2] = b;
            pixels[px+3] = 255;
          }
        }
      }
    }
    updatePixels();
  }
}


async function keyPressed(evt) {
    const k = (evt?.key ?? key).toLowerCase();

  if (k === 't') {
    training = !training;
    if (training) {
      loopTrain()
      console.log("training start")
    }
    else {
      console.log("training stop")
    }
  }
  if (k === 'g') {
    console.log('grow');
    inferOnceFullRollout();
    displayDirty = true;
  }
  if (k === ' ') {
    animating = !animating
    if (animating) {
      console.log("Animation start");
      animateGrowth();
    }
    else {
      console.log("Animation finished");
    }
  }
  
  if (k === 'p') {
    console.log("p pressed")
    resetParams();
  }

  if (k === 'r') {
    console.log('reset visuals');
    resetRenderState();
    displayDirty = true;
  }
  
  if (k == 'f') {
    fixed_n_steps = !fixed_n_steps
    console.log('fixed number of steps: ', fixed_n_steps)
  }
  
  if (k === 'e') {
    console.log("Edge density check:");
    tf.tidy(() => {
      const val = edgeMeanFromVisible(renderState);
      val.data().then(v => console.log("edge density =", v[0]));
    });
  }

  if (k === 'v') {
    fixed_n_steps = !fixed_n_steps;
  }
}

async function loopTrain() {
  if (!training) return;  // just in case

  while (training) {
    const loss = await trainStep();
    const textLoss = loss < 1e-4 ? loss.toExponential(2) : loss.toFixed(4);

    displayDirty = true;
    await tf.nextFrame(); // let UI/event loop run, allows keypresses
  }
}

async function animateGrowth() {
  if (!animating) return;

  while (animating) {
    inferOnceFullRollout();   // 10 grow steps
    displayDirty = true;
    animStepsRemaining--;

    await new Promise(r => setTimeout(r, 100)); // 100 ms delay
  }
}

function drawLossPlotX() {
  plotCanvas.background(255, 0, 0);  // bright red
  plotCanvas.fill(0, 255, 0);        // bright green
  plotCanvas.noStroke();
  plotCanvas.rect(10, 10, 50, 50);
  image(plotCanvas, 0, 0);           // draw over main canvas for test
}

function drawLossPlot(whereX, whereY) {
  plotCanvas.strokeWeight(2);
  plotCanvas.background(0);
  plotCanvas.stroke(0, 255, 0);
  plotCanvas.noFill();

  if (lossHistory.length > 1) {
    plotCanvas.beginShape();
    const maxLoss = Math.max(...lossHistory);
    const scale = maxLoss > 0 ? plotCanvas.height / maxLoss : 1;
    for (let i = 0; i < lossHistory.length; i++) {
      const val = lossHistory[i];
      const y = plotCanvas.height - val * scale;
      const x = i * (plotCanvas.width / MAX_HISTORY);
      plotCanvas.vertex(x, y);
    }
    plotCanvas.endShape();
  }

  // Draw latest value
  if (lossHistory.length > 0) {
    const last = lossHistory[lossHistory.length - 1];
    const lbl = last < 1e-4 ? last.toExponential(2) : last.toFixed(4);
    plotCanvas.fill(255);
    plotCanvas.noStroke();
    plotCanvas.text(`Loss: ${lbl}`, 5, 12);
  }

  image(plotCanvas, whereX, whereY);
}

