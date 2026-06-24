/// <reference types="vite/client" />

interface Window {
  MonacoEnvironment?: {
    getWorker: (workerId: string, label: string) => Worker
  }
}

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}
