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
These configuration files apply various rules or attributes to their directory and the modules underneath it.
The **fence.json** files may be nested, so that a given module may have two or more configuration files that apply to it.

A typical **fence.json** might look like the following.

```
{
    "tags": [ "tag1", "tag2" ],
    "exports": {
        "index": "*",
        "internals/*": "tag3"
    }
}
```

### Tags

The `tags` property can specify one or more tags to apply to all modules under this config's subdirectory.
Tags are a way of defining a class of files;
for example you might tag all your UI components with 'view', or you might have very granular tags for different areas within your application.
(Or both!)
Tags are used by the `exports` config option to make certain modules accessible to a limited set of other modules.

### Exports

The `exports` property specifies what modules are accessible from the directory.
Exports are enforced based on a few simple rules:

1. Any modules in or underneath the directory may import each other without restriction.
(Another **fence.json** file deeper in the directory structure might apply additional restrictions.)

2. If **fence.json** does not contain an `exports` definition, then *all* modules are considered exported.

3. If **fence.json** does contain an `exports` definition, then in order for any module outside the directory to import a module under the directory, there must be a matching export rule.

The `exports` property is a map where:
* The *key* is a glob string that resolves to one or more modules within the directory.
An asterisk (`"*"`) indicates all modules under the directory.
* The *value* is a tag (or array of tags) to which these modules are accessible.
An asterisk (`"*"`) indicates the modules are accessible from anywhere.

This is best demonstrated with an example:

```
{
    "exports": {
        "index": "*",
        "views/**/*": "view",
        "data/store": [ "data", "view" ]
    }
}
```

* The `index` module is accessible to all modules.
* Modules under the `/view` directory are accessible to any module tagged with 'view'.
* The `data/store` modules is accessible to any module tagged with 'data' or 'view'.

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