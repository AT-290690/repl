import lisper from 'node-lisper'
import { lispLandExtension } from '../lisp/extensions.js'
import dom from '../lisp/baked-dom.js'
const libraries = {
  ...lisper.libraries,
  dom,
}
export const build = (value) => {
  const tree = lisper.parse(value)
  if (Array.isArray(tree)) {
    const { top, program, deps } = lisper.js(
      tree,
      lispLandExtension.Extensions,
      lispLandExtension.Helpers,
      lispLandExtension.Tops
    )
    return `<body></body><script>${top}${lisper.treeShake(
      deps,
      JSON.parse(JSON.stringify(Object.values(libraries)))
    )}${program}</script>`
  }
}
