import { mockPluginParams } from '../test-utils';
import reactPropsPlugin from '../../src/plugins/react-props';

describe('react-props plugin', () => {
  it('handles class with propTypes declared as a separate variable', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  render() {}
}

export default Foo;
`);

    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({ text, fileName: 'Foo.tsx', options: { shouldKeepPropTypes: true } }),
    );

    expect(resultWithProps).toBe(`import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  render() {}
}

Foo.propTypes = propTypes;

export default Foo;
`);
  });

  it('handles functional component with forwardRef', async () => {
    const text = `import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const Foo = forwardRef(({ foo }, ref) => <div ref={ref}>{foo}</div>)

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React, { forwardRef } from 'react';

type Props = {
    foo: string;
};

const Foo = forwardRef<any, Props>(({ foo }, ref) => <div ref={ref}>{foo}</div>)

export default Foo;
`);

    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({ text, fileName: 'Foo.tsx', options: { shouldKeepPropTypes: true } }),
    );

    expect(resultWithProps).toBe(`import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

type Props = {
    foo: string;
};

const Foo = forwardRef<any, Props>(({ foo }, ref) => <div ref={ref}>{foo}</div>)

Foo.propTypes = propTypes;

export default Foo;
`);
  });

  it('handles react functional component if forward ref is not destructured', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const Foo = React.forwardRef(({ foo }, ref) => <div ref={ref}>{foo}</div>)

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

const Foo = React.forwardRef<any, Props>(({ foo }, ref) => <div ref={ref}>{foo}</div>)

export default Foo;
`);
  });

  it('handles forwardRef being used separately from component', async () => {
    const text = `import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const Foo = ({ foo }, ref) => <div ref={ref}>{foo}</div>;

Foo.propTypes = propTypes;

const WrappedComponent = forwardRef(Foo);

export default WrappedComponent;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React, { forwardRef } from 'react';

type FooProps = {
    foo: string;
};

const Foo = ({ foo }: FooProps, ref) => <div ref={ref}>{foo}</div>;

const WrappedComponent = forwardRef(Foo);

export default WrappedComponent;
`);

    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({ text, fileName: 'Foo.tsx', options: { shouldKeepPropTypes: true } }),
    );

    expect(resultWithProps).toBe(`import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

type FooProps = {
    foo: string;
};

const Foo = ({ foo }: FooProps, ref) => <div ref={ref}>{foo}</div>;

Foo.propTypes = propTypes;

const WrappedComponent = forwardRef(Foo);

export default WrappedComponent;
`);
  });

  it('handles class with propTypes declared as a separate variable wrapped in forbidExtraProps', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

const propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'file.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  render() {}
}

export default Foo;
`);
  });

  it('handles class with propTypes declared inline', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  render() {}
}

export default Foo;
`);
    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
          shouldKeepPropTypes: true,
        },
      }),
    );

    expect(resultWithProps).toBe(`import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  render() {}
}

Foo.propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

export default Foo;
`);
  });

  it('handles class with propTypes declared as a static class property', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

class Foo extends React.Component {
  static propTypes = forbidExtraProps({
    foo: PropTypes.string.isRequired,
  });

  render() {}
}

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {

  render() {}
}

export default Foo;
`);

    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
          shouldKeepPropTypes: true,
        },
      }),
    );

    expect(resultWithProps).toBe(`import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  static propTypes = forbidExtraProps({
    foo: PropTypes.string.isRequired,
  });

  render() {}
}

