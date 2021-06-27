import { createServer } from 'http'
import { createEntityClient, PhenylMemoryDbClient } from '@phenyl/memory-db'
import PhenylRestApi from '@phenyl/rest-api'
import PhenylHttpServer from '@phenyl/http-server'
import { FunctionalGroup } from '@phenyl/interfaces'
import { EntityMap, MyTypeMap } from './type-map'

const serve = async () => {
  const entityClient = createEntityClient<EntityMap>()

  await entityClient.insertMulti({
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

  await entityClient.insertOne({
    entityName: 'task',
    value: {
      id: 'TID-1',
      name: 'Do hands-on',
      status: 'TODO',
    },
  })

  const persons = await entityClient.find({
    entityName: 'person',
    where: {},
  })

  const tasks = await entityClient.find({
    entityName: 'task',
    where: {},
  })

  console.log(JSON.stringify({ persons, tasks }, null, 2))

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
