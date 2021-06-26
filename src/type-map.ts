import { GeneralTypeMap } from '@phenyl/interfaces'

export type PersonId = `PID-${string}`
export type Person = {
  id: PersonId
  name: string
}

export type TaskStatus = 'DONE' | 'WIP' | 'TODO'
export type TaskId = `TID-${string}`
export type Task = {
  id: TaskId
  name: string
  status: TaskStatus
  assign: PersonId[]
}

export type EntityMap = {
  task: Task
  person: Person
}

export type EntityRestInfoMap = {
  task: {
    type: Task
  }
  person: {
    type: Person
  }
}

export interface MyTypeMap extends GeneralTypeMap {
  entities: EntityRestInfoMap
  customQueries: {}
  customCommands: {}
  auths: {}
}
