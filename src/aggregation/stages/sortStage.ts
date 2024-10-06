import { Document } from '../../interface/document.interface'

function sortStage(documents: Document[], sortSpec: any): Document[] {
   const fields = Object.keys(sortSpec)

   return documents.sort((a, b) => {
      for (let field of fields) {
         const order = sortSpec[field]
         if (a[field] < b[field]) {
            return -1 * order
         } else if (a[field] > b[field]) {
            return 1 * order
         }
      }
      return 0
   })
}

export default sortStage
