const { src, dest, watch, parallel, series } = require("gulp");
const del = require("del");
const browserSync = require("browser-sync").create();
const plugins = require("gulp-load-plugins")();
plugins.sass.compiler = require("node-sass");
// swig模版变量
const data = {
  menus: [
    {
      name: "Home",
      icon: "aperture",
      link: "index.html",
    },
    {
      name: "Features",
      link: "features.html",
    },
    {
      name: "About",
      link: "about.html",
    },
    {
      name: "Contact",
      link: "#",
      children: [
        {
          name: "Twitter",
          link: "https://twitter.com/w_zce",
        },
        {
          name: "About",
          link: "https://weibo.com/zceme",
        },
        {
          name: "divider",
        },
        {
          name: "About",
          link: "https://github.com/zce",
        },
      ],
    },
  ],
  pkg: require("./package.json"),
  date: new Date(),
};
const style = () => {
  return src("src/assets/styles/*.scss", {
    base: "src",
  })
    .pipe(plugins.sass().on("error", plugins.sass.logError))
    .pipe(dest("temp"))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const script = () => {
  return src("src/assets/scripts/*.js", {
    base: "src",
  })
    .pipe(
      plugins.babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(dest("temp"))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const page = () => {
  return src("src/*.html", {
    base: "src",
  })
    .pipe(
      plugins.swig({
        data,
        defaults: {
          cache: false,
        }, // 去掉模版缓存，不去掉导致页面不更新
      })
    )
    .pipe(dest("temp"))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
};
const image = () => {
  return src("src/assets/images/*", {
    base: "src",
  })
    .pipe(
      plugins.imagemin([
        plugins.imagemin.gifsicle({
          interlaced: true,
        }),
        plugins.imagemin.mozjpeg({
          quality: 75,
          progressive: true,
        }),
        plugins.imagemin.optipng({
          optimizationLevel: 5,
        }),
        plugins.imagemin.svgo({
          plugins: [
            {
              removeViewBox: true,
            },
            {
              cleanupIDs: false,
            },
          ],
        }),
      ])
    )
    .pipe(dest("dist"));
};
const font = () => {
  return src("src/assets/fonts/*", {
    base: "src",
  })
    .pipe(plugins.imagemin())
    .pipe(dest("dist"));
};
// public 目录复制到dist中
const extra = () => {
  return src("public/*", {
    base: "public",
  }).pipe(dest("dist"));
};
// 清除任务
const clean = () => {
  return del(["dist", "temp"]);
};
// 开启服务
const serve = () => {
  // 监控文件变化，重新执行命令
  watch("src/assets/styles/*.scss", style);
  watch("src/assets/scripts/*.js", script);
  watch("src/*.html", page);
  // 监控文件变化，重新刷新浏览器
  watch(
    ["src/assets/images/*", "src/assets/fonts/*", "public/*"],
    browserSync.reload
  );
  // browserSync 启动配置
  browserSync.init({
    server: {
      // 从目录中查找文件运行
      baseDir: ["temp", "src", "public"],
      // 匹配路由，
      // 例如在开发阶段，路径是/node_modules引用的资源，开启服务器后，会找不到资源
      // 这里需要配置路由，将/node_modules映射为当前工作目录的node_modules
      routes: {
        "/node_modules": "node_modules", //
      },
    },
  });
};
const useref = () => {
  return (
    src("temp/*.html", {
      base: "temp",
    })
      .pipe(
        plugins.useref({
          searchPath: ["temp", "."], //查找路径，从temp查找文件替换
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
      .pipe(dest("dist"))
  );
};
const compile = parallel(style, script, page);
const dev = parallel(compile, series(serve));
// 生产环境：先移除dist目录，并行处理compile, image, font, extra任务，最后才处理useref任务
const build = series(clean, parallel(compile, image, font, extra), useref);
module.exports = {
  style,
  script,
  page,
  image,
  font,
  clean,
  useref,
  dev,
  build,
};
