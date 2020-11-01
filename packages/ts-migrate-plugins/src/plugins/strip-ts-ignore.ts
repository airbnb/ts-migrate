/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';

const stripTSIgnorePlugin: Plugin = {
  name: 'strip-ts-ignore',
  run({ text, fileName }) {
    const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest);
    return getTextWithoutIgnores(sourceFile);
  },
};

export default stripTSIgnorePlugin;

function getTextWithoutIgnores(sourceFile: ts.SourceFile): string {
  const updates: SourceTextUpdate[] = [];

  const printerWithoutComments = ts.createPrinter({ removeComments: true });
  const printWithoutComments = (node: ts.Node) =>
    printerWithoutComments.printNode(ts.EmitHint.Unspecified, node, sourceFile);

  const { text } = sourceFile;
  const regExp = /(\/\/|\/\*) *@ts-(?:ignore|expect-error)\b/g;
  let result: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((result = regExp.exec(text)) != null) {
    const matchPos = result.index;

    const { line } = ts.getLineAndCharacterOfPosition(sourceFile, matchPos);
    const lineStart = ts.getPositionOfLineAndCharacter(sourceFile, line, 0);
    const lineEnd = ts.getPositionOfLineAndCharacter(sourceFile, line + 1, 0);
    const lineText = sourceFile.text.slice(lineStart, lineEnd);

    const node = findNodeAtPos(sourceFile, matchPos);
    if (node && !ts.isJsxText(node)) {
      const commentRanges = getCommentRanges(text, node.pos).filter((range) =>
        isInRange(matchPos, range),
      );

      if (commentRanges.length > 0) {
        commentRanges.forEach((range) => {
          const { pos, end } = expandToWhitespace(text, range);
          updates.push({ kind: 'delete', index: pos, length: end - pos });
        });
      } else {
        const printedWithoutComments = printWithoutComments(node);
        const inTemplate = ts.isTemplateLiteralToken(node);
        if (ts.isJsxExpression(node) && printedWithoutComments === '') {
          const { pos, end } = expandToWhitespace(text, node);
          updates.push({ kind: 'delete', index: pos, length: end - pos });
        } else if (!inTemplate && /^ *\/\/ *@ts-(?:ignore|expect-error)\b/.test(lineText)) {
          updates.push({ kind: 'delete', index: lineStart, length: lineEnd - lineStart });
        }
      }
    }
  }

  return updateSourceText(text, updates);
}

function findNodeAtPos(sourceFile: ts.SourceFile, pos: number): ts.Node | undefined {
  const visitor = (node: ts.Node): ts.Node | undefined =>
    ts.forEachChild(node, visitor) || (isInRange(pos, node) ? node : undefined);

  return ts.forEachChild(sourceFile, visitor);
}

function isInRange(pos: number, range: ts.TextRange): boolean {
  return range.pos <= pos && pos < range.end;
}

function expandToWhitespace(text: string, range: ts.TextRange): ts.TextRange {
  let { pos } = range;
  while (pos > 0 && text[pos - 1] === ' ') {
    pos -= 1;
  }

  let { end } = range;
  if (end < text.length && text[end] === ts.sys.newLine) {
    end += 1;
  }

  return { pos, end };
}

function getCommentRanges(text: string, pos: number): ts.CommentRange[] {
  return [
    ...(ts.getLeadingCommentRanges(text, pos) || []),
    ...(ts.getTrailingCommentRanges(text, pos) || []),
  ];
}
