declare module 'postcss-pxtorem' {
  import { OldPlugin } from 'postcss';
  interface IpxtoremOptions {
    rootValue: number | Function;
    unitPrecision: number;
    propList: ReadonlyArray<string>;
    selectorBlackList: ReadonlyArray<string>;
    replace: boolean;
    mediaQuery: boolean;
    minPixelValue: number;
    exclude: string | RegExp | Function | null;
    unit?: string;
  }

  const pxtorem: OldPlugin<IpxtoremOptions>;

  export = pxtorem;
}
declare module 'postcss-scss';
