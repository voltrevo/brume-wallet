# Contributing

## Keywords

- `MUST` — This word, or the terms `REQUIRED` or `SHALL`, mean that the
   definition is an absolute requirement.

- `MUST NOT` — This phrase, or the phrase `SHALL NOT`, mean that the
   definition is an absolute prohibition.

- `SHOULD` — This word, or the adjective `RECOMMENDED`, mean that there
   may exist valid reasons in particular circumstances to ignore a
   particular item, but the full implications must be understood and
   carefully weighed before choosing a different course.

- `SHOULD NOT` — This phrase, or the phrase `NOT RECOMMENDED` mean that
   there may exist valid reasons in particular circumstances when the
   particular behavior is acceptable or even useful, but the full
   implications should be understood and the case carefully weighed
   before implementing any behavior described with this label.

- `MAY` — This word, or the adjective `OPTIONAL`, mean that an item is
   truly optional.

## Security

### Supply-chain security

You SHOULD avoid adding dependencies.

You SHOULD prefer small "does one thing and does it well" dependencies over large SDKs

You SHOULD review most of the dependency to see if they fit our security standards, especially:
- You SHOULD review the dependency graph with something like https://npmgraph.js.org
- You SHOULD review the dependency code to see if it fits our security standards

## Design

### Bottom-up approach

You SHOULD have a bottom-up approach.

> A bottom-up approach is a method of problem-solving or analysis that starts with the individual components of a system and builds upward to understand or solve a larger, more complex problem. In this approach, the focus is on understanding the fundamental elements, details, or smaller parts of a system before considering the whole.

That means, you SHOULD NOT try to design the big picture, and then try to make the individual elements fit that big picture, but rather you SHOULD slowly create the big picture out of the small elements, without any friction between them.

Suppose you're developing a library, let's call it A, with the goal of outperforming another library, B, that serves the same purpose. In this scenario, it's not advisable to start by copying the overall structure of B, including function names, parameters, and design patterns. Instead, the recommended approach is to focus on building individual components of A without being constrained by B's top-level design. Innovate on these smaller elements independently. As you progress, gradually integrate these innovative components, allowing them to shape the overall design of A. Only after this process should you consider aligning the top-level interface of A with that of B, ensuring that it incorporates the successful innovations made during the development of A's individual elements.

### Biomimetic approach

You SHOULD also have biomimetic approach.

> A biomimetic approach, also known as biomimicry or bio-inspiration, involves learning from and mimicking the strategies, structures, functions, and processes found in nature to solve human problems and design innovative solutions. The term "biomimetic" is derived from "bio," meaning life, and "mimetic," meaning to imitate.

For example, you MAY prefer to build something attached to the current system, then making it more and more independent, and then split it.

<img src="https://github.com/brumewallet/wallet/assets/4405263/59539df6-4afd-40e0-a5aa-6249f3319506" alt="cell division" width="200"/>

When you want to build a library, the biomimetic "cell division" approach is to first write some code in a subfolder, then try to make that code independent from the current project, then make an independent library out of that code.

Or you MAY do the opposite, which is slowly integrating something external.

<img src="https://github.com/brumewallet/wallet/assets/4405263/ee0cf66d-a727-4e2f-8d64-8e3251595c24" alt="cell division" width="400"/>

When you want to introduce a new pattern, the biomimetic "mitochondria" approach is to start with something small, then slowly rewrite all the code with this new pattern.

**Remember, most of the solutions to your problems already exist in nature because it had millions of years to think about it.**
