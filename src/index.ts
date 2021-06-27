import PhenylHttpClient from '@phenyl/http-client'
import { LocalState } from '@phenyl/interfaces'
import { createRedux } from '@phenyl/redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { $bind } from 'sp2'
import { EntityRestInfoMap, MyTypeMap, Task } from './type-map'

const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  const { reducer, middleware, actions } = createRedux({
    client,
    storeKey: 'phenyl',
  })

  const storeEnhancer = applyMiddleware(middleware)

  const store = createStore<{
    phenyl: LocalState<EntityRestInfoMap, {}>
  }>(combineReducers({ phenyl: reducer }), storeEnhancer)

  const defaultTask = await client.insertAndGet({
    entityName: 'task',
    value: {
      id: 'TID-1',
      name: 'Do hands-on',
      status: 'TODO',
    },
  })

  const defaultPersons = await client.insertAndGetMulti({
    entityName: 'person',
    values: [
      {
        id: 'PID-1',
        name: 'a',
      },
      {
        id: 'PID-2',
        name: 'b',
      },
    ],
  })

  store.dispatch(actions.follow('task', defaultTask.entity, defaultTask.versionId))

  store.dispatch(
    actions.followAll(
      'person',
      defaultPersons.entities,
      defaultPersons.versionsById as Record<string, string>
    )
  )

  const { $set, $path } = $bind<Task>()

  const taskUpdate = $set($path('name'), 'TID-1')

  store.dispatch(
    actions.commitAndPush({
      entityName: 'task',
      id: 'TID-2',
      operation: {
        $set: {
          name: 'Create store',
          status: 'WIP',
        },
      },
    })
  )

  const state = store.getState().phenyl

  console.log(JSON.stringify(state, null, 2))
}

main()
