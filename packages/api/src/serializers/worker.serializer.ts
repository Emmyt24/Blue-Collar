import type { Worker, Category, User } from '@prisma/client'
import { BaseSerializer } from './base.serializer.js'
import { categorySerializer, type SerializedCategory } from './category.serializer.js'
import { userSerializer, type SerializedUser } from './user.serializer.js'

type WorkerWithRelations = Worker & {
  category?: Category | null
  curator?: User | null
}

export type SerializedWorker = Omit<Worker, 'searchVector'> & {
  category?: SerializedCategory
  curator?: SerializedUser
}

export class WorkerSerializer extends BaseSerializer<WorkerWithRelations, SerializedWorker> {
  serialize(worker: WorkerWithRelations): SerializedWorker {
    const { searchVector, category, curator, ...rest } = worker as any
    return {
      ...rest,
      ...(category ? { category: categorySerializer.serialize(category) } : {}),
      ...(curator  ? { curator:  userSerializer.serialize(curator) }       : {}),
    }
  }
}

export const workerSerializer = new WorkerSerializer()
