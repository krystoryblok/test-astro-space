# Demo

`PUBLIC_SHOW_PANEL` is the flag. Unset = "production". `1` = "editor build".

| pattern | file                                                 | how the panel is pulled in                                                         |
| ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A       | `src/components/bundle-demo/FormStatic.astro`        | `import Panel from …` at the top, condition only on the render                     |
| B       | `src/components/bundle-demo/FormGuarded.astro`       | the import itself is behind the flag                                               |
| C       | `src/components/bundle-demo/FormInline.astro`        | static import, but the panel's JS is an `is:inline` script                         |
| D       | `src/components/bundle-demo/FormParentGuarded.astro` | static import, panel has no script of its own, parent registers it behind the flag |

Each pattern has its own panel, its own CSS module and its own marker string, so
nothing leaks between them. One page per pattern under `src/pages/bundle-demo/`.

## Run it

```sh
pnpm demo:prod   # build as production, then report
pnpm demo:dev    # build with PUBLIC_SHOW_PANEL=1, then report
```

## What you should see

`pnpm demo:prod` — the panel renders nowhere, but:

```
ORPHAN FILE  JS  Pattern A panel JS   ->  client/_astro/StaticPanel.astro_….js
IN PAGE HTML CSS Pattern A panel CSS  ->  client/bundle-demo/static-import/index.html
ABSENT       JS  Pattern B panel JS
ABSENT       CSS Pattern B panel CSS
ABSENT       JS  Pattern C panel JS
IN PAGE HTML CSS Pattern C panel CSS  ->  client/bundle-demo/inline-script/index.html
ABSENT       JS  Pattern D panel JS
IN PAGE HTML CSS Pattern D panel CSS  ->  client/bundle-demo/guarded-script/index.html
```

- **A** leaves a JS chunk nobody downloads, and inlines the panel's CSS into the
  page.
- **B** is gone completely.
- **C** kills the JS but keeps the CSS.
- **D** also kills the JS and keeps the CSS. A guard around the script only ever
  controls the script - the CSS rides in on the component import.

A and D differ only in where the leftover JS sits: A leaves an orphan chunk in
the deploy, D emits nothing. Neither reaches a browser. Both still ship the CSS,
which is the part that does.

`pnpm demo:dev` — all three render, all three ship their JS and CSS. Nothing is
broken by pattern B, it just disappears when the flag is off.

## Check it by hand

```sh
# the CSS Astro inlined into a page where the panel never rendered
cat dist/client/bundle-demo/static-import/index.html

# the orphan chunk sitting in the deploy
ls dist/client/_astro/

# nothing links to it
grep -rl StaticPanel dist/client --include=*.html
```
