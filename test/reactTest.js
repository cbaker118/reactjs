//unit testing for react.js
var equivArr = function( arr1, arr2 ) {
			if ( !arr1 || arr1.constructor !== Array || !arr2 || arr2.constructor !== Array ||
				 arr1.length !== arr2.length)
				return false;
			
			var i = arr1.length;
			while ( i-- ) {
				if ( arr1[ i ].constructor === Array ) {
					if ( equivArr( arr1[ i ], arr2[ i ] ) )
						continue;
					else
						return false;
				
				} else if ( arr1[ i ] !== arr2[ i ] ) {
					return false;
				}
			}
			
			return true;
		},
	isEmptyObj = function( obj, own ) {
		if ( typeof obj !== "object" || obj === null || obj.constructor === Array )
			return false;
		
		for ( var key in obj )
			if ( own ? obj.hasOwnProperty( key ) : key in obj )
				return false;
		
		return true;
	},
	countProps = function( obj, own ) {
		var n = 0;
		
		for ( var key in obj )
			if ( own ? obj.hasOwnProperty( key ) : key in obj )
				n++;
		
		return n;
	},
	objContent = function( obj, arr ) {
		if ( !obj || obj.constructor !== Object )
			return false;
		
		arr = arr.slice();
		var cpy = {}, key, i = arr.length;
		
		for ( key in obj ) {
			if ( key !== "depObj" )
				cpy[ key ] = obj[ key ]
		}
		
		while ( i-- ) {
			for ( key in cpy ) {
				if ( cpy[ key ] === arr[ i ] ) {
					arr.splice( i, 1 );
					delete cpy[ key ];
				}
			}
		}
		
		return !arr.length && isEmptyObj( cpy );
	},
	compare = function( reactRet, compVal ) {
		if ( compVal.constructor !== Array )
			return reactRet._value === compVal;
		
		if ( reactRet._value.constructor !== Array )
			return false;
		
		var op = compVal.shift();
		
		if ( reactRet._value.length !== compVal.length )
			return false;
		
		if ( reactRet._value.op !== op )
			return false;
		
		var idx = compVal.length;
		while ( idx-- ) {
			if ( compVal[ idx ].constructor === Array ) {
				if ( compare( reactRet._value[ idx ], compVal[ idx ] ) )
					continue;
				else
					return;
			}
			
			if ( compVal[ idx ] !== reactRet._value[ idx ] )
				return false;
		}
		
		return true;
	};

react = react.Interpreter( "debugger", "math" );


module( "General" );

test( "return value of react()", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	strictEqual( react( "5+true" ), 5+true, "literal: react( \"5+true\" )" );
	strictEqual( react( "x" ), x.valueOf(), "variable: react( \"x\" )" );
	strictEqual( react( "x+t" ), x.valueOf()+t.valueOf(), "value array: react( \"x+t\" )" );
	
	react( "clean" )
} );

test( "return value of react.leak()", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	strictEqual( react.leak( "5+true" ), 5+true, "literal: react( \"5+true\" )" );
	ok( react.leak( "x" ) === x, "variable: react( \"x\" )" );
	ok( compare( react.leak( "no partOf", "x+t" ), [ "+", x, t ] ), "anonymous variable: react( \"x+t\" )" );
	
	react( "clean" )
} );

test( "undefined / NaN / Infinity", function() {
	strictEqual( react( undefined ), undefined, "react( undefined )" );
	strictEqual( react( "undefined" ), undefined, "react( \"undefined\" )" );
	
	ok( isNaN( react( NaN ) ), "isNaN( react( NaN ) )" );
	notStrictEqual( react( "NaN" ), "NaN", "react( \"NaN\" )" );
	ok( isNaN( react( "NaN" ) ), "isNaN( react( \"NaN\" ) )" );
	
	strictEqual( react( Infinity ), Infinity, "react( Infinity )" );
	strictEqual( react( "Infinity" ), Infinity, "react( \"Infinity\" )" );
} );

test( "null", function() {
	strictEqual( react( null ), null, "react( null )" );
	strictEqual( react( "null" ), null, "react( \"null\" )" );
} );

test( "boolean types", function() {
	strictEqual( react( true ), true, "react( true )" );
	strictEqual( react( "true" ), true, "react( \"true\" )" );
	
	strictEqual( react( false ), false, "react( false )" );
	strictEqual( react( "false" ), false, "react( \"false\" )" );
} );

