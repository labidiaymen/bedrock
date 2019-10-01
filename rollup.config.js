import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'lib/runner/main/ts/Runner.js',
  output: {
    file: 'dist/bedrock/www/runner/runner.js',
    format: 'iife',
    globals: {
      'jQuery': 'jQuery'
    },
  },
  context: 'window',
  plugins: [
    resolve(),
    commonjs({
      namedExports: {
        'diff-match-patch': [ 'diff_match_patch', 'DIFF_DELETE', 'DIFF_EQUAL', 'DIFF_INSERT' ]
      }
    })
  ]
};
