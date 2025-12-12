function createUI() {
  const panel = document.getElementById("ui-panel");

  addButton(panel, "Toggle Growth (space)", () => triggerKey(" "));
  addButton(panel, "Grow Once (g)", () => triggerKey("g"));
  addButton(panel, "Reset Cells (r)", () => triggerKey("r"));
  addButton(panel, "Toggle Training (t)", () => triggerKey("t"));
  addButton(panel, "Reset Params (p)", () => triggerKey("p"));
  addButton(panel, "Fixed Steps (f)", () => triggerKey("f"));

}

function createPlaceholders() {
  // LOSS PANEL placeholders
  const loss = document.getElementById("loss-panel");
  addSlider(loss, {
    label: "Edge Density",
    min: 0,
    max: 1,
    step: 0.01,
    value: EDGE_TARGET,
    onChange: (v) => EDGE_TARGET = parseFloat(v),
  });

  // SAVE/LOAD
  const sl = document.getElementById("save-load-panel");
  sl.append(document.createTextNode("TODO: save/load buttons"));

  // PRESETS
  const pr = document.getElementById("presets-panel");
  pr.append(document.createTextNode("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Why do we use it?It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).Where does it come fromContrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of de Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, Lorem ipsum dolor sit amet.., comes from a line in section 1.10.32.The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from de Finibus Bonorum et Malorum by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham."));
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
