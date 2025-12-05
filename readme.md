this is neural cellular automaton.
(most of it was vibecoded but the topic was too interesting not to try it and too complicated not to use chat GPT)
to see some results, you have to train the net yourself, the checkpoint save/load is not implemented.
the training is very quick, because the net is extremely small

=== control shortcuts ===
t - toggle training
g - grow one generation of ca
a - toggle animated growth
r - reset the state of cells (random init)
p - reset model parameters (random init)
===

there is one visible and one hidden channel (each cell has visible and hidden value)
update "rule" depend (classically) on 3x3 neighbor cell states
the rule is baked into the neural net (3x3 convolutional layer (8 kernels), ReLU, then 1x1 conv that yields the two values (visible & hidden) + skip connection) It is in fact a RNN because the net does 10 rollouts and then backpropagates the gradients all the way back.
The learning process is rather unsupervised, there are no training data, just a loss that specifies how the output should look like
my original idea was to enforce some mid-entropic result but it turned out that entropy is not differentiable
so i went for a specific edge density (based on convolution with Sobel kernels)
You can tweak the target edge density (at the top of model.js) and see what the net will learn.
It turned out it does not do much interesting stuff in the scale it was meant to operate, but if you keep updating the state, eventually interesting patterns might appear (even without the training) (but if you keep updating too much (~1000), eventually Big Black Monster will come and devour your population (which is understandable after exceeding the intended operating region by a hundred times its lenght)). Also, quite often it just collapses to very boring stuff.
So it seems as not much of a success, but now it should be easy to just play with the loss function and implement some other constraints that could yield nicer results.
(and i plan to play with that so maybe it already is implemented as you read this)

interesting thing is that the net is very sensitive to weight initialization. There could be plenty of trained net flavors. You train it for like 10 steps, some behavior emerges and no matter how long you keep training it stays very similar, you are just stuck in that local optima and there is just plenty of them. And unfortunately, lot of them are not that interesting.