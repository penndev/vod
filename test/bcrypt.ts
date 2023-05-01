import Bcrypt from 'bcrypt'

const saleRound = await Bcrypt.genSalt(10)
const hash = await Bcrypt.hash('123456', saleRound)
const result1 = await Bcrypt.compare('123456', hash)
const result2 = await Bcrypt.compare('123456,', hash)
console.log(hash, result1, result2)

const arr = new Map()
arr.set('email', 'email@gmail.com')
console.log(arr)
