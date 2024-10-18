import type { PluginImpl } from "rollup";
import { builtinModules, isBuiltin } from "node:module";

const builtinModulesRegex = new RegExp(
  `((?:require|import|from)\\(?\\s*["'])(${builtinModules
    .map((builtinModule) => builtinModule.replaceAll("/", String.raw`\\/`))
    .join("|")})(["']\\s?\\)?)`,
  "g"
);
const builtinModulesRegexReplacement = "$1node:$2$3";

function prefixNodeImportsWithProtocol(input: string): string {
  if (!input.startsWith("node:") && isBuiltin(input)) {
    return `node:${input}`;
  }
  return input;
}

const rollupPluginNodeProtocolImports: PluginImpl = () => {
  return {
    name: "rollupPluginProtocol",
    generateBundle(options, bundle) {
      if (typeof options.entryFileNames === "string") {
        const fileName = options.entryFileNames;
        const bundleFile = bundle[fileName];
        if ("code" in bundleFile) {
          bundleFile.code = bundleFile.code.replaceAll(
            builtinModulesRegex,
            builtinModulesRegexReplacement
          );
          bundleFile.imports = bundleFile.imports.map(
            prefixNodeImportsWithProtocol
          );
          bundleFile.dynamicImports = bundleFile.dynamicImports.map(
            prefixNodeImportsWithProtocol
          );
          bundleFile.importedBindings = Object.fromEntries(
            Object.entries(bundleFile.importedBindings).map(([key, value]) => {
              return [prefixNodeImportsWithProtocol(key), value];
            })
          );
        }
      }
    },
  };
};

export default rollupPluginNodeProtocolImports;