export default Foo;
`);
  });

  it('handles class with propTypes declared as a static with a separate variable', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

class Foo extends React.Component {
  static propTypes = propTypes;

  render() {}
}

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {

  render() {}
}

export default Foo;
`);
  });

  it('handles multiple components with propTypes in the same file', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

function Baz({ baz }) {
  return <div />;
}

Baz.propTypes = {
  baz: PropTypes.bool.isRequired,
};

class Bar extends React.Component {
  render() {}
}

Bar.propTypes = forbidExtraProps({
  bar: PropTypes.string.isRequired,
});

class Foo extends React.Component {
  render() {
    return <Bar bar={this.props.foo} />;
  }
}

Foo.propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';

type BazProps = {
    baz: boolean;
};

function Baz({ baz }: BazProps) {
  return <div />;
}

type BarProps = {
    bar: string;
};

class Bar extends React.Component<BarProps> {
  render() {}
}

type FooProps = {
    foo: string;
};

class Foo extends React.Component<FooProps> {
  render() {
    return <Bar bar={this.props.foo} />;
  }
}

export default Foo;
`);
  });

  it('handles sfc and class component with propTypes in the same file', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

function Bar({ bar }) {
  return <div>{bar}</div>;
}

Bar.propTypes = forbidExtraProps({
  bar: PropTypes.string.isRequired,
});

class Foo extends React.Component {
  render() {
    return <Bar bar={this.props.foo} />;
  }
}

Foo.propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';

type BarProps = {
    bar: string;
};

function Bar({ bar }: BarProps) {
  return <div>{bar}</div>;
}

type FooProps = {
    foo: string;
};

class Foo extends React.Component<FooProps> {
  render() {
    return <Bar bar={this.props.foo} />;
  }
}

export default Foo;
`);
  });

  it('only removes imports if they are unused', async () => {
    const text = `import React from 'react';
import PropTypes, { any } from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

const propTypes = forbidExtraProps({
  foo: PropTypes.string.isRequired,
});

class Foo extends React.Component {
  static contextTypes = { client: PropTypes.object };

  render() {}
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'file.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';
import PropTypes from "prop-types";

type Props = {
    foo: string;
};

class Foo extends React.Component<Props> {
  static contextTypes = { client: PropTypes.object };

  render() {}
}

export default Foo;
`);
  });

  it('does not modify class with existing props type', async () => {
    const text = `import React from 'react';

type FooProps = {
  fooProp: string;
};

class Foo extends React.Component<FooProps> {
  render() {}
}

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(text);

    const resultWithProps = await reactPropsPlugin.run(
      mockPluginParams({ text, fileName: 'Foo.tsx', options: { shouldKeepPropTypes: true } }),
    );

    expect(resultWithProps).toBe(text);
  });

  it('preserves existing state type', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

type FooState = {
  fooState: string;
};

class Foo extends React.Component<{}, FooState> {
  render() {}
}

Foo.propTypes = {
  message: PropTypes.string.isRequired,
};

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type FooState = {
  fooState: string;
};

type Props = {
    message: string;
};

class Foo extends React.Component<Props, FooState> {
  render() {}
}

export default Foo;
`);
  });

  it('does not modify class without props', async () => {
    const text = `import React from 'react';

class Foo extends React.Component {
  render() {}
}

export default Foo;
`;
    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(text);
  });

  it('does not modify class with state and no props', async () => {
    const text = `import React from 'react';

type State = {
  value: string;
};

class Foo extends React.Component<{}, State> {
  render() {}
}

export default Foo;
`;
    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(text);
  });

  it('handles class with propTypes, defaultProps, state, and contextTypes', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  prop: PropTypes.number,
};

const defaultProps = {
  prop: 1,
};

type State = {
  value: string;
};

const contextTypes = {
  context: PropTypes.bool,
};

class Foo extends React.Component<{}, State> {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  static contextTypes = contextTypes;

  render() {}
}

export default Foo;
`;
    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';

type Props = {
    prop?: number;
};

const defaultProps = {
  prop: 1,
};

type State = {
  value: string;
};

const contextTypes = {
  context: PropTypes.bool,
};

class Foo extends React.Component<Props, State> {
  static defaultProps = defaultProps;
  static contextTypes = contextTypes;

  render() {}
}

export default Foo;
`);
  });

  it('handles sfc function declaration', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

function Foo({ foo }) {
  return <div>{foo}</div>;
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

function Foo({ foo }: Props) {
  return <div>{foo}</div>;
}

export default Foo;
`);
  });

  it('handles sfc arrow function', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const Foo = ({ foo }) => <div>{foo}</div>;

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    foo: string;
};

const Foo = ({ foo }: Props) => <div>{foo}</div>;

export default Foo;
`);
  });

  it('preserves sfc function declaration context arg', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const contextTypes = {
  bar: PropTypes.number.isRequired,
};

function Foo({ foo }, { bar }) {
  return <div>{foo}</div>;
}

Foo.propTypes = propTypes;
Foo.contextTypes = contextTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';

type Props = {
    foo: string;
};

const contextTypes = {
  bar: PropTypes.number.isRequired,
};

function Foo({ foo }: Props, { bar }) {
  return <div>{foo}</div>;
}
Foo.contextTypes = contextTypes;

export default Foo;
`);
  });

  it('preserves sfc arrow function context arg', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  foo: PropTypes.string.isRequired,
};

const contextTypes = {
  bar: PropTypes.number.isRequired,
};

const Foo = ({ foo }, { bar }) => <div>{foo}</div>;

Foo.propTypes = propTypes;
Foo.contextTypes = contextTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';

type Props = {
    foo: string;
};

const contextTypes = {
  bar: PropTypes.number.isRequired,
};

const Foo = ({ foo }: Props, { bar }) => <div>{foo}</div>;
Foo.contextTypes = contextTypes;

export default Foo;
`);
  });

  it('does not modify sfc function declaration with existing props type', async () => {
    const text = `import React from 'react';

type Props = {
  foo: string;
};

function Foo({ foo }: Props) {
  return <div>{foo}</div>;
}

Foo.propTypes = {
  foo: PropTypes.string.isRequired,
};

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(text);
  });

  it('does not modify sfc arrow function with existing props type', async () => {
    const text = `import React from 'react';

type Props = {
  foo: string;
};

const Foo = ({ foo }: Props) => <div>{foo}</div>;

Foo.propTypes = {
  foo: PropTypes.string.isRequired,
};

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(text);
  });

  it('replaces spread prop types', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, withStylesPropTypes } from ':dls-themes/withStyles';
