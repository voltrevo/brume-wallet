import { Data, Mutator, State } from "@hazae41/glacier";
import { Nullable, Option, Some } from "@hazae41/option";

/**
 * @deprecated
 */
export namespace Mutators {

  export function mapExistingData<D, F>(piper: (data: Data<D>) => Data<D>): Mutator<D, F> {
    return (state: State<D, F>) => Option.wrap(state.data).mapSync(piper)
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