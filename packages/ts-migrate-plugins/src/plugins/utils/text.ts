import ts from 'typescript';

export function getTextPreservingWhitespace(
  prevNode: ts.Node,
  nextNode: ts.Node,
  sourceFile: ts.SourceFile,
): string {
  const printer = ts.createPrinter();
  const printedNextNode = printer.printNode(ts.EmitHint.Unspecified, nextNode, sourceFile);
  return prevNode.getFullText(sourceFile).replace(/^(\s*)[^]*?(\s*)$/, `$1${printedNextNode}$2`);
}
