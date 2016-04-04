
'use strict';

var _ = require('lodash'),
    ques = require('ques-core'),
    Component = ques.Component,
    Pack = require('./Pack');

module.exports = function(ret, settings) {
    // 模块
    var infoMap = {};

    /**
     * 编译页面
     * @param {Object} info 
     */
    var build = function (info) {
        if (info.name !== 'page') {
            if (infoMap[info.name]) {
                return;
            }
            infoMap[info.name] = info;
        }

        var p = new Component({
            content: info.content
        });

        p.inflat();

        _.extend(info, {
            settings: p.settings,
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
            isAsync: !pageFile, 
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

            // set html
            pageFile.setContent(info.html);
        }
    };
    return build;
};


