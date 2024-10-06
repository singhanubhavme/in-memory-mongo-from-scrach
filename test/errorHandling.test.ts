import { Database, Collection } from '../src'

describe('Error Handling', () => {
   let db: Database
   let users: Collection

   beforeEach(() => {
      db = new Database()
      db.createCollection('users')
      users = db.getCollection('users')
      users.insert({ name: 'Alice', age: 30 })
   })

   test('should throw an error when creating a collection without a name', () => {
      expect(() => db.createCollection('')).toThrow(
         'Collection name must be provided.'
      )
   })

   test('should throw an error when getting a collection without a name', () => {
      // TypeScript ensures that the parameter is provided, but test for empty string
      expect(() => db.getCollection('')).toThrow(
         'Collection name must be provided.'
      )
   })

   test('should throw an error when deleting a collection without a name', () => {
      expect(() => db.deleteCollection('')).toThrow(
         'Collection name must be provided.'
      )
   })

   test('should throw an error when inserting undefined document', () => {
      // Assuming insert expects a Document object
      // @ts-ignore
      expect(() => users.insert(undefined)).toThrow()
   })

   test('should throw an error for invalid query operators', () => {
      expect(() => users.find({ age: { $invalid: 30 } })).toThrow(
         'Unknown operator $invalid'
      )
   })

   test('should handle malformed aggregation pipelines', () => {
      const malformedPipeline = [{ $invalidStage: { field: 1 } }]

      expect(() => users.aggregate(malformedPipeline)).toThrow(
         'Unknown aggregation stage operator: $invalidStage'
      )
   })

   test('should throw an error when populating with non-existent collection', () => {
      db.createCollection('posts')
      const posts = db.getCollection('posts')

      const user = users.insert({ name: 'Alice', age: 30 })
      posts.insert({ title: 'Post 1', content: 'Content 1', author: user._id })

      expect(() =>
         posts.populate(posts.find(), 'author', db.getCollection('nonexistent'))
      ).toThrow('Collection "nonexistent" does not exist.')
   })
})
