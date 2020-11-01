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

    // @ts-expect-error comment with expect error
    const result = Object.values(diffs).length
      ? Object.values(diffs)
          .reduce((x, y) => x + y)
          // @ts-expect-error comment with expect error
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

  it(`returns text without {/* @ts-ignores */}`, async () => {
    const text = `import React from 'react'
    import './App.css';


    const a:any = {}
    function App() {
      const fn = () => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'b' does not exist on type '{}'.
        console.log('ab', a.b)
      }
      return (
        <div className="App">
          <header className="App-header">
            <p>
      {/* @ts-expect-error ts-migrate(2339) FIXME: Property 'b' does not exist on type '{}'. */}
      Edit <code>src/App.js {a.b}</code> and save to reload.
            </p>
            <a
              className="App-link"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >

            </a>
          </header>
        </div>
      );
    }

    export default App;
    `;
    const result = await stripTSIgnorePlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react'
    import './App.css';


    const a:any = {}
    function App() {
      const fn = () => {
        console.log('ab', a.b)
      }
      return (
        <div className="App">
          <header className="App-header">
            <p>
      Edit <code>src/App.js {a.b}</code> and save to reload.
            </p>
            <a
              className="App-link"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >

            </a>
          </header>
        </div>
      );
    }

    export default App;
    `);
  });
});
