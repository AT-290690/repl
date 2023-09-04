import { compileToJs } from '../node_modules/node-lisper/src/compiler.js'
import { evaluate, run } from '../node_modules/node-lisper/src/interpreter.js'
import { treeShake } from '../node_modules/node-lisper/src/utils.js'
import { lispLandExtension } from './extensions.js'
import { CodeMirror } from './wisp.editor.bundle.js'
import { parse } from '../node_modules/node-lisper/src/parser.js'
import std from '../node_modules/node-lisper/lib/baked/std.js'
import math from '../node_modules/node-lisper/lib/baked/math.js'
import dom from './baked-dom.js'
const libraries = {
  std,
  math,
  dom,
}
const consoleElement = document.getElementById('console')
const editorContainer = document.getElementById('editor-container')
const droneButton = document.getElementById('drone')
const errorIcon = document.getElementById('error-drone-icon')
const execIcon = document.getElementById('exec-drone-icon')
const toggleAppMode = document.getElementById('toggle-app-mode')
const toggleLogMode = document.getElementById('toggle-log-mode')
// const togglePrettyMode = document.getElementById('toggle-pretty-mode')
const toggleShareMode = document.getElementById('toggle-share-mode')
const consoleEditor = CodeMirror(consoleElement)
let RATIO_Y = 1
const droneIntel = (icon) => {
  icon.style.visibility = 'visible'
  setTimeout(() => (icon.style.visibility = 'hidden'), 500)
}

console.error = (error) => {
  consoleElement.classList.add('error_line')
  consoleEditor.setValue(error + ' ')
  droneButton.classList.remove('shake')
  droneButton.classList.add('shake')
  execIcon.style.visibility = 'hidden'
  droneIntel(errorIcon)
}
lispLandExtension.env['list-scripts'] = (args, env) => {
  const title = args[0] ? evaluate(args[0], env) : ''
  const skip = args[1] ? evaluate(args[1], env) : 0
  const limit = args[2] ? evaluate(args[2], env) : 25
  fetch(`${location.origin}/ls?title=${title}&skip=${skip}&limit=${limit}`)
    .then((raw) => raw.json())
    .then((scripts) =>
      editor.setValue(
        scripts
          .map(({ title, portal }) => `; (load-script "${title}" "${portal}")`)
          .join('\n')
      )
    )
}
lispLandExtension.env['load-script'] = (args, env) => {
  if (args.length !== 2)
    throw new RangeError(
      'Invalid number of arguments to (load-script) [2 required]'
    )
  const title = evaluate(args[0], env)
  const portal = evaluate(args[1], env)
  editor.setValue('')
  fetch(`${location.origin}/script?portal=${portal}&title=${title}`)
    .then((raw) => raw.text())
    .then((script) => {
      const existing = editor.getValue().trim()
      editor.setValue(existing ? existing + '\n' : '' + script)
    })
}
lispLandExtension.env['login'] = (args, env) => {
  if (args.length !== 2)
    throw new RangeError('Invalid number of arguments to (login) [2 required]')
  const portal = evaluate(args[0], env)
  const password = evaluate(args[1], env)
  editor.setValue('')
  fetch(`${location.origin}/login`, {
    method: 'POST',
    headers: {
      credentials: 'same-origin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      portal,
      password,
    }),
  })
}
lispLandExtension.env['register'] = (args, env) => {
  if (args.length)
    throw new RangeError(
      'Invalid number of arguments to (register) [0 required]'
    )
  editor.setValue('')
  fetch(`${location.origin}/register`, {
    method: 'POST',
    headers: {
      credentials: 'same-origin',
      'Content-Type': 'application/json',
    },
  })
    .then((data) => data.text())
    .then((creds) => creds.split('.'))
    .then(([portal, password]) => {
      localStorage.setItem('portal', portal)
      editor.setValue(`portal: ${portal}\npassword: ${password}`)
      // localStorage.setItem('password', password)
    })
}
lispLandExtension.env['log'] = (args, env) => {
  if (!args.length)
    throw new RangeError('Invalid number of arguments to (log) [>= 1 required]')
  const expressions = args.map((x) => evaluate(x, env))

  const current = consoleEditor.getValue()
  const msg = expressions.at(-1)
  consoleEditor.setValue(
    `${current ? `${current}\n` : ''}${
      msg !== undefined
        ? JSON.stringify(msg, (_, value) => {
            switch (typeof value) {
              case 'bigint':
                return Number(value)
              case 'function':
                return 'λ'
              case 'undefined':
              case 'symbol':
                return 0
              case 'boolean':
                return +value
              default:
                return value
            }
          })
            .replace(new RegExp(/\[/g), '(')
            .replace(new RegExp(/\]/g), ')')
            .replace(new RegExp(/\,/g), ' ')
            .replace(new RegExp(/"λ"/g), 'λ')
        : 'void'
    }`
  )

  return msg
}
const execute = async (source) => {
  try {
    consoleElement.classList.remove('error_line')
    if (!source.trim()) return

    const result = run(
      [
        ...libraries['std'],
        ...libraries['math'],
        ...libraries['dom'],
        ...parse(source),
      ],
      lispLandExtension.env
    )
    droneButton.classList.remove('shake')
    errorIcon.style.visibility = 'hidden'
    droneIntel(execIcon)
    return result
  } catch (err) {
    console.error(err)
  }
}

