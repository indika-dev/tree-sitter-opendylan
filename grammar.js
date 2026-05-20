/**
 * Tree‑sitter grammar for OpenDylan
 * -------------------------------------------------
 * Save this file as `grammar.js` in the root of your
 * tree-sitter‑opendylan repository.
 *
 * Usage:
 *   npm install
 *   npm run generate
 *   npm test
 *
 * The grammar follows the official Dylan syntax
 * (ISO/IEC 20970) and the OpenDylan extensions.
 */

module.exports = grammar({
  name: "opendylan",

  // -------------------------------------------------
  // 1.  Extras (whitespace, comments)
  // -------------------------------------------------
  extras: ($) => [
    /\s/, // spaces, tabs, newlines
    $.line_comment,
    $.block_comment,
  ],

  // -------------------------------------------------
  // 2.  Word (identifier) definition
  // -------------------------------------------------
  word: ($) => $._identifier,

  // -------------------------------------------------
  // 3.  Primary rules (top‑level constructs)
  // -------------------------------------------------
  rules: {
    // ----- Module -------------------------------------------------
    module: ($) =>
      seq(
        optional($.module_attributes),
        "module",
        field("name", $._identifier),
        repeat($.definition),
        "end", // optional end‑keyword
      ),

    // ----- Top‑level definitions ---------------------------------
    definition: ($) =>
      choice(
        $.class_definition,
        $.function_definition,
        $.variable_definition,
        $.macro_definition,
        $.interface_definition,
        $.library_definition,
        $.import_statement,
        $.export_statement,
      ),

    // ----- Class -------------------------------------------------
    class_definition: ($) =>
      seq(
        optional("abstract"),
        optional("sealed"),
        "class",
        field("name", $._identifier),
        optional(seq("<", $.type_parameter_list, ">")),
        optional(seq("is", $.superclass_list)),
        repeat($.slot_definition),
        "end",
      ),

    slot_definition: ($) =>
      seq(
        optional("constant"),
        optional("readable"),
        optional("writeable"),
        "slot",
        field("name", $._identifier),
        optional(seq("::", $.type)),
        optional(seq("=", $.expression)),
      ),

    // ----- Function / Method ---------------------------------------
    function_definition: ($) =>
      seq(
        optional("define"),
        choice("function", "method"),
        field("name", $._identifier),
        optional(seq("(", $.parameter_list, ")")),
        optional(seq("::", $.type)),
        optional(seq("=>", $.type)), // return types for methods
        optional(seq("=", $.expression)),
        "end",
      ),

    // ----- Variable / Constant ------------------------------------
    variable_definition: ($) =>
      seq(
        choice("define", "let", "constant"),
        field("name", $._identifier),
        optional(seq("::", $.type)),
        optional(seq("=", $.expression)),
      ),

    // ----- Macro ---------------------------------------------------
    macro_definition: ($) =>
      seq(
        "define",
        "macro",
        field("name", $._identifier),
        optional(seq("(", $.parameter_list, ")")),
        repeat($.macro_body),
        "end",
      ),

    macro_body: ($) => choice($.expression, $.comment),

    // ----- Interface ------------------------------------------------
    interface_definition: ($) =>
      seq(
        "define",
        "interface",
        field("name", $._identifier),
        optional(seq("(", $.parameter_list, ")")),
        repeat($.method_signature),
        "end",
      ),

    method_signature: ($) =>
      seq(
        "method",
        field("name", $._identifier),
        optional(seq("(", $.parameter_list, ")")),
        optional(seq("::", $.type)),
      ),

    // ----- Library -------------------------------------------------
    library_definition: ($) =>
      seq(
        "define",
        "library",
        field("name", $._identifier),
        repeat($.library_body),
        "end",
      ),

    library_body: ($) =>
      choice($.import_statement, $.export_statement, $.definition),

    // ----- Import / Export -----------------------------------------
    import_statement: ($) =>
      seq(
        "import",
        field("module", $._identifier),
        optional(seq("as", $._identifier)),
      ),

    export_statement: ($) => seq("export", $.export_list),

    export_list: ($) => sepBy1($.export_item, ","),

    export_item: ($) => $._identifier,

    // ----- Types ---------------------------------------------------
    type: ($) =>
      choice(
        $._identifier,
        $.type_application,
        $.type_union,
        $.type_intersection,
        $.type_constrained,
        $.type_tuple,
      ),

    type_application: ($) =>
      seq(field("base", $._identifier), "<", sepBy1($.type, ","), ">"),

    type_union: ($) => sepBy1($.type, "|"),

    type_intersection: ($) => sepBy1($.type, "&"),

    type_constrained: ($) => seq($.type, "[", $.type_constraint, "]"),

    type_constraint: ($) => choice($.type, $.type_application),

    type_tuple: ($) => seq("#(", sepBy($.type, ","), ")"),

    // ----- Parameters -----------------------------------------------
    parameter_list: ($) => sepBy($.parameter, ","),

    parameter: ($) =>
      seq(
        optional($.parameter_modifier),
        field("name", $._identifier),
        optional(seq("::", $.type)),
        optional(seq("=", $.expression)),
      ),

    parameter_modifier: ($) =>
      choice("required", "optional", "rest", "key", "all-keys"),

    // ----- Expressions -----------------------------------------------
    expression: ($) =>
      choice(
        $.literal,
        $.identifier,
        $.call_expression,
        $.binary_expression,
        $.unary_expression,
        $.if_expression,
        $.let_expression,
        $.begin_expression,
        $.block_expression,
        $.case_expression,
        $.lambda_expression,
        $.quote_expression,
        $.array_literal,
        $.hash_literal,
        $.tuple_literal,
      ),

    call_expression: ($) =>
      seq(field("function", $.expression), "(", optional($.argument_list), ")"),

    argument_list: ($) => sepBy($.argument, ","),

    argument: ($) =>
      choice($.expression, seq($.keyword_argument_name, ":", $.expression)),

    keyword_argument_name: ($) => $._identifier,

    binary_expression: ($) =>
      prec.left(
        choice(
          seq($.expression, "+", $.expression),
          seq($.expression, "-", $.expression),
          seq($.expression, "*", $.expression),
          seq($.expression, "/", $.expression),
          seq($.expression, "=", $.expression),
          seq($.expression, "/=", $.expression),
          seq($.expression, "<", $.expression),
          seq($.expression, ">", $.expression),
          seq($.expression, "<=", $.expression),
          seq($.expression, ">=", $.expression),
          seq($.expression, "and", $.expression),
          seq($.expression, "or", $.expression),
        ),
      ),

    unary_expression: ($) =>
      prec.right(
        choice(
          seq("~", $.expression),
          seq("not", $.expression),
          seq("-", $.expression),
          seq("+", $.expression),
        ),
      ),

    if_expression: ($) =>
      seq(
        "if",
        "(",
        $.expression,
        ")",
        $.expression,
        optional(seq("else", $.expression)),
      ),

    let_expression: ($) => seq("let", "(", $.binding_list, ")", $.expression),

    binding_list: ($) => sepBy1($.binding, ","),

    binding: ($) =>
      seq(
        field("name", $._identifier),
        optional(seq("::", $.type)),
        "=",
        $.expression,
      ),

    begin_expression: ($) => seq("begin", repeat($.expression), "end"),

    block_expression: ($) => seq("{", repeat($.expression), "}"),

    case_expression: ($) =>
      seq("case", "(", $.expression, ")", repeat($.case_clause), "end"),

    case_clause: ($) => seq("of", $.pattern, "=>", $.expression),

    pattern: ($) => choice($.literal, $.identifier),

    lambda_expression: ($) =>
      seq("lambda", "(", optional($.parameter_list), ")", $.expression),

    quote_expression: ($) => seq("`", $.expression),

    array_literal: ($) => seq("#(", repeat($.expression), ")"),

    hash_literal: ($) =>
      seq("#hash(", repeat(seq($.expression, ":", $.expression)), ")"),

    tuple_literal: ($) => seq("#(", sepBy($.expression, ","), ")"),

    // ----- Literals -------------------------------------------------
    literal: ($) =>
      choice(
        $.integer,
        $.float,
        $.string,
        $.character,
        $.boolean,
        $.symbol,
        $.null,
      ),

    integer: ($) => /[0-9][0-9_]*/,
    float: ($) => /[0-9][0-9_]*\.[0-9_]+([eE][+-]?[0-9]+)?/,
    string: ($) =>
      seq('"', repeat(choice(/[^"\\]/, "\\\\", "\\n", "\\t", '\\"')), '"'),
    character: ($) => seq("#\\", /./),
    boolean: ($) => choice("true", "false"),
    symbol: ($) => seq("#", $._identifier),
    null: ($) => "null",

    // ----- Identifier ------------------------------------------------
    identifier: ($) => $._identifier,
    _identifier: ($) => /[A-Za-z_][A-Za-z0-9_-]*/,

    // ----- Comments --------------------------------------------------
    line_comment: ($) => token(seq("//", /.*/)),
    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});

/**
 * Helper: comma‑separated list (with optional trailing comma)
 */
function sepBy(rule, separator) {
  return optional(sepBy1(rule, separator));
}
function sepBy1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
