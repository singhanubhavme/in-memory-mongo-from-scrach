import { Document } from '../../interface/document.interface'

function getNestedField(doc: Document, path: string): any {
   return path
      .split('.')
      .reduce(
         (acc, part) => (acc && acc[part] !== undefined ? acc[part] : null),
         doc
      )
}
function evaluateExpression(expr: any, doc: Document): any {
   if (typeof expr === 'string' && expr.startsWith('$')) {
      return getNestedField(doc, expr.substring(1))
   } else if (typeof expr === 'object' && expr !== null) {
      const result: any = {}
      for (let key in expr) {
         result[key] = evaluateExpression(expr[key], doc)
      }
      return result
   } else {
      return expr
   }
}

function computeGroupId(_id: any, doc: Document): any {
   return evaluateExpression(_id, doc)
}

function groupStage(documents: Document[], groupSpec: any): Document[] {
   const { _id, ...accumulators } = groupSpec
   const groups: { [key: string]: Document } = {}

   documents.forEach((doc) => {
      const groupKeyObj = computeGroupId(_id, doc)
      const groupKey = JSON.stringify(groupKeyObj)

      if (!groups[groupKey]) {
         groups[groupKey] = { _id: groupKeyObj }
         for (let accumulatorKey in accumulators) {
            const accumulator = accumulators[accumulatorKey]
            const operator = Object.keys(accumulator)[0]
            if (operator === '$sum') {
               groups[groupKey][accumulatorKey] = 0
            } else if (operator === '$avg') {
               groups[groupKey][accumulatorKey] = { sum: 0, count: 0 }
            } else if (
               operator === '$max' ||
               operator === '$min' ||
               operator === '$first' ||
               operator === '$last'
            ) {
               groups[groupKey][accumulatorKey] = null
            } else {
               throw new Error(`Unsupported accumulator operator: ${operator}`)
            }
         }
      }

      for (let accumulatorKey in accumulators) {
         const accumulator = accumulators[accumulatorKey]
         const operator = Object.keys(accumulator)[0]
         const field = accumulator[operator]

         const fieldValue = evaluateExpression(field, doc)

         switch (operator) {
            case '$sum':
               if (typeof fieldValue !== 'number') {
                  throw new Error(
                     `$sum requires a numeric value, but got: ${fieldValue}`
                  )
               }
               groups[groupKey][accumulatorKey] += fieldValue
               break

            case '$avg':
               if (typeof fieldValue !== 'number') {
                  throw new Error(
                     `$avg requires numeric values, but got: ${fieldValue}`
                  )
               }
               const avgData = groups[groupKey][accumulatorKey]
               avgData.sum += fieldValue
               avgData.count += 1
               break

            case '$max':
               if (
                  groups[groupKey][accumulatorKey] === null ||
                  fieldValue > groups[groupKey][accumulatorKey]
               ) {
                  groups[groupKey][accumulatorKey] = fieldValue
               }
               break

            case '$min':
               if (
                  groups[groupKey][accumulatorKey] === null ||
                  fieldValue < groups[groupKey][accumulatorKey]
               ) {
                  groups[groupKey][accumulatorKey] = fieldValue
               }
               break

            case '$first':
               if (groups[groupKey][accumulatorKey] === null) {
                  groups[groupKey][accumulatorKey] = fieldValue
               }
               break

            case '$last':
               groups[groupKey][accumulatorKey] = fieldValue
               break

            default:
               throw new Error(`Unsupported accumulator operator: ${operator}`)
         }
      }
   })

   for (let groupKey in groups) {
      const group = groups[groupKey]
      for (let field in group) {
         if (
            group[field] &&
            typeof group[field] === 'object' &&
            'sum' in group[field] &&
            'count' in group[field]
         ) {
            if (group[field].count > 0) {
               group[field] = group[field].sum / group[field].count
            } else {
               group[field] = null
            }
         }
      }
   }

   return Object.values(groups)
}

export default groupStage
