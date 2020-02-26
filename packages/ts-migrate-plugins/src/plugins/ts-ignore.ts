/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import tsp from 'typescript/lib/protocol';
import diagnosticMessages from 'typescript/lib/diagnosticMessages.generated.json';
import { Plugin } from 'ts-migrate-server';
import { isDiagnosticWithLinePosition } from '../utils/type-guards';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';

const tsIgnorePlugin: Plugin = {
  name: 'ts-ignore',
  async run({ getDiagnostics, sourceFile }) {
    const allDiagnostics = await getDiagnostics();
    const diagnostics = allDiagnostics.semanticDiagnostics.filter(isDiagnosticWithLinePosition);
    return getTextWithIgnores(sourceFile, diagnostics);
  },
};

export default tsIgnorePlugin;

const diagnosticMessagesByCode: { [code: string]: string } = {};
Object.keys(diagnosticMessages).forEach((key) => {
  const parts = key.split('_');
  const code = parts[parts.length - 1];
  diagnosticMessagesByCode[code] = diagnosticMessages[key as keyof typeof diagnosticMessages];
});

const TS_IGNORE_MESSAGE_LIMIT = 50;

function getTextWithIgnores(
  sourceFile: ts.SourceFile,
  diagnostics: tsp.DiagnosticWithLinePosition[],
): string {
  const { text } = sourceFile;
  const updates: SourceTextUpdate[] = [];
  const isIgnored: { [line: number]: boolean } = {};

  diagnostics.forEach((diagnostic) => {
    const { line: diagnosticLine } = ts.getLineAndCharacterOfPosition(sourceFile, diagnostic.start);
    const { code } = diagnostic;
    const messageLines = diagnostic.message
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const message = messageLines[messageLines.length - 1];
    const tsIgnoreCommentText = `// @ts-ignore ts-migrate(${code}) FIXME: ${
      message.length > TS_IGNORE_MESSAGE_LIMIT
        ? `${message.slice(
            0,
            TS_IGNORE_MESSAGE_LIMIT,
          )}... Remove this comment to see the full error message`
        : message
    }`;
    if (!isIgnored[diagnosticLine]) {
      let commentLine = diagnosticLine;
      let pos = getStartOfLinePos(commentLine, sourceFile);
      while (commentLine > 0) {
        const prevLine = commentLine - 1;
        const prevLinePos = getStartOfLinePos(prevLine, sourceFile);
        const prevLineText = text.slice(prevLinePos, pos - 1);
        const prevLineStartsWithEslintComment = /^ *\/\/ *eslint/.test(prevLineText);

        if (!prevLineStartsWithEslintComment) break;

        commentLine = prevLine;
        pos = prevLinePos;
      }

      // Include leading whitespace
      let ws = '';
      let i = pos;
      while (sourceFile.text[i] === ' ') {
        i += 1;
        ws += ' ';
      }

      if (inTemplateExpressionText(sourceFile, pos)) {
        const node = findDiagnosticNode(diagnostic, sourceFile);
        if (node) {
          updates.push({
            kind: 'insert',
            index: node.pos,
            text: `${ws}${ts.sys.newLine}${tsIgnoreCommentText}${
              text[node.pos] !== ts.sys.newLine ? ts.sys.newLine : ''
            }`,
          });
        } else {
          throw new Error('Failed to add @ts-ignore within template expression.');
        }
      } else if (inJsxText(sourceFile, pos)) {
        updates.push({
          kind: 'insert',
          index: pos,
          text: `${ws}{/*${ts.sys.newLine}${tsIgnoreCommentText} */}${ts.sys.newLine}`,
        });
      } else if (onMultilineConditionalTokenLine(sourceFile, diagnostic.start)) {
        updates.push({
          kind: 'insert',
          index: getConditionalCommentPos(sourceFile, diagnostic.start),
          text: ` // @ts-ignore${ts.sys.newLine}${ws}  ${tsIgnoreCommentText}${ts.sys.newLine}${ws} `,
        });
      } else {
        let skip = false;
        if (commentLine > 1) {
          const prevLineText = text.slice(
            getStartOfLinePos(commentLine - 1, sourceFile),
            getStartOfLinePos(commentLine, sourceFile),
          );
          if (/\bwebpackChunkName\b/.test(prevLineText)) {
            skip = true;
          }
        }

        if (!skip) {
          updates.push({
            kind: 'insert',
            index: pos,
            text: `${ws}${tsIgnoreCommentText}${ts.sys.newLine}`,
          });
        }
      }

      isIgnored[diagnosticLine] = true;
    }
  });

  return updateSourceText(text, updates);
}

