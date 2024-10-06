import { Document } from '../interface/document.interface'

class UpdateParser {
   static applyUpdate(doc: Document, update: Document): Document {
      const updatedDoc = { ...doc }

      const updateOperators = Object.keys(update)

      if (updateOperators.some((key) => key.startsWith('$'))) {
         for (const operator of updateOperators) {
            const operation = update[operator]
            switch (operator) {
               case '$set':
                  this.applySet(updatedDoc, operation)
                  break
               case '$unset':
                  this.applyUnset(updatedDoc, operation)
                  break
               case '$inc':
                  this.applyInc(updatedDoc, operation)
                  break
               case '$push':
                  this.applyPush(updatedDoc, operation)
                  break
               case '$pull':
                  this.applyPull(updatedDoc, operation)
                  break
               case '$addToSet':
                  this.applyAddToSet(updatedDoc, operation)
                  break
               default:
                  throw new Error(`Unsupported update operator: ${operator}`)
            }
         }
      } else {
         const _id = doc._id
         Object.keys(updatedDoc).forEach((key) => {
            if (key !== '_id') {
               delete updatedDoc[key]
            }
         })
         Object.assign(updatedDoc, update)
         updatedDoc._id = _id
      }

      return updatedDoc
   }

   static applySet(doc: Document, operation: Document) {
      for (const key in operation) {
         this.setValue(doc, key, operation[key])
      }
   }

   static applyUnset(doc: Document, operation: Document) {
      for (const key in operation) {
         this.unsetValue(doc, key)
      }
   }

   static applyInc(doc: Document, operation: Document) {
      for (const key in operation) {
         const value = this.getValue(doc, key)
         if (typeof value !== 'number' && value !== undefined) {
            throw new Error(`Cannot apply $inc to non-numeric field: ${key}`)
         }
         const incValue = operation[key]
         if (typeof incValue !== 'number') {
            throw new Error(`$inc value must be a number: ${incValue}`)
         }
         const newValue = (value || 0) + incValue
         this.setValue(doc, key, newValue)
      }
   }

   static applyPush(doc: Document, operation: Document) {
      for (const key in operation) {
         const value = this.getValue(doc, key)
         const pushValue = operation[key]
         if (value === undefined) {
            this.setValue(doc, key, [pushValue])
         } else if (Array.isArray(value)) {
            value.push(pushValue)
         } else {
            throw new Error(`Cannot apply $push to non-array field: ${key}`)
         }
      }
   }

   static applyPull(doc: Document, operation: Document) {
      for (const key in operation) {
         const value = this.getValue(doc, key)
         const pullValue = operation[key]
         if (Array.isArray(value)) {
            this.setValue(
               doc,
               key,
               value.filter((item) => !this.matchValue(item, pullValue))
            )
         } else {
            throw new Error(`Cannot apply $pull to non-array field: ${key}`)
         }
      }
   }

   static applyAddToSet(doc: Document, operation: Document) {
      for (const key in operation) {
         const value = this.getValue(doc, key)
         const addValue = operation[key]
         if (value === undefined) {
            this.setValue(doc, key, [addValue])
         } else if (Array.isArray(value)) {
            if (!value.some((item) => this.deepEqual(item, addValue))) {
               value.push(addValue)
            }
         } else {
            throw new Error(`Cannot apply $addToSet to non-array field: ${key}`)
         }
      }
   }

   static getValue(doc: Document, path: string): any {
      const parts = path.split('.')
      let current = doc
      for (const part of parts) {
         if (current === undefined) {
            return undefined
         }
         current = current[part]
      }
      return current
   }

   static setValue(doc: Document, path: string, value: any): void {
      const parts = path.split('.')
      let current = doc
      for (let i = 0; i < parts.length - 1; i++) {
         const part = parts[i]
         if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {}
         }
         current = current[part]
      }
      current[parts[parts.length - 1]] = value
   }

   static unsetValue(doc: Document, path: string): void {
      const parts = path.split('.')
      let current = doc
      for (let i = 0; i < parts.length - 1; i++) {
         const part = parts[i]
         if (!current[part] || typeof current[part] !== 'object') {
            return
         }
         current = current[part]
      }
      delete current[parts[parts.length - 1]]
   }

   static matchValue(value: any, condition: any): boolean {
      if (
         condition &&
         typeof condition === 'object' &&
         !Array.isArray(condition)
      ) {
         if ('$eq' in condition) {
            return this.deepEqual(value, condition['$eq'])
         }
         return false
      } else {
         return this.deepEqual(value, condition)
      }
   }

   static deepEqual(a: any, b: any): boolean {
      return JSON.stringify(a) === JSON.stringify(b)
   }
}

export default UpdateParser
