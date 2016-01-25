"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.mutex = mutex;
exports.surpressedBy = surpressedBy;
var refactoredMaps = new WeakMap();

var ensureArray = function ensureArray(array) {
    return Array.isArray(array) ? array : [array];
};
var getWithDefault = function getWithDefault(map, key, def) {
    return map.get(key) || map.set(key, def).get(key);
};
//Keep track of which functions are refactored so we don't refactor more than once
var refactorOnce = function refactorOnce(refactorFn, list, target, cb) {
    var refactoredMap = getWithDefault(refactoredMaps, refactorFn, new WeakMap());
    var refactored = getWithDefault(refactoredMap, target, []);
    list.filter(function (name) {
        return ! ~refactored.indexOf(name);
    }).forEach(function (name, index) {
        cb(name, index);
        refactored.push(name);
    });
};

function mutex(mutexName) {

    var mutexFn = function mutexFn(originalFn) {
        return function () {
            var _this = this;

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var mutexLock = this[mutexName];
            //occupied, set in queue
            if (mutexLock) {
                mutexLock.push(function () {
                    return originalFn.apply(_this, args);
                });
            } else {
                //acquire lock
                this[mutexName] = [];
                originalFn.apply(this, args);

                //If there are functions queued up
                while (this[mutexName].length) {
                    this[mutexName].pop()();
                }

                //release lock
                this[mutexName] = false;
            }
        };
    };

    return function (target, key, descriptor) {
        var fn = descriptor.value;
        descriptor.value = mutexFn(fn);
        return descriptor;
    };
}

function surpressedBy(names) {
    names = ensureArray(names);
    return function (target, key, descriptor) {
        refactorOnce(surpressedBy, names, target, function (name) {
            var originalSurpressingFn = target[name];
            var propertyName = name + "isRunning";
            target[name] = function () {
                //set lock
                this[propertyName] = true;

                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                originalSurpressingFn.apply(this, args);
                //release lock
                this[propertyName] = false;
            };
        });

        var fn = descriptor.value;
        descriptor.value = function () {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = names[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var name = _step.value;

                    if (this[name + "isRunning"]) {
                        return false;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            fn.apply(this, args);
        };
        return descriptor;
    };
}
