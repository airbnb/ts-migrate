import reactDefaultPropsPlugin from '../../src/plugins/react-default-props';
import { mockPluginParams } from '../test-utils';

describe('react-default-props plugin', () => {
  const options = { useDefaultPropsHelper: true };
  it('basic component with defaultProps as a variable', async () => {
    const text = `import React from 'react';

type Props = {
  test: string;
};

const defaultProps = {
  test: '',
};

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnProps = {
    test: string;
};

const defaultProps = {
  test: '',
};

type Props = WithDefaultProps<OwnProps, typeof defaultProps>;

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`);
  });

  it('basic component with defaultProps as a variable, without helper', async () => {
    const text = `import React from 'react';

type Props = {
  test: string;
};

const defaultProps = {
  test: '',
};

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({
        text,
        fileName: 'file.tsx',
      }),
    );

    expect(result).toBe(`import React from 'react';

type OwnProps = {
    test: string;
};

const defaultProps = {
  test: '',
};

type Props = OwnProps & typeof defaultProps;

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`);
  });

  it('arrow function component with defaultProps as a variable', async () => {
    const text = `import React from 'react';

type Props = {
  test: string;
};

const defaultProps = {
  test: '',
};

const ExampleComponent = ({ test }: Props) => {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnProps = {
    test: string;
};

const defaultProps = {
  test: '',
};

type Props = WithDefaultProps<OwnProps, typeof defaultProps>;

const ExampleComponent = ({ test }: Props) => {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`);
  });

  it('basic component with defaultProps assignment as an object', async () => {
    const text = `import React from 'react';

type Props = {
  test: string;
};

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = {
  test: '',
};

export default ExampleComponent;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnProps = {
    test: string;
};

type Props = WithDefaultProps<OwnProps, typeof ExampleComponent.defaultProps>;

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = {
  test: '',
};

export default ExampleComponent;`);
  });

  it('WithStylesProps in props type at first place', async () => {
    const text = `import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type Props = WithStylesProps & { message?: string };

const defaultProps = { message: '' };

function Hello({ message, css, styles }: Props) {
  return <div {...css(styles.container)}>{message}</div>;
}

Hello.defaultProps = defaultProps;
export default withStyles(() => ({
  container: {
    /* ... */
  },
}))(Hello);`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type OwnProps = {
    message?: string;
};

const defaultProps = { message: '' };

type Props = WithDefaultProps<OwnProps, typeof defaultProps> & WithStylesProps;

function Hello({ message, css, styles }: Props) {
  return <div {...css(styles.container)}>{message}</div>;
}

Hello.defaultProps = defaultProps;
export default withStyles(() => ({
  container: {
    /* ... */
  },
}))(Hello);`);
  });

  it('basic class component with default props', async () => {
    const text = `import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

const defaultProps = { message: '' };

type Props = { message?: string } & WithStylesProps;

class Hello extends React.Component<Props> {
  static defaultProps = defaultProps;

  render() {
    const { message, css, styles } = this.props;
    return <div {...css(styles.container)}>{message}</div>;
  }
}

export default withStyles(() => ({
  container: {
    /* ... */
  },
}))(Hello);`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

const defaultProps = { message: '' };

type OwnProps = {
    message?: string;
};

type Props = WithDefaultProps<OwnProps, typeof defaultProps> & WithStylesProps;

class Hello extends React.Component<Props> {
  static defaultProps = defaultProps;

  render() {
    const { message, css, styles } = this.props;
    return <div {...css(styles.container)}>{message}</div>;
  }
}

export default withStyles(() => ({
  container: {
    /* ... */
  },
}))(Hello);`);
  });

  it('class with default props and state', async () => {
    const text = `import React from 'react';

type MyProps = { message: string };
type MyState = $TSFixMe;

const defaulPrs = { message: 'hello' }

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnMyProps = {
    message: string;
};
type MyState = $TSFixMe;

const defaulPrs = { message: 'hello' }

type MyProps = WithDefaultProps<OwnMyProps, typeof defaulPrs>;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`);
  });

  it('class with default props as a value', async () => {
    const text = `import React from 'react';

type MyProps = { message: string };
type MyState = $TSFixMe;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = {
    message: 'in class',
  };
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnMyProps = {
    message: string;
};
type MyState = $TSFixMe;

type MyProps = WithDefaultProps<OwnMyProps, typeof Foo.defaultProps>;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = {
    message: 'in class',
  };
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`);
  });

  it('do not break class without default props', async () => {
    const text = `import React from 'react';

type MyProps = { message: string };
type MyState = $TSFixMe;

class Foo extends React.Component<MyProps, MyState> {
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(undefined);
  });

  it('do not perform default props plugin logic multiple times', async () => {
    const text = `import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnMyProps = {
    message: string;
};
type MyState = $TSFixMe;

const defaulPrs = { message: 'hello' };

type MyProps = WithDefaultProps<OwnMyProps, typeof defaulPrs>;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}
export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnMyProps = {
    message: string;
};
type MyState = $TSFixMe;

const defaulPrs = { message: 'hello' };

type MyProps = WithDefaultProps<OwnMyProps, typeof defaulPrs>;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}
export default Foo;`);
  });

  it('do not perform default props plugin logic multiple times', async () => {
    const text = `import React from 'react';
type Props = {
    message: string;
};

type MyState = {};

const defaultProps = { message: 'hello' };

type PrivateProps = OwnMyProps & typeof defaultProps;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaultProps;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}
export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import React from 'react';
type Props = {
    message: string;
};

type MyState = {};

const defaultProps = { message: 'hello' };

type PrivateProps = OwnMyProps & typeof defaultProps;

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaultProps;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}
export default Foo;`);
  });

  it('default props already exists for sfcs', async () => {
    const text = `import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type Props = {} & WithStylesProps;

const defaultProps = {};

type PrivateProps = Props & typeof defaultProps;

function FlowHeader({ styles, css, theme }: PrivateProps) {
  return (
    <div {...css(styles.headerWrapper)}></div>
  );
}

FlowHeader.defaultProps = defaultProps;

export default withStyles(() => ({
  headerWrapper: {
    height: 48,
  },
}))(FlowHeader) as FlowHeader<Props>;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type Props = {} & WithStylesProps;

const defaultProps = {};

type PrivateProps = Props & typeof defaultProps;

function FlowHeader({ styles, css, theme }: PrivateProps) {
  return (
    <div {...css(styles.headerWrapper)}></div>
  );
}

FlowHeader.defaultProps = defaultProps;

export default withStyles(() => ({
  headerWrapper: {
    height: 48,
  },
}))(FlowHeader) as FlowHeader<Props>;`);
  });

  it('complex file with multiple component and mupltiple default props', async () => {
    const text = `import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type TrElementProps = {
  children: React.ReactNode;
  onClick?: $TSFixMeFunction;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  role?: string;
  tabIndex?: string;
  strongAccentOnHover?: boolean;
} & WithStylesProps;

const trDefaultProps = {
  onClick: null,
  onMouseEnter: null,
  onMouseLeave: null,
  role: null,
  tabIndex: null,
  strongAccentOnHover: false,
};

const TrElement = ({
  css,
  styles,
  children,
  onClick,
  role,
  tabIndex,
  onMouseEnter,
  onMouseLeave,
  strongAccentOnHover,
}: TrElementProps) => (
  <tr
    {...css(
      onClick && styles.tr_clickable,
      strongAccentOnHover && styles.tr_strong_accent_on_hover,
    )}
    onClick={onClick}
    role={role}
    // @ts-ignore ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
    tabIndex={tabIndex}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </tr>
);
TrElement.defaultProps = trDefaultProps;

export const Tr = withStyles(({ color }) => ({
  tr_clickable: {
    ':hover': {
      cursor: 'pointer',
      backgroundColor: color.accent.bgGray,
    },
  },
  tr_strong_accent_on_hover: {
    ':hover': {
      color: color.white,
      backgroundColor: color.core.babu,
    },
  },
}))(TrElement);`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type OwnTrElementProps = {
    children: React.ReactNode;
    onClick?: $TSFixMeFunction;
    onMouseEnter?: $TSFixMeFunction;
    onMouseLeave?: $TSFixMeFunction;
    role?: string;
    tabIndex?: string;
    strongAccentOnHover?: boolean;
};

const trDefaultProps = {
  onClick: null,
  onMouseEnter: null,
  onMouseLeave: null,
  role: null,
  tabIndex: null,
  strongAccentOnHover: false,
};

type TrElementProps = WithDefaultProps<OwnTrElementProps, typeof trDefaultProps> & WithStylesProps;

const TrElement = ({
  css,
  styles,
  children,
  onClick,
  role,
  tabIndex,
  onMouseEnter,
  onMouseLeave,
  strongAccentOnHover,
}: TrElementProps) => (
  <tr
    {...css(
      onClick && styles.tr_clickable,
      strongAccentOnHover && styles.tr_strong_accent_on_hover,
    )}
    onClick={onClick}
    role={role}
    // @ts-ignore ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
    tabIndex={tabIndex}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </tr>
);
TrElement.defaultProps = trDefaultProps;

export const Tr = withStyles(({ color }) => ({
  tr_clickable: {
    ':hover': {
      cursor: 'pointer',
      backgroundColor: color.accent.bgGray,
    },
  },
  tr_strong_accent_on_hover: {
    ':hover': {
      color: color.white,
      backgroundColor: color.core.babu,
    },
  },
}))(TrElement);`);
  });

  it('multiple components in one file', async () => {
    const text = `import React from 'react';

const SIZES = {
  LARGE: 'large',
  JUMBO: 'jumbo',
};

type AddEmailWidgetProps = {
  email?: string;
};

const defaultProps = {
  onSubmit() {},
  onImpression() {},
  onFinished() {},
  onError() {},
  size: SIZES.LARGE,
};

const INPUT_CLASS = {
  large: 'input-large',
  jumbo: 'input-jumbo',
};

const BTN_CLASS = {
  large: 'btn-large',
  jumbo: 'btn-jumbo',
};

type UpdatedEmailProps = {
  size?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(SIZES))
  email: string;
};

function UpdatedEmail({ size }: UpdatedEmailProps) {
  // @ts-ignore ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
  const inputClass = INPUT_CLASS[size];
  return <div className="row email-update-form" />;
}

UpdatedEmail.defaultProps = {
  size: SIZES.LARGE,
};

type EmailFormProps = {
  size?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(SIZES))
  status?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(EmailUpdateStatuses))
  email?: string;
  errorMessage?: string;
  onChangedInput: $TSFixMeFunction;
  onClickSubmit: $TSFixMeFunction;
};

