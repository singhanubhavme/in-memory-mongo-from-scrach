import Database from './'

const db = new Database()

db.createCollection('users')
db.createCollection('posts')

const users = db.getCollection('users')

const user1 = users.insert({ name: 'Alice', age: 30 })
const user2 = users.insert({ name: 'Bob', age: 25 })
users.updateOne({ name: 'Bob' }, { $set: { name: 'Bobby' } })

const posts = db.getCollection('posts')

const aggregatedUsers = users.aggregate([
   { $match: { age: { $gte: 25 } } },
   { $sort: { age: -1 } },
])

console.log({
   user1,
   user2,
   aggregatedUsers,
   posts,
})
