import ts from 'typescript';

export function isDiagnosticWithLinePosition(
  diagnostic: ts.Diagnostic | ts.DiagnosticWithLocation | undefined,
): diagnostic is ts.DiagnosticWithLocation {
  return (
    diagnostic != null &&
    (diagnostic as ts.DiagnosticWithLocation).start !== undefined &&
    (diagnostic as ts.DiagnosticWithLocation).length !== undefined
  );
}

export function isDiagnostic(
  diagnostic: ts.Diagnostic | ts.DiagnosticWithLocation | undefined,
): diagnostic is ts.Diagnostic {
  return diagnostic != null && !isDiagnosticWithLinePosition(diagnostic);
}
