import { Some } from "@hazae41/option";
import { Data, Mutator, State } from "@hazae41/xswr";

export namespace Mutators {

  export function push<S, D extends S, F>(element: D): Mutator<S[], F> {
    return (previous: State<S[], F>) => {
      const previousData = previous.real?.data?.inner

      if (previousData !== undefined)
        return new Some(new Data([...previousData, element]))

      return new Some(new Data([element]))
    }
  }

}