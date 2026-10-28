import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// Compile the real modules in an isolated runtime. Network/provider boundaries
// are injectable; production files and environment variables are untouched.
export function loadSource(entry, { mocks = {}, globals = {}, timerScale = 1 } = {}) {
  const cache = new Map();
  const context = vm.createContext({
    console, AbortController, AbortSignal, DOMException, Response, Request,
    Error, TypeError, SyntaxError, URL, crypto: globalThis.crypto,
    setTimeout: (fn, ms) => setTimeout(fn, ms * timerScale), clearTimeout,
    process: { env: {} }, fetch: (...args) => fetch(...args), ...globals,
  });
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const source = fs.readFileSync(filename, "utf8");
    const js = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    }}).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("@/")) return load(path.join(root, name.slice(2)) + ".ts");
      if (name.startsWith(".")) return load(path.resolve(path.dirname(filename), name) + ".ts");
      return require(name);
    };
    vm.runInContext(`(function(require,module,exports){${js}\n})`, context, { filename })(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return { module: load(path.join(root, entry)), context, load };
}

export function loadDashboardHandler(requestOrganize) {
  const source = fs.readFileSync(path.join(root, "app/(dashboard)/dashboard/page.tsx"), "utf8");
  const start = source.indexOf("  const runOrganize = async");
  const end = source.indexOf("\n  return (", start);
  const state = { tasks: [{ id: "existing" }], dailyPlan: [{ id: "existing" }], notes: [], isProcessing: false };
  const context = { requestOrganize, AbortController, Error, user: {}, organizeRequest: {current:null}, lastOrganizeInput:{current:null} };
  for (const name of ["Tasks", "FocusTask", "DailyPlan", "Insight", "IsInsightDismissed", "Notes", "IsProcessing", "OrganizeError", "OrganizeNotice"]) {
    const key = name[0].toLowerCase() + name.slice(1);
    context[`set${name}`] = (value) => { state[key] = typeof value === "function" ? value(state[key]) : value; };
  }
  const js = ts.transpileModule(source.slice(start,end) + "\nglobalThis.run = runOrganize; globalThis.cancel = cancelOrganize;", {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js, context);
  return { context, state };
}
