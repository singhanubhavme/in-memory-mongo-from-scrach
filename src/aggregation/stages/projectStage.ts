import { Document } from '../../interface/document.interface'

function projectStage(documents: Document[], projection: any): Document[] {
   return documents.map((doc) => {
      const projectedDoc: Document = {}
      for (let field in projection) {
         if (projection[field]) {
            if (projection[field] === 1) {
               projectedDoc[field] = doc[field]
            } else if (
               typeof projection[field] === 'string' &&
               projection[field].startsWith('$')
            ) {
               projectedDoc[field] = doc[projection[field].substring(1)]
            }
         }
      }
      return projectedDoc
   })
}

export default projectStage
