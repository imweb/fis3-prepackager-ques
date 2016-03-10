
'use strict';

/**
 * 生成resourceMap
 * @param {Object.<String, File>} files 
 * @param {String} type
 * @return {Object} 
 */
exports.buildResourceMap = function(ret, files, type) {
    switch (type) {
        case 'mod': 
            return buildModResourceMap.apply(this, arguments);
            break;
        default: 
            fis.log.error(`unsupport resourceMap type: ${type}`);
            break;
    }
};

/**
 * 生成mod.js的resourceMap
 * @param {Array.<File>} files 
 * @return {Object} 
 */
function buildModResourceMap(ret, files) {
    var res = {};
    fis.util.map(files, function(id, file) {
        res[file.moduleId || file.getId()] = {
            url: file.getUrl(),
            type: file.rExt === '.js' ? 'js' : 'css',
            deps: (file.requires || [])
                .filter(function(id) {
                    return !!files[id];
                })
                .map(function(id) {
                    var subpath = id.replace(/^\/?/, '/'),
                        f = ret.src[subpath] || ret.pkg[subpath];
                    return f.moduleId || f.id;
                })
        };
    });
    return {
        res: res,
        pkg: {}
    };
}

