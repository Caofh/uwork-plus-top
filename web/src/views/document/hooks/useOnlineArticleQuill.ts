declare global {
  interface Window {
    Quill?: any
  }
}

const QUILL_CSS = 'https://cdn.quilljs.com/1.3.6/quill.snow.css'
const QUILL_JS = 'https://cdn.quilljs.com/1.3.6/quill.js'

let quillLoadPromise: Promise<any> | null = null

export function loadQuill() {
  if (window.Quill) return Promise.resolve(window.Quill)
  if (quillLoadPromise) return quillLoadPromise

  quillLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${QUILL_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = QUILL_CSS
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = QUILL_JS
    script.onload = () => resolve(window.Quill)
    script.onerror = () => reject(new Error('Quill 加载失败'))
    document.head.appendChild(script)
  })

  return quillLoadPromise
}

export const quillToolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block', 'link', 'image'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ size: ['small', false, 'large', 'huge'] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['clean'],
]

export function createQuillEditor(
  selector: string,
  options: {
    content?: string
    onTextChange?: () => void
    onImageClick?: () => void
    onContentClick?: (event: MouseEvent) => void
  } = {}
) {
  const Quill = window.Quill
  if (!Quill) throw new Error('Quill 未加载')

  const quill = new Quill(selector, {
    modules: {
      toolbar: quillToolbarOptions,
      clipboard: {
        matchers: [[Node.ELEMENT_NODE, handleCustomMatcher]],
      },
    },
    placeholder: '请编辑文章内容',
    theme: 'snow',
  })

  if (options.content) {
    quill.root.innerHTML = options.content
  }

  if (options.onTextChange) {
    setTimeout(() => {
      quill.on('text-change', options.onTextChange)
    }, 2000)
  }

  if (options.onImageClick) {
    setTimeout(() => {
      const toolbar = quill.getModule('toolbar')
      toolbar.addHandler('image', options.onImageClick)
    }, 0)
  }

  if (options.onContentClick) {
    quill.container.addEventListener('click', options.onContentClick, true)
    quill.__contentClickHandler = options.onContentClick
  }

  return quill
}

export function destroyQuillEditor(quill: any, containerId?: string) {
  if (quill) {
    if (quill.__contentClickHandler) {
      quill.container?.removeEventListener('click', quill.__contentClickHandler, true)
      quill.__contentClickHandler = null
    }
    const toolbar = quill.getModule('toolbar')
    toolbar?.container?.remove()
    const container = quill.container
    if (container) {
      container.className = ''
      container.innerHTML = ''
      if (containerId) container.id = containerId
    }
    return
  }

  if (!containerId) return
  const container = document.getElementById(containerId)
  if (!container) return

  let prev = container.previousElementSibling
  while (prev?.classList?.contains('ql-toolbar')) {
    const toRemove = prev
    prev = prev.previousElementSibling
    toRemove.remove()
  }
  container.className = ''
  container.innerHTML = ''
}

function handleCustomMatcher(_node: Node, delta: any) {
  const ops: any[] = []
  delta.ops.forEach((op: any) => {
    if (op.insert && typeof op.insert === 'string') {
      ops.push({ insert: op.insert })
    }
  })
  delta.ops = ops
  return delta
}
