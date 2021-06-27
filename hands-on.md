# Phenyl ハンズオン

Phenyl は複数のライブラリからなるライブラリ**群**です。

ライブラリの数は軽く 10 個を超え、どこから手を付けて良いかわからないかもしれません。

このハンズオンではその中からコアなライブラリ数個を厳選して触っていき、Phenyl の概要をなんとなく理解することを目指します。

## はじめの一歩

まずは DB クライアントから見ていきましょう。

Phenyl には 2 種類の DB クライアントがあります。

一つは MongoDB のクライアントである `@phenyl/mongodb`。もう一つはインメモリ DB のライブラリである `@phenyl/memory-db` です。

MongoDB 環境を用意しなくても良いように、今回はより簡単な `@phenyl/memory-db` を使うことにします。

> `@phenyl/memory-db` はインメモリ DB のため、プログラムを終了するとデータは揮発します。

### `entityClient`

`src/server.ts` に次のようにコードを書き、`@phenyl/memory-db` の `entityClient` を用意しましょう。

```ts
import { createEntityClient } from '@phenyl/memory-db'

const entityClient = createEntityClient()
```

`Phenyl` の世界で言う `Entity` とは、`id` を持つオブジェクトのことです。

このハンズオンでは例としてタスク管理システムを作っていくことにします。

タスク管理システムの `Entity` として `Task` と `Person` があるとします。（この辺の設定はテキトーで深い意味はありません。）

`src/type-map.ts` を開き、以下のように `Task` と `Person` の型を定義しましょう。

```ts
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
  assignee?: PersonId
}
```

次に `entityClient` で管理したい `Entity` 全てを列挙した `EntityMap` を定義します。ここでは、`task` と `person` の二つの `Entity` があるので、これらを `EntityMap` に書きます。

```ts
export type EntityMap = {
  task: Task
  person: Person
}
```

`src/server.ts` に戻り、この `EntityMap` をインポートして `createEntityClient` の型引数に渡しましょう。そうすることで `entityClient` が扱う `Entity` を明示できます。

```ts
const entityClient = createEntityClient<EntityMap>()
```

これで `entityClient` を使う準備が整いました。早速 DB に `Entity` を追加するコードを書いてみましょう。

まずは `Person` を 2 人追加してみます。`insertMulti` で複数の `Entity` を追加できます。

```ts
entityClient.insertMulti({
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
```

> このハンズオンの執筆時点ではまだ `id` の型推論は `template literal types` に対応しておらず強制的に `string` になってしまうようです。(無念)

`entityClient` の諸々のメソッドは非同期なので、ここで一連のコードを `async` 関数にまとめることにしましょう。ゆくゆくはサーバーにしたいので、`serve` と名付けることにします。

```ts
const serve = async () => {
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
}

serve()
```

つぎに `Task` を一つ追加してみましょう。`insertOne` で一つ追加することができます。

```ts
await entityClient.insertOne({
  entityName: 'task',
  value: {
    id: 'TID-1',
    name: 'Do hands-on',
    status: 'TODO',
    assign: [],
  },
})
```

実際に `Entity` を追加できているのかどうか確認してみましょう。

`find` で `DB` が保持している `Entity` を検索できます。

```ts
const persons = await entityClient.find({
  entityName: 'person',
  where: {},
})

const tasks = await entityClient.find({
  entityName: 'task',
  where: {},
})

console.log(JSON.stringify({ persons, tasks }, null, 2))
```

`yarn serve` を実行します。以下のようなログが表示されるはずです。

```json
{
  "persons": {
    "entities": [
      {
        "id": "PID-1",
        "name": "a"
      },
      {
        "id": "PID-2",
        "name": "b"
      }
    ],
    "versionsById": {
      "PID-1": "0kqf2b0ofdstvmImS0AdXELU",
      "PID-2": "0kqf2b0ofTUW79ZwIydnO03N"
    }
  },
  "tasks": {
    "entities": [
      {
        "id": "TID-1",
        "name": "Do hands-on",
        "status": "TODO"
      }
    ],
    "versionsById": {
      "TID-1": "0kqf2b0ohphEYIkCo31vHECf"
    }
  }
}
```

> `versionId` はランダムです。

`Entity` を追加できてそうですね！第一部完！🎉

> **Note:** 興味のある人は試しに `entityClient` のメソッドをいろいろ試してみてください。

