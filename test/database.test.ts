import { Database, Collection } from '../src'

describe('Database Class', () => {
   let db: Database

   beforeEach(() => {
      db = new Database()
   })

   test('should create a new collection', () => {
      db.createCollection('users')
      const collections = db.listCollections()
      expect(collections).toContain('users')
   })

   test('should not allow creating a collection with the same name', () => {
      db.createCollection('users')
      expect(() => db.createCollection('users')).toThrow(
         'Collection "users" already exists.'
      )
   })

   test('should retrieve an existing collection', () => {
      db.createCollection('posts')
      const posts = db.getCollection('posts')
      expect(posts).toBeInstanceOf(Collection)
   })

   test('should list all collections', () => {
      db.createCollection('users')
      db.createCollection('posts')
      const collections = db.listCollections()
      expect(collections).toEqual(['users', 'posts'])
   })

   test('should delete an existing collection', () => {
      db.createCollection('users')
      db.deleteCollection('users')
      const collections = db.listCollections()
      expect(collections).not.toContain('users')
   })

   test('should throw an error when deleting a non-existent collection', () => {
      expect(() => db.deleteCollection('nonexistent')).toThrow(
         'Collection "nonexistent" does not exist.'
      )
   })

   test('should throw an error when retrieving a non-existent collection', () => {
      expect(() => db.getCollection('nonexistent')).toThrow(
         'Collection "nonexistent" does not exist.'
      )
   })
})
