import { ConfigAPI, PluginPass } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';
import { Visitor, NodePath } from '@babel/traverse';
import {
  TaggedTemplateExpression,
  CallExpression,
  isIdentifier,
  isMemberExpression,
  isCallExpression,
  Identifier,
  isArrowFunctionExpression,
  TemplateLiteral,
  MemberExpression,
  TemplateElement,
  Expression,
  isTemplateElement,
  callExpression,
  identifier,
  Program,
  isBlock,
  arrowFunctionExpression,
  isConditionalExpression,
  StringLiteral,
  BinaryExpression,
  NumericLiteral,
  isBinaryExpression,
  isStringLiteral,
  LogicalExpression,
  isLogicalExpression,
  isNumericLiteral,
  isFunctionExpression,
  restElement,
  spreadElement,
  OptionalMemberExpression,
  isOptionalMemberExpression,
  OptionalCallExpression,
  isOptionalCallExpression,
  SpreadElement,
  ArgumentPlaceholder,
} from '@babel/types';
import configuration, { IConfiguration } from './configuration';
import { replace } from './replace';
import createPxToRem from './createPxToRem';

let _pxtorem: Identifier | undefined;
let _used = false;

function isStyledTagged(tagged: TaggedTemplateExpression) {
  const tag = tagged.tag;
  if (isIdentifier(tag)) {
    return isStyled(tag);
  } else if (isMemberExpression(tag)) {
    return isStyledMember(tag);
  } else if (isCallExpression(tag)) {
    return isStyledFunction(tag);
  }
  return false;
}

function isStyledMember(member: MemberExpression): boolean {
  if (isIdentifier(member.object)) {
    return isStyled(member.object);
  } else if (isMemberExpression(member.object)) {
    return isStyledMember(member.object);
  }
  return false;
}

function isStyledFunction(call: CallExpression): boolean {
  const callee = call.callee;
  if (isMemberExpression(callee)) {
    return isStyledMember(callee);
  } else if (isIdentifier(callee)) {
    return isStyled(callee);
  } else if (isCallExpression(callee)) {
    return isStyledFunction(callee);
  }
  return false;
}

function isStyled(id: Identifier): boolean {
  return configuration.config.tags.indexOf(id.name) >= 0;
}

function isPureExpression(
  node: any,
): node is
  | Identifier
  | CallExpression
  | OptionalCallExpression
  | BinaryExpression
  | StringLiteral
  | NumericLiteral
  | MemberExpression
  | OptionalMemberExpression
  | LogicalExpression {
  return (
    isIdentifier(node) ||
    isCallExpression(node) ||
    isOptionalCallExpression(node) ||
    isBinaryExpression(node) ||
    isStringLiteral(node) ||
    isNumericLiteral(node) ||
    isMemberExpression(node) ||
    isOptionalMemberExpression(node) ||
    isLogicalExpression(node)
  );
}

function createCallpxtorem(
  pxtorem: Identifier,
  ...expressions: (Expression | SpreadElement | ArgumentPlaceholder)[]
): CallExpression {
  _used = true;
  return callExpression(pxtorem, expressions);
}

function transformTemplateExpression(expression: Expression, pxtorem: Identifier): Expression {
  if (isArrowFunctionExpression(expression)) {
    if (isBlock(expression.body)) {
      expression.body = createCallpxtorem(pxtorem, arrowFunctionExpression([], expression.body));
    } else if (isPureExpression(expression.body)) {
      expression.body = createCallpxtorem(pxtorem, expression.body);
    } else {
      expression.body = transformTemplateExpression(expression.body, pxtorem);
    }
  } else if (isConditionalExpression(expression)) {
    expression.alternate = transformTemplateExpression(expression.alternate, pxtorem);
    expression.consequent = transformTemplateExpression(expression.consequent, pxtorem);
  } else if (isFunctionExpression(expression)) {
    return arrowFunctionExpression(
      [restElement(identifier('args'))],
      createCallpxtorem(pxtorem, expression, spreadElement(identifier('args'))),
    );
  } else {
    return createCallpxtorem(pxtorem, expression);
  }

  return expression;
}

function transform(template: TemplateLiteral): void {
  if (_pxtorem) {
    const expressions: (Expression | TemplateElement)[] = [
      ...(template.expressions as Expression[]),
      ...template.quasis,
    ];
    expressions.sort((it1, it2) => (it1.start || 0) - (it2.start || 0));
    for (let i = 0; i < expressions.length; i++) {
      const expression = expressions[i];
      if (isTemplateElement(expression)) continue;
      const next = expressions[i + 1];
      if (next && isTemplateElement(next)) {
        const text = next.value?.raw || next.value?.cooked;
        if (text && /^px/.test(text)) {
          const idx = template.expressions.findIndex(it => it === expression);
          if (idx !== -1) {
            template.expressions[idx] = transformTemplateExpression(expression, _pxtorem);
            if (next.value && next.value.raw) {
              next.value.raw = next.value.raw.replace(/^px/, '');
            }
            if (next.value && next.value.cooked) {
              next.value.cooked = next.value.cooked.replace(/^px/, '');
            }
          }
        }
      }
    }
  }
}

export default declare((api: ConfigAPI, options?: IConfiguration) => {
  api.assertVersion(7);
  configuration.updateConfig(options);

  const templateVisitor: Visitor = {
    TemplateElement(path: NodePath<TemplateElement>) {
      const it = path.node;
      if (it.value && it.value.raw) {
        it.value.raw = replace(it.value.raw);
      }
      if (it.value && it.value.cooked) {
        it.value.cooked = replace(it.value.cooked);
      }
    },
    StringLiteral(path: NodePath<StringLiteral>) {
      path.node.value = replace(path.node.value);
    },
  };

  if (configuration.config.transformRuntime) {
    templateVisitor.TemplateLiteral = (path: NodePath<TemplateLiteral>) => {
      transform(path.node);
    };
  }

  const visitor: Visitor<PluginPass> = {
    Program: {
      exit(programPath: NodePath<Program>) {
        if (_used && _pxtorem) {
          programPath.node.body.push(createPxToRem(_pxtorem, configuration.config));
        }
      },
      enter(programPath: NodePath<Program>, state: PluginPass) {
        const filePath = state.file?.opts?.filename;
        const exclude = configuration.config.exclude;
        if (
          filePath &&
          exclude &&
          ((typeof exclude === 'function' && exclude(filePath)) ||
            (typeof exclude === 'string' && filePath.indexOf(exclude) !== -1) ||
            filePath.match(exclude as RegExp) !== null)
        ) {
          return;
        }

        if (configuration.config.transformRuntime) {
          _pxtorem = programPath.scope.generateUidIdentifier('pxtorem');
        } else {
          _pxtorem = undefined;
        }
        _used = false;
        programPath.traverse({
          TaggedTemplateExpression(path: NodePath<TaggedTemplateExpression>) {
            if (isStyledTagged(path.node)) {
              path.traverse(templateVisitor);
            }
          },
          CallExpression(path: NodePath<CallExpression>) {
            if (isStyledFunction(path.node)) {
              path.traverse(templateVisitor);
            }
          },
        });
      },
    },
  };
  return {
    name: 'styled-components-pxtorem',
    visitor,
  };
});
