import { mockPluginParams, mockDiagnostic } from '../test-utils';
import explicitAnyPlugin from '../../src/plugins/explicit-any';

describe('explicit-any plugin', () => {
  it('adds explicit any', async () => {
    const text = `import specifier1 from '../source';
somePromise.then(res1 => res1.default || res1);
somePromise.then((res2) => res2.default || res2);
someArray.forEach(({ arg1, arg2 }) => {});
const { dest1, dest2 } = obj;
function fn1(p1, p2) {}
const fn2 = function(p3, p4) {}
const var1 = [];
function fn3(p5 = {}) {const {arg3} = p5}
function fn4({ arg4: { arg5, arg_6: arg6 } }) {}
type Fn5Params = {};
function fn5({ arg7: { arg8 } }: Fn5Params) {}
const {
  root_see_all_link_text: rootSeeAllLinkText,
  root_subtitle: rootSubtitle,
  root_title: rootTitle,
} = cancellationModule || {};
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
} = {} } = state;
const { deepobjA = {
  deepobjB = { deepobjC = {} } = {},
} = {} } = {};
`;

    const diagnosticFor = (str: string, code: number) =>
      mockDiagnostic(text, str, { category: 'error', code });

    const result = await explicitAnyPlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [
          diagnosticFor('specifier1', 7034),
          diagnosticFor('res1', 7006),
          diagnosticFor('res2', 7006),
          diagnosticFor('arg1', 7031),
          diagnosticFor('arg2', 7031),
          diagnosticFor('dest1', 7031),
          diagnosticFor('dest2', 7031),
          diagnosticFor('p1', 7006),
          diagnosticFor('p2', 7006),
          diagnosticFor('p3', 7006),
          diagnosticFor('p4', 7006),
          diagnosticFor('var1', 7034),
          diagnosticFor('arg3', 2459),
          diagnosticFor('arg5', 7031),
          diagnosticFor('arg6', 7031),
          diagnosticFor('arg8', 7031),
          diagnosticFor('root_see_all_link_text', 2525),
          diagnosticFor('root_subtitle', 2525),
          diagnosticFor('root_title', 2525),
          diagnosticFor('paramA', 2525),
          diagnosticFor('paramB', 2525),
          diagnosticFor('paramC', 2525),
          diagnosticFor('paramD', 2525),
          diagnosticFor('varA', 2525),
          diagnosticFor('varB', 2525),
          diagnosticFor('inVarA', 2525),
          diagnosticFor('inVarB', 2525),
          diagnosticFor('deepobjA', 2525),
          diagnosticFor('deepobjB', 2525),
          diagnosticFor('deepobjC', 2525),
        ],
      }),
    );

    expect(result).toBe(`import specifier1 from '../source';
somePromise.then((res1: any) => res1.default || res1);
somePromise.then((res2: any) => res2.default || res2);
someArray.forEach(({
  arg1,
  arg2
}: any) => {});
const {
  dest1,
  dest2
}: any = obj;
function fn1(p1: any, p2: any) {}
const fn2 = function(p3: any, p4: any) {}
const var1: any = [];
function fn3(p5: any = {}) {const {arg3} = p5}
function fn4({
  arg4: { arg5, arg_6: arg6 }
}: any) {}
type Fn5Params = {};
function fn5({ arg7: { arg8 } }: Fn5Params) {}
const {
  root_see_all_link_text: rootSeeAllLinkText,
  root_subtitle: rootSubtitle,
  root_title: rootTitle
}: any = cancellationModule || {};
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
}: any = state;
const {
  deepobjA = ({
    deepobjB = ({ deepobjC = {} } = {}),
  } = {})
}: any = {};
`);
  });

  it('adds explicit any with alias', async () => {
    const text = `const var1 = [];`;

    const diagnosticFor = (str: string, code: number) =>
      mockDiagnostic(text, str, { category: 'error', code });

    const result = await explicitAnyPlugin.run(
      mockPluginParams({
        options: { anyAlias: '$TSFixMe' },
        text,
        semanticDiagnostics: [diagnosticFor('var1', 7034)],
      }),
    );

    expect(result).toBe(`const var1: $TSFixMe = [];`);
  });
});
