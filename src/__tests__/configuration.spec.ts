import { ConfigurationManager } from '../configuration';

describe('configuration', () => {
  let configuration: ConfigurationManager;
  beforeEach(() => {
    configuration = new ConfigurationManager();
  });
  it('should return default configuration', function() {
    expect(configuration.config).toEqual({
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
    });
  });
  it('should return update configuration', function() {
    configuration.updateConfig({ rootValue: 75, tags: ['sty', 'inject'] });
    expect(configuration.config).toEqual({
      rootValue: 75,
      unitPrecision: 5,
      selectorBlackList: [],
      propList: ['*'],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0,
      exclude: null,
      unit: 'px',
      tags: ['sty', 'inject'],
      transformRuntime: false,
    });
  });
  it('should return ignored undefined config', function() {
    configuration.updateConfig({});
    expect(configuration.config).toEqual({
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
    });
  });
});
