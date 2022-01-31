import rawExtensions from "./extensions.json";

const extensions = new Map<string, string>();
for (const emoji in rawExtensions) for (const extension of emoji) extensions.set(extension, emoji);

export default extensions;