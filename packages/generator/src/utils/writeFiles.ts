import { SourceFile, VariableDeclarationKind } from 'ts-morph'
import { GeneratorOptions } from '@prisma/generator-helper'

export const writeImportsAndExports = (
  file: SourceFile,
  options: GeneratorOptions,
) => {
  const { fetchModule = 'browser' } = options.generator.config
  if (fetchModule !== 'browser')
    file.addImportDeclaration({
      defaultImport: 'fetch',
      moduleSpecifier: fetchModule ?? '',
    })
  file.addImportDeclaration({
    namedImports: ['prepare'],
    moduleSpecifier: '@sb-prisma/client',
  })
  file.addExportDeclaration({
    namedExports: ['createClient', 'sb'],
    moduleSpecifier: '@sb-prisma/client',
  })
}

export const writeOperationMapping = (
  file: SourceFile,
  options: GeneratorOptions,
) => {
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'operationMapping',
        initializer: (writer) => {
          writer.block(() => {
            options.dmmf.mappings.modelOperations.forEach(
              ({ model, ...rest }) => {
                Object.entries(rest).forEach(([method, func]) => {
                  writer.write(`${func}: `)
                  writer.inlineBlock(() => {
                    writer.write('model: ').quote(model).write(',')
                    writer.write('method: ').quote(method)
                  })
                  writer.write(',')
                })
              },
            )
          })
        },
      },
    ],
  })
}

export const writeRelationMapping = (
  file: SourceFile,
  options: GeneratorOptions,
) => {
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'relationMapping',
        initializer: (writer) => {
          writer.block(() => {
            options.dmmf.datamodel.models.forEach(({ name, fields }) => {
              writer.write(`${name}: `)
              writer.inlineBlock(() => {
                fields.forEach(({ kind, name, type }) => {
                  if (kind === 'object')
                    writer.write(`${name}: "${type}"`).write(',')
                })
              })
              writer.write(',')
            })
          })
        },
      },
    ],
  })
}

export const writeTableMapping = (
  file: SourceFile,
  options: GeneratorOptions,
) => {
  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'tableMapping',
        initializer: (writer) => {
          writer.block(() => {
            options.dmmf.datamodel.models.forEach(({ name, dbName }) => {
              writer
                .write(`${name}: `)
                .quote(dbName ?? name)
                .write(',')
            })
          })
        },
      },
    ],
  })
}

const ENDPOINT = 'SUPABASE_URL'
const API_KEY = 'SUPABASE_API_KEY'

export const writePrepareFunction = (
  file: SourceFile,
  options: GeneratorOptions,
) => {
  const { endpoint = ENDPOINT, apikey = API_KEY } = options.generator.config
  file.addStatements((writer) => {
    writer.write('prepare(')
    writer
      .inlineBlock(() => {
        writer.write('endpoint: ').write(`process.env.${endpoint}`).write(',')
        writer.write('apikey: ').write(`process.env.${apikey}`).write(',')
        writer.writeLine('//@ts-ignore')
        writer.write('fetch').write(',')
        writer
          .write('modelMap: ')
          .inlineBlock(() => {
            writer.write('operationMapping,')
            writer.write('relationMapping,')
            writer.write('tableMapping,')
          })
          .write(',')
      })
      .write(')')
  })
}
