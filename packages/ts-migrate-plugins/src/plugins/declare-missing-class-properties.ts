import jscodeshift, { ASTPath, ClassBody } from 'jscodeshift';
import { Plugin } from 'ts-migrate-server';
import { isDiagnosticWithLinePosition } from '../utils/type-guards';
import { AnyAliasOptions, validateAnyAliasOptions } from '../utils/validateOptions';

type Options = AnyAliasOptions;

const j = jscodeshift.withParser('tsx');

const declareMissingClassPropertiesPlugin: Plugin<Options> = {
  name: 'declare-missing-class-properties',

  async run({ text, fileName, getLanguageService, options }) {
    const diagnostics = getLanguageService()
      .getSemanticDiagnostics(fileName)
      .filter(isDiagnosticWithLinePosition)
      .filter((diagnostic) => diagnostic.code === 2339 || diagnostic.code === 2551);

    const root = j(text);

    const toAdd: { classBody: ASTPath<ClassBody>; propertyNames: Set<string> }[] = [];

    diagnostics.forEach((diagnostic) => {
      root
        .find(j.Identifier)
        .filter(
          (path) =>
            (path.node as any).start === diagnostic.start &&
            (path.node as any).end === diagnostic.start + diagnostic.length &&
            path.parentPath.node.type === 'MemberExpression' &&
            path.parentPath.node.object.type === 'ThisExpression',
        )
        .forEach((path) => {
          const classBody = findParentClassBody(path);
          if (classBody) {
            let item = toAdd.find((cur) => cur.classBody === classBody);
            if (!item) {
              item = { classBody, propertyNames: new Set() };
              toAdd.push(item);
            }

            item.propertyNames.add(path.node.name);
          }
        });
    });

    toAdd.forEach(({ classBody, propertyNames: propertyNameSet }) => {
      const propertyNames = Array.from(propertyNameSet)
        .filter((propertyName) => {
          const existingProperty = classBody.node.body.find(
            (n) =>
              n.type === 'ClassProperty' &&
              n.key.type === 'Identifier' &&
              n.key.name === propertyName,
          );
          return existingProperty == null;
        })
        .sort();

      let index = -1;
      for (let i = 0; i < classBody.node.body.length; i += 1) {
        const node = classBody.node.body[i];
        if (node.type === 'ClassProperty' && node.static) {
          index = i;
        }
      }

      classBody.node.body.splice(
        index + 1,
        0,
        ...propertyNames.map((propertyName) =>
          j.classProperty(
            j.identifier(propertyName),
            null,
            j.tsTypeAnnotation(
              options.anyAlias == null
                ? j.tsAnyKeyword()
                : j.tsTypeReference(j.identifier(options.anyAlias)),
            ),
          ),
        ),
      );
    });

    return root.toSource();
  },

  validate: validateAnyAliasOptions,
};

export default declareMissingClassPropertiesPlugin;

function findParentClassBody(path: ASTPath): ASTPath<ClassBody> | undefined {
  let cur: ASTPath = path;
  while (cur.node.type !== 'Program') {
    if (cur.node.type === 'ClassBody') {
      return cur as ASTPath<ClassBody>;
    }

    cur = cur.parentPath;
  }

  return undefined;
}
