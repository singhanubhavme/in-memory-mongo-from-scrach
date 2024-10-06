import { Document } from '../../interface/document.interface'

function limitStage(documents: Document[], limit: number): Document[] {
   return documents.slice(0, limit)
}

export default limitStage
