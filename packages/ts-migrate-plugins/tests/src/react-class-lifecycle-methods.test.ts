import { mockPluginParams } from '../test-utils';
import reactClassLifecycleMethodsPlugin from '../../src/plugins/react-class-lifecycle-methods';

describe('react-class-lifecycle-methods plugin', () => {
  it('annotates react lifecycle methods', async () => {
    const text = `import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  constructor(props) {}
  shouldComponentUpdate(nextProps, nextState) {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillReceiveProps(nextProps) {}
  componentWillUpdate(nextProps, nextState) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  constructor(props: FooProps) {}
  shouldComponentUpdate(nextProps: FooProps, nextState: FooState) {}
  componentDidUpdate(prevProps: FooProps, prevState: FooState) {}
  componentWillReceiveProps(nextProps: FooProps) {}
  componentWillUpdate(nextProps: FooProps, nextState: FooState) {}
  render() {}
}
`);
  });

  it('handles multiple components in the same file', async () => {
    const text = `import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps, nextState) {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillReceiveProps(nextProps) {}
  componentWillUpdate(nextProps, nextState) {}
  render() {}
}

type BarProps = {};
type BarState = {};

class Bar extends React.Component<BarProps, BarState> {
  shouldComponentUpdate(nextProps, nextState) {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillReceiveProps(nextProps) {}
  componentWillUpdate(nextProps, nextState) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps: FooProps, nextState: FooState) {}
  componentDidUpdate(prevProps: FooProps, prevState: FooState) {}
  componentWillReceiveProps(nextProps: FooProps) {}
  componentWillUpdate(nextProps: FooProps, nextState: FooState) {}
  render() {}
}

type BarProps = {};
type BarState = {};

class Bar extends React.Component<BarProps, BarState> {
  shouldComponentUpdate(nextProps: BarProps, nextState: BarState) {}
  componentDidUpdate(prevProps: BarProps, prevState: BarState) {}
  componentWillReceiveProps(nextProps: BarProps) {}
  componentWillUpdate(nextProps: BarProps, nextState: BarState) {}
  render() {}
}
`);
  });

  it('annotates props and no state', async () => {
    const text = `import React from 'react';

type FooProps = {};

class Foo extends React.Component<FooProps> {
  shouldComponentUpdate(nextProps) {}
  componentDidUpdate(prevProps) {}
  componentWillReceiveProps(nextProps) {}
  componentWillUpdate(nextProps) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

type FooProps = {};

class Foo extends React.Component<FooProps> {
  shouldComponentUpdate(nextProps: FooProps) {}
  componentDidUpdate(prevProps: FooProps) {}
  componentWillReceiveProps(nextProps: FooProps) {}
  componentWillUpdate(nextProps: FooProps) {}
  render() {}
}
`);
  });

  it('annotates props, state, and context', async () => {
    const text = `import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps, nextState, nextContext) {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillReceiveProps(nextProps, nextContext) {}
  componentWillUpdate(nextProps, nextState, nextContext) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps: FooProps, nextState: FooState, nextContext: any) {}
  componentDidUpdate(prevProps: FooProps, prevState: FooState) {}
  componentWillReceiveProps(nextProps: FooProps, nextContext: any) {}
  componentWillUpdate(nextProps: FooProps, nextState: FooState, nextContext: any) {}
  render() {}
}
`);
  });

  it('handles inline type declaration', async () => {
    const text = `import React from 'react';

class Foo extends React.Component<{ someProp: string }, { someState: number }> {
  shouldComponentUpdate(nextProps, nextState, nextContext) {}
  componentDidUpdate(prevProps, prevState) {}
  componentWillReceiveProps(nextProps, nextContext) {}
  componentWillUpdate(nextProps, nextState, nextContext) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

class Foo extends React.Component<{ someProp: string }, { someState: number }> {
  shouldComponentUpdate(nextProps: {
    someProp: string;
}, nextState: {
    someState: number;
}, nextContext: any) {}
  componentDidUpdate(prevProps: {
    someProp: string;
}, prevState: {
    someState: number;
}) {}
  componentWillReceiveProps(nextProps: {
    someProp: string;
}, nextContext: any) {}
  componentWillUpdate(nextProps: {
    someProp: string;
}, nextState: {
    someState: number;
}, nextContext: any) {}
  render() {}
}
`);
  });

  it('keeps existing type annotations', async () => {
    const text = `import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps: $TSFixMe, nextState: $TSFixMe) {}
  componentDidUpdate(prevProps: $TSFixMe, prevState: $TSFixMe) {}
  componentWillReceiveProps(nextProps: $TSFixMe) {}
  componentWillUpdate(nextProps: $TSFixMe, nextState: $TSFixMe) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(text);
  });

  it('overwrites existing type annotations with force option', async () => {
    const text = `import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps: $TSFixMe, nextState: $TSFixMe) {}
  componentDidUpdate(prevProps: $TSFixMe, prevState: $TSFixMe) {}
  componentWillReceiveProps(nextProps: $TSFixMe) {}
  componentWillUpdate(nextProps: $TSFixMe, nextState: $TSFixMe) {}
  render() {}
}
`;

    const result = await reactClassLifecycleMethodsPlugin.run(
      mockPluginParams({ options: { force: true }, text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

type FooProps = {};
type FooState = {};

class Foo extends React.Component<FooProps, FooState> {
  shouldComponentUpdate(nextProps: FooProps, nextState: FooState) {}
  componentDidUpdate(prevProps: FooProps, prevState: FooState) {}
  componentWillReceiveProps(nextProps: FooProps) {}
  componentWillUpdate(nextProps: FooProps, nextState: FooState) {}
  render() {}
}
`);
  });
});
