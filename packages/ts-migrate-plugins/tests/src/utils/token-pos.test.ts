import ts from 'typescript';
import getTokenAtPosition from '../../../src/plugins/utils/token-pos';

describe('getTokenAtPos', () => {
  it('returns the token at a position', () => {
    const text = `\
const c = 1;
`;
    const file = ts.createSourceFile('file.ts', text, ts.ScriptTarget.Latest);

    const expectToken = (position: number, kind: ts.SyntaxKind) => {
      expect(getTokenAtPosition(file, position)).toMatchObject({ kind });
    };

    expectToken(0, ts.SyntaxKind.ConstKeyword);
    expectToken(4, ts.SyntaxKind.ConstKeyword);
    expect(getTokenAtPosition(file, 5)).toMatchObject({
      kind: ts.SyntaxKind.Identifier,
      escapedText: 'c',
    });
    expectToken(7, ts.SyntaxKind.EqualsToken);
    expectToken(text.length - 1, ts.SyntaxKind.EndOfFileToken);
    expectToken(text.length, ts.SyntaxKind.EndOfFileToken);
    expect(getTokenAtPosition(file, text.length + 1)).toBe(file);
  });
});