> **Tips:** 他の Phenyl ファミリーに存在する `entityClient` も基本的に同じような API を持っているため、同じ操作で使う事ができます。

## `@phenyl/rest-api`

ここまでで `entityClient` を通じた DB 操作を見てきました。次に DB から REST API を作成したいと思います。

Phenyl マナーで REST API 化できる `@phenyl/rest-api` というライブラリを使います。

> これは Phenyl の中でも最もコアとなるライブラリです。

早速、`@phenyl/rest-api` から `PhenylRestApi` をインポートし、先ほどの `serve` 関数の最後に `RestApiHandler` を用意しましょう。

```ts
const restApiHandler = new PhenylRestApi()
```

`PhenylRestApi` のコンストラクタの引数の型を見てみましょう。何やら、`FunctionalGroup` というものと `params` が必要なことがわかります。

`params` に `entityClient` と `sessionClient` を渡します。`FunctionalGroup` は次で見ていきましょう。

```ts
const functionalGroup = {}

const restApiHandler = new PhenylRestApi(functionalGroup, {
  entityClient,
  sessionClient: entityClient.createSessionClient(),
})
```

## `FunctionalGroup` と `TypeMap`

`FunctionalGroup` とは一体なんでしょうか？ これは `PhenylRestApi` に伝えたいドメインの実装定義...みたいなやつです。よくわからないと思いますが、とりあえず `@phenyl/interfaces` に `FunctionalGroup` の型があるので見てみましょう。

どうやら、`TypeMap` という型引数が必須のようです。この `TypeMap` から見ていきましょう。

### `TypeMap`

`TypeMap` は全ての `Entity` についてのリクエストやレスポンスの型、および Auth に関する情報をまとめた型定義です。

早速 `TypeMap` を定義していきましょう。

`src/type-map.ts` を開き、まずは全ての `Entity` についてのリクエストやレスポンスをまとめた `EntityRestInfoMap` という型を書きます。

```ts
export type EntityRestInfoMap = {
  task: {
    request: Task
    response: Task
  }
  person: {
    request: Person
    response: Person
  }
}
```

`task` も `person` もリクエストとレスポンスの型は同じとしたいと思います。

そのような場合は `request` と `response` の二つを定義せずとも、以下のように書けます。

```ts
export type EntityRestInfoMap = {
  task: {
    type: Task
  }
  person: {
    type: Person
  }
}
```

次にこの `EntityRestInfoMap` を使って `TypeMap` を定義しましょう。名前は適当に `MyTypeMap` とします。

> auth やカスタム XXX については今回は考えないこととします。

```ts
export interface MyTypeMap extends GeneralTypeMap {
  entities: EntityRestInfoMap
  customQueries: {}
  customCommands: {}
  auths: {}
}
```

これで `TypeMap` の定義はできたので改めて `FunctionalGroup` を作っていきます。

### `FunctionalGroup`

`FunctionalGroup` には 4 つのプロパティがあり、それぞれ

- `nonUsers`: `authenticate` 機能を持たない `Entity`
- `users`: `authenticate` 機能を持つ `Entity`
- `customQueries`: カスタムクエリ―
- `customCommands`: カスタムコマンド

です。

今回のタスク管理システムでは、`authenticate` 機能を持つ `Entity` は要らないので、`nonUsers` だけ使います。

> FunctionalGroup の細かい機能についてはここではこれ以上深追いしません。

```ts
const functionalGroup: FunctionalGroup<MyTypeMap> = {
  users: {},
  nonUsers: {
    person: {},
    task: {},
  },
  customCommands: {},
  customQueries: {},
}
```

`FunctionalGroup` と `TypeMap` を用意し、`PhenylRestApi` の準備までできました！🎉

ただ、まだこれだけではサーバーとして機能はしません。

## `@phenyl/http-server`

次に、`PhenylRestApi` をホストするサーバーを作ります。

シンプルに `Nodejs` の `http` でサーバーを実装する方法の他に、サーバーは `express` で実装し、`Express` の `middleware` として `PhenylRestApi` を動かす方法などもありますが、今回は前者のシンプルな方法で実装することにします。

そのためには `@phenyl/http-server` というライブラリを使います。

`src/server.ts` にて、`http` の `createServer` と `@phenyl/http-server` をインポートします。

```ts
import { createServer } from 'http'
import PhenylHttpServer from '@phenyl/http-server'
```

