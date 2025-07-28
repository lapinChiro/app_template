import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['react', 'react-dom'],
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: './tsconfig.json',
});