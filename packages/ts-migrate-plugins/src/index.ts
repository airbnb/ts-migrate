import { Plugin as PluginType } from 'ts-migrate-server';
import declareMissingClassPropertiesPlugin from './plugins/declare-missing-class-properties';
import eslintFixPlugin from './plugins/eslint-fix';
import explicitAnyPlugin from './plugins/explicit-any';
import hoistClassStaticsPlugin from './plugins/hoist-class-statics';
import jsDocPlugin from './plugins/jsdoc';
import memberAccessibilityPlugin from './plugins/member-accessibility';
import reactClassLifecycleMethodsPlugin from './plugins/react-class-lifecycle-methods';
import reactClassStatePlugin from './plugins/react-class-state';
import reactDefaultPropsPlugin from './plugins/react-default-props';
import reactPropsPlugin from './plugins/react-props';
import reactShapePlugin from './plugins/react-shape';
import stripTSIgnorePlugin from './plugins/strip-ts-ignore';
import tsIgnorePlugin from './plugins/ts-ignore';
import updateSourceText, {
  SourceTextUpdate as SourceTextUpdateType,
} from './utils/updateSourceText';

export type Plugin<T = {}> = PluginType<T>;
export type SourceTextUpdate = SourceTextUpdateType;

export {
  declareMissingClassPropertiesPlugin,
  eslintFixPlugin,
  explicitAnyPlugin,
  hoistClassStaticsPlugin,
  jsDocPlugin,
  memberAccessibilityPlugin,
  reactClassLifecycleMethodsPlugin,
  reactClassStatePlugin,
  reactDefaultPropsPlugin,
  reactPropsPlugin,
  reactShapePlugin,
  stripTSIgnorePlugin,
  tsIgnorePlugin,
};

export { updateSourceText };
