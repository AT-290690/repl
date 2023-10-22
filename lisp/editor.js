import { compileToJs } from '../node_modules/node-lisper/src/compiler.js'
import { evaluate, run } from '../node_modules/node-lisper/src/interpreter.js'
import {
  handleUnbalancedParens,
  handleUnbalancedQuotes,
  removeNoCode,
  treeShake,
} from '../node_modules/node-lisper/src/utils.js'
import { lispLandExtension } from './extensions.js'
import { CodeMirror } from './wisp.editor.bundle.js'
import { parse } from '../node_modules/node-lisper/src/parser.js'
import str from '../node_modules/node-lisper/lib/baked/str.js'
import std from '../node_modules/node-lisper/lib/baked/std.js'
import math from '../node_modules/node-lisper/lib/baked/math.js'
import ds from '../node_modules/node-lisper/lib/baked/ds.js'
import dom from './baked-dom.js'
import { validPassword } from '../utils/validation.js'
const libraries = {
  std,
  str,
  math,
  dom,
  ds,
}
const libs = [
  ...libraries['std'],
  ...libraries['str'],
  ...libraries['math'],
  ...libraries['ds'],
  ...libraries['dom'],
]
const consoleElement = document.getElementById('console')
const editorContainer = document.getElementById('editor-container')
const droneButton = document.getElementById('drone')
const errorIcon = document.getElementById('error-drone-icon')
const execIcon = document.getElementById('exec-drone-icon')
const toggleAppMode = document.getElementById('toggle-app-mode')
const toggleLogMode = document.getElementById('toggle-log-mode')
const toggleCompileMode = document.getElementById('toggle-compile-mode')

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
          .map(({ title, user }) => `; (load-script "${title}" "${user}")`)
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
  const user = evaluate(args[1], env)
  editor.setValue('')
  fetch(`${location.origin}/script?user=${user}&title=${title}`)
    .then((raw) => raw.text())
    .then((script) => {
      const existing = editor.getValue().trim()
      editor.setValue(existing ? existing + '\n' : '' + script)
    })
}
lispLandExtension.env['share-script'] = (args, env) => {
  if (args.length !== 2)
    throw new RangeError(
      'Invalid number of arguments to (share-script) [2 required]'
    )
  const title = evaluate(args[0], env)
  const user = evaluate(args[1], env)

  window.open(
    `${location.origin}/pages?user=${user}&title=${title}`,
    '_blank'
    // `menubar=no,directories=no,toolbar=no,status=no,scrollbars=no,resize=no,width=600,height=600,left=600,top=150`
  )
}
lispLandExtension.env['login'] = (args, env) => {
  if (args.length !== 2)
    throw new RangeError('Invalid number of arguments to (login) [2 required]')
  const username = evaluate(args[0], env)
  const password = evaluate(args[1], env)
  fetch(`${location.origin}/login`, {
    method: 'POST',
    headers: {
      credentials: 'same-origin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then((res) => res.text())
    .then((message) => consoleEditor.setValue(message))
}
lispLandExtension.env['register'] = (args, env) => {
  if (args.length !== 2)
    throw new RangeError(
      'Invalid number of arguments to (register) [2 required]'
    )
  const [username, password] = args
    .map((x) => evaluate(x, env))
    .map((t) => {
      if (typeof t !== 'string')
        throw new TypeError('Username and password must be strings')
      return t
    })
    .map((x) => x.trim())

  if (username.length < 3)
    throw new RangeError('Username must be at least 3 characters long')
  if (!validPassword(password))
    throw new RangeError(
      'Password needs to be at least 6 characters long and containt at least one Upper and Lower case letter and a number'
    )

  fetch(`${location.origin}/register`, {
    method: 'POST',
    headers: {
      credentials: 'same-origin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then((data) => data.text())
    .then((message) => consoleEditor.setValue(message))
    .catch((error) => consoleEditor.setValue(error))
  // .then((creds) => creds.split('.'))
  // .then(([portal, password]) => {
  //   localStorage.setItem('portal', portal)
  //   editor.setValue(`portal: ${portal}\npassword: ${password}`)
  //   // localStorage.setItem('password', password)
  // })
}
globalThis.log = (args) => {
  const current = consoleEditor.getValue()
  const msg = args.at(-1)
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
lispLandExtension.env['console-log'] = (args, env) => {
  if (!args.length)
    throw new RangeError('Invalid number of arguments to (log) [>= 1 required]')
  const expressions = args.map((x) => evaluate(x, env))
  return log(expressions)
}
lispLandExtension.Helpers.consoleLog = {
  source: `consoleLog = (...args) => globalThis.log(args)`,
}
lispLandExtension.Extensions['console-log'] = (...args) =>
  `consoleLog(${args.join(',')});`
const compileAndEval = (source) => {
  const tree = parse(
    handleUnbalancedQuotes(handleUnbalancedParens(removeNoCode(source)))
  )
  if (Array.isArray(tree)) {
    const { top, program, deps } = compileToJs(
      tree,
      lispLandExtension.Extensions,
      lispLandExtension.Helpers,
      lispLandExtension.Tops
    )

    const JavaScript = `${top}${treeShake(
      deps,
      JSON.parse(JSON.stringify(Object.values(libraries)))
    )}${program}`
    return eval(JavaScript)
  }
}

const execute = async (source, compile = 0) => {
  try {
    consoleElement.classList.remove('error_line')
    if (!source.trim()) return
    const result = compile
      ? compileAndEval(source)
      : run([...libs, ...parse(source)], lispLandExtension.env)
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

        const tree = parse(
          handleUnbalancedQuotes(handleUnbalancedParens(removeNoCode(value)))
        )
        if (Array.isArray(tree)) {
          const { top, program, deps } = compileToJs(
            tree,
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
      {
        const title = editor.getLine(0).split('; ').pop() ?? 'Untitled'
        fetch(`${location.origin}/save`, {
          method: 'POST',
          headers: {
            credentials: 'same-origin',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: value,
            title,
          }),
        })
          .then(() => consoleEditor.setValue(`Script ${title} saved!`))
          .finally(() =>
            toggleShareMode.dispatchEvent(new KeyboardEvent('click'))
          )
      }
      break
    case 'log':
      {
        consoleEditor.setValue('')
        const selection = editor.getSelection().trim()
        if (selection) {
          const out = `(console-log ${selection})`
          editor.replaceSelection(out)

          execute(
            `${editor.getValue().trim()}`,
            +toggleCompileMode.getAttribute('toggled')
          )
          editor.setValue(value)

          // }
        } else
          execute(
            `(console-log ${value})`,
            +toggleCompileMode.getAttribute('toggled')
          )
      }
      break
    case 'exe':
    default:
      consoleEditor.setValue('')
      execute(value, +toggleCompileMode.getAttribute('toggled'))
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
toggleCompileMode.addEventListener('click', (e) => {
  if (+toggleAppMode.getAttribute('toggled')) return
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
  if (+toggleCompileMode.getAttribute('toggled'))
    toggleCompileMode.dispatchEvent(new KeyboardEvent('click'))
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
      await navigator.serviceWorker.register('./lisp/sw.js')
    } catch (e) {
      console.log({ e })
      console.log(`SW registration failed`)
    }
}

window.addEventListener('load', registerSW)
