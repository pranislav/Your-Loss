function createUI() {
  const panel = document.createElement("div");
  panel.id = "ui-panel";
  document.body.appendChild(panel);

  const title = document.createElement("h3");
  title.textContent = "Controls";
  panel.appendChild(title);

  // --- BUTTONS ---
  addButton(panel, "Toggle Training (t)", () => triggerKey("t"));
  addButton(panel, "Grow Once (g)", () => triggerKey("g"));
  addButton(panel, "Animate (space)", () => triggerKey(" "));
  addButton(panel, "Reset Params (p)", () => triggerKey("p"));
  addButton(panel, "Reset Visuals (r)", () => triggerKey("r"));
  addButton(panel, "Fixed Steps (f)", () => triggerKey("f"));

  // --- EDGE TARGET SLIDER ---
  addSlider(panel, {
    label: "Edge Density",
    min: 0.0,
    max: 1.0,
    step: 0.01,
    value: EDGE_TARGET,
    onChange: (v) => {
      EDGE_TARGET = parseFloat(v);
    }
  });
}

/* ===== Helpers ===== */
function addButton(panel, label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.onclick = onClick;
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

/* simulates key events so UI mirrors keyboard behavior  */
function triggerKey(k) {
  window.key = k;
  if (window.keyPressed) window.keyPressed();
}
