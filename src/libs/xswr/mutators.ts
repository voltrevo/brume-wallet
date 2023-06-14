import { Some } from "@hazae41/option";
import { Data, Fail, Mutator, State, TimesInit } from "@hazae41/xswr";

export namespace Mutators {

  export function data<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return (previous: State<D, F>) => {
      return new Some(new Data(data, times))
    }
  }

  export function error<D, F>(error: F, times: TimesInit = {}): Mutator<D, F> {
    return (previous: State<D, F>) => {
      return new Some(new Fail(error, times))
    }
  }

  export function push<D, F>(element: D): Mutator<D[], F> {
    return (previous: State<D[], F>) => {
      const previousData = previous.real?.data?.inner

      if (previousData !== undefined)
        return new Some(new Data([...previousData, element]))

      return new Some(new Data([element]))
    }
  }

}