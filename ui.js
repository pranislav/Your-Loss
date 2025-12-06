function createUI() {
  const panel = document.createElement("div");
  panel.id = "ui-panel";
  document.body.appendChild(panel);

  const title = document.createElement("h3");
  title.textContent = "Controls";
  panel.appendChild(title);

  // ORDER YOU REQUESTED:
  addButton(panel, "Toggle Growth (space)", () => triggerKey(" "));
  addButton(panel, "Grow Once (g)", () => triggerKey("g"));
  addButton(panel, "Reset Cells (r)", () => triggerKey("r"));
  addButton(panel, "Toggle Training (t)", () => triggerKey("t"));
  addButton(panel, "Reset Params (p)", () => triggerKey("p"));
  addButton(panel, "Fixed Steps (f)", () => triggerKey("f"));

  addSlider(panel, {
    label: "Edge Density",
    min: 0.0,
    max: 1.0,
    step: 0.01,
    value: EDGE_TARGET,
    onChange: (v) => EDGE_TARGET = parseFloat(v)
  });
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
