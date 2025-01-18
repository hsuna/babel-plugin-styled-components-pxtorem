import { identifier, Identifier, numericLiteral, Statement } from '@babel/types';
import templateBuild from '@babel/template';
import { IConfiguration } from './configuration';

const source = `function %%pxtorem%%(%%input%%, ...args) {
    if (typeof %%input%% === 'function') return %%pxtorem%%(%%input%%(...args), ...args);
    var value = typeof %%input%% === 'string' ? parseFloat(%%input%%) : typeof %%input%% === 'number' ? %%input%% : 0;
    var pixels = (Number.isNaN(value) ? 0 : value);
    if (Math.abs(pixels) < %%minPixelValue%%) return pixels + 'px';
    var mul = Math.pow(10, %%unitPrecision%% + 1);
    return ((Math.round(Math.floor((pixels / %%rootValue%%) * mul) / 10) * 10) / mul) + 'rem';
}`;

export type IpxtoremOptions = Pick<IConfiguration, 'rootValue' | 'unitPrecision' | 'minPixelValue'>;

export default (_pxtorem: Identifier, config: IpxtoremOptions): Statement => {
  const template = templateBuild.statement(source);
  return template({
    input: identifier('input'),
    pxtorem: _pxtorem,
    rootValue: numericLiteral(typeof config.rootValue === 'function' ? config.rootValue() : config.rootValue),
    unitPrecision: numericLiteral(config.unitPrecision),
    minPixelValue: numericLiteral(config.minPixelValue),
  });
};
