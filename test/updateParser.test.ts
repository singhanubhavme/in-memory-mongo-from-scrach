import UpdateParser from '../src/query/updateParser'
import { Document } from '../src/interface/document.interface'

describe('UpdateParser Class', () => {
   test('should apply $set operator', () => {
      const doc: Document = { name: 'Alice', age: 25 }
      const update = { $set: { age: 26, active: true } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.age).toBe(26)
      expect(updatedDoc.active).toBe(true)
   })

   test('should apply $unset operator', () => {
      const doc: Document = { name: 'Bob', age: 30, active: true }
      const update = { $unset: { active: '' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc).not.toHaveProperty('active')
   })

   test('should apply $inc operator', () => {
      const doc: Document = { name: 'Charlie', age: 35 }
      const update = { $inc: { age: 5 } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.age).toBe(40)
   })

   test('should apply $push operator', () => {
      const doc: Document = { name: 'Alice', tags: ['user'] }
      const update = { $push: { tags: 'admin' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.tags).toEqual(['user', 'admin'])
   })

   test('should apply $pull operator', () => {
      const doc: Document = { name: 'Bob', tags: ['user', 'admin'] }
      const update = { $pull: { tags: 'admin' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.tags).toEqual(['user'])
   })

   test('should apply $addToSet operator', () => {
      const doc: Document = { name: 'Charlie', tags: ['user'] }
      const update = { $addToSet: { tags: 'user' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.tags).toEqual(['user']) // 'user' should not be added again
   })

   test('should replace the entire document when no update operators are used', () => {
      const doc: Document = { _id: '1', name: 'Alice', age: 25 }
      const update = { name: 'Bob', age: 30 }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc._id).toBe('1')
      expect(updatedDoc.name).toBe('Bob')
      expect(updatedDoc.age).toBe(30)
   })

   test('should throw an error when using an unsupported operator', () => {
      const doc: Document = { name: 'Alice' }
      const update = { $unknown: { field: 'value' } }

      expect(() => UpdateParser.applyUpdate(doc, update)).toThrow(
         'Unsupported update operator: $unknown'
      )
   })

   test('should throw an error when $inc is applied to non-numeric field', () => {
      const doc: Document = { name: 'Bob', count: 'not a number' }
      const update = { $inc: { count: 1 } }

      expect(() => UpdateParser.applyUpdate(doc, update)).toThrow(
         'Cannot apply $inc to non-numeric field: count'
      )
   })

   test('should update nested fields', () => {
      const doc: Document = { name: 'Charlie', stats: { score: 80 } }
      const update = { $set: { 'stats.score': 85 } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.stats.score).toBe(85)
   })

   test('should unset nested fields', () => {
      const doc: Document = { name: 'Alice', stats: { score: 90 } }
      const update = { $unset: { 'stats.score': '' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.stats).not.toHaveProperty('score')
   })

   test('should apply $push to a non-existent array field', () => {
      const doc: Document = { name: 'Bob' }
      const update = { $push: { tags: 'user' } }

      const updatedDoc = UpdateParser.applyUpdate(doc, update)

      expect(updatedDoc.tags).toEqual(['user'])
   })

   test('should throw an error when applying $push to non-array field', () => {
      const doc: Document = { name: 'Charlie', tags: 'not an array' }
      const update = { $push: { tags: 'user' } }

      expect(() => UpdateParser.applyUpdate(doc, update)).toThrow(
         'Cannot apply $push to non-array field: tags'
      )
   })
})
