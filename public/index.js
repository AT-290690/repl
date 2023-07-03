import { CodeMirror } from './wisp.editor.bundle.js'
;(() => {
  const editor = CodeMirror(document.getElementById('editor-container'), {}),
    RATIO_Y = 1

  editor.focus()

  window.addEventListener('resize', () => {
    const bouds = document.body.getBoundingClientRect(),
      width = bouds.width,
      height = bouds.height

    editor.setSize(width, (height - 60) * RATIO_Y)
    consoleEditor.setSize(width - 80, 40)
  })
  const bounds = document.body.getBoundingClientRect()
  editor.setSize(bounds.width, (bounds.height - 60) * RATIO_Y)

  const console = document.getElementById('console')
  // const run = document.getElementById('run');
  const socket = io()
  socket.on('eval', (result) => {
    console.textContent = result.toString()
  })
  // run.addEventListener('click', () => {
  //   socket.emit('eval', editor.getValue().trim() + '\n');
  // });

  document.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      e.stopPropagation()
      socket.emit('eval', editor.getValue().trim())
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
    }
  })
})()
