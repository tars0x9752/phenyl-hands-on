import { GeneralTypeMap } from '@phenyl/interfaces'

export type PersonId = `PID-${string}`
export type Person = {
  id: PersonId
  name: string
}
export type PersonCollection = {
  id: string
  personList: Person[]
}

export type TaskStatus = 'DONE' | 'WIP' | 'TODO'
export type TaskId = `TID-${string}`
export type Task = {
  id: TaskId
  name: string
  status: TaskStatus
  assignee?: PersonId
}
export type TaskCollection = {
  id: string
  taskList: Task[]
}

export type EntityMap = {
  taskCollection: TaskCollection
  personCollection: PersonCollection
}

export type EntityRestInfoMap = {
  taskCollection: {
    type: TaskCollection
  }
  personCollection: {
    type: PersonCollection
  }
}

export interface MyTypeMap extends GeneralTypeMap {
  entities: EntityRestInfoMap
  customQueries: {}
  customCommands: {}
  auths: {}
}
