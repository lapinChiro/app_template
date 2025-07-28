#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 実装済みかどうかをチェックする関数
function isPackageImplemented(packagePath, packageName) {
  // Next.jsプロジェクトはスキップ
  // 理由: Next.jsは`noEmit: true`が必須で、TypeScript Project Referencesと非互換
  // 参照: docs/development/nextjs-typescript.md
  if (packageName.startsWith('web-')) {
    return false;
  }
  
  const tsconfigPath = path.join(packagePath, 'tsconfig.json');
  const srcPath = path.join(packagePath, 'src');
  
  // tsconfig.jsonが存在し、srcディレクトリに.tsファイルがあるかチェック
  if (!fs.existsSync(tsconfigPath)) return false;
  if (!fs.existsSync(srcPath)) return false;
  
  const hasTypeScriptFiles = fs.readdirSync(srcPath, { recursive: true })
    .some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
  
  return hasTypeScriptFiles;
}

// プロジェクトのルートから実行
const rootDir = process.cwd();
const packagesDir = path.join(rootDir, 'packages');
const appsDir = path.join(rootDir, 'apps');

const activeReferences = [];

// packagesディレクトリをチェック
if (fs.existsSync(packagesDir)) {
  fs.readdirSync(packagesDir).forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    if (fs.statSync(pkgPath).isDirectory() && isPackageImplemented(pkgPath, pkg)) {
      activeReferences.push({ path: `./packages/${pkg}` });
    }
  });
}

// appsディレクトリをチェック
if (fs.existsSync(appsDir)) {
  fs.readdirSync(appsDir).forEach(app => {
    const appPath = path.join(appsDir, app);
    if (fs.statSync(appPath).isDirectory() && isPackageImplemented(appPath, app)) {
      activeReferences.push({ path: `./apps/${app}` });
    }
  });
}

// tsconfig.active.jsonを更新
const tsconfigActive = {
  extends: './tsconfig.json',
  references: activeReferences
};

fs.writeFileSync(
  path.join(rootDir, 'tsconfig.active.json'),
  JSON.stringify(tsconfigActive, null, 2) + '\n'
);

console.log('✅ Updated tsconfig.active.json with active packages:');
activeReferences.forEach(ref => console.log(`  - ${ref.path}`));
console.log(`\nTotal: ${activeReferences.length} active packages`);