test( "number type", function() {
	strictEqual( react( 5 ), 5, "react( 5 )" );
	strictEqual( react( "5" ), 5, "react( \"5\" )" );
	strictEqual( react( "5e2" ), 5e2, "react( \"5e2\" )" );
	strictEqual( react( "5E2" ), 5E2, "react( \"5E2\" )" );
	strictEqual( react( ".5" ), .5, "react( \".5\" )" );
	
	raises( function() { react( ".5.0" ) }, "react( \".5.0\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( ".5.0" );	
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad Token: Invalid number.", "react( \".5.0\" ) -> exception" );
	raises( function() { react( "5e2e3" ) }, "react( \"5e2e3\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "5e2e3" );	
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad Token: Invalid number.", "react( \"5e2e3\" ) -> exception" );
	raises( function() { react( "5d" ) }, "react( \"5d\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "5d" );	
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad Token: Invalid number.", "react( \"5d\" ) -> exception" );
} );

test( "string type", function() {
	strictEqual( react( "'str'" ), "str", "react( \"'str'\" )" );
	strictEqual( react( "\"str\"" ), "str", "react( \"\\\"str\\\"\" )" );
	raises( function() { react( "'str" ) }, "react( \"'str\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "'str" );	
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad Token: Unterminated string.", "react( \"'str\" ) -> exception" );
} );

test( "objects and arrays", function() {
	var obj = {};
	strictEqual( react( obj ), obj, "react( {} )" );
	
	var arr = [];
	strictEqual( react( arr ), arr, "react( [] )" );
} );

test( "functions", function() {
	var func = function() {};
	strictEqual( react( func ), func, "react( function() {} )" );
} );


module( "mathModule" );

test( "constants", function() {
	strictEqual( react( "pi" ), Math.PI, "react( \"pi\" )" );
	strictEqual( react( "e" ), Math.E, "react( \"e\" )" );
	strictEqual( react( "ln2" ), Math.LN2, "react( \"ln2\" )" );
	strictEqual( react( "ln10" ), Math.LN10, "react( \"ln10\" )" );
	strictEqual( react( "log2e" ), Math.LOG2E, "react( \"log2e\" )" );
	strictEqual( react( "log10e" ), Math.LOG10E, "react( \"log10e\" )" );
	strictEqual( react( "sqrt2" ), Math.SQRT2, "react( \"sqrt2\" )" );
	strictEqual( react( "sqrt1_2" ), Math.SQRT1_2, "react( \"sqrt1_2\" )" );
} );

test( "trigonometric functions and exp/log: basic datatypes", function() {
	strictEqual( react( "sin(", Math.PI/4, ")" ), Math.sin( Math.PI/4 ), "react( \"sin(\", Math.PI/4, \")\" )" );
	strictEqual( react( "cos(", Math.PI/4, ")" ), Math.cos( Math.PI/4 ), "react( \"cos(\", Math.PI/4, \")\" )" );
	strictEqual( react( "tan(", 0.25, ")" ), Math.tan( 0.25 ), "react( \"tan(\", Math.PI/4, \")\" )" );
	strictEqual( react( "asin(", Math.SQRT1_2, ")" ), Math.asin( Math.SQRT1_2 ), "react( \"asin(\", Math.SQRT1_2, \")\" )" );
	strictEqual( react( "acos(", Math.SQRT1_2, ")" ), Math.acos( Math.SQRT1_2 ), "react( \"acos(\", Math.SQRT1_2, \")\" )" );
	strictEqual( react( "atan(", Math.SQRT1_2, ")" ), Math.atan( Math.SQRT1_2 ), "react( \"atan(\", Math.SQRT1_2, \")\" )" );
	strictEqual( react( "exp(", Math.PI/4, ")" ), Math.exp( Math.PI/4 ), "react( \"exp(\", Math.PI/4, \")\" )" );
	strictEqual( react( "log(", Math.SQRT1_2, ")" ), Math.log( Math.SQRT1_2 ), "react( \"log(\", Math.SQRT1_2, \")\" )" );
} );

test( "projection functions: basic datatypes", function() {
	strictEqual( react( "abs(", Math.PI/4, ")" ), Math.abs( Math.PI/4 ), "react( \"abs(\", Math.PI/4, \")\" )" );
	strictEqual( react( "sgn( -5 )" ), -1, "react( \"sgn( -5 )\" )" );
	strictEqual( react( "sgn( 0 )" ), 0, "react( \"sgn( 0 )\" )" );
	strictEqual( react( "sgn( 5 )" ), 1, "react( \"sgn( 5 )\" )" );
	strictEqual( react( "floor(", Math.SQRT1_2, ")" ), Math.floor( Math.SQRT1_2 ), "react( \"floor(\", Math.SQRT1_2, \")\" )" );
	strictEqual( react( "ceil(", Math.SQRT1_2, ")" ), Math.ceil( Math.SQRT1_2 ), "react( \"ceil(\", Math.SQRT1_2, \")\" )" );
	strictEqual( react( "round(", Math.SQRT1_2, ")" ), Math.round( Math.SQRT1_2 ), "react( \"round(\", Math.SQRT1_2, \")\" )" );
} );

test( "trigonometric functions and exp/log: variables (all behave the same)", function() {
	var x = react.leak( "x = 2.6" );
	
	var sin = react( "sin" );
	
	ok( react.leak( "no partOf", "sin( x )" )._value.func === sin , "react( \"sin( x )\" )._value.func" );
	ok( react.leak( "no partOf", "sin( x )" )._value.args === x, "react( \"sin( x )\" )._value.args" );
	
	ok( react.leak( "no partOf", "sin( sin( x ) )" )._value.func === sin, "react( \"sin( sin( x ) )\" )._value.func" );
	ok( react.leak( "no partOf", "sin( sin( x ) )" )._value.args._value.func === sin, "react( \"sin( sin( x ) )\" )._value.args._value.func" );
	ok( react.leak( "no partOf", "sin( sin( x ) )" )._value.args._value.args === x, "react( \"sin( sin( x ) )\" )._value.args._value.args" );
	
	ok( react.leak( "no partOf", "asin( sin( x ) )" ) === x, "react( \"asin( sin( x ) )\" )" );
	ok( react.leak( "no partOf", "sin( asin( x ) )" ) === x, "react( \"sin( asin( x ) )\" )" );
	
	react( "clean" )
} );

test( "projection functions: variables (all behave the same)", function() {
	var x = react.leak( "x = 2.6" );
	
	var round = react( "round" );
	
	ok( react.leak( "no partOf", "round( x )" )._value.func === round , "react( \"round( x )\" )._value.func" );
	ok( react.leak( "no partOf", "round( x )" )._value.args === x, "react( \"round( x )\" )._value.args" );
	
	ok( react.leak( "no partOf", "round( round( x ) )" )._value.func === round , "react( \"round( round( x ) )\" )._value.func" );
	ok( react.leak( "no partOf", "round( round( x ) )" )._value.args === x, "react( \"round( round( x ) )\" )._value.args" );
	
	react( "clean" )
} );


module( "Multiple expressions" );

test( ";", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" ),
		one = react.leak( "one = 1" );
	
	strictEqual( react( "s1 = x+t; s2 = x*one; 5" ), 5, "react( \"s1 = x+t; s2 = x*one; 5\" )" );
	ok( react.leak( "s1" )._key, "react.leak( \"s1\" ) is variable" );
	ok( react.leak( "s2" )._key, "react.leak( \"s2\" ) is variable" );
	
	strictEqual( react( "delete s1; delete s2; 10" ), 10, "react( \"delete s1; delete s2; 10\" )" );
	raises( function() { react( "s1" ) }, "react( \"s1\" ) -> exception" );
	raises( function() { react( "s2" ) }, "react( \"s2\" ) -> exception" );
	
	react( "clean" )
} );


module( "Single operators applied to basic datatypes" );

test( "custom operator", function() {
	raises( function() { react( "´" ) }, "invalid operator part: react( \"´\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "´" );	
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad Token: Operator not supported: ´.", "react( \"´\" ) -> exception" );
} );

test( "boolean", function() {
	strictEqual( react( "!", true ), !true, "react( \"!\", true )" );
	strictEqual( react( "!'str'" ), !"str", "react( \"!'str'\" )" );
	strictEqual( react( "!0" ), !0, "react( \"!0\" )" );
	strictEqual( react( "!!0" ), !!0, "react( \"!!0\" )" );
	
	strictEqual( react( true, "&&", false ), true && false, "react( true, \"&&\", false )" );
	strictEqual( react( 5, "&& 'str'" ), 5 && "str", "react( 5, \"&& 'str'\" )" );
	
	strictEqual( react( true, "||", false ), true || false, "react( true, \"||\", false )" );
	strictEqual( react( 5, "|| 'str'" ), 5 || "str", "react( 5, \"|| 'str'\" )" );
} );

test( "equalities", function() {
	strictEqual( react( true, "== false" ), true == false, "react( true, \"== false\" )" );
	strictEqual( react( "'5' ==", 5 ), "5" == 5, "react( \"'5' ==\", 5 )" );
	strictEqual( react( "'foo' == 'bar'" ), "foo" == "bar", "react( \"'foo' == 'bar'\" )" );
	strictEqual( react( "100 == 100" ), 100 == 100, "react( \"100 == 100\" )" );
	
	strictEqual( react( true, "===", false ), true === false, "react( true, \"===\", false )" );
	strictEqual( react( "'5' ===", 5 ), "5" === 5, "react( \"'5\' ===\", 5 )" );
	strictEqual( react( "'foo'", "===", "'bar'" ), "foo" === "bar", "react( \"foo\", \"===\", \"bar\" )" );
	strictEqual( react( "100 ===", 100 ), 100 === 100, "react( \"100 ===\", 100 )" );
} );

test( "inequalities", function() {
	strictEqual( react( true, "!=", false ), true != false, "react( true, \"!=\", false )" );
	strictEqual( react( "'5'", "!=", 5 ), "5" != 5, "react( \"5\", \"!=\", 5 )" );
	strictEqual( react( "'foo'", "!=", "'bar'" ), "foo" != "bar", "react( \"foo\", \"!=\", \"bar\" )" );
	strictEqual( react( 100, "!=", 100 ), 100 != 100, "react( 100, \"!=\", 100 )" );
	
	strictEqual( react( "true !== false" ), true !== false, "react( \"true !== false\" )" );
	strictEqual( react( "'5' !==", 5 ), "5" !== 5, "react( \"'5\' ===\", 5 )" );
	strictEqual( react( "'foo' !==", "'bar'" ), "foo" !== "bar", "react( \"'foo' !==\", \"'bar'\" )" );
	strictEqual( react( 100, "!== 100" ), 100 !== 100, "react( 100, \"!== 100\" )" );

} );

test( "smaller", function() {
	strictEqual( react( 5, "<=", 5 ), 5 <= 5, "react( 5, \"<=\", 5 )" );
	strictEqual( react( 854, "<=", 168 ), 854 <= 168, "react( 854, \"<=\", 168 )" );
	strictEqual( react( false, "<=", true ), false <= true, "react( false, \"<=\", true )" );
	strictEqual( react( "'a' <= 'ab'" ), "a" <= "ab", "react( \"'a' <= 'ab'\" )" );
	
	strictEqual( react( 5, "<", 5 ), 5 > 5, "react( 5, \"<\", 5 )" );
	strictEqual( react( 854, "<", 168 ), 854 < 168, "react( 854, \"<\", 168 )" );
	strictEqual( react( false, "<", true ), false < true, "react( false, \"<\", true )" );
	strictEqual( react( "'a' < 'ab'" ), "a" < "ab", "react( \"'a' < 'ab'\" )" );
} );

test( "greater", function() {
	strictEqual( react( 5, ">=", 5 ), 5 >= 5, "react( 5, \">=\", 5 )" );
	strictEqual( react( 854, ">=", 168 ), 854 >= 168, "react( 854, \">=\", 168 )" );
	strictEqual( react( false, ">=", true ), false >= true, "react( false, \">=\", true )" );
	strictEqual( react( "'a' >= 'ab'" ), "a" >= "ab", "react( \"'a' >= 'ab'\" )" );
	
	strictEqual( react( 5, ">", 5 ), 5 > 5, "react( 5, \">\", 5 )" );
	strictEqual( react( 854, ">", 168 ), 854 > 168, "react( 854, \">\", 168 )" );
	strictEqual( react( false, ">", true ), false > true, "react( false, \">\", true )" );
	strictEqual( react( "'a' > 'ab'" ), "a" > "ab", "react( \"'a' > 'ab'\" )" );
} );

test( "in", function() {
	var obj = { undef : undefined, prop : "value" };
	
	ok( obj, "obj = { undef : undefined, prop : \"value\" }" );
	strictEqual( react( "'prop' in", obj ), true, "react( \"'prop' in\", obj )" );
	strictEqual( react( "'undef' in", obj ), true, "react( \"'undef' in\", obj )" );
	strictEqual( react( "'foo' in", obj ), false, "react( \"'foo' in\", obj )" );
} );

test( "instanceof", function() {
	var obj = {},
		arr = [];
	
	ok( obj, "obj = {}" );
	ok( arr, "arr = []" );
	strictEqual( react( obj, "instanceof", Object ), true, "react( obj, \"instanceof\", Object )" );
	strictEqual( react( obj, "instanceof", Array ), false, "react( obj, \"instanceof\", Array )" );
	strictEqual( react( arr, "instanceof", Object ), true, "react( arr, \"instanceof\", Object )" );
	strictEqual( react( arr, "instanceof", Array ), true, "react( arr, \"instanceof\", Array )" );
} );

test( "addition", function() {
	strictEqual( react( "5 + 5" ), 5 + 5, "react( \"5 + 5\" )" );
	strictEqual( react( "'a' + 'b'" ), 'a' + 'b', "react( \"'a' + 'b'\" )" );
	strictEqual( react( "5 + 'b'" ), 5 + 'b', "react( \"5 + 'b'\" )" );
	strictEqual( react( "true + false" ), true + false, "react( \"true + false\" )" );
	strictEqual( react( "'a' + false" ), 'a' + false, "react( \"'a' + false\" )" );
} );

test( "multiplication", function() {
	strictEqual( react( "10 * 5" ), 10 * 5, "react( \"10 * 5\" )" );
	ok( isNaN( react( "'a' * 'b'" ) ), "isNaN( react( \"'a' * 'b'\" ) )" );
	ok( isNaN( react( "5 * 'b'" ) ), "isNaN( react( \"5 * 'b'\" ) )" );
	strictEqual( react( "false * true" ), false * true, "react( \"false * true\" )" );
	ok( isNaN( react( "'a' * false" ) ), "isNaN( react( \"'a' * false\" ) )" );
	
	strictEqual( react( "-1 * 5" ), -1 * 5, "react( \"-1 * 5\" )" );
	ok( isNaN( react( "-1 * 'b'" ) ), "isNaN( react( \"-1 * 'b'\" ) )" );
	strictEqual( react( "-1 * true" ), -1 * true, "react( \"-1 * true\" )" );
	strictEqual( react( "-1 * false" ), -1 * false, "react( \"-1 * false\" )" );
} );

test( "subtraction", function() {
	strictEqual( react( "10 - 5" ), 10 - 5, "react( \"10 - 5\" )" );
	ok( isNaN( react( "'a' - 'b'" ) ), "isNaN( react( \"'a' - 'b'\" ) )" );
	ok( isNaN( react( "5 - 'b'" ) ), "isNaN( react( \"5 - 'b'\" ) )" );
	strictEqual( react( "false - true" ), false - true, "react( \"false - true\" )" );
	ok( isNaN( react( "'a' - false" ) ), "isNaN( react( \"'a' - false\" ) )" );
} );

test( "power", function() {
	strictEqual( react( "0^0" ), 1, "react( \"10 ^ 5\" )" );
	strictEqual( react( "10 ^ 5" ), Math.pow( 10, 5 ), "react( \"10 ^ 5\" )" );
	ok( isNaN( react( "'a' ^ 'b'" ) ), "isNaN( react( \"'a' ^ 'b'\" ) )" );
	ok( isNaN( react( "5 ^ 'b'" ) ), "isNaN( react( \"5 ^ 'b'\" ) )" );
	strictEqual( react( "true ^ false" ), Math.pow( true, false ), "react( \"false ^ true\" )" );
	strictEqual( react( "'a' ^ false" ), Math.pow( 'a', false ), "react( \"'a' ^ false\" )" );
	
	strictEqual( react( "5 ^ -1" ), 1/5, "react( \"5 ^ -1\" )" );
	ok( isNaN( react( "'b' ^ -1" ) ), "isNaN( react( \"'b' ^ -1\" ) )" );
	strictEqual( react( "true ^ -1" ), 1/true, "react( \"true ^ -1\" )" );
	strictEqual( react( "false ^ -1" ), 1/false, "react( \"false ^ -1\" )" );
} );

test( "division", function() {	
	strictEqual( react( "10 / 5" ), 10 / 5, "react( \"10 / 5\" )" );
	ok( isNaN( react( "'a' / 'b'" ) ), "isNaN( react( \"'a' / 'b'\" ) )" );
	ok( isNaN( react( "5 / 'b'" ) ), "isNaN( react( \"5 / 'b'\" ) )" );
	strictEqual( react( "false / true" ), false / true, "react( \"false / true\" )" );
	ok( isNaN( react( "'a' / false" ) ), "isNaN( react( \"'a' / false\" )" );
} );

test( "modulus", function() {	
	strictEqual( react( "0 % 5" ), 0, "react( \"0 % 5\" )" );
	strictEqual( react( "5 % 5" ), 0, "react( \"5 % 5\" )" );
	ok( isNaN( react( "5 % 0" ) ), "isNaN( react( \"5 % 0\" ) )" );
	strictEqual( react( "5 % 1" ), 5 % 1, "react( \"5 % 1\" )" );
	strictEqual( react( "10 % 5" ), 10 % 5, "react( \"10 % 5\" )" );
	ok( isNaN( react( "'a' % 'b'" ) ), "isNaN( react( \"'a' % 'b'\" ) )" );
	ok( isNaN( react( "5 % 'b'" ) ), "isNaN( react( \"5 % 'b'\" ) )" );
	strictEqual( react( "false % true" ), false % true, "react( \"false % true\" )" );
	ok( isNaN( react( "'a' % false" ) ), "isNaN( react( \"'a' % false\" ) )" );
} );

test( "ternary operator", function() {
	strictEqual( react( "true ? 5 : 10" ), 5, "react( \"true ? 5 : 10\" )" );
	strictEqual( react( "false ? 5 : \"foo\"" ), "foo", "react( \"false ? 5 : \"foo\"\" )" );
} );

test( "conversion", function() {
	strictEqual( react( "+5" ), +5, "react( \"+5\" )" );
	strictEqual( react( "+'5'" ), +'5', "react( \"+'5'\" )" );
	strictEqual( react( "+true" ), +true, "react( \"+true\" )" );
	strictEqual( react( "+false" ), +false, "react( \"+false\" )" );
	ok( isNaN( react( "+'ab'" ) ), "isNaN( react( \"+'ab'\" ) )" );
	ok( isNaN( react( "+undefined" ) ), "isNaN( react( \"+undefined\" ) )" );
	strictEqual( react( "+'Infinity'" ), +'Infinity', "react( \"+'Infinity'\" )" );
} );

test( "negation", function() {
	strictEqual( react( "-5" ), -5, "react( \"-5\" )" );
	strictEqual( react( "-'5'" ), -'5', "react( \"-'5'\" )" );
	strictEqual( react( "-true" ), -true, "react( \"-true\" )" );
	strictEqual( react( "-false" ), -false, "react( \"-false\" )" );
	ok( isNaN( react( "-'ab'" ) ), "isNaN( react( \"-'ab'\" ) )" );
	ok( isNaN( react( "-undefined" ) ), "isNaN( react( \"-undefined\" ) )" );
	strictEqual( react( "-'Infinity'" ), -'Infinity', "react( \"-'Infinity'\" )" );
} );

test( "typeof", function() {
	strictEqual( react( "typeof 5" ), typeof 5, "react( \"typeof 5\" )" );
	strictEqual( react( "typeof 'str'" ), typeof 'str', "react( \"typeof 'str'\" )" );
	strictEqual( react( "typeof true" ), typeof true, "react( \"typeof true\" )" );
	strictEqual( react( "typeof undefined" ), typeof undefined, "react( \"typeof undefined\" )" );
	strictEqual( react( "typeof null" ), typeof null, "react( \"typeof null\" )" );
	strictEqual( react( "typeof NaN" ), typeof NaN, "react( \"typeof NaN\" )" );
} );

test( "#", function() {
	strictEqual( react( "#true" ), true, "react( \"#true\" )" );
	strictEqual( react( "#'str'" ), 'str', "react( \"#'str'\" )" );
	strictEqual( react( "#5" ), 5, "react( \"#5\" )" );
} );


module( "Combined operators and operator precedence" );

test( "boolean and comparison", function() {
	strictEqual( react( "false || true && false || true" ), false || true && false || true, "react( \"false || true && false || true\" )" );
	strictEqual( react( "false || false || true" ), false || false || true, "react( \"false || false || true\" )" );
	strictEqual( react( "false && true && false" ), false && true && false, "react( \"false && true && false\" )" );
	strictEqual( react( "!false || true && false" ), !false || true && false, "react( \"!false || true && false\" )" );
	strictEqual( react( "false || true && false" ), false || true && false, "react( \"false || true && false\" )" );
	
	strictEqual( react( "'foo' === 'foo' || 'foo' !== 'bar'" ), 'foo' === 'foo' || 'foo' !== 'bar', "react( \"'foo' === 'foo' || 'foo' !== 'bar'\" )" );
	strictEqual( react( "'foo' !== 'foo' || 'foo' !== 'bar'" ), 'foo' !== 'foo' || 'foo' !== 'bar', "react( \"'foo' !== 'foo' || 'foo' !== 'bar'\" )" );
	
	strictEqual( react( "0 > 1 === false" ), 0 > 1 === false, "react( \"0 > 1 === false\" )" );
	strictEqual( react( "0 > 1 === false" ), 0 > 1 === false, "react( \"0 > 1 === false\" )" );
} );

test( "multiplication before addition", function() {
	strictEqual( react( "5+10-6" ), 5+10-6, "react( \"5+10-6\" )" );
	strictEqual( react( "5+10*6" ), 5+10*6, "react( \"5+10*6\" )" );
	strictEqual( react( "5/10+6" ), 5/10+6, "react( \"5/10+6\" )" );
	strictEqual( react( "5*10+6/8" ), 5*10+6/8, "react( \"5*10+6/8\" )" );
} );

test( "power before multiplication/modulus before addition", function() {
	strictEqual( react( "5*10^2" ), 5*Math.pow( 10, 2 ), "react( \"5*10^2\" )" );
	strictEqual( react( "5*10^2+8" ), 5*Math.pow( 10, 2 )+8, "react( \"5*10^2+8\" )" );
	strictEqual( react( "5*10^2+8^3" ), 5*Math.pow( 10, 2 )+Math.pow( 8, 3 ), "react( \"5*10^2+8^3\" )" );
	strictEqual( react( "5+10%6" ), 5+10%6, "react( \"5+10%6\" )" );
	strictEqual( react( "5+10%6+8" ), 5+10%6+8, "react( \"5+10%6+8\" )" );
	strictEqual( react( "5*10%12" ), 5*10%12, "react( \"5*10%12\" )" );
	strictEqual( react( "5*10%12*8" ), 5*10%12*8, "react( \"5*10%12*8\" )" );
	strictEqual( react( "4*2^10%3^2" ), 4*Math.pow( 2, 10 ) % Math.pow( 3, 2 ), "react( \"4*2^10%3^2\" )" );
} );

test( "ternary operator", function() {
	strictEqual( react( "true && true ? 'foo' : true ? 'bar' : 'baz'" ), "foo", "react( \"true ? 'foo' : true ? 'bar' : 'baz'\" )" );
	strictEqual( react( "true && false ? 'foo' : true ? 'bar' : 'baz'" ), "bar", "react( \"true ? 'foo' : true ? 'bar' : 'baz'\" )" );
	strictEqual( react( "false ? 'foo' : true ? 'bar' : 'baz'" ), "bar", "react( \"false ? 'foo' : true ? 'bar' : 'baz'\" )" );
	strictEqual( react( "false ? 'foo' : false ? 'bar' : 'baz'" ), "baz", "react( \"false ? 'foo' : false ? 'bar' : 'baz'\" )" );
} );

test( "negation and conversion", function() {
	strictEqual( react( "-5+10-6" ), -5+10-6, "react( \"-5+10-6\" )" );
	strictEqual( react( "-5/+'10'+6" ), -5/10+6, "react( \"-5/10+6\" )" );
	strictEqual( react( "-5^2" ), Math.pow( -5, 2 ), "react( \"-5^2\" )" );
	strictEqual( react( "+'5'^2" ), Math.pow( 5, 2 ), "react( \"+'5'^2\" )" );
	strictEqual( react( "+'5'+10-6" ), 5+10-6, "react( \"+'5'+10-6\" )" );
	strictEqual( react( "+'5'+ +'10'-6" ), 5+10-6, "react( \"+'5'+ +'10'-6\" )" );
} );

test( "typeof", function() {
	strictEqual( react( "typeof 5+'foo'" ), typeof 5+'foo', "react( \"typeof 5+'foo'\" )" );
	strictEqual( react( "typeof 5 == true" ), typeof 5 == true, "react( \"typeof 5 == true'\" )" );
	strictEqual( react( "typeof !'str'" ), typeof !"str", "react( \"typeof !'str''\" )" );
} );

test( "parenthesis", function() {
	strictEqual( react( "(!false || true) && false" ), (!false || true) && false, "react( \"(!false || true) && false\" )" );
	strictEqual( react( "(false || true) && false" ), (false || true) && false, "react( \"(false || true) && false\" )" );
	strictEqual( react( "(5+10)*6" ), (5+10)*6, "react( \"(5+10)*6\" )" );
	strictEqual( react( "(4*2)^(8%3)^2" ), Math.pow( 4*2, Math.pow( 8%3, 2 ) ), "react( \"(4*2)^(8%3)^2\" )" );
	strictEqual( react( "(-5)^2" ), Math.pow( -5, 2 ), "react( \"(-5)^2\" )" );
	strictEqual( react( "typeof (5+'foo')" ), typeof (5+'foo'), "react( \"typeof (5+'foo')\" )" );
	strictEqual( react( "(6*(5+10))^2" ), Math.pow( 6*(5+10), 2 ), "react( \"(6*(5+10))^2\" )" );
} );


module( "Object literals with literal properties and literal values" );

test( "accessing object properties", function() {
	var obj = { fst : 1, snd : 2, foo : "bar", bar : "foo", inner : { trd : 3 } },
		arr = [ 0, 1 ];
	
	ok( obj, "obj = { fst : 1, snd : 2, foo : \"bar\", bar : \"foo\", inner : { trd : 3 } }" );
	ok( arr, "arr = [ 0, 1 ]" );
	
	strictEqual( react( obj, ".fst" ), 1, "react( obj, \".fst\" )" );
	strictEqual( react( obj, "[ 'snd' ]" ), 2, "react( obj, \"[ 'snd' ]\" )" );
	
	strictEqual( react( arr, ".length" ), 2, "react( arr, \".length\" )" );
	strictEqual( react( arr, "[ 0 ]" ), 0, "react( arr, \"[ 0 ]\" )" );
	
	strictEqual( react( 5, ".prop" ), undefined, "react( 5, \".prop\" )" );
	
	raises( function() { react( null, ".prop" ) }, "react( null, \".prop\" ) -> exception" );
	raises( function() { react( undefined, ".prop" ) }, "react( undefined, \".prop\" ) -> exception" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );

test( "accessing object properties regarding operator precedence", function() {
	var obj = { fst : 1, snd : 2, foo : "bar", bar : "foo", inner : { trd : 3 } };
	
	ok( obj, "obj = { fst : 1, snd : 2, foo : \"bar\", bar : \"foo\", inner : { trd : 3 } }" );
	
	strictEqual( react( obj, ".inner.trd" ), 3, "react( obj, \".inner.trd\" )" );
	strictEqual( react( obj, ".inner[ 'trd' ]" ), 3, "react( obj, \".inner[ 'trd' ]\" )" );
	strictEqual( react( obj, "[ 'inner' ].trd" ), 3, "react( obj, \"[ 'inner' ].trd\" )" );
	strictEqual( react( obj, "[ 'inner' ][ 'trd' ]" ), 3, "react( obj, \"[ 'inner' ][ 'trd' ]\" )" );
	
	strictEqual( react( obj, "[ ", obj, ".foo ]" ), "foo", "react( obj, \"[ \", obj, \".foo ]\" )" );
	
	strictEqual( react( obj, "[ false ? 'fst' : 'snd' ]" ), 2, "react( obj, \"[ false ? 'fst' : 'snd' ]\" )" );
	strictEqual( react( obj, "[", obj, "[ 'bar' ] ]" ), "bar", "react( obj, \"[, obj, \"[ 'bar' ] ]\" )" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );

test( "assignment to and deletion of object properties", function() {
	var obj = { inner : {} };
	
	ok( obj, "obj = { inner : {} }" );
	
	strictEqual( react( obj, ".prop = 50" ), 50, "react( obj, \".prop = 50\" )" );
	strictEqual( react( obj, ".prop" ), 50, "react( obj, \".prop\" )" );
	strictEqual( obj.prop, 50, "obj.prop" );
	
	strictEqual( react( obj, ".inner.prop = 100" ), 100, "react( obj, \".inner.prop = 100\" )" );
	strictEqual( react( obj, ".inner.prop" ), 100, "react( obj, \".inner.prop\" )" );
	strictEqual( obj.inner.prop, 100, "obj.inner.prop" );
	
	ok( react( "delete", obj, ".prop" ), "react( \"delete\", obj, \".prop\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "delete", obj, ".inner.prop" ), "react( \"delete\", obj, \".inner.prop\" )" );
	strictEqual( "prop" in obj.inner, false, "\"prop\" in obj.inner" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "2 paths registered" );
	
	ok( react( "~", obj, ".prop; ~", obj, ".inner.prop" ), "react( \"~\", obj, \".prop; ~\", obj, \".inner.prop\" )" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );

test( "reversible assignment to and deletion of object properties", function() {
	var obj = { prop : 'value' };
	
	ok( react( obj, ".prop ~= 'foo'" ), "react( obj, \".prop ~= 'foo'\" )" );
	strictEqual( obj.prop, "foo", "obj.prop" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	strictEqual( obj.prop, "value", "obj.prop" );
	
	ok( react( "~delete", obj, ".prop" ), "react( \"~delete\", obj, \".prop\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	strictEqual( obj.prop, "value", "obj.prop" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );


module( "Function literals with literal arguments" );

test( "calling functions", function() {
	var func = function( fst, snd ) {
		return snd ? "two args" : fst ? "one arg" : "no args";
	};
	
	ok( func, "function( fst, snd ) { return snd ? \"two args\" : fst ? \"one arg\" : \"no args\"; }" );
	strictEqual( react( func, "()" ), "no args", "react( func, \"()\" )" );
	strictEqual( react( func, "( true )" ), "one arg", "react( func, \"( true )\" )" );
	strictEqual( react( func, "( true, true )" ), "two args", "react( func, \"( true, true )\" )" );
	
	raises( function() { react( 5, "()" ) }, "calling not a function: react( 5, \"()\" ) -> exception" );
	
	strictEqual( countProps( react.leak.FunctionCall.prototype._paths ), 0, "no calls registered" );
} );

test( "calling functions regarding operator precedence", function() {
	var func = function( a, b ) { return b !== undefined ? a + b : a; };
	
	ok( func, "function( a, b ) { return b !== undefined ? a + b : a; }" );
	
	strictEqual( react( "( true &&", func, ")( 2 )" ), 2, "react( \"( true &&\", func, \")( 2 )\" )" );
	
	strictEqual( react( func, "( 5+3 )" ), 8, "react( func, \"( 5+3 )\" )" );
	strictEqual( react( func, "( 5, 3*2 )" ), 11, "react( func, \"( 5, 3*2\" )" );
	strictEqual( react( func, "( 5 ) + 4" ), 9, "react( func, \"( 5 ) + 4\" )" );
	strictEqual( react( "5 + ", func, "( 5 )" ), 10, "react( \"5 + \", func, \"( 5 )\" )" );
	strictEqual( react( func, "( 5 ) + 4" ), 9, "react( func, \"( 5 ) + 4\" )" );
	
	strictEqual( countProps( react.leak.FunctionCall.prototype._paths ), 0, "no calls registered" );
} );

test( "calling methods of objects", function() {
	var func = function( arg ) { return this.ctxt + ( arg ? "one arg" : "no arg" ); },
		obj = { ctxt : "obj+", func : func, inner : { ctxt : "inner+", func : func } };
	
	ok( func, "function( arg ) { return this.ctxt + ( arg ? \"one arg\" : \"no arg\" ); }" );
	ok( obj, "{ ctxt : \"ctxt+\", inner : { ctxt : \"inner+\", func : func }, func : func }" );
	
	strictEqual( react( obj, ".func()" ), "obj+no arg", "test context: react( obj, \".func()\" )" );
	strictEqual( react( obj, "[ 'func' ]( true )" ), "obj+one arg", "test context: react( obj, \"[ 'func' ]( true )\" )" );
	
	strictEqual( react( obj, ".inner.func()" ), "inner+no arg", "test fcontext: react( obj, \".inner.func()\" )" );
	strictEqual( react( obj, ".inner[ 'func' ]( true )" ), "inner+one arg", "test context: react( obj, \".inner[ 'func' ]( true )\" )" );
	
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 4, "4 registered functions" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "2 registered paths" );
	
	ok( react( "~", obj, ".func(); ~", obj, ".func( true ); ~", obj, ".inner.func(); ~", obj, ".inner.func( true )" ),
		"react( \"~\", obj, \".func(); ~\", obj, \".func( true ); ~\", obj, \".inner.func(); ~\", obj, \".inner.func( true )\" )" );
	
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "0 registered functions" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "0 registered paths" );
} );


module( "Variables with simple values (named and anonymous)" );

test( "extern (re-)assignment", function() {
	var rea = react.leak( "rea = 'variable'" ),
		pi = react.leak( "pi" );
	
	ok( react.leak.nameTable.table.rea === rea, "rea has been stored in the variable name table." );
	
	ok( rea, "rea = react.leak( \"rea = 'variable'\" )" );
	strictEqual( rea.valueOf(), 'variable', "rea.valueOf() after assignment" );
	strictEqual( rea.toString(), 'rea = "variable"', "rea.toString() after assignment" );
	
	ok( react( rea, "= 'new variable'" ), "react( rea, \"= 'new variable'\" )" );
	strictEqual( rea.valueOf(), 'new variable', "rea.valueOf() after reassignment" );
	strictEqual( rea.toString(), 'rea = "new variable"', "rea.toString() after reassignment" );
	
	strictEqual( react.leak( rea, "=", rea, " + '!!!'" )._value.value, "new variable!!!", "infix calculation with self-reference: react( rea, \"=\", rea, \" + '!!!'\" )._value === \"new variable!!!\"" );
	
	ok( react( rea, "= 5" ), "react( rea, \"= 5\" )" );
	strictEqual( react.leak( rea, "= -", rea, "* 0.5" )._value.value, -2.5, "prefix calculation with self-reference: react( rea, \"= -\", rea, \"* 0.5\" )._value === -2.5" );
	
	react( "delete rea" );
	
	raises( function() { react( {}, " = 5" ) }, "react( {}, \" = 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( {}, " = 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( {}, \" = 5\" ) -> exception" );
	
	raises( function() { react( 10, " = 5" ) }, "react( 10, \" = 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( 10, " = 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( 10, \" = 5\" ) -> exception" );
	
	raises( function() { react( pi, " = 5" ) }, "react( pi, \" = 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( pi, " = 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: variable is immutable (constant).", "react( pi, \" = 5\" ) -> exception" );
} );

test( "extern evaluation", function() {
	var rea = react.leak( "rea = 5" );
	
	ok( rea, "rea = react.leak( \"rea = 5\" )" );
	
	strictEqual( rea.valueOf(), 5, "rea.valueOf()" );
	strictEqual( rea.toString(), "rea = 5", "rea.toString()" );
	
	react( "delete rea" );
} );

test( "extern delete", function() {
	var rea = react.leak( "rea = 5" ),
		pi = react.leak( "pi" );
	
	strictEqual( react( "delete", rea ), true, "react( \"delete\", rea )" );
	
	ok( !("rea" in react.leak.nameTable.table), "rea has been deleted from the variable name table." );
	
	ok( !rea.hasOwnProperty( "_value" ), "value of rea removed" );
	ok( !rea.hasOwnProperty( "_dep" ), "dependencies of rea removed" );
	ok( !rea.hasOwnProperty( "_partOf" ), "partOf of rea removed" );
	
	raises( function() { react( "delete", pi ) }, "react( \"delete\", pi ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "delete", pi );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: variable is immutable (constant).", "react( \"delete\", pi ) -> exception" );
	
	raises( function() { react( "delete", 5 ) }, "react( \"delete\", 5 ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "delete", 5 );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( \"delete\", 5 ) -> exception" );
} );

test( "intern (re-)assignment of named variables", function() {
	var rea;
	
	ok( rea = react.leak( "rea = 'variable'" ), "rea = react.leak( \"rea = 'variable'\" )" );
	strictEqual( react.leak( "rea" ), rea, "rea === react.leak( \"rea\" )" );
	
	strictEqual( rea.valueOf(), 'variable', "rea.valueOf() after assignment" );
	strictEqual( rea.toString(), 'rea = "variable"', "rea.toString() after assignment" );
	
	ok( react( "rea = 'new variable'" ), "react( \"rea = 'new variable'\" )" );
	strictEqual( rea.valueOf(), 'new variable', "rea.valueOf() after reassignment" );
	strictEqual( rea.toString(), 'rea = "new variable"', "rea.toString() after assignment" );
	
	strictEqual( react.leak( "rea = rea + '!!!'" )._value.value, "new variable!!!", "infix calculation with self-reference: react( \"rea = rea + '!!!'\" )._value === \"new variable!!!\"" );
	
	ok( react( "rea = 5" ), "react( \"rea = 5\" )" );
	strictEqual( react.leak( "rea = -rea * 0.5" )._value.value, -2.5, "prefix calculation with self-reference: react( \"rea = -rea * 0.5\" )._value === -2.5" );
	
	ok( react( "rea = rea2 = 10" ), "react( \"rea = rea2 = 10\" )" );
	strictEqual( react( "rea" ), 10, "react( \"rea\" )" );
	strictEqual( react( "rea2" ), 10, "react( \"rea2\" )" );
	
	raises( function() { react( "'str' = 5" ) }, "react( \"'str' = 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "'str' = 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( \"'str' = 5\" ) -> exception" );
	
	raises( function() { react( "pi = 5" ) }, "react( \"pi = 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "pi = 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: variable is immutable (constant).", "react( \"pi = 5\" ) -> exception" );
	
	react( "delete rea; delete rea2" );
} );

test( "intern delete of named variables", function() {
	var rea = react.leak( "rea = 5" );
	
	strictEqual( rea._key, "rea", "key of rea is set to \"rea\"" );
	strictEqual( react( "delete rea" ), true, "react( \"delete rea\" )" );
	
	ok( !("rea" in react.leak.nameTable.table), "rea has been deleted from the variable name table." );
	
	raises( function() { react( "rea" ) }, "after delete: react( \"rea\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "rea" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | rea is not defined.", "react( \"rea\" ) -> exception" );
	
	ok( react( "delete rea" ), "delete not defined variable: react( \"delete rea\" )" );
	
	raises( function() { react( "delete pi" ) }, "react( \"delete pi\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "delete pi" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: variable is immutable (constant).", "react( \"delete pi\" ) -> exception" );
	
	raises( function() { react( "delete 5" ) }, "react( \"delete 5\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "delete 5" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( \"delete 5\" ) -> exception" );
} );

test( "operator assignments", function() {
	var rea = react.leak( "rea = 5" ),
		anonym = react.leak( "10" );
	
	ok( rea, "rea = react.leak( \"rea = 5\" )" );
	ok( anonym, "anonym = react.leak( \"10\" )" );
	
	react( "rea *= 8 + 2" );
	strictEqual( rea._value.value, 50, "named variable, infix operator: react.leak( \"rea *= 8 + 2\" )._value === 50" );
	
	react( "-=rea * 0.5" );
	strictEqual( rea._value.value, -25, "named variable, prefix operator: react.leak( \"-=rea * 0.5\" )._value === -25" );
	
	react( "-.=rea * 2" );
	strictEqual( rea._value.value, 50, "named variable, separeted prefix operator: react.leak( \"-.=rea * 2\" )._value === 50" );
	
	react( "rea +.= 30" );
	strictEqual( rea._value.value, 80, "named variable, separated infix operator: react.leak( \"rea +)= 30\" )._value === 5" );
	
	var innerObj;
	react( "rea = ", { inner : innerObj = { prop : false } } );
	ok( rea, "react( \"rea =\", { inner : innerObj = { prop : false } } )" );
	
	react( "rea.=inner" );
	strictEqual( rea.valueOf(), innerObj, "property access assignment: react.leak( \"rea .= inner\" )._value === innerObj" );
	
	react( "rea[= 'prop' ]" );
	strictEqual( rea.valueOf(), false, "property access assignment: react.leak( \"rea[= 'prop' ]\" )._value === false" );
	
	react( "rea ?= 'bar' : 'foo'" );
	strictEqual( rea.valueOf(), "foo", "conditional assignment: react.leak( \"rea ?= 'bar' : 'foo'\" )._value === 'foo'" );
	
	react( "(= rea + 'baz' ) + 5" );
	strictEqual( rea.valueOf(), "foobaz", "parenthesis assignment: react( \"(= rea + 'baz' ) + 5\" ), rea._value === 'foobaz'" );
	
	rea = react.leak( "delete= rea" );
	strictEqual( rea._value.value, true, "delete assignment: react( \"delete= rea\" ), rea._value === true" );
	
	react( "rea =.= 120" )
	strictEqual( rea._value.value, 120, "assignment assignment: react( \"rea =.= 120\" ), rea._value === 120" );
	
	raises( function(){ react( "8 *= rea + 2" ) }, "react( \"8 *= rea + 2\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "8 *= rea + 2" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( \"8 *= rea + 2\" ) -> exception" );
	
	raises( function(){ react( "-= 0.5 * rea" ) }, "react( \"-=0.5 * rea\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "-= 0.5 * rea" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( \"-=0.5 * rea\" ) -> exception" );
	
	raises( function(){ react( anonym, "+= 10" ) }, "anonymous variable of basic datatype does not exist: react( anonym, \"+= 10\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( anonym, "+= 10" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Bad lvalue: no variable or object property.", "react( anonym, \"+= 10\" ) -> exception" );
} );


module( "Operators applied on variables" );

test( "not", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		foo  = react.leak( "foo = 'foo'" );
	
	ok( compare( react.leak( "no partOf", "!foo" ), [ "!", foo ] ), "react( \"!foo\" )" );
	ok( compare( react.leak( "no partOf", "!!foo" ), [ "!", [ "!", foo ] ] ), "react( \"!!foo\" )" );
	ok( compare( react.leak( "no partOf", "!!!foo" ), [ "!", foo ] ), "react( \"!!!foo\" )" );
	ok( compare( react.leak( "no partOf", "!(t || f)" ), [ "!", [ "||", t, f ] ] ), "react( \"!(t || f)\" )" );
	
	react( "clean" )
} );

test( "and", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		foo  = react.leak( "foo = 'foo'" );
	
	ok( react.leak( "no partOf", "5 && foo" ) === foo, "lit && ref/arr: react( \"5 && foo\" )" );
	ok( compare( react.leak( "no partOf", "t && f" ), [ "&&", t, f ] ), "ref && lit/ref: react( \"t && f\" )" );
	ok( compare( react.leak( "no partOf", "( t && f ) && x" ), [ "&&", t, f, x ] ), "arr && lit/ref: react( \"( t && f ) && x\" )" );
	ok( compare( react.leak( "no partOf", "t && ( f && x )" ), [ "&&", t, f, x ] ), "ref && arr: react( \"t && ( f && x )\" )" );
	ok( compare( react.leak( "no partOf", "( t && f ) && ( x && y )" ), [ "&&", t, f, x, y ] ), "arr && arr (same op): react( \"( t && f ) && ( x && y )\" )" );
	ok( compare( react.leak( "no partOf", "( t || f ) && ( x || y )" ), [ "&&", [ "||", t, f ], [ "||", x, y ] ] ), "arr && arr (diff op): react( \"( t || f ) && ( x || y )\" )" );
	
	react( "clean" )
} );

test( "or", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		foo  = react.leak( "foo = 'foo'" );
	
	strictEqual( react.leak( "no partOf", "5 || foo" ), 5, "lit || ref/arr: react( \"5 || foo\" )" );
	ok( compare( react.leak( "no partOf", "t || f" ), [ "||", t, f ] ), "ref || lit/ref: react( \"t || f\" )" );
	ok( compare( react.leak( "no partOf", "( t || f ) || x" ), [ "||", t, f, x ] ), "arr || lit/ref: react( \"( t || f ) || x\" )" );
	ok( compare( react.leak( "no partOf", "t || ( f || x )" ), [ "||", t, f, x ] ), "ref || arr: react( \"t || ( f || x )\" )" );
	ok( compare( react.leak( "no partOf", "( t || f ) || ( x || y )" ), [ "||", t, f, x, y ] ), "arr || arr (same op): react( \"( t || f ) || ( x || y )\" )" );
	ok( compare( react.leak( "no partOf", "( t && f ) || ( x && y )" ), [ "||", [ "&&", t, f ], [ "&&", x, y ] ] ), "arr || arr (diff op): react( \"( t && f ) || ( x && y )\" )" );
	
	react( "clean" )
} );

test( "(in)equalities, smaller, greater (all behave in the same way)", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "true == f" ), [ "==", true, f ] ), "lit == ref: react( \"true == f\" )" );
	ok( compare( react.leak( "no partOf", "10 !== (x && y)" ), [ "!", [ "===", 10, [ "&&", x, y ] ] ] ), "lit !== arr: react( \"10 !== (x && y)\" )" );
	ok( compare( react.leak( "no partOf", "t != false" ), [ "!", [ "==", t, false ] ] ), "ref != lit: react( \"t != false\" )" );
	ok( compare( react.leak( "no partOf", "t === f" ), [ "===", t, f ] ), "ref === ref: react( \"t === f\" )" );
	ok( compare( react.leak( "no partOf", "one > (x && y)" ), [ ">", one, [ "&&", x, y ] ] ), "ref > arr: react( \"one > (x && y)\" )" );
	ok( compare( react.leak( "no partOf", "(x && y) < 10" ), [ "<", [ "&&", x, y ], 10 ] ), "arr < lit: react( \"(x && y) < 10\" )" );
	ok( compare( react.leak( "no partOf", "(x && y) <= zero" ), [ "||", [ "<", [ "&&", x, y ], zero ], [ "==", [ "&&", x, y ], zero ] ] ), "arr <= ref: react( \"(x && y) <= zero\" )" );
	ok( compare( react.leak( "no partOf", "(x && y) >= (zero && one)" ), [ "||", [ ">", [ "&&", x, y ], [ "&&", zero, one ] ], [ "==", [ "&&", x, y ], [ "&&", zero, one ] ] ] ), "arr >= arr: react( \"(x && y) >= (zero && one)\" )" );
	
	react( "clean" )
} );

test( "in", function() {
	var u = react.leak( "u = undefined" ),
		t = react.leak( "t = true" ),
		prop = react.leak( "prop = 'prop'" );
		
	var objLit = {},
		obj = react.leak( "obj = ", objLit );
	
	ok( objLit, "objLit = {}" );
	ok( obj, "react( \"obj = \", {} )" );
	ok( prop, "react( \"prop = 'prop'\" )" );
	
	ok( compare( react.leak( "no partOf", "'prop' in obj" ), [ "in", "prop", obj ] ), "lit in ref: react( \"'prop' in obj\" )" );
	ok( compare( react.leak( "no partOf", "'prop' in ( t ? obj : u )" ), [ "in", "prop", [ "?", t, [ ":", obj, u ] ] ] ), "lit in arr: react( \"'prop' in ( t ? obj : u )\" )" );
	ok( compare( react.leak( "no partOf", "prop in", objLit ), [ "in", prop, objLit ] ), "ref in lit: react( \"prop in\", objLit )" );
	ok( compare( react.leak( "no partOf", "prop in obj" ), [ "in", prop, obj ] ), "ref in ref: react( \"prop in obj\" )" );
	ok( compare( react.leak( "no partOf", "prop in ( t ? obj : u )" ), [ "in", prop, [ "?", t, [ ":", obj, u ] ] ] ), "ref in arr: react( \"prop in ( t ? obj : u )\" )" );
	ok( compare( react.leak( "no partOf", "( t ? prop : u ) in", objLit ), [ "in", [ "?", t, [ ":", prop, u ] ], objLit ] ), "arr in lit: react( \"( t ? prop : u ) in\", objLit )" );
	ok( compare( react.leak( "no partOf", "( t ? prop : u ) in obj" ), [ "in", [ "?", t, [ ":", prop, u ] ], obj ] ), "arr in ref: react( \"( t ? prop : u ) in obj\" )" );
	ok( compare( react.leak( "no partOf", "( t ? prop : u ) in ( t ? obj : u )" ), [ "in", [ "?", t, [ ":", prop, u ] ], [ "?", t, [ ":", obj, u ] ] ] ), "arr in ref: react( \"( t ? prop : u ) in ( t ? obj : u )\" )" );
	react( "delete prop" );
	
	react( "clean" )
} );

test( "instanceof", function() {
	var u = react.leak( "u = undefined" ),
		t = react.leak( "t = true" );
	
	var instLit = {},
		inst = react.leak( "inst = ", instLit ),
		ObjLit = Object,
		Obj = react.leak( "Obj = ", ObjLit );
	
	ok( instLit, "instLit = {}" );
	ok( inst, "react( \"inst = \", {} )" );
	ok( ObjLit, "ObjLit = Object" );
	ok( Obj, "react( \"Obj = \", ObjLit )" );
	
	ok( compare( react.leak( "no partOf", instLit, "instanceof Obj" ), [ "instanceof", instLit, Obj ] ), "lit instanceof ref: react( instLit, \"instanceof Obj\" )" );
	ok( compare( react.leak( "no partOf", instLit, "instanceof ( t ? Obj : u )" ), [ "instanceof", instLit, [ "?", t, [ ":", Obj, u ] ] ] ), "lit instanceof arr: react( instLit, \"instanceof ( t ? Obj : u )\" )" );
	ok( compare( react.leak( "no partOf", "inst instanceof", ObjLit ), [ "instanceof", inst, ObjLit ] ), "ref instanceof lit: react( \"inst instanceof\", ObjLit )" );
	ok( compare( react.leak( "no partOf", "inst instanceof Obj" ), [ "instanceof", inst, Obj ] ), "ref instanceof ref: react( \"inst instanceof Obj\" )" );
	ok( compare( react.leak( "no partOf", "inst instanceof ( t ? Obj : u )" ), [ "instanceof", inst, [ "?", t, [ ":", Obj, u ] ] ] ), "ref instanceof arr: react( \"inst instanceof ( t ? Obj : u )\" )" );
	ok( compare( react.leak( "no partOf", "( t ? inst : u ) instanceof", ObjLit ), [ "instanceof", [ "?", t, [ ":", inst, u ] ], ObjLit ] ), "arr instanceof lit: react( \"( t ? inst : u ) instanceof\", ObjLit )" );
	ok( compare( react.leak( "no partOf", "( t ? inst : u ) instanceof Obj" ), [ "instanceof", [ "?", t, [ ":", inst, u ] ], Obj ] ), "arr instanceof ref: react( \"( t ? inst : u ) instanceof Obj\" )" );
	ok( compare( react.leak( "no partOf", "( t ? inst : u ) instanceof ( t ? Obj : u )" ), [ "instanceof", [ "?", t, [ ":", inst, u ] ], [ "?", t, [ ":", Obj, u ] ] ] ), "arr instanceof arr: react( \"( t ? inst : u ) instanceof ( t ? Obj : u )\" )" );
	
	react( "clean" )
} );

test( "basic addition with 0", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( react.leak( "no partOf", "x + 0" ) === x, "react( \"x + 0\" )" );
	ok( compare( react.leak( "no partOf", "(x + y) + 0" ), [ "+", x, y ] ), "(x + y) + 0 = x + y" );
	
	react( "clean" )
} );

test( "basic addition", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "5 + x" ), [ "+", 5, x ] ), "lit + ref: react( \"5 + x\" )" );
	ok( compare( react.leak( "no partOf", "x + 5" ), [ "+", x, 5 ] ), "ref + lit: react( \"x + 5\" )" );
	ok( compare( react.leak( "no partOf", "x + y" ), [ "+", x, y ] ), "ref + ref: react( \"x + y\" )" );
	ok( compare( react.leak( "no partOf", "x + ( one + y )" ), [ "+", x, one, y ] ), "ref + arr: react( \"x + ( one + y )\" )" );
	ok( compare( react.leak( "no partOf", "( one + y ) + x" ), [ "+", one, y, x ] ), "arr + ref: react( \"( one + y ) + x\" )" );
	ok( compare( react.leak( "no partOf", "( one + y ) + ( 5 + x )" ), [ "+", one, y, 5, x ] ), "arr + ref: react( \"( one + y ) + ( 5 + x )\" )" );
	
	react( "clean" )
} );

test( "basic multiplication with 1 and 0", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( react.leak( "no partOf", "1*x" ) === x, "1*x = x" );
	
	ok( compare( react.leak( "no partOf", "1*x*y" ), [ "*", x, y ] ), "1*x*y = x*y" );
	ok( compare( react.leak( "no partOf", "1*(x+y)" ), [ "+", x, y ] ), "1*(x+y) = x+y" );
	strictEqual( react.leak( "no partOf", "0*x" ), 0, "0*x = 0" );
	strictEqual( react.leak( "no partOf", "0*x*y" ), 0, "0*x*y = 0" );
	strictEqual( react.leak( "no partOf", "0*(x+y)" ), 0, "0*(x+y) = 0" );
	
	react( "clean" )
} );

test( "basic multiplication", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "5 * x" ), [ "*", 5, x ] ), "lit * ref: react( \"5 * x\" )" );
	ok( compare( react.leak( "no partOf", "x * 5" ), [ "*", 5, x ] ), "ref * lit: react( \"x * 5\" )" );
	ok( compare( react.leak( "no partOf", "x * y" ), [ "*", x, y ] ), "ref * ref: react( \"x * y\" )" );
	ok( compare( react.leak( "no partOf", "x * ( one * y )" ), [ "*", x, one, y ] ), "ref * arr: react( \"x * ( one * y )\" )" );
	ok( compare( react.leak( "no partOf", "( one * y ) * x" ), [ "*", one, y, x ] ), "arr * ref: react( \"( one * y ) * x\" )" );
	ok( compare( react.leak( "no partOf", "( one * y ) * ( 5 * x )" ), [ "*", 5, one, y, x ] ), "arr * arr: react( \"( one * y ) * ( 5 * x )\" )" );
	
	react( "clean" )
} );

test( "string catenation", function() {
	var foo  = react.leak( "foo = 'foo'" ),
		bar  = react.leak( "bar = 'bar'" );
	
	ok( compare( react.leak( "no partOf", "foo + foo" ), [ "+", foo, foo ] ), "foo + foo" );
	ok( compare( react.leak( "no partOf", "foo + ( foo + bar )" ), [ "+", foo, foo, bar ] ), "foo + ( foo + bar )" );
	ok( compare( react.leak( "no partOf", "foo + ( bar + foo )" ), [ "+", foo, bar, foo ] ), "foo + ( bar + foo )" );
	ok( compare( react.leak( "no partOf", "( foo + bar ) + foo" ), [ "+", foo, bar, foo ] ), "( foo + bar ) + foo" );
	ok( compare( react.leak( "no partOf", "( bar + foo ) + foo" ), [ "+", bar, foo, foo ] ), "( bar + foo ) + foo" );
	
	react( "clean" )
} );

test( "more addition: non-+-Arrays", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "( one * y ) + x" ), [ "+", [ "*", one, y ], x ] ), "arr + ref: react( \"( one * y ) + x\" )" );
	ok( compare( react.leak( "no partOf", "( one * y ) + ( 5 + x )" ), [ "+", [ "*", one, y ], 5, x ] ), "arr + arr: react( \"( one * y ) + ( 5 + x )\" )" );
	ok( compare( react.leak( "no partOf", "( one + y ) + ( 5 * x )" ), [ "+", one, y, [ "*", 5, x ] ] ), "arr + arr: react( \"( one + y ) + ( 5 * x )\" )" );
	ok( compare( react.leak( "no partOf", "( one * y ) + ( 5 * x )" ), [ "+", [ "*", one, y ], [ "*", 5, x ] ] ), "arr + arr: react( \"( one * y ) + ( 5 * x )\" )" );
	
	react( "clean" )
} );

