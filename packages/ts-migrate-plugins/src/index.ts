import declareMissingClassPropertiesPlugin from './declare-missing-class-properties';
import eslintFixPlugin from './eslint-fix';
import explicitAnyPlugin from './explicit-any';
import hoistClassStaticsPlugin from './hoist-class-statics';
import reactClassLifecycleMethodsPlugin from './react-class-lifecycle-methods';
import reactClassStatePlugin from './react-class-state';
import reactDefaultPropsPlugin from './react-default-props';
import reactPropsPlugin from './react-props';
import reactShapePlugin from './react-shape';
import stripTSIgnorePlugin from './strip-ts-ignore';
import tsIgnorePlugin from './ts-ignore';
import updateSourceText, {
  SourceTextUpdate as SourceTextUpdateType,
} from '../utils/updateSourceText';
import { Plugin as PluginType } from '../types';

export type Plugin<T = {}> = PluginType<T>;
export type SourceTextUpdate = SourceTextUpdateType;

export {
  declareMissingClassPropertiesPlugin,
  eslintFixPlugin,
  explicitAnyPlugin,
  hoistClassStaticsPlugin,
  reactClassLifecycleMethodsPlugin,
  reactClassStatePlugin,
  reactDefaultPropsPlugin,
  reactPropsPlugin,
  reactShapePlugin,
  stripTSIgnorePlugin,
  tsIgnorePlugin,
};

export { updateSourceText };