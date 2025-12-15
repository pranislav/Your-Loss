function createUI() {
  const panel = document.getElementById("ui-panel");

  addButton(panel, "Toggle Growth (space)", () => triggerKey(" "));
  addButton(panel, "Grow Once (g)", () => triggerKey("g"));
  addButton(panel, "Reset Cells (r)", () => triggerKey("r"));
  addButton(panel, "Toggle Training (t)", () => triggerKey("t"));
  addButton(panel, "Reset Params (p)", () => triggerKey("p"));
  // addButton(panel, "Fixed Steps (f)", () => triggerKey("f"));

}

function createCellsNumPanel() {
  const panel = document.getElementById("cells-num-panel");
  
  addSlider(panel, {
    label: "Grid Size",
    min: 16,
    max: 128,
    step: 1,
    value: GRID_W,
    onChange: v => {
      GRID_W = GRID_H = parseInt(v);
      resizeGridCanvas();
    },
  });
}

function resizeGridCanvas() {
  // compute new scale to fill left column height
  const leftColumn = document.getElementById("left-column");
  displayScale = Math.floor(leftColumn.clientHeight / GRID_H);

  const canvasWidth = GRID_W * displayScale;
  const canvasHeight = GRID_H * displayScale;

  // p5 canvas resize
  resizeCanvas(canvasWidth, canvasHeight);

  // recreate renderState to match new GRID_W/H
  if (renderState) renderState.dispose();
  resetRenderState();
}


function createLossControls() {
  const panel = document.getElementById("loss-panel");
  panel.innerHTML = "";

  const header = document.createElement("h3");
  header.textContent = "Losses";
  panel.appendChild(header);

  addLossBlock(panel, {
    name: "Edge",
    key: "edge",
    params: [{
      label: "Target",
      min: 0, max: 1, step: 0.01,
      value: EDGE_TARGET,
      onChange: v => EDGE_TARGET = parseFloat(v),
    }]
  });

  addLossBlock(panel, {
    name: "Smoothness (Laplacian)",
    key: "laplacian",
    params: [{
      label: "Target",
      min: 0, max: 1, step: 0.01,
      value: LAPLACIAN_TARGET,
      onChange: v => LAPLACIAN_TARGET = parseFloat(v),
    }]
  });

  addLossBlock(panel, {
    name: "Contrast",
    key: "contrast",
    params: [{
      label: "Target",
      min: 0, max: 1, step: 0.0001,
      value: CONTRAST_TARGET,
      onChange: v => CONTRAST_TARGET = parseFloat(v),
    }]
  });

  addLossBlock(panel, {
    name: "Brightness",
    key: "brightness",
    params: [{
      label: "Target",
      min: 0, max: 1, step: 0.01,
      value: BRIGHTNESS_TARGET,
      onChange: v => BRIGHTNESS_TARGET = parseFloat(v),
    }]
  });

  // symmetry loss is not working
  // addLossBlock(panel, {
  //   name: "symmetry",
  //   label: "Symmetry",
  //   weight: {
  //     min: 0,
  //     max: 1,
  //     step: 0.01,
  //     default: 0.0
  //   },
  // });


  addLossBlock(panel, {
    name: "Neighbor Correlation",
    key: "neighborCorr",
    params: [{
      label: "Target",
      min: 0, max: 0.1, step: 0.001,
      value: NEIGHBOR_CORR_TARGET,
      onChange: v => NEIGHBOR_CORR_TARGET = parseFloat(v),
    }]
  });

  addLossBlock(panel, {
    name: "lowpass",
    key: "blur",
    params: [{
      label: "Target",
      min: 1, max: 50, step: 1,
      value: LOWPASS_SIGMA,
      onChange: v => LOWPASS_SIGMA = parseFloat(v),
    }]
  });
}


function createSaveLoad() {
  const sl = document.getElementById("save-load-panel");
  addButton(sl, "Save Model", () => triggerKey("s"));
  addButton(sl, "Load Model", () => triggerKey("l"));
  addButton(sl, "Export Image", () => triggerKey("e"));
}


/* -------- Helpers -------- */

function addButton(panel, label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;

  // prevent space/enter triggering the button
  btn.onkeydown = (e) => {
    if (e.key === " " || e.key === "Enter") e.preventDefault();
  };

  btn.onclick = (e) => {
    e.target.blur();  // remove focus to avoid space activating it
    onClick();
  };

  panel.appendChild(btn);
}

function addSlider(panel, { label, min, max, step, value, onChange }) {
  const block = document.createElement("div");
  block.className = "ui-slider-block";

  const lbl = document.createElement("label");
  lbl.textContent = label;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = value;
  slider.oninput = (e) => onChange(e.target.value);

  block.appendChild(lbl);
  block.appendChild(slider);
  panel.appendChild(block);
}

/* Call p5 keyPressed correctly */
function triggerKey(k) {
  key = k;                 // update p5’s global key
  if (typeof keyPressed === "function") {
    keyPressed();
  }
}


function addLossBlock(panel, cfg) {
  const block = document.createElement("div");
  block.className = "panel-sub-block";

  // header: name + solo
  const header = document.createElement("div");
  header.className = "loss-header";

  const title = document.createElement("div");
  title.className = "loss-title";
  title.textContent = cfg.name;

  const solo = document.createElement("button");
  solo.className = "loss-solo";
  solo.textContent = "solo";
  solo.onclick = () => {
    const k = cfg.key;

    if (SOLO_LOSSES.has(k)) {
      SOLO_LOSSES.delete(k);
      solo.classList.remove("active");
    } else {
      SOLO_LOSSES.add(k);
      solo.classList.add("active");
    }
  };

  header.appendChild(title);
  header.appendChild(solo);
  block.appendChild(header);

  // weight slider (always present)
  addSlider(block, {
    label: "Weight",
    min: 0,
    max: 1,
    step: 0.01,
    value: LOSS_WEIGHTS[cfg.key],
    onChange: v => LOSS_WEIGHTS[cfg.key] = parseFloat(v),
  });

  // optional parameter sliders
  if (cfg.params) {
    cfg.params.forEach(p => addSlider(block, p));
  }

  panel.appendChild(block);
}
