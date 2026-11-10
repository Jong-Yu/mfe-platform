const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { inside, readJson, readProject } = require('./project.cjs');

function sharedDependencies(project) {
  const declared = { ...project.pkg.devDependencies, ...project.pkg.dependencies };
  const shared = {};
  const runtimeRequirements = {};
  const nodeModules = path.join(project.root, 'node_modules');
  for (const packageName of ['react', 'react-dom']) {
    if (!Object.prototype.hasOwnProperty.call(declared, packageName)) continue;
    const file = path.join(nodeModules, packageName, 'package.json');
    if (!fs.existsSync(file) || !inside(nodeModules, fs.realpathSync(file))) throw new Error(`${packageName} must be installed in this project's own node_modules.`);
    const { version } = readJson(file);
    runtimeRequirements[packageName] = version;
    const options = { singleton: true, strictVersion: true, requiredVersion: version, version };
    shared[packageName] = options;
    if (packageName === 'react-dom') shared['react-dom/client'] = { ...options };
  }
  return { shared, runtimeRequirements };
}

function federationRemotes(project) {
  return Object.fromEntries(Object.keys(project.remotes).map(alias => [alias, {
    type: 'module',
    name: `${project.release.name}_${Buffer.from(alias).toString('hex')}`,
    // The runtime plugin resolves this marker against the immutable composition.
    // It is never fetched and contains no selected deployment ID.
    entry: `https://mfe.invalid/${encodeURIComponent(project.release.id)}/${encodeURIComponent(alias)}/remoteEntry.js`,
  }]));
}

function platformPlugin(project, MagicString, { browserHost = false } = {}) {
  const imports = new Map();
  const fileImports = new Map();
  const toolRoot = path.resolve(__dirname, '..');
  const entry = browserHost ? path.join(toolRoot, 'browser/index.js') : project.entryFile;
  return {
    name: 'mfe-project-boundary-and-runtime',
    enforce: 'post',
    resolveId(id) {
      if (id === 'mfe:composition-plugin') return path.join(toolRoot, 'runtime/federation-plugin.mjs');
      if (id === 'mfe:import-module') return path.join(toolRoot, 'runtime/import-module.mjs');
    },
    transform(code, id) {
      const file = id.split('?')[0];
      if (inside(project.src, file)) {
        const localImports = [];
        for (const node of this.parse(code).body) {
          if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) || typeof node.source?.value !== 'string') continue;
          const request = node.source.value;
          const alias = Object.keys(project.remotes).sort((a, b) => b.length - a.length).find(key => request === key || request.startsWith(`${key}/`));
          if (!alias) continue;
          const exposedModule = request === alias ? '.' : `./${request.slice(alias.length + 1)}`;
          imports.set(`${alias}:${exposedModule}`, { alias, exposedModule });
          localImports.push({ alias, exposedModule });
        }
        fileImports.set(file, localImports);
      }
      if (file === entry || code.includes('async function getExposes(moduleName)')) {
        const transformed = new MagicString(code).prepend('import "mfe:import-module";\n');
        return { code: transformed.toString(), map: transformed.generateMap({ hires: true }) };
      }
    },
    moduleParsed(info) {
      const filename = info.id.split('?')[0];
      if (!path.isAbsolute(filename) || !fs.existsSync(filename)) return;
      const real = fs.realpathSync(filename);
      const nodeModules = path.join(project.root, 'node_modules');
      const toolRuntime = inside(path.join(toolRoot, 'runtime'), real);
      const toolBrowser = browserHost && inside(path.join(toolRoot, 'browser'), real);
      const toolDependencies = inside(path.join(toolRoot, 'node_modules'), real);
      if (!inside(project.src, real) && !inside(nodeModules, real) && !toolRuntime && !toolBrowser && !toolDependencies) {
        throw new Error(`Cross-project source imports are not allowed: ${filename}`);
      }
      if (project.config.kind !== 'shell' && !browserHost && /\.css$/.test(filename) && !/\.module\.css$/.test(filename) && inside(project.src, real)) {
        throw new Error(`Remote styles must use CSS Modules: ${filename}`);
      }
    },
    renderChunk(code) {
      const transformed = new MagicString(code);
      let changed = false;
      const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'ImportExpression' && typeof node.source?.value === 'string' && /^\.{1,2}\//.test(node.source.value)) {
          transformed.overwrite(node.start, node.end, `globalThis.__MFE_IMPORT__(new URL(${JSON.stringify(node.source.value)}, import.meta.url).href)`);
          changed = true;
          return;
        }
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(visit);
          else if (value && typeof value === 'object') visit(value);
        }
      };
      visit(this.parse(code));
      if (changed) return { code: transformed.toString(), map: transformed.generateMap({ hires: true }) };
    },
    generateBundle(options, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
      project.release.federationImports = [...imports.values()].sort((a, b) => `${a.alias}:${a.exposedModule}`.localeCompare(`${b.alias}:${b.exposedModule}`));
      project.release.exposeImports = Object.fromEntries(Object.entries(project.exposes).map(([key, file]) => {
        const found = new Map();
        const visited = new Set();
        const visit = id => {
          if (visited.has(id)) return;
          visited.add(id);
          for (const dependency of fileImports.get(id.split('?')[0]) || []) found.set(`${dependency.alias}:${dependency.exposedModule}`, dependency);
          for (const dependency of this.getModuleInfo(id)?.importedIds || []) {
            if (inside(project.src, dependency.split('?')[0])) visit(dependency);
          }
        };
        visit(file);
        return [key, [...found.values()].sort((a, b) => `${a.alias}:${a.exposedModule}`.localeCompare(`${b.alias}:${b.exposedModule}`))];
      }));
      project.release.exposeChunks = Object.fromEntries(Object.entries(project.exposes).map(([key, file]) => {
        const chunk = chunks.find(item => item.facadeModuleId?.split('?')[0] === file)
          || chunks.find(item => Object.prototype.hasOwnProperty.call(item.modules, file));
        if (!chunk) throw new Error(`Missing emitted chunk for ${key}`);
        return [key, chunk.fileName];
      }));
    },
  };
}

