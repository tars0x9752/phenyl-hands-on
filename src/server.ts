import { createServer } from 'http'
import { createEntityClient } from '@phenyl/memory-db'
import PhenylRestApi from '@phenyl/rest-api'
import PhenylHttpServer from '@phenyl/http-server'
import { FunctionalGroup } from '@phenyl/interfaces'
import { EntityMap, MyTypeMap } from './type-map'

const serve = async () => {
  // DBのクライアント
  const entityClient = createEntityClient<EntityMap>()

  await entityClient.insertMulti({
    entityName: 'person',
    values: [
      {
        id: 'PID-1',
        name: 'aoy',
      },
      {
        id: 'PID-2',
        name: 'ymtt',
      },
    ],
  })

  await entityClient.insertAndGet({
    entityName: 'task',
    value: {
      id: 'TID-1',
      name: 'hands-on',
      status: 'WIP',
      assign: [],
    },
  })

  const sessionClient = entityClient.createSessionClient()

  const functionalGroup: FunctionalGroup<MyTypeMap> = {
    users: {},
    nonUsers: {
      person: {},
      task: {},
    },
    customCommands: {},
    customQueries: {},
  }

  // PhenylRestApi
  const restApiHandler = new PhenylRestApi(functionalGroup, {
    entityClient,
    sessionClient,
  })

  // PhenylRestApiをホストするサーバー
  const server = new PhenylHttpServer(createServer(), { restApiHandler })

  server.listen(8080)

  console.log('server started')
}

serve()
