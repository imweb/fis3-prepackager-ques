
'use strict';

/**
 * 获取组件查找器
 * @param {Object} ret
 * @param {Object} settings 
 * @param {String|Array.<String>} settings.components 
 * @return {Function(String):Object}
 */
module.exports = function(ret, settings) {
    var cache = {},
        paths = settings.components;

    paths = typeof paths === 'string' ? [paths] : paths || [];

    // read component info from dir
    function readInfo(dir) {
        var info = {
            content: ''
        };

        // html
        var p = fis.util(dir, 'main.html');
        if (ret.src[p]) {
            info.content = ret.src[p].getContent();
            info.html = ret.src[p];
        }

        // js
        p = fis.util(dir, 'main.js');
        if (ret.src[p]) {
            info.js = ret.src[p];
        }

        // css
        // support multi ext for style file
        ['css', 'less', 'scss'].every(function(ext) {
            p = fis.util(dir, `main.${ext}`);
            if (ret.src[p]) {
                info.css = ret.src[p];
                return false;
            }
            return true;
        });
        return info;
    }

    /**
     * 查找函数
     * @param {String} name
     * @return {Object} info
     */
    var fn = function(name) {
        if (cache[name] !== undefined) {
            return cache[name];
        }

        var rel = name.replace(/-/g, '/'),
            dir = null,
            info = null;

        paths.every(function(p) {
            var tmp = fis.util('/', p, rel);
            if (fis.util.isDir(fis.project.getProjectPath(tmp))) {
                dir = tmp;
                return false;
            }
            return true;
        });

        if (dir) {
            info = readInfo(dir);
        }

        // set name
        if (info) {
            info.name = name;
            info.path = dir;
        }

        cache[name] = info;
        return info;
    };

    // set all ref
    fn.all = cache;

    return fn;
};

