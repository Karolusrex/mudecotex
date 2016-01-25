let refactoredMaps = new WeakMap();


let ensureArray = (array) => Array.isArray(array) ? array : [array];
let getWithDefault = (map, key, def) => map.get(key) || (map.set(key,def).get(key));
//Keep track of which functions are refactored so we don't refactor more than once
let refactorOnce = (refactorFn, list, target, cb) => {
    let refactoredMap = getWithDefault(refactoredMaps,refactorFn,new WeakMap());
    let refactored = getWithDefault(refactoredMap, target, []);
    list.filter((name) => !(~refactored.indexOf(name)))
        .forEach((name, index) => {
            cb(name, index);
            refactored.push(name);
        });
};

export function mutex(mutexName){

    let mutexFn =  (originalFn) => function (...args) {

        let mutexLock = this[mutexName];
        //occupied, set in queue
        if (mutexLock) {
            mutexLock.push(() => originalFn.apply(this, args));
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

    return function(target, key, descriptor) {
        const fn = descriptor.value;
        descriptor.value = mutexFn(fn);
        return descriptor;
    }
}

export function surpressedBy(names) {
    names = ensureArray(names);
    return (target, key, descriptor) => {
        refactorOnce(surpressedBy, names, target, (name) => {
            const originalSurpressingFn = target[name];
            let propertyName = `${name}isRunning`;
            target[name] = function (...args) {
                //set lock
                this[propertyName] = true;
                originalSurpressingFn.apply(this, args);
                //release lock
                this[propertyName] = false;
            };
        });

        const fn = descriptor.value;
        descriptor.value = function (...args) {
            for (let name of names) {
                if (this[`${name}isRunning`]) {
                    return false;
                }
            }
            fn.apply(this, args);
        };
        return descriptor;
    }
}