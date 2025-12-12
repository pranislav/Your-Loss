// --- p5: small UI + render ---
let training = false;
let displayScale = 4; // 64→256
let animating = false;
let animStepsRemaining = 0;
let plotCanvas;
let lossHistory = [];
const MAX_HISTORY = 100;


function setup() {
  const leftColumn = document.getElementById("left-column");

  // Compute scale to fill height
  displayScale = Math.floor(leftColumn.clientHeight / GRID_H);

  const canvasWidth = GRID_W * displayScale;
  const canvasHeight = GRID_H * displayScale;

  const cnv = createCanvas(canvasWidth, canvasHeight);
  cnv.parent("canvas-wrapper");

  // Plot canvas uses its wrapper size
  const plotWrapper = document.getElementById("plot-wrapper");
  plotCanvas = createGraphics(plotWrapper.clientWidth, plotWrapper.clientWidth/4 || 100);

  createUI();
  createPlaceholders();

  const off = document.createElement("canvas");
  off.width = GRID_W;
  off.height = GRID_H;
  off.id = "offscreen64";
  off.style.display = "none";
  document.body.appendChild(off);

  initModel();
  resetRenderState();
}

// handle window resize dynamically
window.addEventListener("resize", () => {
  const leftColumn = document.getElementById("left-column");
  displayScale = Math.floor(leftColumn.clientHeight / GRID_H);

  resizeCanvas(GRID_W * displayScale, GRID_H * displayScale);

  const plotWrapper = document.getElementById("plot-wrapper");
  plotCanvas.resizeCanvas(plotWrapper.clientWidth, plotWrapper.clientHeight || 100);
});



function draw() {
  if (displayDirty) {
    updateDisplayData();
    drawLossPlot();
  }

  if (latestDisplayData) {
    loadPixels();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = (y * GRID_W + x) * 4;
        const r = latestDisplayData[i] * 255;
        const g = latestDisplayData[i + 1] * 255;
        const b = latestDisplayData[i + 2] * 255;

        for (let dy = 0; dy < displayScale; dy++) {
          for (let dx = 0; dx < displayScale; dx++) {
            const px = ((y * displayScale + dy) * width + (x * displayScale + dx)) * 4;
            pixels[px] = r;
            pixels[px + 1] = g;
            pixels[px + 2] = b;
            pixels[px + 3] = 255;
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


function drawLossPlot() {
  const PLOT_W = plotCanvas.width;
  const PLOT_H = plotCanvas.height;

  plotCanvas.background(0);


  plotCanvas.stroke(0, 255, 0);
  plotCanvas.noFill();
  plotCanvas.strokeWeight(2)
  plotCanvas.rect(0, 0, PLOT_W, PLOT_H);
  // plotCanvas.strokeWeight(1)

  if (lossHistory.length > 1) {
    plotCanvas.stroke(0, 255, 0);
    plotCanvas.noFill();

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

  // update displayed value in DOM
  const last = lossHistory[lossHistory.length - 1];
  if (last === undefined) return;
  const v = last < 1e-4 ? last.toExponential(2) : last.toFixed(4);
  const lossDiv = document.getElementById("loss-value");
  if (lossDiv && v !== undefined) {
    lossDiv.textContent = "Loss: " + v;
  }

  // push plotCanvas to DOM <img>
  const img = document.getElementById("plot-img");
  if (img) {
    img.src = plotCanvas.elt.toDataURL();
  }
}
