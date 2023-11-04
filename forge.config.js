module.exports = {
    packagerConfig: {
        name: 'Devstia',
        icon: './images/dev_pws'
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
            // Remove win32_x64 directory from macOS build
            if (options.platform === 'darwin') {
                const path = require('path');
                const assetsDir = path.resolve(options.outputPaths[0], 'Devstia.app', 'Contents', 'Resources', 'app');
                const win32_x64 = path.resolve(assetsDir, 'runtime', 'win32_x64');
                const fs = require('fs');
                await fs.promises.rmdir(win32_x64, { recursive: true });
                console.log(`Excluded win32_x64 directory for macOS build.`);
            }
        }
    }
};
