// ui.js
function createUI({
  onToggleTraining,
  onGrowOnce,
  onToggleAnimation,
  onResetParams,
  onResetState,
  onToggleFixedSteps,
  onCheckEdge,
  onRandomRolloutLengthChange
}) {
  const panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.top = "10px";
  panel.style.left = "10px";
  panel.style.padding = "10px";
  panel.style.background = "#111";
  panel.style.color = "#0f0";
  panel.style.fontFamily = "monospace";
  panel.style.fontSize = "14px";
  panel.style.border = "1px solid #0f0";
  panel.style.width = "200px";
  panel.style.userSelect = "none";
  document.body.appendChild(panel);

  function addButton(label, handler) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.display = "block";
    btn.style.width = "100%";
    btn.style.margin = "4px 0";
    btn.style.background = "#000";
    btn.style.color = "#0f0";
    btn.style.border = "1px solid #0f0";
    btn.style.padding = "4px";
    btn.style.fontFamily = "monospace";
    btn.onclick = handler;
    panel.appendChild(btn);
  }

  // --- Buttons mapped to your key presses ---
  addButton("Toggle Training (t)", onToggleTraining);
  addButton("Grow Once (g)", onGrowOnce);
  addButton("Toggle Animation (space)", onToggleAnimation);
  addButton("Reset Net Params (p)", onResetParams);
  addButton("Reset CA State (r)", onResetState);
  addButton("Toggle Fixed Steps (f)", onToggleFixedSteps);
  addButton("Check Edge Density (e)", onCheckEdge);

  // --- Slider for rollout length ---
  const sliderLabel = document.createElement("div");
  sliderLabel.innerText = "Rollout Length";
  sliderLabel.style.marginTop = "8px";
  panel.appendChild(sliderLabel);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 1;
  slider.max = 200;
  slider.value = 30;
  slider.style.width = "100%";
  slider.oninput = () => onRandomRolloutLengthChange(slider.value);
  panel.appendChild(slider);
}
