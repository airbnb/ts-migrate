export default class PluginOptionsError extends Error {
  constructor(message = 'Plugin options validation error') {
    super(message);
    this.name = 'PluginOptionsError';
  }
}
