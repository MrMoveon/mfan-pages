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
        styles: 'assets/styles/**/*.scss',
        scripts: 'assets/scripts/**/*.js',
        pages: '*.html',
        images: 'assets/images/**/*',
        fonts: 'assets/fonts/**/*',
        extra: '**',
        zip: '**'
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
                "node_modules": "node_modules", //
                "/public": "public", //
            }
        },
        notify: { //自定制livereload 提醒条
            styles: [
                "margin: 0",
                "padding: 5px",
                "position: fixed",
                "font-size: 10px",
                "z-index: 9999",
                "bottom: 0px",
                "right: 0px",
                "border-radius: 0",
                "border-top-left-radius: 5px",
                "background-color: rgba(60,197,31,0.5)",
                "color: white",
                "text-align: center"
            ]
        }
    },
    supportREM: false, //是否支持rem转换
    // postss配置
    postcss: {
        browsers: [
            ">1%",
            "last 3 version",
            "ie 10",
            "Android >= 4",
            "ios >= 8"
        ],
        pxtorem: {
            rootValue: 75, // 根元素字体大小
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
        open: true,
        options: {
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