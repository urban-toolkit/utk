const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    
    mode: 'development',
    
    entry: {
        utk: path.resolve(__dirname, './src/index.ts')
    },

    module: {
        rules: [
            {
                test: /\.(ts|d.ts|tsx)$/, 
                use: 'ts-loader',
                include: [ path.resolve(__dirname, './src')],
                // exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                exclude: [/react-components/],
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(glsl|vs|fs)$/,
                loader: "ts-shader-loader",
            }
        ]
    },
    
    // plugins: [ new HtmlWebpackPlugin(
    //     {
    //         title: 'UtkMap',
    //         filename: 'index.html',
    //         template: path.resolve(__dirname, '../src/template.html')
    //     }
    // )],
    
    resolve: {
        extensions: ['.ts','.tsx','.js','.d.ts','.css']
    },
    
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js' 
    },
    
    devServer: {
        static: {
            directory: path.resolve(__dirname, './dist')
        },
        port: 3000,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true
    }
}