あとは `serve` 関数の末尾に以下を追記するだけです。🎉

```ts
// PhenylRestApiをホストするサーバー
const server = new PhenylHttpServer(createServer(), { restApiHandler })

server.listen(8080)

console.log('server started')
```

サーバー編、完！🎉

## `@phenyl/http-client`

さて、ようやくクライアント編に突入です。

`@phenyl/http-client` を使ってクライアントを実装していきます。

`src/index.ts` にクライアントのコードを書いていきましょう。まずは `PhenylHttpClient` を用意し、`main` 関数作ります。

```ts
import PhenylHttpClient from '@phenyl/http-client'

const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })
}

main()
```

これだけで `PhenylHttpClient` の準備は完了です！試しにサーバーから `person` を取得してくるコードを書いてみましょう。

```ts
const res = await client.find({
  entityName: 'person',
  where: {},
})

console.log(JSON.stringify(res, null, 2))
```

実際に動かしてみます。`yarn serve` でサーバーを立ち上げてから、`yarn start` してクライアントのログを確認してみましょう。

> ここから先はサーバーは立ち上げたままで良いです。

```json
{
  "entities": [
    {
      "id": "PID-1",
      "name": "a"
    },
    {
      "id": "PID-2",
      "name": "b"
    }
  ],
  "versionsById": {
    "PID-1": "0kqf5tmou046uG63J7bLLaIk",
    "PID-2": "0kqf5tmou7IFuCSGeq6Fojav"
  }
}
```

サーバーからデータを取得できました！🎉

では試しに insert もしてみましょう。新たにタスクを追加してみたいと思います。`main` を次のように書き換えます。

```ts
const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  await client.insertOne({
    entityName: 'task',
    value: {
      id: 'TID-2',
      name: 'Implement client',
      status: 'WIP',
      assignee: 'PID-1',
    },
  })

  const res = await client.find({
    entityName: 'task',
    where: {},
  })

  console.log(JSON.stringify(res, null, 2))
}
```

もう一度 `yarn start` してみましょう。

```json
{
  "entities": [
    {
      "id": "TID-1",
      "name": "Do hands-on",
      "status": "TODO"
    },
    {
      "id": "TID-2",
      "name": "Implement client",
      "status": "WIP",
      "assignee": "PID-1"
    }
  ],
  "versionsById": {
    "TID-1": "0kqf5tmowvzrDtY7VXhdqpQk",
    "TID-2": "0kqf61ltf8Xm70JHXlwGlrSk"
  }
}
```

`insert` もできました！🎉

次にアップデートもしてみたいと思います。

`"Do hands-on"` のステータスを `WIP` に、`assignee` を `PID-1` にしてみましょう。

```ts
const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  await client.updateById({
    entityName: 'task',
    id: 'TID-1',
    operation: {
      $set: {
        status: 'WIP',
        assignee: 'PID-1',
      },
    },
  })

  const res = await client.findOne({
    entityName: 'task',
    where: {
      id: 'TID-1',
    },
  })

  console.log(JSON.stringify(res, null, 2))
}
```

`operation` はこのように MongoDB 風に書けます。

実行してみます。

```json
{
  "entity": {
    "id": "TID-1",
    "name": "Do hands-on",
    "status": "WIP",
    "assignee": "PID-1"
  },
  "versionId": "0kqf88c02feR2S9iKeypDFRa"
}
```

`update` もできました！あとは削除もやってみましょう。

先ほど追加した `TID-2` を消してみます。

```ts
const main = async () => {
  const client = new PhenylHttpClient<MyTypeMap>({
    url: 'http://localhost:8080',
  })

  await client.delete({
    entityName: 'task',
    id: 'TID-2',
  })

  const res = await client.find({
    entityName: 'task',
    where: {},
  })

  console.log(JSON.stringify(res, null, 2))
}
```

```json
{
  "entities": [
    {
      "id": "TID-1",
      "name": "Do hands-on",
      "status": "WIP",
      "assignee": "PID-1"
    }
  ],
  "versionsById": {
    "TID-1": "0kqf88c02feR2S9iKeypDFRa"
  }
}
```

消えていますね！

## State Synchronization via `@phenyl/redux`

さて、このハンズオンもとうとう最後の章まできました。

最後は `@phenyl/redux` を見ていきます。

`@phenyl/redux` はサーバー/クライアント間の `Git-like` な `synchronization` を実現します。





