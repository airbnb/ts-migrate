import jscodeshift from 'jscodeshift';
import { Plugin } from 'ts-migrate-server';

type Options = {};

const j = jscodeshift.withParser('tsx');

const examplePluginJscodeshift: Plugin<Options> = {
  name: 'example-plugin-jscodeshift',
  async run({ text }) {
    const root = j(text);
    root
      .find(j.Identifier)
      .replaceWith((p) => j.identifier(p.node.name.split('').reverse().join('')));
    return root.toSource();
  },
};

export default examplePluginJscodeshift;
