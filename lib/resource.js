
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
        var map = res[file.moduleId || file.getId()] = {
            url: file.getUrl(),
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
        if (file._likes && file._likes.isJsLike) {
            if (file.isMod === false || file.wrap === false) {
                map.isMod = false;
            }
        } else {
            map.type = 'css';
        }
    });
    return {
        res: res,
        pkg: {}
    };
}

