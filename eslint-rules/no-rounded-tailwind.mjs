const ROUNDED_CLASS_PATTERN = /(^|\s)rounded(-[\w/]+)?(\s|$)/;

function extractClassValue(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join("");
  }
  if (node.type === "JSXExpressionContainer") {
    return extractClassValue(node.expression);
  }
  return null;
}

const noRoundedTailwind = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when Tailwind rounded-* utilities are used.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== "className") return;
        const classValue = extractClassValue(node.value);
        if (!classValue) return;
        if (ROUNDED_CLASS_PATTERN.test(classValue)) {
          context.report({
            node,
            message:
              "Avoid rounded-* utilities. The design system requires sharp corners.",
          });
        }
      },
    };
  },
};

export default noRoundedTailwind;
