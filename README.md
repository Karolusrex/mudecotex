# Mudecotex

#Example
```
import {surpressedBy, mutex}     from '../src/mudecotex.js';

class Demo {

    constructor(){
        this.doStuff();
        this.foo();
    }

    @mutex('a')
    doStuff() {
        console.log('Doing some stuff.');
        this.doMoreStuff();
        console.log('Done doing stuff!');
    }


    @mutex('a')
    doMoreStuff(){
        console.log('Doing more stuff.');
        this.doFinalStuff();
        console.log('Done doing more stuff!');
    }

    @surpressedBy('foo')
    @mutex('a')
    doFinalStuff(){
        console.log('Doing final stuff.');
        console.log('Done final stuff!');
    }

    foo(){
        console.log('In foo, calling doFinalStuff');
        this.doFinalStuff();
        console.log('Done. Calling doFinalStuff had no effect');
    }

}


let main = new Demo();

```

Output:

```
Doing some stuff.
Done doing stuff!
Doing more stuff.
Done doing more stuff!
Doing final stuff.
Done final stuff!
In foo, calling doFinalStuff
Done. Calling doFinalStuff had no effect
```
