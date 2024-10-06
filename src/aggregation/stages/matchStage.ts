import { Document } from '../../interface/document.interface'
import QueryParser from '../../query/queryParser'

function matchStage(documents: Document[], condition: any): Document[] {
   return documents.filter((doc) => QueryParser.match(doc, condition))
}

export default matchStage