function pureStylesPlugin() {
  const postcss = require('postcss');
  const localByDefault = require('postcss-modules-local-by-default');
  return {
    name: 'mfe-pure-css-modules',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.split('?')[0].endsWith('.module.css')) return;
      // Validate selectors without rewriting them; Vite owns the actual CSS
      // Modules transform and the artifact-prefixed class names.
      await postcss([localByDefault({ mode: 'pure' })]).process(code, { from: id.split('?')[0] });
    },
  };
}

function cssBoundaryPlugin(project) {
  return {
    postcssPlugin: 'mfe-css-source-boundary',
    OnceExit(root, { result }) {
      const files = new Set();
      root.walk(node => { if (node.source?.input.file) files.add(node.source.input.file); });
      for (const message of result.messages) if (message.type === 'dependency' && message.file) files.add(message.file);
      for (const filename of files) {
        if (!fs.existsSync(filename)) continue;
        const real = fs.realpathSync(filename);
        if (!inside(project.src, real) && !inside(path.join(project.root, 'node_modules'), real)) {
          throw new Error(`Cross-project source imports are not allowed: ${filename}`);
        }
        if (inside(project.src, real) && project.config.kind !== 'shell' && !filename.endsWith('.module.css')) {
          throw new Error(`Remote styles must use CSS Modules: ${filename}`);
        }
      }
    },
  };
}

