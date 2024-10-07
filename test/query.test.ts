import { QueryParser, Document } from '../src'

describe('QueryParser', () => {
   let doc1: Document
   let doc2: Document
   let doc3: Document
   let doc4: Document
   let doc5: Document
   let doc6: Document

   beforeEach(() => {
      // Sample Documents
      doc1 = {
         _id: '1',
         name: 'Alice',
         age: 30,
         active: true,
         tags: ['admin', 'user'],
         score: 85,
      }
      doc2 = {
         _id: '2',
         name: 'Bob',
         age: 25,
         active: false,
         tags: ['user'],
         score: 90,
      }
      doc3 = {
         _id: '3',
         name: 'Charlie',
         age: 35,
         active: true,
         tags: ['admin'],
         score: 75,
      }
      doc4 = {
         _id: '4',
         name: 'David',
         age: 28,
         active: false,
         tags: ['user', 'moderator'],
         score: 60,
      }
      doc5 = {
         _id: '5',
         name: 'Eve',
         age: 22,
         active: true,
         tags: [],
         score: 95,
      }
      doc6 = {
         _id: '6',
         name: null,
         age: null,
         active: null,
         tags: null,
         score: null,
      }
   })

   test('should match documents with $eq operator', () => {
      const query = { name: { $eq: 'Alice' } }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(false)
   })

   test('should match documents with $ne operator', () => {
      const query = { active: { $ne: true } }
      expect(QueryParser.match(doc1, query)).toBe(false)
      expect(QueryParser.match(doc2, query)).toBe(true)
   })

   test('should match documents with $gt operator', () => {
      const query = { age: { $gt: 30 } }
      expect(QueryParser.match(doc1, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(true)
      expect(QueryParser.match(doc4, query)).toBe(false)
   })

   test('should match documents with $gte operator', () => {
      const query = { age: { $gte: 30 } }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc3, query)).toBe(true)
      expect(QueryParser.match(doc4, query)).toBe(false)
   })

   test('should match documents with $lt operator', () => {
      const query = { score: { $lt: 80 } }
      expect(QueryParser.match(doc1, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(true)
      expect(QueryParser.match(doc4, query)).toBe(true)
   })

   test('should match documents with $lte operator', () => {
      const query = { score: { $lte: 85 } }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(true)
   })

   test('should match documents with $in operator', () => {
      const query = { name: { $in: ['Alice', 'Eve'] } }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(false)
      expect(QueryParser.match(doc5, query)).toBe(true)
   })

   test('should match documents with $nin operator', () => {
      const query = { age: { $nin: [25, 30] } }
      expect(QueryParser.match(doc1, query)).toBe(false)
      expect(QueryParser.match(doc2, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(true)
   })

   test('should match documents with $exists operator', () => {
      const query = { tags: { $exists: true } }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc5, query)).toBe(true)
      const query2 = { middleName: { $exists: true } }
      expect(QueryParser.match(doc1, query2)).toBe(false)
   })

   test('should match documents with $regex operator', () => {
      const query = { name: { $regex: /^A/ } } // Names starting with 'A'
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(false)
   })

   test('should match documents with $and logical operator', () => {
      const query = { $and: [{ age: { $gte: 25 } }, { active: true }] }
      expect(QueryParser.match(doc1, query)).toBe(true) // age:30, active:true
      expect(QueryParser.match(doc2, query)).toBe(false) // active:false
      expect(QueryParser.match(doc3, query)).toBe(true) // age:35, active:true
      expect(QueryParser.match(doc4, query)).toBe(false) // active:false
      expect(QueryParser.match(doc5, query)).toBe(false) // age:22, active:true -> age >=25? No, expect false
   })

   test('should match documents with $and logical operator correctly', () => {
      // Correct test: age >=25 AND active:true
      const query = { $and: [{ age: { $gte: 25 } }, { active: true }] }
      expect(QueryParser.match(doc1, query)).toBe(true) // age:30, active:true
      expect(QueryParser.match(doc2, query)).toBe(false) // active:false
      expect(QueryParser.match(doc3, query)).toBe(true) // age:35, active:true
      expect(QueryParser.match(doc4, query)).toBe(false) // active:false
      expect(QueryParser.match(doc5, query)).toBe(false) // age:22 <25
   })

   test('should match documents with $or logical operator', () => {
      const query = { $or: [{ age: { $lt: 25 } }, { active: false }] }
      expect(QueryParser.match(doc1, query)).toBe(false) // active:true, age:30
      expect(QueryParser.match(doc2, query)).toBe(true) // active:false
      expect(QueryParser.match(doc3, query)).toBe(false) // active:true, age:35
      expect(QueryParser.match(doc4, query)).toBe(true) // active:false
      expect(QueryParser.match(doc5, query)).toBe(true) // active:true, age:22 <25 but not active:false
   })

   test('should match documents with $nor logical operator', () => {
      const query = { $nor: [{ active: true }, { age: { $gt: 30 } }] }
      expect(QueryParser.match(doc1, query)).toBe(false) // active:true
      expect(QueryParser.match(doc2, query)).toBe(true) // age:25, active:false -> $nor: not (active:true or age>30) => active:false & age<=30 => should match
      expect(QueryParser.match(doc3, query)).toBe(false) // age:35
      expect(QueryParser.match(doc4, query)).toBe(true) // active:false, age:28
      expect(QueryParser.match(doc5, query)).toBe(false) // active:true
   })

   test('should handle nested logical operators', () => {
      const query = {
         $and: [
            { age: { $gte: 25 } },
            {
               $or: [{ active: false }, { name: { $regex: /^C/ } }],
            },
         ],
      }
      expect(QueryParser.match(doc1, query)).toBe(false) // active:true, name doesn't match
      expect(QueryParser.match(doc2, query)).toBe(true) // active:false, age:25
      expect(QueryParser.match(doc3, query)).toBe(true) // name starts with C, age:35
      expect(QueryParser.match(doc4, query)).toBe(true) // active:false, age:28
      expect(QueryParser.match(doc5, query)).toBe(false) // age:22 <25
   })

   test('should handle multiple field queries', () => {
      const query = { name: 'Alice', age: 30 }
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(false)
      expect(QueryParser.match(doc3, query)).toBe(false)
      expect(QueryParser.match(doc4, query)).toBe(false)
      expect(QueryParser.match(doc5, query)).toBe(false)
   })

   test('should handle empty query (match all)', () => {
      const query = {}
      expect(QueryParser.match(doc1, query)).toBe(true)
      expect(QueryParser.match(doc2, query)).toBe(true)
      expect(QueryParser.match(doc3, query)).toBe(true)
      expect(QueryParser.match(doc4, query)).toBe(true)
      expect(QueryParser.match(doc5, query)).toBe(true)
   })

   test('should handle null values in documents', () => {
      const query = { name: null, age: null }
      expect(QueryParser.match(doc6, query)).toBe(true)
      expect(QueryParser.match(doc1, query)).toBe(false)
   })

   test('should handle array fields with $in operator', () => {
      const docArray: Document = { _id: '7', tags: ['admin', 'user'] }
      const query = { tags: { $in: ['admin'] } }
      expect(QueryParser.match(docArray, query)).toBe(true)
      const query2 = { tags: { $in: ['moderator'] } }
      expect(QueryParser.match(docArray, query2)).toBe(false)
   })

   test('should handle $exists operator with nested fields', () => {
      const docNested: Document = {
         _id: '8',
         profile: { email: 'alice@example.com' },
      }
      const query = { 'profile.email': { $exists: true } }
      expect(QueryParser.match(docNested, query)).toBe(true)

      const query2 = { 'profile.phone': { $exists: true } }
      expect(QueryParser.match(docNested, query2)).toBe(false)
   })

   test('should throw an error for unknown operators', () => {
      const query = { age: { $unknown: 30 } }
      expect(() => QueryParser.match(doc1, query)).toThrow(
         'Unknown operator $unknown'
      )
   })

   test('should handle multiple operators on the same field', () => {
      const query = { age: { $gte: 25, $lte: 30 } }
      expect(QueryParser.match(doc1, query)).toBe(true) // age:30
      expect(QueryParser.match(doc2, query)).toBe(true) // age:25
      expect(QueryParser.match(doc3, query)).toBe(false) // age:35
      expect(QueryParser.match(doc4, query)).toBe(true) // age:28
      expect(QueryParser.match(doc5, query)).toBe(false) // age:22
   })

   test('should handle queries with multiple fields and operators', () => {
      const query = {
         name: { $regex: /^A/ },
         age: { $gte: 25 },
         active: true,
      }
      expect(QueryParser.match(doc1, query)).toBe(true) // Alice, age:30, active:true
      expect(QueryParser.match(doc2, query)).toBe(false) // Bob
      expect(QueryParser.match(doc3, query)).toBe(false) // Charlie
      expect(QueryParser.match(doc4, query)).toBe(false) // David
      expect(QueryParser.match(doc5, query)).toBe(false) // Eve
   })

   test('should handle queries with $in and other operators', () => {
      const query = {
         $and: [{ name: { $in: ['Alice', 'Bob'] } }, { age: { $lt: 30 } }],
      }
      expect(QueryParser.match(doc1, query)).toBe(false) // Alice, age:30
      expect(QueryParser.match(doc2, query)).toBe(true) // Bob, age:25
      expect(QueryParser.match(doc3, query)).toBe(false) // Charlie
      expect(QueryParser.match(doc4, query)).toBe(false) // David
      expect(QueryParser.match(doc5, query)).toBe(false) // Eve
   })
})
