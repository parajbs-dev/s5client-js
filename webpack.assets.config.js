const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RemoveFilePlugin {
  constructor(filePath) {
    this.filePath = filePath;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('RemoveFilePlugin', async (compilation) => {
      try {
        const outputPath = path.resolve(compiler.outputPath, this.filePath);

        // Use fs.unlink to delete the file
        await fs.promises.unlink(outputPath);

        console.log(`File removed: ${outputPath}`);
      } catch (error) {
        console.error(`Error removing file: ${this.filePath}`);
        console.error(error);
      }
    });
  }
}

class DownloadFilePlugin {
  constructor(url, outputPath) {
    this.url = url;
    this.outputPath = outputPath;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('DownloadFilePlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'DownloadFilePlugin',
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          try {
            const response = await axios.get(this.url, { responseType: 'arraybuffer' });
            const data = response.data;
            const filename = path.basename(this.url);
            const outputPath = path.join(this.outputPath, filename);

            compilation.emitAsset(outputPath, {
              source: () => data,
              size: () => data.length,
            });
          } catch (error) {
            compilation.errors.push(new Error(error));
          }
        }
      );
    });
  }
}

class CopyFilePlugin {
  constructor(sourceFilePath, targetFilePath) {
    this.sourceFilePath = sourceFilePath;
    this.targetFilePath = targetFilePath;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('CopyFilePlugin', async (compilation) => {
      try {
        const sourcePath = path.resolve(compiler.outputPath, this.sourceFilePath);
        const targetPath = path.resolve(compiler.outputPath, this.targetFilePath);

        // Use fs.copyFile to copy the file
        await fs.promises.copyFile(sourcePath, targetPath);

        console.log(`File copied: ${sourcePath} => ${targetPath}`);
      } catch (error) {
        console.error(`Error copying file: ${this.sourceFilePath}`);
        console.error(error);
      }
    });
  }
}

// Usage in your webpack configuration:
module.exports = (env, argv) => {
  const isCopySW = argv.env && argv.env.copysw === 'true';

  const webpackConfig = {
    entry: "./src/fakedist.js",
    mode: 'development',
    devtool: false,
    output: {
      path: path.resolve(__dirname, "./example"),
      filename: "dist/fakedist.js",
      library: {
        name: 's5clientExample',
        type: 'umd',
      },
    },
    plugins: [
      new DownloadFilePlugin('https://raw.githubusercontent.com/s5-dev/web-proxy/main/static/rust_lib.wasm', '.'),
      new RemoveFilePlugin('dist/fakedist.js'),
    ],
  };

  if (isCopySW) {
    webpackConfig.plugins.push(
      new CopyFilePlugin('sw-local.js', 'sw.js')
    );
  } else {
    webpackConfig.plugins.push(
      new DownloadFilePlugin('https://raw.githubusercontent.com/s5-dev/web-proxy/main/static/sw.js', '.')
    );
  }

  return webpackConfig;
};
