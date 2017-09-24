// @flow

export type Activity = {
  name: string,
  done: Boolean,
  deadline?: Date, // maybe types not being parsed by intellisense?
  dependencies: Array<string>,
  estimation: number
}
