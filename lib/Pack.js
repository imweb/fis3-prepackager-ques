
'use strict';

var _ = require('lodash'),
    resource = require('./resource');

/**
 * 打包异步模块
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
        this.css = null;
        this.resourceMap = null;

        opts.tpl && this.createTpl();

        this.createCss();

        this.createJs();

        this.depFiles = this.getDepFiles(this.js);

        var resourceFiles = this.depFiles;
        if (this.settings.allInOne) {
            this.allInOne();
            resourceFiles = {};
            resourceFiles[this.js.getId()] = this.js;
            resourceFiles[this.css.getId()] = this.css;
        }

        opts.resourceMap && this.createResourceMap(resourceFiles);
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
     * 创建main css文件
     */
    createCss() {
        var info = this.info,
            css = fis.file(
                fis.project.getProjectPath(), 
                `${this.info.path}/pkg.main.css`
            );

        info.css && css.addRequire(info.css.getId());
        fis.util.map(info.dep, function(name, item) {
            item.css && css.addRequire(item.css.getId());
        });

        css.setContent('');
        fis.compile(css);

        this.css = this.ret.pkg[css.subpath] = css;
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

        // require tpl
        this.tpl && js.addRequire(this.tpl.getId());
        // require css
        this.css && js.addRequire(this.css.getId());
        // require info js
        info.js && js.addRequire(info.js.getId());

        fis.util.map(info.dep, function(name, item) {
            item.js && js.addRequire(item.js.getId());
        });

        js.setContent([
            `var obj = ${JSON.stringify(this.getMainMap())}`
        ].join(''));
        js.moduleId = `${info.name}.main`;
        fis.compile(js);
        // add to fis
        this.js = this.ret.pkg[js.subpath] = js;
    }

    /**
     * 打包文件至main文件
     */
    allInOne() {
        var jsContent = '',
            cssContent = '',
            self = this;
        Object.keys(this.depFiles).forEach(function(id) {
            var file = self.depFiles[id];
            if (file.rExt === '.css') {
                if (file.getId() !== self.css.getId()) {
                    cssContent += '\n' + file.getContent();
                }
            } else {
                if (file.getId() !== self.js.getId()) {
                    jsContent += '\n' + file.getContent();
                }
            }
        });
        this.js.setContent(this.js.getContent() + '\n' + jsContent);
        this.css.setContent(this.css.getContent() + '\n' + cssContent);
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
        var mainMap = {};
        fis.util.map(this.info.dep, function(name, item) {
            var js = item.js;
            mainMap[name] = 
                js && (js.extras && js.extras.moduleId || js.url) || null
        });
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
        return true;
    }
}

module.exports = Pack;

