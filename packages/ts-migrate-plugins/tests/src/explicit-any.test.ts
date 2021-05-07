import ts from 'typescript';
import { mockPluginParams, mockDiagnostic, realPluginParams } from '../test-utils';
import explicitAnyPlugin from '../../src/plugins/explicit-any';

describe('explicit-any plugin', () => {
  it('adds explicit any', async () => {
    const text = `let somePromise: any;
somePromise.then(res1 => res1.default || res1);
somePromise.then((res2) => res2.default || res2);
let someArray: any;
someArray.forEach(({ arg1, arg2 }) => {});
function fn1(p1, p2) {}
const fn2 = function(p3, p4) {}
function f3() {
  const var1 = [];
  return var1;
}
function fn4({ arg4: { arg5, arg_6: arg6 } }) {}
function fn5(...rest) {}
const fn6 = (...rest) => {}
const fn7 = ({ id }: { id }) => {}
const {
  root_see_all_link_text: rootSeeAllLinkText,
  root_subtitle: rootSubtitle,
  root_title: rootTitle,
} = {};
function Foo({
  paramA,
  paramB,
  paramC = {},
  paramD,
} = {}) {
  return true ? paramA : paramB;
}
const { varA, varB: {
  inVarA, inVarB,
} = {} } = {};
`;

    const result = await explicitAnyPlugin.run(
      await realPluginParams({
        text,
      }),
    );

    expect(result).toBe(`let somePromise: any;
somePromise.then((res1: any) => res1.default || res1);
somePromise.then((res2: any) => res2.default || res2);
let someArray: any;
someArray.forEach(({
  arg1,
  arg2
}: any) => {});
function fn1(p1: any, p2: any) {}
const fn2 = function(p3: any, p4: any) {}
function f3() {
  const var1: any = [];
  return var1;
}
function fn4({
  arg4: { arg5, arg_6: arg6 }
}: any) {}
function fn5(...rest: any[]) {}
const fn6 = (...rest: any[]) => {}
const fn7 = ({ id }: { id: any }) => {}
const {
  root_see_all_link_text: rootSeeAllLinkText,
  root_subtitle: rootSubtitle,
  root_title: rootTitle
}: any = {};
function Foo({
  paramA,
  paramB,
  paramC = {},
  paramD
}: any = {}) {
  return true ? paramA : paramB;
}
const {
  varA,

  varB: {
    inVarA, inVarB,
  } = {}
}: any = {};
`);
  });

  it('adds explicit any to this', async () => {
    const text = `\
function f1(a: any) { return this; }
const f2 = function() { return this; }
function f3() { return () => this; }
function f4() { this.a = 1; this.b = 2; }
`;

    const result = await explicitAnyPlugin.run(
      await realPluginParams({
        text,
      }),
    );

    expect(result).toBe(`\
function f1(this: any, a: any) { return this; }
const f2 = function(this: any) { return this; }
function f3(this: any) { return () => this; }
function f4(this: any) { this.a = 1; this.b = 2; }
`);
  });

  it('adds explicit any with alias', async () => {
    const text = `const var1 = [];`;

    const diagnosticFor = (str: string, code: number) =>
      mockDiagnostic(text, str, { category: ts.DiagnosticCategory.Error, code });

    const result = await explicitAnyPlugin.run(
      mockPluginParams({
        options: { anyAlias: '$TSFixMe' },
        text,
        semanticDiagnostics: [diagnosticFor('var1', 7034)],
      }),
    );

    expect(result).toBe(`const var1: $TSFixMe = [];`);
  });

  it('handles arrow functions returning object literals', async () => {
    const text = `const fn = (b) => ({});`;

    const result = await explicitAnyPlugin.run(
      await realPluginParams({
        text,
      }),
    );

    expect(result).toBe(`const fn = (b: any) => ({});`);
  });
});