function findDiagnosticNode(
  diagnostic: tsp.DiagnosticWithLinePosition,
  sourceFile: ts.SourceFile,
): ts.Node | undefined {
  const visitor = (node: ts.Node): ts.Node | undefined =>
    isDiagnosticNode(node, diagnostic, sourceFile) ? node : ts.forEachChild(node, visitor);

  return visitor(sourceFile);
}

function isDiagnosticNode(
  node: ts.Node,
  diagnostic: tsp.DiagnosticWithLinePosition,
  sourceFile: ts.SourceFile,
): boolean {
  return (
    node.getStart(sourceFile) === diagnostic.start &&
    node.getEnd() === diagnostic.start + diagnostic.length
  );
}

function inJsxText(sourceFile: ts.SourceFile, pos: number) {
  const visitor = (node: ts.Node): boolean | undefined => {
    if (node.pos <= pos && pos < node.end && (ts.isJsxElement(node) || ts.isJsxFragment(node))) {
      const isJsxTextChild = node.children.some(
        (child) => ts.isJsxText(child) && child.pos <= pos && pos < child.end,
      );
      if (isJsxTextChild) {
        return true;
      }
    }

    return ts.forEachChild(node, visitor);
  };

  return !!ts.forEachChild(sourceFile, visitor);
}

function inTemplateExpressionText(sourceFile: ts.SourceFile, pos: number) {
  const visitor = (node: ts.Node): boolean | undefined => {
    if (node.pos <= pos && pos < node.end && ts.isTemplateExpression(node)) {
      const inHead = node.head.pos <= pos && pos < node.head.end;
      const inMiddleOrTail = node.templateSpans.some(
        (span) => span.literal.pos <= pos && pos < span.literal.end,
      );
      if (inHead || inMiddleOrTail) {
        return true;
      }
    }

    return ts.forEachChild(node, visitor);
  };

  return !!ts.forEachChild(sourceFile, visitor);
}

function getConditionalExpressionAtPos(sourceFile: ts.SourceFile, pos: number) {
  const visitor = (node: ts.Node): ts.ConditionalExpression | undefined => {
    if (node.pos <= pos && pos < node.end && ts.isConditionalExpression(node)) {
      return node;
    }
    return ts.forEachChild(node, visitor);
  };
  return ts.forEachChild(sourceFile, visitor);
}

function visitConditionalExpressionWhen<T>(
  node: ts.ConditionalExpression | undefined,
  pos: number,
  visitor: {
    whenTrue(node: ts.ConditionalExpression): T;
    whenFalse(node: ts.ConditionalExpression): T;
    otherwise(): T;
  },
): T {
  if (!node) return visitor.otherwise();

  const inWhenTrue = node.whenTrue.pos <= pos && pos < node.whenTrue.end;
  if (inWhenTrue) return visitor.whenTrue(node);

  const inWhenFalse = node.whenFalse.pos <= pos && pos < node.whenFalse.end;
  if (inWhenFalse) return visitor.whenFalse(node);

  return visitor.otherwise();
}

function onMultilineConditionalTokenLine(sourceFile: ts.SourceFile, pos: number): boolean {
  const conditionalExpression = getConditionalExpressionAtPos(sourceFile, pos);
  // Not in a conditional expression.
  if (!conditionalExpression) return false;

  const { line: questionTokenLine } = ts.getLineAndCharacterOfPosition(
    sourceFile,
    conditionalExpression.questionToken.end,
  );
  const { line: colonTokenLine } = ts.getLineAndCharacterOfPosition(
    sourceFile,
    conditionalExpression.colonToken.end,
  );
  // Single line conditional expression.
  if (questionTokenLine === colonTokenLine) return false;

  const { line } = ts.getLineAndCharacterOfPosition(sourceFile, pos);
  return visitConditionalExpressionWhen(conditionalExpression, pos, {
    // On question token line of multiline conditional expression.
    whenTrue: () => line === questionTokenLine,
    // On colon token line of multiline conditional expression.
    whenFalse: () => line === colonTokenLine,
    otherwise: () => false,
  });
}

function getConditionalCommentPos(sourceFile: ts.SourceFile, pos: number): number {
  return visitConditionalExpressionWhen(getConditionalExpressionAtPos(sourceFile, pos), pos, {
    whenTrue: (node) => node.questionToken.end,
    whenFalse: (node) => node.colonToken.end,
    otherwise: () => pos,
  });
}

/** Get position at start of zero-indexed line number in the given source file. */
function getStartOfLinePos(line: number, sourceFile: ts.SourceFile): number {
  return ts.getPositionOfLineAndCharacter(sourceFile, line, 0);
}
