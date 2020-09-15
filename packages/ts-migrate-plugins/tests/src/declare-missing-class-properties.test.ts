import { mockDiagnostic, mockPluginParams } from '../test-utils';
import declareMissingClassPropertiesPlugin from '../../src/plugins/declare-missing-class-properties';

describe('declare-missing-class-properties plugin', () => {
  it.each([2339, 2551])(
    'declares missing class properties with diagnostic code %i',
    async (diagnosticCode) => {
      const text = `class Class1 {
  static foo = 123;
  method1() {
    console.log(this.property1a);
  }

  method2() {
    console.log(this.property2a);
  }
}

class Class2 {
  method1() {
    console.log(this.property1b);
  }

  method2() {
    console.log(this.property2b);
  }
}`;

      const diagnosticFor = (str: string) => mockDiagnostic(text, str, { code: diagnosticCode });
      const result = await declareMissingClassPropertiesPlugin.run(
        mockPluginParams({
          options: { anyAlias: '$TSFixMe' },
          text,
          semanticDiagnostics: [
            diagnosticFor('property1a'),
            diagnosticFor('property2a'),
            diagnosticFor('property1b'),
            diagnosticFor('property2b'),
          ],
        }),
      );

      expect(result).toBe(`class Class1 {
  static foo = 123;
  property1a: $TSFixMe;
  property2a: $TSFixMe;
  method1() {
    console.log(this.property1a);
  }

  method2() {
    console.log(this.property2a);
  }
}

class Class2 {
  property1b: $TSFixMe;
  property2b: $TSFixMe;
  method1() {
    console.log(this.property1b);
  }

  method2() {
    console.log(this.property2b);
  }
}`);
    },
  );
});
