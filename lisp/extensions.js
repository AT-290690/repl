import { evaluate } from '../node_modules/node-lisper/src/interpreter.js'

export const lispLandExtension = {
  Extensions: {
    ':parent': (...args) => `$parent_node(${args.join(',')});`,
    ':document': () => 'document;',
    ':body': () => 'document.body;',
    ':get-style': (...args) => `$get_style(${args.join(',')});`,
    ':set-style': (...args) => `$set_style(${args.join(',')});`,
    ':get-text-content': (...args) => `$get_text_content(${args.join(',')});`,
    ':set-text-content': (...args) => `$set_text_content(${args.join(',')});`,
    ':set-value': (...args) => `$set_value(${args.join(',')});`,
    ':get-value': (...args) => `$get_value(${args.join(',')});`,
    ':get-attribute': (...args) => `$get_attribute(${args.join(',')});`,
    ':set-attribute': (...args) => `$set_attribute(${args.join(',')});`,
    ':on-click': (...args) => `$on_click(${args.join(',')});`,
    ':on-key-pressed': (...args) => `$on_key_pressed(${args.join(',')});`,
    ':on-change': (...args) => `$on_change(${args.join(',')});`,
    ':element': (...args) => `$create_element(${args.join(',')});`,
    ':append-to': (...args) => `$append_to(${args.join(',')});`,
    ':append': (...args) => `$append(${args.join(',')});`,
    ':remove-from': (...args) => `$remove_from(${args.join(',')});`,
    ':remove': (...args) => `$remove(${args.join(',')});`,
  },
  Tops: [],
  Helpers: {
    $get_context: {
      source: `$get_context = (canvas, context) => canvas.getContext(context)`,
    },
    $set_value: {
      source: `$set_value = (element, value) => {
        element.value = value
        return element
      }`,
    },
    $get_value: {
      source: `$get_value = (element) => element.value`,
    },
    $create_element: {
      source: `$create_element = (type) => document.createElement(type)`,
    },
    $parent_node: {
      source: `$parent_node = (element) => element.parentNode`,
    },
    $get_attribute: {
      source: `$get_attribute = (element, attribute) => element.getAttribute(attribute)`,
    },
    $get_style: {
      source: `$get_style = (element, prop) => element.style[prop]`,
    },
    $set_style: {
      source: `$set_style = (element, styles) => {
        for(const [prop, style] of styles)
          element.style[prop] = style
        return element
      }`,
    },
    $get_text_content: {
      source: `$set_text_content = (element, content) => element.textContent`,
    },
    $set_text_content: {
      source: `$set_text_content = (element, content) => {
        element.textContent = content
        return element
      }`,
    },
    $on_click: {
      source: `$on_click = (element, callback) => {
        element.addEventListener('click', (e) =>
        callback(e.target, [e.clientX, e.clientY]))
        return element;
      }`,
    },
    $on_key_pressed: {
      source: `$on_key_pressed = (element, callback) => {
        element.addEventListener('keypress', (e) =>
        callback(e.target, e.key))
        return element;
      }`,
    },
    $on_change: {
      source: `$on_change = (element, callback) => {
        element.addEventListener('change', (e) =>
        callback(e.target, e.target.value))
        return element;
      }`,
    },
    $set_attribute: {
      source: `$set_attribute = (element, attribute, value) => {
        element.setAttribute(attribute, value)
        return element
      }`,
    },
    $append_to: {
      source: `$append_to = (child, parent) => { parent.appendChild(child); return child }`,
    },
    $append: {
      source: `$append = (parent, child) => { parent.appendChild(child); return parent }`,
    },
    $remove_from: {
      source: `$remove_from = (child, parent) => { parent.removeChild(child); return child }`,
    },
    $remove: {
      source: `$remove = (parent, child) => { parent.removeChild(child); return parent }`,
    },
  },
  env: {
    [':body']: () => {
      const mock = { style: {} }
      mock.appendChild = (child) => (child.parent = mock)
      mock.removeChild = (child) => (child.parent = null)
      return mock
    },
    [':document']: () => {
      const mock = { body: { style: {} } }
      mock.body.appendChild = (child) => (child.parent = mock)
      mock.body.removeChild = (child) => (child.parent = null)
      return mock
    },
    [':get-attribute']: (args, env) => {
      if (args.length !== 1)
        throw new RangeError('Invalid number of arguments for (:get-attribute)')
      return evaluate(args[0], env).getAttribute(evaluate(args[1], env))
    },
    [':set-attribute']: (args, env) => {
      if (args.length !== 3)
        throw new RangeError('Invalid number of arguments for (:set-attribute)')
      const element = evaluate(args[0], env)
      element.setAttribute(evaluate(args[1], env), evaluate(args[2], env))
      return element
    },
    [':parent']: (args, env) => {
      if (args.length !== 1)
        throw new RangeError('Invalid number of arguments for (:parent)')
      return evaluate(args[0], env).parentNode
    },
    [':get-style']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:get-style)')
      const element = evaluate(args[0], env)
      const prop = evaluate(args[1], env)
      return element.style[prop]
    },
    [':set-style']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:set-style)')
      const element = evaluate(args[0], env)
      const styles = evaluate(args[1], env)
      for (const [prop, style] of styles) {
        element.style[prop] = style
      }
      return element
    },
    [':element']: (args, env) => {
      if (args.length !== 1)
        throw new RangeError('Invalid number of arguments for (:element)')
      const type = evaluate(args[0], env)
      if (typeof type !== 'string')
        throw new TypeError('First argument of (:element) is not a string')
      const mock = { value: '', textContent: '', style: {} }
      mock.appendChild = (child) => (child.parent = mock)
      mock.removeChild = (child) => (child.parent = null)
      mock.setAttribute = (attribute, value) => (mock[attribute] = value)
      mock.getContext = () => mock
      return mock
      // return document.createElement(type)
    },
    [':get-value']: (args, env) => {
      if (args.length !== 1)
        throw new RangeError('Invalid number of arguments for (:get-value)')
      const element = evaluate(args[0], env)
      return element.value
    },
    [':set-value']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:set-value)')
      const element = evaluate(args[0], env)
      const value = evaluate(args[1], env)
      element.value = value
      return element
    },
    [':get-text-content']: (args, env) => {
      if (args.length !== 1)
        throw new RangeError(
          'Invalid number of arguments for (:get-text-content)'
        )
      const element = evaluate(args[0], env)
      return element.textContent
    },
    [':set-text-content']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError(
          'Invalid number of arguments for (:set-text-content)'
        )
      const element = evaluate(args[0], env)
      const content = evaluate(args[1], env)
      if (typeof content !== 'string')
        throw new TypeError(
          'Second argument of (:set-text-content) is not a string'
        )
      element.textContent = content
      return element
    },
    [':on-click']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:on-click)')
      const element = evaluate(args[0], env)
      const callback = evaluate(args[1], env)
      if (typeof callback !== 'function')
        throw new TypeError('Second argument of (:on-click) is not a function')
      // element.addEventListener('click', callback)
      return element
    },
    [':on-key-pressed']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError(
          'Invalid number of arguments for (:on-key-pressed)'
        )
      const element = evaluate(args[0], env)
      const callback = evaluate(args[1], env)
      if (typeof callback !== 'function')
        throw new TypeError(
          'Second argument of (:on-key-pressed) is not a function'
        )
      // element.addEventListener('keypress', callback)
      return element
    },
    [':on-change']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:on-change)')
      const element = evaluate(args[0], env)
      const callback = evaluate(args[1], env)
      if (typeof callback !== 'function')
        throw new TypeError('Second argument of (:on-change) is not a function')
      // element.addEventListener('change', callback)
      return element
    },
    [':append-to']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:append-to)')
      const child = evaluate(args[0], env)
      const parent = evaluate(args[1], env)
      parent.appendChild(child)
      return child
    },
    [':append']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:append)')
      const child = evaluate(args[0], env)
      const parent = evaluate(args[1], env)
      parent.appendChild(child)
      return parent
    },
    [':remove-from']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:remove-from)')
      const child = evaluate(args[0], env)
      const parent = evaluate(args[1], env)
      parent.removeChild(child)
      return child
    },
    [':remove']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:remove)')
      const child = evaluate(args[0], env)
      const parent = evaluate(args[1], env)
      parent.removeChild(child)
      return parent
    },
  },
}

