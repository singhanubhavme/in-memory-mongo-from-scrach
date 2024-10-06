import operators from './queryOperators'
import { Document } from '../interface/document.interface'

const validOperators = ['$and', '$or', '$nor']

class QueryParser {
   static match(doc: Document, query: Document): boolean {
      for (let key in query) {
         if (validOperators.includes(key)) {
            if (!this.handleLogicalOperator(key, doc, query[key])) {
               return false
            }
         } else if (
            typeof query[key] === 'object' &&
            !Array.isArray(query[key])
         ) {
            const fieldValue = this.getNestedValue(doc, key)
            if (!this.handleFieldOperators(fieldValue, query[key])) {
               return false
            }
         } else {
            const fieldValue = this.getNestedValue(doc, key)
            if (fieldValue !== query[key]) {
               return false
            }
         }
      }
      return true
   }

   private static getNestedValue(doc: Document, path: string): any {
      const keys = path.split('.')
      let value: any = doc
      for (let key of keys) {
         if (value == null) {
            return undefined
         }
         value = value[key]
      }
      return value
   }

   private static handleLogicalOperator(
      operator: string,
      doc: Document,
      expressions: any[]
   ): boolean {
      if (operator === '$and') {
         return expressions.every((expr: Document) => this.match(doc, expr))
      } else if (operator === '$or') {
         return expressions.some((expr: Document) => this.match(doc, expr))
      } else if (operator === '$nor') {
         return !expressions.some((expr: Document) => this.match(doc, expr))
      } else {
         throw new Error(`Unknown logical operator ${operator}`)
      }
   }

   private static handleFieldOperators(value: any, condition: any): boolean {
      for (let op in condition) {
         const operatorFunc = operators[op]
         if (!operatorFunc) {
            throw new Error(`Unknown operator ${op}`)
         }
         if (!operatorFunc(value, condition[op])) {
            return false
         }
      }
      return true
   }
}

export default QueryParser
