import { createServer } from 'http'
import { createEntityClient } from '@phenyl/memory-db'
import PhenylRestApi from '@phenyl/rest-api'
import PhenylHttpServer from '@phenyl/http-server'
import { FunctionalGroup } from '@phenyl/interfaces'
import { EntityMap, MyTypeMap } from './type-map'

const serve = async () => {
  const entityClient = createEntityClient<EntityMap>()

  await entityClient.insertOne({
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

  await entityClient.insertOne({
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

  const functionalGroup: FunctionalGroup<MyTypeMap> = {
    users: {},
    nonUsers: {
      personCollection: {},
      taskCollection: {},
    },
    customCommands: {},
    customQueries: {},
  }

  // PhenylRestApi
  const restApiHandler = new PhenylRestApi(functionalGroup, {
    entityClient,
    sessionClient: entityClient.createSessionClient(),
  })

  // PhenylRestApiをホストするサーバー
  const server = new PhenylHttpServer(createServer(), { restApiHandler })

  server.listen(8080)

  console.log('server started')
}

serve()
