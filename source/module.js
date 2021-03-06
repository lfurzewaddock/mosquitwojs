var $msq = (function () {
    'use strict';

    var modules = [];
    var msq = {};

    msq.extension = {
        moduleExtend: {},
        paramExtend: {}
    };

    var parameterExtension = function(result) {
        for(var key in msq.extension.paramExtend) {
            var paramValue = result.$$params[key];
            if(paramValue) {
                msq.extension.paramExtend[key](paramValue, result.$$linkedObject, result.$$instance);
            }
        }
    };

    var findLinkedObjectInModules = function (modules, objName, moduleName) {
        var result = [];
        for (var index in modules) {
            var obj = modules[index].$$linkedObjects[objName];
            if(obj && !((modules[index].$$moduleName !== moduleName) && obj.$$params.internal)) {
                result.push(obj);
            }
        }
        if(result.length === 0) { throw ('linked object <' + objName + '> undefined'); }
        if(result.length > 1) { throw ('linked object <' + objName + '> ambiguous'); }
        return result[0];
    };

    var findLinkedObjectInModule = function(module, objName) {

        if(!module.$$linkedModules) {
            module.$$linkedModules = linkedModules(module.$$moduleName);
        }

        var result = findLinkedObjectInModules(module.$$linkedModules, objName, module.$$moduleName);
        if(result.$$params.toBeLinked) { throw ('linked object <' + objName + '> must be linked'); }
        if(!result.$$instance) {
            var linkedTo = {};
            if(result.$$params.linkedTo) {
                linkedTo = findLinkedObjectInModules(module.$$linkedModules, result.$$params.linkedTo, module.$$moduleName).$$linkedObject;
            }
            result.$$instance = Object.create(Object.assign(
                {},
                msq.$$baseObject,
                msq.module(result.$$moduleName).$$baseObject,
                linkedTo,
                result.$$linkedObject
            ));
            parameterExtension(result);
        }
        return result.$$instance;
    };

    var linkedObject = function(name, linkedObj, params) {
        if(linkedObj) {
            if(this.$$linkedObjects[name] !== undefined) { throw ('linked object <' + name + '> already defined'); }
            linkedObj.$$module = this;
            linkedObj.$$name = name;
            this.$$linkedObjects[name] = {
                $$linkedObjectName: name,
                $$linkedObject: linkedObj,
                $$params: params || {},
                $$moduleName: this.$$moduleName
            };
        } else {
            return findLinkedObjectInModule(this, name);
        }
    };

    var linkedModules = function(name, list) {
        list = list || [];
        list.push(modules[name]);
        var requires = modules[name].$$moduleRequires;
        for(var propt in requires) {
            list = linkedModules(requires[propt], list);
        }
        return list;
    };

    msq.baseLinkedObject = function(baseObject) {
        this.$$baseObject = Object.assign(this.$$baseObject || {}, baseObject);
    };

    var moduleInstance = {
        linkedObject: linkedObject,
        baseLinkedObject: msq.baseLinkedObject,
        $findLinkedObjectInModule: findLinkedObjectInModule
    };

    msq.module = function(name, requires) {
        if(requires) {
            if(!Array.isArray(requires)) { throw ('<requires> must be of type array'); }
            if(modules[name] !== undefined) { throw ('module <' + name + '> already defined'); }
            modules[name] = Object.create(Object.assign({}, moduleInstance, msq.extension.moduleExtend, {
                $$moduleName: name,
                $$moduleRequires: requires,
                $$linkedObjects: []
            }));
        }
        if(modules[name] === undefined) { throw ('module <' + name + '> undefined'); }
        return modules[name];
    };

    return msq;
})();
