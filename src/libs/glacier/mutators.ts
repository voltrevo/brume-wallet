import { Data, Fetched, Mutator, State, TimesInit } from "@hazae41/glacier";
import { Nullable, Option, Some } from "@hazae41/option";

/**
 * @deprecated
 */
export namespace Mutators {

  export function mapExistingData<D, F>(piper: (data: Data<D>) => Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => Option.wrap(state.data).mapSync(piper)
  }

  export function set<D, F>(fetched: Fetched<D, F>): Mutator<D, F> {
    return () => new Some(fetched)
  }

  export function data<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return set(new Data(data, times))
  }

  export function replaceData<D, F>(data: D, times: TimesInit = {}): Mutator<D, F> {
    return (state: State<D, F>) => Option.wrap(state.data).mapSync(() => new Data(data, times))
  }

  export function mapData<D, F>(piper: (data?: Data<D>) => Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => new Some(piper(state.data))
  }

  export namespace Datas {

    export function mapOrNew<D, O>(mapper: (data?: D) => O, data: Nullable<Data<D>>) {
      return Option.wrap(data)
        .mapSync(data => data.mapSync(mapper))
        .getOr(new Data(mapper()))
    }

  }

}