(() => {
    let controllers = {};

    let addController = (name, constructor) => {
        // Store controller constructor
        controllers[name] = {
            factory: constructor,
            instances: []
        };

        // Look for elements using the controller
        let element = document.querySelector(`[ee-controller='${name}']`);
        if (!element) {
            return; // No element uses this controller
        }

        let ctrl = new controllers[name].factory;
        controllers[name].instances.push(ctrl);

        // Look for bindings
        let bindings = {};

        // Note: element is the dom element using the controller
        Array.prototype.slice.call(element.querySelectorAll('[ee-bind]'))
            .map(element => {
                let boundValue = element.getAttribute('ee-bind');

                if (!bindings[boundValue]) {
                    bindings[boundValue] = {
                        boundValue,
                        elements: []
                    };
                }

                bindings[boundValue].elements.push(element);
            });

        let proxy = new Proxy(ctrl, {
            set: (target, prop, value) => {
                let bind = bindings[prop];

                if (bind) {
                    // Update each DOM element bound to the property
                    bind.elements.forEach(element => {
                        element.value = value;
                        element.setAttribute('value', value);
                    });
                }

                return Reflect.set(target, prop, value);
            }
        });

        Object.keys(bindings).forEach(boundValue => {
            let bind = bindings[boundValue];

            // Listen elements event and update proxy property
            bind.elements.forEach(element => {
                element.addEventListener('input', event => {
                    proxy[bind.boundValue] = event.target.value; // Also triggers the proxy setter
                });
            });
        });

        // Fill proxy with ctrl properties
        // and return proxy, not the ctrl !
        Object.assign(proxy, ctrl);
        return proxy;
    };

    // Export framework in window
    this.ee = {
        controller: addController
    };
})();

/* User code */
function InputController() {
    this.message = 'Hello World!';
}

let myInputController = ee.controller('InputController', InputController);

function onButtonClick () {
    myInputController.message = 'Clicked!';
}
