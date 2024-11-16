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
    source_file: ($) =>
      optional(
        repeat(
          seq(choice($.definition, $.local_declaration, $._expression), ";"),
        ),
      ),
    doc_comment: (_) => token(seq("///", /.*/)),
    line_comment: (_) => token(seq("//", /.*/)),
    definition: ($) =>
      choice($.definition_macro_call, $.define_macro, $.parsed_definition),
    body: ($) => seq(";", "/"),
    constituents: ($) =>
      choice($.definition, $.local_declaration, $._expression, ";"),

    /**
     * Fragments
     */
    body_fragment: ($) =>
      choice(
        "non-statement-body-fragment",
        "statement non-statement-body-fragmentopt",
      ),
    list_fragment: ($) =>
      choice(
        "non-statement-list-fragment",
        "statement non-statement-list-fragmentopt",
      ),

    /**
     * Definitions
     */
    definition: ($) =>
      choice(
        $.definition_macro_call,
        seq("define", "macro", $.macro_definition),
        $.parsed_definition,
      ),
    define_macro: ($) => seq("define", "macro", $.macro_definition),
    definition_macro_call: ($) =>
      choice(
        seq(
          "define",
          optional($.modifiers),
          $.define_body_word,
          optional($.body_fragment),
          $.definition_tail,
        ),
        seq(
          "define",
          optional($.modifiers),
          $.define_list_word,
          optional($.list_fragment),
        ),
      ),
    define_body_word: (_) => choice("macro", "function"),
    define_list_word: (_) => choice("constant", "variable", "domain"),

    definition_tail: ($) =>
      choice(
        "end",
        seq("end", $.macro_name),
        seq("end", "define-body-word", $.macro_name),
      ),

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

    condition: ($) => choice($.type, seq("(", $.type, $.property_list, ")")),

    handler: ($) => $._expression,

    local_methods: ($) => seq("method", $.method_definition),

    bindings: ($) =>
      choice(
        seq($.variable, "=", $._expression),
        seq("(", $.variable_list, ")", "=", $._expression),
      ),

    variable_list: ($) => repeat(seq($.variable, optional(","))),

    property_list: ($) => repeat(seq($.property_name, optional(","))),

    type: ($) => $.operand,

    variable: ($) =>
      choice($.variable_name, seq($.variable_name, "::", $.type)),
    /**
     * Statements
     */
    statement: ($) =>
      seq($.begin_word, optional($.body_fragment), $.end_clause),

    end_clause: ($) => seq("end", optional($.begin_word)),

    case_body: ($) => seq($.cases, optional(";")),

    cases: ($) => seq($.case_label, $.constituents, ";"),

    case_label: ($) =>
      choice(
        seq($.expressions, "=>"),
        seq("(", $._expression, ",", $.expressions, ")", "=>"),
        seq("otherwise", optional("=>")),
      ),

    /**
     * Methods
     */

    method_definition: ($) =>
      seq(
        $.variable_name,
        $.parameter_list,
        optional($.body),
        "end",
        optional(seq("method", $.variable_name)),
      ),

    parameter_list: ($) => repeat(seq($.parameter_name, optional(","))),

    required_parameter: ($) =>
      choice($.variable, seq($.variable_name, "==", $._expression)),

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
      choice(
        repeat($.body_style_definition_rule),
        repeat($.list_style_definition_rule),
        repeat($.statement_rule),
        repeat($.function_rule),
      ),

    body_style_definition_rule: ($) =>
      seq(
        "{",
        "define",
        optional($.definition_head),
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
        optional($.definition_head),
        $.macro_name,
        optional($.pattern),
        "}",
        "=>",
        $.rhs,
      ),

    statement_rule: ($) =>
      seq(
        "{",
        $.macro_name,
        optional($.pattern),
        optional(";"),
        "end",
        "}",
        "=>",
        $.rhs,
      ),

    function_rule: ($) =>
      seq("{", $.macro_name, "(", optional($.pattern), ")", "}", "=>", $.rhs),

    rhs: ($) => seq("{", optional($.template), "}", ";"),

    definition_head: ($) => seq($.modifier_pattern),

    modifier_pattern: ($) => seq($.modifier),
    modifiers: ($) => repeat($.modifier),

    /**
     * Patterns
     */
    pattern: ($) => seq($.pattern_list, ";"),

    pattern_list: ($) =>
      choice(
        $.pattern_sequence,
        $.property_list_pattern,
        $.pattern_sequence,
        ",",
        $.pattern_list,
      ),

    pattern_sequence: ($) => repeat($.simple_pattern),

    simple_pattern: ($) =>
      seq(
        $.name,
        "=>",
        $.bracketed_pattern,
        $.binding_pattern,
        $.pattern_variable,
      ),

    bracketed_pattern: ($) =>
      choice(
        seq("(", optional($.pattern), ")"),
        seq("[", optional($.pattern), "]"),
        seq("{", optional($.pattern), "}"),
      ),

    binding_pattern: ($) =>
      choice(
        seq($.pattern_variable, "::", $.pattern_variable),
        seq($.pattern_variable, "=", $.pattern_variable),
        seq(
          $.pattern_variable,
          "::",
          $.pattern_variable,
          "=",
          $.pattern_variable,
        ),
      ),

    property_list_pattern: ($) =>
      choice(
        seq("#rest", $.pattern_variable),
        seq("#key", optional($.pattern_keywords)),
        seq(
          seq("#rest", $.pattern_variable),
          ",",
          seq("#key", $.pattern_variable),
        ),
      ),

    pattern_keywords: ($) =>
      choice(
        "#all-keys",
        $.pattern_keyword,
        seq($.pattern_keyword, ",", $.pattern_keywords),
      ),

    pattern_keyword: ($) =>
      choice(
        seq("?", $.name, optional("default")),
        seq("?", $.constrained_name, optional("default")),
        seq("??", $.name, optional("default")),
      ),

    pattern_variable: ($) => seq(choice($._macro_name, $._identifier_text)),
    // pattern-variable :: pattern-variable
    //
    // pattern-variable = pattern-variable
    //
    // pattern-variable :: pattern-variable = pattern-variable
    //
    // pattern-variable:
    // ? name
    //
    // ? constrained-name
    //
    // ...

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
     * Auxiliary Rule Sets
     */
    aux_rule_sets: ($) => repeat($.aux_rule_set),

    aux_rule_set: ($) => seq($.symbol, $.aux_rules),

    aux_rules: ($) => repeat($.aux_rule),

    aux_rule: ($) => seq("{", optional($.pattern), "}", "=>", $.rhs),

    /**
     * taken from zig grammar
     */

    unreachable_expression: (_) => "unreachable",

    /**
     * taken from tree-sitter tutorial
     */
    // function_definition: ($) =>
    //   seq(
    //     "func",
    //     field("name", $.identifier),
    //     field("parameters", $.parameter_list),
    //     field("return_type", $._type),
    //     field("body", $.block),
    //   ),

    // block: (_) => seq("this is not defined"),

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

    unary_operator: ($) => choice("-", "!"),
    unary_expression: ($) =>
      prec(
        2,
        choice(
          seq("-", $._expression),
          seq("!", $._expression),
          // ...
        ),
      ),
    _binary_operator: ($) => choice("*", "+", "/", "-"),
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
        seq("(", $._expression, ")"),
        $.function_macro_call,
        $.statement,
        $.parsed_function_call,
        $.parsed_macro_call,
      ),

    arguments: ($) => repeat(seq($.symbol, $.argument, optional(","))),

    argument: ($) =>
      choice(seq($.symbol, $._expression), $.expression_no_symbol, $.symbol),
    expression_no_symbol: ($) =>
      choice(
        "binary-operand-no-symbol",
        "binary-operand-no-symbol",
        "binary-operator expression",
      ),

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

    type: ($) => seq(optional("<"), $.identifier, optional(">")),
    modifier: (_) => choice("sealed", "inline", "not-inline"),
    string_literal: (_) => /[a-z]+/,
    character_literal: (_) => /[a-z\-$\*]/,
    variable_name: ($) => $.identifier,
    property_name: ($) => $.identifier,
    parameter_name: ($) => $.identifier,
    macro_name: ($) => $.identifier,
    _macro_name: ($) => $.identifier,
    name: ($) => $.identifier,
    constrained_name: ($) => $.identifier,
    identifier: ($) => /[a-z\-$\*]+/,
    string: ($) => /[a-z\-$\*]+/,
    escape_sequence: ($) => /[a-z\-$\*]+/,
    symbol: ($) => /[a-z\-$\*]+/,
    word: ($) => /[a-z\-$\*]+/,
    _identifier_text: ($) => /[a-z\-$\*]+/,

    number: (_) => /\d+/,

    constants: ($) => repeat(seq(choice($.literal, $.symbol), optional(","))),

    /**
     * Parsed Fragments
     */
    parsed_definition: (_) => /[a-z\-$\*]+/,

    parsed_local_declaration: (_) => /[a-z\-$\*]+/,

    parsed_function_call: (_) => /[a-z\-$\*]+/,

    parsed_macro_call: (_) => /[a-z\-$\*]+/,

    parsed_list_constant: (_) => /[a-z\-$\*]+/,

    parsed_vector_constant: (_) => /[a-z\-$\*]+/,

    /**
     * Lexical grammar
     */
    constant: ($) => choice($.literal, $.symbol),
    function_word: (_) => "(none)",
    hashtag_word: (_) =>
      choice("#t", "#f", "#next", "#rest", "#key", "#all-keys", "#include"),
    begin_word: (_) =>
      choice(
        "begin",
        "block",
        "case",
        "for",
        "if",
        "method",
        "select",
        "unless",
        "until",
        "while",
      ),
  },
});
