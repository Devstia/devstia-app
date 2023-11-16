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
            // Remove win32_x86 directory from macOS build
            if (options.platform === 'darwin') {
                const path = require('path');
                const assetsDir = path.resolve(options.outputPaths[0], 'Devstia.app', 'Contents', 'Resources', 'app');
                const win32_x86 = path.resolve(assetsDir, 'runtime', 'win32_x86');
                const fs = require('fs');
                await fs.promises.rmdir(win32_x86, { recursive: true });
                console.log(`Excluded win32_x86 directory for macOS build.`);
            }
        }
    }
};
