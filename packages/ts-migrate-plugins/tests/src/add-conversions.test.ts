import { realPluginParams } from '../test-utils';
import addConversionsPlugin from '../../src/plugins/add-conversions';

describe('add-conversions plugin', () => {
  const text = `\
const a = {};
a.b = 1;
console.log(a.c);
`;

  it('adds conversions', async () => {
    const result = addConversionsPlugin.run(await realPluginParams({ text }));

    expect(result).toBe(`\
const a = {};
(a as any).b = 1;
console.log((a as any).c);
`);
  });

  it('adds conversions with alias', async () => {
    const result = addConversionsPlugin.run(
      await realPluginParams({ text, options: { anyAlias: '$TSFixMe' } }),
    );

    expect(result).toBe(`\
const a = {};
(a as $TSFixMe).b = 1;
console.log((a as $TSFixMe).c);
`);
  });
});