test( "more addition: factor out doubles", function() {
	var x = react.leak( "x = 2.6" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "( one + 5 ) + ( 5 + x )" ), [ "+", one, 10, x ] ), "( one + 5 ) + ( 5 + x ) = one + 10 + x" );
	
	react( "clean" )
} );

test( "more addition: factor out single + double", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( compare( react.leak( "no partOf", "x + ( x * y )" ), [ "*", x, [ "+", 1, y ] ] ), "x + ( x * y ) = x * ( 1 + y )" );
	ok( compare( react.leak( "no partOf", "x + ( y * x )" ), [ "*", [ "+", 1, y ], x ] ), "x + ( y * x ) = ( 1 + y ) * x" );
	ok( compare( react.leak( "no partOf", "( x * y ) + x" ), [ "*", x, [ "+", y, 1 ] ] ), "( x * y ) + x = x * ( y + 1 )" );

	ok( compare( react.leak( "no partOf", "( y * x ) + x" ), [ "*", [ "+", y, 1 ], x ] ), "( y * x ) + x = ( y + 1 ) * x" );
	
	react( "clean" )
} );

test( "more addition: factor out double + double", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "( 3 * x ) + ( x * y )" ), [ "*", x, [ "+", 3, y ] ] ), "( 3 * x ) + ( x * y ) = x * ( 3 + y )" );
	ok( compare( react.leak( "no partOf", "( 3 * x ) + ( 2 * x )" ), [ "*", 5, x ] ), "( 3 * x ) + ( 2 * x ) = 5 * x" );
	ok( compare( react.leak( "no partOf", "( y * x ) + ( 2 * x )" ), [ "*", [ "+", y, 2 ], x ] ), "( y * x ) + ( 2 * x ) = ( y + 2 ) * x" );
	ok( compare( react.leak( "no partOf", "( 3 * x ) + ( y * x )" ), [ "*", [ "+", 3, y ], x ] ), "( 3 * x ) + ( y * x ) = ( 3 + y ) * x" );
	ok( compare( react.leak( "no partOf", "( one * x ) + ( x * y )" ), [ "+", [ "*", one, x ], [ "*", x, y ] ] ), "( one * x ) + ( x * y ) = ( one * x ) + ( x * y )" );
	ok( compare( react.leak( "no partOf", "( x * one * y ) + ( x * zero * y )" ), [ "*", x, [ "+", one, zero ], y ] ), "( x * one * y ) + ( x * zero * y ) = x * ( one + zero ) * y" );
	
	react( "clean" )
} );

