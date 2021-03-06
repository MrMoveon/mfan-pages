const {
  src,
  dest,
  watch,
  parallel,
  series
} = require("gulp");
const del = require("del");
const autoprefixer = require('autoprefixer');
const browserSync = require("browser-sync").create();
const plugins = require("gulp-load-plugins")();
plugins.sass.compiler = require("node-sass");
const config = require('./config')
const styles = () => {
  return src(config.paths.styles, {
      base: config.src,
      cwd: config.src,
      sourcemaps: true
    })
    .pipe(plugins.plumber({
      errorHandler: plugins.sass.logError
    }))
    .pipe(plugins.cached('styles'))
    .pipe(plugins.sass())
    .pipe(plugins.postcss([
      autoprefixer({
        overrideBrowserslist: config.postcss.browsers
      })
    ]))
    // 处理px2rem
    .pipe(plugins.if(config.supportREM, plugins.pxtorem(config.postcss.pxtorem)))
    .pipe(dest(config.temp, {
      sourcemaps: '.'
    }))

    .pipe(
      browserSync.reload({
        stream: true,
      })
    )
}
const scripts = () => {
  return src(config.paths.scripts, {
      base: config.src,
      cwd: config.src,
      sourcemaps: true
    })
    .pipe(plugins.plumber())
    .pipe(plugins.cached('scripts'))
    .pipe(plugins.babel({
      presets: [require("@babel/preset-env")],
    }))
    .pipe(dest(config.temp, {
      sourcemaps: '.'
    }))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const pages = () => {
  return src(config.paths.pages, {
      base: config.src,
      cwd: config.src
    })
    .pipe(plugins.plumber())
    .pipe(plugins.cached('pages'))
    .pipe(
      plugins.swig({
        data: config.data,
        defaults: {
          cache: false,
        } // 去掉模版缓存，不去掉导致页面不更新
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
      cwd: config.src
    })
    .pipe(plugins.plumber())
    .pipe(
      plugins.if(config.imagemin.open, plugins.imagemin([
        plugins.imagemin.gifsicle(config.imagemin.options.gifsicle),
        plugins.imagemin.mozjpeg(config.imagemin.options.mozjpeg),
        plugins.imagemin.optipng(config.imagemin.options.optipng),
        plugins.imagemin.svgo(config.imagemin.options.svgo),
      ]))
    )
    .pipe(dest(config.dist));
};
const fonts = () => {
  return src(config.paths.fonts, {
      base: config.src,
      cwd: config.src
    })
    .pipe(plugins.plumber())
    .pipe(plugins.if(config.imagemin.open, plugins.imagemin()))
    .pipe(dest(config.dist));
};
// public 目录复制到dist中
const extra = () => {
  return src(config.paths.extra, {
      base: config.public,
      cwd: config.public
    })
    .pipe(plugins.plumber())
    .pipe(dest(config.dist));
};
// 清除任务
const clean = () => {
  return del([config.dist, config.temp]);
};
// 开启服务
const serve = () => {
  // 监控文件变化，重新执行命令
  watch(config.paths.styles, {
    cwd: config.src
  }, styles);
  watch(config.paths.scripts, {
    cwd: config.src
  }, scripts);
  watch(config.paths.pages, {
    cwd: config.src
  }, pages);
  // 监控文件变化，重新刷新浏览器
  watch(
    [config.paths.images, config.paths.fonts], {
      cwd: config.src
    },
    browserSync.reload
  );
  watch(
    [config.paths.extra], {
      cwd: config.public
    },
    browserSync.reload
  );
  // browserSync 启动配置
  browserSync.init(config.serve);
  // browserSync.init({
  //   port: 8080, //端口号
  //   open: true, // 自动打开浏览器
  //   server: {
  //     // 从目录中查找文件运行
  //     baseDir: [config.temp, config.src, config.public],
  //     // 匹配路由，
  //     // 例如在开发阶段，路径是/node_modules引用的资源，开启服务器后，会找不到资源
  //     // 这里需要配置路由，将/node_modules映射为当前工作目录的node_modules
  //     routes: {
  //       "/node_modules": "node_modules", //
  //     }
  //   }
  // });
};
const useref = () => {
  return (
    src(config.paths.pages, {
      base: config.temp,
      cwd: config.temp,
    })
    .pipe(plugins.plumber())
    .pipe(
      plugins.useref({
        searchPath: [".", '..'] //查找路径，从[.,..]当前目录和上一级目录查找文件，配置不对，下面的资源压缩不会生效输出
      })
    )
    // 处理js css html
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    // 给js资源增加hash值
    .pipe(plugins.if(/\.js$/, plugins.rev()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 给css资源增加hash值
    .pipe(plugins.if(/\.css$/, plugins.rev()))
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
    // 记录映射关系，输出json文件
    .pipe(plugins.rev.manifest())
    .pipe(dest(config.dist))
  );
};

// 资源版本替换
const rev = () => {
  // 找到rev映射json文件和需要替换的html替换文件,
  return src(['*.json', '*.html'], {
      base: config.dist,
      cwd: config.dist
    })
    .pipe(plugins.revCollector({
      replaceReved: true,
      // 目录替换
      dirReplacements: {
        // '/public/assets': 'assets'
      }
    }))
    .pipe(dest(config.dist))
}
// 公共模块替换路径
const replacePath = () => {
  return src(config.paths.pages, {
      base: config.dist,
      cwd: config.dist
    })
    .pipe(plugins.replace('/public/', function () {
      return ''
    }))
    .pipe(dest(config.dist))
}
// 打包zip
const zip = () => {
  return src(config.paths.zip, {
      cwd: config.dist,
      base: config.dist
    })
    .pipe(plugins.zip('dist.zip'))
    .pipe(dest('.'))
}
const compile = parallel(styles, scripts, pages);
const dev = parallel(compile, series(serve));
// 生产环境：先移除dist目录，并行处理compile, image, font, extra任务，最后才处理useref任务
const build = series(clean, parallel(compile, images, fonts, extra), useref, rev, replacePath);

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
  zip
};