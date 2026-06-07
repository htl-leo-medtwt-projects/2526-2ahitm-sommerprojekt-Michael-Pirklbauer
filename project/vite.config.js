import { defineConfig } from 'vite'
import * as babel from '@babel/core'
import fs from 'fs'
import path from 'path'

const isDebug =
    process.argv.includes('--debug') ||
    process.env.VITE_DEBUG === 'true';

function exposeToGlobalPlugin() {
    function shouldTransform(id) {
        return (
            id.endsWith('.js') &&
            !id.includes('/node_modules/')
        );
    }

    function exposeStatement(template, name) {
        return template.statement.ast(
            `globalThis.${name} = ${name};`
        );
    }

    function getNames(path, t) {
        // function hello() {}
        // class Player {}
        if (
            path.isFunctionDeclaration() ||
            path.isClassDeclaration()
        ) {
            return path.node.id?.name
                ? [path.node.id.name]
                : [];
        }

        // const x = 1
        // let y = 2
        if (path.isVariableDeclaration()) {
            return path.node.declarations
                .map(decl => decl.id)
                .filter(t.isIdentifier)
                .map(id => id.name);
        }

        return [];
    }

    function createBabelPlugin() {
        return ({ types: t, template }) => ({
            visitor: {
                Program(programPath) {
                    const statements = programPath
                        .get('body')
                        .flatMap(path =>
                            getNames(path, t).map(name =>
                                exposeStatement(template, name)
                            )
                        );

                    if (statements.length) {
                        programPath.pushContainer(
                            'body',
                            statements
                        );
                    }
                }
            }
        });
    }

    function transformCode(code, id) {
        return babel.transformSync(code, {
            filename: id,
            sourceMaps: true,
            plugins: [
                createBabelPlugin()
            ]
        });
    }

    return {
        name: 'expose-to-global',

        transform(code, id) {
            if (!isDebug || !shouldTransform(id)) {
                return;
            }

            const result = transformCode(code, id);

            return {
                code: result.code,
                map: result.map
            };
        }
    };
}

function preloadAssets(folders) {
    function getFilesRecursive(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        return entries.flatMap(entry => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                return getFilesRecursive(fullPath);
            }

            return [fullPath];
        });
    }

    function preloadFolder({
        type,
        basePath,
        include = (filePath) => true,
        root = process.cwd()
    }) {
        const dir = path.resolve(root, basePath);

        return getFilesRecursive(dir)
            .map(file => {
                const relativePath = path
                    .relative(dir, file)
                    .replace(/\\/g, '/');

                return { file, relativePath };
            })
            .filter(({ relativePath }) => include(relativePath))
            .map(({ relativePath }) => {
                return {
                    tag: 'link',
                    injectTo: 'head',
                    attrs: {
                        rel: 'preload',
                        as: type,
                        href: `${basePath}/${relativePath}`
                    }
                };
            });
    }

    return {
        name: 'preload-assets',

        transformIndexHtml() {
            return folders.flatMap(preloadFolder);
        }
    }
}

export default defineConfig({
    plugins: [
        exposeToGlobalPlugin()
    ]
});