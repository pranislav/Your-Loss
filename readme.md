# Your Loss


**Your Loss** is an interactive **pattern generator** built with a **neural cellular automaton**.
Local neural rules are applied recurrently, and the system is trained only through user-defined loss functions (no training data).

Instead of training on images, the system optimizes **loss functions describing desired properties** of the final state — like smoothness, contrast, brightness or neighbor correlation — and discovers how to generate patterns of such qualities on its own.
User can assign various weights to each loss and also tune their parameters.

Check out nice_piccs folder to see what it can do.

---

## What it does

- 2D grid evolved by a **shared neural update rule**
- 1 visible grayscale channel + 1 hidden internal channel
- Same small network applied locally to every cell
- Recurrent dynamics via repeated updates
- Trained by backpropagating through time from the final state

Built with **TensorFlow.js** + **p5.js**.

---

## Controll & Bit Behind the Scene

To start/stop pattern growth, click *Toggle Growth* or press space. You can also gorw just the next generation by *Grow Once* or pressing **G**. The target number of generation is 10, but interesting patterns often emerge way beyond this threshold. The growth will be governed by current state of the convolutional net. It is initialized randomly, but that can often lead to interesting patterns too. If you want to quickly explore the behavior space, you can time-to-time click *Reset Params* or press **R**, each time it will yield different patterns thanks to random initialization. You can reset state of the cells too, by clicking *Reset Cells* or pressing **R**.

Another important button is *ToggleTraining*. It starts/stops network parameter updating based on currnet loss function. The loss function can be customized using sliders on the left column which also shows current loss value. Each partial loss function has its *weight* slider telling you how big impact it will have on the final loss value, and a *target* slider -- that's the value of the loss' parameter. Role of the compound loss function is to give a feedback to the network so it can learn. It works as follows; the net produces 10 generations of cells, then the loss function take a look at the result and evalauates it. The lower the loss value is, the better the condition described by the loss function is met. This loss value is then used in backpropagation (params update) -- some mechanism is tracking how we got this value based on params value and it can figure out what changes in the params could decrease it and applies them.

Let's see an example; you want to produce purely black screen, so you set weight of the *Brightness* loss to one and the other weights to zero *or* click a *solo* button next to it. Then, you set the parameter of this loss to lowest value by pushing the slider to the left. Now you can start the learning by clicking *Toggle Training* and watch the loss decay. Each training episode will push the net parameters slightly to produce black screen in 10 steps. So once the loss is pretty low, you should be able to get dark screen by clicking *Grow Once* ten times.

I mentioned parameters in two meanings, so I'd like to point out the difference now so you won't confuse them. There are parameters of the partial loss functions which you can set by sliders and they influence the generated pattern, but just after you let the net learn under this loss. Then there are parameters, or weights, of the convolutional net. Those are the numbers that immediately determine the state of the next cells generation but you can't directly tweak them.

Once you get some nice behavior and want to be able to reproduce it, you can save the network parameters by clicking the *Save Model* button. If you later click *Load Model* and choose the one you saved, you will get similar behavior (but probably not the exact same patterns as they depend both on the update rules *and* the initial state of the cells). By clicking *Export Image* you can save the patterns you generated in png.

In the previous part I mentioned, there are two channels - one visible and one hidden. It is to improve expressibility - the cell state can bear more information this way. The hidden channel can be visualized as well though, by clicking on the cells. You may ask then, what is making it hidden? And the answer is that it is hidden from the eyes of the loss function. The net gets the feedback based solely on the visible channel, so it can use the hidden one however it needs. This channel is unbounded (in contrast to the visible one) so it is squeezed by tanh before visualizing.

Last thing you can play with is the number of cells. Use the slider at the right down corner.

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


## License

MIT
