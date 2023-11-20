module.exports = {
    packagerConfig: {
        name: 'Devstia',
        icon: './images/dev_pw'
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    hooks: {
        postPackage: async (forgeConfig, options) => {
            const path = require('path');
            const fs = require('fs');
            
            // Remove win32_x64 directory from macOS build
            if (options.platform === 'darwin') {
                const assetsDir = path.resolve(options.outputPaths[0], 'Devstia.app', 'Contents', 'Resources', 'app');
                const win32_x64 = path.resolve(assetsDir, 'runtime', 'win32_x64');
                await fs.promises.rmdir(win32_x64, { recursive: true });
                console.log(`Excluded win32_x64 directory for macOS build.`);
            }
            
            // Remove darwin_x64 and darwin_arm64 directories from Windows build
            if (options.platform === 'win32') {
                const assetsDir = path.resolve(options.outputPaths[0], 'resources', 'app');
                const darwin_x64 = path.resolve(assetsDir, 'runtime', 'darwin_x64');
                await fs.promises.rmdir(darwin_x64, { recursive: true });
                console.log(`Excluded darwin_x64 directory for Windows build.`);
                const darwin_arm64 = path.resolve(assetsDir, 'runtime', 'darwin_arm64');
                await fs.promises.rmdir(darwin_arm64, { recursive: true });
                console.log(`Excluded darwin_arm64 directory for Windows build.`);
            }
        }
    }
};
