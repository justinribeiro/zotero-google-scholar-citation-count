const Environment = require('jest-environment-jsdom').default;
const { JSDOM } = require('jsdom');
const dom = new JSDOM();

module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup();
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.Response = Response;
    this.global.Request = Request;
    this.global.document = dom.window.document;
    this.global.window = dom.window;
  }
};
