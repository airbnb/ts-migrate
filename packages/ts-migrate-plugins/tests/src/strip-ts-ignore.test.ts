import { mockPluginParams } from '../test-utils';
import stripTSIgnorePlugin from '../../src/plugins/strip-ts-ignore';

describe('strip-ts-ignore plugin', () => {
  it('returns text without `// @ts-ignore`s', async () => {
    const text = `export class Foo {
  method1() {
    return foobar;
  }

  method2() {
    console.log(baz);

    // comment without ts ignore

    console.log("// @ts-ignore comment in string");

    const str = \`
    \${
      dne
    }
    \${var2}
\`);

    const result = Object.values(diffs).length
      ? Object.values(diffs)
          .reduce((x, y) => x + y)
          .toFixed(1)
      : 0;

    const str2 = \`\${var1} (\${method.call(
      arg1,
    )} \${var3})\`;

    const str3 = foo
      ? // @ts-ignore
        // @ts-ignore comment
        bar
      : baz;
  }

  method3() {
  }

  render() {
    return (
      <div>
        <DNE/>

      </div>
    );
  }
}
`;

    const result = await stripTSIgnorePlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`export class Foo {
  method1() {
    return foobar;
  }

  method2() {
    console.log(baz);

    // comment without ts ignore

    console.log("// @ts-ignore comment in string");

    const str = \`
    \${
      dne
    }
    \${var2}
\`);

    const result = Object.values(diffs).length
      ? Object.values(diffs)
          .reduce((x, y) => x + y)
          .toFixed(1)
      : 0;

    const str2 = \`\${var1} (\${method.call(
      arg1,
    )} \${var3})\`;

    const str3 = foo
      ?        bar
      : baz;
  }

  method3() {
  }

  render() {
    return (
      <div>
        <DNE/>

      </div>
    );
  }
}
`);
  });
});
