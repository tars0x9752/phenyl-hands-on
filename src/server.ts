import { createServer } from 'http'
import { createEntityClient } from '@phenyl/memory-db'
import PhenylRestApi from '@phenyl/rest-api'
import PhenylHttpServer from '@phenyl/http-server'
import { FunctionalGroup } from '@phenyl/interfaces'
import { EntityMap, MyTypeMap } from './type-map'

const serve = async () => {
  const entityClient = createEntityClient<EntityMap>()

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
    sessionClient: entityClient.createSessionClient(),
  })

  // PhenylRestApiをホストするサーバー
  const server = new PhenylHttpServer(createServer(), { restApiHandler })

  server.listen(8080)

  console.log('server started')
}

serve()
