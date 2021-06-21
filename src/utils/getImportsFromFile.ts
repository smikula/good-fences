import NormalizedPath from '../types/NormalizedPath';
import ImportRecord from '../core/ImportRecord';
import { SourceFileProvider } from '../core/SourceFileProvider';

export default async function getImportsFromFile(
    filePath: NormalizedPath,
    sourceFileProvider: SourceFileProvider
) {
    const rawImports = await sourceFileProvider.getImportsForFile(filePath);
    const resolvedImports = await Promise.all(
        rawImports.map(
            async rawImport =>
                new ImportRecord(
                    rawImport,
                    await sourceFileProvider.resolveImportFromFile(filePath, rawImport)
                )
        )
    );
    return resolvedImports.filter(importRecord => importRecord.filePath);
}
