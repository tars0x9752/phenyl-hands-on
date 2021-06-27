import PhenylHttpClient from '@phenyl/http-client'
import { ActionWithTypeMap, EntityNameOf, LocalState, UserEntityNameOf } from '@phenyl/interfaces'
import { createRedux } from '@phenyl/redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { $bind } from 'sp2'
import { EntityRestInfoMap, MyTypeMap, TaskCollection } from './type-map'

const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  const { reducer, middleware, actions } = createRedux({
    client,
    storeKey: 'phenyl',
  })

  const storeEnhancer = applyMiddleware(middleware)

  const store = createStore<
    {
      phenyl: LocalState<EntityRestInfoMap, {}>
    },
    ActionWithTypeMap<MyTypeMap, EntityNameOf<MyTypeMap>, UserEntityNameOf<MyTypeMap>>,
    {},
    {}
  >(combineReducers({ phenyl: reducer }), storeEnhancer)

  const defaultPersons = await client.insertAndGet({
    entityName: 'personCollection',
    value: {
      id: 'person-collection-1',
      personList: [
        {
          id: 'PID-1',
          name: 'a',
        },
        {
          id: 'PID-2',
          name: 'b',
        },
      ],
    },
  })

  const defaultTasks = await client.insertAndGet({
    entityName: 'taskCollection',
    value: {
      id: 'task-collection-1',
      taskList: [
        {
          id: 'TID-1',
          name: 'Do hands-on',
          status: 'TODO',
        },
      ],
    },
  })

  await store.dispatch(
    actions.follow('personCollection', defaultPersons.entity, defaultPersons.versionId)
  )

  await store.dispatch(
    actions.follow('taskCollection', defaultTasks.entity, defaultTasks.versionId)
  )

  const { $push, $path } = $bind<TaskCollection>()

  const addTaskOp = $push($path('taskList'), {
    id: 'TID-2',
    name: 'Create store',
    status: 'WIP',
  })

  await store.dispatch(
    actions.commitAndPush({
      entityName: 'taskCollection',
      id: 'task-collection-1',
      operation: addTaskOp,
    })
  )

  const state = store.getState().phenyl

  console.log(JSON.stringify(state.entities, null, 2))
}

main()
