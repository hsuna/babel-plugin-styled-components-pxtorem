import { identifier } from '@babel/types';
import generate from '@babel/generator';
import { runInNewContext } from 'vm';
import createPxToRem from '../createPxToRem';
import configuration, { IConfiguration } from '../configuration';

function pxtorem(
  value: string,
  {
    rootValue = configuration.config.rootValue,
    unitPrecision = configuration.config.unitPrecision,
    minPixelValue = configuration.config.minPixelValue,
  }: Partial<IConfiguration> = configuration.config,
): string {
  const sandbox = { result: '' };
  const ast = createPxToRem(identifier('pxtorem'), { rootValue, unitPrecision, minPixelValue });
  const code = generate(ast).code;
  runInNewContext(`${code} result = pxtorem(${value});`, sandbox);
  return sandbox.result;
}

it('should match snapshot', function() {
  const ast = createPxToRem(identifier('pxtorem'), configuration.config);
  expect(generate(ast).code).toMatchSnapshot();
});

it('should transform String', function() {
  expect(pxtorem("'-100px'")).toBe('-1rem');
  expect(pxtorem("'32px'")).toBe('0.32rem');
  expect(pxtorem("'11.3333333px'")).toBe('0.11333rem');
  expect(pxtorem("'-11.3333333px'")).toBe('-0.11333rem');
});

it('should transform Number', function() {
  expect(pxtorem('16')).toBe('0.16rem');
  expect(pxtorem('16.3333333')).toBe('0.16333rem');
  expect(pxtorem('-16')).toBe('-0.16rem');
  expect(pxtorem('-16.3333333')).toBe('-0.16333rem');
});

it('should transform Function', function() {
  expect(pxtorem('function() {return 20;}')).toBe('0.2rem');
  expect(pxtorem('function(props) { return props.width / 2; }, { width: 100 }')).toBe('0.5rem');
});

it('should ignore value less than "minPixelValue" option', function() {
  const options = { minPixelValue: 2 };
  expect(pxtorem("'1px'", options)).toBe('1px');
  expect(pxtorem('1', options)).toBe('1px');
  expect(pxtorem("'1.3333333px'", options)).toBe('1.3333333px');
  expect(pxtorem('1.3333333', options)).toBe('1.3333333px');
  expect(pxtorem("'-1px'", options)).toBe('-1px');
  expect(pxtorem('-1', options)).toBe('-1px');
  expect(pxtorem("'-1.3333333px'", options)).toBe('-1.3333333px');
  expect(pxtorem('-1.3333333', options)).toBe('-1.3333333px');
  expect(pxtorem('function() {return 1;}', options)).toBe('1px');
  expect(pxtorem('function() {return "1px";}', options)).toBe('1px');
  expect(pxtorem('function(props) { return props.width / 2; }, { width: 2 }', options)).toBe('1px');
  expect(pxtorem('function(props) { return props.width / 2 + "px"; }, { width: 2 }', options)).toBe('1px');
});
