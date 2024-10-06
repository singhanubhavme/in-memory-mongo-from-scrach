import { Database, Collection } from '../src'

describe('Indexing Functionality', () => {
   let db: Database
   let users: Collection

   beforeEach(() => {
      db = new Database()
      db.createCollection('users')
      users = db.getCollection('users')

      // Insert users
      users.insert({ name: 'Alice', age: 30 })
      users.insert({ name: 'Bob', age: 25 })
      users.insert({ name: 'Charlie', age: 35 })
      users.insert({ name: 'David', age: 28 })
      users.insert({ name: 'Eve', age: 22 })
   })

   test('should create an index on a field', () => {
      users.createIndex('name')
      // Since indexing is internal, we can't directly test it,
      // but we can verify that queries using indexed fields return correct results
      const found = users.find({ name: 'Charlie' })
      expect(found.length).toBe(1)
      expect(found[0].name).toBe('Charlie')
   })

   test('should utilize index when available for querying', () => {
      // Spy on the documents array to ensure it's not iterated
      // However, since implementation doesn't expose index usage,
      // we'll verify correctness rather than performance.

      users.createIndex('age')
      const found = users.find({ age: 28 })
      expect(found.length).toBe(1)
      expect(found[0].name).toBe('David')
   })

   test('should update index on document insertion', () => {
      users.createIndex('name')
      const newUser = users.insert({ name: 'Frank', age: 40 })

      const found = users.find({ name: 'Frank' })
      expect(found.length).toBe(1)
      expect(found[0]).toEqual(newUser)
   })

   test('should update index on document update', () => {
      users.createIndex('name')
      const bob = users.findOne({ name: 'Bob' })
      expect(bob).not.toBeNull()

      // Update Bob's name to 'Bobby' using $set
      const updated = users.updateOne(
         { name: 'Bob' },
         { $set: { name: 'Bobby' } }
      )
      expect(updated).toBe(true)

      const oldBob = users.find({ name: 'Bob' })
      expect(oldBob.length).toBe(0)

      const newBobby = users.find({ name: 'Bobby' })
      expect(newBobby.length).toBe(1)
      expect(newBobby[0].age).toBe(25)
   })

   test('should update index on document deletion', () => {
      users.createIndex('name')
      const eve = users.findOne({ name: 'Eve' })
      expect(eve).not.toBeNull()

      // Delete Eve
      const deleted = users.deleteOne({ name: 'Eve' })
      expect(deleted).toBe(true)

      const found = users.find({ name: 'Eve' })
      expect(found.length).toBe(0)
   })
})
