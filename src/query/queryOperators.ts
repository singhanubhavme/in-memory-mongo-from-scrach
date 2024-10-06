type OperatorFunction = (fieldValue: any, queryValue: any) => boolean

const operators: { [key: string]: OperatorFunction } = {
   $eq: (fieldValue, queryValue) => fieldValue === queryValue,
   $ne: (fieldValue, queryValue) => fieldValue !== queryValue,
   $gt: (fieldValue, queryValue) => fieldValue > queryValue,
   $gte: (fieldValue, queryValue) => fieldValue >= queryValue,
   $lt: (fieldValue, queryValue) => fieldValue < queryValue,
   $lte: (fieldValue, queryValue) => fieldValue <= queryValue,
   $in: (fieldValue, queryValue) => {
      if (!Array.isArray(queryValue)) {
         throw new Error(`$in operator requires an array as its query value.`)
      }
      if (Array.isArray(fieldValue)) {
         return fieldValue.some((val) => queryValue.includes(val))
      }
      return queryValue.includes(fieldValue)
   },
   $nin: (fieldValue, queryValue) => {
      if (!Array.isArray(queryValue)) {
         throw new Error(`$nin operator requires an array as its query value.`)
      }
      if (Array.isArray(fieldValue)) {
         return fieldValue.every((val) => !queryValue.includes(val))
      }
      return !queryValue.includes(fieldValue)
   },
   $exists: (fieldValue, queryValue) =>
      queryValue ? fieldValue !== undefined : fieldValue === undefined,
   $regex: (fieldValue, queryValue) => {
      if (typeof fieldValue !== 'string') return false
      const regex = new RegExp(queryValue)
      return regex.test(fieldValue)
   },
}

export default operators
