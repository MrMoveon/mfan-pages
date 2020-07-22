const {
    merge
} = require('./utils')
let config = {
    src: 'src',
    temp: '.temp', // 临时文件目录
    public: 'public', // 公共文件目录
    dist: 'dist', // 打包目录
    // 资源
    paths: {
        styles: 'assets/styles/*.scss',
        scripts: 'assets/scripts/*.js',
        pages: '*.html',
        images: 'assets/images/**',
        fonts: 'assets/fonts/**',
        extra: '**'
    },
    // swig模版数据
    data: {

    },
    // 静态服务配置
    serve: {
        open: true, // 自动打开浏览器
        port: 8080, //端口号
        server: {
            // 从目录中查找文件运行
            baseDir: [],
            // 匹配路由，
            // 例如在开发阶段，路径是/node_modules引用的资源，开启服务器后，会找不到资源
            // 这里需要配置路由，将/node_modules映射为当前工作目录的node_modules
            routes: {
                "/node_modules": "node_modules", //
            }
        }
    },
    supportREM: true, //是否支持rem转换
    // postss配置
    postcss: {
        browsers: [
            ">1%",
            "last 3 version",
            "ie 10"
        ],
        pxtorem: {
            rootValue: 16, // 根元素字体大小
            unitPrecision: 5, // 转换后的小数长度
            propList: ['*'], // 'font', 'font-size', 'line-height', 'letter-spacing' 哪些可以转换px的名单
            selectorBlackList: [], // 忽略转换px的名单
            replace: true,
            mediaQuery: false,
            minPixelValue: 0,
            exclude: /node_modules/i // 排除目录
        }
    },
    // 图片压缩配置
    imagemin: {
        gifsicle: {
            interlaced: true
        },
        mozjpeg: {
            quality: 75,
            progressive: true
        },
        optipng: {
            optimizationLevel: 5
        },
        svgo: {
            plugins: [{
                    removeViewBox: true,
                },
                {
                    cleanupIDs: false,
                }
            ],
        }
    }
}
// 从目录中查找文件运行

config.serve.server.baseDir = [config.temp, config.src, config.public]
try {
    let loadConfig = require(process.cwd() + '/page.config.js')
    config = merge(config, loadConfig)
} catch (error) {
    console.log(error)
}
module.exports = config