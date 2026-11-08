const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
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
    const options = { singleton: true, strictVersion: true, requiredVersion: version, version, packageName };
    shared[packageName] = options;
    if (packageName === 'react-dom') shared['react-dom/client'] = { ...options };
  }
  return { shared, runtimeRequirements };
}

class ProjectBoundaryPlugin {
  constructor(project) { this.project = project; }

  apply(compiler) {
    const { root, src } = this.project;
    const nodeModules = path.join(root, 'node_modules');
    compiler.hooks.normalModuleFactory.tap('ProjectBoundaryPlugin', (factory) => {
      factory.hooks.afterResolve.tap('ProjectBoundaryPlugin', (data) => {
        const resource = data?.createData?.resource;
        if (!resource) return;
        const file = resource.split('?')[0];
        if (!path.isAbsolute(file)) return;
        const real = fs.realpathSync(file);
        if (!inside(src, real) && !inside(nodeModules, real)) {
          throw new Error(`Cross-project source imports are not allowed: ${file}`);
        }
      });
    });
  }
}

async function buildProject({ root, outputDirectory } = {}) {
  const project = readProject(root);
  if (outputDirectory) project.dist = outputDirectory(project.release);
  const { config, release, dist } = project;
  const { shared, runtimeRequirements } = sharedDependencies(project);
  Object.assign(release.runtimeRequirements, runtimeRequirements);
  const rules = [
    {
      test: (filename) => filename === require.resolve('../runtime/retry.cjs'),
      use: [{ loader: require.resolve('./retry-loader.cjs'), options: { exposes: project.exposes } }],
    },
    {
      test: /\.[cm]?jsx?$/,
      include: project.src,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          babelrc: false,
          configFile: false,
          presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
        },
      },
    },
    {
      test: /\.module\.css$/,
      include: project.src,
      use: [require.resolve('style-loader'), {
        loader: require.resolve('css-loader'),
        options: {
          modules: {
            mode: 'pure',
            namedExport: false,
            localIdentName: `${release.id}__[local]__[hash:base64:6]`,
            localIdentHashSalt: release.id,
          },
        },
      }],
    },
  ];
  if (config.kind === 'shell') {
    rules.push({
      test: /\.css$/,
      exclude: /\.module\.css$/,
      include: project.src,
      use: [require.resolve('style-loader'), require.resolve('css-loader')],
    });
  }
  if (fs.existsSync(dist) && fs.lstatSync(dist).isSymbolicLink()) throw new Error('Refusing to clean a symlinked dist directory.');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
  const compiler = webpack({
    name: release.id,
    mode: 'development',
    devtool: 'source-map',
    context: project.root,
    entry: config.kind === 'shell' ? project.entryFile : {},
    output: {
      path: dist,
      filename: config.kind === 'shell' ? 'shell.js' : '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      publicPath: 'auto',
      uniqueName: release.id,
      strictModuleErrorHandling: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json'],
      modules: ['node_modules'],
      symlinks: true,
    },
    module: { rules },
    plugins: [
      new ProjectBoundaryPlugin(project),
      new webpack.DefinePlugin({
        __ARTIFACT_ID__: JSON.stringify(release.id),
        __SERVICE_VERSION__: JSON.stringify(release.version),
        __SERVICE_NAME__: JSON.stringify(release.service),
      }),
      new webpack.container.ModuleFederationPlugin({
        name: release.name,
        filename: 'remoteEntry.js',
        exposes: { ...project.exposes, './__mfe_retry__': require.resolve('../runtime/retry.cjs') },
        remotes: project.remotes,
        shared,
      }),
    ],
    optimization: { runtimeChunk: false },
    performance: { hints: false },
    stats: 'errors-warnings',
  });

  const stats = await new Promise((resolve, reject) => {
    compiler.run((error, result) => {
      compiler.close((closeError) => {
        if (error || closeError) reject(error || closeError);
        else if (!result || result.hasErrors()) reject(new Error(result ? result.toString({ all: false, errors: true, errorDetails: true }) : 'Webpack returned no build result.'));
        else resolve(result);
      });
    });
  });
  if (config.kind === 'shell') {
    const html = fs.readFileSync(project.htmlFile, 'utf8').replaceAll('__SHELL_SCRIPT__', release.entry);
    fs.writeFileSync(path.join(dist, 'index.html'), html);
  }
  fs.writeFileSync(path.join(dist, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
  const warnings = stats.toString({ all: false, warnings: true });
  if (warnings) console.warn(warnings);
  console.log(`Built ${release.service}@${release.version}: ${release.id}`);
  console.log(`Release metadata: ${path.join(dist, 'release.json')}`);
  return project;
}

module.exports = { buildProject, sharedDependencies };
