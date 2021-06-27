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

// DBクライアント
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

`src/server.ts` に戻り、この `EntityMap` をインポートして `createEntityClient` の型引数に渡しましょう。そうすることで `entityClient` が扱う `Entity` を明示します

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

`yarn serve` を実行します。

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

上記のようなログがでるはずです。追加できてそうですね。🎉

これで `@phenyl/memory-db` 編はオワリとします。

> Note: 試しに `entityClient` のメソッドをいろいろ試してみてもいいかもしれません。

> Tips: 他の Phenyl ファミリーに存在する `entityClient` も基本的に同じような API を持っているため、同じ操作で使う事ができます。
