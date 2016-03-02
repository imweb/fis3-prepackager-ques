// begin from here
var _ = require('lodash'),
    ques = require('ques-core'),
    Component = ques.Component,
    find = require('./lib/find');

var entry = module.exports = function(ret, conf, settings, opt) {

    var finder = find(settings.components, ret);

    // cfg ques
    ques.cfg({
        find: finder
    });

    // html
    fis.util.map(ret.src, function(subpath, file) {
        if (file.isHtmlLike && (file.isQPage || hasQMark(file, settings))) {
            var page = new Component({
                content: file.getContent()
            });
            
            // 分析依赖
            page.inflat();

            var deps = {};
            fis.util.map(page.deps, function(name, dep) {
                var css = dep.css,
                    js = dep.js;
                // 添加组件css,js依赖
                css && file.addRequire(css.id);
                js && file.addRequire(js.id);
                deps[name] = 
                    js && (js.extras && js.extras.moduleId || js.url) || null
            });

            var html = page.$.html();

            // 添加组件信息
            html = html.replace(/<script\s/, [
                '<script>', 
                `var _components = ${JSON.stringify(deps)};`,
                '</script>\n$&'
            ].join(''));

            file.setContent(html);
        }
    });

    // 替换组件js,css中的占位符
    fis.util.map(finder.all, function(name, info) {
        if (info) {
            ['js', 'css'].forEach(function(item) {
                var f = info[item];
                if (f) {
                    f.setContent(ques.replaceHolder(f.getContent(), name));
                }
            });
        }
    });
};

// 是否有Ques页面标记
function hasQMark(file, settings) {
    var i = (file.getContent() || '').indexOf(settings.qMark);
    return i >= 0 && i < 200;
}

entry.defaultOptions = {
    // html文件是Ques页面的标记
    qMark: '<!--isQPage-->', 

    // 占位符
    holder: /___|\$__/g,

    // 组件路径
    components: ['/components']
};

