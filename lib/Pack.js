
'use strict';

var _ = require('lodash'),
    resource = require('./resource');

/**
 * 打包模块
 */
class Pack {
    /**
     * @param {Object} info
     * @param {Object} ret 
     * @param {Object} settings 
     */
    constructor(opts) {
        opts = opts || {};

        this.info = opts.info;
        this.ret = opts.ret;
        this.settings = opts.settings;

        this.tpl = null;
        this.js = null;
        this.resourceMap = null;

        if (opts.isAsync) {
            this.createTpl();
        }

        this.createJs();

        if (opts.isAsync) {
            this.depFiles = this.getDepFiles(this.js);

            var resourceFiles = this.depFiles;
            if (opts.allInOne) {
                this.allInOne();
                resourceFiles = {};
                resourceFiles[this.allInOneJS.getId()] = this.allInOneJS;
                resourceFiles[this.allInOneCss.getId()] = this.allInOneCss;
            }

            this.createResourceMap(resourceFiles);
        }
    }

    /**
     * 创建tpl文件
     */
    createTpl() {
        var file = fis.file(
            fis.project.getProjectPath(), 
            `${this.info.path}/pkg.tpl.js`
        );
        file.setContent(`module.exports = ${JSON.stringify(this.info.html)};`);
        file.moduleId = `${this.info.name}.tpl`;
        fis.compile(file);
        // add to fis
        this.tpl = this.ret.pkg[file.subpath] = file;
    }

    /**
     * 创建main文件
     */
    createJs() {
        var info = this.info,
            root = fis.project.getProjectPath(),
            // 异步main文件
            js = fis.file(
                fis.project.getProjectPath(), 
                `${this.info.path}/pkg.main.js`
            );
        js.moduleId = `${info.name}.main`;
        js.setContent('');

        // require tpl
        this.tpl && this._addRequire(js, this.tpl);
        // require info js
        info.js && this._addRequire(js, info.js);
        info.css && js.addRequire(info.css.getId());

        var self = this;
        fis.util.map(info.dep, function(name, item) {
            item.js && self._addRequire(js, item.js);
            item.css && js.addRequire(item.css.getId());
        });

        var mainMap = this.getMainMap();
        if (Object.keys(mainMap).length) {
            js.setContent([
                js.getContent() || '',
                `require('${this.settings.QuesRef}').addMap(${JSON.stringify(mainMap)});`
            ].join('\n'));
        }
        fis.compile(js);
        // add to fis
        this.js = this.ret.pkg[js.subpath] = js;
    }

    _addRequire(file, dep) {
        file.addRequire(dep.getId());
        // 注入require语句让依赖执行
        file.setContent([
            `require('${dep.moduleId || dep.getId()}');`,
            file.getContent() || ''
        ].join('\n'));
    }

    /**
     * 打包文件至main文件
     */
    allInOne() {
        var self = this,
            jsContent = '',
            cssContent = '';
        Object.keys(this.depFiles).forEach(function(id) {
            var file = self.depFiles[id];
            if (file._likes && file._likes.isJsLike) {
                // main js需要放到最后
                if (file.subpath !== self.js.subpath) {
                    jsContent += '\n' + file.getContent();
                }
            } else {
                cssContent += '\n' + file.getContent();
            }
        });
        var js = fis.file(
                fis.project.getProjectPath(), 
                `${this.info.path}/pkg.aio.js`
            ),
            css = fis.file(
                fis.project.getProjectPath(), 
                `${this.info.path}/pkg.aio.css`
            );
        css.setContent(cssContent);
        // moduleId 设置和main文件一样
        js.moduleId = this.js.moduleId;
        js.setContent(jsContent + '\n' + this.js.getContent());
        js.addRequire(css.getId());
        this.allInOneJS = this.ret.pkg[js.subpath] = js;
        this.allInOneCss = this.ret.pkg[css.subpath] = css;
    }

    /**
     * 生成resourceMap文件
     * @param {Array.<File>} files 
     */
    createResourceMap(files) {
        var file = fis.file(
                fis.project.getProjectPath(), 
                `${this.info.path}/pkg.map.js`
            ),
            resourceMap = resource.buildResourceMap(
                this.ret, files, 'mod'
            );
        file.isMod = false;
        file.setContent(`require.resourceMap(${JSON.stringify(resourceMap)});`);
        fis.compile(file);
        // add to fis
        this.resourceMap = this.ret.pkg[file.subpath] = file;
    }

    /**
     * 获取模块main.js映射
     * @return {Object.<String, String>} 
     */
    getMainMap() {
        var mainMap = {},
            info = this.info;
        fis.util.map(info.dep, function(name, item) {
            var js = item.js;
            mainMap[name] = 
                js && (js.extras && js.extras.moduleId || js.url) || null
        });
        if (info.name && info.js) {
            mainMap[info.name] = (info.js.extras && info.js.extras.moduleId || info.js.url) || null;
        }
        return mainMap;
    }

    /**
     * 获取文件依赖的所有文件
     * @param {File} file
     * @return {Object.<String,File>} 
     */
    getDepFiles(file) {
        var self = this,
            dep = {};
        // add self
        dep[file.getId()] = file;
        (file.requires || []).forEach(function(id) {
            id = id.replace(/^\/?/, '/');
            var f = self.ret.src[id] || self.ret.pkg[id];
            if (f && self.needPack(f)) {
                dep[f.getId()] = f;
                _.extend(dep, self.getDepFiles(f));
            }
        });
        return dep;
    }

    /**
     * 判断文件是否需要打包
     * @param {File} file
     * @return {Boolean} 
     */
    needPack(file) {
        // TODO
        return this.info.settings.packAll 
            || file.subpath.indexOf(this.info.path) === 0; // 必须是子目录下的
    }
}

module.exports = Pack;

