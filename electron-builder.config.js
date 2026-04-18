/**
 * Windows unpacked dir build (offline-capable when packaged with production .next).
 * asar: false so hidden folders like .prisma can be post-copied by electron/build.js if you add Prisma later.
 */
module.exports = {
  appId: "com.canvasfighters.arena",
  productName: "Canvas Fighters Arena",
  copyright: "Copyright © contributors",
  directories: {
    output: "dist",
    buildResources: "electron/build-resources",
  },
  asar: false,
  files: [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "public/**/*",
    ".next/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "uploads/**/*",
    "!**/*.map",
    "!dist/**",
    "!.git/**",
    "!node_modules/electron/**",
    "!node_modules/electron-builder/**",
    "!node_modules/electron-builder-squirrel-windows/**",
    "!node_modules/.cache/**",
    "!**/node_modules/.prisma/**/libquery_engine-*darwin*",
    "!**/node_modules/.prisma/**/libquery_engine-*linux*",
    "!**/node_modules/.prisma/**/libquery_engine-debian*",
    "!**/node_modules/.prisma/**/libquery_engine-*musl*",
    "!**/node_modules/.prisma/**/query-engine-*darwin*",
    "!**/node_modules/.prisma/**/query-engine-*linux*",
  ],
  win: {
    target: [{ target: "dir", arch: ["x64"] }],
  },
  npmRebuild: false,
};