function EmailForm({ size, status }: EmailFormProps) {
  const inputClass = INPUT_CLASS[size];
  const btnClass = BTN_CLASS[size];

  return <div />;
}

EmailForm.defaultProps = {
  size: SIZES.LARGE,
  errorMessage: null,
  email: null,
  status: 'EmailUpdateStatuses.AWAITING_INPUT',
};

class AddEmailWidget extends React.Component<AddEmailWidgetProps> {
  static defaultProps = defaultProps;

  constructor(props: AddEmailWidgetProps) {
    super(props);
  }

  render() {
    const { status, email, size } = this.props;

    if (status === 'EmailUpdateStatuses.SUCCESS') {
      return <div />;
    }
    return <div />;
  }
}

export default AddEmailWidget;
`;
    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

const SIZES = {
  LARGE: 'large',
  JUMBO: 'jumbo',
};

type OwnAddEmailWidgetProps = {
    email?: string;
};

const defaultProps = {
  onSubmit() {},
  onImpression() {},
  onFinished() {},
  onError() {},
  size: SIZES.LARGE,
};

const INPUT_CLASS = {
  large: 'input-large',
  jumbo: 'input-jumbo',
};

const BTN_CLASS = {
  large: 'btn-large',
  jumbo: 'btn-jumbo',
};

type OwnUpdatedEmailProps = {
    size?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(SIZES))
    email: string;
};

type UpdatedEmailProps = WithDefaultProps<OwnUpdatedEmailProps, typeof UpdatedEmail.defaultProps>;

function UpdatedEmail({ size }: UpdatedEmailProps) {
  // @ts-ignore ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
  const inputClass = INPUT_CLASS[size];
  return <div className="row email-update-form" />;
}

UpdatedEmail.defaultProps = {
  size: SIZES.LARGE,
};

type OwnEmailFormProps = {
    size?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(SIZES))
    status?: $TSFixMe; // TODO: PropTypes.oneOf(Object.values(EmailUpdateStatuses))
    email?: string;
    errorMessage?: string;
    onChangedInput: $TSFixMeFunction;
    onClickSubmit: $TSFixMeFunction;
};

type EmailFormProps = WithDefaultProps<OwnEmailFormProps, typeof EmailForm.defaultProps>;

function EmailForm({ size, status }: EmailFormProps) {
  const inputClass = INPUT_CLASS[size];
  const btnClass = BTN_CLASS[size];

  return <div />;
}

EmailForm.defaultProps = {
  size: SIZES.LARGE,
  errorMessage: null,
  email: null,
  status: 'EmailUpdateStatuses.AWAITING_INPUT',
};

type AddEmailWidgetProps = WithDefaultProps<OwnAddEmailWidgetProps, typeof defaultProps>;

class AddEmailWidget extends React.Component<AddEmailWidgetProps> {
  static defaultProps = defaultProps;

  constructor(props: AddEmailWidgetProps) {
    super(props);
  }

  render() {
    const { status, email, size } = this.props;

    if (status === 'EmailUpdateStatuses.SUCCESS') {
      return <div />;
    }
    return <div />;
  }
}

export default AddEmailWidget;
`);
  });

  it('custom default props, resulted as $TSFixMe', async () => {
    const text = `import PropTypes from 'prop-types';
import React from 'react';

const noOnPressWithLink = mutuallyExclusiveProps(PropTypes.func, 'link', 'onPress');

export const propTypes = {
  ...baseRowPropTypes,
  actionText: noActionTextWithLink,
  onPress: noOnPressWithLink,
  subtitle: PropTypes.oneOfType([textlike, PropTypes.arrayOf(textlike)]),
  small: PropTypes.bool,
  title: textlike.isRequired,
};

export const defaultProps = {
  ...baseRowDefaultProps,
  baseline: lineTypes.FULL,
  small: false,
};

export default function ActionRowWithReactRouter({
  actionText,
  onPress,
  subtitle,
  title,
  small,
  link,

  // BaseRow props
  ...rowProps
}: $TSFixMe) {
  return <div />;
}

ActionRowWithReactRouter.propTypes = forbidExtraProps(propTypes);
ActionRowWithReactRouter.defaultProps = defaultProps;
`;
    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import PropTypes from 'prop-types';
import React from 'react';

const noOnPressWithLink = mutuallyExclusiveProps(PropTypes.func, 'link', 'onPress');

export const propTypes = {
  ...baseRowPropTypes,
  actionText: noActionTextWithLink,
  onPress: noOnPressWithLink,
  subtitle: PropTypes.oneOfType([textlike, PropTypes.arrayOf(textlike)]),
  small: PropTypes.bool,
  title: textlike.isRequired,
};

export const defaultProps = {
  ...baseRowDefaultProps,
  baseline: lineTypes.FULL,
  small: false,
};

export default function ActionRowWithReactRouter({
  actionText,
  onPress,
  subtitle,
  title,
  small,
  link,

  // BaseRow props
  ...rowProps
}: $TSFixMe) {
  return <div />;
}

ActionRowWithReactRouter.propTypes = forbidExtraProps(propTypes);
ActionRowWithReactRouter.defaultProps = defaultProps;
`);
  });

  it('example with proptype contains only a type references', async () => {
    const text = `import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type Props = {
  activeRouteName?: string;
  isSaving: boolean;
  lastSavedTimeStamp?: number;
  listingId: number | string;
  logLYSExitMethod: (
    activeRouteName: string | undefined,
    listingId: string | number,
    method: string,
  ) => void;
  onSaveAndExit: () => void;
  setHeadingRef?: () => void;
  step?: number;
  stepTitle?: string;
};

type PrivateProps = Props & WithStylesProps;

const defaultProps = {
  activeRouteName: '',
  setHeadingRef() {},
  lastSavedTimeStamp: null,
  listingId: null,
  onSaveAndExit() {},
  stepTitle: '',
};

class Navbar extends React.Component<PrivateProps> {
  static defaultProps = defaultProps;

  constructor(props: PrivateProps) {
    super(props);
  }

  render() {
    const {
      css,
      isSaving,
      lastSavedTimeStamp,
      listingId,
      setHeadingRef,
      step,
      stepTitle,
      styles,
    } = this.props;

    return <div {...css(styles.airbnbHeader)} />;
  }
}

export default withStyles(({ color, responsive }) => ({
  airbnbHeader: {
    width: '100%',
  },
}))(Navbar);`;
    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );
    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';
import { withStyles, WithStylesProps } from ':dls-themes/withStyles';

type Props = {
  activeRouteName?: string;
  isSaving: boolean;
  lastSavedTimeStamp?: number;
  listingId: number | string;
  logLYSExitMethod: (
    activeRouteName: string | undefined,
    listingId: string | number,
    method: string,
  ) => void;
  onSaveAndExit: () => void;
  setHeadingRef?: () => void;
  step?: number;
  stepTitle?: string;
};

type OwnPrivateProps = Props & WithStylesProps;

const defaultProps = {
  activeRouteName: '',
  setHeadingRef() {},
  lastSavedTimeStamp: null,
  listingId: null,
  onSaveAndExit() {},
  stepTitle: '',
};

type PrivateProps = WithDefaultProps<OwnPrivateProps, typeof defaultProps>;

class Navbar extends React.Component<PrivateProps> {
  static defaultProps = defaultProps;

  constructor(props: PrivateProps) {
    super(props);
  }

  render() {
    const {
      css,
      isSaving,
      lastSavedTimeStamp,
      listingId,
      setHeadingRef,
      step,
      stepTitle,
      styles,
    } = this.props;

    return <div {...css(styles.airbnbHeader)} />;
  }
}

export default withStyles(({ color, responsive }) => ({
  airbnbHeader: {
    width: '100%',
  },
}))(Navbar);`);
  });

  it('one prop types for the multiple component', async () => {
    const text = `import React from 'react';

type Props = {
  instantBookingAllowedCategory: string;
  listingId: number;
  forAvailabilityAllSettings: boolean;
};
type State = {
  didClickExpand: boolean;
  isLoadingRequirements: boolean;
};

const defaultProps = {
  forAvailabilityAllSettings: false,
  buildingInstantBookingAllowedCategory: '',
};

export class GuestRequirementsContent extends React.Component<Props, State> {
  static defaultProps = defaultProps;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return <div />;
  }
}

export default class GuestRequirements extends React.Component<Props> {
  static defaultProps = defaultProps;

  render() {
    return <StepContainer></StepContainer>;
  }
}`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

type OwnProps = {
    instantBookingAllowedCategory: string;
    listingId: number;
    forAvailabilityAllSettings: boolean;
};
type State = {
  didClickExpand: boolean;
  isLoadingRequirements: boolean;
};

const defaultProps = {
  forAvailabilityAllSettings: false,
  buildingInstantBookingAllowedCategory: '',
};

type Props = WithDefaultProps<OwnProps, typeof defaultProps>;

export class GuestRequirementsContent extends React.Component<Props, State> {
  static defaultProps = defaultProps;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return <div />;
  }
}

export default class GuestRequirements extends React.Component<Props> {
  static defaultProps = defaultProps;

  render() {
    return <StepContainer></StepContainer>;
  }
}`);
  });

  it('dont rename exported type', async () => {
    const text = `import React from 'react';

export type Props = {
  test: string;
};

const defaultProps = {
  test: '',
};

function ExampleComponent({ test }: Props) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

export type Props = {
    test: string;
};

const defaultProps = {
  test: '',
};

type PrivateProps = WithDefaultProps<Props, typeof defaultProps>;

function ExampleComponent({ test }:PrivateProps) {
  return <React.Fragment>{test}</React.Fragment>;
}
ExampleComponent.defaultProps = defaultProps;

export default ExampleComponent;`);
  });

  it('dont rename exported type of the class component', async () => {
    const text = `import React from 'react';

export type MyProps = { message: string };
export type MyState = $TSFixMe;

export const defaulPrs = { message: 'hello' }

class Foo extends React.Component<MyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import { WithDefaultProps } from ":ts-utils/types/WithDefaultProps";
import React from 'react';

export type MyProps = {
    message: string;
};
export type MyState = $TSFixMe;

export const defaulPrs = { message: 'hello' }

type PrivateMyProps = WithDefaultProps<MyProps, typeof defaulPrs>;

class Foo extends React.Component<PrivateMyProps, MyState> {
  static defaultProps = defaulPrs;
  render() {
    return this.state.loading
      ? <div>Loading...</div>
      : <div>{this.props.message}</div>;
  }
}

export default Foo;`);
  });

  it(`don't fix existing prop types`, async () => {
    const text = `import React from 'react';
import { WithDefaultProps } from ':ts-utils/types/WithDefaultProps';

type OwnProps = {
  kind?: 'some';
  termsUrl?: string;
};

type Props = WithDefaultProps<OwnProps, typeof Modal.defaultProps> & WithStylesProps;
type State = { modalVisible: boolean };

class Modal extends React.Component<Props, State> {
  static defaultProps = {
    kind: 'some' as const,
    termsUrl: '',
  };

  $focusedNode: HTMLElement | undefined;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return <div {...css(styles.container)} />;
  }
}

export default withStyles(() => ({
  container: {
    display: 'inline-block',
    marginLeft: 3,
  },
}))(Modal);
`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx', options }),
    );

    expect(result).toBe(`import React from 'react';
import { WithDefaultProps } from ':ts-utils/types/WithDefaultProps';

type OwnProps = {
  kind?: 'some';
  termsUrl?: string;
};

type Props = WithDefaultProps<OwnProps, typeof Modal.defaultProps> & WithStylesProps;
type State = { modalVisible: boolean };

class Modal extends React.Component<Props, State> {
  static defaultProps = {
    kind: 'some' as const,
    termsUrl: '',
  };

  $focusedNode: HTMLElement | undefined;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return <div {...css(styles.container)} />;
  }
}

export default withStyles(() => ({
  container: {
    display: 'inline-block',
    marginLeft: 3,
  },
}))(Modal);
`);
  });

  it(`do not duplicate OwnProps declaration`, async () => {
    const text = `
import React from 'react';
import PropTypes from 'prop-types';
type State = {
  expanded: boolean;
};
interface OwnProps {
  onSelectInstallmentFee: (value: number) => Promise<any>;
  renderLayout: RenderLayout | null;
  isCheckoutPlatform?: boolean;
}
type Props = InstallmentFeesSelectorProps & OwnProps & WithLoggingContextProps;
class InstallmentSelector extends React.Component<Props, State> {
  static propTypes = {
    InstallmentFees: PropTypes.arrayOf(InstallmentFeeShape).isRequired,
    eligible: PropTypes.bool.isRequired,
    fetchInstallmentFees: PropTypes.func.isRequired,
    gibraltarInstrumentType: EGibraltarInstrumentTypeShape,
    onSelectInstallmentFee: PropTypes.func.isRequired,
    productPriceQuoteToken: PropTypes.string,
    renderLayout: PropTypes.func,
    selectInstallmentFee: PropTypes.func.isRequired,
    selectedBInstallmentFeeCount: PropTypes.number.isRequired,
    wrapWithLoading: PropTypes.func.isRequired,
  };
  static defaultProps = {
    renderLayout: null,
  };
  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
    };
    this.onChange = this.onChange.bind(this);
  }
  componentDidMount() {
  }
  componentDidUpdate(prevProps: Props) {
  }
  onChange(numStr: string) {}
  render() {
    return Component;
  }
}
export default InstallmentSelector;
`;

    const result = await reactDefaultPropsPlugin.run(
      mockPluginParams({ text, fileName: 'file.tsx' }),
    );

    expect(result).toBe(`
import React from 'react';
import PropTypes from 'prop-types';
type State = {
  expanded: boolean;
};
interface OwnProps {
  onSelectInstallmentFee: (value: number) => Promise<any>;
  renderLayout: RenderLayout | null;
  isCheckoutPlatform?: boolean;
}

type OwnInstallmentSelectorProps = InstallmentFeesSelectorProps & OwnProps & WithLoggingContextProps;

type Props = (OwnInstallmentSelectorProps & typeof InstallmentSelector.defaultProps);
class InstallmentSelector extends React.Component<Props, State> {
  static propTypes = {
    InstallmentFees: PropTypes.arrayOf(InstallmentFeeShape).isRequired,
    eligible: PropTypes.bool.isRequired,
    fetchInstallmentFees: PropTypes.func.isRequired,
    gibraltarInstrumentType: EGibraltarInstrumentTypeShape,
    onSelectInstallmentFee: PropTypes.func.isRequired,
    productPriceQuoteToken: PropTypes.string,
    renderLayout: PropTypes.func,
    selectInstallmentFee: PropTypes.func.isRequired,
    selectedBInstallmentFeeCount: PropTypes.number.isRequired,
    wrapWithLoading: PropTypes.func.isRequired,
  };
  static defaultProps = {
    renderLayout: null,
  };
  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
    };
    this.onChange = this.onChange.bind(this);
  }
  componentDidMount() {
  }
  componentDidUpdate(prevProps: Props) {
  }
  onChange(numStr: string) {}
  render() {
    return Component;
  }
}
export default InstallmentSelector;
`);
  });
});
