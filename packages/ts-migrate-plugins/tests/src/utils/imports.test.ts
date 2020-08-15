import ts from 'typescript';
import { updateImports } from '../../../src/plugins/utils/imports';
import updateSourceText from '../../../src/utils/updateSourceText';

describe('updateImports', () => {
  it('adds and removes imports', () => {
    const sourceText = `
import a1 from 'mod1';
import b0, { b1, b2 } from 'mod2';
import c0, { c1, c2 } from 'mod3';
import d0, { d1 } from 'mod4';
import e0, { e1 } from 'mod5';
import f0, { f1 } from 'mod6';
import g0, { g1 } from 'mod7';

console.log(
  a1, a2, a3,
  b0, b1, b2,
  c0, c1, c2,
  e0,
  f2,
  g1,
  h0, h1,
);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            // add name import for new module
            { defaultImport: 'h0', moduleSpecifier: 'mod8' },
            // add named import for new module
            { namedImport: 'h1', moduleSpecifier: 'mod8' },
            // add name import for existing module
            { defaultImport: 'a2', moduleSpecifier: 'mod1' },
            // add named import for existing module
            { namedImport: 'a3', moduleSpecifier: 'mod1' },
            // add redundant name import
            { defaultImport: 'c0', moduleSpecifier: 'mod3' },
            // add redundant named import
            { namedImport: 'c1', moduleSpecifier: 'mod3' },
            // add named import for removed module
            { namedImport: 'f2', moduleSpecifier: 'mod6' },
          ],
          [
            // remove all imports for added module
            { moduleSpecifier: 'mod6' },
            // remove all imports for module
            { moduleSpecifier: 'mod4' },
            // remove named import
            { namedImport: 'e1', moduleSpecifier: 'mod5' },
            // remove name import
            { defaultImport: 'g0', moduleSpecifier: 'mod7' },
          ],
        ),
      ),
    ).toBe(`
import a1, { a3 } from "mod1";
import b0, { b1, b2 } from 'mod2';
import c0, { c1, c2 } from 'mod3';
import e0 from "mod5";
import { f2 } from "mod6";
import { g1 } from "mod7";
import h0, { h1 } from "mod8";
import a2 from "mod1";

console.log(
  a1, a2, a3,
  b0, b1, b2,
  c0, c1, c2,
  e0,
  f2,
  g1,
  h0, h1,
);
`);
  });

  it('adds and removes imports with comments around', () => {
    const sourceText = `
// comment 1
import a1 from 'mod1';
import b0, { b1, b2 } from 'mod2';
/*
multi line comment 2
**/
import c0, { c1, c2 } from 'mod3';
import d0, { d1 } from 'mod4';
import e0, { e1 } from 'mod5';
// comment 2.1
import f0, { f1 } from 'mod6';
/*some comment 3*/
import g0, { g1 } from 'mod7';

console.log(
  a1, a2, a3,
  b0, b1, b2,
  c0, c1, c2,
  e0,
  f2,
  g1,
  h0, h1,
);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            // add name import for new module
            { defaultImport: 'h0', moduleSpecifier: 'mod8' },
            // add named import for new module
            { namedImport: 'h1', moduleSpecifier: 'mod8' },
            // add name import for existing module
            { defaultImport: 'a2', moduleSpecifier: 'mod1' },
            // add named import for existing module
            { namedImport: 'a3', moduleSpecifier: 'mod1' },
            // add redundant name import
            { defaultImport: 'c0', moduleSpecifier: 'mod3' },
            // add redundant named import
            { namedImport: 'c1', moduleSpecifier: 'mod3' },
            // add named import for removed module
            { namedImport: 'f2', moduleSpecifier: 'mod6' },
          ],
          [
            // remove all imports for added module
            { moduleSpecifier: 'mod6' },
            // remove all imports for module
            { moduleSpecifier: 'mod4' },
            // remove named import
            { namedImport: 'e1', moduleSpecifier: 'mod5' },
            // remove name import
            { defaultImport: 'g0', moduleSpecifier: 'mod7' },
          ],
        ),
      ),
    ).toBe(`
// comment 1
import a1, { a3 } from "mod1";
import b0, { b1, b2 } from 'mod2';
/*
multi line comment 2
**/
import c0, { c1, c2 } from 'mod3';
import e0 from "mod5";
// comment 2.1
import { f2 } from "mod6";
/*some comment 3*/
import { g1 } from "mod7";
import h0, { h1 } from "mod8";
import a2 from "mod1";

console.log(
  a1, a2, a3,
  b0, b1, b2,
  c0, c1, c2,
  e0,
  f2,
  g1,
  h0, h1,
);
`);
  });

  it('adds at the top of the file', () => {
    const sourceText = `console.log(a0, a1, b1);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            { defaultImport: 'a0', moduleSpecifier: 'mod1' },
            { namedImport: 'a1', moduleSpecifier: 'mod1' },
            { namedImport: 'b1', moduleSpecifier: 'mod2' },
          ],
          [{ moduleSpecifier: 'mod3' }],
        ),
      ),
    ).toBe(`import a0, { a1 } from "mod1";
import { b1 } from "mod2";console.log(a0, a1, b1);
`);
  });

  it('does not remove used imports', () => {
    const sourceText = `import a0, { a1 } from 'mod1';

console.log(a0);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [],
          [{ moduleSpecifier: 'mod1' }],
        ),
      ),
    ).toBe(`import a0 from "mod1";

console.log(a0);
`);
  });

  it('does not add duplicate imports', () => {
    const sourceText = `console.log(a0, a1);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            { defaultImport: 'a0', moduleSpecifier: 'mod1' },
            { defaultImport: 'a0', moduleSpecifier: 'mod1' },
            { namedImport: 'a1', moduleSpecifier: 'mod1' },
            { namedImport: 'a1', moduleSpecifier: 'mod1' },
          ],
          [],
        ),
      ),
    ).toBe(`import a0, { a1 } from "mod1";console.log(a0, a1);
`);
  });

  it('does not add duplicate imports', () => {
    const sourceText = `import { a0 } from "mod3"; import WithStylesProps from mod1; type Props = WithStylesProps; console.log(a0, a1);
`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            { defaultImport: 'a1', moduleSpecifier: 'modc' },
            { namedImport: 'WithStylesProps', moduleSpecifier: 'modb' },
          ],
          [],
        ),
      ),
    ).toBe(`import { a0 } from "mod3"; import WithStylesProps from mod1;
import a1 from "modc"; type Props = WithStylesProps; console.log(a0, a1);
`);
  });

  it('does not remove comments from top', () => {
    const sourceText = `
// comment example is here
/* one more comment */
import f0, { f1 } from 'mod6';
console.log(a0, a1);`;
    expect(
      updateSourceText(
        sourceText,
        updateImports(
          ts.createSourceFile('file.ts', sourceText, ts.ScriptTarget.Latest),
          [
            { defaultImport: 'a0', moduleSpecifier: 'mod1' },
            { defaultImport: 'a0', moduleSpecifier: 'mod1' },
            { namedImport: 'a1', moduleSpecifier: 'mod1' },
            { namedImport: 'a1', moduleSpecifier: 'mod1' },
          ],
          [{ moduleSpecifier: 'mod6' }],
        ),
      ),
    ).toBe(`
// comment example is here
/* one more comment */
import a0, { a1 } from "mod1";
console.log(a0, a1);`);
  });
});
