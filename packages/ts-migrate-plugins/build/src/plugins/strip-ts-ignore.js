/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import updateSourceText from '../utils/updateSourceText';
const stripTSIgnorePlugin = {
    name: 'strip-ts-ignore',
    run({ text, fileName }) {
        const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest);
        return getTextWithoutIgnores(sourceFile);
    },
};
export default stripTSIgnorePlugin;
function getTextWithoutIgnores(sourceFile) {
    const updates = [];
    const printerWithoutComments = ts.createPrinter({ removeComments: true });
    const printWithoutComments = (node) => printerWithoutComments.printNode(ts.EmitHint.Unspecified, node, sourceFile);
    const { text } = sourceFile;
    const regExp = /\/\/ *@ts-ignore\b/g;
    let result;
    // eslint-disable-next-line no-cond-assign
    while ((result = regExp.exec(text)) != null) {
        const matchPos = result.index;
        const { line } = ts.getLineAndCharacterOfPosition(sourceFile, matchPos);
        const lineStart = ts.getPositionOfLineAndCharacter(sourceFile, line, 0);
        const lineEnd = ts.getPositionOfLineAndCharacter(sourceFile, line + 1, 0);
        const lineText = sourceFile.text.slice(lineStart, lineEnd);
        const node = findNodeAtPos(sourceFile, matchPos);
        if (node && !ts.isJsxText(node)) {
            const commentRanges = getCommentRanges(text, node.pos).filter((range) => isInRange(matchPos, range));
            if (commentRanges.length > 0) {
                commentRanges.forEach((range) => {
                    const { pos, end } = expandToWhitespace(text, range);
                    updates.push({ kind: 'delete', index: pos, length: end - pos });
                });
            }
            else {
                const printedWithoutComments = printWithoutComments(node);
                const inTemplate = ts.isTemplateLiteralToken(node);
                if (ts.isJsxExpression(node) && printedWithoutComments === '') {
                    const { pos, end } = expandToWhitespace(text, node);
                    updates.push({ kind: 'delete', index: pos, length: end - pos });
                }
                else if (!inTemplate && /^ *\/\/ *@ts-ignore\b/.test(lineText)) {
                    updates.push({ kind: 'delete', index: lineStart, length: lineEnd - lineStart });
                }
            }
        }
    }
    return updateSourceText(text, updates);
}
function findNodeAtPos(sourceFile, pos) {
    const visitor = (node) => ts.forEachChild(node, visitor) || (isInRange(pos, node) ? node : undefined);
    return ts.forEachChild(sourceFile, visitor);
}
function isInRange(pos, range) {
    return range.pos <= pos && pos < range.end;
}
function expandToWhitespace(text, range) {
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
function getCommentRanges(text, pos) {
    return [
        ...(ts.getLeadingCommentRanges(text, pos) || []),
        ...(ts.getTrailingCommentRanges(text, pos) || []),
    ];
}
//# sourceMappingURL=strip-ts-ignore.js.map