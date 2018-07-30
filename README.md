# good-fences

> "Good fences make good neighbors."
— Robert Frost, [*Mending Wall*](https://www.poetryfoundation.org/poems/44266/mending-wall)

## What is good-fences?

Good-fences is a tool that allows you to segment a TypeScript project into conceptual areas and manage dependencies between those areas.

This is mostly a concern for large projects with many people working on them, where it is impossible for every developer to have a wholistic understanding of the entire codebase.
JavaScript's module system is a specialized form of anarchy because any file can import any other file, possibly allowing access to code that was really meant to be an internal implementation detail of some larger system.
Other languages have concepts like DLL boundaries and the `internal` keyword to mitigate this.
Good-fences provides a way to enforce similar boundaries in the TypeScript world.

## Getting started

1. Install:  `npm install -g good-fences`
2. Configure with one or more fence.json files (see below).
3. Run: `gf [options]`

    Or run good-fences programmatically via the API:

    ```typescript
    import { run } from 'good-fences';
    run(options);
    ```

Also see the [sample project](./sample) which demonstrates how fences can be configured.
To run good-fences against the sample, just clone this repository and run `npm run sample`.

## Configuring good-fences

Good-fences is configured by creating **fence.json** files throughout your project's directory structure.
This configuration file defines a "fence" around that directory (and any subdirectories).
Within a fenced directory, modules may import each other without restriction—fences only control what passes in or out of them.
Fences may be nested, so that a given directory may have two or more configuration files that apply to it.

A typical **fence.json** might look like the following.

```
{
    "tags": [ "tag1", "tag2" ],
    "exports": {
        "index": "*",
        "internals/*": "tag3"
    },
    "imports": [
        "tag4",
        "tag5"
    ],
    "dependencies": [
        "dependency1",
        "dependency2/lib/**"
    ]
}
```

### Tags

The `tags` property can specify one or more tags to apply to all modules under this config's subdirectory.
Tags are a way of defining a class of files;
for example you might tag all your UI components with 'view', or you might have very granular tags for different areas within your application.
(Or both!)
Tags are used by the other config options to scope which modules are accessible to other modules.

### Exports

The `exports` property specifies what modules are accessible from the directory.
In other words, it allows you to keep private modules private.
If **fence.json** contains an `exports` definition, then in order for any module outside the directory to import a module under the directory, there must be a matching export rule.
(If there is no `exports` definition, then *all* modules are considered exported.)

The `exports` property is a map where:
* The *key* is a glob string that resolves to one or more modules within the directory.
An asterisk (`"*"`) indicates all modules under the directory.
* The *value* is a tag (or array of tags) to which these modules are accessible.
An asterisk (`"*"`) indicates the modules are accessible from anywhere.

This is best demonstrated with an example:

```json
"exports": {
    "index": "*",
    "views/**/*": "view",
    "data/store": [ "data", "view" ]
}
```

* The `index` module is accessible to all modules.
* Modules under the `/view` directory are accessible to any module tagged with 'view'.
* The `data/store` modules is accessible to any module tagged with 'data' or 'view'.

### Imports

The `imports` property specifies what modules may be imported by modules in the directory.
This allows you to control your module graph by restricting unwanted dependencies.
(Note that `imports` applies to your project code; for external dependencies see `dependencies` below.)
If **fence.json** contains an `imports` definition, then only imports with the given tags will be allowed.
(If there is no `imports` definition, then *any* module is free to be imported.)

The `imports` property is an array of tags:

```json
"imports": [
    "tag1",
    "tag2"
]
```

In this case, if a module is tagged with 'tag1' *or* with 'tag2' it may be imported.

### Dependencies

The `dependencies` property specifies what external dependencies (i.e. those installed under node_modules) may be imported by modules in the directory.
If **fence.json** contains an `dependencies` definition, then only matching dependencies are allowed.
(If there is no `dependencies` definition, then *any* dependency is free to be imported.)

The `dependencies` property is an array of dependencies to allow.  Each element can be a simple glob string or an object that allows for more configuration.

```json
"dependencies": [
    "dependency1",
    "dependency2/lib/**",
    {
        "dependency": "dependency3",
        "accessibleTo": "tag3"
    }
]
```

* The index of `dependency1` may be imported.
* Anything under `dependency2/lib` may be imported.
* The index of `dependency3` may be imported, but only by modules with the 'tag3' tag.

## Options

### OnError

Provide a callback for reporting errors.
This option is only available when running good-fences via the API.

Default       | CLI | API
--------------|-----|----
`console.log` | n/a | `onError: (message: string) => void`

### Project

Specify the tsconfig file to use for your project.

Default           | CLI                                    | API
------------------|----------------------------------------|----
`./tsconfig.json` | `--project <string>`<br/>`-p <string>` | `project: string`

### Root Directory

Specify the project root directory.

Default         | CLI                                    | API
----------------|----------------------------------------|----
`process.cwd()` | `--rootDir <string>`<br/>`-r <string>` | `rootDir: string`