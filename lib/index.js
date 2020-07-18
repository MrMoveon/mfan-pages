const { src, dest, watch, parallel, series } = require("gulp");
const del = require("del");
const browserSync = require("browser-sync").create();
const plugins = require("gulp-load-plugins")();
plugins.sass.compiler = require("node-sass");
let config = {
  src:'src', 
  temp:'.temp', // 临时文件目录
  public:'public', // 公共文件目录
  dist:'dist', // 打包目录
  port: 8080, //端口号
  open:true,// 自动打开浏览器
  // 匹配路由，
  // 例如在开发阶段，路径是/node_modules引用的资源，开启服务器后，会找不到资源
  // 这里需要配置路由，将/node_modules映射为当前工作目录的node_modules
  routes:{
    "/node_modules": "node_modules", //
  },
  paths:{
    styles:'assets/styles/*.scss',
    scripts:'assets/scripts/*.js',
    pages:'*.html',
    images:'assets/images/**',
    fonts:'assets/fonts/**',
    extra:'**'
  }
}
try {
  let loadConfig = require(process.cwd()+'/page.config.js')
  config = Object.assign(config,loadConfig)
} catch (error) {
  console.log(error)
}
const styles = () => {
  return src(config.paths.styles, {
    base: config.src,
    cwd:config.src
  })
    .pipe(plugins.sass().on("error", plugins.sass.logError))
    .pipe(dest(config.temp))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const scripts = () => {
  return src(config.paths.scripts, {
    base: config.src,
    cwd:config.src
  })
    .pipe(
      plugins.babel({
        presets: [require("@babel/preset-env")],
      })
    )
    .pipe(dest(config.temp))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const pages = () => {
  return src(config.paths.pages, {
    base: config.src,
    cwd:config.src
  })
    .pipe(
      plugins.swig({
        data:config.data,
        defaults: {
          cache: false,
        }, // 去掉模版缓存，不去掉导致页面不更新
      })
    )
    .pipe(dest(config.temp))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const images = () => {
  return src(config.paths.images, {
    base: config.src,
    cwd:config.src
  })
  .pipe(plugins.imagemin())
    // .pipe(
    //   plugins.imagemin([
    //     plugins.imagemin.gifsicle({
    //       interlaced: true,
    //     }),
    //     plugins.imagemin.mozjpeg({
    //       quality: 75,
    //       progressive: true,
    //     }),
    //     plugins.imagemin.optipng({
    //       optimizationLevel: 5,
    //     }),
    //     plugins.imagemin.svgo({
    //       plugins: [
    //         {
    //           removeViewBox: true,
    //         },
    //         {
    //           cleanupIDs: false,
    //         },
    //       ],
    //     }),
    //   ])
    // )
    .pipe(dest(config.dist));
};
const fonts = () => {
  return src(config.paths.fonts, {
    base: config.src,
    cwd:config.src
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.dist));
};
// public 目录复制到dist中
const extra = () => {
  return src(config.paths.extra, {
    base: config.public,
  }).pipe(dest(config.dist));
};
// 清除任务
const clean = () => {
  return del([ config.dist,config.temp]);
};
// 开启服务
const serve = () => {
  // 监控文件变化，重新执行命令
  watch(config.paths.styles,{cwd:config.src}, styles);
  watch(config.paths.scripts,{cwd:config.src},scripts);
  watch(config.paths.pages,{cwd:config.src},pages);
  // 监控文件变化，重新刷新浏览器
  watch(
    [config.paths.images, config.paths.fonts],
    {cwd:config.src},
    browserSync.reload
  );
  watch(
    [config.paths.extra],
    {cwd:config.public},
    browserSync.reload
  );
  // browserSync 启动配置
  browserSync.init({
    open:config.open,
    port:config.port,
    server: {
      // 从目录中查找文件运行
      baseDir: [config.temp, config.src, config.public],
      routes: config.routes,
    },
  });
};
const useref = () => {
  return (
    src(config.paths.pages, {
      base: config.temp,
      cwd:config.temp,
    })
      .pipe(
        plugins.useref({
          searchPath: [config.temp, "."], //查找路径，从temp查找文件替换
        })
      )
      // 处理js css html
      .pipe(plugins.if(/\.js$/, plugins.uglify()))
      .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
      .pipe(
        plugins.if(
          /\.html$/,
          plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
          })
        )
      )
      .pipe(dest(config.dist))
  );
};
const compile = parallel(styles, scripts, pages);
const dev = parallel(compile, series(serve));
// 生产环境：先移除dist目录，并行处理compile, image, font, extra任务，最后才处理useref任务
const build = series(clean, parallel(compile, images, fonts, extra), useref);
module.exports = {
  styles,
  scripts,
  pages,
  images,
  fonts,
  clean,
  useref,
  dev,
  build,
};