test( "subtraction", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	strictEqual( react.leak( "no partOf", "x - x" ), 0, "x - x = 0" );
	
	ok( react.leak( "no partOf", "(x + y) - y" ) === x, "( x + y ) - y = x" );
	
	ok( compare( react.leak( "no partOf", "( x + y + one ) - y" ), [ "+", x, one ] ), "( x + y + one ) - y = x + one" );
	ok( compare( react.leak( "no partOf", "x - y" ), [ "+", x, [ "*", -1, y ] ] ), "x - y = x + ( -1 * y )" );
	ok( compare( react.leak( "no partOf", "x - 5 - y" ), [ "+", x, -5, [ "*", -1, y ] ] ), "x - 5 - y = x - 5 + ( -1 * y )" );
	ok( compare( react.leak( "no partOf", "x - ( one + y )" ), [ "+", x, [ "*", -1, [ "+", one, y ] ] ] ), "x - ( one + y ) = x + ( -1 * ( one + y ) )" );
	
	react( "clean" )
} );

test( "basic exponentiation with 1 and 0", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	strictEqual( react.leak( "no partOf", "x^0" ), 1, "react( \"x^0\" )" );
	ok( react.leak( "no partOf", "x^1" ) === x, "react( \"x^1\" )" );
	strictEqual( react.leak( "no partOf", "0^x" ), 0, "react( \"0^x\" )" );
	strictEqual( react.leak( "no partOf", "1^x" ), 1, "react( \"1^x\" )" );
	
	strictEqual( react.leak( "no partOf", "(x^y)^0" ), 1, "react( \"(x^y)^0\" )" );
	ok( compare( react.leak( "no partOf", "(x^y)^1" ) , [ "^", x, y ] ), "(x^y)^1" );
	strictEqual( react.leak( "no partOf", "0^(x^y)" ), 0, "react( \"0^(x^y)\" )" );
	strictEqual( react.leak( "no partOf", "1^(x^y)" ), 1, "react( \"1^(x^y)\" )" );
	
	react( "clean" )
} );

test( "basic exponentiation", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "x^2" ), [ "^", x, 2 ] ), "x^2" );
	ok( compare( react.leak( "no partOf", "2^x" ), [ "^", 2, x ] ), "2^x" );
	ok( compare( react.leak( "no partOf", "x^y" ), [ "^", x, y ] ), "x^y" );
	ok( compare( react.leak( "no partOf", "(x^2)^-1" ), [ "^", x, -2 ] ), "(x^2)^-1" );
	ok( compare( react.leak( "no partOf", "x^y^one" ), [ "^", x, y, one ] ), "x^y^one" );
	ok( compare( react.leak( "no partOf", "x^(y^one)" ), [ "^", x, y, one ] ), "x^(y^one)" );
	ok( compare( react.leak( "no partOf", "(x^y)^one" ), [ "^", [ "^", x, y ], one ] ), "(x^y)^one" );
	ok( compare( react.leak( "no partOf", "(x^y)^(one^zero)" ), [ "^", [ "^", x, y ], one, zero ] ), "(x^y)^(one^zero)" );
	ok( compare( react.leak( "no partOf", "x^(y^one)^zero" ), [ "^", x, [ "^", y, one ], zero ] ), "x^(y^one)^zero" );
	
	react( "clean" )
} );

test( "more addition: add powers of x", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( compare( react.leak( "no partOf", "x^2 + x^4" ), [ "*", [ "^", x, 2 ], [ "+", 1, [ "^", x, 2 ] ] ] ), "x^2 + x^4 = x^2 * ( 1 + x^2 )" );
	ok( compare( react.leak( "no partOf", "x^-4 + x^-6" ), [ "*", [ "^", x, -4 ], [ "+", 1, [ "^", x, -2 ] ] ] ), "x^-4 + x^-6 = x^-4 * ( 1 + x^-6 )" );
	ok( compare( react.leak( "no partOf", "x^-4 + x^4" ), [ "+", [ "^", x, -4 ], [ "^", x, 4 ] ] ), "x^-4 + x^4" );
	ok( compare( react.leak( "no partOf", "x^2 + x^4*y" ), [ "*", [ "^", x, 2 ], [ "+", 1, [ "*", [ "^", x, 2 ], y ] ] ] ), "x^2 + x^4*y = x^2 * ( 1 + x^2*y )" );
	ok( compare( react.leak( "no partOf", "x^y + x^4" ), [ "+", [ "^", x, y ], [ "^", x, 4 ] ] ), "x^y + x^4" );
	ok( compare( react.leak( "no partOf", "x^y + x^y" ), [ "*", 2, [ "^", x, y ] ] ), "x^y + x^y = 2 * x^y" );
	
	react( "clean" )
} );

test( "more multiplication: factor out doubles", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "( one * 5 ) * ( 5 * x )" ), [ "*", 25, one, x ] ), "( one * 5 ) * ( 5 * x ) = 25 * one * x" );
	ok( compare( react.leak( "no partOf", "( 6 * one ) * ( 5 * x )" ), [ "*", 30, one, x ] ), "( 6 * one ) * ( 5 * x ) = 30 * one * x" );
	ok( compare( react.leak( "no partOf", "x * x" ), [ "^", x, 2 ] ), "x * x = x^2" );
	ok( compare( react.leak( "no partOf", "( x ^ y ) * ( x ^ y )" ), [ "^", x, [ "+", y, y ] ] ), "( x ^ y ) * ( x ^ y ) = x^(2*y)" );
	ok( compare( react.leak( "no partOf", "x * ( x * y )" ), [ "*", [ "^", x, 2 ], y ] ), "x * ( x * y ) = x^2 * y" );
	ok( compare( react.leak( "no partOf", "x * ( y * x )" ), [ "*", x, y, x ] ), "x * ( y * x ) = x * y * x" );
	ok( compare( react.leak( "no partOf", "( x * y ) * x" ), [ "*", x, y, x ] ), "( x * y ) * x = x * y * x" );
	ok( compare( react.leak( "no partOf", "( y * x ) * x" ), [ "*", y, [ "^", x, 2 ] ] ), "( y * x ) * x = y * x^2" );
	
	react( "clean" )
} );

test( "more multiplication: factor out base/exponent", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "( x ^ y ) * ( x ^ one )" ), [ "^", x, [ "+", y, one ] ] ), "( x ^ y ) * ( x ^ one ) = x^( y + one )" );
	ok( compare( react.leak( "no partOf", "( x ^ one ) * ( y ^ one )" ), [ "^", [ "*", x, y ], one ] ), "( x ^ one ) * ( y ^ one ) = ( x * y )^one" );
	
	react( "clean" )
} );

test( "more multiplication: factor out single + double", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( compare( react.leak( "no partOf", "x * ( x ^ y )" ), [ "^", x, [ "+", 1, y ] ] ), "x * ( x ^ y ) = x^( 1 + y )" );
	ok( compare( react.leak( "no partOf", "x * ( y ^ x )" ), [ "*", x, [ "^", y, x ] ] ), "x * ( y ^ x ) = x * y^x" );
	ok( compare( react.leak( "no partOf", "( x ^ y ) * x" ), [ "^", x, [ "+", y, 1 ] ] ), "( x ^ y ) * x = x^( y + 1 )" );

	ok( compare( react.leak( "no partOf", "( y ^ x ) * x" ), [ "*", [ "^", y, x ], x ] ), "( y ^ x ) * x = y^x * x" );
	
	react( "clean" )
} );

test( "more multiplication: factor out double + double", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" );
	
	ok( compare( react.leak( "no partOf", "x^3 * x^y" ), [ "^", x, [ "+", 3, y ] ] ), "x^3 * x^y = x^( 3 + y )" );
	ok( compare( react.leak( "no partOf", "x^3 * x^2" ), [ "^", x, 5 ] ), "x^3 * x^2 = x^5" );
	ok( compare( react.leak( "no partOf", "y^x * 2^x" ), [ "^", [ "*", 2, y ], x ] ), "y^x * 2^x = ( 2 * y )^x" );
	ok( compare( react.leak( "no partOf", "one^x * x^y" ), [ "*", [ "^", one, x ], [ "^", x, y ] ] ), "one^x * x^y" );
	;
	ok( compare( react.leak( "no partOf", "x^one^y * x^zero^y" ), [ "^", x, [ "+", [ "^", one, y ], [ "^", zero, y ] ] ] ), "x^one^y * x^zero^y = x^( one^y + zero^y )" );
	ok( compare( react.leak( "no partOf", "x * ( one * y ) * x" ), [ "*", x, one, y, x ] ), "react( \"x * ( one * y ) * x\" )" );
	
	react( "clean" )
} );

test( "division", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	strictEqual( react.leak( "no partOf", "x / x" ), 1, "x / x = 1" );
	ok( react.leak( "no partOf", "(x * y) / y" ) === x, "( x * y ) / y = x" );
	
	ok( compare( react.leak( "no partOf", "x / y" ), [ "*", x, [ "^", y, -1 ] ] ), "x / y = x * y^-1" );
	ok( compare( react.leak( "no partOf", "( x * y * one ) / y" ), [ "*", x, y, one, [ "^", y, -1 ] ] ), "( x * y * one ) / y = x * y * one * y^-1" );
	ok( compare( react.leak( "no partOf", "( x * one * y ) / y" ), [ "*", x, one ] ), "( x * y * one ) / y = x * one" );
	ok( compare( react.leak( "no partOf", "x / 5 / y" ), [ "*", 1/5, x, [ "^", y, -1 ] ] ), "x / 5 / y = 0.2 * x * y^-1" );
	ok( compare( react.leak( "no partOf", "x / ( 5 * y )" ), [ "*", x, [ "^", [ "*", 5, y ], -1 ] ] ), "x / ( 5 * y ) = x * ( 5 * y )^-1" );
	
	react( "clean" )
} );

