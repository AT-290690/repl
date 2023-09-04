import { readFile } from 'fs/promises'
import { brotliCompress } from 'zlib'
import path from 'path'
import { cookieJar, cookieRecepie } from './cookies.js'
export const db = {
  tables: {
    scripts: { findOne: async () => {}, findMany: async () => {} },
    portals: { findOne: async () => {}, insertOne: async () => {} },
  },
}
const root = './'
const compress = (data) =>
  new Promise((resolve, reject) =>
    brotliCompress(data, (error, buffer) =>
      error ? reject(error) : resolve(buffer)
    )
  )

const types = {
  md: 'application/text',
  ttf: 'application/x-font-ttf',
  otf: 'application/x-font-otf',
  wasm: 'application/wasm',
  html: 'text/html',
  css: 'text/css',
  less: 'text/css',
  js: 'application/javascript',
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  json: 'application/json',
  text: 'application/text',
  txt: 'application/text',
  xml: 'application/xml',
  bit: 'application/txt',
}

const getReqData = (req) =>
  new Promise((resolve, reject) => {
    try {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        resolve(body)
      })
    } catch (error) {
      reject(error)
    }
  })

const router = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {},
}
// const sanitizePath = path => path.replaceAll('../', '');
router['POST /login'] = async (req, res) => {
  const { portal, password } = JSON.parse(await getReqData(req))
  const account = await db.tables.portals.findOne({ portal, password })
  if (account) {
    const maxAge = 60 * 60 * 4
    const cookie = {
      id: portal,
      value: password,
      maxAge,
    }
    cookieJar.set(portal, cookie)
    res.writeHead(200, {
      'Content-Type': 'application/text',
    })
    res.end(portal)
  } else {
    res.writeHead(404, {
      'Content-Type': 'application/text',
    })
    res.end(`Account not found`)
  }
}
router['POST /register'] = async (req, res) => {
  const creds = cookieRecepie()
  const maxAge = 60 * 60 * 4
  const cookie = {
    id: creds.id,
    value: creds.value,
    maxAge,
  }
  cookieJar.set(creds.id, cookie)
  res.writeHead(200, {
    'Content-Type': 'application/text',
    'Set-Cookie': `_portal=${creds.id}.${creds.value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict; Secure`,
  })
  await db.tables.portals.insertOne({ portal: creds.id, password: creds.value })
  res.end(`${creds.id}.${creds.value}`)
}
router['GET /portal'] = async (_, res) => {
  const creds = cookieRecepie()
  const maxAge = 60 * 60 * 4
  const cookie = {
    id: creds.id,
    value: creds.value,
    maxAge,
  }
  cookieJar.set(creds.id, cookie)
  res.writeHead(200, {
    'Content-Type': 'application/text',
    'Set-Cookie': `_portal=${creds.id}.${creds.value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict; Secure`,
  })
  res.end(creds.value)
}
router['GET /ls'] = async (
  req,
  res,
  { query: { skip, limit, title, portal }, cookie }
) => {
  // if (!cookieJar.isCookieVerified(cookie, query.dir)) {
  //   res.writeHead(403, { 'Content-Type': 'text/html' });
  //   res.end('403: Unauthorized!');
  //   return;
  // }
  const scripts = await db.tables.scripts.findMany(
    { title: { $regex: title } },
    {
      skip: Number(skip),
      limit: Number(limit),
    }
  )
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(scripts))
}
router['GET /script'] = async (req, res, { query }) => {
  // if (!cookieJar.isCookieVerified(cookie, query.dir)) {
  //   res.writeHead(403, { 'Content-Type': 'text/html' });
  //   res.end('403: Unauthorized!');
  //   return;
  // }
  const result = await db.tables.scripts.findOne(query)
  if (result == null) {
    res.writeHead(404, { 'Content-Type': 'application/text' })
    res.end('')
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/text' })
  res.end(result.script)
}
router['POST /save'] = async (req, res, { cookie }) => {
  // if (!cookieJar.isCookieVerified(cookie, query.portal)) {
  //   res.writeHead(403, { 'Content-Type': 'text/html' })
  //   res.end('403: Unauthorized!')
  //   return
  // }
  const [portal] = cookieJar.components(cookie)
  if (cookieJar.has(portal)) {
    const { title, script } = JSON.parse(await getReqData(req))
    await db.tables.scripts.findOneAndUpdate({
      title,
      script,
      portal,
    })
    res.writeHead(200, { 'Content-Type': 'application/text' })
    res.end()
  }
}

router['GET *'] = async (req, res, { pathname }) => {
  const extension = path.extname(pathname).slice(1)
  const type = extension ? types[extension] : types.html
  const supportedExtension = Boolean(type)

  if (!supportedExtension) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('405: Unsupported file format')
    return
  }

  let fileName = pathname
  if (req.url === '/') {
    fileName = 'index.html'
  }
  const filePath = path.join(root, fileName)
  try {
    res.writeHead(200, { 'Content-Type': type, 'Content-Encoding': 'br' })
    res.end(await compress(await readFile(filePath)))
  } catch (err) {
    res.writeHead(404, {
      'Content-Type': 'text/html',
      'Content-Encoding': 'br',
    })
    res.end(
      await compress(await readFile(path.join(root, '404.html'), 'utf-8'))
    )
  }
}

const match = (key, req, res, params) => {
  const route = router[key]
  route(req, res, params)
  return true
}
export { match, router }