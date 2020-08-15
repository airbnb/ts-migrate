import { mockPluginParams } from '../test-utils';
import hoistClassStaticsPlugin from '../../src/plugins/hoist-class-statics';

describe('hoist-class-statics plugin', () => {
  it('hoists static class properties', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = {
  foo: PropTypes.string.isRequired,
};

Foo.fragments = \`some graphql fragment\`;

class Bar extends React.Component {
  render() {}
}

Bar.propTypes = {
  bar: PropTypes.string,
};

Bar.defaultProps = {
  bar: 'bar value',
};
`;

    const result = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';

class Foo extends React.Component {
static propTypes = {
    foo: PropTypes.string.isRequired,
};

static fragments = \`some graphql fragment\`;

  render() {}
}

class Bar extends React.Component {
static propTypes = {
    bar: PropTypes.string,
};

static defaultProps = {
    bar: 'bar value',
};

  render() {}
}
`);
  });

  it('hoist statics along with their dependencies', async () => {
    const text = `import React from 'react';

class Foo extends React.Component {
  render() {}
}

const LOGGING_ID = 'foo.bar';

Foo.loggingId = LOGGING_ID;
`;

    const result = await hoistClassStaticsPlugin.run(
      mockPluginParams({
        fileName: 'file.tsx',
        options: { anyAlias: '$TSFixMe' },
        text,
      }),
    );

    expect(result).toBe(`import React from 'react';

class Foo extends React.Component {
static loggingId: $TSFixMe;

  render() {}
}

const LOGGING_ID = 'foo.bar';

Foo.loggingId = LOGGING_ID;
`);
  });

  it('when hoisting global variables are considered defined', async () => {
    const text = `import React from 'react';
import { buttonProps } from './private';

class Foo extends React.Component {
  render() {}
}

Foo.propTypes = {
  date: new Date(),
  max: Number.MAX_SAFE_INTEGER,
  buttonProps: Object.assign({}, buttonProps)
};
`;

    const result = await hoistClassStaticsPlugin.run(
      mockPluginParams({
        fileName: 'file.tsx',
        options: { anyAlias: '$TSFixMe' },
        text,
      }),
    );

    expect(result).toBe(`import React from 'react';
import { buttonProps } from './private';

class Foo extends React.Component {
static propTypes = {
    date: new Date(),
    max: Number.MAX_SAFE_INTEGER,
    buttonProps: Object.assign({}, buttonProps)
};

  render() {}
}
`);
  });

  it('works with spread withStylePropsTypes', async () => {
    const text = `import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, withStylesPropTypes } from ':dls-themes/withStyles';

const propTypes = {
  ...withStylesPropTypes,
  data: PropTypes.shape({
    mantaro: PropTypes.shape({
      initialLoadForNewListingOnWeb: PropTypes.shape({
        ownedListings: PropTypes.arrayOf(OwnedListingShape),
      }),
    }),
  }),
};

const defaultProps = {
  data: null,
};

class DuplicateListing extends React.Component {
  render() {

  }
}

DuplicateListing.propTypes = propTypes;
DuplicateListing.defaultProps = defaultProps;
`;
    const result = await hoistClassStaticsPlugin.run(
      mockPluginParams({
        fileName: 'file.tsx',
        options: { anyAlias: '$TSFixMe' },
        text,
      }),
    );

    expect(result).toBe(`import React from 'react';
import PropTypes from 'prop-types';
import { withStyles, withStylesPropTypes } from ':dls-themes/withStyles';

const propTypes = {
  ...withStylesPropTypes,
  data: PropTypes.shape({
    mantaro: PropTypes.shape({
      initialLoadForNewListingOnWeb: PropTypes.shape({
        ownedListings: PropTypes.arrayOf(OwnedListingShape),
      }),
    }),
  }),
};

const defaultProps = {
  data: null,
};

class DuplicateListing extends React.Component {
static propTypes = propTypes;

static defaultProps = defaultProps;

  render() {

  }
}
`);
  });

  it('works with functional shorthand property defintions', async () => {
    const text = `import React from 'react';

class AsyncComponent extends React.Component {
  render() {}
}

AsyncComponent.defaultProps = {
  onComponentFinishLoading() {},
  placeholderHeight: null,
  renderPlaceholder: null,
  /**
   * Some comment
   */
  loadReady: true,
};
`;

    const result = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`import React from 'react';

class AsyncComponent extends React.Component {
static defaultProps = {
    onComponentFinishLoading() { },
    placeholderHeight: null,
    renderPlaceholder: null,
    /**
     * Some comment
     */
    loadReady: true,
};

  render() {}
}
`);
  });

  it('should be idempotent', async () => {
    const text = `import React from 'react';

class Foo extends React.Component {
  render() {}
}

const BLUE = 'blue';

Foo.defaultProps = {
  theme: BLUE,
};
`;

    const firstResult = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { anyAlias: '$TSFixMe' } }),
    );

    expect(firstResult).toBe(`import React from 'react';

class Foo extends React.Component {
static defaultProps: $TSFixMe;

  render() {}
}

const BLUE = 'blue';

Foo.defaultProps = {
  theme: BLUE,
};
`);

    const secondResult = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text: firstResult || '', fileName: 'file.tsx' }),
    );

    expect(secondResult).toBe(firstResult);
  });

  it('should be idempotent -- real example', async () => {
    const text = `import alt from '../alt';
import {} from ':someImport';

const initialState = {
  // Address sanitization state
  flagA: false,
  flagB: false,
  flagC: false,
  flagD: null,
  flagA: null,

  // Pin drag state
  SomeValues1: false,
  SomeValues2: false,
  SomeValues3: {},
  SomeValues4: false,
  SomeValues5: false,
  SomeValues6: null,
  SomeValues7: null,
  SomeValues8: null,
  SomeValues9: {},
};

function computeInitialState({ A }: $TSFixMe) {
  const notCountry = L10n.a() !== 'A';
  return {
    // address precision flags should be true for all users outside of China
    flagA: notCountry,
    flagB: notCountry,
    flagC: notCountry,
    flagD: false,
    flagA: notCountry ? 250 : null,
  };
}

function onDeserialize(data: $TSFixMe) {
  return {
    ...initialState,
    ...computeInitialState(data),
  };
}

/**
 * comment
 */
class Store {
  bindActions: $TSFixMe;

  setState: $TSFixMe;

  state: $TSFixMe;

  constructor() {
    this.state = {
      ...initialState,
    };
    this.bindActions({});
  }

  methodA(center: $TSFixMe) {
    this.setState({ flagA: center });
  }

  methodB(A: $TSFixMe) {
    this.setState({ A });
  }

  methodC(param: $TSFixMe) {
    this.setState({ param });
  }

  methodD(param: $TSFixMe) {
    this.setState({ param });
  }

  methodF(param: $TSFixMe) {
    if (param) {
      this.methodG(true);
    } else {
      this.methodA(false);
    }

    this.setState({ param });
  }

  methodG(param: $TSFixMe) {
    this.setState({ param });
  }

  methodAA(param: $TSFixMe) {
    this.setState({ F: false });
  }

  methodAB() {
    this.setState({ A: null });
  }

  renderA() {
    this.setState({ flagB: true });
  }

  hideA() {
    this.setState({
      flagA: false,
      flagB: null,
    });
  }

  changeA(_: $TSFixMe) {
    this.setState({
      flagA: false,
      flagB: true,
    });
  }

  backA() {
    this.setState({
      flagA: true,
      flagD: null,
    });
  }

  backB() {
    this.setState({
      foo: true,
    });
  }
}

Store.config = { onDeserialize };
export default alt.createStore(Store, 'Store');
`;

    const firstResult = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options: { anyAlias: '$TSFixMe' } }),
    );

    expect(firstResult).toBe(`import alt from '../alt';
import {} from ':someImport';

const initialState = {
  // Address sanitization state
  flagA: false,
  flagB: false,
  flagC: false,
  flagD: null,
  flagA: null,

  // Pin drag state
  SomeValues1: false,
  SomeValues2: false,
  SomeValues3: {},
  SomeValues4: false,
  SomeValues5: false,
  SomeValues6: null,
  SomeValues7: null,
  SomeValues8: null,
  SomeValues9: {},
};

function computeInitialState({ A }: $TSFixMe) {
  const notCountry = L10n.a() !== 'A';
  return {
    // address precision flags should be true for all users outside of China
    flagA: notCountry,
    flagB: notCountry,
    flagC: notCountry,
    flagD: false,
    flagA: notCountry ? 250 : null,
  };
}

function onDeserialize(data: $TSFixMe) {
  return {
    ...initialState,
    ...computeInitialState(data),
  };
}

/**
 * comment
 */
class Store {
static config: $TSFixMe;

  bindActions: $TSFixMe;

  setState: $TSFixMe;

  state: $TSFixMe;

  constructor() {
    this.state = {
      ...initialState,
    };
    this.bindActions({});
  }

  methodA(center: $TSFixMe) {
    this.setState({ flagA: center });
  }

  methodB(A: $TSFixMe) {
    this.setState({ A });
  }

  methodC(param: $TSFixMe) {
    this.setState({ param });
  }

  methodD(param: $TSFixMe) {
    this.setState({ param });
  }

  methodF(param: $TSFixMe) {
    if (param) {
      this.methodG(true);
    } else {
      this.methodA(false);
    }

    this.setState({ param });
  }

  methodG(param: $TSFixMe) {
    this.setState({ param });
  }

  methodAA(param: $TSFixMe) {
    this.setState({ F: false });
  }

  methodAB() {
    this.setState({ A: null });
  }

  renderA() {
    this.setState({ flagB: true });
  }

  hideA() {
    this.setState({
      flagA: false,
      flagB: null,
    });
  }

  changeA(_: $TSFixMe) {
    this.setState({
      flagA: false,
      flagB: true,
    });
  }

  backA() {
    this.setState({
      flagA: true,
      flagD: null,
    });
  }

  backB() {
    this.setState({
      foo: true,
    });
  }
}

Store.config = { onDeserialize };
export default alt.createStore(Store, 'Store');
`);

    const secondResult = await hoistClassStaticsPlugin.run(
      mockPluginParams({ text: firstResult || '', fileName: 'file.tsx' }),
    );

    expect(secondResult).toBe(firstResult);
  });
});
