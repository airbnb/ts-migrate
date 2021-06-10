import { mockPluginParams } from '../test-utils';
import jsDocPlugin from '../../src/plugins/jsdoc';

describe('jsdoc plugin', () => {
  it('annotates unknown types', () => {
    const text = `\
/** @param a {?} */
function A(a) {}
/** @param b {*} */
function B(b) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {?} */
function A(a: any) {}
/** @param b {*} */
function B(b: any) {}
`);
  });

  it('considers synonym tags', () => {
    const text = `\
/** @arg a {Number} */
function A(a) {}
/** @argument b {Number} */
function B(b) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @arg a {Number} */
function A(a: number) {}
/** @argument b {Number} */
function B(b: number) {}
`);
  });

  it('annotates simple type references', () => {
    const text = `\
/** @param a {Number} */
function A(a) {}
/** @param b {String} */
function B(b) {}
/** @param c {Boolean} */
function C(c) {}
/** @param d {Object} */
function D(d) {}
/** @param e {date} */
function E(e) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Number} */
function A(a: number) {}
/** @param b {String} */
function B(b: string) {}
/** @param c {Boolean} */
function C(c: boolean) {}
/** @param d {Object} */
function D(d: object) {}
/** @param e {date} */
function E(e: Date) {}
`);
  });

  it('ignores nonsensical type parameters', () => {
    const text = `\
/** @param a {Number<string>} */
function A(a) {}
/** @param b {String<string>} */
function B(b) {}
/** @param c {Boolean<string>} */
function C(c) {}
/** @param d {Object<object>} */
function D(d) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Number<string>} */
function A(a: number) {}
/** @param b {String<string>} */
function B(b: string) {}
/** @param c {Boolean<string>} */
function C(c: boolean) {}
/** @param d {Object<object>} */
function D(d: object) {}
`);
  });

  it('annotates nullable types', () => {
    const text = `\
/** @param a {?Number} */
function A(a) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {?Number} */
function A(a: number | null) {}
`);
  });

  it('annotates non-nullable types', () => {
    const text = `\
/** @param a {!Number} */
function A(a) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {!Number} */
function A(a: number) {}
`);
  });

  it('annotates optional types', () => {
    const text = `\
/** @param a {Number=} */
function A(a) {}
/** @param [b] {Number} */
function B(b) {}
/** @param [c] {Object} */
function C({ c }) {}
/** @param [d] {Number} */
function D(d = 1) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Number=} */
function A(a?: number) {}
/** @param [b] {Number} */
function B(b?: number) {}
/** @param [c] {Object} */
function C({ c }: object) {}
/** @param [d] {Number} */
function D(d: number = 1) {}
`);
  });

  it('annotates parameterized types', () => {
    const text = `\
/** @param a {Array} */
function A(a) {}
/** @param b {Array<String>} */
function B(b) {}
/** @param c {Array.<String>} */
function C(c) {}
/** @param d {String[]} */
function D(d) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Array} */
function A(a: Array<any>) {}
/** @param b {Array<String>} */
function B(b: Array<string>) {}
/** @param c {Array.<String>} */
function C(c: Array<string>) {}
/** @param d {String[]} */
function D(d: string[]) {}
`);
  });

  it('annotates object index types', () => {
    const text = `\
/** @param a {Object<number, any>} */
function A(a) {}
/** @param b {Object<string, any>} */
function B(b) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Object<number, any>} */
function A(a: { [n: number]: any; }) {}
/** @param b {Object<string, any>} */
function B(b: { [s: string]: any; }) {}
`);
  });

  it('annotates function types', () => {
    const text = `\
/** @param a {function(number)} */
function A(a) {}
/** @param b {function(): number} */
function B(b) {}
/** @param c {function(this: number)} */
function C(c) {}
/** @param d {function(...number)} */
function D(d) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {function(number)} */
function A(a: (arg0: number) => any) {}
/** @param b {function(): number} */
function B(b: () => number) {}
/** @param c {function(this: number)} */
function C(c: (this: number) => any) {}
/** @param d {function(...number)} */
function D(d: (...rest: number[]) => any) {}
`);
  });

  it('annotates documented properties', () => {
    const text = `\
/**
 * @param {Object} employee
 * @param {string} employee.name
 * @param {string} [employee.department]
 */
function Project(employee) {}
/**
 * @param {Object} employee
 * @param employee.name
 * @param employee.department
 */
function NoTypes(employee) {}
/**
 * @param {Object} employee
 * @param {Object} employee.name
 * @param {string} employee.name.first
 */
function DeepNesting(employee) {}
/**
 * @param {Object} param
 * @param {String} param.a
 * @param {Number} param.b
 */
function Destructured({ a, b }) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/**
 * @param {Object} employee
 * @param {string} employee.name
 * @param {string} [employee.department]
 */
function Project(employee: {
    name: string;
    department?: string;
}) {}
/**
 * @param {Object} employee
 * @param employee.name
 * @param employee.department
 */
function NoTypes(employee: {
    name: any;
    department: any;
}) {}
/**
 * @param {Object} employee
 * @param {Object} employee.name
 * @param {string} employee.name.first
 */
function DeepNesting(employee: {
    name: {
        first: string;
    };
}) {}
/**
 * @param {Object} param
 * @param {String} param.a
 * @param {Number} param.b
 */
function Destructured({ a, b }: {
    a: string;
    b: number;
}) {}
`);
  });

  it('annotates undeclared types', () => {
    const text = `\
/** @param a {Undeclared} */
function A(a) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {Undeclared} */
function A(a: Undeclared) {}
`);
  });

  it('annotates partially-documented functions', () => {
    const text = `\
/**
 * @param a {number}
 * @param b {string}
 */
function A(a, b, c) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/**
 * @param a {number}
 * @param b {string}
 */
function A(a: number, b: string, c) {}
`);
  });

  it('handles misdocumented parameters', () => {
    const text = `\
/** @param b {number} */
function A(a) {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param b {number} */
function A(a) {}
`);
  });

  it('annotates return type', () => {
    const text = `\
/** @return {number} */
function A() {}
`;

    const result = jsDocPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { annotateReturns: true } }),
    );

    expect(result).toBe(`\
/** @return {number} */
function A(): number {}
`);
  });

  it('does not overwrite existing annotations', () => {
    const text = `\
/** @param a {number} */
function A(a: string) {}
/** @return {number} */
function B(): string {}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
/** @param a {number} */
function A(a: string) {}
/** @return {number} */
function B(): string {}
`);
  });

  it('annotates class methods', () => {
    const text = `\
class C {
  /** @param a {number} */
  A(a) {}
}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
class C {
  /** @param a {number} */
  A(a: number) {}
}
`);
  });

  it('adds accessibility modifiers to class methods', () => {
    const text = `\
class C {
  /** @private */
  A() {}
  /** @protected */
  B() {}
  /** @public */
  C() {}
  /**
   * @private
   * @protected
   * @public
   */
  D() {}
  /** @public */
  private E() {}
}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
class C {
  /** @private */
  private A() {}
  /** @protected */
  protected B() {}
  /** @public */
  public C() {}
  /**
   * @private
   * @protected
   * @public
   */
  private D() {}
  /** @public */
  private E() {}
}
`);
  });

  it('annotates object literal methods', () => {
    const text = `\
const O = {
  /** @param a {number} */
  A(a) {},
  /** @return {string} */
  B() {},
  /** @private */
  C() {},
  /** @param a {number} */
  D: (a) => {},
  /** @return {string} */
  E: () => {}
};
`;

    const result = jsDocPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { annotateReturns: true } }),
    );

    expect(result).toBe(`\
const O = {
  /** @param a {number} */
  A(a: number) {},
  /** @return {string} */
  B(): string {},
  /** @private */
  C() {},
  /** @param a {number} */
  D: (a: number) => {},
  /** @return {string} */
  E: (): string => {}
};
`);
  });

  it('annotates function expressions', () => {
    const text = `\
/** @param a {number} */
const A = function(a) {};
/** @return {string} */
const B = function() {};
/** @param c {number} */
window.c = function(c) {};
`;

    const result = jsDocPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { annotateReturns: true } }),
    );

    expect(result).toBe(`\
/** @param a {number} */
const A = function(a: number) {};
/** @return {string} */
const B = function(): string {};
/** @param c {number} */
window.c = function(c: number) {};
`);
  });

  it('annotates arrow functions', () => {
    const text = `\
/** @param a {number} */
const A = (a) => null;
/** @return {string} */
const B = (b) => null;
/** @param c {number} */
const C = c => null;
/** @return {string} */
const D = d => null;
/** @param e {number} */
window.e = (e) => null;
`;

    const result = jsDocPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { annotateReturns: true } }),
    );

    expect(result).toBe(`\
/** @param a {number} */
const A = (a: number) => null;
/** @return {string} */
const B = (b): string => null;
/** @param c {number} */
const C = (c: number) => null;
/** @return {string} */
const D = (d): string => null;
/** @param e {number} */
window.e = (e: number) => null;
`);
  });

  it('annotates functions that are not at the top level', () => {
    const text = `\
function() {
    /** @param a {number} */
    function A(a) {}
}
`;

    const result = jsDocPlugin.run(mockPluginParams({ text, fileName: 'file.tsx' }));

    expect(result).toBe(`\
function() {
    /** @param a {number} */
    function A(a: number) {}
}
`);
  });
});
