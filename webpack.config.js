//webpack.config.js
module.exports = {
    entry: './app/main.js',
    output: {
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                exclude: /node_modules/
            },
              {
                test: /\.html$/,
                use: [
                  {
                    loader: "html-loader",
                    options: { minimize: true }
                  }
                ]
              },
              {
                test: /\.s?css$/,
                use: [
                  {
                    loader: "vue-style-loader"
                  },
                  {
                    loader: "css-loader",
                    options: {
                      sourceMap: true
                    }
                  },
                  {
                    loader: "sass-loader",
                    options: {
                      sourceMap: true
                    }
                  }
                ]
              },
              {
                test: /\.svg$/,
                loader: "svg-inline-loader"
              }
        ]
    },
    devServer: {
        port: 3000
    }
};
