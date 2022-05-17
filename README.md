<h1 align="center">Fragment</h1>
<div align="center">A development environment for creative coding</div>
<br>

`fragment` aims to provide a simple API to work with `<canvas>`. It comes with a built-in GUI and a set of `triggers` to interact with your sketches easily.
It currently supports [Canvas 2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API), [p5.js](https://github.com/processing/p5.js/), [three.js](https://github.com/mrdoob/three.js/) and fragment shaders.

## Installation

As `fragment` is not yet available on npmjs.org, you need to clone and link the project in order to use it. It's only a few steps.

```
# clone the project
git clone https://github.com/raphaelameaume/fragment`

# move to the project directory
cd fragment

# link the project
npm link
``` 

Let's create a new directory for your sketches.

```
cd ../
mkdir sketches
cd sketches
npm init
```

You should now be able to run `fragment` at the root of your directory. If you encounter any issues, you can read more about linking on [npmjs.com](https://docs.npmjs.com/cli/v8/commands/npm-link).

## Usage

```
# create a sketch from a template
fragment ./sketch.js --new --template=2d
```

Learn more about the available flag options in the [CLI docs](./docs/API.md#cli).

## Example

This is an example of a sketch drawing a blue circle on a black background with a custom control for the radius of the circle.

```js
export let props = {
  radius: {
    value: 10,
    params: {
      min: 4,
      max: 30
    }
  }
};

export let update = ({ context, width, height }) => {
  // draw background
  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, height);

  // draw circle
  const radius = props.radius.value;

  context.fillStyle = '#0000ff';
  context.beginPath();
  context.arc(width * 0.5, height * 0.5, radius, 0, 2 * Math.PI, false);
  context.fill();
};
```

Learn how to write your own sketch in the [API docs](./docs/API.md#sketch) or read the [examples](./examples/).

## Motivation

This project started a few years ago.

## Contributing

If you find issues, please [file one](https://github.com/raphaelameaume/fragment/issues) with details on how to reproduce it.

As for new features, I'm not looking into contributors for now, I'm moving at my own pace on this personal project.

Feel free to reach out on [Twitter](https://twitter.com/raphaelameaume) if you want to discuss the project.

## Credits

- [Vite.js](https://vitejs.dev/)
- [Svelte](https://svelte.dev/)
- The font used for display is the [JetBrains Mono](https://www.jetbrains.com/lp/mono/).
- A special thanks to [Matt Deslauriers](https://www.mattdesl.com/) for [canvas-sketch](https://github.com/mattdesl/canvas-sketch) and his multiple projects around generative-art tools.