test( "modulus", function() {	
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" );
	
	strictEqual( react.leak( "no partOf", "0 % x" ), 0, "react( \"0 % x\" )" );
	strictEqual( react.leak( "no partOf", "x % x" ), 0, "react( \"x % x\" )" );
	ok( isNaN( react.leak( "no partOf", "x % 0" ) ), "isNaN( react( \"x % 0\" ) )" );
	strictEqual( react.leak( "no partOf", "x % 1" ), 0, "react( \"x % 1\" )" );
	
	ok( compare( react.leak( "no partOf", "x % y" ), [ "%", x, y ] ), "react( \"x % y\" )" );
	ok( compare( react.leak( "no partOf", "x % y % one" ), [ "%", x, y, one ] ), "react( \"x % y % one\" )" );
	ok( compare( react.leak( "no partOf", "x % ( y % one )" ), [ "%", x, y, one ] ), "react( \"x % ( y % one )\" )" );
	ok( compare( react.leak( "no partOf", "( x % zero ) % ( y % one )" ), [ "%", x, zero, y, one ] ), "react( \"( x % zero ) % ( y % one )\" )" );
	
	react( "clean" )
} );

test( "ternary operator", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	ok( compare( react.leak( "no partOf", "t ? x : y" ), [ "?", t, [ ":", x, y ] ] ), "react( \"t ? x : y\" )" );
	
	react( "clean" )
} );

test( "conversion", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	ok( compare( react.leak( "no partOf", "+t" ), [ "+", t ] ), "react( \"+t\" )" );
	ok( compare( react.leak( "no partOf", "+(x+t)" ), [ "+", [ "+", x, t ] ] ), "react( \"+(x+t)\" )" );
	ok( compare( react.leak( "no partOf", "++(x+t)" ), [ "+", [ "+", x, t ] ] ), "react( \"++(x+t)\" )" );
	
	react( "clean" )
} );

test( "negation", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	ok( compare( react.leak( "no partOf", "-t" ), [ "*", -1, t ] ), "react( \"-t\" ) = -1 * t" );
	
	ok( compare( react.leak( "no partOf", "-(x+t)" ), [ "*", -1, [ "+", x, t ] ] ), "react( \"-(x+t)\" ) = -1 * (x+t)" );
	ok( compare( react.leak( "no partOf", "--(x+t)" ), [ "+", x, t ] ), "react( \"--(x+t)\" ) = x+t" );
	
	react( "clean" )
} );

test( "typeof", function() {
	var x = react.leak( "x = 2.6" ),
		foo  = react.leak( "foo = 'foo'" );
	
	ok( compare( react.leak( "no partOf", "typeof x" ), [ "typeof", x ] ), "typeof ref: react( \"typeof x\" )" );
	ok( compare( react.leak( "no partOf", "typeof (x+foo)" ), [ "typeof", [ "+", x, foo ] ] ), "typeof arr: react( \"typeof (x+foo)\" )" );
	strictEqual( react.leak( "no partOf", "typeof typeof x" ), "string", "react( \"typeof typeof x\" )" );
	
	react( "clean" )
} );

test( "#", function() {
	var x = react.leak( "x = 2.6" ),
		foo  = react.leak( "foo = 'foo'" );
	
	strictEqual( react.leak( "no partOf", "#x" ), x._value.value, "#ref: react( \"#x\" )" );
	strictEqual( react.leak( "no partOf", "#(x+foo)" ), x._value.value + foo._value.value, "#arr: react( \"#(x+foo)\" )" );
	
	strictEqual( react.leak( "no partOf", "##x" ), x._value.value, "react( \"##x\" )" );
	
	react( "clean" )
	
	react( "clean" )
} );


module( "Variables with complex values composed of other variables (named and anonymous)" );

test( "assignment", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		one  = react.leak( "one = 1" );
	
	var rea = react.leak( "rea = x+y" ),
		z, z2,
		anonym = react.leak( "x+y" );
	
	ok( anonym, "anonym = react.leak( \"x+y\" )" );
	ok( anonym._key == anonym._value.value._guid+1, "anonym is anonymous expression." );
	ok( x._partOf[ anonym._value.value._guid ] === anonym._value.value, "x is part of anonym." );
	ok( y._partOf[ anonym._value.value._guid ] === anonym._value.value, "y is part of anonym." );
	react( "delete", anonym );
	
	ok( rea, "rea = react.leak( \"rea = x+y\" )" );
	ok( x._partOf[ rea._value.value._guid ] === rea._value.value, "x is part of rea." );
	ok( y._partOf[ rea._value.value._guid ] === rea._value.value, "y is part of rea." );
	ok( !(rea._value.value._guid in one._partOf), "one is no part of rea." );
	
	ok( react( rea, "= 5*one" ), "react( rea, \"= 5*one\" )" );
	
	ok( !(rea._guid in x._partOf), "x is no part of rea." );
	ok( !(rea._guid in y._partOf), "y is no part of rea." );
	ok( one._partOf[ rea._value.value._guid ] === rea._value.value, "one is part of rea." );
	
	ok( compare( rea._value.value, [ "*", 5, one ] ), "check expression array of rea" );
	
	ok( react( "rea = rea" ), "self-reference: react( \"rea = rea\" )" );
	
	react( "delete", rea );
	
	z2 = react.leak( "no partOf", "z2 = y" );
	ok( z2, "z2 = react.leak( \"z2 = y\" )" );
	
	react.leak( "no partOf", "z2 = z2 + 10 * x" );
	
	ok( compare( z2._value.value, [ "+", y, [ "*", 10, x ] ] ), "infix calculation with self-reference: react( \"z2 = z2 + 10 * x\" )" );
	
	react.leak( "no partOf", "z2 = -z2" );
	ok( compare( z2._value.value, [ "*", -1, [ "+", y, [ "*", 10, x ] ] ] ), "prefix calculation with self-reference: react( \"z2 = -z2\" )" );
	
	z = react.leak( "no partOf", "z = z2+5" );
	
	ok( compare( z._value.value, [ "+", z2, 5 ] ), "link to variable, that is not defined yet: react( \"z = z2+5\" )" );
	
	raises( function() { react.leak( "no partOf", "z = a+10" ) }, "react( \"z = a+10\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react.leak( "no partOf", "z = a+10" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | a is not defined.", "react( \"z = a+10\" ) -> exception" );
	
	react( "delete z; delete z2;" );
	
	react( "clean" )
} );

test( "delete", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	var rea = react.leak( "rea = x+y" ),
		reb = react.leak( "reb = rea+10" ),
		key = rea._value.value._guid;
	
	ok( rea, "rea = react.leak( \"rea = x+y\" )" );
	ok( reb, "reb = react.leak( \"reb = rea+10\" )" );
	
	ok( x._partOf[ key ] === rea._value.value, "x is part of rea." );
	ok( y._partOf[ key ] === rea._value.value, "y is part of rea." );
	
	raises( function() { react( "delete rea" ) }, "Cannot delete variable in use: react( \"delete rea\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react( "delete rea" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Cannot delete variable rea. It is still used in: " + reb.toString() + ".", "react( \"delete rea\" ) -> exception" );
	
	ok( react( "delete", reb ), "react( \"delete\", reb )" );
	ok( react( "delete", rea ), "react( \"delete\", rea )" );
	ok( !(key in x._partOf), "x is no longer a part of rea." );
	ok( !(key in y._partOf), "y is no longer a part of rea." );
	
	react( "clean" )
} );

test( "clean", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" ),
		zero = react.leak( "zero = 0" ),
		one  = react.leak( "one = 1" ),
		foo  = react.leak( "foo = 'foo'" ),
		bar  = react.leak( "bar = 'bar'" );
	
	var rea = react.leak( "rea = x+y" ),
		reb = react.leak( "reb = rea+10" ),
		rec = react.leak( "rec = rea+'foo'" ),
		red = react.leak( "red = rec+true" ),
		obj = {};
	
	ok( rea, "rea = react.leak( \"rea = x+y\" )" );
	ok( reb, "reb = react.leak( \"reb = rea+10\" )" );
	ok( rec, "rec = react.leak( \"rec = rea+'foo'\" )" );
	ok( red, "red = react.leak( \"red = rec+true\" )" );
	
	ok( react( obj, ".prop = rea" ), "react( obj, \".prop = rea\" )" );
	
	ok( react( "cleanExcept t, f, x, y, foo, bar, zero, one" ), "react( \"cleanExcept t, f, x, y, foo, bar, zero, one\" )" );
	
	ok( t.hasOwnProperty( "_value" ), "t has not been deleted" );
	ok( f.hasOwnProperty( "_value" ), "f has not been deleted" );
	ok( x.hasOwnProperty( "_value" ), "x has not been deleted" );
	ok( y.hasOwnProperty( "_value" ), "y has not been deleted" );
	ok( foo.hasOwnProperty( "_value" ), "foo has not been deleted" );
	ok( bar.hasOwnProperty( "_value" ), "bar has not been deleted" );
	ok( zero.hasOwnProperty( "_value" ), "zero has not been deleted" );
	ok( one.hasOwnProperty( "_value" ), "one has not been deleted" );
	
	ok( rea.hasOwnProperty( "_value" ), "rea has not been deleted" );
	ok( !reb.hasOwnProperty( "_value" ), "reb has been deleted" );
	ok( !rec.hasOwnProperty( "_value" ), "rec has been deleted" );
	ok( !red.hasOwnProperty( "_value" ), "red has been deleted" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	
	ok( react( "clean" ), "react( \"clean\" )" );
	
	ok( isEmptyObj( react.leak.nameTable.table, true ), "all variables deleted" );
	
	react( "clean" )
} );

test( "calculate with extern variables", function() {
	var x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	var anonym = react.leak( "no partOf", x, "+", y ),
		anonym2 = react.leak( "no partOf", anonym, "*5" );
	
	ok( compare( anonym, [ "+", x, y ] ), "calc with named variable: react( x, \"+\", y )" );
	ok( compare( anonym2, [ "*", 5, anonym ] ), "calc with anonymous variable: react( anonym, \"*5\" )" );
	react( "delete", anonym, "; delete", anonym2 );
	
	react( "clean" )
} );

