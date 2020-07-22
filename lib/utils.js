let utils = {}
/**
 * 类型检查
 * @description 自动将[isNumber....]挂载到utils中
 * @example  utils.isNumber(1)...
 * @return {Boolean}
 */

;
(function () {
    let obj = {
        'isNumber': "Number",
        'isObject': 'Object',
        'isArray': 'Array',
        'isNull': 'Null',
        'isUndefined': 'Undefined',
        'isSymbol': 'Symbol',
        'isDate': 'Date'
    }
    let _toString = obj.toString
    for (let key in obj) {
        // 通过判断toString.call([1,2,3]) 是否为[object Array],来达到检测目的
        let reg = new RegExp("\\[object " + obj[key] + "\\]")
        utils[key] = function () {
            let val = _toString.call(arguments[0])
            return reg.test(val)
        }
    }
})()
/**
 * 深拷贝
 * @param {*} obj 
 */
function deepCopy(obj) {
    let newObj = {}
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (utils.isObject(obj[key])) {
                newObj[key] = deepCopy(obj[key])
            } else {
                newObj[key] = obj[key]
            }
        }
    }
    return newObj
}
/**
 * 合并对象
 * @param {*} obj1 
 * @param {*} obj2 
 */
function merge(obj1, obj2) {
    let newObj = deepCopy(obj1);
    for (let key in obj2) {
        if (obj1.hasOwnProperty(key)) {
            if (utils.isObject(obj2[key])) {
                newObj[key] = merge(obj1[key], obj2[key])
            } else {
                newObj[key] = obj2[key]
            }
        } else {
            newObj[key] = obj2[key]
        }
    }
    return newObj
}
module.exports = {
    ...utils,
    deepCopy,
    merge
}