/* eslint-disable func-names */
/* eslint-disable @typescript-eslint/ban-types */

// eslint-disable-next-line import/prefer-default-export
export function processTypeIs(type: 'renderer' | 'browser' | 'worker') {
  return (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const fn = descriptor.value;
    if (typeof fn !== 'function') throw Error('no method to decorate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args: any) {
      if (process.type !== type) throw Error(`Not in ${type} process`);
      return (fn as Function).call(this, args);
    };
    return descriptor;
  };
}
