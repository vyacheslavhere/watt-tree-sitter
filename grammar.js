module.exports = grammar({
  name: "watt",

  conflicts: ($) => [[$._expression, $._statement], [$.type_definition]],
  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => repeat($._definition),

    comment: ($) =>
      token(
        choice(
          seq("/*", repeat(choice(/[^*]/, /\*[^/]/)), "*/"),
          seq("//", /[^\n]*/)
        ),
      ),

    _definition: ($) =>
      choice(
        $.function_definition,
        $.type_definition,
        $.unit_definition,
        $.return_statement,
        $.while_statement,
        $.if_statement,
        $.for_statement,
        $.import_statement,
        $.trait_definition,
        $.native_statement,
        $.assign_variable,
        $.define_variable
      ),

    function_definition: ($) =>
      seq("fn", $.identifier, optional($.parameter_list), optional($.block)),

    trait_definition: ($) => seq("trait", $.identifier, $.trait_block),

    trait_block: ($) => seq("{", repeat($.function_definition), "}"),

    type_definition: ($) =>
      seq(
        "type",
        $.identifier,
        optional($.parameter_list),
        optional(seq("impl", sepByComma($.identifier))),
        optional($.block)
      ),

    unit_definition: ($) => seq("unit", $.identifier, optional($.block)),

    parameter_list: ($) => seq("(", sepByComma($.identifier), ")"),

    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.return_statement,
        $.while_statement,
        $.if_statement,
        $.for_statement,
        "break",
        "continue",
        $.postfix_expr,
        $.native_statement,
        $.assign_variable,
        $.define_variable,
        $.function_definition
      ),

    assign_variable: ($) =>
      seq($.postfix_expr, choice("=", "+=", "*=", "/=", "-="), $._expression),

    define_variable: ($) => seq($.postfix_expr, ":=", $._expression),

    if_statement: ($) =>
      seq(
        "if",
        $._expression,
        $.block,
        repeat($.elif_statement),
        optional($.else_statement)
      ),

    elif_statement: ($) => seq("elif", $._expression, $.block),

    else_statement: ($) => seq("else", $.block),

    while_statement: ($) => seq("while", $._expression, $.block),

    for_statement: ($) =>
      seq("for", $.identifier, "in", $._expression, $.block),

    return_statement: ($) => seq("return", $._expression),

    native_statement: ($) => seq("native", $.identifier, "->", $.string),

    import_statement: ($) =>
      seq(
        "import",
        choice(seq("(", sepByComma($.single_import), ")"), $.single_import),
      ),

    single_import: ($) => seq($.string, optional(seq("with", $.identifier))),

    _expression: ($) =>
      choice(
        $.binary_expr,
        $.unary_expr,
        $.lambda_expr,
        $.an_fn_expr,
        $.atom_expr,
        $.postfix_expr,
        $.object_creation,
        $.match_expr
      ),

    binary_expr: ($) =>
      choice(
        prec.left(1, seq($._expression, choice("and", "or"), $._expression)),
        prec.left(2, seq($._expression, choice("!=", "=="), $._expression)),
        prec.left(
          3,
          seq($._expression, choice(">", "<", ">=", "<="), $._expression)
        ),
        prec.left(4, seq($._expression, "..", $._expression)),
        prec.left(5, seq($._expression, "impls", $._expression)),
        prec.left(6, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(7, seq($._expression, choice("/", "*", "%"), $._expression)),
      ),

    unary_expr: ($) => prec.left(8, seq(choice("-", "!"), $._expression)),

    atom_expr: ($) =>
      prec.left(9, choice($.number, $.bool, $.string, $.list, $.map)),

    postfix_expr: ($) =>
      prec.left(
        13,
        choice(
          $.identifier,
          seq($.postfix_expr, ".", $.identifier),
          seq($.postfix_expr, $.args),
          seq($.postfix_expr, $.args, "?")
        )
      ),

    args: ($) => seq("(", sepByComma($._expression), ")"),
    object_creation: ($) => prec.left(11, seq("new", $.identifier, $.args)),

    match_expr: ($) =>
      prec.left(
        9,
        seq(
          "match",
          $._expression,
          repeat(
            seq(
              "case",
              $._expression,
              choice(seq("->", $._expression), $.block)
            )
          ),
          optional(
            seq(
              "default",
              $._expression,
              choice(seq("->", $._expression), $.block)
            )
          )
        )
      ),

    lambda_expr: ($) =>
      prec.left(9, seq("lambda", $.parameter_list, "->", $._expression)),

    an_fn_expr: ($) => prec.left(9, seq("fn", $.parameter_list, $.block)),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: ($) => /\d+/,

    bool: ($) => choice("true", "false"),

    string: ($) => token(seq("'", repeat(choice(/[^'\\\n]/, /\\./)), "'")),

    list: ($) => seq("[", sepByComma($._expression), "]"),

    pair: ($) => seq($._expression, ":", $._expression),

    map: ($) => seq("{", sepByComma($.pair), "}"),
  },
});

function sepByComma(rule) {
  return optional(seq(rule, repeat(seq(",", rule))));
}
