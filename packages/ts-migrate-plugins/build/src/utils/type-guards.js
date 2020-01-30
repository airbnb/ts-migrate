export function isDiagnosticWithLinePosition(diagnostic) {
    return (diagnostic != null &&
        diagnostic.startLocation !== undefined &&
        diagnostic.endLocation !== undefined);
}
export function isDiagnostic(diagnostic) {
    return diagnostic != null && !isDiagnosticWithLinePosition(diagnostic);
}
//# sourceMappingURL=type-guards.js.map