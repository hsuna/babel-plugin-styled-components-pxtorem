# babel-plugin-styled-components-pxtorem [![MIT](https://img.shields.io/github/license/hsuna/babel-plugin-styled-components-pxtorem?style=plastic)](https://github.com/hsuna/babel-plugin-styled-components-pxtorem/blob/master/LICENSE)

[![npm version](https://img.shields.io/npm/v/babel-plugin-styled-components-pxtorem.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-styled-components-pxtorem) ![NPM Downloads](https://badgen.net/npm/dt/babel-plugin-styled-components-pxtorem) [![Build Status](https://api.travis-ci.org/hsuna/babel-plugin-styled-components-pxtorem.svg)](https://travis-ci.org/hsuna/babel-plugin-styled-components-pxtorem) [![codecov](https://codecov.io/gh/hsuna/babel-plugin-styled-components-pxtorem/branch/master/graph/badge.svg)](https://codecov.io/gh/hsuna/babel-plugin-styled-components-pxtorem)

[Babel](https://babeljs.io/) plugin for convert `px` to `rem` units of [styled-components](https://www.styled-components.com/)

1. Use [postcss-pxtorem](https://www.npmjs.com/package/postcss-pxtorem) to process all css text in template strings.

2. Add a runtime `pxtorem` function polyfill to process expression embedded in template strings when enable [transformRuntime](#transform-runtime) option.

## Table of Contents

- [Requirement](#requirement)
- [Usage](#usage)
- [Configuration](#configuration)
- [Composition](#composition)
- [Options](#options)
- [Transform Runtime](#transform-runtime)
  - [FunctionExpression](#functionexpression)
  - [ArrowFunctionExpression](#arrowfunctionexpression)
  - [MemberExpression](#memberexpression)
  - [ConditionalExpression](#conditionalexpression)
  - [Other Expressions](#other-expressions)

## Requirement

You need to install the following `peerDependencies` of babel-plugin-styled-components-pxtorem into your project at the same time:

```json
{
  "peerDependencies": {
    "@babel/core": "^7.26.0",
    "postcss": "^8.0.0"
  }
}
```

## Usage

see [example](example)

The use of React and styled-components [test cases](example/src/__tests__/index.spec.jsx).

## Configuration

`babel.config.js`:

```js
module.exports = {
  plugins: [
    ['styled-components-pxtorem', { rootValue: 100, unitPrecision: 5, minPixelValue: 0, transformRuntime: false }],
  ],
};
```

or `.babelrc`:

```json
{
  "plugins": [
    [
      "styled-components-pxtorem",
      { "rootValue": 100, "unitPrecision": 5, "minPixelValue": 0, "transformRuntime": false }
    ]
  ]
}
```

## Composition

It should be put before [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components#readme)

```json
{
  "plugins": ["styled-components-pxtorem", "styled-components"]
}
```

## Options

Type: `Object | Null`  
Default:

```js
{
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
}
```

- `rootValue` (Number | Function) Represents the root element font size or returns the root element font size based on the [`input`](https://api.postcss.org/Input.html) parameter
- `unitPrecision` (Number) The decimal numbers to allow the REM units to grow to.
- `propList` (Array) The properties that can change from px to rem.
  - Values need to be exact matches.
  - Use wildcard `*` to enable all properties. Example: `['*']`
  - Use `*` at the start or end of a word. (`['*position*']` will match `background-position-y`)
  - Use `!` to not match a property. Example: `['*', '!letter-spacing']`
  - Combine the "not" prefix with the other prefixes. Example: `['*', '!font*']`
- `selectorBlackList` (Array) The selectors to ignore and leave as px.
  - If value is string, it checks to see if selector contains the string.
    - `['body']` will match `.body-class`
  - If value is regexp, it checks to see if the selector matches the regexp.
    - `[/^body$/]` will match `body` but not `.body`
- `replace` (Boolean) Replaces rules containing rems instead of adding fallbacks.
- `mediaQuery` (Boolean) Allow px to be converted in media queries.
- `minPixelValue` (Number) Set the minimum pixel value to replace.
- `exclude` (String, Regexp, Function) The file path to ignore and leave as px.
  - If value is string, it checks to see if file path contains the string.
    - `'exclude'` will match `\project\postcss-pxtorem\exclude\path`
  - If value is regexp, it checks to see if file path matches the regexp.
    - `/exclude/i` will match `\project\postcss-pxtorem\exclude\path`
  - If value is function, you can use exclude function to return a true and the file will be ignored.
    - the callback will pass the file path as a parameter, it should returns a Boolean result.
    - `function (file) { return file.indexOf('exclude') !== -1; }`
- `unit` (String) Set the default unit to convert, default is `px`.
- `tags` (Array) [styled-components](https://www.styled-components.com/) template literal [tagged](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- `transformRuntime` (Boolean) since 1.1.0，enable transformation of all expressions that embedded in template strings

Simple version of the formula：

```js
const input = '32px'; // the value in css text
const pixels = parseFloat(input);

if (Math.abs(pixels) < minPixelValue) {
  return input;
}

const fixedVal = toFixed(pixels / rootValue, unitPrecision);

return `${fixedVal}rem`;
```

Remaining options are consistent with [postcss-pxtorem](https://www.npmjs.com/package/postcss-pxtorem#readme).

## Transform Runtime

If enabled `transformRuntime` option, all supported expressions embedded in template strings are processed as follows:

**Note:** Only expression that end with `px` will be processed.

### FunctionExpression

source code:

```javascript
import styled from 'styled-components';

export const FunctionExpression = styled.button`
  height: ${function(props) {
    return props.height;
  }}px;
`;
```

compiled:

```javascript
import styled from 'styled-components';

export const FunctionExpression = styled.button`
  height: ${(...args) =>
    _pxtorem(function(props) {
      return props.height;
    }, ...args)};
`;

function _pxtorem(input, ...args) {
  if (typeof input === 'function') return _pxtorem(input(...args), ...args);
  var value = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : 0;
  var pixels = Number.isNaN(value) ? 0 : value;
  if (Math.abs(pixels) < 0) return pixels + 'px';
  var mul = Math.pow(10, 5 + 1);
  return (Math.round(Math.floor(((pixels * 1) / 100) * mul) / 10) * 10) / mul + 'rem';
}
```

### ArrowFunctionExpression

source code:

```javascript
import styled from 'styled-components';

const height = '44';
export const ArrowFunction = styled.input.attrs(props => ({
  type: 'password',
  size: props.size || '16px',
  width: props.width || 100,
}))`
  color: palevioletred;
  font-size: 14px;
  border: 1px solid palevioletred;
  border-radius: 8px;
  width: ${props => props.width}px; /* MemberExpression Body */
  height: ${() => height}px; /* Identifier Body */
  line-height: ${() => '44'}px; /* StringLiteral Body */
  margin: ${() => 32}px; /* NumericLiteral Body */
  padding: ${props => props.size};
`;

export const ArrowFunctionWithBlockBody = styled.button`
  width: ${props => {
    if (props.width) {
      return props.width;
    } else {
      return 0;
    }
  }}px; /* Block Body */

  ${props => (props.disabled ? 'height: 400px' : 'height: 200px')};
`;

export const ArrowFunctionWithBinaryBody = styled.button`
  ${props =>
    props.disabled &&
    `
    width: 200px;
    font-size: 14px;
  `};
  height: ${props => !props.disabled && props.height}px; /* LogicalExpression Body */
  width: ${() => 44 + 50}px; /* BinaryExpression Body */
`;

export const ArrowFunctionWithConditionalBody = styled.button`
  height: ${props => (props.height ? height : 100)}px; /* ConditionalExpression Body */
`;
```

compiled:

```javascript
import styled from 'styled-components';

const height = '44';
export const ArrowFunction = styled.input.attrs(props => ({
  type: 'password',
  size: props.size || '0.16rem',
  width: props.width || 100,
}))`
  color: palevioletred;
  font-size: 0.14rem;
  border: 1px solid palevioletred;
  border-radius: 0.08rem;
  width: ${props => _pxtorem(props.width)}; /* PropertyAccess Body */
  height: ${() => _pxtorem(height)}; /* Identifier Body */
  line-height: ${() => _pxtorem('44')}; /* StringLiteral Body */
  margin: ${() => _pxtorem(32)}; /* NumericLiteral Body */
  padding: ${props => props.size};
`;

export const ArrowFunctionWithBlockBody = styled.button`
  width: ${props =>
    _pxtorem(() => {
      if (props.width) {
        return props.width;
      } else {
        return 0;
      }
    })}; /* Block Body */

  ${props => (props.disabled ? 'height: 4rem' : 'height: 2rem')};
`;

export const ArrowFunctionWithBinaryBody = styled.button`
  ${props =>
    props.disabled &&
    `
    width: 2rem;
    font-size: 0.14rem;
  `};
  height: ${props => _pxtorem(!props.disabled && props.height)}; /* ArrowFunction with a LogicalExpression Body */
  width: ${() => _pxtorem(44 + 50)}; /* ArrowFunction with a BinaryExpression Body */
`;

export const ArrowFunctionWithConditionalBody = styled.button`
  height: ${props =>
    props.height ? _pxtorem(height) : _pxtorem(100)}; /* ArrowFunction with a ConditionalExpression Body */
`;

function _pxtorem(input, ...args) {
  if (typeof input === 'function') return _pxtorem(input(...args), ...args);
  var value = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : 0;
  var pixels = Number.isNaN(value) ? 0 : value;
  if (Math.abs(pixels) < 0) return pixels + 'px';
  var mul = Math.pow(10, 5 + 1);
  return (Math.round(Math.floor(((pixels * 1) / 100) * mul) / 10) * 10) / mul + 'rem';
}
```

### MemberExpression

source code:

```javascript
import styled from 'styled-components';

export const MemberExpression = styled.button(
  props => `
  display: inline;
  width: ${props.width}px;
  height: ${props.height}; /* Note: Only expression end with 'px' will be processed. */
  font-size: 16px;
`,
);
```

compiled:

```javascript
import styled from 'styled-components';

export const MemberExpression = styled.button(
  props => `
  display: inline;
  width: ${_pxtorem(props.width)};
  height: ${props.height}; /* Note: Only expression end with 'px' will be processed. */
  font-size: 0.16rem;
`,
);

function _pxtorem(input, ...args) {
  if (typeof input === 'function') return _pxtorem(input(...args), ...args);
  var value = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : 0;
  var pixels = Number.isNaN(value) ? 0 : value;
  if (Math.abs(pixels) < 0) return pixels + 'px';
  var mul = Math.pow(10, 5 + 1);
  return (Math.round(Math.floor(((pixels * 1) / 100) * mul) / 10) * 10) / mul + 'rem';
}
```

### ConditionalExpression

source code:

```jsx harmony
import React from 'react';
import styled from 'styled-components';

export const ConditionalExpression = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize === 'number' ? fontSize : props => props.theme.fontSize}px;
  `;

  return <StyledButton />;
};
export const ConditionalExpressionWhenTrue = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize !== 'number' ? props => props.theme.fontSize : fontSize}px;
  `;

  return <StyledButton />;
};
export const ConditionalExpressionWhenFalse = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize === 'number' ? fontSize : 16}px;
  `;

  return <StyledButton />;
};
```

compiled:

```javascript
import React from 'react';
import styled from 'styled-components';

export const ConditionalExpression = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize === 'number' ? _pxtorem(fontSize) : props => _pxtorem(props.theme.fontSize)};
  `;
  return React.createElement(StyledButton, null);
};
export const ConditionalExpressionWhenTrue = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize !== 'number' ? props => _pxtorem(props.theme.fontSize) : _pxtorem(fontSize)};
  `;
  return React.createElement(StyledButton, null);
};
export const ConditionalExpressionWhenFalse = function({ fontSize } = {}) {
  const StyledButton = styled.button`
    font-size: ${typeof fontSize === 'number' ? _pxtorem(fontSize) : _pxtorem(16)};
  `;
  return React.createElement(StyledButton, null);
};

function _pxtorem(input, ...args) {
  if (typeof input === 'function') return _pxtorem(input(...args), ...args);
  var value = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : 0;
  var pixels = Number.isNaN(value) ? 0 : value;
  if (Math.abs(pixels) < 0) return pixels + 'px';
  var mul = Math.pow(10, 5 + 1);
  return (Math.round(Math.floor(((pixels * 1) / 100) * mul) / 10) * 10) / mul + 'rem';
}
```

### Other Expressions

Identifier, CallExpression, BinaryExpress, StringLiteral, NumericLiteral, MemberExpression, LogicalExpression...

source code:

```javascript
import styled, { css, createGlobalStyle } from 'styled-components';

const fontSize = 18;
function getHeight() {
  const height = 100;

  return height / 2;
}
const mixins = css`
  padding: 0 16px;
  margin: 16px 32px 16px 32px;
`;
export const GlobalStyle = createGlobalStyle`
  html body {
    ${mixins};
    font-size: ${fontSize}px; /* Identifier */
    width: 1024px;
    height: ${getHeight()}px; /* CallExpression */
  }
`;

const condition = false;
function calc() {
  return 20;
}
export const BinaryAndLogicExpression = styled.button`
  ${condition ||
    `
    width: 200px;
  `};
  height: ${condition || 100}px; /* LogicExpression */
  padding: ${40 + 50}px 8px ${4}px 16px; /* BinaryExpression */
  line-height: ${calc() - 2}px; /* BinaryExpression */
`;
```

compiled:

```javascript
import styled, { css, createGlobalStyle } from 'styled-components';

const fontSize = 18;

function getHeight() {
  const height = 100;
  return height / 2;
}

const mixins = css`
  padding: 0 0.16rem;
  margin: 0.16rem 0.32rem 0.16rem 0.32rem;
`;
export const GlobalStyle = createGlobalStyle`
  html body {
    ${mixins};
    font-size: ${_pxtorem(fontSize)}; /* Identifier */
    width: 10.24rem;
    height: ${_pxtorem(getHeight())}; /* CallExpression */
  }
`;

const condition = false;

function calc() {
  return 20;
}

export const BinaryAndLogicExpression = styled.button`
  ${condition ||
    `
    width: 2rem;
  `};
  height: ${_pxtorem(condition || 100)};
  padding: ${_pxtorem(40 + 50)} 0.08rem ${_pxtorem(4)} 0.16rem;
  line-height: ${_pxtorem(calc() - 2)};
`;

function _pxtorem(input, ...args) {
  if (typeof input === 'function') return _pxtorem(input(...args), ...args);
  var value = typeof input === 'string' ? parseFloat(input) : typeof input === 'number' ? input : 0;
  var pixels = Number.isNaN(value) ? 0 : value;
  if (Math.abs(pixels) < 0) return pixels + 'px';
  var mul = Math.pow(10, 5 + 1);
  return (Math.round(Math.floor(((pixels * 1) / 100) * mul) / 10) * 10) / mul + 'rem';
}
```
