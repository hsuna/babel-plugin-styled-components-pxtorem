import postcss from 'postcss';
import memoize from 'memoizerific';
import pxtorem from 'postcss-pxtorem';
import scss from 'postcss-scss';
import configuration from './configuration';

const FAKE_OPENING_WRAPPER = 'styled-fake-wrapper/* start of styled-fake-wrapper */{';
const FAKE_CLOSING_WRAPPER = '}/* end of styled-fake-wrapper */';
const FAKE_RULE = '/* start of styled-fake-rule */padding:/* end of styled-fake-rule */';
const GEN_PAIR_REG = (unit: string) => new RegExp(`[\\s\\w-]+:([\\s-\\d\.]+${unit})+`);
const GEN_UNIT_REG = (unit: string) => new RegExp(`([\\s-\\d\.]+${unit})+`);

function process(css: string): string {
  const { tags, transformRuntime, ...otherOptions } = configuration.config;
  return postcss([pxtorem(otherOptions)]).process(css, {
    syntax: scss,
  }).css;
}

function replaceWithRetry(cssText: string, retry = 1): string {
  const PAIR_REG = GEN_PAIR_REG(configuration.config.unit);
  const UNIT_REG = GEN_UNIT_REG(configuration.config.unit);

  try {
    if (PAIR_REG.test(cssText)) {
      const replaced = process(`${FAKE_OPENING_WRAPPER}${cssText}${FAKE_CLOSING_WRAPPER}`);
      return replaced.replace(FAKE_OPENING_WRAPPER, '').replace(FAKE_CLOSING_WRAPPER, '');
    } else if (UNIT_REG.test(cssText)) {
      return cssText.replace(new RegExp(UNIT_REG, 'g'), token => {
        const replaced = process(`${FAKE_RULE}${token}`);
        return replaced.replace(FAKE_RULE, '');
      });
    } else {
      return cssText;
    }
  } catch (ignored) {
    if (retry > 0) {
      return cssText.replace(new RegExp(PAIR_REG, 'g'), token => replaceWithRetry(token, retry - 1));
    } else {
      return cssText;
    }
  }
}

export const replace = memoize(10)(function(cssText: string): string {
  return replaceWithRetry(cssText);
});
