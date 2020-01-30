export default function updateSourceText(sourceText, updates) {
    if (updates.length === 0) {
        return sourceText;
    }
    const sortedUpdates = [...updates].sort((update1, update2) => update1.index - update2.index);
    verifyUpdates(sourceText, sortedUpdates);
    let out = '';
    let index = 0;
    sortedUpdates.forEach((update) => {
        out += sourceText.slice(index, update.index);
        if (update.kind === 'insert') {
            out += update.text;
            index = update.index;
        }
        else if (update.kind === 'replace') {
            out += update.text;
            index = update.index + update.length;
        }
        else if (update.kind === 'delete') {
            index = update.index + update.length;
        }
        else {
            unreachable(update);
        }
    });
    out += sourceText.slice(index);
    return out;
}
function verifyUpdates(_sourceText, updates) {
    updates.forEach((update) => {
        if (update.index < 0) {
            throw new Error('Update has negative index');
        }
        if ((update.kind === 'replace' || update.kind === 'delete') && update.length < 0) {
            throw new Error('Update has negative length');
        }
        // TODO(brie): throw if out of sourceText bounds
    });
    // TODO(brie): throw if overlapping updates
}
function unreachable(_arg) {
    throw new Error('');
}
//# sourceMappingURL=updateSourceText.js.map