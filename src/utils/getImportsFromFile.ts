import NormalizedPath from '../types/NormalizedPath';
import ImportRecord from '../core/ImportRecord';
import { SourceFileProvider } from '../core/SourceFileProvider';

export default async function getImportsFromFile(
    sourceFilePath: NormalizedPath,
    sourceFileProvider: SourceFileProvider
) {
    const rawImports = await sourceFileProvider.getImportsForFile(sourceFilePath);
    const resolvedImports = await Promise.all(
        rawImports.map(
            async rawImport =>
                new ImportRecord(
                    rawImport,
                    await sourceFileProvider.resolveImportFromFile(sourceFilePath, rawImport)
                )
        )
    );
    return resolvedImports.filter(importRecord => importRecord.filePath);
}