async function compile(project, { directory, browserHost = false } = {}) {
  const [{ build }, { federation }, { default: MagicString }] = await Promise.all([import('vite'), import('@module-federation/vite'), import('magic-string')]);
  const { shared, runtimeRequirements } = sharedDependencies(project);
  Object.assign(project.release.runtimeRequirements, runtimeRequirements);
  const isHost = browserHost || project.config.kind === 'shell';
  const federationOptions = {
    name: browserHost ? 'mfe_development_host' : project.release.name,
    filename: 'remoteEntry.js',
    exposes: browserHost ? {} : project.config.exposes,
    remotes: federationRemotes(project),
    shared,
    shareStrategy: 'loaded-first',
    hostInitInjectLocation: 'entry',
    runtimePlugins: [['mfe:composition-plugin', {
      consumerId: project.release.id, host: isHost, dependencies: project.remoteDescriptors,
    }]],
    dts: false,
    manifest: false,
    disableSnapshot: true,
    bundleAllCSS: true,
  };
  const entry = browserHost ? path.resolve(__dirname, '../browser/index.js') : project.entryFile;
  await build({
    configFile: false,
    root: project.root,
    base: browserHost ? '/__dev/host/' : `/artifacts/${project.release.id}/`,
    publicDir: false,
    logLevel: 'warn',
    plugins: [pureStylesPlugin(), federation(federationOptions), platformPlugin(project, MagicString, { browserHost })],
    define: {
      __ARTIFACT_ID__: JSON.stringify(project.release.id),
      __SERVICE_VERSION__: JSON.stringify(project.release.version),
      __SERVICE_NAME__: JSON.stringify(project.release.service),
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    resolve: { dedupe: ['react', 'react-dom'] },
    oxc: { jsx: { runtime: 'classic' } },
    css: { postcss: { plugins: [cssBoundaryPlugin(project)] }, modules: {
      generateScopedName(name, filename, css) {
        const hash = crypto.createHash('sha256').update(path.relative(project.src, filename)).update(css).digest('hex').slice(0, 6);
        return `${project.release.id}__${name}__${hash}`;
      },
    } },
    build: {
      outDir: directory, emptyOutDir: true, target: 'esnext', minify: false,
      sourcemap: true, modulePreload: false, cssCodeSplit: true,
      rolldownOptions: {
        input: isHost ? { [browserHost ? 'host' : 'shell']: entry } : {},
        output: {
          entryFileNames: chunk => ['shell', 'host'].includes(chunk.name) ? `${chunk.name}.js` : '[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  });
}

async function buildProject({ root, outputDirectory } = {}) {
  const project = readProject(root);
  if (outputDirectory) project.dist = outputDirectory(project.release);
  const { config, release, dist } = project;
  if (fs.existsSync(dist) && fs.lstatSync(dist).isSymbolicLink()) throw new Error('Refusing to clean a symlinked dist directory.');
  await compile(project, { directory: dist });
  if (config.kind === 'shell') {
    const html = fs.readFileSync(project.htmlFile, 'utf8')
      .replaceAll('__SHELL_SCRIPT__', release.entry)
      .replace(/<script\s+src=/g, '<script type="module" src=');
    const assetDirectory = path.join(dist, 'assets');
    const styles = fs.existsSync(assetDirectory) ? fs.readdirSync(assetDirectory).filter(file => file.endsWith('.css')) : [];
    const links = styles.map(file => `<link rel="stylesheet" href="/artifacts/${release.id}/assets/${file}">`).join('');
    fs.writeFileSync(path.join(dist, 'index.html'), html.replace('</head>', `${links}</head>`));
  }
  fs.writeFileSync(path.join(dist, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
  console.log(`Built ${release.service}@${release.version} with Vite Federation: ${release.id}`);
  console.log(`Release metadata: ${path.join(dist, 'release.json')}`);
  return project;
}

async function buildBrowserHost(project, directory) {
  const host = {
    ...project, exposes: {}, remotes: { platform: true },
    remoteDescriptors: { platform: { mode: 'runtime', service: 'platform' } },
    release: { ...project.release, name: 'mfe_development_host' },
  };
  await compile(host, { directory, browserHost: true });
}

module.exports = { buildProject, buildBrowserHost, sharedDependencies };