import withBreakpoint, { withBreakpointPropTypes } from ':dls-core/components/breakpoints/withBreakpoint';
import { withRouter } from 'react-router';
import withRouterPropTypes from ':routing/shapes/RR4PropTypes';
import { buttonProps } from './somewhere/Button';

const propTypes = forbidExtraProps({
  foo: PropTypes.string,
  ...withStylesPropTypes,
  ...withBreakpointPropTypes,
  ...withRouterPropTypes,
  ...buttonProps,
});

function Foo({}) {
  return <div />;
}

Foo.propTypes = propTypes;

export default withStyles(() => ({}))(withBreakpoint(withRouter(Foo)));
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
        options: {
          shouldUpdateAirbnbImports: true,
        },
      }),
    );

    expect(result).toBe(`import React from 'react';
import { withStyles, WithStylesProps } from ":dls-themes/withStyles";
import withBreakpoint, { WithBreakpointProps } from ":dls-core/components/breakpoints/withBreakpoint";
import { withRouter } from 'react-router';
import { buttonProps } from './somewhere/Button';
import { RouteConfigComponentProps } from "react-router-config";

/*
(ts-migrate) TODO: Migrate the remaining prop types
...buttonProps
*/
type Props = {
    foo?: string;
} & WithStylesProps & WithBreakpointProps & RouteConfigComponentProps<{}>;

function Foo({}: Props) {
  return <div />;
}

export default withStyles(() => ({}))(withBreakpoint(withRouter(Foo)));
`);
  });

  it('replaces spread prop types without an option', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, withStylesPropTypes } from ':dls-themes/withStyles';
import withBreakpoint, { withBreakpointPropTypes } from ':dls-core/components/breakpoints/withBreakpoint';
import { withRouter } from 'react-router';
import withRouterPropTypes from ':routing/shapes/RR4PropTypes';
import { buttonProps } from './somewhere/Button';

const propTypes = forbidExtraProps({
  foo: PropTypes.string,
  ...withStylesPropTypes,
  ...withBreakpointPropTypes,
  ...withRouterPropTypes,
  ...buttonProps,
});

function Foo({}) {
  return <div />;
}

Foo.propTypes = propTypes;

export default withStyles(() => ({}))(withBreakpoint(withRouter(Foo)));
`;

    const result = await reactPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'Foo.tsx',
      }),
    );

    expect(result).toBe(`import React from 'react';
import { withStyles, withStylesPropTypes, WithStylesProps } from ":dls-themes/withStyles";
import withBreakpoint, { withBreakpointPropTypes, WithBreakpointProps } from ":dls-core/components/breakpoints/withBreakpoint";
import { withRouter } from 'react-router';
import withRouterPropTypes from ':routing/shapes/RR4PropTypes';
import { buttonProps } from './somewhere/Button';
import { RouteConfigComponentProps } from "react-router-config";

/*
(ts-migrate) TODO: Migrate the remaining prop types
...buttonProps
*/
type Props = {
    foo?: string;
} & WithStylesProps & WithBreakpointProps & RouteConfigComponentProps<{}>;

function Foo({}: Props) {
  return <div />;
}

