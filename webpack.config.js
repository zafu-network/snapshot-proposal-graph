const webpack = require("webpack");

module.exports = {
  module: {
    rules: [
      {
        use: 'raw-loader',
        test: /\.glsl$/,
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    fallback: {
      stream: require.resolve("stream-browserify"),
      zlib: require.resolve("browserify-zlib"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      process: require.resolve("process/browser"),
    },
  },
  plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
