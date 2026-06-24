import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type WorkerConstructor = new () => Worker

function createWorker(WorkerCtor: WorkerConstructor) {
  return new WorkerCtor()
}

export function setupMonacoEnvironment() {
  if (typeof window === 'undefined') {
    return
  }

  window.MonacoEnvironment = {
    getWorker(_workerId, label) {
      switch (label) {
        case 'json':
          return createWorker(jsonWorker)
        case 'css':
        case 'scss':
        case 'less':
          return createWorker(cssWorker)
        case 'html':
        case 'handlebars':
        case 'razor':
          return createWorker(htmlWorker)
        case 'typescript':
        case 'javascript':
          return createWorker(tsWorker)
        default:
          return createWorker(editorWorker)
      }
    },
  }
}
