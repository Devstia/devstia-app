module.exports = {
    packagerConfig: {
        name: 'Devstia',
        icon: './images/dev_pw',
        osxSign: {},
        osxNotarize: {
            tool: 'notarytool',
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID
        }
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
            
            // Remove unused binaries from builds
            if (options.platform === 'darwin') {
                const assetsDir = path.resolve(options.outputPaths[0], 'Devstia.app', 'Contents', 'Resources', 'app');
                if (options.arch === 'arm64') {

                    // Purge x86_64 binaries from Apple Silicon build
                    const darwin_x64 = path.resolve(assetsDir, 'runtime', 'darwin_x64');
                    await fs.promises.rmdir(darwin_x64, { recursive: true });
                    console.log(`Excluded darwin_x64 directory for Apple Silicon build.`);
                }else{

                    // Purge arm64 binaries from Intel build
                    const darwin_arm64 = path.resolve(assetsDir, 'runtime', 'darwin_arm64');
                    await fs.promises.rmdir(darwin_arm64, { recursive: true });
                    console.log(`Excluded darwin_arm64 directory for Intel build.`);
                }

                // Remove win32_x64 directory from macOS builds
                const win32_x64 = path.resolve(assetsDir, 'runtime', 'win32_x64');
                await fs.promises.rmdir(win32_x64, { recursive: true });
                console.log(`Excluded win32_x64 directory for macOS build.`);
            }
            if (options.platform === 'win32') {

                // Remove darwin_x64 and darwin_arm64 directories from Windows build                
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
