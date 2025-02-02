import {
  Import,
  isTypescript,
  createRuntimeExportsUtils,
} from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

export default core.createPlugin(
  () => ({
    config() {
      const appContext = core.useAppContext();

      const pluginsExportsUtils = createRuntimeExportsUtils(
        appContext.internalDirectory,
        'plugins',
      );

      return {
        source: {
          alias: {
            '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
          },
        },
      };
    },
    // app-tools and module-tools `dev storybook`
    commands({ program }: any) {
      const { appDirectory } = core.useAppContext();
      const devCommand = program.commandsMap.get('dev');
      const stories =
        program.$$libraryName === 'module-tools'
          ? [
              `./stories/**/*.stories.mdx`,
              `./stories/**/*.stories.@(js|jsx|ts|tsx)`,
            ]
          : [`./src/**/*.stories.@(js|jsx|ts|tsx|mdx)`];
      if (devCommand) {
        devCommand.command('story').action(async () => {
          await features.runDev({
            isTsProject: isTypescript(appDirectory),
            stories,
            isModuleTools: program.$$libraryName === 'module-tools',
          });
        });
        // Both story and storybook subcommands are supported
        devCommand.command('storybook').action(async () => {
          await features.runDev({
            isTsProject: isTypescript(appDirectory),
            stories,
            isModuleTools: program.$$libraryName === 'module-tools',
          });
        });
      }
    },
    // module-tools build platform
    platformBuild({ isTsProject }: any) {
      return {
        name: 'storybook',
        title: 'Run Storybook log',
        taskPath: require.resolve('./build-task'),
        params: [...(isTsProject ? ['--isTsProject'] : [])],
      };
    },
    // module-tools menu mode
    moduleToolsMenu() {
      return {
        name: 'Storybook 调试',
        value: 'storybook',
        aliasValues: ['story'],
        runTask: ({ isTsProject = false }: { isTsProject: boolean }) =>
          features.runDev({
            isTsProject,
            stories: [
              `./stories/**/*.stories.mdx`,
              `./stories/**/*.stories.@(js|jsx|ts|tsx)`,
            ],
          }),
      };
    },
  }),
  { name: '@modern-js/plugin-storybook' },
);
