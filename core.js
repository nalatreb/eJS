(() => {
  let components = {};

  let addComponent = (name, constructor) => {
    // Store controller constructor
    components[name] = {
      factory: constructor,
      instances: []
    };
    let tagName = name.split(/(?=[A-Z])/).join('-').toLowerCase();

    // Look for elements using the controller
    let element = document.querySelector(tagName);
    if (!element) {
      return; // No element uses this controller
    }

    let ctrl = new components[name].factory;
    components[name].instances.push(ctrl);

    element.outerHTML = `<div data-component-id="${tagName}">${ctrl.tpl}</div>`;
    element = document.querySelector(`[data-component-id='${tagName}']`);

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
    component: addComponent
  };
})();

/* User code */
function MessageComponent() {
  this.message = 'Hello World!';
  this.tpl = `
    <input ee-bind="message">
    <input ee-bind="message">
    
    <button onclick="alma.onButtonClick()">Click!</button>
  `;

  this.onButtonClick = () => {
    alma.message = 'Clicked!';
    console.log(this);
  };

  window.onButtonClick = this.onButtonClick;
}

let alma = ee.component('Message', MessageComponent);
