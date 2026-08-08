"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outputDirectory = path.join(root, "dist");
const outputPath = path.join(outputDirectory, "风云战机-安卓单文件版.html");

const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

let html = readText("index.html");
const stylesheet = readText("styles.css").replace(/<\/style/gi, "<\\/style");
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/>/i,
  `<style data-bundled="styles.css">\n${stylesheet}\n</style>`,
);

const bundledScripts = [];
html = html.replace(
  /<script\s+src="([^"]+)"\s*><\/script>/gi,
  (_match, source) => {
    const script = readText(source).replace(/<\/script/gi, "<\\/script");
    bundledScripts.push(source);
    return `<script data-bundled="${source}">\n${script}\n</script>`;
  },
);

const assetPattern = /assets\/ships\/[a-z0-9-]+\.png/gi;
const assetPaths = [...new Set(html.match(assetPattern) || [])];
for (const assetPath of assetPaths) {
  const absolutePath = path.join(root, ...assetPath.split("/"));
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`缺少运行图片：${assetPath}`);
  }
  const dataUrl = `data:image/png;base64,${fs.readFileSync(absolutePath).toString("base64")}`;
  html = html.split(assetPath).join(dataUrl);
}

html = html.replace(
  /<meta name="viewport"([^>]+)>/i,
  `<meta name="viewport"$1>\n    <meta name="theme-color" content="#071322" />\n    <meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />`,
);
html = html.replace(
  "<!doctype html>",
  "<!doctype html>\n<!-- 风云战机安卓单文件版：样式、脚本和运行图片均已内嵌，可离线打开。 -->",
);

const unresolved = [
  ...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(?!data:)([^"]+)"/gi),
].map((match) => match[1]);
if (unresolved.length > 0) {
  throw new Error(`仍有外部页面依赖：${unresolved.join(", ")}`);
}
if (html.includes("assets/ships/")) {
  throw new Error("仍有运行图片未嵌入单文件。");
}

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

const sizeMb = fs.statSync(outputPath).size / 1024 / 1024;
console.log(
  `已生成 ${path.relative(root, outputPath)}（${sizeMb.toFixed(2)} MB，${bundledScripts.length} 个脚本，${assetPaths.length} 张运行图片）`,
);
