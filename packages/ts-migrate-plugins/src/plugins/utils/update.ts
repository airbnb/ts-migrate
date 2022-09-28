import ts from 'typescript';
import updateSourceText, { SourceTextUpdate } from '../../utils/updateSourceText';

/**
 * Tracks updates to a ts.SourceFile as text changes.
 * This is useful to preserve as much of the original whitespace in the source
 * file as possible. Re-printing the entire file causes blank lines to be lost.
 *
 * See: https://github.com/microsoft/TypeScript/issues/843
 */
class UpdateTracker {
  private updates: SourceTextUpdate[] = [];

  private printer = ts.createPrinter();

  constructor(private sourceFile: ts.SourceFile) {}

  private insert(pos: number, text: string): void {
    this.updates.push({
      kind: 'insert',
      index: pos,
      text,
    });
  }

  /**
   * Adds a return type annotation to a function.
   * replaceNode would require reprinting the entire function body, losing all whitespace details.
   */
  public addReturnAnnotation(node: ts.SignatureDeclaration, type: ts.TypeNode): void {
    const paren = node
      .getChildren(this.sourceFile)
      .find((node) => node.kind === ts.SyntaxKind.CloseParenToken);
    let pos;
    if (paren) {
      pos = paren.pos + 1;
    } else {
      // Must be an arrow function with single parameter and no parentheses.
      // Add parentheses.
      pos = node.parameters.end;
      const [param] = node.parameters;
      this.insert(param.getStart(), '(');
      this.insert(pos, ')');
    }
    const text = this.printer.printNode(ts.EmitHint.Unspecified, type, this.sourceFile);
    this.insert(pos, `: ${text}`);
  }

  public insertNodes<T extends ts.Node>(pos: number, nodes: ts.NodeArray<T>): void {
    const text = this.printer.printList(ts.ListFormat.SpaceAfterList, nodes, this.sourceFile);
    this.insert(pos, text);
  }

  private replace(pos: number, length: number, text: string): void {
    this.updates.push({
      kind: 'replace',
      index: pos,
      length,
      text,
    });
  }

  public replaceNode(oldNode: ts.Node | undefined, newNode: ts.Node | undefined): void {
    if (oldNode && newNode && oldNode !== newNode) {
      const printedNextNode = this.printer.printNode(
        ts.EmitHint.Unspecified,
        newNode,
        this.sourceFile,
      );
      const text = oldNode
        .getFullText(this.sourceFile)
        .replace(/^(\s*)[^]*?(\s*)$/, (_match, p1, p2) => `${p1}${printedNextNode}${p2}`);
      this.updates.push({
        kind: 'replace',
        index: oldNode.pos,
        length: oldNode.end - oldNode.pos,
        text,
      });
    }
  }

  public replaceNodes<T extends ts.Node>(
    oldNodes: ts.NodeArray<T>,
    newNodes: ts.NodeArray<T>,
    addParens = false,
  ): void {
    if (oldNodes !== newNodes) {
      const listFormat = addParens ? ts.ListFormat.Parenthesis : ts.ListFormat.CommaListElements;
      const printedNextNode = this.printer.printList(listFormat, newNodes, this.sourceFile);
      const prevText = this.sourceFile.text.substring(oldNodes.pos, oldNodes.end);
      const text = prevText.replace(/^(\s*)[^]*?(\s*)$/, `$1${printedNextNode}$2`);
      this.replace(oldNodes.pos, oldNodes.end - oldNodes.pos, text);
    }
  }

  /**
   * Returns the result of applying all tracked changes to the source file.
   */
  public apply(): string {
    return updateSourceText(this.sourceFile.text, this.updates);
  }
}

export default UpdateTracker;
