import { Data, Fail, Fetched, Mutator, State, TimesInit } from "@hazae41/glacier";
import { Option, Some } from "@hazae41/option";
import { Ok } from "@hazae41/result";

export namespace Mutators {

  export function mapExistingData<D, F>(piper: (data: Data<D>) => Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(Option.wrap(state.data).mapSync(piper))
  }

  export function mapExistingInnerData<D, F>(piper: (data: D) => D): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(Option.wrap(state.data).mapSync(d => d.mapSync(piper)))
  }

  export function set<D, F>(fetched: Fetched<D, F>): Mutator<D, F> {
    return () => new Ok(new Some(fetched))
  }

  export function data<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return set(new Data(data, times))
  }

  export function replaceData<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(Option.wrap(state.data).mapSync(() => new Data(data, times)))
  }

  export function error<D, F>(error: F, times: TimesInit = {}): Mutator<D, F> {
    return set(new Fail(error, times))
  }

  export function replaceError<D, F>(error: F, times: TimesInit = {}): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(Option.wrap(state.error).mapSync(() => new Fail(error, times)))
  }

  export function mapData<D, F>(piper: (data?: Data<D>) => Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(new Some(piper(state.data)))
  }

  export function mapInnerData<D, F>(piper: (data: D) => D, init: Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => new Ok(new Some((state.data ?? init).mapSync(piper)))
  }

  export function pushData<D, F>(element: Data<D>): Mutator<D[], F> {
    return mapData<D[], F>((array = new Data([])) => new Data([...array.inner, element.inner]))
  }

}