import { Database, Collection } from '../src'

describe('Populate Functionality', () => {
   let db: Database
   let users: Collection
   let posts: Collection

   beforeEach(() => {
      db = new Database()
      db.createCollection('users')
      db.createCollection('posts')

      users = db.getCollection('users')
      posts = db.getCollection('posts')

      // Insert users
      const user1 = users.insert({ name: 'Alice', age: 30 })
      const user2 = users.insert({ name: 'Bob', age: 25 })

      // Insert posts
      posts.insert({ title: 'Post 1', content: 'Content 1', author: user1._id })
      posts.insert({ title: 'Post 2', content: 'Content 2', author: user2._id })
      posts.insert({ title: 'Post 3', content: 'Content 3', author: user1._id })
   })

   test('should populate author field with user documents', () => {
      const rawPosts = posts.find()
      const populatedPosts = posts.populate(rawPosts, 'author', users)

      expect(populatedPosts.length).toBe(3)
      populatedPosts.forEach((post) => {
         expect(post.author).toHaveProperty('name')
         expect(post.author).toHaveProperty('age')
         expect(post.author).toHaveProperty('_id')
      })

      const alicePost = populatedPosts.find((post) => post.title === 'Post 1')
      expect(alicePost?.author.name).toBe('Alice')

      const bobPost = populatedPosts.find((post) => post.title === 'Post 2')
      expect(bobPost?.author.name).toBe('Bob')
   })

   test('should handle populate with non-existent references gracefully', () => {
      // Insert a post with an invalid author reference
      const invalidPost = posts.insert({
         title: 'Post Invalid',
         content: 'No author',
         author: 'invalid_id',
      })

      const rawPosts = posts.find()
      const populatedPosts = posts.populate(rawPosts, 'author', users)

      const invalidPopulatedPost = populatedPosts.find(
         (post) => post.title === 'Post Invalid'
      )
      expect(invalidPopulatedPost?.author).toBeNull()
   })
})
