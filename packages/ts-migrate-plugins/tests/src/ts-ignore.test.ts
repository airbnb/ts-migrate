import tsIgnorePlugin from '../../src/plugins/ts-ignore';
import { mockPluginParams, mockDiagnostic } from '../test-utils';

describe('ts-ignore plugin', () => {
  it('adds ignore comment', async () => {
    const text = "comsole.log('Hello');";
    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'comsole')],
      }),
    );
    expect(result).toBe(`// @ts-expect-error ts-migrate(123) FIXME: diagnostic message
comsole.log('Hello');`);
  });

  it('adds ignore comment with ts-ignore', async () => {
    const text = "comsole.log('Hello');";
    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'comsole')],
        options: { useTsIgnore: true },
      }),
    );
    expect(result).toBe(`// @ts-ignore ts-migrate(123) FIXME: diagnostic message
comsole.log('Hello');`);
  });

  it('adds ignore comment in jsx', async () => {
    const text = `import React from 'react';

function Foo() {
  return (
    <div>
      <DoesNotExist />
    </div>
  );
}

export default Foo;
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'DoesNotExist')],
      }),
    );

    expect(result).toBe(`import React from 'react';

function Foo() {
  return (
    <div>
      {/* @ts-expect-error ts-migrate(123) FIXME: diagnostic message */}
      <DoesNotExist />
    </div>
  );
}

export default Foo;
`);
  });
  it('adds ignore comment in jsx with Fragment', async () => {
    const text = `import React from 'react';

function Foo() {
  return (
    <>
      <DoesNotExist />
    </>
  );
}

export default Foo;
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'DoesNotExist')],
      }),
    );

    expect(result).toBe(`import React from 'react';

function Foo() {
  return (
    <>
      {/* @ts-expect-error ts-migrate(123) FIXME: diagnostic message */}
      <DoesNotExist />
    </>
  );
}

export default Foo;
`);
  });

  it('truncates error message if too long', async () => {
    const text = "comsole.log('Hello');";
    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [
          mockDiagnostic(text, 'comsole', {
            messageText: 'This message is too long to print and should be truncated',
          }),
        ],
      }),
    );
    expect(result)
      .toBe(`// @ts-expect-error ts-migrate(123) FIXME: This message is too long to print and should be tr... Remove this comment to see the full error message
comsole.log('Hello');`);
  });

  it('does not add ignore comment for webpackChunkName', async () => {
    const text = `const getComponent = normalizeLoader(() =>
  import(
    /* webpackChunkName: "Component_async" */
    './this_module_does_not_exist'
  ),
);
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'this_module_does_not_exist')],
      }),
    );

    expect(result).toBe(`const getComponent = normalizeLoader(() =>
  import(
    /* webpackChunkName: "Component_async" */
    './this_module_does_not_exist'
  ),
);
`);
  });

  it('handles error within ternary when true', async () => {
    const text = `function foo() {
  return something
    ? doesNotExist
    : other;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'doesNotExist')],
      }),
    );

    expect(result).toBe(`function foo() {
  return something
    ? // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
      doesNotExist
    : other;
}
`);
  });

  it('handles error within ternary when false', async () => {
    const text = `function foo() {
  return something
    ? other
    : doesNotExist;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'doesNotExist')],
      }),
    );

    expect(result).toBe(`function foo() {
  return something
    ? other
    : // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
      doesNotExist;
}
`);
  });

  it('handles error within ternary jsx expression', async () => {
    const text = `function Foo() {
  return someBoolean
    ? <ComponentA />
    : <ComponentB />;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'ComponentA')],
      }),
    );

    expect(result).toBe(`function Foo() {
  return someBoolean
    ? // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
      <ComponentA />
    : <ComponentB />;
}
`);
  });

  it('handles error within ternary property access', async () => {
    const text = `function Foo() {
  return someBoolean
    ? this.props.doesNotExist
    : <SomeComponent />;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'doesNotExist')],
      }),
    );

    expect(result).toBe(`function Foo() {
  return someBoolean
    ? // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
      this.props.doesNotExist
    : <SomeComponent />;
}
`);
  });

  it('handles neighboring eslint disable comment', async () => {
    const text = `function foo() {
  // eslint-disable-next-line
  return doesNotExist;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'doesNotExist')],
      }),
    );

    expect(result).toBe(`function foo() {
  // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
  // eslint-disable-next-line
  return doesNotExist;
}
`);
  });

  it('handles multiline ternary', async () => {
    const text = `function Foo() {
  return someBoolean ? (
    <ComponentA
      doesNotExist="fail"
    />
  ) : (
    <ComponentB />
  );
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'doesNotExist')],
      }),
    );

    expect(result).toBe(`function Foo() {
  return someBoolean ? (
    <ComponentA
      // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
      doesNotExist="fail"
    />
  ) : (
    <ComponentB />
  );
}
`);
  });

  it('handles single line ternary', async () => {
    const text = `function Foo() {
  return someBoolean ? <ComponentA /> : <ComponentB />;
}
`;

    const result = await tsIgnorePlugin.run(
      mockPluginParams({
        fileName: 'Foo.tsx',
        text,
        semanticDiagnostics: [mockDiagnostic(text, 'ComponentA')],
      }),
    );

    expect(result).toBe(`function Foo() {
  // @ts-expect-error ts-migrate(123) FIXME: diagnostic message
  return someBoolean ? <ComponentA /> : <ComponentB />;
}
`);
  });
});
