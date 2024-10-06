import { Database, Collection } from '../src'

describe('Aggregation Framework', () => {
   let db: Database
   let users: Collection
   let posts: Collection

   beforeEach(() => {
      // Initialize the database and create collections
      db = new Database()
      db.createCollection('users')
      db.createCollection('posts')

      users = db.getCollection('users')
      posts = db.getCollection('posts')

      // Insert sample users
      const user1 = users.insert({ name: 'Alice', age: 30 })
      const user2 = users.insert({ name: 'Bob', age: 25 })
      const user3 = users.insert({ name: 'Charlie', age: 35 })
      const user4 = users.insert({ name: 'David', age: 28 })

      // Insert sample posts
      posts.insert({
         title: 'Post 1',
         content: 'Content 1',
         author: user1._id,
         likes: 10,
      })
      posts.insert({
         title: 'Post 2',
         content: 'Content 2',
         author: user2._id,
         likes: 5,
      })
      posts.insert({
         title: 'Post 3',
         content: 'Content 3',
         author: user1._id,
         likes: 15,
      })
      posts.insert({
         title: 'Post 4',
         content: 'Content 4',
         author: user3._id,
         likes: 20,
      })
      posts.insert({
         title: 'Post 5',
         content: 'Content 5',
         author: user4._id,
         likes: 8,
      })
   })

   test('should perform $match aggregation stage', () => {
      const pipeline = [{ $match: { likes: { $gte: 10 } } }]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(3)
      expect(result).toEqual(
         expect.arrayContaining([
            expect.objectContaining({ title: 'Post 1', likes: 10 }),
            expect.objectContaining({ title: 'Post 3', likes: 15 }),
            expect.objectContaining({ title: 'Post 4', likes: 20 }),
         ])
      )
   })

   test('should perform $group aggregation stage with $sum and $avg', () => {
      const pipeline = [
         {
            $group: {
               _id: '$author',
               totalLikes: { $sum: '$likes' },
               averageLikes: { $avg: '$likes' },
            },
         },
         {
            $project: {
               author: '$_id',
               totalLikes: 1,
               averageLikes: 1,
               _id: 0,
            },
         },
      ]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(4)
      expect(result).toEqual(
         expect.arrayContaining([
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 25,
               averageLikes: 12.5,
            }), // Alice
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 5,
               averageLikes: 5,
            }), // Bob
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 20,
               averageLikes: 20,
            }), // Charlie
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 8,
               averageLikes: 8,
            }), // David
         ])
      )

      // Optional: Verify specific user aggregations
      const alice = users.findOne({ name: 'Alice' })
      const bob = users.findOne({ name: 'Bob' })
      const charlie = users.findOne({ name: 'Charlie' })
      const david = users.findOne({ name: 'David' })

      const aliceAgg = result.find((r) => r.author === alice?._id)
      expect(aliceAgg).toMatchObject({ totalLikes: 25, averageLikes: 12.5 })

      const bobAgg = result.find((r) => r.author === bob?._id)
      expect(bobAgg).toMatchObject({ totalLikes: 5, averageLikes: 5 })

      const charlieAgg = result.find((r) => r.author === charlie?._id)
      expect(charlieAgg).toMatchObject({ totalLikes: 20, averageLikes: 20 })

      const davidAgg = result.find((r) => r.author === david?._id)
      expect(davidAgg).toMatchObject({ totalLikes: 8, averageLikes: 8 })
   })

   test('should perform $project aggregation stage', () => {
      const pipeline = [
         {
            $project: {
               title: 1,
               likes: 1,
               _id: 0,
            },
         },
      ]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(5)
      result.forEach((post) => {
         expect(post).toHaveProperty('title')
         expect(post).toHaveProperty('likes')
         expect(post).not.toHaveProperty('_id')
         expect(Object.keys(post).length).toBe(2)
      })
   })

   test('should perform $sort aggregation stage', () => {
      const pipeline = [{ $sort: { likes: -1 } }]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(5)
      expect(result[0].likes).toBe(20) // Post 4
      expect(result[1].likes).toBe(15) // Post 3
      expect(result[2].likes).toBe(10) // Post 1
      expect(result[3].likes).toBe(8) // Post 5
      expect(result[4].likes).toBe(5) // Post 2
   })

   test('should perform $limit aggregation stage', () => {
      const pipeline = [{ $sort: { likes: -1 } }, { $limit: 3 }]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(3)
      expect(result[0].likes).toBe(20) // Post 4
      expect(result[1].likes).toBe(15) // Post 3
      expect(result[2].likes).toBe(10) // Post 1
   })

   test('should perform $skip aggregation stage', () => {
      const pipeline = [{ $sort: { likes: -1 } }, { $skip: 2 }]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(3)
      expect(result[0].likes).toBe(10) // Post 1
      expect(result[1].likes).toBe(8) // Post 5
      expect(result[2].likes).toBe(5) // Post 2
   })

   test('should perform a complex aggregation pipeline', () => {
      const pipeline = [
         { $match: { likes: { $gte: 10 } } },
         {
            $group: {
               _id: '$author',
               totalLikes: { $sum: '$likes' },
               maxLikes: { $max: '$likes' },
            },
         },
         { $sort: { totalLikes: -1 } },
         { $limit: 2 },
         { $project: { author: '$_id', totalLikes: 1, maxLikes: 1, _id: 0 } },
      ]

      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(2)

      // Assuming Alice has totalLikes: 25, Charlie: 20, Bob:5
      expect(result).toEqual(
         expect.arrayContaining([
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 25,
               maxLikes: 15,
            }), // Alice
            expect.objectContaining({
               author: expect.any(String),
               totalLikes: 20,
               maxLikes: 20,
            }), // Charlie
         ])
      )

      // Verify that Bob is not included due to totalLikes < 10 and limit =2
      const bob = users.findOne({ name: 'Bob' })
      const bobAgg = result.find((r) => r.author === bob?._id)
      expect(bobAgg).toBeUndefined()
   })

   test('should handle empty aggregation pipeline', () => {
      const pipeline: any[] = []
      const result = posts.aggregate(pipeline)

      expect(result.length).toBe(5)
      expect(result).toEqual(
         expect.arrayContaining([
            expect.objectContaining({ title: 'Post 1', likes: 10 }),
            expect.objectContaining({ title: 'Post 2', likes: 5 }),
            expect.objectContaining({ title: 'Post 3', likes: 15 }),
            expect.objectContaining({ title: 'Post 4', likes: 20 }),
            expect.objectContaining({ title: 'Post 5', likes: 8 }),
         ])
      )
   })

   test('should throw an error for unknown aggregation stage', () => {
      const pipeline = [{ $invalidStage: { field: 1 } }]

      expect(() => posts.aggregate(pipeline)).toThrow(
         'Unknown aggregation stage operator: $invalidStage'
      )
   })

   test('should handle $avg correctly', () => {
      const pipeline = [
         {
            $group: {
               _id: null,
               averageLikes: { $avg: '$likes' },
            },
         },
      ]

      const result = posts.aggregate(pipeline)
      expect(result.length).toBe(1)
      expect(result[0].averageLikes).toBeCloseTo((10 + 5 + 15 + 20 + 8) / 5)
   })

   test('should handle $min and $max correctly', () => {
      const pipeline = [
         {
            $group: {
               _id: null,
               minLikes: { $min: '$likes' },
               maxLikes: { $max: '$likes' },
            },
         },
      ]

      const result = posts.aggregate(pipeline)
      expect(result.length).toBe(1)
      expect(result[0].minLikes).toBe(5)
      expect(result[0].maxLikes).toBe(20)
   })

   test('should handle $group with multiple accumulators', () => {
      const pipeline = [
         {
            $group: {
               _id: '$author',
               totalLikes: { $sum: '$likes' },
               averageLikes: { $avg: '$likes' },
               maxLikes: { $max: '$likes' },
               minLikes: { $min: '$likes' },
            },
         },
      ]

      const result = posts.aggregate(pipeline)
      expect(result.length).toBe(4)

      const alice = users.findOne({ name: 'Alice' })
      const bob = users.findOne({ name: 'Bob' })
      const charlie = users.findOne({ name: 'Charlie' })
      const david = users.findOne({ name: 'David' })

      const aliceAgg = result.find((r) => r._id === alice?._id)
      expect(aliceAgg).toMatchObject({
         _id: alice?._id,
         totalLikes: 25, // 10 + 15
         averageLikes: 12.5, // (10 + 15) / 2
         maxLikes: 15,
         minLikes: 10,
      })

      const bobAgg = result.find((r) => r._id === bob?._id)
      expect(bobAgg).toMatchObject({
         _id: bob?._id,
         totalLikes: 5,
         averageLikes: 5,
         maxLikes: 5,
         minLikes: 5,
      })

      const charlieAgg = result.find((r) => r._id === charlie?._id)
      expect(charlieAgg).toMatchObject({
         _id: charlie?._id,
         totalLikes: 20,
         averageLikes: 20,
         maxLikes: 20,
         minLikes: 20,
      })

      const davidAgg = result.find((r) => r._id === david?._id)
      expect(davidAgg).toMatchObject({
         _id: david?._id,
         totalLikes: 8,
         averageLikes: 8,
         maxLikes: 8,
         minLikes: 8,
      })
   })
})
