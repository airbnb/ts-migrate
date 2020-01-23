import tsp from 'typescript/lib/protocol';

export function isDiagnosticWithLinePosition(
  diagnostic: tsp.Diagnostic | tsp.DiagnosticWithLinePosition | undefined,
): diagnostic is tsp.DiagnosticWithLinePosition {
  return (
    diagnostic != null &&
    (diagnostic as tsp.DiagnosticWithLinePosition).startLocation !== undefined &&
    (diagnostic as tsp.DiagnosticWithLinePosition).endLocation !== undefined
  );
}

export function isDiagnostic(
  diagnostic: tsp.Diagnostic | tsp.DiagnosticWithLinePosition | undefined,
): diagnostic is tsp.Diagnostic {
  return diagnostic != null && !isDiagnosticWithLinePosition(diagnostic);
}
