import lisper from 'node-lisper'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readFileSync, writeFileSync } from 'fs'
import { evaluate } from 'node-lisper/src/interpreter.js'
const { parse, run, std } = lisper
const PORT = process.env.PORT ?? 8182
const app = express()
const server = http.createServer(app)
const io = new Server(server)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
app.use('/', express.static(join(__dirname, 'public')))
io.on('connection', (socket) => {
  mkdir(`${__dirname}/public/portals/${socket.id}`, (err) => err)
  socket.on('eval', (input) => {
    let env = {
      open: (args, env) => {
        if (!args.length)
          throw new RangeError('Invalid number of arguments for (open)')
        const path = evaluate(args[0], env)
        if (typeof path !== 'string')
          throw new TypeError('First argument of (open) is not a string path')
        return readFileSync(
          `${__dirname}/public/portals/${socket.id}/${path}`,
          'utf-8'
        )
      },
      write: (args, env) => {
        if (!args.length)
          throw new RangeError('Invalid number of arguments for (write)')
        const path = evaluate(args[0], env)
        if (typeof path !== 'string')
          throw new TypeError('First argument of (write) is not a string path')
        const data = evaluate(args[1], env)
        if (typeof data !== 'string')
          throw new TypeError('Second argument of (write) is not a string data')
        writeFileSync(
          `${__dirname}/public/portals/${socket.id}/${path}`,
          data,
          'utf-8'
        )
        return data
      },
      ['user-id']: () => socket.id,
      ['share-file']: (args, env) => {
        if (!args.length)
          throw new RangeError('Invalid number of arguments for (share-file)')
        const path = evaluate(args[0], env)
        if (typeof path !== 'string')
          throw new TypeError(
            'First argument of (share-file) is not a string file name'
          )
        return `portals/${socket.id}/${path}`
      },
    }
    try {
      let out = `${std}\n(block ${input})`
      const result = run(parse(out), env)
      if (typeof result === 'function') {
      } else if (Array.isArray(result)) {
        socket.emit(
          'eval',
          JSON.stringify(result)
            .replace(new RegExp(/\[/g), '(')
            .replace(new RegExp(/\]/g), ')')
            .replace(new RegExp(/\,/g), ' ')
        )
      } else if (typeof result === 'string') {
        socket.emit('eval', `"${result}"`)
      } else if (result == undefined) {
      } else {
        socket.emit('eval', JSON.stringify(result))
      }
    } catch (err) {
      socket.emit('eval', err.message)
    }
  })
  socket.on('disconnect', () => {})
})
server.listen(PORT, () => console.log(`listening on *:${PORT}`))
