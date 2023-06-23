import { Option, Some } from "@hazae41/option";
import { Data, Fail, Fetched, Mutator, State, TimesInit } from "@hazae41/xswr";

export namespace Mutators {

  export function mapDataIfItExists<D, F>(piper: (data: Data<D>) => Data<D>) {
    return (state: State<D, F>) => Option.wrap(state.data).mapSync(piper)
  }

  export function mapInnerDataIfItExists<D, F>(piper: (data: D) => D) {
    return (state: State<D, F>) => Option.wrap(state.data).mapSync(d => d.mapSync(piper))
  }

  export function set<D, F>(fetched: Fetched<D, F>) {
    return () => new Some(fetched)
  }

  export function data<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return set(new Data(data, times))
  }

  export function error<D, F>(error: F, times: TimesInit = {}): Mutator<D, F> {
    return set(new Fail(error, times))
  }

  export function mapData<D, F>(piper: (data?: Data<D>) => Data<D>) {
    return (state: State<D, F>) => new Some(piper(state.data))
  }

  export function pushData<D, F>(element: Data<D>): Mutator<D[], F> {
    return mapData<D[], F>(d => Option.wrap(d)
      .mapSync(d => element.mapSync(e => [...d.inner, e]))
      .unwrapOr(element.mapSync(d => [d])))
  }

}