test( "operator assignments", function() {
	var x = react.leak( "x = 2.6" );
	
	var z = react.leak( "z = 5" ),
		anonym = react.leak( "no partOf", "5+x" );
	
	ok( z, "z = react.leak( \"z = 5\" )" );
	ok( anonym, "anonym = react.leak( \"5+x\" )" );
	
	react.leak( "no partOf", "z += 10 * x" );
	react.leak( "no partOf", anonym, "+= 10 * x" );
	
	ok( compare( z._value.value, [ "+", 5, [ "*", 10, x ] ] ), "named variable: react( \"z += 10 * x\" )" );
	ok( compare( anonym, [ "+", 5, [ "*", 11, x ] ] ), "anonymous variable: react( anonym, \"+= 10 * x\" )" );
	
	react.leak( "no partOf", "-=z" );
	ok( compare( z._value.value, [ "*", -1, [ "+", 5, [ "*", 10, x ] ] ] ), "named variable: react( \"-=z\" )" );
	
	react( "z *= z" );
	ok( compare( z._value.value, [ "^", [ "+", 5, [ "*", 10, x ] ], 2 ] ), "named variable: react( \"z *= z\" )" );
	
	var litObj = { prop : 'str' },
		obj = react.leak( "obj = ", litObj );
	
	ok( true, "litObj = { prop : 'str' }" );
	ok( true, "react( \"obj =\", litObj )" );
	ok( obj.valueOf() === litObj, "react( \"obj\" ) === litObj" );
	
	ok( react( "obj.prop += 'ing'" ), "react( \"obj.prop += 'ing'\" )" );
	strictEqual( litObj.prop, "string", "litObj.prop" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	raises( function() { react( "obj.=prop" ) }, "react( \"obj.=prop\" ) makes obj a literal -> exception because of react( \"obj.prop += 'ing'\" )" );
	strictEqual( ( function() {
		try {
			react( "obj.=prop" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | Invalid property path: obj.prop!", "react( \"obj.=prop\" ) -> exception" );
	
	ok( obj.valueOf() === litObj, "react( \"obj\" ).valueOf() unchanged." );
	react( "~obj.prop" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	var func = react.leak( "func = ", function() { return "string" } );
	ok( true, "react( \"func = \", function() { return \"string\" } )" );
	
	react( "func(=)" );
	strictEqual( func._value.value, "string", "function call assignment: react( \"func(=)\" )" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	
	var zVal = z._value.value;
	react.leak( "no partOf", "z ==.= 'bar'" );
	ok( compare( z._value.value, [ "==", zVal, "bar" ] ), "operator assignment separator: react( \"z ==.= 'bar'\" )" );
	
	react( "delete func; delete obj; delete z; delete", anonym );
	
	react( "clean" )
} );

test( "evaluation before and after modifying a part", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	var r1 = react.leak( "r1 = x+t" ),
		xpt = x.valueOf() + t.valueOf();
	
	ok( r1, "r1 = react.leak( \"r1 = x+t\" )" );
	
	strictEqual( r1._evaled.value, undefined, "r1._evaled.value before .valueOf()" );
	strictEqual( r1._evaled.string, undefined, "r1._evaled.string before .toString()" );
	
	strictEqual( r1.valueOf(), xpt, "r1.valueOf()" );
	strictEqual( r1.toString(), "r1 = x + t", "r1.toString()" );
	
	strictEqual( r1._evaled.value, xpt, "r1._evaled.value after .valueOf()" );
	strictEqual( r1._evaled.string, "r1 = x + t", "r1._evaled.string after .toString()" );
	
	ok( react( "x = 8" ), "x changed." );
	
	strictEqual( r1._evaled.value, undefined, "r1._evaled.value after modified part" );
	strictEqual( r1._evaled.string, undefined, "r1._evaled.string after modified part" );
	
	react( "delete r1" );
	
	react( "clean" )
} );

test( "string output", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" ),
		one = react.leak( "one = 1" );
	
	var anonym = react.leak( "x+t" ),
		named = react.leak( "named = ", anonym, " + one" );
	
	ok( anonym, "anonym = react.leak( \"x+t\" )" );
	ok( named, "named = react.leak( \"named = \", anonym, \"+one\" )" );
	
	strictEqual( anonym.toString(), "x + t", "anonym.toString()" );
	strictEqual( named.toString(), "named = {x + t} + one", "named.toString()" );
	
	react( "delete named; delete", anonym );
	
	react( "clean" )
} );


module( "Objects and variables" );

test( "assigning object to variable", function() {
	var obj = { foo : "bar"},
		rea = react.leak( "rea = ", obj );
	
	ok( rea, "rea = react.leak( \"rea = \", { foo : 'bar'} )" );
	strictEqual( rea._value.value, obj, "rea._value after assignment" );
	strictEqual( rea.valueOf(), obj, "rea.valueOf() after assignment" );
	
	react( "delete rea" );
} );

test( "assign object property to variable", function() {
	var obj = { prop : 'string' };
	
	strictEqual( react( "rea =", obj, ".prop" ), "string", "react( \"rea =\", obj, \".prop\" )" );
	ok( obj.prop = 'number', "obj.prop = 'number'" );
	strictEqual( react( "rea" ), "string", "react( \"rea\" )" );
	ok( react( obj, ".prop = 'boolean'" ), "react( obj, \".prop = 'boolean'\" )" );
	strictEqual( react( "rea" ), "boolean", "react( \"rea\" )" );
	
	//FIXME: should "clean" also clean up unused object property paths?
	react( "clean" );
	react( "~", obj, ".prop" );
} );

test( "property access: object is literal, property paths are variables, literals and other property paths", function() {
	var foo  = react.leak( "foo = 'foo'" ),
		bar  = react.leak( "bar = 'bar'" );
	
	var sObj = { fst : 1, snd : 2, foo : { bar : "foo" } };
	
	ok( sObj, "sObj = { fst : 1, snd : 2, foo : { bar : \"foo\" } }" );
	
	ok( compare( react.leak( "no partOf", sObj, "[ foo ]" ), [ ".", sObj, foo ] ), "one propname is variable: react( sObj, \"[ foo ]\" )" );
	ok( compare( react.leak( "no partOf", sObj, "[ foo ][ bar ]" ), [ ".", sObj, foo, bar ] ), "two propnames are variables: react( sObj, \"[ foo ][ bar ]\" )" );
	ok( compare( react.leak( "no partOf", sObj, ".foo[ bar ]" ), [ ".", sObj, "foo", bar ] ), "1st propname constant, 2nd variable: react( sObj, \".foo[ bar ]\" )" );
	ok( compare( react.leak( "no partOf", sObj, "[ foo ].bar" ), [ ".", sObj, foo, "bar" ] ), "1st propname variable, 2nd constant: react( sObj, \"[ foo ].bar\" )" );
	ok( compare( react.leak( "no partOf", sObj, "[ ", sObj, "[ foo ].bar ]" ), [ ".", sObj, [ ".", sObj, foo, "bar" ] ] ), "1st propname also uses property access: react( sObj, \"[ \", sObj, \"[ foo ].bar ]\" )" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );

test( "property access: object is variable, property paths are variables, literals and other property paths", function() {	
	var foo  = react.leak( "foo = 'foo'" ),
		bar  = react.leak( "bar = 'bar'" );
	
	var obj  = react.leak( "obj = ", { foo : { bar : "bar" }, fst : 1, snd : 2 } );
	
	ok( obj, "obj = react.leak( \"obj = \", { foo : { bar : \"bar\" }, fst : 1, snd : 2 } )" );
	
	ok( compare( react.leak( "no partOf", "obj.foo" ), [ ".", obj, "foo" ] ), "one propname is constant: react( obj, \".foo\" )" );
	ok( compare( react.leak( "no partOf", "obj[ foo ]" ), [ ".", obj, foo ] ), "one propname is variable: react( \"obj[ foo ]\" )" );
	ok( compare( react.leak( "no partOf", "obj[ foo ][ bar ]" ), [ ".", obj, foo, bar ] ), "two propnames are variables: react( \"obj[ foo ][ bar ]\" )" );
	ok( compare( react.leak( "no partOf", "obj.foo[ bar ]" ), [ ".", obj, "foo", bar ] ), "1st propname constant, 2nd variable: react( \"obj.foo[ bar ]\" )" );
	ok( compare( react.leak( "no partOf", "obj[ foo ].bar" ), [ ".", obj, foo, "bar" ] ), "1st propname variable, 2nd constant: react( \"obj[ foo ].bar\" )" );
	ok( compare( react.leak( "no partOf", "obj[ obj[ foo ].bar ]" ), [ ".", obj, [ ".", obj, foo, "bar" ] ] ), "1st propname also uses property access: react( \"obj[ obj[ foo ].bar ]\" )" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
} );

test( "permanent property assignment: object literal, property variable", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] = 'value'" ), "react( obj, \"[ prop ] = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "prop = 'foo'" ), "react( \"prop = 'foo'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	react( "delete prop; delete bool;" );
} );

test( "permanent property assignment: object variable, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( react( "robj = ", obj1 ), "react( \"robj = \", obj1 )" );
	
	ok( react( "robj.prop = 'value'" ), "react( \"robj.prop = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "robj = ", obj2 ), "react( \"robj = \", obj2 )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "permanent property assignment: object literal, property Expression", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	ok( react( obj, "[ bool ? 'foo' : 'bar' ] = 'value'" ), "react( obj, \"[ bool ? 'foo' : 'bar' ] = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ bool ? 'foo' : 'bar' ]" ), "react( \"~\", obj, \"[ bool ? 'foo' : 'bar' ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	react( "delete bool;" );
} );

test( "permanent property assignment: object Expression, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "( bool ?", obj1, " : ", obj2, ").prop = 'value'" ), "react( \"( bool ?\", obj1, \" : \", obj2, \").prop = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "~( bool ?", obj1, " : ", obj2, ").prop" ), "react( \"~( bool ?\", obj1, \" : \", obj2, \").prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	react( "delete bool;" );
} );

test( "permanent property assignment: object literal, property property path", function() {
	var obj = {};
	
	ok( react( "propObj =", {} ), "react( \"propObj =\", {} )" );
	ok( react( "propObj.prop = 'prop1'" ), "react( \"propObj.prop = 'prop1'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	ok( react( obj, "[ propObj.prop ] = 'value'" ), "react( obj, \"[ propObj.prop ] = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "two paths registered" );
	strictEqual( obj.prop1, "value", "obj.prop1" );
	ok( react( "propObj.prop = 'prop2'" ), "react( \"propObj.prop = 'prop2'\" )" );
	strictEqual( obj.prop2, "value", "obj.prop2" );
	
	raises( function() { react( "~propObj.prop" ); }, "Cannot deregister prop paths, that are in use: react( \"~propObj.prop\" ) -> exception" );
	
	react( "~", obj, "[ propObj.prop ]" );
	react( "~propObj.prop" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	react( "delete propObj" );
} );

test( "permanent property assignment: object property path, property literal", function() {
	var obj1 = {}, obj2 = {};
	
	ok( react( "objObj =", {} ), "react( \"objObj =\", {} )" );
	ok( react( "objObj.inner =", obj1 ), "react( \"objObj.inner =\", obj1 )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	ok( react( "objObj.inner.prop = 'value'" ), "react( \"objObj.inner.prop = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "two path registered" );
	strictEqual( obj1.prop, "value", "obj1.prop" );
	ok( react( "objObj.inner =", obj2 ), "react( \"objObj.inner =\", obj2 )" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	raises( function() { react( "~objObj.inner" ); }, "Cannot deregister prop paths, that are in use: react( \"~objObj.inner\" ) -> exception" );
	
	react( "~objObj.inner.prop" );
	react( "~objObj.inner" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	react( "delete objObj" );
} );

test( "permanent property assignment: object literal, property function call", function() {
	var prop = function( prop ) {
			return prop;
		},
		obj = {};
	
	ok( react( "prop = 'prop1'" ), "react( \"prop = 'prop1'\" )" );
	
	ok( react( obj, "[", prop, "( prop ) ] = 'value'" ), "react( obj, \"[\", prop, \"( prop ) ] = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 1, "one call registered" );
	strictEqual( obj.prop1, "value", "obj.prop1" );
	ok( react( "prop = 'prop2'" ), "react( \"prop = 'prop2'\" )" );
	strictEqual( obj.prop2, "value", "obj.prop2" );
	
	raises( function() { react( "~", prop, "( prop )" ); }, "Cannot deregister functions, that are in use: react( \"~\", prop, \"( prop )\" ) -> exception" );
	
	react( "~", obj, "[", prop, "( prop ) ]" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	react( "delete prop" );
} );

test( "permanent property assignment: object function call, property literal", function() {
	var obj = function( obj ) {
			return obj;
		},
		obj1 = {},
		obj2 = {};
	
	ok( react( "obj =", obj1 ), "react( \"obj =\", obj1 )" );
	
	ok( react( obj, "( obj )[ 'prop' ] = 'value'" ), "react( obj, \"( obj )[ 'prop' ] = 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 1, "one call registered" );
	strictEqual( obj1.prop, "value", "obj1.prop" );
	ok( react( "obj =", obj2 ), "react( \"obj =\", obj2 )" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	raises( function() { react( "~", obj, "( obj )" ); }, "Cannot deregister functions, that are in use: react( \"~\", obj, \"( obj )\" ) -> exception" );
	
	react( "~", obj, "( obj )[ 'prop' ]" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	react( "delete obj" );
} );

test( "reversible property assignment: object literal, property variable", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'value'" ), "react( obj, \"[ prop ] ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "prop = 'foo'" ), "react( \"prop = 'foo'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	react( "delete prop; delete bool;" );
} );

test( "reversible property assignment: object variable, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( react( "robj = ", obj1 ), "react( \"robj = \", obj1 )" );
	
	ok( react( "robj.prop ~= 'value'" ), "react( \"robj.prop ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "robj = ", obj2 ), "react( \"robj = \", obj2 )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "robj = ", obj1 ), "react( \"robj = \", obj1 )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "reversible property assignment: object literal, property Expression", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	ok( react( "prop = bool ? 'foo' : 'bar'" ), "react( \"prop = bool ? 'foo' : 'bar'\" )" );
	ok( react( obj, "[ prop ] ~= 'value'" ), "react( obj, \"[ prop ] ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	react( "delete prop; delete bool;" );
} );

test( "reversible property assignment: object Expression, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "robj.prop ~= 'value'" ), "react( \"robj.prop ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "reversible property assignment: object literal, property property path", function() {
	var obj = {};
	
	ok( react( "propObj =", {} ), "react( \"propObj =\", {} )" );
	ok( react( "propObj.prop = 'prop1'" ), "react( \"propObj.prop = 'prop1'\" )" );
	
	ok( react( obj, "[ propObj.prop ] ~= 'value'" ), "react( obj, \"[ propObj.prop ] ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "two paths registered" );
	strictEqual( obj.prop1, "value", "obj.prop1" );
	
	ok( react( "propObj.prop = 'prop2'" ), "react( \"propObj.prop = 'prop2'\" )" );
	strictEqual( obj.prop2, "value", "obj.prop2" );
	ok( !( "prop1" in obj ), "!( \"prop1\" in obj )" );
	
	ok( react( "~", obj, "[ propObj.prop ]" ), "react( \"~\", obj, \"[ propObj.prop ]\" )" );
	ok( !( "prop2" in obj ), "!( \"prop2\" in obj )" );
	
	react( "~propObj.prop" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	react( "delete propObj" );
} );

test( "reversible property assignment: object property path, property literal", function() {
	var obj1 = {}, obj2 = {};
	
	ok( react( "objObj =", {} ), "react( \"objObj =\", {} )" );
	ok( react( "objObj.inner =", obj1 ), "react( \"objObj.inner =\", obj1 )" );
	
	ok( react( "objObj.inner.prop ~= 'value'" ), "react( \"objObj.inner.prop ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "two paths registered" );
	strictEqual( obj1.prop, "value", "obj1.prop" );
	
	ok( react( "objObj.inner =", obj2 ), "react( \"objObj.inner =\", obj2 )" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	ok( !( "prop" in obj1 ), "!( \"prop\" in obj1 )" );
	
	ok( react( "~objObj.inner.prop" ), "react( \"~objObj.inner.prop\" )" );
	ok( !( "prop" in obj2 ), "!( \"prop\" in obj2 )" );
	
	react( "~objObj.inner" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	react( "delete objObj" );
} );

test( "reversible property assignment: object literal, property function call", function() {
	var prop = function( prop ) {
			return prop;
		},
		obj = {};
	
	ok( react( "prop = 'prop1'" ), "react( \"prop = 'prop1'\" )" );
	
	ok( react( obj, "[", prop, "( prop ) ] ~= 'value'" ), "react( obj, \"[\", prop, \"( prop ) ] ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 1, "one call registered" );
	strictEqual( obj.prop1, "value", "obj.prop1" );
	
	ok( react( "prop = 'prop2'" ), "react( \"prop = 'prop2'\" )" );
	strictEqual( obj.prop2, "value", "obj.prop2" );
	ok( !( "prop1" in obj ), "!( \"prop1\" in obj )" );
	
	ok( react( "~", obj, "[", prop, "( prop ) ]" ), "react( \"~\", obj, \"[\", prop, \"( prop ) ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	ok( !( "prop2" in obj ), "!( \"prop2\" in obj )" );
	
	react( "delete prop" );
} );

test( "reversible property assignment: object function call, property literal", function() {
	var obj = function( obj ) {
			return obj;
		},
		obj1 = {},
		obj2 = {};
	
	ok( react( "obj =", obj1 ), "react( \"obj =\", obj1 )" );
	
	ok( react( obj, "( obj )[ 'prop' ] ~= 'value'" ), "react( obj, \"( obj )[ 'prop' ] ~= 'value'\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 1, "one call registered" );
	strictEqual( obj1.prop, "value", "obj1.prop" );
	
	ok( react( "obj =", obj2 ), "react( \"obj =\", obj2 )" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	ok( !( "prop" in obj1 ), "!( \"prop\" in obj1 )" );
	
	ok( react( "~", obj, "( obj )[ 'prop' ]" ), "react( \"~\", obj, \"( obj )[ 'prop' ]\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	ok( !( "prop" in obj2 ), "!( \"prop\" in obj2 )" );
	
	react( "delete obj" );
} );

test( "permanent property deletion", function() {
	var obj1 = { prop : "foo" },
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "delete robj.prop" ), "react( \"delete robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj1.prop, "foo", "obj1.prop" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	react( "delete robj; delete bool;" );
} );

test( "reversible property deletion", function() {
	var obj1 = { prop : "foo" },
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "~delete robj.prop" ), "react( \"~delete robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	
	strictEqual( obj1.prop, "foo", "obj1.prop" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj1.prop, "foo", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "property reassignment: overwrite permanent assignment with permanent assignment", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] = 'before'" ), "react( obj, \"[ prop ] = 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( obj, "[ prop ] = 'after'" ), "react( obj, \"[ prop ] = 'after'\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite permanent assignment with reversible assignment", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] = 'before'" ), "react( obj, \"[ prop ] = 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( obj, "[ prop ] ~= 'after'" ), "react( obj, \"[ prop ] = 'after'\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite permanent assignment with permanent deletion", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] = 'before'" ), "react( obj, \"[ prop ] = 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( "delete", obj, "[ prop ]" ), "react( \"delete\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite permanent assignment with reversible deletion", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] = 'before'" ), "react( obj, \"[ prop ] = 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( "~delete", obj, "[ prop ]" ), "react( \"~delete\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite reversible assignment with permanent assignment", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'before'" ), "react( obj, \"[ prop ] ~= 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( obj, "[ prop ] = 'after'" ), "react( obj, \"[ prop ] = 'after'\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite reversible assignment with reversible assignment", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'before'" ), "react( obj, \"[ prop ] ~= 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( obj, "[ prop ] ~= 'after'" ), "react( obj, \"[ prop ] ~= 'after'\" )" );
	strictEqual( obj.foo, "after", "obj.foo" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "foo", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite reversible assignment with permanent deletion", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'before'" ), "react( obj, \"[ prop ] ~= 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( "delete", obj, "[ prop ]" ), "react( \"delete\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "property reassignment: overwrite reversible assignment with reversible deletion", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'foo'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'before'" ), "react( obj, \"[ prop ] ~= 'before'\" )" );
	strictEqual( obj.foo, "before", "obj.foo" );
	
	ok( react( "~delete", obj, "[ prop ]" ), "react( \"~delete\", obj, \"[ prop ]\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	strictEqual( obj.foo, "foo", "obj.foo" );
	
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	react( "delete prop" );
} );

test( "reversible assignment to same property with two different \"reactive paths\"", function() {
	var obj = { prop : "unset" };
	
	ok( obj, "obj = { prop : \"unset\" }" );
	ok( react( "objRef1 = ", obj ), "react( \"objRef1 = \", obj )" );
	ok( react( "objRef2 = ", obj ), "react( \"objRef2 = \", obj )" );
	
	ok( react( "objRef1.prop ~= 'ref1Set'" ), "react( \"objRef1.prop ~= 'ref1Set'\" )" );
	ok( react( "objRef2.prop ~= 'ref2Set'" ), "react( \"objRef2.prop ~= 'ref2Set'\" )" );
	strictEqual( obj.prop, "ref2Set", "obj.prop" );
	
	ok( react( "~objRef2.prop" ), "react( \"~objRef2.prop\" )" );
	strictEqual( obj.prop, "ref2Set", "obj.prop" );
	
	ok( react( "~objRef1.prop" ), "react( \"~objRef1.prop\" )" );
	strictEqual( obj.prop, "unset", "\"prop\" in obj" );
	
	react( "delete objRef1; delete objRef2" );
} );

test( "assignment of reactive variable", function() {
	var obj = {};
	
	ok( react( "rct = 10" ), "react( \"rct = 10\" )" );	
	
	ok( react( obj, ".prop = rct" ), "react( obj, \".prop = rct\" )" );
	strictEqual( obj.prop, 10, "obj.prop" );
	
	ok( react( "rct += 10" ), "react( \"rct += 10\" )" );
	strictEqual( obj.prop, 20, "obj.prop" );
	
	raises( function() { react( "delete rct" ); }, "rct still used in obj.prop: react( \"delete rct\" ) -> exception" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	
	ok( react( "delete rct" ), "react( \"delete rct\" )" );
	strictEqual( obj.prop, 20, "obj.prop" );
} );

test( "assignment of expression", function() {
	var obj = {};
	
	ok( react( "rct = 10" ), "react( \"rct = 10\" )" );	
	
	ok( react( obj, ".prop = rct+5" ), "react( obj, \".prop = rct+5\" )" );
	strictEqual( obj.prop, 15, "obj.prop" );
	
	ok( react( "rct += 10" ), "react( \"rct += 10\" )" );
	strictEqual( obj.prop, 25, "obj.prop" );
	
	raises( function() { react( "delete rct" ); }, "rct still used in obj.prop: react( \"delete rct\" ) -> exception" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	
	ok( react( "delete rct" ), "react( \"delete rct\" )" );
	strictEqual( obj.prop, 25, "obj.prop" );
} );

test( "assignment of property path", function() {
	var obj1 = {}, obj2 = { prop : "string" };
	
	ok( true, "obj2 = { prop : \"string\" }" );
	
	ok( react( obj1, ".prop = ", obj2, ".prop" ), "react( obj1, \".prop = \", obj2, \".prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 2, "two paths registered" );
	strictEqual( obj1.prop, "string", "obj1.prop" );
	
	ok( react( obj2, ".prop = 'gnirts'" ), "react( obj2, \".prop = 'gnirts'\" )" );
	strictEqual( obj2.prop, "gnirts", "obj2.prop" );
	strictEqual( obj1.prop, "gnirts", "obj1.prop" );
	
	raises( function() { react( "~", obj2, ".prop" ); }, "obj2.prop still used in obj1.prop: react( \"~\", obj2, \".prop\" ) -> exception" );
	
	ok( react( "~", obj1, ".prop" ), "react( \"~\", obj1, \".prop\" )" );
	ok( react( "~", obj2, ".prop" ), "react( \"~\", obj2, \".prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	
	strictEqual( obj2.prop, "gnirts", "obj2.prop" );
	strictEqual( obj1.prop, "gnirts", "obj1.prop" );
} );

test( "assignment of function call", function() {
	var obj = {},
		func1 = function() {
			return 1;
		},
		func2 = function() {
			return 2;
		};
	
	ok( react( "func = ", func1 ), "react( \"func = \", func1 )" );
	ok( react( obj, ".prop = func()" ), "react( obj, \".prop = func()\"" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 1, "one path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 1, "one call registered" );
	strictEqual( obj.prop, 1, "obj.prop" );
	
	ok( react( "func = ", func2 ), "react( \"func = \", func2 )" );
	strictEqual( obj.prop, 2, "obj.prop" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \"prop\" )" );
	strictEqual( countProps( react.leak.PropPath.prototype._paths ), 0, "no path registered" );
	strictEqual( countProps( react.leak.FunctionCall.prototype._calls ), 0, "no call registered" );
	
	strictEqual( obj.prop, 2, "obj.prop" );
} );

test( "assignment of literal value to property with reactive variable", function() {
	var obj = {},
		rct,
		path;
	
	ok( rct = react.leak( "rct = 10" ), "react( \"rct = 10\" )" );	
	
	ok( path = react.leak( obj, ".prop = rct+5" ), "react( obj, \".prop = rct+5\" )" );
	ok( countProps( rct._partOf ) === 1, "rct is part of obj.prop" );
	strictEqual( obj.prop, 15, "obj.prop" );
	
	ok( react( obj, ".prop = 5" ), "react( obj, \".prop = 5\" )" );
	ok( isEmptyObj( rct._partOf ), "rct is no longer part of obj.prop" );
	strictEqual( obj.prop, 5, "obj.prop" );
	
	react( "~", obj, ".prop" );
	ok( react( "delete rct" ), "react( \"delete rct\" )" );
} );


module( "Functions and variables" );

test( "assigning function to variable", function() {
	var func = function( x ) { return !x || x < 2 ? 1 : func( x-1 )*x; },
		fac = react.leak( "fac = ", func );
	
	ok( fac, "fac = react.leak( \"fac = \", function( x ) { return x < 2 ? 1 : fac( x-1 )*x; } )" );
	strictEqual( fac._value.value, func, "fac._value after assignment" );
	strictEqual( fac.valueOf(), func, "fac.valueOf() after assignment" );
	
	react( "delete fac" );
} );

test( "call w/o return value: function is variable, argument is literal", function() {
	var foo,
		func1 = function( arg ) {
			foo = arg;
		},
		func2 = function( arg ) {
			foo = arg + 50;
		},
		func = react.leak( "func = ", func1 ),
		call;
	
	ok( func1, "func1 = function( arg ) { foo = arg; }" );
	ok( func2, "func2 = function( arg ) { foo = arg + 50; }" );
	ok( func, "react( \"func = \", func1 )" );
	
	ok( isEmptyObj( func._partOf ), "isEmptyObj( func._partOf )" );
	call = react.leak( "func( 100 )" );
	
	ok( call._value.func === func , "react( \"func( 100 )\" )._value.func === func" );
	ok( call._value.args === 100, "react( \"func( 100 )\" )._value.args" );
	ok( call._guid in func._partOf, "call._guid in func._partOf" );
	
	call.remove();
	react( "func( 100 )" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "func = ", func2 ), "react( \"func = \", func2 )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "~func( 100 )" ), "react( \"~func( 100 )\" )" );
	ok( isEmptyObj( func._partOf ), "isEmptyObj( func._partOf )" );
	
	ok( react( "func = ", func1 ), "react( \"func = \", func1 )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete func" );
} );

test( "call w/o return value: function is Expression, argument is literal", function() {
	var foo,
		func1 = function( arg ) {
			foo = arg;
		},
		func2 = function( arg ) {
			foo = arg + 50;
		},
		bool = react.leak( "bool = true" ),
		call = react.leak( "( bool ?", func1, ":", func2, ")( 100 )" );
	
	ok( func1, "func1 = function( arg ) { foo = arg; }" );
	ok( func2, "func2 = function( arg ) { foo = arg + 50; }" );
	ok( bool,  "react( \"bool = true\" )" );
	
	ok( compare( call._value.func, [ "?", bool, [ ":", func1, func2 ] ] ), "react( \"( bool ?\", func1, \":\", func2, \")( 100 )\" )._value.func" );
	ok( call._value.args === 100, "react( \"( bool ?\", func1, \":\", func2, \")( 100 )\" )._value.args" );
	
	call.remove();
	react( "( bool ?", func1, ":", func2, ")( 100 )" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "~( bool ?", func1, ":", func2, ")( 100 )" ), "react( \"~( bool ?\", func1, \":\", func2, \")( 100 )\" )" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete bool" );
} );

test( "call w/o return value: function is object method with mutable property, argument is literal", function() {
	var foo,
		obj = {
			method1 : function( arg ) {
				foo = arg;
			},
			method2 : function( arg ) {
				foo = arg + 50;
			}
		},
		prop = react.leak( "prop = 'method1'" ),
		call = react.leak( obj, "[ prop ]( 100 )" );
	
	ok( obj.method1, "obj.method1 = function( arg ) { foo = arg; }" );
	ok( obj.method2, "obj.method2 = function( arg ) { foo = arg + 50; }" );
	ok( prop,  "react( \"prop = 'method1'\" )" );
	
	ok( compare( call._value.func._value.path, [ ".", obj, prop ] ), "react( obj, \"[ prop ]( 100 )\" )._value.func" );
	ok( call._value.args === 100, "react( obj, \"[ prop ]( 100 )\" )._value.args" );
	
	call.remove();
	react( obj, "[ prop ]( 100 )" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "prop = 'method2'" ), "react( \"prop = 'method2'\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "~", obj, "[ prop ]( 100 )" ), "react( \"~\", obj, \"[ prop ]( 100 )\" )" );
	
	ok( react( "prop = 'method1'" ), "react( \"prop = 'method1'\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete prop" );
} );

test( "call w/o return value: function is object method with mutable context, argument is literal", function() {
	var foo,
		obj1 = {
			method : function( arg ) {
				foo = arg;
			}
		},
		obj2 = {
			method : function( arg ) {
				foo = arg + 50;
			}
		},
		ctxt = react.leak( "ctxt = ", obj1 ),
		call = react.leak( "ctxt.method( 100 )" );
	
	ok( obj1.method, "obj1.method = function( arg ) { foo = arg; }" );
	ok( obj2.method, "obj2.method = function( arg ) { foo = arg + 50; }" );
	ok( ctxt,  "react( \"ctxt = \", obj1 )" );
	
	ok( compare( call._value.func._value.path, [ ".", ctxt, 'method' ] ), "react( \"ctxt.method( 100 )\" )._value.func" );
	ok( call._value.args === 100, "react( \"ctxt.method( 100 )\" )._value.args" );
	
	call.remove();
	react( "ctxt.method( 100 )" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "ctxt = ", obj2 ), "react( \"ctxt = \", obj2 )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "~ctxt.method( 100 )" ), "react( \"~ctxt.method( 100 )\" )" );
	
	ok( react( "ctxt = ", obj1 ), "react( \"ctxt = \", obj1 )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete ctxt" );
} );

test( "call w/o return value: function is literal, argument is variable", function() {
	var foo,
		func = function( arg1 ) {
			foo = arg1;
		},
		arg1 = react.leak( "arg1 = 50" ),
		call = react.leak( func, "( arg1 )" );
	
	ok( func, "func = function( arg1 ) { foo = arg1; }" );
	ok( arg1, "react( \"arg1 = 50\" )" );
	
	ok( call._value.func === func, "react( func, \"( arg1 )\" )._value.func" );
	ok( call._value.args === arg1, "react( func, \"( arg1 )\" )._value.args" );
	
	call.remove();
	react( func, "( arg1 )" );
	
	strictEqual( foo, 50, "foo" );
	
	ok( react( "arg1 = 'bar'" ), "react( \"arg1 = 'bar'\" )" );
	
	strictEqual( foo, "bar", "foo" );
	
	ok( react( "~", func, "( arg1 )" ), "react( \"~\", func, \"( arg1 )\" )" );
	ok( react( "arg1 = 'foo'" ), "react( \"arg1 = 'foo'\" )" );
	
	strictEqual( foo, "bar", "foo" );
	
	react( "delete arg1" );
} ); 

test( "call w/o return value: function is literal, argument is Expression", function() {
	var foo,
		func = function( arg1 ) {
			foo = arg1;
		},
		r = react.leak( "r = 50" ),
		x = react.leak( "x = 2.6" ),
		rpx,
		call = react.leak( func, "( r+x )" );
	
	ok( func, "func = function( arg1 ) { foo = arg1; }" );
	ok( r, "react( \"r = 50\" )" );
	
	ok( call._value.func === func, "react( func, \"( r+x )\" )._value.func" );
	ok( compare( call._value.args, [ "+", r, x ] ), "react( func, \"( r+x )\" )._value.args" );
	
	call.remove();
	react( func, "( r+x )" );
	
	strictEqual( foo, r.valueOf() + x.valueOf(), "foo" );
	
	ok( react( "r = 'bar'" ), "react( \"r = 'bar'\" )" );
	
	rpx = r.valueOf() + x.valueOf()
	strictEqual( foo, rpx, "foo" );
	
	ok( react( "~", func, "( r+x )" ), "react( \"~\", func, \"( r+x )\" )" );
	ok( react( "r = 'foo'" ), "react( \"r = 'foo'\" )" );
	
	strictEqual( foo, rpx, "foo" );
	
	react( "delete r; delete x" );
} ); 

test( "call w/o return value: function is literal, argument is object path", function() {
	var ret,
		func = function( arg ) {
			ret = arg;
		};
	
	ok( true, "func = function( arg ) { ret = arg; }" );
	
	ok( react( "propObj =", {} ), "react( \"propObj =\", {} )" );
	ok( react( "propObj.prop = 'prop1'" ), "react( \"propObj.prop = 'prop1'\" )" );
	
	ok( !react( func, "( propObj.prop )" ), "react( func, \"( propObj.prop )\" )" );
	strictEqual( ret, "prop1", "ret" );
	ok( react( "propObj.prop = 'prop2'" ), "react( \"propObj.prop = 'prop2'\" )" );
	strictEqual( ret, "prop2", "ret" );
	
	react( "~", func, "( propObj.prop )" );
	react( "~propObj.prop" );
	react( "delete propObj" );
} );

test( "call w/o return value: function is object path, argument is literal", function() {
	var ret1,
		ret2,
		method1 = function( arg ) {
			ret1 = arg;
		},
		method2 = function( arg ) {
			ret2 = arg;
		};
	
	ok( true, "method1 = function( arg ) { ret1 = arg; }" );
	ok( true, "method2 = function( arg ) { ret2 = arg; }" );
	
	ok( react( "objObj =", {} ), "react( \"objObj =\", {} )" );
	ok( react( "objObj.method =", method1 ), "react( \"objObj.method =\", method1 )" );
	
	ok( !react( "objObj.method( 'value' )" ), "react( \"objObj.method( 'value' )\" )" );
	strictEqual( ret1, "value", "ret1" );
	ok( react( "objObj.method =", method2 ), "react( \"objObj.method =\", method2 )" );
	strictEqual( ret2, "value", "ret2" );
	
	react( "~objObj.method( 'value' )" );
	react( "~objObj.method" );
	react( "delete objObj" );
} );

test( "call w/o return value: function is literal, argument is function call", function() {
	var ret,
		func = function( arg ) {
			ret = arg;
		},
		arg  = function( arg ) {
			return arg;
		};
	
	ok( true, "func = function( arg ) { ret = arg; }" );
	ok( true, "arg  = function( arg ) { return arg; }" );
	
	ok( react( "arg = 'before'" ), "react( \"arg = 'before'\" )" );
	
	ok( !react( func, "(", arg, "( arg ) )" ), "react( func, \"(\", arg, \"( arg ) )\" )" );
	strictEqual( ret, "before", "ret" );
	ok( react( "arg = 'after'" ), "react( \"arg = 'after'\" )" );
	strictEqual( ret, "after", "ret" );
	
	react( "~", func, "(", arg, "( arg ) )" );
	react( "delete arg" );
} );

test( "call w/o return value: function is function call, argument is literal", function() {
	var ret1, ret2,
		func1 = function( arg ) {
			ret1 = arg;
		},
		func2 = function( arg ) {
			ret2 = arg;
		},
		func = function( func ) {
			return func;
		};
	
	ok( true, "func1 = function() { ret = 'func1'; }" );
	ok( true, "func2 = function() { ret = 'func2'; }" );
	ok( true, "func = function( func ) { return func; }" );
	
	ok( react( "func =", func1 ), "react( \"func =\", func1 )" );
	
	ok( !react( func, "( func )( 'func' )" ), "react( func, \"( func )( 'func' )\" )" );
	strictEqual( ret1, "func", "ret1" );
	ok( react( "func =", func2 ), "react( \"func =\", func2 )" );
	strictEqual( ret2, "func", "ret2" );
	
	react( "~", func, "( func )( 'func' )" );
	react( "delete func" );
} );

test( "call w/o return value: function is literal, arguments are variable/literal", function() {
	var foo,
		func = function( arg1, arg2 ) {
			foo = arg1 + arg2;
		},
		arg1 = react.leak( "arg1 = 50" ),
		call = react.leak( func, "( arg1, 100 )" );
	
	ok( func, "func = function( arg1, arg2 ) { foo = arg1 + arg2; }" );
	ok( arg1, "react( \"arg1 = 50\" )" );
	
	ok( call._value.func === func, "react( func, \"( arg1, 100 )\" )._value.func" );
	ok( compare( call._value.args, [ ",", arg1, 100 ] ), "react( func, \"( arg1, 100 )\" )._value.args" );
	
	call.remove();
	react( func, "( arg1, 100 )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "arg1 = 'bar'" ), "react( \"arg1 = 'bar'\" )" );
	
	strictEqual( foo, "bar100", "foo" );
	
	ok( react( "~", func, "( arg1, 100 )" ), "react( \"~\", func, \"( arg1, 100 )\" )" );
	ok( react( "arg1 = 'foo'" ), "react( \"arg1 = 'foo'\" )" );
	
	strictEqual( foo, "bar100", "foo" );
	
	react( "delete arg1" );
} );

test( "registering :() and deregistering ~ call", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" );
	
	var r1 = react.leak( "x+t" ),
		r1_func1_val, r1_func2_val, r1_func3_val,
		order = 0,
		r1_func1 = function() {
			r1_func1_val = order++;
		},
		r1_func2 = function() {
			r1_func2_val = order++;
		},
		r1_func3 = function() {
			r1_func3_val = order++;
		};
	
	ok( r1, "r1 = react.leak( \"x+t\" )" );
	
	react( r1_func1, ":(", r1, ");" );
	react( r1_func2, ":(", r1, ");" );
	react( r1_func3, ":(", r1, ");" );
	
	strictEqual( countProps( r1._partOf ), 3, "r1 has been registered to the functions" );
	
	strictEqual( r1_func1_val, undefined, "r1_func1_val is undefined." );
	strictEqual( r1_func2_val, undefined, "r1_func2_val is undefined." );
	strictEqual( r1_func3_val, undefined, "r1_func3_val is undefined.");
	
	ok( react( "x/=2" ), "x changed." );
	
	ok( order === 3, "Each bound function was only called once." );
	strictEqual( r1_func1_val, 0, "r1_func1 was evaluated first." );
	strictEqual( r1_func2_val, 1, "r1_func2 was evaluated second." );
	strictEqual( r1_func3_val, 2, "r1_func3 was evaluated third." );
	
	react( "~", r1_func1, "(", r1, "); ~", r1_func2, "(", r1, "); ~", r1_func3, "(", r1, ");" );
	
	ok( isEmptyObj( r1._partOf ), "All r1 has been unregistered from all functions." );
	
	react( "delete", r1, "; delete x; delete t" );
} );

test( "call w/ return value: return value used, but not in an assignment", function() {
	var x = react.leak( "x = 2.6" );
	
	var sqrFunc = function( x ) { return xSqr = x.valueOf()*x.valueOf() },
		xSqr,
		sqr = react.leak( "sqr = ", sqrFunc );
	
	ok( sqrFunc, "sqrFunc = function( x ) { return x.valueOf()*x.valueOf() }" );
	ok( sqr, "react( \"sqr = \", sqrFunc );" );
	
	strictEqual( react( "sqr( x ) + sqr( 10 );" ), 100 + x.valueOf()*x.valueOf(), "react( \"sqr( x ) + sqr( 10 );\" )" );
	strictEqual( countProps( sqr._partOf ), 0, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 0, "countProps( x._partOf )" );
	
	strictEqual( react( "sqr( x ) + sqr( 10 ); sqr( 10 )" ), 100, "react( \"sqr( x ) + sqr( 10 ); sqr( 10 )\" )" );
	strictEqual( countProps( sqr._partOf ), 1, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 0, "countProps( x._partOf )" );
	
	strictEqual( react( "sqr( sqr( 10 ) )" ), 10000, "react( \"sqr( sqr( 10 ) )\" )" );
	strictEqual( countProps( sqr._partOf ), 2, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 0, "countProps( x._partOf )" );
	
	strictEqual( react( "sqr( x ); sqr( 10 )" ), 100, "react( \"sqr( x ); sqr( 10 )\" )" );
	strictEqual( countProps( sqr._partOf ), 3, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 1, "countProps( x._partOf )" );
	
	ok( react( "~sqr( x ); ~sqr( 10 )" ), "react( \"~sqr( x ); ~sqr( 10 )\" )" );
	ok( react( "~sqr( 10 )" ), "react( \"~sqr( 10 )\" )" );
	
	raises( function() { react( "~sqr( 10 )" ) }, "cannot deregister non-stand-alone function: react( \"~sqr( 10 )\" )" );
	ok( react( "~sqr( sqr( 10 ) ); " ), "react( \"~sqr( sqr( 10 ) );\" )" );
	ok( isEmptyObj( sqr._partOf ), "isEmptyObj( sqr._partOf )" );
	ok( isEmptyObj( x._partOf ), "isEmptyObj( x._partOf )" );
	
	react( "delete sqr; delete x" );
} );

test( "call w/ return value: return value stored in a variable", function() {
	var x = react.leak( "x = 2.6" );
	
	var sqrFunc = function( x ) { return xSqr = x.valueOf()*x.valueOf() },
		xSqr,
		sqr = react.leak( "sqr = ", sqrFunc ),
		rea = react.leak( "rea = 0" );
	
	ok( sqrFunc, "sqrFunc = function( x ) { return xSqr = x.valueOf()*x.valueOf() }" );
	ok( sqr, "react( \"sqr = \", sqrFunc );" );
	
	react( "rea = ", sqrFunc, "( x )" );
	ok( rea._value.value._value.func === sqrFunc, "react( \"rea = \", sqrFunc, \"( x )\" )._value.value._value.func" );
	ok( rea._value.value._value.args === x, "react( \"rea = \", sqrFunc, \"( x )\" )._value.value._value.args" );
	strictEqual( countProps( x._partOf ), 1, "countProps( x._partOf )" );
	strictEqual( xSqr, x.valueOf()*x.valueOf(), "xSqr" );
	strictEqual( react( "rea" ), x.valueOf()*x.valueOf(), "react( \"rea\" )" );
	
	ok( react( "x += 1" ), "react( \"x += 1\" )" );
	strictEqual( xSqr, x.valueOf()*x.valueOf(), "xSqr" );
	
	raises( function() { react( "~", sqrFunc, "( x )" ); }, "react( \"~\", sqrFunc, \"( x )\" ) -> exception, because sqrFunc( x ) is part of rea" );
	
	react( "rea = sqr(", 10, ")" );
	ok( rea._value.value._value.func === sqr, "react( \"rea = sqr(\", 10, \")\" )._value.value._value.func" );
	ok( rea._value.value._value.args === 10, "react( \"rea = sqr(\", 10, \")\" )._value.value._value.args" );
	ok( isEmptyObj( x._partOf ), "isEmptyObj( x._partOf )" );
	strictEqual( countProps( sqr._partOf ), 1, "countProps( sqr._partOf )" );
	strictEqual( xSqr, 100, "xSqr" );
	strictEqual( react( "rea" ), 100, "react( \"rea\" )" );
	
	react( "rea = sqr( x )" );
	ok( rea._value.value._value.func === sqr, "react( \"rea = sqr( x )\" )._value.value._value.func" );
	ok( rea._value.value._value.args === x, "react( \"rea = sqr( x )\" )._value.value._value.args" );
	strictEqual( countProps( sqr._partOf ), 1, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 1, "countProps( x._partOf )" );
	strictEqual( xSqr, x.valueOf()*x.valueOf(), "xSqr" );
	strictEqual( react( "rea" ), x.valueOf()*x.valueOf(), "react( \"rea\" )" );
	
	react( "rea += sqr(", 10, ")" );
	ok( rea._value.value._value[ 1 ]._value.func === sqr, "react( \"rea += sqr(\", 10, \")\" )._value.value._value[ 1 ]._value.func" );
	ok( rea._value.value._value[ 1 ]._value.args === 10, "react( \"rea += sqr(\", 10, \")\" )._value.value._value[ 1 ]._value.args" );
	strictEqual( countProps( sqr._partOf ), 2, "countProps( sqr._partOf )" );
	strictEqual( countProps( x._partOf ), 1, "countProps( x._partOf )" );
	strictEqual( react( "rea" ), 100 + x.valueOf()*x.valueOf(), "react( \"rea\" )" );
	
	ok( react( "delete rea" ), "react( \"delete rea\" )" );
	
	ok( isEmptyObj( sqr._partOf ), "isEmptyObj( sqr._partOf )" );
	ok( isEmptyObj( x._partOf ), "isEmptyObj( x._partOf )" );
	
	react( "delete sqr; delete x" );
} );


module( "Objecthandling" );

test( "operator overloading", function() {
	var noPrefNoValOfObj = {
			value : 5
		},
		noPrefValOfObj = {
			value : 100,
			valueOf : function() {
				return this.value;
			}
		},
		prefNoValOfObj = {
			value : 200,
			"prefix+" : function() {
				return this.value;
			}
		},
		prefValOfObj = {
			value : 200,
			"prefix+" : function() {
				return this.value * 10;
			},
			valueOf : function() {
				return this.value;
			}
		},
		opObj = {
			value : 6,
			"prefix+" : function() {
				return +this.value;
			},
			"infix+" : function( obj2 ) {
				return this.value + ( ( obj2 && obj2.value ) || obj2 );
			},
			"infix*" : function( obj2 ) {
				return this.value * ( ( obj2 && obj2.value ) || obj2 );
			},
			"infix=" : function( val ) {
				return this.value = val;
			}
		};
		
	ok( noPrefNoValOfObj, "noValOfObj = { " +
			"value : \"5\"" +
		" };" );
	
	ok( noPrefValOfObj, "valOfObj = { " +
			"value : 100, " +
			"valueOf : function() {" +
				" return this.value; " +
			"}" +
		" };" );
	
	ok( prefNoValOfObj, "valOfObj = { " +
			"value : 200, " +
			"\"prefix+\" : function() {" +
				" return this.value; " +
			"}" +
		" };" );
	
	ok( prefValOfObj, "valOfObj = { " +
			"value : 200, " +
			"\"prefix+\" : function() {" +
				" return this.value * 10; " +
			"}, " +
			"valueOf : function() {" +
				" return this.value; " +
			"}" +
		" };" );
	
	ok( opObj, "opObj = { " +
			"value : 6, " +
			"\"prefix+\" : function() {" +
				" return +this.value; " +
			"}, " +
			"\"infix+\" : function( obj2 ) {" + 
				" return this.value + (\"value\" in obj2 ? obj2.value : obj2); " +
			"}, " + 
			"\"infix*\" : function( obj2 ) {" +
				" return this.value * ( ( obj2 && obj2.value ) || obj2 ); " +
			"}, " +
			"\"infix=\" : function( val ) {" + 
				" return this.value = val; " +
			"}" +
		" };" );
	
	//evaluation
	ok( isNaN( react( "+", noPrefNoValOfObj ) ), ".valueOf() and \"prefix+\" not defined: isNaN( react( \"+\", noPrefNoValOfObj ) )" );
	strictEqual( react( "+", noPrefValOfObj ), 100, ".valueOf() defined, \"prefix+\" not defined: react( \"+\", noPrefvalOfObj )" );
	strictEqual( react( "+", prefNoValOfObj ), 200, ".valueOf() not defined, \"prefix+\" defined: react( \"+\", prefNoValOfObj )" );
	strictEqual( react( "+", prefValOfObj ), 2000,  ".valueOf() and \"prefix+\" (prefered) defined: react( \"+\", prefValOfObj )" );
	
	//operator overloading
	strictEqual( react( opObj, "+", noPrefNoValOfObj ), 11, "overloaded, stand-alone infix operator, known to left: react( opObj, \"+\", noPrefNoValOfObj )" );
	strictEqual( react( noPrefNoValOfObj, "+", opObj ), 11, "overloaded, stand-alone infix operator, known to right: react( noPrefNoValOfObj, \"+\", opObj )" );
	ok( isNaN( react( opObj, "^", opObj ) ), "overloaded, stand-alone infix operator, not known to both objects: isNaN( react( opObj, \"^\", opObj ) )" );
	strictEqual( react( "+", opObj ), 6, "overloaded, stand-alone prefix operator: react( \"+\", opObj )" );
	
	strictEqual( react( opObj, "-5" ), 1,  "not overloaded, composed infix operator w\\ needed operator: react( opObj, \"-5\" )" );
	strictEqual( react( "-", opObj ), -6,  "not overloaded, composed prefix operator w\\ needed operator: react( \"-\", obj1 )" );
	
	//overloaded composed operators needs no testing
	
	//operator assignment
	raises( function() { react( opObj, "+=", 100 ) }, "operator-assignment not possible for external objects" );
} );

test( "custom datatype", function() {
	var x = react.leak( "x = 2.6" );
	
	//example custom datatype
	var Type = function( input ) {
		//react() cannot explicitly call a function as constructor. Therefore, to use 
		//constuctors in react(), they must be able to be called as simple functions, but
		//act as constructors.
		if ( !(this instanceof Type) )
			return new Type( input );
		
		this.value = input;
	};
	
	Type.prototype = {
		value : null
	};
	
	strictEqual( react( Type, "( 1235813 )" ).value, 1235813, "non-reactive instance: react( Type, \"( 1235813 )\" )" );
	
	ok( react( "Type = ", Type ), "react( \"Type = \", Type )" );
	
	strictEqual( react( "Type( 1235813 )" ).value, 1235813, "reactive (on function side) instance: react( \"Type( 1235813 )\" )" );
	strictEqual( countProps( react.leak( "Type" )._partOf ), 1, "countProps( react.leak( \"Type\" )._partOf )" );
	
	strictEqual( react( Type, "( x )" ).value, x.valueOf(), "reactive (on argument side) instance: react( Type, \"( x )\" )" );
	strictEqual( countProps( x._partOf ), 1, "countProps( x._partOf )" );
	
	strictEqual( react( "inst = ", Type, "( x+2 )" ).value, x.valueOf()+2, "reactive instance: react( \"inst = \", Type, \"( x+2 )\" ).value" );
	strictEqual( react( "inst2 = Type( inst )" ).value, react( "inst" ), "reactive, depending instances: react( \"inst2 = Type( inst )\" ).value" );
	strictEqual( countProps( react.leak( "Type" )._partOf ), 2, "countProps( react.leak( \"Type\" )._partOf )" );
	strictEqual( countProps( x._partOf ), 2, "countProps( x._partOf )" );
	strictEqual( countProps( react.leak( "inst" )._partOf ), 1, "countProps( react.leak( \"inst\" )._partOf )" );
	ok( react( "x += 1" ), "react( \"x += 1\" )" );
	strictEqual( react( "inst" ).value, x.valueOf()+2, "automatic update of reactive instance: react( \"inst\" ).value" );
	strictEqual( react( "inst2" ).value, react( "inst" ), "automatic update of depending reactive instance: react( \"inst2\" ).value" );
	
	react( "~Type( 1235813 ); ~", Type, "( x ); " );
	
	react( "delete inst2; delete inst; delete Type; delete x" );
} );


module( "Context sensitive variables" );

test( "simple context variables with function", function() {
	var f = react.leak( "f = false" ),
		x = react.leak( "x = 2.6" );
	
	var func = function( data ) {
			return ( "0" in arguments ? data : "no context" );
		},
		ctxtVar;
	
	ok( ctxtVar = react.leak( "ctxtVar = ", func ), "context variable: react( \"ctxtVar = \", function( data ) { return ( data ? \"data\" : \"\" ) } )" );
	ok( !("context" in ctxtVar._value), "context of ctxtVar not set" );
	
	strictEqual( react( "ctxtVar" ), func, "variable acts as normal function: react( \"ctxtVar\" )" );
	strictEqual( react( "ctxtVar{ x }" ), x.valueOf(), "evaluation in custom context: react( \"ctxtVar{ x }\" )" );
	strictEqual( react( "ctxtVar" ), func, "variable on its own still acts as normal function: react( \"ctxtVar\" )" );
	strictEqual( react( "ctxtVar{ 'literal' }" ), "literal", "evaluation in custom context: react( \"ctxtVar{ 'literal' }\" )" );
	
	strictEqual( react( "ctxtVar = ctxtVar{ f }" ), false, "ctxtVar itself cannot hold a context and evaluates it: react( \"ctxtVar = ctxtVar{ f }\" )" );
	
	react( "delete ctxtVar; delete x; delete f" );
} );

test( "complex context variable with function", function() {
	var f = react.leak( "f = false" );
	
	var func = function( data ) {
			return ( "0" in arguments ? data : "no context" );
		},
		cmplCtxtVar;
	
	ok( cmplCtxtVar = react.leak( "cmplCtxtVar = ", func, " + ' to the max!!!'" ), "context variable: react( \"cmplCtxtVar = \", function( data ) { return ( data ? \"data\" : \"\" ) }, \" + ' to the max!!!'\" )" );
	ok( !("context" in cmplCtxtVar._value ), "cmplCtxtVar is no context variable" );
	
	strictEqual( react( "cmplCtxtVar" ), String( func ) + " to the max!!!", "function in variable acts as normal function: react( \"cmplCtxtVar\" )" );
	
	strictEqual( react( "cmplCtxtVar{ f }" ), f.valueOf() + " to the max!!!", "evaluation in custom context: react( \"cmplCtxtVar{ f }\" )" );
	strictEqual( react( "cmplCtxtVar" ), String( func ) + " to the max!!!", "variable on its own still acts as normal function: react( \"ctxtVar\" )" );
	strictEqual( react( "cmplCtxtVar{ 'literal' }" ), "literal to the max!!!", "evaluation in custom context: react( \"cmplCtxtVar{ 'literal' }\" )" );
	
	react( "cmplCtxtVar = cmplCtxtVar{ f }" );
	strictEqual( cmplCtxtVar._value.value, "false to the max!!!", "Now, cmplCtxtVar itself evaluates to its own value in the context: react( \"cmplCtxtVar = cmplCtxtVar{ f }\" )" );
	
	react( "delete cmplCtxtVar" );
} );

test( "complex context variable with simple context variable", function() {
	var t = react.leak( "t = true" ),
		f = react.leak( "f = false" ),
		foo  = react.leak( "foo = 'foo'" );
	
	var func = function( data ) {
			return ( "0" in arguments ? data : "noCtxt" );
		};
	
	ok( react( "ctxtVar = ", func ), "context variable without default context: react( \"ctxtVar = \", function( data ) { return ( data ? \"data\" : \"\" ) } )" );
	
	ok( isNaN( react( "ctxtVar * 1" ) ), "ctxtVar is treated as function because of no context" );
	
	strictEqual( react( "(ctxtVar + ' to the max!'){ f }" ), "false to the max!", "context has to propagate down: react( \"(ctxtVar + ' to the max!'){ f }\" )" );
	strictEqual( react( "(ctxtVar{ foo } + ' to the max!'){ f }" ), "foo to the max!", "context is custom: react( \"(ctxtVar{ foo } + ' to the max!'){ f }\" )" );
	
	strictEqual( react( "ctxtVar + (ctxtVar + ' to the max!'){ f }" ), String( func ) + "false to the max!", "separated context array: react( \"ctxtVar + (ctxtVar + ' to the max!'){ f }\" )" );strictEqual( react( "(ctxtVar + ' to the max!'){ 'literal' }" ), "literal to the max!", "literal context has to propagate down: react( \"(ctxtVar + ' to the max!'){ 'literal' }\" )" );
	strictEqual( react( "(ctxtVar{ foo } + ' to the max!'){ 'literal' }" ), "foo to the max!", "literal context is custom: react( \"(ctxtVar{ foo } + ' to the max!'){ 'literal' }\" )" );
	strictEqual( react( "ctxtVar + (ctxtVar + ' to the max!'){ 'literal' }" ), String( func ) + "literal to the max!", "separated context array: react( \"ctxtVar + (ctxtVar + ' to the max!'){ 'literal' }\" )" );
	
	ok( react( "cmplCtxtVar = ctxtVar + ' to the max!'" ), "complex var without any contexts set: react( \"cmplCtxtVar = ctxtVar + ' to the max!'\" )" );
	strictEqual( react( "cmplCtxtVar" ), String( func ) + " to the max!", "complex var in no given context: react( \"cmplCtxtVar\" )" );
	strictEqual( react( "cmplCtxtVar{ t }" ), "true to the max!", "complex var in custom context: react( \"cmplCtxtVar{ t }\" )" );
	strictEqual( react( "cmplCtxtVar{ 'literal' }" ), "literal to the max!", "complex var in custom literal context: react( \"cmplCtxtVar{ 'literal' }\" )" );
	
	ok( react( "cmplCtxtVar = (ctxtVar + ' to the max!'){ f }" ), "context set for value of complex var: react( \"cmplCtxtVar = (ctxtVar + ' to the max!'){ f }\" )" );
	strictEqual( react( "cmplCtxtVar" ), "false to the max!", "complex var in no given context: react( \"cmplCtxtVar\" )" );
	strictEqual( react( "cmplCtxtVar{ t }" ), "false to the max!", "complex var in custom context: react( \"cmplCtxtVar{ t }\" )" );
	strictEqual( react( "cmplCtxtVar{ 'literal' }" ), "false to the max!", "complex var in custom literal context: react( \"cmplCtxtVar{ 'literal' }\" )" );
	
	ok( react( "cmplCtxtVar = (ctxtVar{ foo } + ' to the max!'){ f }" ), "context set for value of complex var and for parts: react( \"cmplCtxtVar = (ctxtVar{ foo } + ' to the max!'){ f }\" )" );
	strictEqual( react( "cmplCtxtVar" ), "foo to the max!", "complex var in no given context: react( \"cmplCtxtVar\" )" );
	strictEqual( react( "cmplCtxtVar{ t }" ), "foo to the max!", "complex var in custom context: react( \"cmplCtxtVar{ t }\" )" );
	strictEqual( react( "cmplCtxtVar{ 'literal' }" ), "foo to the max!", "complex var in custom literal context: react( \"cmplCtxtVar{ 'literal' }\" )" );
	
	ok( react( "cmplCtxtVar = ctxtVar + (ctxtVar + ' to the max!'){ f }" ), "context set and not set for parts: react( \"cmplCtxtVar = ctxtVar + (ctxtVar + ' to the max!'){ f }\" )" );
	strictEqual( react( "cmplCtxtVar" ), String( func ) + "false to the max!", "complex var in no given context: react( \"cmplCtxtVar\" )" );
	strictEqual( react( "cmplCtxtVar{ t }" ), "truefalse to the max!", "complex var in custom context: react( \"cmplCtxtVar{ t }\" )" );
	strictEqual( react( "cmplCtxtVar{ 'literal' }" ), "literalfalse to the max!", "complex var in custom literal context: react( \"cmplCtxtVar{ 'literal' }\" )" );
	
	react( "delete cmplCtxtVar; delete ctxtVar; delete foo; delete t; delete f" );
} );

test( "reactive behaviour to context changes", function() {
	var t = react.leak( "t = true" ),
		x = react.leak( "x = 2.6" ),
		y = react.leak( "y = 7.4" );
	
	var sumHalf = function() {
			var ret = 0, idx = arguments.length;
			
			while( idx-- )
				ret += arguments[ idx ];
			
			return ret/2;
		},
		sum = function() {
			var ret = 0, idx = arguments.length;
			
			while( idx-- )
				ret += arguments[ idx ];
			
			return ret;
		};
	
	ok( react( "ctxtVar = ", sumHalf ), "context variable without default context: react( \"ctxtVar = \", function() { var ret = 0, idx = arguments.length; while( idx-- ) ret += arguments[ idx ]; return ret/2; )" );
	
	ok( react( "ctxtVar2 = (ctxtVar + 10){ x, t }" ), "complex context variable: react( \"ctxtVar2 = (ctxtVar + 10){ x, t }\" )" );
	ok( react( "ctxtVar3 = ctxtVar{ y, t } + ctxtVar{ x, t }" ), "custom context variables in variable without default context: react( \"ctxtVar3 = ctxtVar + ctxtVar{ x, t }\" )" );
	ok( react( "ctxtVar4 = ctxtVar{ y, t } * (ctxtVar + 5){ x, t }" ), "context array in variable without default context: react( \"ctxtVar4 = ctxtVar * (ctxtVar + 5){ x, t }\" )" );
	
	strictEqual( react( "ctxtVar2" ), ( x.valueOf() + t.valueOf() ) / 2 + 10, "react( \"ctxtVar2\" )" );
	strictEqual( react( "ctxtVar3" ), ( y.valueOf() + t.valueOf() ) / 2 + ( x.valueOf() + t.valueOf() ) / 2, "react( \"ctxtVar3\" )" );
	strictEqual( react( "ctxtVar4" ), ( y.valueOf() + t.valueOf() ) / 2 * ( ( x.valueOf() + t.valueOf() ) / 2 + 5 ), "react( \"ctxtVar4\" )" );
	
	ok( react( "y += 1" ), "update context y: react( \"y += 1\" )" );
	strictEqual( react( "ctxtVar2" ), ( x.valueOf() + t.valueOf() ) / 2 + 10, "react( \"ctxtVar2\" )" );
	strictEqual( react( "ctxtVar3" ), ( y.valueOf() + t.valueOf() ) / 2 + ( x.valueOf() + t.valueOf() ) / 2, "react( \"ctxtVar3\" )" );
	strictEqual( react( "ctxtVar4" ), ( y.valueOf() + t.valueOf() ) / 2 * ( ( x.valueOf() + t.valueOf() ) / 2 + 5 ), "react( \"ctxtVar4\" )" );
	
	ok( react( "x += 1" ), "update context x: react( \"x += 1\" )" );
	strictEqual( react( "ctxtVar2" ), ( x.valueOf() + t.valueOf() ) / 2 + 10, "react( \"ctxtVar2\" )" );
	strictEqual( react( "ctxtVar3" ), ( y.valueOf() + t.valueOf() ) / 2 + ( x.valueOf() + t.valueOf() ) / 2, "react( \"ctxtVar3\" )" );
	strictEqual( react( "ctxtVar4" ), ( y.valueOf() + t.valueOf() ) / 2 * ( ( x.valueOf() + t.valueOf() ) / 2 + 5 ), "react( \"ctxtVar4\" )" );
	
	ok( react( "ctxtVar = ", sum ), "update context variable: react( \"ctxtVar = \", function() { var ret = 0, idx = arguments.length; while( idx-- ) ret += arguments[ idx ]; return ret; } )" );
	strictEqual( react( "ctxtVar2" ), ( x.valueOf() + t.valueOf() ) + 10, "react( \"ctxtVar2\" )" );
	strictEqual( react( "ctxtVar3" ), ( y.valueOf() + t.valueOf() ) + ( x.valueOf() + t.valueOf() ), "react( \"ctxtVar3\" )" );
	strictEqual( react( "ctxtVar4" ), ( y.valueOf() + t.valueOf() ) * ( x.valueOf() + t.valueOf() + 5 ), "react( \"ctxtVar4\" )" );
	
	react( "delete ctxtVar4; delete ctxtVar3; delete ctxtVar2; delete ctxtVar;" );
	
	ok( isEmptyObj( react.leak( "x" )._partOf ), "after deletion of all ctxtVars, all dependencies were unlinked" );
} );