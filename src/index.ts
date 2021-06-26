import PhenylHttpClient from '@phenyl/http-client'
import { MyTypeMap } from './type-map'

const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  const res = await client.find({
    entityName: 'person',
    where: {},
  })

  console.log(JSON.stringify(res, null, 2))

  await client.insertOne({
    entityName: 'person',
    value: {
      id: 'PID-3',
      name: 'mti',
    },
  })

  const res2 = await client.find({
    entityName: 'person',
    where: {},
  })

  console.log(JSON.stringify(res2, null, 2))

  console.log(res.versionsById['PID-1'])

  const res3 = await client.pull({
    entityName: 'person',
    id: 'PID-1',
    versionId: res.versionsById['PID-1'],
  })

  console.log(JSON.stringify(res3, null, 2))
}

main()
