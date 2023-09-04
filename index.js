import http from 'http'
import url from 'url'
import { parseCookies } from './utils/cookies.js'
import { router, match, db } from './utils/routes.js'
import { init } from './utils/model.js'
const PORT = process.env.PORT ?? 8182
const server = http.createServer(async (req, res) => {
  const URL = url.parse(req.url, true)
  const { query, pathname } = URL
  const key = `${req.method} ${pathname}`
  if (key in router) {
    const { _portal } = parseCookies(req)
    match(key, req, res, {
      query,
      pathname,
      cookie: _portal,
    })
  } else match('GET *', req, res, { pathname })
})
server.listen(PORT, async () => {
  db.tables = await init()
  console.log(`server started on port: ${PORT}`)
})
