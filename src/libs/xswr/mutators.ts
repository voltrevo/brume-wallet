import { Some } from "@hazae41/option";
import { Data, Mutator, State } from "@hazae41/xswr";

export namespace Mutators {

  export function push<S, D extends S>(element: D): Mutator<S[]> {
    return (previous: State<S[]>) => {
      const previousData = previous.real?.data?.inner

      if (previousData !== undefined)
        return new Some(new Data([...previousData, element]))

      return new Some(new Data([element]))
    }
  }

}