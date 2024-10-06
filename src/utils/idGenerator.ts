import { randomBytes } from 'crypto'

class IdGenerator {
   static generateId(): string {
      return randomBytes(16).toString('hex')
   }
}

export default IdGenerator