export const canvasExtension = {
  Extensions: {
    ':get-context': (...args) => `$get_context(${args.join(',')});`,
    ':rect': (...args) => `$rect(${args.join(',')});`,
    ':fill-rect': (...args) => `$fill_rect(${args.join(',')});`,
    ':fill-style': (...args) => `$fill_style(${args.join(',')});`,
    ':stroke': (...args) => `$stroke(${args.join(',')});`,
    ':fill': (...args) => `$fill(${args.join(',')});`,
    ':begin-path': (...args) => `$begin_path(${args.join(',')});`,
    ':save': (...args) => `$save(${args.join(',')});`,
    ':restore': (...args) => `$restore(${args.join(',')});`,
    ':stroke-style': (...args) => `$stroke_style(${args.join(',')});`,
    ':line-to': (...args) => `$line_to(${args.join(',')});`,
    ':move-to': (...args) => `$move_to(${args.join(',')});`,
    ':scale': (...args) => `$scale(${args.join(',')});`,
    ':rotate': (...args) => `$rotate(${args.join(',')});`,
    ':translate': (...args) => `$translate(${args.join(',')});`,
    ':line-width': (...args) => `$line_width(${args.join(',')});`,
  },
  Tops: [],
  Helpers: {
    $get_context: {
      source: `$get_context=(canvas,context)=>canvas.getContext(context)`,
    },
    $rect: {
      source: `$fill_rect=(ctx,x,y,w,h)=>{ctx.rect(x,y,w,h);return ctx}`,
    },
    $fill_rect: {
      source: `$fill_rect=(ctx,x,y,w,h)=>{ctx.fillRect(x,y,w,h);return ctx}`,
    },
    $fill_style: {
      source: `$fill_style=(ctx,color)=>{ctx.fillStyle=color;return ctx} `,
    },
    $begin_path: {
      source: `$begin_path=(ctx)=>{ctx.beginPath();return ctx}`,
    },
    $fill: {
      source: `$stroke=(ctx)=>{ctx.fill();return ctx}`,
    },
    $stroke: {
      source: `$stroke=(ctx)=>{ctx.stroke();return ctx}`,
    },
    $save: {
      source: `$stroke=(ctx)=>{ctx.save();return ctx}`,
    },
    $restore: {
      source: `$stroke=(ctx)=>{ctx.restore();return ctx}`,
    },
    $stroke_style: {
      source: `$stroke_style=(ctx,color)=>{ctx.strokeStyle=color;return ctx} `,
    },
    $line_width: {
      source: `$line_width=(ctx,w)=>{ctx.lineWidth=w;return ctx} `,
    },
    $line_to: {
      source: `$line_to=(ctx,x,y)=>{ctx.lineTo(x,y);return ctx}`,
    },
    $move_to: {
      source: `$move_to=(ctx,x,y)=>{ctx.moveTo(x,y);return ctx}`,
    },
    $scale: {
      source: `$scale=(ctx,x,y)=>{ctx.scale(x,y);return ctx}`,
    },
    $rotate: {
      source: `$rotate=(ctx,a)=>{ctx.rotate(a);return ctx}`,
    },
    $translate: {
      source: `$translate=(ctx,x,y)=>{ctx.translate(x,y);return ctx}`,
    },
  },
  env: {
    [':get-context']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:get-context)')
      return evaluate(args[0], env).getContext(evaluate(args[1], env))
    },
    [':rect']: (args, env) => {
      if (args.length !== 5)
        throw new RangeError('Invalid number of arguments for (:rect)')
      const ctx = evaluate(args[0], env)
      ctx.fillRect(
        evaluate(args[1], env),
        evaluate(args[2], env),
        evaluate(args[3], env),
        evaluate(args[4], env)
      )
      return ctx
    },
    [':fill-rect']: (args, env) => {
      if (args.length !== 5)
        throw new RangeError('Invalid number of arguments for (:fill-rect)')
      const ctx = evaluate(args[0], env)
      ctx.fillRect(
        evaluate(args[1], env),
        evaluate(args[2], env),
        evaluate(args[3], env),
        evaluate(args[4], env)
      )
      return ctx
    },
    [':begin-path']: (args, env) => {
      if (args.length)
        throw new RangeError('Invalid number of arguments for (:begin-path)')
      const ctx = evaluate(args[0], env)
      ctx.beginPath()
      return ctx
    },
    [':fill-style']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:fill-style)')
      const ctx = evaluate(args[0], env)
      ctx.fillStyle = evaluate(args[1], env)
      return ctx
    },
    [':stroke-style']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:stroke-style)')
      const ctx = evaluate(args[0], env)
      ctx.strokeStyle = evaluate(args[1], env)
      return ctx
    },
    [':line-width']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:line-width)')
      const ctx = evaluate(args[0], env)
      ctx.lineWidth = evaluate(args[1], env)
      return ctx
    },
    [':fill']: (args, env) => {
      if (args.length)
        throw new RangeError('Invalid number of arguments for (:fill)')
      const ctx = evaluate(args[0], env)
      ctx.fill()
      return ctx
    },
    [':stroke']: (args, env) => {
      if (args.length)
        throw new RangeError('Invalid number of arguments for (:stroke)')
      const ctx = evaluate(args[0], env)
      ctx.stroke()
      return ctx
    },
    [':save']: (args, env) => {
      if (args.length)
        throw new RangeError('Invalid number of arguments for (:save)')
      const ctx = evaluate(args[0], env)
      ctx.save()
      return ctx
    },
    [':restore']: (args, env) => {
      if (args.length)
        throw new RangeError('Invalid number of arguments for (:restore)')
      const ctx = evaluate(args[0], env)
      ctx.restore()
      return ctx
    },
    [':move-to']: (args, env) => {
      if (args.length !== 3)
        throw new RangeError('Invalid number of arguments for (:move-to)')
      const ctx = evaluate(args[0], env)
      ctx.moveTo(evaluate(args[1], env), evaluate(args[2], env))
      return ctx
    },
    [':line-to']: (args, env) => {
      if (args.length !== 3)
        throw new RangeError('Invalid number of arguments for (:line-to)')
      const ctx = evaluate(args[0], env)
      ctx.lineTo(evaluate(args[1], env), evaluate(args[2], env))
      return ctx
    },
    [':scale']: (args, env) => {
      if (args.length !== 3)
        throw new RangeError('Invalid number of arguments for (:scale)')
      const ctx = evaluate(args[0], env)
      ctx.scale(evaluate(args[1], env), evaluate(args[2], env))
      return ctx
    },
    [':translate']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:translate)')
      const ctx = evaluate(args[0], env)
      ctx.translate(evaluate(args[1], env), evaluate(args[2], env))
      return ctx
    },
    [':rotate']: (args, env) => {
      if (args.length !== 2)
        throw new RangeError('Invalid number of arguments for (:rotate)')
      const ctx = evaluate(args[0], env)
      ctx.scale(evaluate(args[1], env))
      return ctx
    },
  },
}