export default withStyles(() => ({}))(withBreakpoint(withRouter(Foo)));
`);
  });

  it('uses shape type', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import UserShape from ':shapes/UserShape';

const propTypes = forbidExtraProps({
  foo: PropTypes.string,
  user: UserShape,
});

function Foo({}) {
  return <div />;
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import UserShape from ':shapes/UserShape';

type Props = {
    foo?: string;
    user?: UserShape;
};

function Foo({}: Props) {
  return <div />;
}

export default Foo;
`);
  });

  it('comments out unprocessed props', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const b = PropTypes.string;

const propTypes = forbidExtraProps({
  foo: PropTypes.string,
  a() {
    return true;
  },
  b,
  get c() {},
});

function Foo({}) {
  return <div />;
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';

const b = PropTypes.string;

/*
(ts-migrate) TODO: Migrate the remaining prop types
a() {
    return true;
  }
b
get c() {}
*/
type Props = {
    foo?: string;
};

function Foo({}: Props) {
  return <div />;
}

export default Foo;
`);
  });

  it('includes children prop for sfcs', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = forbidExtraProps({
  children: PropTypes.node,
});

function Foo({}) {
  return <div />;
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {
    children?: React.ReactNode;
};

function Foo({}: Props) {
  return <div />;
}

export default Foo;
`);
  });

  it('excludes children prop for classes', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

const propTypes = forbidExtraProps({
  children: PropTypes.node,
});

class Foo extends React.Component {
  render() {
    return <div />;
  }
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';

type Props = {};

class Foo extends React.Component<Props> {
  render() {
    return <div />;
  }
}

export default Foo;
`);
  });

  it('handle textlike proptype correctly', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import textlike from 'airbnb-dls-web/build/utils/propTypes/textlike';

const propTypes = {
  foo: textlike,
};

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = propTypes;

export default Foo;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from 'react';
import textlike from 'airbnb-dls-web/build/utils/propTypes/textlike';

type Props = {
    foo?: string | React.ReactNode;
};

class Foo extends React.Component<Props> {
  render() {}
}

export default Foo;
`);
  });

  it('Handles destructuring of prop-types', async () => {
    const text = `import React from "react";
import { oneOf, node, func as propTypeFn } from "prop-types";
import SomeClass from "someclass";

const Foo = ({ children, className }) => {
  return <div className={className}>children</div>;
};

Foo.propTypes = {
  children: node,
  callback: propTypeFn,
  someObject: SomeClass,
};

export default Foo;`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`import React from "react";
import SomeClass from "someclass";

type Props = {
    children?: React.ReactNode;
    callback?: (...args: any[]) => any;
    someObject?: SomeClass;
};

const Foo = ({ children, className }: Props) => {
  return <div className={className}>children</div>;
};

export default Foo;`);
  });

  it('do not crash on the Types.shape()', async () => {
    const text = `
import React from 'react';
import Types from 'prop-types';
import Link from ':dls-legacy-16/components/deprecated/Link_20190703';
import Spacing from ':dls-legacy-16/components/exp/Spacing';
const propTypes = {
  subtitle: Types.string.isRequired,
  learnMoreLinkText: Types.string.isRequired,
  paymentPlanModalContent: Types.shape().isRequired,
  showPaymentPlanModal: Types.func.isRequired,
};
export default class PaymentPlanOptionExplanation extends React.PureComponent {
  render() {
    const {
      subtitle,
      learnMoreLinkText,
      paymentPlanModalContent,
      showPaymentPlanModal,
    } = this.props;
    return (
      <div>
        {subtitle}
        <Spacing left={0.5} inline>
          <Link onPress={() => showPaymentPlanModal(paymentPlanModalContent)}>
            {learnMoreLinkText}
          </Link>
        </Spacing>
      </div>
    );
  }
}
PaymentPlanOptionExplanation.propTypes = propTypes;
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`
import React from 'react';
import Link from ':dls-legacy-16/components/deprecated/Link_20190703';
import Spacing from ':dls-legacy-16/components/exp/Spacing';
type Props = {
    subtitle: string;
    learnMoreLinkText: string;
    paymentPlanModalContent: any; // TODO: Types.shape()
    showPaymentPlanModal: (...args: any[]) => any;
};
export default class PaymentPlanOptionExplanation extends React.PureComponent<Props> {
  render() {
    const {
      subtitle,
      learnMoreLinkText,
      paymentPlanModalContent,
      showPaymentPlanModal,
    } = this.props;
    return (
      <div>
        {subtitle}
        <Spacing left={0.5} inline>
          <Link onPress={() => showPaymentPlanModal(paymentPlanModalContent)}>
            {learnMoreLinkText}
          </Link>
        </Spacing>
      </div>
    );
  }
}
`);
  });

  it('handles single-parameter arrow functions with no parentheses', async () => {
    const text = `\
const InfoPanel = props => {
  return null;
};

InfoPanel.propTypes = {
  foo: PropTypes.bool,
};
`;

    const result = await reactPropsPlugin.run(mockPluginParams({ text, fileName: 'Foo.tsx' }));

    expect(result).toBe(`

type Props = {
    foo?: boolean;
};const InfoPanel =(props: Props) => {
  return null;
};
`);
  });
});
