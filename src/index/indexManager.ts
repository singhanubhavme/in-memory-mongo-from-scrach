import { Document } from '../interface/document.interface'

class IndexManager {
   private indexes: { [field: string]: Map<any, Document[]> } = {}

   createIndex(field: string, documents: Document[]): void {
      if (!this.indexes[field]) {
         this.indexes[field] = new Map()
      }

      documents.forEach((doc) => {
         const fieldValue = doc[field]
         if (fieldValue !== undefined && fieldValue !== null) {
            if (!this.indexes[field].has(fieldValue)) {
               this.indexes[field].set(fieldValue, [])
            }
            this.indexes[field].get(fieldValue)?.push(doc)
         }
      })
   }

   search(query: Document): Document[] | null {
      const keys = Object.keys(query)
      for (const key of keys) {
         if (this.indexes[key]) {
            const value = query[key]
            return this.indexes[key].get(value) || []
         }
      }
      return null
   }

   updateIndexesOnInsert(document: Document): void {
      Object.keys(this.indexes).forEach((field) => {
         const fieldValue = document[field]
         if (fieldValue !== undefined && fieldValue !== null) {
            if (!this.indexes[field].has(fieldValue)) {
               this.indexes[field].set(fieldValue, [])
            }
            this.indexes[field].get(fieldValue)?.push(document)
         }
      })
   }

   updateIndexesOnUpdate(oldDoc: Document, newDoc: Document): void {
      Object.keys(this.indexes).forEach((field) => {
         const oldValue = oldDoc[field]
         const newValue = newDoc[field]

         if (
            oldValue !== undefined &&
            oldValue !== null &&
            this.indexes[field].has(oldValue)
         ) {
            const documents = this.indexes[field].get(oldValue)
            if (documents) {
               const index = documents.findIndex(
                  (doc) => doc._id === oldDoc._id
               )
               if (index !== -1) {
                  documents.splice(index, 1)
               }
               if (documents.length === 0) {
                  this.indexes[field].delete(oldValue)
               }
            }
         }

         if (newValue !== undefined && newValue !== null) {
            if (!this.indexes[field].has(newValue)) {
               this.indexes[field].set(newValue, [])
            }
            this.indexes[field].get(newValue)?.push(newDoc)
         }
      })
   }

   updateIndexesOnDelete(document: Document): void {
      Object.keys(this.indexes).forEach((field) => {
         const fieldValue = document[field]
         if (
            fieldValue !== undefined &&
            fieldValue !== null &&
            this.indexes[field].has(fieldValue)
         ) {
            const documents = this.indexes[field].get(fieldValue)
            if (documents) {
               const index = documents.findIndex(
                  (doc) => doc._id === document._id
               )
               if (index !== -1) {
                  documents.splice(index, 1)
               }
               if (documents.length === 0) {
                  this.indexes[field].delete(fieldValue)
               }
            }
         }
      })
   }
}

export default IndexManager
