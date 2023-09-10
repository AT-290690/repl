export const mediumPassRegex = new RegExp(
  '((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,}))'
)
export const validPassword = (password) => mediumPassRegex.test(password)
export const validUsername = (username) =>
  username && typeof username === 'string' && username.trim().length >= 3
