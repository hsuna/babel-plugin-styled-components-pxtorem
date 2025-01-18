module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    [
      'styled-components-pxtorem',
      {
        rootValue: 100, // 根据设计稿尺寸设置，例如设计稿是750px，则rootValue=750/10=75
        propList: ['*'], // 表示所有的属性都将被转换
        selectorBlackList: [], // (可选) 忽略的选择器，避免不必要的转换
        replace: true, // 替换包含 rem 的规则，而不是添加回退
        mediaQuery: false, // (默认 false) 允许在媒体查询中转换 px
        unitPrecision: 5, // 转化精度，5位小数
        minPixelValue: 0, // 设置要替换的最小像素值
      },
    ],
  ],
  env: {
    test: {
      presets: ['@babel/preset-env', '@babel/preset-react'],
    },
  },
};
