import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "dist";

const PATTERNS = [
	{ id: "A", how: "component imported statically, only the render is behind the flag", file: "FormStatic.astro" },
	{ id: "B", how: "the component import itself is behind the flag", file: "FormGuarded.astro" },
	{ id: "C", how: "component imported statically, its JS is an is:inline script", file: "FormInline.astro" },
	{ id: "D", how: "component imported statically, the parent registers its JS behind the flag", file: "FormParentGuarded.astro" },
];

const MARKERS = [
	{ kind: "JS", label: "Pattern A panel JS", needle: "STATIC_PANEL_JS_MARKER" },
	{ kind: "CSS", label: "Pattern A panel CSS", needle: "staticPanelCssMarker" },
	{ kind: "JS", label: "Pattern B panel JS", needle: "GUARDED_PANEL_JS_MARKER" },
	{ kind: "CSS", label: "Pattern B panel CSS", needle: "guardedPanelCssMarker" },
	{ kind: "JS", label: "Pattern C panel JS", needle: "INLINE_PANEL_JS_MARKER" },
	{ kind: "CSS", label: "Pattern C panel CSS", needle: "inlinePanelCssMarker" },
	{ kind: "JS", label: "Pattern D panel JS", needle: "PATTERN_D_PANEL_JS_MARKER" },
	{ kind: "CSS", label: "Pattern D panel CSS", needle: "parentGuardedPanelCssMarker" },
	{ kind: "JS", label: "shared form JS", needle: "SHARED_FORM_JS_MARKER" },
];

const walk = (dir) =>
	readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});

const files = walk(ROOT).filter((path) => /\.(html|js|css)$/.test(path));
const basename = (path) => path.split("/").pop();
const contents = new Map(files.map((path) => [path, readFileSync(path, "utf8")]));

// A chunk counts as loaded if a page links it, or if a chunk that is itself
// loaded imports it. Walk that graph until it stops growing.
const reachable = new Set(files.filter((path) => path.endsWith(".html")));
let grew = true;

while (grew) {
	const newlyLinked = files.filter(
		(candidate) =>
			!reachable.has(candidate) &&
			[...reachable].some((path) => contents.get(path).includes(basename(candidate))),
	);

	newlyLinked.forEach((path) => reachable.add(path));
	grew = newlyLinked.length > 0;
}

console.log(`\nFour ways to put an editor-only panel inside a form component:\n`);

for (const { id, how, file } of PATTERNS) {
	console.log(`  ${id}  ${how}`);
	console.log(`     src/components/bundle-demo/${file}`);
}

// Pattern B leaves no trace at all unless the flag was on, so its presence
// tells which build this dist came from.
const wasEditorBuild = files.some((path) => contents.get(path).includes("guardedPanelCssMarker"));

console.log(`\nThis dist is ${wasEditorBuild ? "an EDITOR build (PUBLIC_SHOW_PANEL=1)" : "a PRODUCTION build (PUBLIC_SHOW_PANEL=0)"}.`);
console.log(`${files.length} html/js/css files under ${ROOT}/\n`);

const WHERE_WIDTH = "IN PAGE HTML".length;

const printRow = (...columns) => console.log(`  ${columns.join(" ")}`);

function describeLocation(path) {
	if (path.endsWith(".html")) {
		return "IN PAGE HTML";
	}
	if (reachable.has(path)) {
		return "LOADED FILE";
	}
	return "ORPHAN FILE";
}

for (const { kind, label, needle } of MARKERS) {
	const hits = files.filter((path) => contents.get(path).includes(needle));

	if (hits.length === 0) {
		printRow("ABSENT".padEnd(WHERE_WIDTH), kind.padEnd(3), label);
	}

	for (const hit of hits) {
		printRow(describeLocation(hit).padEnd(WHERE_WIDTH), kind.padEnd(3), label, "->", relative(ROOT, hit));
	}
}

const LEGEND = [
	["IN PAGE HTML", "inlined into the page, every visitor downloads it"],
	["LOADED FILE", "separate file a page pulls in, visitors download it"],
	["ORPHAN FILE", "built and deployed, but nothing links to it, nobody downloads it"],
	["ABSENT", "not in the build at all"],
];

console.log();
for (const [where, meaning] of LEGEND) {
	printRow(where.padEnd(WHERE_WIDTH), "=", meaning);
}
console.log();
