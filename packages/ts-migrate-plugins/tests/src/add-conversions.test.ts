import { realPluginParams } from '../test-utils';
import addConversionsPlugin from '../../src/plugins/add-conversions';

describe('add-conversions plugin', () => {
  const text = `\
const a = {};
const b = {};

a.b = 1;
a.b = b.c;

if (a.b) {
  b.c = 1;
}

class C extends a.b {
}

enum E {
  A = a.b
}

console.log(a.c);
`;

  it('adds conversions', async () => {
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(`\
const a = {};
const b = {};

(a as any).b = 1;
(a as any).b = (b as any).c;

if ((a as any).b) {
  (b as any).c = 1;
}

class C  extends (a as any).b {
}

enum E {
  A = (a as any).b
}

console.log((a as any).c);
`);
  });

  it('adds conversions with alias', async () => {
    const result = addConversionsPlugin.run(
      await realPluginParams({ text, options: { anyAlias: '$TSFixMe' } }),
    );

    expect(result).toBe(`\
const a = {};
const b = {};

(a as $TSFixMe).b = 1;
(a as $TSFixMe).b = (b as $TSFixMe).c;

if ((a as $TSFixMe).b) {
  (b as $TSFixMe).c = 1;
}

class C  extends (a as $TSFixMe).b {
}

enum E {
  A = (a as $TSFixMe).b
}

console.log((a as $TSFixMe).c);
`);
  });

  it('adds conversions to unknown types', async () => {
    const text = `\
function f(u: unknown) {
    console.log(u.prop);
}
`;

    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(`\
function f(u: unknown) {
    console.log((u as any).prop);
}
`);
  });

  it('replaces only the necessary code in class property arrow functions (issue #134)', async () => {
    const text = `\
class PublishEvent {
  constructor(opts = {}) {
    this._eventName = opts.eventName;
  }

  addEventListener = () => document.addEventListener(this._eventName, this.publish);
}
`;
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(`\
class PublishEvent {
  constructor(opts = {}) {
    (this as any)._eventName = (opts as any).eventName;
  }

  addEventListener = () => document.addEventListener((this as any)._eventName, (this as any).publish);
}
`);
  });

  it('Nested Expression Statements (issue #144) Part 1: Expression Statement -> Expression Statement', async () => {
    const text = `var window = { onResetData: function () { this.clearNextPush = function () { this.setState({ history: [] }); }; } };`;
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(
      `var window = { onResetData: function () { (this as any).clearNextPush = function () { (this as any).setState({ history: [] }); }; } };`,
    );
  });

  it('Nested Expression Statements (issue #144) Part 2: Expression Statement -> If Statement -> Expression Statement', async () => {
    const text = `const window = { onResetData() { this.clearNextPush = function () {\n    if (this.setState) {\n    this.setState({ history: [] });\n} }; } };`;
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(
      `const window = { onResetData() { (this as any).clearNextPush = function () {\n    if ((this as any).setState) {\n        (this as any).setState({ history: [] });\n    }\n}; } };`,
    );
  });

  it('handles dollar amounts', async () => {
    const text = `\
import customUtils from "custom-utils";

it("tests", () => {
  thing.fn("arg");

  const thing = {
    value: "$1"
  };
});
`;
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(`\
import customUtils from "custom-utils";

it("tests", () => {
    (thing as any).fn("arg");
    const thing = {
        value: "$1"
    };
});
`);
  });
});
