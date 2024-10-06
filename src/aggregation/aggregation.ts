import { Document } from '../interface/document.interface'
import matchStage from './stages/matchStage'
import groupStage from './stages/groupStage'
import projectStage from './stages/projectStage'
import sortStage from './stages/sortStage'
import limitStage from './stages/limitStage'
import skipStage from './stages/skipStage'

class Aggregation {
   static executePipeline(documents: Document[], pipeline: any[]): Document[] {
      let result = documents

      for (const stage of pipeline) {
         const stageOperator = Object.keys(stage)[0]
         const stageValue = stage[stageOperator]

         switch (stageOperator) {
            case '$match':
               result = matchStage(result, stageValue)
               break
            case '$group':
               result = groupStage(result, stageValue)
               break
            case '$project':
               result = projectStage(result, stageValue)
               break
            case '$sort':
               result = sortStage(result, stageValue)
               break
            case '$limit':
               result = limitStage(result, stageValue)
               break
            case '$skip':
               result = skipStage(result, stageValue)
               break
            default:
               throw new Error(
                  `Unknown aggregation stage operator: ${stageOperator}`
               )
         }
      }

      return result
   }
}

export default Aggregation
