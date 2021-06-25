import assert from 'assert'

assert(1 + 1 === 2)

export const greet = (name: string) => {
  return `hello, ${name}`
}

console.log(greet('tars'))
