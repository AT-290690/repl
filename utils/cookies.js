import { randomUUID } from 'crypto'

const parseCookies = (req) => {
  const cookies = {}
  if ('cookie' in req.headers)
    req.headers.cookie.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      cookies[parts[0].trim()] = (parts[1] || '').trim()
    })
  return cookies
}
const cookieRecepie = (value) => ({
  id: randomUUID(),
  value: value ?? randomUUID(),
})
const INVALID_COOKIE = ['Invaid Cookie id', 'Invalid Cookie value']
const components = (cookie) => cookie?.split('.') ?? INVALID_COOKIE
// class CookieJar {
//   #cookies = new Map()
//   set(id, cookie) {
//     if (cookie.id) {
//       this.#cookies.set(id, cookie)
//       setTimeout(() => {
//         this.#cookies.delete(id)
//       }, this.#cookies.get(id).maxAge * 1000)
//     }
//   }
//   has(id) {
//     return this.#cookies.has(id)
//   }
//   get(id) {
//     return this.#cookies.get(id)
//   }
//   destroy(id) {
//     this.#cookies.delete(id)
//   }
//   keys() {
//     return this.#cookies.keys()
//   }
//   values() {
//     return [...this.#cookies.values()]
//   }
//   static IsCookieVerified(cookie, dir) {
//     if (!cookie) return false
//     const [id, value] = components(cookie)
//     const current = this.get(id)
//     return current && value === current.value && dir === current.id
//   }
// }
// const cookieJar = new CookieJar()
export { parseCookies, cookieRecepie, components }
