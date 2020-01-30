import ts from 'typescript';
import { findKnownImports, findKnownVariables } from '../../../src/plugins/utils/identifiers';

const fileName = 'file.tsx';

function createSourceFile(sourceText: string): ts.SourceFile {
  return ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
}

describe('identifier-utils', () => {
  describe('findKnownImports', () => {
    it('works with default imports', () => {
      const srcText = `import React from 'react';

class Foo extends React.Component {
  render() {}
}`;
      const src = createSourceFile(srcText);
      const knownImports = findKnownImports(src);
      expect(Object.keys(knownImports).length).toBe(1);
      expect(knownImports.React).toBeDefined();
      expect(knownImports.React.pos).toBe(6);
    });

    it('works with named imports', () => {
      const srcText = `import React, { Fragment } from 'react';

class Foo extends React.Component {
  render() {}
}`;
      const src = createSourceFile(srcText);
      const knownImports = findKnownImports(src);
      expect(Object.keys(knownImports).length).toBe(2);
      expect(knownImports.React).toBeDefined();
      expect(knownImports.React.pos).toBe(6);
      expect(knownImports.Fragment).toBeDefined();
      expect(knownImports.Fragment.pos).toBe(15);
      // they are both defined at the same point -- the end of the import statement.
      expect(knownImports.React.end).toBe(knownImports.Fragment.end);
    });

    it('works with empty imports', () => {
      const srcText = 'function foo() {}';
      const src = createSourceFile(srcText);
      const knownImports = findKnownImports(src);
      expect(Object.keys(knownImports).length).toBe(0);
    });
  });

  describe('findKnownVariables', () => {
    it('works with the simplest case', () => {
      const srcText = 'const foo = 2;';
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(1);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(5);
    });

    it('works with a variable declaration list', () => {
      const srcText = 'const foo = 2, bar = 3;';
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(2);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(5);
      expect(knownVariables.bar).toBeDefined();
      expect(knownVariables.bar.pos).toBe(14);
    });

    it('works with object destructuring', () => {
      const srcText = `const props = {};
const { foo, bar: { wat } } = props;`;
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(4);
      expect(knownVariables.props).toBeDefined();
      expect(knownVariables.props.pos).toBe(5);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(25);
      expect(knownVariables.bar).toBeDefined();
      expect(knownVariables.bar.pos).toBe(30);
      expect(knownVariables.wat).toBeDefined();
      expect(knownVariables.wat.pos).toBe(37);
    });

    it('works with object spread', () => {
      const srcText = `const props = {};
const { foo, ...rest } = props;`;
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(3);
      expect(knownVariables.props).toBeDefined();
      expect(knownVariables.props.pos).toBe(5);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(25);
      expect(knownVariables.rest).toBeDefined();
      expect(knownVariables.rest.pos).toBe(34);
    });

    it('works with array destructuring', () => {
      const srcText = `const photoList = [];
const [ foo, bar ] = photoList;`;
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(3);
      expect(knownVariables.photoList).toBeDefined();
      expect(knownVariables.photoList.pos).toBe(5);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(29);
      expect(knownVariables.bar).toBeDefined();
      expect(knownVariables.bar.pos).toBe(34);
    });

    it('works with array spread', () => {
      const srcText = `const photoList = [];
const [ foo, ...rest ] = photoList;`;
      const src = createSourceFile(srcText);
      const knownVariables = findKnownVariables(src);
      expect(Object.keys(knownVariables).length).toBe(3);
      expect(knownVariables.photoList).toBeDefined();
      expect(knownVariables.photoList.pos).toBe(5);
      expect(knownVariables.foo).toBeDefined();
      expect(knownVariables.foo.pos).toBe(29);
      expect(knownVariables.rest).toBeDefined();
      expect(knownVariables.rest.pos).toBe(38);
    });
  });
});
