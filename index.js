
'use strict';

var _ = require('lodash'),
    ques = require('ques-core'),
    Component = ques.Component,
    getFinder = require('./lib/find'),
    Pack = require('./lib/Pack');

var entry = module.exports = function(ret, conf, settings, opt) {
    var find = getFinder(ret, settings),
        build = getBuilder(ret, settings);

    // cfg ques
    ques.cfg({
        hash: ques.hash.md,
        find: find
    });

    // html
    fis.util.map(ret.src, function(subpath, file) {
        if (file.isHtmlLike && (file.isQPage || hasQMark(file, settings))) {
            build({
                name: file.getId(),
                path: file.subdirname,
                file: file,
                content: file.getContent()
            });
        }
    });

    setStyleAndJs(find.all);
};

function getBuilder(ret, settings) {
    // 模块
    var infoMap = {};
    /**
     * 编译页面
     * @param {Object} info 
     */
    return function (info) {
        if (infoMap[info.name]) {
            return;
        }
        infoMap[info.name] = info;

        var p = new Component({
            content: info.content
        });
        
        p.inflat();

        _.extend(info, {
            html: p.$.html(),
            dep: p.dep,
            asyncDep: p.asyncDep
        });

        // 优先处理子异步模块
        fis.util.map(p.asyncDep, function(name, item) {
            build(item);
        });

        /**
         * @type {File} 页面文件
         */
        var pageFile = info.file || null; 

        // 打包异步模块
        info.pack = new Pack({
            info: info,
            ret: ret,
            settings: settings,
            tpl: !pageFile, // 是否需要生成tpl文件
            resourceMap: !pageFile, // 是否需要生成子模块的resourceMap
            allInOne: !pageFile && !settings.debug // 是否打包文件
        });

        // 如果是页面文件
        if (pageFile) {
            // 模块
            pageFile.addRequire(info.pack.js.getId());
            fis.util.map(info.asyncDep, function(name, item) {
                // 添加异步模块的resourceMap
                item.pack.resourceMap 
                    && pageFile.addRequire(item.pack.resourceMap.getId());
            });
        }
    }
}

/**
 * 设置css/js文件 只需替换占位符
 * @param {Object.<String,Object>} all 
 */
function setStyleAndJs(all) {
    fis.util.map(all, function(name, info) {
        if (info) {
            ['js', 'css'].forEach(function(item) {
                var f = info[item];
                if (f) {
                    // 替换组件js,css中的占位符
                    f.setContent(ques.util.replaceHolder(f.getContent(), name));
                }
            });
        }
    });
}

/**
 * 是否有Ques页面标记 
 * @param {File} file
 * @param {Object} settings 
 * @return {Boolean} 
 */
function hasQMark(file, settings) {
    var i = (file.getContent() || '').indexOf(settings.qMark);
    return i >= 0 && i < 200;
}

/**
 * @type {Object} 默认选项
 */
entry.defaultOptions = {
    /**
     * @type {Boolean} 调试模式
     */
    debug: true,

    /**
     * @type {String} Ques页面的标记
     */
    qMark: '<!--isQPage-->', 

    /**
     * @type {RegExp} 占位符
     */
    holder: /___|\$__/g,

    /**
     * @type {Array.<String>} 组件路径
     */
    components: ['/components']
};

