export interface IConfiguration {
  readonly rootValue: number | Function;
  readonly unitPrecision: number;
  readonly propList: ReadonlyArray<string>;
  readonly selectorBlackList: ReadonlyArray<string>;
  readonly replace: boolean;
  readonly mediaQuery: boolean;
  readonly minPixelValue: number;
  readonly exclude: string | RegExp | Function | null;
  readonly unit: string;

  readonly tags: ReadonlyArray<string>;
  readonly transformRuntime: boolean;
}

export class ConfigurationManager {
  private static readonly defaultConfiguration: IConfiguration = {
    rootValue: 100,
    unitPrecision: 5,
    selectorBlackList: [],
    propList: ['*'],
    replace: true,
    mediaQuery: false,
    minPixelValue: 0,
    exclude: null,
    unit: 'px',
    tags: ['styled', 'css', 'createGlobalStyle', 'keyframes'],
    transformRuntime: false,
  };
  private _config: IConfiguration = ConfigurationManager.defaultConfiguration;

  public get config(): IConfiguration {
    return this._config;
  }

  public updateConfig(config?: Partial<IConfiguration>): void {
    if (config) {
      this._config = Object.assign({}, ConfigurationManager.defaultConfiguration, config);
    }
  }
}

export default new ConfigurationManager();
