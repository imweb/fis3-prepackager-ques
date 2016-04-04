
'use strict';

var _ = require('lodash'),
    ques = require('ques-core'),
    getFinder = require('./lib/find'),
    getBuilder = require('./lib/build');

var entry = module.exports = function(ret, conf, settings, opt) {
    var find = getFinder(ret, settings),
        build = getBuilder(ret, settings);

    // cfg ques
    ques.cfg({
        hash: ques.hash.md,
        find: find
    });

    find.on('find', function(info) {
        // 替换占位符
        replaceHolder(info);
    });

    // html
    fis.util.map(ret.src, function(subpath, file) {
        if (file.isHtmlLike && (file.isQPage || hasQMark(file, settings))) {
            build({
                name: 'page',
                path: file.subdirname,
                file: file,
                content: file.getContent()
            });
        }
    });
};

/**
 * 替换占位符
 * @param {<String,Object>} info
 */
function replaceHolder(info) {
    if (info && !info._quesCompiled) {
        info._quesCompiled = true;
        // css js
        ['js', 'css'].forEach(function(item) {
            var f = info[item];
            if (f) {
                f.setContent(ques.util.replaceHolder(f.getContent(), info.name));
            }
        });
        // html
        info.content = ques.util.replaceHolder(info.content || '', info.name);
    }
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
     * @type {String} Ques require moduleId
     */
    QuesRef: 'Ques',

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

