import { Document } from '../../interface/document.interface'

function skipStage(documents: Document[], skip: number): Document[] {
   return documents.slice(skip)
}

export default skipStage
