const defaultPattern = '^(fetch|send)[A-Z]';

/**
 * Every request function (named by `pattern`, `fetch*` / `send*` by default)
 * must be the first argument of a mockable() call in the same file.
 */
export const requireMockable = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require every request function to be passed to mockable() in the same file.',
    },
    schema: [
      {
        type: 'object',
        properties: { pattern: { type: 'string' } },
        additionalProperties: false,
      },
    ],
    messages: {
      unwrapped:
        'Pass {{name}} to mockable() in this file, as its first argument.',
    },
  },
  create(context) {
    const pattern = new RegExp(context.options[0]?.pattern ?? defaultPattern);
    /** @type {{ name: string, node: import('estree').Identifier }[]} */
    const declared = [];
    /** @type {Set<string>} */
    const wrapped = new Set();

    /**
     * @param {string} name
     * @param {import('estree').Identifier} node
     */
    function noteFunction(name, node) {
      if (pattern.test(name)) declared.push({ name, node });
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) noteFunction(node.id.name, node.id);
      },
      // `const fetchUsers = async () => {}` names the function on the variable.
      // A named function expression is recorded from its own id instead.
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init) return;
        const init = node.init;
        const anonymous =
          init.type === 'ArrowFunctionExpression' ||
          (init.type === 'FunctionExpression' && !init.id);
        if (anonymous) noteFunction(node.id.name, node.id);
      },
      FunctionExpression(node) {
        if (node.id) noteFunction(node.id.name, node.id);
      },
      CallExpression(node) {
        const first = node.arguments[0];
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'mockable' &&
          first?.type === 'Identifier'
        ) {
          wrapped.add(first.name);
        }
      },
      'Program:exit'() {
        for (const fn of declared) {
          if (!wrapped.has(fn.name)) {
            context.report({
              node: fn.node,
              messageId: 'unwrapped',
              data: { name: fn.name },
            });
          }
        }
      },
    };
  },
};
