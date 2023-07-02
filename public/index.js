import { CodeMirror } from './wisp.editor.bundle.js';

(() => {
  const editor = CodeMirror(document.getElementById('editor-container'), {});
  const console = document.getElementById('console');
  const run = document.getElementById('run');
  const socket = io();
  socket.on('eval', result => {
    console.textContent = result.toString();
  });
  // run.addEventListener('click', () => {
  //   socket.emit('eval', editor.getValue().trim() + '\n');
  // });

  document.addEventListener('keydown', e => {
    if (e.key && e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      socket.emit('eval', editor.getValue().trim() + '\n');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  });
})();
