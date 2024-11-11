/**
 * @file Treesitter parser for OpenDylan
 * @author Stefan Maaßen
 * @license GPLv3
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

module.exports = grammar({
  name: "dylan",

  externals: (_) => [],
  // Hey, you, writing more code to this, if you gonna put more items here
  // it better be token, or things get messy.
  extras: ($) => [/\s/, $.line_comment, $.doc_comment],

  rules: {
    // TODO: add the actual grammar rules

    /**
     * Program Structure
     */
    source_file: ($) => seq($.definition, $.local_delaration, $.expression),
    doc_comment: (_) => token(seq("///", /.*/)),
    line_comment: (_) => token(seq("//", /.*/)),
    definition: ($) =>
      choice($.definition_macro_call, $.define_macro, $.parsed_definition),

    /**
     * Definitions
     */
    define_macro: ($) => seq("define", "macro", $.macro_definition),

    /**
     * Local Declarations
     */

    local_declaration: ($) =>
      choice(
        seq("let", $.bindings),
        seq("let", "handler", $.condition, "=", $.handler),
        seq("local", $.local_methods),
        $.parsed_local_declaration,
      ),

    condition: ($) =>
      choice($.type, seq("(", $.type, $.comma_property_list, ")")),

    handler: ($) => $.expression,

    local_methods: ($) => seq(optional($.method), $.method_definition),

    bindings: ($) =>
      choice(
        seq($.variable, "=", $.expression),
        seq("(", $.variable_list, ")", "=", $.expression),
      ),

    variable_list: ($) =>
      repeat(seq($.variable_name, optional(seq("::", $.type)), optional(","))),

    type: ($) => $.operand,
    /**
     * Macro Definitions
     */
    macro_definition: ($) =>
      seq(
        $.macro_name,
        $.main_rule_set,
        optional($.aux_rule_set),
        "end",
        optional("macro"),
        optional($.macro_name),
      ),

    main_rule_set: ($) =>
      seq(
        $.body_style_definition_rule,
        $.list_style_definition_rule,
        $.statement_rule,
        $.function_rule,
      ),

    body_style_definition_rule: ($) =>
      seq(
        "{",
        "define",
        $.definition_headopt,
        $.macro_name,
        optional($.pattern),
        optional(";"),
        "end",
        "}",
        "=>",
        $.rhs,
      ),

    list_style_definition_rule: ($) =>
      seq(
        "{",
        "define",
        $.definition_headopt,
        $.macro_name,
        optional($.pattern),
        "}",
        "=>",
        $.rhs,
      ),

    rhs: ($) => seq("{", optional($.template), "}", ";"),

    definition_head: ($) => seq($.modifier_pattern),

    modifier_pattern: ($) => seq($.modifier),

    /**
     * Patterns
     */
    pattern_variable: ($) => seq(choice($._macro_name, $._identifier_text)),

    identifier: ($) => choice($._str_identifier, $._identifier_text),
    _str_identifier: ($) =>
      seq(
        '@"',
        alias(repeat(choice($.escape_sequence, /[^"\\]+/)), $.string_literal),
        token.immediate('"'),
      ),

    /**
     * Templates
     */
    template: ($) => seq($.template_element),

    template_element: ($) =>
      choice(
        $.name,
        $.symbol,
        $.number,
        $.character_literal,
        $.string,
        $.unary_operator,
        $.separator,
        $.hashtag_word,
        choice(
          seq("(", optional($.template), ")"),
          seq("[", optional($.template), "]"),
          seq("{", optional($.template), "}"),
          seq("#(", optional($.template), ")"),
          seq("#[", optional($.template), "]"),
        ),
        $.parsed_list_constant,
        $.parsed_vector_constant,
        $.substitution,
      ),

    separator: ($) => choice(";", ",", $._binary_operator),

    substitution: ($) =>
      choice(
        seq(
          optional($.name_prefix),
          "?",
          $.name_string_or_symbol,
          optional($.name_suffix),
        ),
        seq("??", $.name, optional($.separator)),
        seq("?=", $.name),
      ),
    name_prefix: ($) => seq($.string, "##"),
    name_suffix: ($) => seq("##", $.string),

    name_string_or_symbol: ($) => choice($.name, $.string, $.symbol),

    /**
     * taken from zig grammar
     */

    unreachable_expression: (_) => "unreachable",

    /**
     * taken from tree-sitter tutorial
     */
    function_definition: ($) =>
      seq(
        "func",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        field("return_type", $._type),
        field("body", $.block),
      ),

    _expression: ($) =>
      choice(
        $.identifier,
        $.unary_expression,
        $.binary_expression,
        // ...
        // operand ( argumentsopt )
        // operand [ argumentsopt ]
        // operand . variable-name
      ),

    unary_expression: ($) =>
      prec(
        2,
        choice(
          seq("-", $._expression),
          seq("!", $._expression),
          // ...
        ),
      ),
    binary_expression: ($) =>
      choice(
        prec.left(2, seq($._expression, "*", $._expression)),
        prec.left(1, seq($._expression, "+", $._expression)),
        // ...
      ),

    _type: ($) => choice($.primitive_type, $.array_type, $.pointer_type),

    primitive_type: ($) => choice("bool", "int"),

    array_type: ($) => seq("[", "]", $._type),

    pointer_type: ($) => seq("*", $._type),

    /**
     * Expressions
     */

    expressions: ($) => repeat($._expression),

    function_macro_call: ($) =>
      seq($.function_word, "(", optional($.body_fragment), ")"),

    leaf: ($) =>
      choice(
        $.literal,
        $.variable_name,
        seq("(", $.expression, ")"),
        $.function_macro_call,
        $.statement,
        $.parsed_function_call,
        $.parsed_macro_call,
      ),

    arguments: ($) => repeat(seq($.symbol, $.argument, optional(","))),

    literal: ($) =>
      choice(
        $.number,
        $.character_literal,
        $.string_literal,
        "#t",
        "#f",
        seq("#(", $.constants, ".", $.constant, ")"),
        seq("#(", optional($.constants), ")"),
        seq("#[", optional($.constants), "]"),
        $.parsed_list_constant,
        $.parsed_vector_constant,
      ),

    string_literal: ($) => $.string,

    constants: ($) => repeat(seq(choice($.literal, $.symbol), optional(","))),
  },
});
