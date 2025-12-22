# Your Loss

**Your Loss** is an interactive **Neural Cellular Automaton (NCA)** where visual patterns are *grown*, not learned from data.
Check out nice_piccs folder to see what it can do, but beware, lot of the puuctures are mere products of luckily initialized nets.

Instead of training on images, the system optimizes **loss functions describing desired properties** of the final state — smoothness, contrast, brightness, correlation, frequency content — and discovers how to generate such patterns on its own.

---

## What it does

- 2D grid evolved by a **shared neural update rule**
- 1 visible grayscale channel + 1 hidden internal channel
- Same small network applied locally to every cell
- Recurrent dynamics via repeated updates
- Trained by backpropagating through time from the final state

Built with **TensorFlow.js** + **p5.js**.

---

## Neural Architecture

Each update step:

```
3×3 conv (8 channels)
↓
ReLU
↓
1×1 conv
↓
skip connection
```

The 3×3 convolution provides local perception; the skip connection stabilizes long-term growth.

---

## Training

1. Initialize grid (noise)
2. Apply NCA for N steps (≈10 during training)
3. Compute loss on final visible state
4. Backpropagate through all steps

Although trained for a fixed horizon, patterns often keep evolving and improving far beyond it.

---

## Loss-Driven Growth

There is **no dataset**.

The objective is a weighted sum of losses:

L = Σᵢ wᵢ · Lᵢ


Each loss encodes a *statistical property* of the final image.
The UI contains Weight slider (setting wᵢ) and Target slider (setting an internal parameter of particular partial loss, eg. for brightness low value pushes the net to produce darker image).
For better understanding of what the target values do, take a look at the loss formulas in the Your_Loss_Poster.pdf file.

---

## Implemented Losses

- **Laplacian smoothness** — controls roughness vs. flatness  
- **Mean brightness** — sets global intensity  
- **Global contrast (MAD)** — encourages or suppresses contrast  
- **Neighbor correlation** — promotes coherent regions  
- **Low-pass energy** — favors low spatial frequencies via Gaussian blur  

Losses can be combined and adjusted interactively.
For the exact loss formulas see Loss Functions part in the Your_Loss_Poster.pdf file.

---

## Interaction

- Live sliders for loss weights and targets
- Hidden state inspection
- Let the automaton evolve beyond training time
- Explore how abstract objectives translate into structure

---


## License

MIT
