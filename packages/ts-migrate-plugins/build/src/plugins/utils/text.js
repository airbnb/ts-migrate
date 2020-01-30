import ts from 'typescript';
export function getTextPreservingWhitespace(prevNode, nextNode, sourceFile) {
    const printer = ts.createPrinter();
    const printedNextNode = printer.printNode(ts.EmitHint.Unspecified, nextNode, sourceFile);
    return prevNode.getFullText(sourceFile).replace(/^(\s*)[^]*?(\s*)$/, `$1${printedNextNode}$2`);
}
//# sourceMappingURL=text.js.map