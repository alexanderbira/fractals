# Fractals
An online viewer/generator for fractals using C → WASM for fast generation.

This is very much a work in progress.

## Building
1. Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) and add `emcc` to your `$PATH`
2. Build the project
```shell
$ npm run build
```

## Developing
**Prerequisite**: Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) and add `emcc` to your `$PATH`

- Start the Vite development server with `npm run dev`
- Re-compile the lib to WASM with `npm run build-lib`