import Collection from '../src/collections/collection'

describe('Collection Class', () => {
   let collection: Collection

   beforeEach(() => {
      collection = new Collection('testCollection')
   })

   test('should insert documents with auto-generated _id', () => {
      const doc = { name: 'Alice' }
      const insertedDoc = collection.insert(doc)

      expect(insertedDoc).toHaveProperty('_id')
      expect(insertedDoc.name).toBe('Alice')
      expect(collection.find().length).toBe(1)
   })

   test('should insert documents with custom _id', () => {
      const doc = { _id: 'customId', name: 'Bob' }
      const insertedDoc = collection.insert(doc)

      expect(insertedDoc._id).toBe('customId')
      expect(insertedDoc.name).toBe('Bob')
      expect(collection.find().length).toBe(1)
   })

   test('should not insert documents with duplicate _id', () => {
      const doc = { _id: 'duplicateId', name: 'Charlie' }
      collection.insert(doc)

      expect(() => collection.insert(doc)).toThrow(
         `Duplicate _id 'duplicateId' found.`
      )
   })

   test('should find documents matching a query', () => {
      collection.insert({ name: 'Alice', age: 25 })
      collection.insert({ name: 'Bob', age: 30 })
      collection.insert({ name: 'Charlie', age: 35 })

      const results = collection.find({ age: { $gt: 25 } })

      expect(results.length).toBe(2)
      expect(results.map((doc) => doc.name)).toEqual(['Bob', 'Charlie'])
   })

   test('should find one document matching a query', () => {
      collection.insert({ name: 'Alice' })
      collection.insert({ name: 'Bob' })

      const result = collection.findOne({ name: 'Bob' })

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Bob')
   })

   test('should update documents using $set operator', () => {
      collection.insert({ _id: '1', name: 'Alice', age: 25 })
      collection.insert({ _id: '2', name: 'Bob', age: 30 })

      const count = collection.update({}, { $set: { active: true } })

      expect(count).toBe(2)
      const results = collection.find({ active: true })
      expect(results.length).toBe(2)
   })

   test('should update one document using $inc operator', () => {
      collection.insert({ _id: '1', name: 'Alice', age: 25 })
      collection.insert({ _id: '2', name: 'Bob', age: 30 })

      const updated = collection.updateOne(
         { name: 'Alice' },
         { $inc: { age: 1 } }
      )

      expect(updated).toBe(true)
      const result = collection.findOne({ name: 'Alice' })
      expect(result!.age).toBe(26)
   })

   test('should delete documents matching a query', () => {
      collection.insert({ name: 'Alice' })
      collection.insert({ name: 'Bob' })
      collection.insert({ name: 'Charlie' })

      const count = collection.delete({ name: { $ne: 'Alice' } })

      expect(count).toBe(2)
      expect(collection.find().length).toBe(1)
      expect(collection.find()[0].name).toBe('Alice')
   })

   test('should delete one document matching a query', () => {
      collection.insert({ name: 'Alice' })
      collection.insert({ name: 'Bob' })

      const deleted = collection.deleteOne({})

      expect(deleted).toBe(true)
      expect(collection.find().length).toBe(1)
   })

   test('should perform aggregation with $match and $group', () => {
      collection.insert({ name: 'Alice', age: 25 })
      collection.insert({ name: 'Bob', age: 30 })
      collection.insert({ name: 'Charlie', age: 35 })

      const results = collection.aggregate([
         { $match: { age: { $gte: 30 } } },
         { $group: { _id: null, averageAge: { $avg: '$age' } } },
      ])

      expect(results.length).toBe(1)
      expect(results[0]).toEqual({ _id: null, averageAge: 32.5 })
   })

   test('should create an index and use it for querying', () => {
      collection.insert({ name: 'Alice', age: 25 })
      collection.insert({ name: 'Bob', age: 30 })
      collection.insert({ name: 'Charlie', age: 35 })

      collection.createIndex('age')

      const spy = jest.spyOn(collection['indexManager'], 'search')

      const results = collection.find({ age: 30 })

      expect(spy).toHaveBeenCalled()
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Bob')
   })

   test('should populate referenced documents', () => {
      const postsCollection = new Collection('posts')
      const usersCollection = new Collection('users')

      const user = usersCollection.insert({ name: 'Alice' })
      const post = postsCollection.insert({
         title: 'Post 1',
         authorId: user._id,
      })

      const posts = postsCollection.populate(
         [post],
         'authorId',
         usersCollection
      )

      expect(posts[0].authorId).toHaveProperty('name', 'Alice')
   })

   test('should sort documents based on fields', () => {
      collection.insert({ name: 'Charlie', age: 35 })
      collection.insert({ name: 'Alice', age: 25 })
      collection.insert({ name: 'Bob', age: 30 })

      const results = collection.find({}, { sort: { age: 1 } })

      expect(results.map((doc) => doc.name)).toEqual([
         'Alice',
         'Bob',
         'Charlie',
      ])
   })

   test('should handle nested fields in sorting', () => {
      collection.insert({ name: 'Charlie', stats: { score: 80 } })
      collection.insert({ name: 'Alice', stats: { score: 95 } })
      collection.insert({ name: 'Bob', stats: { score: 90 } })

      const results = collection.find({}, { sort: { 'stats.score': -1 } })

      expect(results.map((doc) => doc.name)).toEqual([
         'Alice',
         'Bob',
         'Charlie',
      ])
   })

   test('should update documents with nested fields', () => {
      collection.insert({ name: 'Alice', stats: { score: 80 } })

      collection.update({}, { $set: { 'stats.score': 85 } })

      const result = collection.findOne({ name: 'Alice' })
      expect(result!.stats.score).toBe(85)
   })

   test('should handle $unset operator', () => {
      collection.insert({ name: 'Bob', age: 30 })

      collection.update({}, { $unset: { age: '' } })

      const result = collection.findOne({ name: 'Bob' })
      expect(result).not.toHaveProperty('age')
   })

   test('should handle $push operator', () => {
      collection.insert({ name: 'Charlie', tags: ['user'] })

      collection.update({}, { $push: { tags: 'admin' } })

      const result = collection.findOne({ name: 'Charlie' })
      expect(result!.tags).toEqual(['user', 'admin'])
   })

   test('should handle $addToSet operator', () => {
      collection.insert({ name: 'Alice', tags: ['user'] })

      collection.update({}, { $addToSet: { tags: 'user' } })

      const result = collection.findOne({ name: 'Alice' })
      expect(result!.tags).toEqual(['user']) // 'user' should not be added again
   })

   test('should handle $pull operator', () => {
      collection.insert({ name: 'Bob', tags: ['user', 'admin'] })

      collection.update({}, { $pull: { tags: 'admin' } })

      const result = collection.findOne({ name: 'Bob' })
      expect(result!.tags).toEqual(['user'])
   })
})
