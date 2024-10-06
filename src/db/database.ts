import Collection from '../collections/collection'

class Database {
   private collections: { [key: string]: Collection } = {}

   createCollection(name: string): void {
      if (!name || name.trim() === '') {
         throw new Error(`Collection name must be provided.`)
      }
      if (!this.collections[name]) {
         this.collections[name] = new Collection(name)
      } else {
         throw new Error(`Collection "${name}" already exists.`)
      }
   }

   getCollection(name: string): Collection {
      if (!name || name.trim() === '') {
         throw new Error(`Collection name must be provided.`)
      }
      const collection = this.collections[name]
      if (!collection) {
         throw new Error(`Collection "${name}" does not exist.`)
      }
      return collection
   }

   listCollections(): string[] {
      return Object.keys(this.collections)
   }

   deleteCollection(name: string): void {
      if (!name || name.trim() === '') {
         throw new Error(`Collection name must be provided.`)
      }
      if (!this.collections[name]) {
         throw new Error(`Collection "${name}" does not exist.`)
      }
      delete this.collections[name]
   }
}

export default Database
