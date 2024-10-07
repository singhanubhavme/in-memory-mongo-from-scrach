import Database from './db/database'
import Collection from './collections/collection'
import QueryParser from './query/queryParser'
import Aggregation from './aggregation/aggregation'
import IndexManager from './index/indexManager'
import IdGenerator from './utils/idGenerator'
import { Document } from './interface/document.interface'

export {
   Database,
   Collection,
   QueryParser,
   Aggregation,
   IndexManager,
   IdGenerator,
   Document,
}

export default Database