const editor = CodeMirror(editorContainer, {})
droneButton.addEventListener('click', () => {
  return document.dispatchEvent(
    new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 's',
    })
  )
})

let lastCmds = []
const withCommand = (command) => {
  const value = editor.getValue()
  switch (command.trim()) {
    // case cmds.window:
    //   {
    //     const encoded = encodeURIComponent(encodeBase64(value));
    //     window.open(
    //       `${
    //         window.location.href.split('/editor/')[0]
    //       }/index.html?l=${encoded}`,
    //       'Bit',
    //       `menubar=no,directories=no,toolbar=no,status=no,scrollbars=no,resize=no,width=600,height=600,left=600,top=150`
    //     );
    //   }
    //   break;
    case 'focus':
      {
        const application = document.getElementById('application')
        application.style.display = 'none'
        application.src = `${
          window.location.href.split('/editor/')[0]
        }/index.html`
        const bouds = document.body.getBoundingClientRect()
        const width = bouds.width
        const height = bouds.height
        RATIO_Y = 1
        editor.setSize(width, (height - 60) * RATIO_Y)
      }
      break
    case 'app':
      {
        if (!value) return
        const application = document.getElementById('application')
        const script = document.createElement('script')

        const tree = parse(value)
        if (Array.isArray(tree)) {
          const { top, program, deps } = compileToJs(
            parse(value),
            lispLandExtension.Extensions,
            lispLandExtension.Helpers,
            lispLandExtension.Tops
          )
          const JavaScript = `${top}${treeShake(
            deps,
            JSON.parse(JSON.stringify(Object.values(libraries)))
          )}${program}`
          application.contentWindow.document.body.innerHTML = ''
          script.innerHTML = JavaScript
          application.contentWindow.document.body.appendChild(script)

          application.style.display = 'block'
          const bouds = document.body.getBoundingClientRect()
          const width = bouds.width
          const height = bouds.height
          RATIO_Y = 0.35
          editor.setSize(width, (height - 60) * RATIO_Y)
        }
      }
      break
    case 'link':
      fetch(`${location.origin}/save`, {
        method: 'POST',
        headers: {
          credentials: 'same-origin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: value,
          title: editor.getLine(0).split('; ').pop() ?? 'Untitled',
        }),
      }).finally(() => {
        consoleEditor.setValue('')
        toggleShareMode.dispatchEvent(new KeyboardEvent('click'))
      })

      break
    case 'log':
      {
        consoleEditor.setValue('')
        const selection = editor.getSelection().trim()
        if (selection) {
          const out = `(log ${selection})`
          editor.replaceSelection(out)

          execute(`${editor.getValue().trim()}`)
          editor.setValue(value)

          // }
        } else execute(`(log ${value})`)
      }
      break
    case 'exe':
    default:
      consoleEditor.setValue('')
      execute(value)
      break
  }
}
document.addEventListener('keydown', (e) => {
  if (e.key && e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
    e = e || window.event
    e.preventDefault()
    e.stopPropagation()
    checkToggles()
    if (!lastCmds.length) return withCommand('exe')
    lastCmds.forEach((cmd) => withCommand(cmd))
    lastCmds.length = 0
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
  }
})
const checkToggles = () => {
  if (+toggleLogMode.getAttribute('toggled')) lastCmds.push('log')
  if (+toggleShareMode.getAttribute('toggled')) lastCmds.push('link')
  if (+toggleAppMode.getAttribute('toggled')) lastCmds.push('app')
}
toggleLogMode.addEventListener('click', (e) => {
  const state = +e.target.getAttribute('toggled')
  e.target.setAttribute('toggled', state ^ 1)
  e.target.style.opacity = state ? 0.25 : 1
})

toggleShareMode.addEventListener('click', (e) => {
  const state = +e.target.getAttribute('toggled')
  e.target.setAttribute('toggled', state ^ 1)
  e.target.style.opacity = state ? 0.25 : 1
})

toggleAppMode.addEventListener('click', (e) => {
  const state = +e.target.getAttribute('toggled')
  e.target.setAttribute('toggled', state ^ 1)
  if (state) withCommand('focus')
  e.target.style.opacity = state ? 0.25 : 1
})
editor.focus()
window.addEventListener('resize', () => {
  const bouds = document.body.getBoundingClientRect()
  const width = bouds.width
  const height = bouds.height
  editor.setSize(width, (height - 60) * RATIO_Y)
  consoleEditor.setSize(width - 80, 40)
})
const bounds = document.body.getBoundingClientRect()
editor.setSize(bounds.width, (bounds.height - 60) * RATIO_Y)
consoleEditor.setSize(bounds.width - 80, 40)
// fetch(location.origin + '/portal')
//   .then((data) => data.text())
//   .then((portalId) => localStorage.setItem('portal', portalId))
const registerSW = async () => {
  if ('serviceWorker' in navigator)
    try {
      await navigator.serviceWorker.register('./lisp-editor/sw.js')
    } catch (e) {
      console.log({ e })
      console.log(`SW registration failed`)
    }
}

window.addEventListener('load', registerSW)
