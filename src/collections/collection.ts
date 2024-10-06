import { Document } from '../interface/document.interface'
import QueryParser from '../query/queryParser'
import UpdateParser from '../query/updateParser'
import IndexManager from '../index/indexManager'
import Aggregation from '../aggregation/aggregation'
import IdGenerator from '../utils/idGenerator'

interface FindOptions {
   limit?: number
   skip?: number
   sort?: { [key: string]: 1 | -1 }
}

class Collection {
   private name: string
   private documents: Document[] = []
   private indexManager: IndexManager

   constructor(name: string) {
      this.name = name
      this.indexManager = new IndexManager()
   }

   insert(doc: Document): Document {
      if (!doc) {
         throw new Error(`Document must be provided.`)
      }

      const document = doc._id ? doc : { _id: IdGenerator.generateId(), ...doc }

      if (
         this.documents.some((existingDoc) => existingDoc._id === document._id)
      ) {
         throw new Error(`Duplicate _id '${document._id}' found.`)
      }

      this.documents.push(document)
      this.indexManager.updateIndexesOnInsert(document)
      return document
   }

   find(query: Document = {}, options: FindOptions = {}): Document[] {
      const indexedResults = this.indexManager.search(query)
      let results: Document[]
      if (indexedResults) {
         results = indexedResults.filter((doc) => QueryParser.match(doc, query))
      } else {
         results = this.documents.filter((doc) => QueryParser.match(doc, query))
      }
      if (options.sort) {
         results = this.applySort(results, options.sort)
      }
      if (options.skip) {
         results = results.slice(options.skip)
      }
      if (options.limit !== undefined) {
         results = results.slice(0, options.limit)
      }
      return results
   }

   findOne(query: Document = {}, options: FindOptions = {}): Document | null {
      const results = this.find(query, { ...options, limit: 1 })
      return results[0] || null
   }

   update(query: Document, update: Document): number {
      let count = 0
      this.documents = this.documents.map((doc) => {
         if (QueryParser.match(doc, query)) {
            const updatedDoc = UpdateParser.applyUpdate(doc, update)
            this.indexManager.updateIndexesOnUpdate(doc, updatedDoc)
            count++
            return updatedDoc
         }
         return doc
      })
      return count
   }

   updateOne(query: Document, update: Document): boolean {
      for (let i = 0; i < this.documents.length; i++) {
         const doc = this.documents[i]
         if (QueryParser.match(doc, query)) {
            const updatedDoc = UpdateParser.applyUpdate(doc, update)
            this.indexManager.updateIndexesOnUpdate(doc, updatedDoc)
            this.documents[i] = updatedDoc
            return true
         }
      }
      return false
   }

   delete(query: Document): number {
      let count = 0
      this.documents = this.documents.filter((doc) => {
         const shouldDelete = QueryParser.match(doc, query)
         if (shouldDelete) {
            this.indexManager.updateIndexesOnDelete(doc)
            count++
         }
         return !shouldDelete
      })
      return count
   }

   deleteOne(query: Document): boolean {
      for (let i = 0; i < this.documents.length; i++) {
         const doc = this.documents[i]
         if (QueryParser.match(doc, query)) {
            this.indexManager.updateIndexesOnDelete(doc)
            this.documents.splice(i, 1)
            return true
         }
      }
      return false
   }

   aggregate(pipeline: any[]): Document[] {
      return Aggregation.executePipeline(this.documents, pipeline)
   }

   createIndex(field: string): void {
      this.indexManager.createIndex(field, this.documents)
   }

   populate(
      docs: Document[],
      field: string,
      collection: Collection
   ): Document[] {
      return docs.map((doc) => {
         const refId = doc[field]
         if (refId) {
            const refDoc = collection.findOne({ _id: refId })
            return { ...doc, [field]: refDoc }
         }
         return doc
      })
   }

   private applySort(
      documents: Document[],
      sortSpec: { [key: string]: 1 | -1 }
   ): Document[] {
      const fields = Object.keys(sortSpec)

      return documents.sort((a, b) => {
         for (let field of fields) {
            const order = sortSpec[field]
            const aValue = this.getNestedField(a, field)
            const bValue = this.getNestedField(b, field)

            if (aValue === undefined && bValue !== undefined) {
               return 1 * order
            } else if (aValue !== undefined && bValue === undefined) {
               return -1 * order
            } else if (aValue === undefined && bValue === undefined) {
               continue
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
               const comparison = aValue.localeCompare(bValue)
               if (comparison !== 0) {
                  return comparison * order
               }
            } else if (aValue < bValue) {
               return -1 * order
            } else if (aValue > bValue) {
               return 1 * order
            }
         }
         return 0
      })
   }

   private getNestedField(doc: Document, path: string): any {
      return path
         .split('.')
         .reduce((acc, part) => (acc ? acc[part] : undefined), doc)
   }
}

export default Collection
