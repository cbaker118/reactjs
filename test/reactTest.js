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
	};

react = react.Interpreter( "debugger", "math" );

//define some variables to work with
var u = react.leak( "u = undefined" ),
	n = react.leak( "n = null" ),
	t = react.leak( "t = true" ),
	f = react.leak( "f = false" ),
	x = react.leak( "x = 2.6" ),
	y = react.leak( "y = 7.4" ),
	zero = react.leak( "zero = 0" ),
	one  = react.leak( "one = 1" ),
	foo  = react.leak( "foo = 'foo'" ),
	bar  = react.leak( "bar = 'bar'" );
/*
//custom datatype
var defDatatype = react.Datatype(
		function( data1, data2, data3 ) {
			//constructor
			this.data1 = data1;
			this.data2 = data2;
			this.data3 = data3;
		},
		{
			//prototype
			data1 : null,
			data2 : null,
			data3 : null
		}
	),
	datatype = react.Datatype(
		function( data1, data2, data3 ) {
			//constructor
			this.data1 = data1;
			this.data2 = data2;
			this.data3 = data3;
		},
		{
			//prototype
			data1 : null,
			data2 : null,
			data3 : null,
			valueOf : function() {
				return react.valueOf( this.data1 ) + react.valueOf( this.data2 ) + react.valueOf( this.data3 );
			},
			toString : function() {
				return react.toString( this.data1 );
			},
			"infix+" : function( obj ) {
				return Number( this ) + ( obj.toNumber ? obj.toNumber() : Number( obj ) );
			}
		}
	),
	ctxtDatatype = react.Datatype(
		function( data1, data2, data3 ) {
			//constructor
			this.data1 = data1;
			this.data2 = data2;
			this.data3 = data3;
		},
		{
			//prototype
			data1 : null,
			data2 : null,
			data3 : null,
			valueOf : function( ctxt, data ) {
				var data1Val = react.valueOf( this.data1, ctxt, data ),
					data2Val = react.valueOf( this.data2, ctxt, data ),
					data3Val = react.valueOf( this.data3, ctxt, data );
				
				return ( ctxt ? "typeCtxt+" : "" ) + data1Val + data2Val + data3Val;
			},
			toString : function( ctxt, data ) {
				return ( ctxt ? "typeCtxt+" : "" ) + react.toString( this.data1, ctxt, data );
			}
		}
	);
*/

module( "General" );

test( "return value of react()", function() {
	strictEqual( react( "5+true" ), 5+true, "literal: react( \"5+true\" )" );
	strictEqual( react( "x" ), x.valueOf(), "variable: react( \"x\" )" );
	strictEqual( react( "x+t" ), x.valueOf()+t.valueOf(), "value array: react( \"x+t\" )" );
} );

test( "return value of react.leak()", function() {
	strictEqual( react.leak( "5+true" ), 5+true, "literal: react( \"5+true\" )" );
	ok( react.leak( "x" ) === x, "variable: react( \"x\" )" );
	ok( equivArr( react.leak( "no partOf", "x+t" )._value, [ "+", x, t ] ), "value array: react( \"x+t\" )" );
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
	var sin = react( "sin" );
	
	ok( equivArr( react.leak( "no partOf", "sin( x )" )._value, [ "(", sin, x ] ), "react( \"sin( x )\" )" );
	ok( objContent( react.leak( "no partOf", "sin( x )" )._dep, [ x ] ), "react( \"sin( x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "sin( sin( x ) )" )._value, [ "(", sin, [ "(", sin, x ] ] ), "react( \"sin( sin( x ) )\" )" );
	ok( objContent( react.leak( "no partOf", "sin( sin( x ) )" )._dep, [ x ] ), "react( \"sin( sin( x) )\" )._dep" );
	
	ok( react.leak( "no partOf", "asin( sin( x ) )" ) === x, "react( \"asin( sin( x ) )\" )" );
	ok( react.leak( "no partOf", "sin( asin( x ) )" ) === x, "react( \"sin( asin( x ) )\" )" );
} );

test( "projection functions: variables (all behave the same)", function() {
	round = react( "round" );
	
	ok( equivArr( react.leak( "no partOf", "round( x )" )._value, [ "(", round, x ] ), "react( \"round( x )\" )" );
	ok( objContent( react.leak( "no partOf", "round( x )" )._dep, [ x ] ), "react( \"round( x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "round( round( x ) )" )._value, [ "(", round, x ] ), "react( \"round( round( x ) )\" )" );
	ok( objContent( react.leak( "no partOf", "round( round( x ) )" )._dep, [ x ] ), "react( \"round( round( x ) )\" )._dep" );
} );


module( "Multiple expressions" );

test( ";", function() {
	strictEqual( react( "s1 = x+t; s2 = x*one; 5" ), 5, "react( \"s1 = x+t; s2 = x*one; 5\" )" );
	ok( react.leak( "s1" )._isVar, "react.leak( \"s1\" )._isVar" );
	ok( react.leak( "s2" )._isVar, "react.leak( \"s2\" )._isVar" );
	
	strictEqual( react( "delete s1; delete s2; 10" ), 10, "react( \"delete s1; delete s2; 10\" )" );
	raises( function() { react( "s1" ) }, "react( \"s1\" ) -> exception" );
	raises( function() { react( "s2" ) }, "react( \"s2\" ) -> exception" );
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
} );

test( "assignment to and deletion of object properties", function() {
	var obj = { inner : {} };
	
	ok( obj, "obj = { inner : {} }" );
	
	strictEqual( react( obj, ".prop = 50" ), 50, "react( obj, \".prop = 50\" )" );
	strictEqual( react( obj, ".prop" ), 50, "react( obj, \".prop\" )" );
	
	strictEqual( react( obj, ".inner.prop = 100" ), 100, "react( obj, \".inner.prop = 100\" )" );
	strictEqual( react( obj, ".inner.prop" ), 100, "react( obj, \".inner.prop\" )" );
	strictEqual( obj.prop, 50, "obj.prop" );
	strictEqual( obj.inner.prop, 100, "obj.inner.prop" );
	
	ok( react( "delete", obj, ".prop" ), "react( \"delete\", obj, \".prop\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "delete", obj, ".inner.prop" ), "react( \"delete\", obj, \".inner.prop\" )" );
	strictEqual( "prop" in obj.inner, false, "\"prop\" in obj.inner" );
} );

test( "reversible assignment to and deletion of object properties", function() {
	var obj = { prop : 'value' };
	
	ok( react( obj, ".prop ~= 'foo'" ), "react( obj, \".prop ~= 'foo'\" )" );
	strictEqual( obj.prop, "foo", "obj.prop" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	strictEqual( obj.prop, "value", "obj.prop" );
	
	ok( react( "~delete", obj, ".prop" ), "react( \"~delete\", obj, \".prop\" )" );
	strictEqual( "prop" in obj, false, "\"prop\" in obj" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	strictEqual( obj.prop, "value", "obj.prop" );
} );


module( "Function literals with literal arguments" );

test( "calling functions", function() {
	var func = function( fst, snd ) { return snd ? "two args" : fst ? "one arg" : "no args"; };
	
	ok( func, "function( fst, snd ) { return snd ? \"two args\" : fst ? \"one arg\" : \"no args\"; }" );
	
	strictEqual( react( func, "()" ), "no args", "react( func, \"()\" )" );
	strictEqual( react( func, "( true )" ), "one arg", "react( func, \"( true )\" )" );
	strictEqual( react( func, "( true, true )" ), "two args", "react( func, \"( true, true )\" )" );
	
	raises( function() { react( 5, "()" ) }, "calling not a function: react( 5, \"()\" ) -> exception" );
} );

test( "calling functions regarding operator precedence", function() {
	var func = function( a, b ) { return b !== undefined ? a + b : a; };
	
	ok( func, "function( a, b ) { return b !== undefined ? a + b : a; }" );
	
	strictEqual( react( "( true &&", func, ")( 2 )" ), 2, "react( \"( true &&\", func, \")( 2 )\" )" );
	
	strictEqual( react( func, "( 5+3 )" ), 8, "react( func, \"( 5+3 )\" )" );
	strictEqual( react( func, "( 5, 3*2" ), 11, "react( func, \"( 5, 3*2\" )" );
	strictEqual( react( func, "( 5 ) + 4" ), 9, "react( func, \"( 5 ) + 4\" )" );
	strictEqual( react( "5 + ", func, "( 5 )" ), 10, "react( \"5 + \", func, \"( 5 )\" )" );
	strictEqual( react( func, "( 5 ) + 4" ), 9, "react( func, \"( 5 ) + 4\" )" );
} );

test( "calling methods of objects", function() {
	var func = function( arg ) { return this.ctxt + ( arg ? "one arg" : "no arg" ); },
		obj = { ctxt : "obj+", func : func, inner : { ctxt : "inner+", func : func } };
	
	ok( func, "function( arg ) { return this.ctxt + ( arg ? \"one arg\" : \"no arg\" ); }" );
	ok( obj, "{ ctxt : \"ctxt+\", inner : { ctxt : \"inner+\", func : func }, func : func" );
	
	strictEqual( react( obj, ".func()" ), "obj+no arg", "test context: react( obj, \".func()\" )" );
	strictEqual( react( obj, "[ 'func' ]( true )" ), "obj+one arg", "test context: react( obj, \"[ 'func' ]( true )\" )" );
	
	strictEqual( react( obj, ".inner.func()" ), "inner+no arg", "test fcontext: react( obj, \".inner.func()\" )" );
	strictEqual( react( obj, ".inner[ 'func' ]( true )" ), "inner+one arg", "test context: react( obj, \".inner[ 'func' ]( true )\" )" );
} );


module( "Variables with simple values (named and anonymous)" );

test( "extern (re-)assignment", function() {
	var rea = react.leak( "rea = 'variable'" ),
		pi = react.leak( "pi" );
	
	ok( rea, "rea = react.leak( \"rea = 'variable'\" )" );
	strictEqual( rea.valueOf(), 'variable', "rea.valueOf() after assignment" );
	
	ok( react( rea, "= 'new variable'" ), "react( rea, \"= 'new variable'\" )" );
	strictEqual( rea.valueOf(), 'new variable', "rea.valueOf() after reassignment" );
	
	strictEqual( react.leak( rea, "=", rea, " + '!!!'" )._value, "new variable!!!", "infix calculation with self-reference: react( rea, \"=\", rea, \" + '!!!'\" )._value === \"new variable!!!\"" );
	
	ok( react( rea, "= 5" ), "react( rea, \"= 5\" )" );
	strictEqual( react.leak( rea, "= -", rea, "* 0.5" )._value, -2.5, "prefix calculation with self-reference: react( rea, \"= -\", rea, \"* 0.5\" )._value === -2.5" );
	
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
} );

test( "extern delete", function() {
	var rea = react.leak( "rea = 5" ),
		pi = react.leak( "pi" );
	
	strictEqual( react( "delete", rea ), true, "react( \"delete\", rea )" );
	
	ok( !rea.hasOwnProperty( "_value" ), "value of rea removed" );
	ok( !rea.hasOwnProperty( "_dep" ), "dependencies of rea removed" );
	ok( !rea.hasOwnProperty( "_partOf" ), "partOf of rea removed" );
	ok( !rea.hasOwnProperty( "_funcs" ), "bound functions of rea removed" );
	
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
	ok( react( "rea = 'new variable'" ), "react( \"rea = 'new variable'\" )" );
	strictEqual( rea.valueOf(), 'new variable', "rea.valueOf() after reassignment" );
	
	strictEqual( react.leak( "rea = rea + '!!!'" )._value, "new variable!!!", "infix calculation with self-reference: react( \"rea = rea + '!!!'\" )._value === \"new variable!!!\"" );
	
	ok( react( "rea = 5" ), "react( \"rea = 5\" )" );
	strictEqual( react.leak( "rea = -rea * 0.5" )._value, -2.5, "prefix calculation with self-reference: react( \"rea = -rea * 0.5\" )._value === -2.5" );
	
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
	
	react( "delete", rea );
} );

test( "intern delete of named variables", function() {
	var rea = react.leak( "rea = 5" );
	
	strictEqual( rea._key, "rea", "key of rea is set to \"rea\"" );
	strictEqual( react( "delete rea" ), true, "react( \"delete rea\" )" );
	
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
	strictEqual( rea._value, 50, "named variable, infix operator: react.leak( \"rea *= 8 + 2\" )._value === 50" );
	
	react( "-=rea * 0.5" );
	strictEqual( rea._value, -25, "named variable, prefix operator: react.leak( \"-=rea * 0.5\" )._value === -25" );
	
	react( "-.=rea * 2" );
	strictEqual( rea._value, 50, "named variable, separeted prefix operator: react.leak( \"-.=rea * 2\" )._value === 50" );
	
	react( "rea +.= 30" );
	strictEqual( rea._value, 80, "named variable, separated infix operator: react.leak( \"rea +)= 30\" )._value === 5" );
	
	var innerObj;
	react( "rea = ", { inner : innerObj = { prop : false } } );
	ok( rea, "react( \"rea =\", { inner : innerObj = { prop : false } } )" );
	
	react( "rea.=inner" );
	strictEqual( rea._value, innerObj, "property access assignment: react.leak( \"rea .= inner\" )._value === innerObj" );
	
	react( "rea[= 'prop' ]" );
	strictEqual( rea._value, false, "property access assignment: react.leak( \"rea[= 'prop' ]\" )._value === false" );
	
	react( "rea ?= 'bar' : 'foo'" );
	strictEqual( rea._value, "foo", "conditional assignment: react.leak( \"rea ?= 'bar' : 'foo'\" )._value === 'foo'" );
	
	react( "delete( (= rea + 'baz' ) + 5 )" );
	strictEqual( rea._value, "foobaz", "parenthesis assignment: react( \"(= rea + 'baz' ) + 5\" ), rea._value === 'foobaz'" );
	
	rea = react.leak( "delete= rea" );
	strictEqual( rea._value, true, "delete assignment: react( \"delete= rea\" ), rea._value === true" );
	
	react( "rea =.= 120" )
	strictEqual( rea._value, 120, "assignment assignment: react( \"rea =.= 120\" ), rea._value === 120" );
	
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
	ok( equivArr( react.leak( "no partOf", "!foo" )._value, [ "!", foo ] ), "react( \"!foo\" )" );
	ok( objContent( react.leak( "no partOf", "!foo" )._dep, [ foo ] ), "react( \"!foo\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "!!foo" )._value, [ "!", [ "!", foo ] ] ), "react( \"!!foo\" )" );
	ok( objContent( react.leak( "no partOf", "!!foo" )._dep, [ foo ] ), "react( \"!!foo\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "!!!foo" )._value, [ "!", foo ] ), "react( \"!!!foo\" )" );
	ok( equivArr( react.leak( "no partOf", "!(t || f)" )._value, [ "!", [ "||", t, f ] ] ), "react( \"!(t || f)\" )" );
	ok( objContent( react.leak( "no partOf", "!(t || f)" )._dep, [ t, f ] ), "react( \"!(t || f)\" )._dep" );
} );

test( "and", function() {
	ok( equivArr( react.leak( "no partOf", "5 && foo" )._value, [ "&&", 5, foo] ), "lit && ref/arr: react( \"5 && foo\" )" );
	ok( objContent( react.leak( "no partOf", "5 && foo" )._dep, [ foo ] ), "react( \"5 && foo\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "t && f" )._value, [ "&&", t, f ] ), "ref && lit/ref: react( \"t && f\" )" );
	ok( objContent( react.leak( "no partOf", "t && f" )._dep, [ t, f ] ), "react( \"t && f\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t && f ) && x" )._value, [ "&&", t, f, x ] ), "arr && lit/ref: react( \"( t && f ) && x\" )" );
	ok( objContent( react.leak( "no partOf", "( t && f ) && x" )._dep, [ t, f ,x ] ), "react( \"( t && f ) && x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "t && ( f && x )" )._value, [ "&&", t, f, x ] ), "ref && arr: react( \"t && ( f && x )\" )" );
	ok( objContent( react.leak( "no partOf", "t && ( f && x )" )._dep, [ t, f ,x ] ), "react( \"t && ( f && x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t && f ) && ( x && y )" )._value, [ "&&", t, f, x, y ] ), "arr && arr (same op): react( \"( t && f ) && ( x && y )\" )" );
	ok( objContent( react.leak( "no partOf", "( t && f ) && ( x && y )" )._dep, [ t, f, x, y ] ), "react( \"( t && f ) && ( x && y )" );
	
	ok( equivArr( react.leak( "no partOf", "( t || f ) && ( x || y )" )._value, [ "&&", [ "||", t, f ], [ "||", x, y ] ] ), "arr && arr (diff op): react( \"( t || f ) && ( x || y )\" )" );
	ok( objContent( react.leak( "no partOf", "( t || f ) && ( x || y )" )._dep, [ t, f, x, y ] ), "react( \"( t || f ) && ( x || y )" );
} );

test( "or", function() {
	strictEqual( react.leak( "no partOf", "5 || foo" ), 5, "lit || ref/arr: react( \"5 || foo\" )" );
	
	ok( equivArr( react.leak( "no partOf", "t || f" )._value, [ "||", t, f ] ), "ref || lit/ref: react( \"t || f\" )" );
	ok( objContent( react.leak( "no partOf", "t || f" )._dep, [ t, f ] ), "react( \"t || f\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t || f ) || x" )._value, [ "||", t, f, x ] ), "arr || lit/ref: react( \"( t || f ) || x\" )" );
	ok( objContent( react.leak( "no partOf", "( t || f ) || x" )._dep, [ t, f, x ] ), "react( \"( t || f ) || x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "t || ( f || x )" )._value, [ "||", t, f, x ] ), "ref || arr: react( \"t || ( f || x )\" )" );
	ok( objContent( react.leak( "no partOf", "t || ( f || x )" )._dep, [ t, f, x ] ), "react( \"t || ( f || x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t || f ) || ( x || y )" )._value, [ "||", t, f, x, y ] ), "arr || arr (same op): react( \"( t || f ) || ( x || y )\" )" );
	ok( objContent( react.leak( "no partOf", "( t || f ) || ( x || y )" )._dep, [ t, f, x, y ] ), "react( \"( t || f ) || ( x || y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t && f ) || ( x && y )" )._value, [ "||", [ "&&", t, f ], [ "&&", x, y ] ] ), "arr || arr (diff op): react( \"( t && f ) || ( x && y )\" )" );
	ok( objContent( react.leak( "no partOf", "( t && f ) || ( x && y )" )._dep, [ t, f, x, y ] ), "react( \"( t && f ) || ( x && y )\" )._dep" );
} );

test( "(in)equalities, smaller, greater (all behave in the same way)", function() {
	ok( equivArr( react.leak( "no partOf", "true == f" )._value, [ "==", true, f ] ), "lit == ref: react( \"true == f\" )" );
	ok( objContent( react.leak( "no partOf", "true == f" )._dep, [ f ] ), "react( \"true == f\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "10 !== (x && y)" )._value, [ "!", [ "===", 10, [ "&&", x, y ] ] ] ), "lit !== arr: react( \"10 !== (x && y)\" )" );
	ok( objContent( react.leak( "no partOf", "10 !== (x && y)" )._dep, [ x, y ] ), "react( \"10 !== (x && y)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "t != false" )._value, [ "!", [ "==", t, false ] ] ), "ref != lit: react( \"t != false\" )" );
	ok( objContent( react.leak( "no partOf", "t != false" )._dep, [ t ] ), "react( \"t != false\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "t === f" )._value, [ "===", t, f ] ), "ref === ref: react( \"t === f\" )" );
	ok( objContent( react.leak( "no partOf", "t === f" )._dep, [ t, f ] ), "react( \"t === f\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "one > (x && y)" )._value, [ ">", one, [ "&&", x, y ] ] ), "ref > arr: react( \"one > (x && y)\" )" );
	ok( objContent( react.leak( "no partOf", "one > (x && y)" )._dep, [ one, x, y ] ), "react( \"one > (x && y)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x && y) < 10" )._value, [ "<", [ "&&", x, y ], 10 ] ), "arr < lit: react( \"(x && y) < 10\" )" );
	ok( objContent( react.leak( "no partOf", "(x && y) < 10" )._dep, [ x, y ] ), "react( \"(x && y) < 10\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x && y) <= zero" )._value, [ "||", [ "<", [ "&&", x, y ], zero ], [ "==", [ "&&", x, y ], zero ] ] ), "arr <= ref: react( \"(x && y) <= zero\" )" );
	ok( objContent( react.leak( "no partOf", "(x && y) <= zero" )._dep, [ x, y, zero ] ), "react( \"(x && y) <= zero\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x && y) >= (zero && one)" )._value, [ "||", [ ">", [ "&&", x, y ], [ "&&", zero, one ] ], [ "==", [ "&&", x, y ], [ "&&", zero, one ] ] ] ), "arr >= arr: react( \"(x && y) >= (zero && one)\" )" );
	ok( objContent( react.leak( "no partOf", "(x && y) >= (zero && one)" )._dep, [ x, y, zero, one ] ), "react( \"(x && y) >= (zero && one)\" )._dep" );
} );

test( "in", function() {
	var objLit = {},
		obj = react.leak( "obj = ", objLit ),
		prop = react.leak( "prop = 'prop'" );
	
	ok( objLit, "objLit = {}" );
	ok( obj, "react( \"obj = \", {} )" );
	ok( prop, "react( \"prop = 'prop'\" )" );
	
	ok( equivArr( react.leak( "no partOf", "'prop' in obj" )._value, [ "in", "prop", obj ] ), "lit in ref: react( \"'prop' in obj\" )" );
	ok( objContent( react.leak( "no partOf", "'prop' in obj" )._dep, [ obj ] ), "react( \"'prop' in obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "'prop' in ( t ? obj : u )" )._value, [ "in", "prop", [ "?", t, [ ":", obj, u ] ] ] ), "lit in arr: react( \"'prop' in ( t ? obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", "'prop' in ( t ? obj : u )" )._dep, [ t, obj, u ] ), "react( \"'prop' in ( t ? obj : u )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "prop in", objLit )._value, [ "in", prop, objLit ] ), "ref in lit: react( \"prop in\", objLit )" );
	ok( objContent( react.leak( "no partOf", "prop in", objLit )._dep, [ prop ] ), "react( \"prop in\", objLit )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "prop in obj" )._value, [ "in", prop, obj ] ), "ref in ref: react( \"prop in obj\" )" );
	ok( objContent( react.leak( "no partOf", "prop in obj" )._dep, [ prop, obj ] ), "react( \"prop in obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "prop in ( t ? obj : u )" )._value, [ "in", prop, [ "?", t, [ ":", obj, u ] ] ] ), "ref in arr: react( \"prop in ( t ? obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", "prop in ( t ? obj : u )" )._dep, [ prop, t, obj, u ] ), "react( \"prop in ( t ? obj : u )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? prop : u ) in", objLit )._value, [ "in", [ "?", t, [ ":", prop, u ] ], objLit ] ), "arr in lit: react( \"( t ? prop : u ) in\", objLit )" );
	ok( objContent( react.leak( "no partOf", "( t ? prop : u ) in", objLit )._dep, [ t, prop, u ] ), "react( \"( t ? prop : u ) in\", objLit )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? prop : u ) in obj" )._value, [ "in", [ "?", t, [ ":", prop, u ] ], obj ] ), "arr in ref: react( \"( t ? prop : u ) in obj\" )" );
	ok( objContent( react.leak( "no partOf", "( t ? prop : u ) in obj" )._dep, [ t, prop, u, obj ] ), "react( \"( t ? prop : u ) in obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? prop : u ) in ( t ? obj : u )" )._value, [ "in", [ "?", t, [ ":", prop, u ] ], [ "?", t, [ ":", obj, u ] ] ] ), "arr in ref: react( \"( t ? prop : u ) in ( t ? obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", "( t ? prop : u ) in ( t ? obj : u )" )._dep, [ t, prop, u, obj ] ), "react( \"( t ? prop : u ) in ( t ? obj : u )\" )._dep" );
	
	react( "delete prop" );
} );

test( "instanceof", function() {
	var instLit = {},
		inst = react.leak( "inst = ", instLit ),
		ObjLit = Object,
		Obj = react.leak( "Obj = ", ObjLit );
	
	ok( instLit, "instLit = {}" );
	ok( inst, "react( \"inst = \", {} )" );
	ok( ObjLit, "ObjLit = Object" );
	ok( Obj, "react( \"Obj = \", ObjLit )" );
	
	ok( equivArr( react.leak( "no partOf", instLit, "instanceof Obj" )._value, [ "instanceof", instLit, Obj ] ), "lit instanceof ref: react( instLit, \"instanceof Obj\" )" );
	ok( objContent( react.leak( "no partOf", instLit, "instanceof Obj" )._dep, [ Obj ] ), "react( instLit, \"instanceof Obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", instLit, "instanceof ( t ? Obj : u )" )._value, [ "instanceof", instLit, [ "?", t, [ ":", Obj, u ] ] ] ), "lit instanceof arr: react( instLit, \"instanceof ( t ? Obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", instLit, "instanceof ( t ? Obj : u )" )._dep, [ t, Obj, u ] ), "react( instLit, \"instanceof ( t ? Obj : u )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "inst instanceof", ObjLit )._value, [ "instanceof", inst, ObjLit ] ), "ref instanceof lit: react( \"inst instanceof\", ObjLit )" );
	ok( objContent( react.leak( "no partOf", "inst instanceof", ObjLit )._dep, [ inst ] ), "react( \"inst instanceof\", ObjLit )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "inst instanceof Obj" )._value, [ "instanceof", inst, Obj ] ), "ref instanceof ref: react( \"inst instanceof Obj\" )" );
	ok( objContent( react.leak( "no partOf", "inst instanceof Obj" )._dep, [ inst, Obj ] ), "react( \"inst instanceof Obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "inst instanceof ( t ? Obj : u )" )._value, [ "instanceof", inst, [ "?", t, [ ":", Obj, u ] ] ] ), "ref instanceof arr: react( \"inst instanceof ( t ? Obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", "inst instanceof ( t ? Obj : u )" )._dep, [ inst, t, Obj, u ] ), "react( \"inst instanceof ( t ? Obj : u )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? inst : u ) instanceof", ObjLit )._value, [ "instanceof", [ "?", t, [ ":", inst, u ] ], ObjLit ] ), "arr instanceof lit: react( \"( t ? inst : u ) instanceof\", ObjLit )" );
	ok( objContent( react.leak( "no partOf", "( t ? inst : u ) instanceof", ObjLit )._dep, [ t, inst, u ] ), "react( \"( t ? inst : u ) instanceof\", ObjLit )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? inst : u ) instanceof Obj" )._value, [ "instanceof", [ "?", t, [ ":", inst, u ] ], Obj ] ), "arr instanceof ref: react( \"( t ? inst : u ) instanceof Obj\" )" );
	ok( objContent( react.leak( "no partOf", "( t ? inst : u ) instanceof Obj" )._dep, [ t, inst, u, Obj ] ), "react( \"( t ? inst : u ) instanceof Obj\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( t ? inst : u ) instanceof ( t ? Obj : u )" )._value, [ "instanceof", [ "?", t, [ ":", inst, u ] ], [ "?", t, [ ":", Obj, u ] ] ] ), "arr instanceof arr: react( \"( t ? inst : u ) instanceof ( t ? Obj : u )\" )" );
	ok( objContent( react.leak( "no partOf", "( t ? inst : u ) instanceof ( t ? Obj : u )" )._dep, [ t, inst, u, Obj ] ), "react( \"( t ? inst : u ) instanceof ( t ? Obj : u )\" )._dep" );
} );

test( "basic addition with 0", function() {
	ok( react.leak( "no partOf", "x + 0" ) === x, "react( \"x + 0\" )" );
	ok( equivArr( react.leak( "no partOf", "(x + y) + 0" )._value, [ "+", x, y ] ), "(x + y) + 0 = x + y" );
	ok( objContent( react.leak( "no partOf", "(x + y) + 0" )._dep, [ x, y ] ), "react( \"(x + y) + 0\" )._dep" );
} );

test( "basic addition", function() {
	ok( equivArr( react.leak( "no partOf", "5 + x" )._value, [ "+", 5, x ] ), "lit + ref: react( \"5 + x\" )" );
	ok( objContent( react.leak( "no partOf", "5 + x" )._dep, [ x ] ), "react( \"5 + x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + 5" )._value, [ "+", x, 5 ] ), "ref + lit: react( \"x + 5\" )" );
	ok( objContent( react.leak( "no partOf", "x + 5" )._dep, [ x ] ), "react( \"x + 5\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + y" )._value, [ "+", x, y ] ), "ref + ref: react( \"x + y\" )" );
	ok( objContent( react.leak( "no partOf", "x + y" )._dep, [ x, y ] ), "react( \"x + y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + ( one + y )" )._value, [ "+", x, one, y ] ), "ref + arr: react( \"x + ( one + y )\" )" );
	ok( objContent( react.leak( "no partOf", "x + ( one + y )" )._dep, [ one, y, x ] ), "react( \"x + ( one + y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one + y ) + x" )._value, [ "+", one, y, x ] ), "arr + ref: react( \"( one + y ) + x\" )" );
	ok( objContent( react.leak( "no partOf", "( one + y ) + x" )._dep, [ one, y, x ] ), "react( \"( one + y ) + x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one + y ) + ( 5 + x )" )._value, [ "+", one, y, 5, x ] ), "arr + ref: react( \"( one + y ) + ( 5 + x )\" )" );
	ok( objContent( react.leak( "no partOf", "( one + y ) + ( 5 + x )" )._dep, [ one, y, x ] ), "react( \"( one + y ) + ( 5 + x )\" )._dep" );
} );

test( "basic multiplication with 1 and 0", function() {
	ok( react.leak( "no partOf", "1*x" ) === x, "1*x = x" );
	
	ok( equivArr( react.leak( "no partOf", "1*x*y" )._value, [ "*", x, y ] ), "1*x*y = x*y" );
	ok( objContent( react.leak( "no partOf", "1*x*y" )._dep, [ x, y ] ), "react( \"1*x*y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "1*(x+y)" )._value, [ "+", x, y ] ), "1*(x+y) = x+y" );
	ok( objContent( react.leak( "no partOf", "1*(x+y)" )._dep, [ x, y ] ), "react( \"1*(x+y)\" )._dep" );
	
	strictEqual( react.leak( "no partOf", "0*x" ), 0, "0*x = 0" );
	strictEqual( react.leak( "no partOf", "0*x*y" ), 0, "0*x*y = 0" );
	strictEqual( react.leak( "no partOf", "0*(x+y)" ), 0, "0*(x+y) = 0" );
} );

test( "basic multiplication", function() {
	ok( equivArr( react.leak( "no partOf", "5 * x" )._value, [ "*", 5, x ] ), "lit * ref: react( \"5 * x\" )" );
	ok( objContent( react.leak( "no partOf", "5 * x" )._dep, [ x ] ), "react( \"5 * x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * 5" )._value, [ "*", 5, x ] ), "ref * lit: react( \"x * 5\" )" );
	ok( objContent( react.leak( "no partOf", "x * 5" )._dep, [ x ] ), "react( \"x * 5\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * y" )._value, [ "*", x, y ] ), "ref * ref: react( \"x * y\" )" );
	ok( objContent( react.leak( "no partOf", "x * y" )._dep, [ x, y ] ), "react( \"x * y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * ( one * y )" )._value, [ "*", x, one, y ] ), "ref * arr: react( \"x * ( one * y )\" )" );
	ok( objContent( react.leak( "no partOf", "x * ( one * y )" )._dep, [ one, y, x ] ), "react( \"x * ( one * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one * y ) * x" )._value, [ "*", one, y, x ] ), "arr * ref: react( \"( one * y ) * x\" )" );
	ok( objContent( react.leak( "no partOf", "( one * y ) * x" )._dep, [ one, y, x ] ), "react( \"( one * y ) * x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one * y ) * ( 5 * x )" )._value, [ "*", 5, one, y, x ] ), "arr * arr: react( \"( one * y ) * ( 5 * x )\" )" );
	ok( objContent( react.leak( "no partOf", "( one * y ) * ( 5 * x )" )._dep, [ one, y, x ] ), "react( \"( one * y ) * ( 5 * x )\" )._dep" );
} );

test( "more addition: non-+-Arrays", function() {
	ok( equivArr( react.leak( "no partOf", "( one * y ) + x" )._value, [ "+", [ "*", one, y ], x ] ), "arr + ref: react( \"( one * y ) + x\" )" );
	ok( objContent( react.leak( "no partOf", "( one * y ) + x" )._dep, [ one, y, x ] ), "react( \"( one + y ) + x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one * y ) + ( 5 + x )" )._value, [ "+", [ "*", one, y ], 5, x ] ), "arr + arr: react( \"( one * y ) + ( 5 + x )\" )" );
	ok( objContent( react.leak( "no partOf", "( one * y ) + ( 5 + x )" )._dep, [ one, y, x ] ), "react( \"( one * y ) + ( 5 + x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one + y ) + ( 5 * x )" )._value, [ "+", one, y, [ "*", 5, x ] ] ), "arr + arr: react( \"( one + y ) + ( 5 * x )\" )" );
	ok( objContent( react.leak( "no partOf", "( one + y ) + ( 5 * x )" )._dep, [ one, y, x ] ), "react( \"( one + y ) + ( 5 * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one * y ) + ( 5 * x )" )._value, [ "+", [ "*", one, y ], [ "*", 5, x ] ] ), "arr + arr: react( \"( one * y ) + ( 5 * x )\" )" );
	ok( objContent( react.leak( "no partOf", "( one * y ) + ( 5 * x )" )._dep, [ one, y, x ] ), "react( \"( one * y ) + ( 5 * x )\" )._dep" );
} );

test( "more addition: factor out doubles", function() {
	ok( equivArr( react.leak( "no partOf", "( one + 5 ) + ( 5 + x )" )._value, [ "+", one, 10, x ] ), "( one + 5 ) + ( 5 + x ) = one + 10 + x" );
	ok( objContent( react.leak( "no partOf", "( one + 5 ) + ( 5 + x )" )._dep, [ one, x ] ), "react( \"( one + 5 ) + ( 5 + x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + x" )._value, [ "*", 2, x ] ), "x + x = 2*x" );
	ok( objContent( react.leak( "no partOf", "x + x" )._dep, [ x ] ), "react( \"x + x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * y ) + ( x * y )" )._value, [ "*", 2, x, y ] ), "( x * y ) + ( x * y ) = 2*x*y" );
	ok( objContent( react.leak( "no partOf", "( x * y ) + ( x * y )" )._dep, [ x, y ] ), "react( \"( x * y ) + ( x * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + ( x + y )" )._value, [ "+", [ "*", 2, x ], y ] ), "x + ( x + y ) = 2*x + y" );
	ok( objContent( react.leak( "no partOf", "x + ( x + y )" )._dep, [ x, y ] ), "react( \"x + ( x + y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + ( y + x )" )._value, [ "+", [ "*", 2, x ], y ] ), "x + ( y + x ) = 2*x + y" );
	ok( objContent( react.leak( "no partOf", "x + ( y + x )" )._dep, [ x, y ] ), "react( \"x + ( y + x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x + y ) + x" )._value, [ "+", [ "*", 2, x ], y ] ), "( x + y ) + x = 2*x + y" );
	ok( objContent( react.leak( "no partOf", "( x + y ) + x" )._dep, [ x, y ] ), "react( \"( x + y ) + x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( y + x ) + x" )._value, [ "+", y, [ "*", 2, x ] ] ), "( y + x ) + x = y + 2*x" );
	ok( objContent( react.leak( "no partOf", "( y + x ) + x" )._dep, [ x, y ] ), "react( \"( y + x ) + x\" )._dep" );
} );
	
test( "more addition: factor out single + double", function() {	
	ok( equivArr( react.leak( "no partOf", "x + ( x * y )" )._value, [ "*", x, [ "+", 1, y ] ] ), "x + ( x * y ) = x * ( 1 + y )" );
	ok( objContent( react.leak( "no partOf", "x + ( x * y )" )._dep, [ x, y ] ), "react( \"x + ( x * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x + ( y * x )" )._value, [ "*", [ "+", 1, y ], x ] ), "x + ( y * x ) = ( 1 + y ) * x" );
	ok( objContent( react.leak( "no partOf", "x + ( y * x )" )._dep, [ x, y ] ), "react( \"x + ( y * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * y ) + x" )._value, [ "*", x, [ "+", y, 1 ] ] ), "( x * y ) + x = x * ( y + 1 )" );
	ok( objContent( react.leak( "no partOf", "( x * y ) + x" )._dep, [ x, y ] ), "react( \"( x * y ) + x\" )._dep" );

	ok( equivArr( react.leak( "no partOf", "( y * x ) + x" )._value, [ "*", [ "+", y, 1 ], x ] ), "( y * x ) + x = ( y + 1 ) * x" );
	ok( objContent( react.leak( "no partOf", "( y * x ) + x" )._dep, [ x, y ] ), "react( \"( y * x ) + x\" )._dep" );
} );
	
test( "more addition: factor out double + double", function() {	
	ok( equivArr( react.leak( "no partOf", "( 3 * x ) + ( x * y )" )._value, [ "*", x, [ "+", 3, y ] ] ), "( 3 * x ) + ( x * y ) = x * ( 3 + y )" );
	ok( objContent( react.leak( "no partOf", "( 3 * x ) + ( x * y )" )._dep, [ x, y ] ), "react( \"( 3 * x ) + ( x * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( 3 * x ) + ( 2 * x )" )._value, [ "*", 5, x ] ), "( 3 * x ) + ( 2 * x ) = 5 * x" );
	ok( objContent( react.leak( "no partOf", "( 3 * x ) + ( 2 * x )" )._dep, [ x ] ), "react( \"( 3 * x ) + ( 2 * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( y * x ) + ( 2 * x )" )._value, [ "*", [ "+", y, 2 ], x ] ), "( y * x ) + ( 2 * x ) = ( y + 2 ) * x" );
	ok( objContent( react.leak( "no partOf", "( y * x ) + ( 2 * x )" )._dep, [ x, y ] ), "react( \"( y * x ) + ( 2 * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( 3 * x ) + ( y * x )" )._value, [ "*", [ "+", 3, y ], x ] ), "( 3 * x ) + ( y * x ) = ( 3 + y ) * x" );
	ok( objContent( react.leak( "no partOf", "( 3 * x ) + ( y * x )" )._dep, [ x, y ] ), "react( \"( 3 * x ) + ( y * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( one * x ) + ( x * y )" )._value, [ "+", [ "*", one, x ], [ "*", x, y ] ] ), "( one * x ) + ( x * y ) = ( one * x ) + ( x * y )" );
	ok( objContent( react.leak( "no partOf", "( one * x ) + ( x * y )" )._dep, [ one, x, y ] ), "react( \"( one * x ) + ( x * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * one * y ) + ( x * zero * y )" )._value, [ "*", x, [ "+", one, zero ], y ] ), "( x * one * y ) + ( x * zero * y ) = x * ( one + zero ) * y" );
	ok( objContent( react.leak( "no partOf", "( x * one * y ) + ( x * zero * y )" )._dep, [ x, y, one, zero ] ), "react( \"( x * one * y ) + ( x * zero * y )\" )._dep" );
} );

test( "subtraction", function() {
	strictEqual( react.leak( "no partOf", "x - x" ), 0, "x - x = 0" );
	ok( react.leak( "no partOf", "(x + y) - y" ) === x, "( x + y ) - y = x" );
	
	ok( equivArr( react.leak( "no partOf", "( x + y + one ) - y" )._value, [ "+", x, one ] ), "( x + y + one ) - y = x + one" );
	ok( objContent( react.leak( "no partOf", "( x + y + one ) - y" )._dep, [ x, one ] ), "react( \"( x + y + one ) - y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x - y" )._value, [ "+", x, [ "*", -1, y ] ] ), "x - y = x + ( -1 * y )" );
	ok( objContent( react.leak( "no partOf", "x - y" )._dep, [ x, y ] ), "react( \"x - y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x - 5 - y" )._value, [ "+", x, -5, [ "*", -1, y ] ] ), "x - 5 - y = x - 5 + ( -1 * y )" );
	ok( objContent( react.leak( "no partOf", "x - 5 - y" )._dep, [ x, y ] ), "react( \"x - 5 - y \" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x - ( one + y )" )._value, [ "+", x, [ "*", -1, [ "+", one, y ] ] ] ), "x - ( one + y ) = x + ( -1 * ( one + y ) )" );
	ok( objContent( react.leak( "no partOf", "x - ( one + y )" )._dep, [ x, one, y ] ), "react( \"x - ( one + y )\" )._dep" );
} );

test( "basic exponentiation with 1 and 0", function() {
	strictEqual( react.leak( "no partOf", "x^0" ), 1, "react( \"x^0\" )" );
	ok( react.leak( "no partOf", "x^1" ) === x, "react( \"x^1\" )" );
	strictEqual( react.leak( "no partOf", "0^x" ), 0, "react( \"0^x\" )" );
	strictEqual( react.leak( "no partOf", "1^x" ), 1, "react( \"1^x\" )" );
	
	strictEqual( react.leak( "no partOf", "(x^y)^0" ), 1, "react( \"(x^y)^0\" )" );
	ok( equivArr( react.leak( "no partOf", "(x^y)^1" )._value , [ "^", x, y ] ), "(x^y)^1" );
	ok( objContent( react.leak( "no partOf", "(x^y)^1" )._dep, [ x, y ] ), "react( \"(x^y)^1\" )._dep" );
	strictEqual( react.leak( "no partOf", "0^(x^y)" ), 0, "react( \"0^(x^y)\" )" );
	strictEqual( react.leak( "no partOf", "1^(x^y)" ), 1, "react( \"1^(x^y)\" )" );
} );

test( "basic exponentiation", function() {	
	ok( equivArr( react.leak( "no partOf", "x^2" )._value, [ "^", x, 2 ] ), "x^2" );
	ok( objContent( react.leak( "no partOf", "x^2" )._dep, [ x ] ), "react( \"x^2\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "2^x" )._value, [ "^", 2, x ] ), "2^x" );
	ok( objContent( react.leak( "no partOf", "2^x" )._dep, [ x ] ), "react( \"2^x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^y" )._value, [ "^", x, y ] ), "x^y" );
	ok( objContent( react.leak( "no partOf", "x^y" )._dep, [ x, y ] ), "react( \"x^y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x^2)^-1" )._value, [ "^", x, -2 ] ), "(x^2)^-1" );
	ok( objContent( react.leak( "no partOf", "(x^2)^-1" )._dep, [ x ] ), "react( \"(x^2)^-1\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^y^one" )._value, [ "^", x, y, one ] ), "x^y^one" );
	ok( objContent( react.leak( "no partOf", "x^y^one" )._dep, [ x, y, one ] ), "react( \"x^y^one\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^(y^one)" )._value, [ "^", x, y, one ] ), "x^(y^one)" );
	ok( objContent( react.leak( "no partOf", "x^(y^one)" )._dep, [ x, y, one ] ), "react( \"x^(y^one)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x^y)^one" )._value, [ "^", [ "^", x, y ], one ] ), "(x^y)^one" );
	ok( objContent( react.leak( "no partOf", "(x^y)^one" )._dep, [ x, y, one ] ), "react( \"(x^y)^one\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "(x^y)^(one^zero)" )._value, [ "^", [ "^", x, y ], one, zero ] ), "(x^y)^(one^zero)" );
	ok( objContent( react.leak( "no partOf", "(x^y)^(one^zero)" )._dep, [ x, y, one, zero ] ), "react( \"(x^y)^(one^zero)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^(y^one)^zero" )._value, [ "^", x, [ "^", y, one ], zero ] ), "x^(y^one)^zero" );
	ok( objContent( react.leak( "no partOf", "x^(y^one)^zero" )._dep, [ x, y, one, zero ] ), "react( \"x^(y^one)^zero\" )._dep" );
} );

test( "more addition: add powers of x", function() {
	ok( equivArr( react.leak( "no partOf", "x^2 + x^4" )._value, [ "*", [ "^", x, 2 ], [ "+", 1, [ "^", x, 2 ] ] ] ), "x^2 + x^4 = x^2 * ( 1 + x^2 )" );
	ok( objContent( react.leak( "no partOf", "x^2 + x^4" )._dep, [ x ] ), "react( \"x^2 + x^4\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^-4 + x^-6" )._value, [ "*", [ "^", x, -4 ], [ "+", 1, [ "^", x, -2 ] ] ] ), "x^-4 + x^-6 = x^-4 * ( 1 + x^-6 )" );
	ok( objContent( react.leak( "no partOf", "x^-4 + x^-6" )._dep, [ x ] ), "react( \"x^-4 + x^-6\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^-4 + x^4" )._value, [ "+", [ "^", x, -4 ], [ "^", x, 4 ] ] ), "x^-4 + x^4" );
	ok( objContent( react.leak( "no partOf", "x^-4 + x^4" )._dep, [ x ] ), "react( \"x^-4 + x^4\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^2 + x^4*y" )._value, [ "*", [ "^", x, 2 ], [ "+", 1, [ "*", [ "^", x, 2 ], y ] ] ] ), "x^2 + x^4*y = x^2 * ( 1 + x^2*y )" );
	ok( objContent( react.leak( "no partOf", "x^2 + x^4*y" )._dep, [ x, y ] ), "react( \"x^2 + x^4*y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^y + x^4" )._value, [ "+", [ "^", x, y ], [ "^", x, 4 ] ] ), "x^y + x^4" );
	ok( objContent( react.leak( "no partOf", "x^y + x^4" )._dep, [ x, y ] ), "react( \"x^y + x^4\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^y + x^y" )._value, [ "*", 2, [ "^", x, y ] ] ), "x^y + x^y = 2 * x^y" );
	ok( objContent( react.leak( "no partOf", "x^y + x^y" )._dep, [ x, y ] ), "react( \"x^y + x^y\" )._dep" );
} );

test( "more multiplication: factor out doubles", function() {
	ok( equivArr( react.leak( "no partOf", "( one * 5 ) * ( 5 * x )" )._value, [ "*", 25, one, x ] ), "( one * 5 ) * ( 5 * x ) = 25 * one * x" );
	ok( objContent( react.leak( "no partOf", "( one * 5 ) * ( 5 * x )" )._dep, [ one, x ] ), "react( \"( one * 5 ) * ( 5 * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( 6 * one ) * ( 5 * x )" )._value, [ "*", 30, one, x ] ), "( 6 * one ) * ( 5 * x ) = 30 * one * x" );
	ok( objContent( react.leak( "no partOf", "( 6 * one ) * ( 5 * x )" )._dep, [ one, x ] ), "react( \"( 6 * one ) * ( 5 * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * x" )._value, [ "^", x, 2 ] ), "x * x = x^2" );
	ok( objContent( react.leak( "no partOf", "x * x" )._dep, [ x ] ), "react( \"x * x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x ^ y ) * ( x ^ y )" )._value, [ "^", x, [ "*", 2, y ] ] ), "( x ^ y ) * ( x ^ y ) = x^(2*y)" );
	ok( objContent( react.leak( "no partOf", "( x ^ y ) * ( x ^ y )" )._dep, [ x, y ] ), "react( \"( x ^ y ) * ( x ^ y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * ( x * y )" )._value, [ "*", [ "^", x, 2 ], y ] ), "x * ( x * y ) = x^2 * y" );
	ok( objContent( react.leak( "no partOf", "x * ( x * y )" )._dep, [ x, y ] ), "react( \"x * ( x * y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * ( y * x )" )._value, [ "*", x, y, x ] ), "x * ( y * x ) = x * y * x" );
	ok( objContent( react.leak( "no partOf", "x * ( y * x )" )._dep, [ x, y ] ), "react( \"x * ( y * x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * y ) * x" )._value, [ "*", x, y, x ] ), "( x * y ) * x = x * y * x" );
	ok( objContent( react.leak( "no partOf", "( x * y ) * x" )._dep, [ x, y ] ), "react( \"( x * y ) * x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( y * x ) * x" )._value, [ "*", y, [ "^", x, 2 ] ] ), "( y * x ) * x = y * x^2" );
	ok( objContent( react.leak( "no partOf", "( y * x ) * x" )._dep, [ x, y ] ), "react( \"( y * x ) * x\" )._dep" );
} );

test( "more multiplication: factor out base/exponent", function() {
	ok( equivArr( react.leak( "no partOf", "( x ^ y ) * ( x ^ one )" )._value, [ "^", x, [ "+", y, one ] ] ), "( x ^ y ) * ( x ^ one ) = x^( y + one )" );
	ok( objContent( react.leak( "no partOf", "( x ^ y ) * ( x ^ one )" )._dep, [ x, y, one ] ), "react( \"( x ^ y ) * ( x ^ one )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x ^ one ) * ( y ^ one )" )._value, [ "^", [ "*", x, y ], one ] ), "( x ^ one ) * ( y ^ one ) = ( x * y )^one" );
	ok( objContent( react.leak( "no partOf", "( x ^ one ) * ( y ^ one )" )._dep, [ x, y, one ] ), "react( \"( x ^ one ) * ( y ^ one )\" )._dep" );
} );
	
test( "more multiplication: factor out single + double", function() {	
	ok( equivArr( react.leak( "no partOf", "x * ( x ^ y )" )._value, [ "^", x, [ "+", 1, y ] ] ), "x * ( x ^ y ) = x^( 1 + y )" );
	ok( objContent( react.leak( "no partOf", "x * ( x ^ y )" )._dep, [ x, y ] ), "react( \"x * ( x ^ y )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * ( y ^ x )" )._value, [ "*", x, [ "^", y, x ] ] ), "x * ( y ^ x ) = x * y^x" );
	ok( objContent( react.leak( "no partOf", "x * ( y ^ x )" )._dep, [ x, y ] ), "react( \"x * ( y ^ x )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x ^ y ) * x" )._value, [ "^", x, [ "+", y, 1 ] ] ), "( x ^ y ) * x = x^( y + 1 )" );
	ok( objContent( react.leak( "no partOf", "( x ^ y ) * x" )._dep, [ x, y ] ), "react( \"( x ^ y ) * x\" )._dep" );

	ok( equivArr( react.leak( "no partOf", "( y ^ x ) * x" )._value, [ "*", [ "^", y, x ], x ] ), "( y ^ x ) * x = y^x * x" );
	ok( objContent( react.leak( "no partOf", "( y ^ x ) * x" )._dep, [ x, y ] ), "react( \"( y ^ x ) * x\" )._dep" );
} );

test( "more multiplication: factor out double + double", function() {	
	ok( equivArr( react.leak( "no partOf", "x^3 * x^y" )._value, [ "^", x, [ "+", 3, y ] ] ), "x^3 * x^y = x^( 3 + y )" );
	ok( objContent( react.leak( "no partOf", "x^3 * x^y" )._dep, [ x, y ] ), "react( \"x^3 * x^y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x^3 * x^2" )._value, [ "^", x, 5 ] ), "x^3 * x^2 = x^5" );
	ok( objContent( react.leak( "no partOf", "x^3 * x^2" )._dep, [ x ] ), "react( \"x^3 * x^2\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "y^x * 2^x" )._value, [ "^", [ "*", 2, y ], x ] ), "y^x * 2^x = ( 2 * y )^x" );
	ok( objContent( react.leak( "no partOf", "y^x * 2^x" )._dep, [ x, y ] ), "react( \"y^x * 2^x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "one^x * x^y" )._value, [ "*", [ "^", one, x ], [ "^", x, y ] ] ), "one^x * x^y" );
	ok( objContent( react.leak( "no partOf", "one^x * x^y" )._dep, [ one, x, y ] ), "react( \"one^x * x^y\" )._dep" );
	;
	ok( equivArr( react.leak( "no partOf", "x^one^y * x^zero^y" )._value, [ "^", x, [ "+", [ "^", one, y ], [ "^", zero, y ] ] ] ), "x^one^y * x^zero^y = x^( one^y + zero^y )" );
	ok( objContent( react.leak( "no partOf", "x^one^y * x^zero^y" )._dep, [ x, y, one, zero ] ), "react( \"x^one^y * x^zero^y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x * ( one * y ) * x" )._value, [ "*", x, one, y, x ] ), "react( \"x * ( one * y ) * x\" )" );
	ok( objContent( react.leak( "no partOf", "x * ( one * y ) * x" )._dep, [ one, y, x ] ), "react( \"x * ( one * y ) * x\" )._dep" );
} );

test( "division", function() {
	strictEqual( react.leak( "no partOf", "x / x" ), 1, "x / x = 1" );
	ok( react.leak( "no partOf", "(x * y) / y" ) === x, "( x * y ) / y = x" );
	
	ok( equivArr( react.leak( "no partOf", "x / y" )._value, [ "*", x, [ "^", y, -1 ] ] ), "x / y = x * y^-1" );
	ok( objContent( react.leak( "no partOf", "x / y" )._dep, [ x, y ] ), "react( \"x / y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * y * one ) / y" )._value, [ "*", x, y, one, [ "^", y, -1 ] ] ), "( x * y * one ) / y = x * y * one * y^-1" );
	ok( objContent( react.leak( "no partOf", "( x * y * one ) / y" )._dep, [ x, y, one ] ), "react( \"( x * y * one ) / y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x * one * y ) / y" )._value, [ "*", x, one ] ), "( x * y * one ) / y = x * one" );
	ok( objContent( react.leak( "no partOf", "( x * one * y ) / y" )._dep, [ x, one ] ), "react( \"( x * y * one ) / y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x / 5 / y" )._value, [ "*", 1/5, x, [ "^", y, -1 ] ] ), "x / 5 / y = 0.2 * x * y^-1" );
	ok( objContent( react.leak( "no partOf", "x / 5 / y" )._dep, [ x, y ] ), "react( \"x / 5 / y \" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x / ( 5 * y )" )._value, [ "*", x, [ "^", [ "*", 5, y ], -1 ] ] ), "x / ( 5 * y ) = x * ( 5 * y )^-1" );
	ok( objContent( react.leak( "no partOf", "x / ( 5 * y )" )._dep, [ x, y ] ), "react( \"x / ( 5 * y )\" )._dep" );
} );

test( "modulus", function() {	
	strictEqual( react.leak( "no partOf", "0 % x" ), 0, "react( \"0 % x\" )" );
	strictEqual( react.leak( "no partOf", "x % x" ), 0, "react( \"x % x\" )" );
	ok( isNaN( react.leak( "no partOf", "x % 0" ) ), "isNaN( react( \"x % 0\" ) )" );
	strictEqual( react.leak( "no partOf", "x % 1" ), 0, "react( \"x % 1\" )" );
	
	ok( equivArr( react.leak( "no partOf", "x % y" )._value, [ "%", x, y ] ), "react( \"x % y\" )" );
	ok( objContent( react.leak( "no partOf", "x % y" )._dep, [ x, y ] ), "react( \"x % y\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x % y % one" )._value, [ "%", x, y, one ] ), "react( \"x % y % one\" )" );
	ok( objContent( react.leak( "no partOf", "x % y % one" )._dep, [ x, y, one ] ), "react( \"x % y % one\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "x % ( y % one )" )._value, [ "%", x, y, one ] ), "react( \"x % ( y % one )\" )" );
	ok( objContent( react.leak( "no partOf", "x % ( y % one )" )._dep, [ x, y, one ] ), "react( \"x % ( y % one )\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "( x % zero ) % ( y % one )" )._value, [ "%", x, zero, y, one ] ), "react( \"( x % zero ) % ( y % one )\" )" );
	ok( objContent( react.leak( "no partOf", "( x % zero ) % ( y % one )" )._dep, [ x, y, one, zero ] ), "react( \"( x % zero ) % ( y % one )\" )._dep" );
} );

test( "ternary operator", function() {
	ok( equivArr( react.leak( "no partOf", "t ? x : y" )._value, [ "?", t, [ ":", x, y ] ] ), "react( \"t ? x : y\" )" );
	ok( objContent( react.leak( "no partOf", "t ? x : y" )._dep, [ t, x, y ] ), "react( \"t ? x : y\" )._dep" );
} );

test( "conversion", function() {
	ok( equivArr( react.leak( "no partOf", "+t" )._value, [ "+", t ] ), "react( \"+t\" )" );
	
	ok( equivArr( react.leak( "no partOf", "+(x+t)" )._value, [ "+", [ "+", x, t ] ] ), "react( \"+(x+t)\" )" );
	ok( objContent( react.leak( "no partOf", "+(x+t)" )._dep, [ x, t ] ), "react( \"+(x+t)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "++(x+t)" )._value, [ "+", [ "+", x, t ] ] ), "react( \"++(x+t)\" )" );
	ok( objContent( react.leak( "no partOf", "++(x+t)" )._dep, [ x, t ] ), "react( \"++(x+t)\" )._dep" );
} );

test( "negation", function() {
	ok( equivArr( react.leak( "no partOf", "-t" )._value, [ "*", -1, t ] ), "react( \"-t\" ) = -1 * t" );
	
	ok( equivArr( react.leak( "no partOf", "-(x+t)" )._value, [ "*", -1, [ "+", x, t ] ] ), "react( \"-(x+t)\" ) = -1 * (x+t)" );
	ok( objContent( react.leak( "no partOf", "-(x+t)" )._dep, [ x, t ] ), "react( \"-(x+t)\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "--(x+t)" )._value, [ "+", x, t ] ), "react( \"--(x+t)\" ) = x+t" );
	ok( objContent( react.leak( "no partOf", "--(x+t)" )._dep, [ x, t ] ), "react( \"--(x+t)\" )._dep" );
} );

test( "typeof", function() {
	ok( equivArr( react.leak( "no partOf", "typeof x" )._value, [ "typeof", x ] ), "typeof ref: react( \"typeof x\" )" );
	ok( objContent( react.leak( "no partOf", "typeof x" )._dep, [ x ] ), "react( \"typeof x\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "typeof (x+foo)" )._value, [ "typeof", [ "+", x, foo ] ] ), "typeof arr: react( \"typeof (x+foo)\" )" );
	ok( objContent( react.leak( "no partOf", "typeof (x+foo)" )._dep, [ x, foo ] ), "react( \"typeof (x+foo)\" )._dep" );
	
	strictEqual( react.leak( "no partOf", "typeof typeof x" ), "string", "react( \"typeof typeof x\" )" );
} );

test( "#", function() {
	strictEqual( react.leak( "no partOf", "#x" ), x._value, "#ref: react( \"#x\" )" );
	strictEqual( react.leak( "no partOf", "#(x+foo)" ), x._value + foo._value, "#arr: react( \"#(x+foo)\" )" );
	
	strictEqual( react.leak( "no partOf", "##x" ), x._value, "react( \"##x\" )" );
} );


module( "Variables with complex values composed of other variables (named and anonymous)" );

test( "assignment", function() {
	var rea = react.leak( "rea = x+y" ),
		z, z2,
		anonym = react.leak( "x+y" );
	
	ok( anonym, "anonym = react.leak( \"x+y\" )" );
	ok( anonym._key == anonym._guid, "anonym is anonymous variable with guid as key." );
	ok( x._partOf[ anonym._guid ] === anonym, "x is part of anonym." );
	ok( y._partOf[ anonym._guid ] === anonym, "y is part of anonym." );
	react( "delete", anonym );
	
	ok( rea, "rea = react.leak( \"rea = x+y\" )" );
	ok( x._partOf[ rea._guid ] === rea, "x is part of rea." );
	ok( y._partOf[ rea._guid ] === rea, "y is part of rea." );
	ok( !(rea._guid in one._partOf), "one is no part of rea." );
	
	ok( react( rea, "= 5*one" ), "react( rea, \"= 5*one\" )" );
	
	ok( !(rea._guid in x._partOf), "x is no part of rea." );
	ok( !(rea._guid in y._partOf), "y is no part of rea." );
	ok( one._partOf[ rea._guid ] === rea, "one is part of rea." );
	
	ok( equivArr( rea._value, [ "*", 5, one ] ), "rea._value" );
	ok( objContent( rea._dep, [ one ] ), "rea._dep" );
	
	ok( react( "rea = rea" ), "self-reference: react( \"rea = rea\" )" );
	react( "delete", rea );
	
	z2 = react.leak( "no partOf", "z2 = y" );
	ok( z2, "z2 = react.leak( \"z2 = y\" )" );
	
	react.leak( "no partOf", "z2 = z2 + 10 * x" );
	
	ok( equivArr( z2._value, [ "+", y, [ "*", 10, x ] ] ), "infix calculation with self-reference: react( \"z2 = z2 + 10 * x\" )" );
	ok( objContent( z2._dep, [ y, x ] ), "react.leak( \"z2 = z2 + 10 * x\" )._dep" );
	
	react.leak( "no partOf", "z2 = -z2" );
	ok( equivArr( z2._value, [ "*", -1, [ "+", y, [ "*", 10, x ] ] ] ), "prefix calculation with self-reference: react( \"z2 = -z2\" )" );
	ok( objContent( z2._dep, [ y, x ] ), "react.leak( \"z2 = -z2\" )._dep" );
	
	z = react.leak( "no partOf", "z = z2+5" );
	
	ok( equivArr( z._value, [ "+", z2, 5 ] ), "link to variable, that is not defined yet: react( \"z = z2+5\" )" );
	ok( objContent( z._dep, [ z2 ] ), "react.leak( \"z = z2+5\" )._dep" );
	
	raises( function() { react.leak( "no partOf", "z = a+10" ) }, "react( \"z = a+10\" ) -> exception" );
	strictEqual( ( function() {
		try {
			return react.leak( "no partOf", "z = a+10" );
		} catch( e ) {
			return e.message;
		}
	}() ), "react.js | a is not defined.", "react( \"z = a+10\" ) -> exception" );
} );

test( "delete", function() {
	var rea = react.leak( "rea = x+y" ),
		reb = react.leak( "reb = rea+10" ),
		key = rea._guid;
	
	ok( rea, "rea = react.leak( \"rea = x+y\" )" );
	ok( reb, "reb = react.leak( \"reb = rea+10\" )" );
	
	ok( x._partOf[ key ] === rea, "x is part of rea." );
	ok( y._partOf[ key ] === rea, "y is part of rea." );
	
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
} );

test( "clean", function() {
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
	
	ok( react( "cleanExcept u, n, t, f, x, y, foo, bar, zero, one" ), "react( \"cleanExcept u, n, t, f, x, y, foo, bar, zero, one\" )" );
	
	ok( rea.hasOwnProperty( "_value" ), "rea has not been deleted" );
	ok( !reb.hasOwnProperty( "_value" ), "reb has been deleted" );
	ok( !rec.hasOwnProperty( "_value" ), "rec has been deleted" );
	ok( !red.hasOwnProperty( "_value" ), "red has been deleted" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	
	ok( react( "clean" ), "react( \"clean\" )" );
	ok( isEmptyObj( react.nameTable.table, true ), "all variables deleted" );
	
	//restore deleted variables
	u = react.leak( "u = undefined" );
	n = react.leak( "n = null" );
	t = react.leak( "t = true" );
	f = react.leak( "f = false" );
	x = react.leak( "x = 2.6" );
	y = react.leak( "y = 7.4" );
	zero = react.leak( "zero = 0" );
	one  = react.leak( "one = 1" );
	foo  = react.leak( "foo = 'foo'" );
	bar  = react.leak( "bar = 'bar'" );
} );

test( "calculate with extern variables", function() {
	var anonym = react.leak( "no partOf", x, "+", y ),
		anonym2 = react.leak( "no partOf", anonym, "*5" );
	
	ok( equivArr( anonym._value, [ "+", x, y ] ), "calc with named variable: react( x, \"+\", y )" );
	ok( objContent( anonym._dep, [ x, y ] ), "react.leak( x, \"+\", y )._dep" );
	
	ok( equivArr( anonym2._value, [ "*", 5, anonym ] ), "calc with anonymous variable: react( anonym, \"*5\" )" );
	ok( objContent( anonym2._dep, [ anonym ] ), "react.leak( anonym, \"*5\" )._dep" );
} );

test( "operator assignments", function() {
	var z = react.leak( "z = 5" ),
		anonym = react.leak( "no partOf", "5+x" );
	
	ok( z, "z = react.leak( \"z = 5\" )" );
	ok( anonym, "anonym = react.leak( \"5+x\" )" );
	
	react.leak( "no partOf", "z += 10 * x" );
	react.leak( "no partOf", anonym, "+= 10 * x" );
	
	ok( equivArr( z._value, [ "+", 5, [ "*", 10, x ] ] ), "named variable: react( \"z += 10 * x\" )" );
	ok( objContent( z._dep, [ x ] ), "react.leak( \"z += 10 * x\" )._dep" );
	
	ok( equivArr( anonym._value, [ "+", 5, [ "*", 11, x ] ] ), "anonymous variable: react( anonym, \"+= 10 * x\" )" );
	ok( objContent( anonym._dep, [ x ] ), "react.leak( anonym, \"+= 10 * x\" )._dep" );
	
	react.leak( "no partOf", "-=z" );
	ok( equivArr( z._value, [ "*", -1, [ "+", 5, [ "*", 10, x ] ] ] ), "named variable: react( \"-=z\" )" );
	ok( objContent( z._dep, [ x ] ), "react.leak( \"-=z\" )._dep" );
	
	react( "z *= z" );
	ok( equivArr( z._value, [ "^", [ "+", 5, [ "*", 10, x ] ], 2 ] ), "named variable: react( \"z *= z\" )" );
	ok( objContent( z._dep, [ x ] ), "react.leak( \"z *= z\" )._dep" );
	
	var zVal = z._value;
	react.leak( "no partOf", "z ==.= 'bar'" );
	ok( equivArr( z._value, [ "==", zVal, "bar" ] ), "operator assignment separator: react( \"z ==.= 'bar'\" )" );
	ok( objContent( z._dep, [ x ] ), "react.leak( \"z ==.= 'bar'\" )._dep" );
} );

test( "evaluation before and after modifying a part", function() {
	var r1 = react.leak( "r1 = x+t" )
		xpt = x.valueOf() + t.valueOf();
	
	ok( r1, "r1 = react.leak( \"x+t\" )" );
	
	strictEqual( r1._evaled, undefined, "r1._evaled before .valueOf()" );
	strictEqual( r1._string, undefined, "r1._string before .toString()" );
	
	strictEqual( r1.valueOf(), xpt, "r1.valueOf()" );
	strictEqual( r1.toString(), "r1 = x + t", "r1.toString()" );
	
	strictEqual( r1._evaled, xpt, "r1._evaled after .valueOf()" );
	strictEqual( r1._string, "r1 = x + t", "r1._string after .toString()" );
	
	ok( react( "x = 8" ), "x changed." );
	
	strictEqual( r1._evaled, undefined, "r1._evaled after modified part" );
	strictEqual( r1._string, undefined, "r1._string after modified part" );
	
	react( "delete r1" );
} );

test( "string output", function() {
	var anonym = react.leak( "x+t" ),
		named = react.leak( "named = ", anonym, " + one" );
	
	ok( anonym, "anonym = react.leak( \"x+t\" )" );
	ok( named, "named = react.leak( \"named = \", anonym, \"+one\" )" );
	
	strictEqual( anonym.toString(), "x + t", "anonym.toString()" );
	strictEqual( named.toString(), "named = {x + t} + one", "named.toString()" );
	
	react( "delete named; delete", anonym );
} );


module( "Objects and variables" );

test( "assigning object to variable", function() {
	var obj = { foo : "bar"},
		rea = react.leak( "rea = ", obj );
	
	ok( rea, "rea = react.leak( \"rea = \", { foo : 'bar'} )" );
	strictEqual( rea._value, obj, "rea._value after assignment" );
	strictEqual( rea.valueOf(), obj, "rea.valueOf() after assignment" );
} );

test( "property access: object is literal, property is variable", function() {
	var sObj = { fst : 1, snd : 2, foo : { bar : "foo" } };
	
	ok( sObj, "sObj = { fst : 1, snd : 2, foo : { bar : \"foo\" } }" );
	
	ok( equivArr( react.leak( "no partOf", sObj, "[ foo ]" )._value, [ ".", sObj, foo ] ), "one propname is variable: react( sObj, \"[ foo ]\" )" );
	ok( objContent( react.leak( "no partOf", sObj, "[ foo ]" )._dep, [ foo ] ), "react( sObj, \"[ foo ]\" )" );
	
	ok( equivArr( react.leak( "no partOf", sObj, "[ foo ][ bar ]" )._value, [ ".", sObj, foo, bar ] ), "two propnames are variables: react( sObj, \"[ foo ][ bar ]\" )" );
	ok( objContent( react.leak( "no partOf", sObj, "[ foo ][ bar ]" )._dep, [ foo, bar ] ), "react( sObj, \"[ foo ][ bar ]\" )" );
	
	ok( equivArr( react.leak( "no partOf", sObj, ".foo[ bar ]" )._value, [ ".", sObj.foo, bar ] ), "1st propname constant, 2nd variable: react( sObj, \".foo[ bar ]\" )" );
	ok( objContent( react.leak( "no partOf", sObj, ".foo[ bar ]" )._dep, [ bar ] ), "react( sObj, \".foo[ bar ]\" )" );
	
	ok( equivArr( react.leak( "no partOf", sObj, "[ foo ].bar" )._value, [ ".", sObj, foo, "bar" ] ), "1st propname variable, 2nd constant: react( sObj, \"[ foo ].bar\" )" );
	ok( objContent( react.leak( "no partOf", sObj, "[ foo ].bar" )._dep, [ foo ] ), "react( sObj, \"[ foo ].bar\" )" );
	
	ok( equivArr( react.leak( "no partOf", sObj, "[ ", sObj, "[ foo ].bar ]" )._value, [ ".", sObj, [ ".", sObj, foo, "bar" ] ] ), "1st propname also uses property access: react( sObj, \"[ \", sObj, \"[ foo ].bar ]\" )" );
	ok( objContent( react.leak( "no partOf", sObj, "[ ", sObj, "[ foo ].bar ]" )._dep, [ foo ] ), "react( sObj, \"[ \", sObj, \"[ foo ].bar ]\" )" );
} );

test( "property access: object is variable, property is literal", function() {	
	var obj  = react.leak( "obj = ", { foo : { bar : "bar" }, fst : 1, snd : 2 } );
	
	ok( obj, "obj = react.leak( \"obj = \", { foo : { bar : \"bar\" }, fst : 1, snd : 2 } )" );
	
	ok( equivArr( react.leak( "no partOf", "obj.foo" )._value, [ ".", obj, "foo" ] ), "one propname is constant: react( obj, \".foo\" )" );
	ok( objContent( react.leak( "no partOf", "obj.foo" )._dep, [ obj ] ), "react( obj, \".foo\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "obj[ foo ]" )._value, [ ".", obj, foo ] ), "one propname is variable: react( \"obj[ foo ]\" )" );
	ok( objContent( react.leak( "no partOf", "obj[ foo ]" )._dep, [ obj, foo ] ), "react( \"obj[ foo ]\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "obj[ foo ][ bar ]" )._value, [ ".", obj, foo, bar ] ), "two propnames are variables: react( \"obj[ foo ][ bar ]\" )" );
	ok( objContent( react.leak( "no partOf", "obj[ foo ][ bar ]" )._dep, [ obj, foo, bar ] ), "react( \"obj[ foo ][ bar ]\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "obj.foo[ bar ]" )._value, [ ".", obj, "foo", bar ] ), "1st propname constant, 2nd variable: react( \"obj.foo[ bar ]\" )" );
	ok( objContent( react.leak( "no partOf", "obj.foo[ bar ]" )._dep, [ obj, bar ] ), "react( \"obj.foo[ bar ]\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "obj[ foo ].bar" )._value, [ ".", obj, foo, "bar" ] ), "1st propname variable, 2nd constant: react( \"obj[ foo ].bar\" )" );
	ok( objContent( react.leak( "no partOf", "obj[ foo ].bar" )._dep, [ obj, foo ] ), "react( \"obj[ foo ].bar\" )._dep" );
	
	ok( equivArr( react.leak( "no partOf", "obj[ obj[ foo ].bar ]" )._value, [ ".", obj, [ ".", obj, foo, "bar" ] ] ), "1st propname also uses property access: react( \"obj[ obj[ foo ].bar ]\" )" );
	ok( objContent( react.leak( "no partOf", "obj[ obj[ foo ].bar ]" )._dep, [ obj, foo ] ), "react( \"obj[ obj[ foo ].bar ]\" )._dep" );
	
	react( "delete obj" );
} );

test( "permanent property assignment: object literal, property variable", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	ok( react( obj, "[ prop ] = 'value'" ), "react( obj, \"[ prop ] = 'value'\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "prop = 'foo'" ), "react( \"prop = 'foo'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	
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
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "robj = ", obj2 ), "react( \"robj = \", obj2 )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "permanent property assignment: object literal, property valueArray", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	ok( react( "prop = bool ? 'foo' : 'bar'" ), "react( \"prop = bool ? 'foo' : 'bar'\" )" );
	ok( react( obj, "[ prop ] = 'value'" ), "react( obj, \"[ prop ] = 'value'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	react( "delete prop; delete bool;" );
} );

test( "permanent property assignment: object valueArray, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "robj.prop = 'value'" ), "react( \"robj.prop = 'value'\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "reversible property assignment: object literal, property variable", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	
	ok( react( obj, "[ prop ] ~= 'value'" ), "react( obj, \"[ prop ] ~= 'value'\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "prop = 'foo'" ), "react( \"prop = 'foo'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( react( "prop = 'bar'" ), "react( \"prop = 'bar'\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	
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
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "robj = ", obj2 ), "react( \"robj = \", obj2 )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "robj = ", obj1 ), "react( \"robj = \", obj1 )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "reversible property assignment: object literal, property valueArray", function() {
	var obj = { foo : "foo" };
	
	ok( obj, "obj = { foo : \"foo\" }" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	ok( react( "prop = bool ? 'foo' : 'bar'" ), "react( \"prop = bool ? 'foo' : 'bar'\" )" );
	ok( react( obj, "[ prop ] ~= 'value'" ), "react( obj, \"[ prop ] ~= 'value'\" )" );
	
	strictEqual( obj.foo, "value", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( obj.bar, "value", "obj.bar" );
	
	ok( react( "~", obj, "[ prop ]" ), "react( \"~\", obj, \"[ prop ]\" )" );
	
	strictEqual( obj.foo, "foo", "obj.foo" );
	strictEqual( 'bar' in obj, false, "'bar' in obj" );
	
	react( "delete prop; delete bool;" );
} );

test( "reversible property assignment: object valueArray, property literal", function() {
	var obj1 = {},
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "robj.prop ~= 'value'" ), "react( \"robj.prop ~= 'value'\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "value", "obj2.prop" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( obj1.prop, "value", "obj1.prop" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	react( "delete robj; delete bool;" );
} );

test( "permanent property deletion", function() {
	var obj1 = { prop : "foo" },
		obj2 = { prop : "bar" };
	
	ok( obj1, "obj1 = {}" );
	ok( obj2, "obj2 = { prop : \"bar\" }" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	ok( react( "robj = bool ?", obj1, " : ", obj2 ), "react( \"robj = bool ?\", obj1, \" : \", obj2 )" );
	ok( react( "delete robj.prop" ), "react( \"delete robj.prop\" )" );
	
	strictEqual( obj1.prop, "foo", "obj1.prop" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
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
	
	strictEqual( obj1.prop, "foo", "obj1.prop" );
	strictEqual( "prop" in obj2, false, "\"prop\" in obj2" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( "prop" in obj1, false, "\"prop\" in obj1" );
	strictEqual( obj2.prop, "bar", "obj2.prop" );
	
	ok( react( "~robj.prop" ), "react( \"~robj.prop\" )" );
	
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

test( "assignment of reactive variable to property", function() {
	var obj = {};
	
	ok( react( "rct = 10" ), "react( \"rct = 10\" )" );	
	
	ok( react( obj, ".prop = rct+5" ), "react( obj, \".prop = rct+5\" )" );
	strictEqual( obj.prop, 15, "obj.prop" );
	
	ok( react( "rct += 10" ), "react( \"rct += 10\" )" );
	strictEqual( obj.prop, 25, "obj.prop" );
	
	ok( react( "~", obj, ".prop" ), "react( \"~\", obj, \".prop\" )" );
	
	ok( react( "delete rct" ), "react( \"delete rct\" )" );
	strictEqual( obj.prop, 25, "obj.prop" );
} );

test( "assignment of literal value to property with reactive variable", function() {
	var obj = {};
	
	ok( react( "rct = 10" ), "react( \"rct = 10\" )" );	
	
	ok( react( obj, ".prop = rct+5" ), "react( obj, \".prop = rct+5\" )" );
	strictEqual( obj.prop, 15, "obj.prop" );
	
	ok( react( obj, ".prop = 5" ), "react( obj, \".prop = 5\" )" );
	strictEqual( obj.prop, 5, "obj.prop" );
	
	ok( react( "delete rct" ), "react( \"delete rct\" )" );
} );


module( "Functions and variables" );

test( "assigning function to variable", function() {
	var func = function( x ) { return !x || x < 2 ? 1 : func( x-1 )*x; },
		fac = react.leak( "fac = ", func );
	
	ok( fac, "fac = react.leak( \"fac = \", function( x ) { return x < 2 ? 1 : fac( x-1 )*x; } )" );
	strictEqual( fac._value, func, "fac._value after assignment" );
	strictEqual( fac.valueOf(), func, "fac.valueOf() after assignment" );
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
	
	strictEqual( func._funcs.length, 0, "func._funcs.length" );
	call = react.leak( "func( 100 )" );
	strictEqual( func._funcs.length, 1, "func._funcs.length" );
	
	ok( equivArr( call._value, [ "(", func, 100 ] ), "react( func, \"( 100 )\" )" )
	ok( objContent( call._dep, [ func ] ), "react.leak( func, \"( 100 )\" )._dep" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "func = ", func2 ), "react( \"func = \", func2 )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "func~( 100 )" ), "react( \"func~( 100 )\" )" );
	strictEqual( func._funcs.length, 0, "func._funcs.length" );
	
	ok( react( "func = ", func1 ), "react( \"func = \", func1 )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete", call, "; delete func" );
} );

test( "call w/o return value: function is valueArray, argument is literal", function() {
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
	
	ok( equivArr( call._value, [ "(", [ "?", bool, [ ":", func1, func2 ] ], 100 ] ), "react( \"( bool ?\", func1, \":\", func2, \")( 100 )\" )" );
	ok( objContent( call._dep, [ bool ] ), "react.leak( \"( bool ?\", func1, \":\", func2, \")( 100 )\" )._dep" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( !react( "bool = false" ), "react( \"bool = false\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "( bool ?", func1, ":", func2, ")~( 100 )" ), "react( \"( bool ?\", func1, \":\", func2, \")~( 100 )\" )" );
	
	ok( react( "bool = true" ), "react( \"bool = true\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete", call, "; delete bool" );
} );

test( "call w/o return value: function is object method with variable property, argument is literal", function() {
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
	
	ok( equivArr( call._value, [ "(", [ ".", obj, prop ], 100 ] ), "react( obj, \"[ prop ]( 100 )\" )" );
	ok( objContent( call._dep, [ prop ] ), "react.leak( obj, \"[ prop ]( 100 )\" )._dep" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "prop = 'method2'" ), "react( \"prop = 'method2'\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( obj, "[ prop ]~( 100 )" ), "react( obj, \"[ prop ]~( 100 )\" )" );
	
	ok( react( "prop = 'method1'" ), "react( \"prop = 'method1'\" )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete", call, "; delete prop" );
} );

test( "call w/o return value: function is object method with variable context, argument is literal", function() {
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
	
	ok( equivArr( call._value, [ "(", [ ".", ctxt, 'method' ], 100 ] ), "react( \"ctxt.method( 100 )\" )" );
	ok( objContent( call._dep, [ ctxt ] ), "react.leak( \"ctxt.method( 100 )\" )._dep" );
	
	strictEqual( foo, 100, "foo" );
	
	ok( react( "ctxt = ", obj2 ), "react( \"ctxt = \", obj2 )" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "ctxt.method~( 100 )" ), "react( \"ctxt.method~( 100 )\" )" );
	
	ok( react( "ctxt = ", obj1 ), "react( \"ctxt = \", obj1 )" );
	
	strictEqual( foo, 150, "foo" );
	
	react( "delete", call, "; delete ctxt" );
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
	
	ok( equivArr( call._value, [ "(", func, arg1 ] ), "react( func, \"( arg1 )\" )" )
	ok( objContent( call._dep, [ arg1 ] ), "react.leak( func, \"( arg1 )\" )._dep" );
	
	strictEqual( foo, 50, "foo" );
	
	ok( react( "arg1 = 'bar'" ), "react( \"arg1 = 'bar'\" )" );
	
	strictEqual( foo, "bar", "foo" );
	
	ok( react( func, "~( arg1 )" ), "react( func, \"~( arg1 )\" )" );
	ok( react( "arg1 = 'foo'" ), "react( \"arg1 = 'foo'\" )" );
	
	strictEqual( foo, "bar", "foo" );
	
	react( "delete", call, "; delete arg1" );
} ); 

test( "call w/o return value: function is literal, argument is valueArray", function() {
	var foo,
		func = function( arg1 ) {
			foo = arg1;
		},
		r = react.leak( "r = 50" ),
		rpx,
		call = react.leak( func, "( r+x )" );
	
	ok( func, "func = function( arg1 ) { foo = arg1; }" );
	ok( r, "react( \"r = 50\" )" );
	
	ok( equivArr( call._value, [ "(", func, [ "+", r, x ] ] ), "react( func, \"( r+x )\" )" )
	ok( objContent( call._dep, [ r, x ] ), "react.leak( func, \"( r+x )\" )._dep" );
	
	strictEqual( foo, r.valueOf() + x.valueOf(), "foo" );
	
	ok( react( "r = 'bar'" ), "react( \"r = 'bar'\" )" );
	
	rpx = r.valueOf() + x.valueOf()
	strictEqual( foo, rpx, "foo" );
	
	ok( react( func, "~( r+x )" ), "react( func, \"~( r+x )\" )" );
	ok( react( "r = 'foo'" ), "react( \"r = 'foo'\" )" );
	
	strictEqual( foo, rpx, "foo" );
	
	react( "delete", call, "; delete r" );
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
	
	ok( equivArr( call._value, [ "(", func, [ ",", arg1, 100 ] ] ), "react( func, \"( arg1, 100 )\" )" )
	ok( objContent( call._dep, [ arg1 ] ), "react.leak( func, \"( arg1, 100 )\" )._dep" );
	
	strictEqual( foo, 150, "foo" );
	
	ok( react( "arg1 = 'bar'" ), "react( \"arg1 = 'bar'\" )" );
	
	strictEqual( foo, "bar100", "foo" );
	
	ok( react( func, "~( arg1, 100 )" ), "react( func, \"~( arg1, 100 )\" )" );
	ok( react( "arg1 = 'foo'" ), "react( \"arg1 = 'foo'\" )" );
	
	strictEqual( foo, "bar100", "foo" );
	
	react( "delete", call, "; delete arg1" );
} );

test( "registering :() and deregistering ~() call", function() {
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
		},
		call;
	
	ok( r1, "r1 = react.leak( \"x+t\" )" );
	
	call = react.leak( r1_func1, ":(", r1, ");", r1_func2, ":(", r1, ");", r1_func3, ":(", r1, ");" );
	react( "delete", call );
	
	ok( r1._funcs[ 0 ].func === r1_func1 && r1._funcs[ 1 ].func === r1_func2 && r1._funcs[ 2 ].func === r1_func3, "r1 has been registered to the functions in the correct order." );
	
	strictEqual( r1_func1_val, undefined, "r1_func1_val is undefined." );
	strictEqual( r1_func2_val, undefined, "r1_func2_val is undefined." );
	strictEqual( r1_func3_val, undefined, "r1_func3_val is undefined.");
	
	ok( react( "x/=2" ), "x changed." );
	
	ok( order === 3, "Each bound function was only called once." );
	strictEqual( r1_func1_val, 0, "r1_func1 was evaluated first." );
	strictEqual( r1_func2_val, 1, "r1_func2 was evaluated second." );
	strictEqual( r1_func3_val, 2, "r1_func3 was evaluated third." );
	
	react( r1_func1, "~(", r1, ");", r1_func2, "~(", r1, ");", r1_func3, "~(", r1, ");" );
	
	ok( r1._funcs.length === 0, "All r1 has been unregistered from all functions." );
	
	react( "delete r1" );
} );

test( "call w/ return value: return value stored in a variable", function() {
	var sqrFunc = function( x ) { return x.valueOf()*x.valueOf() },
		rea = react.leak( "rea = 0" ),
		sqr = react.leak( "sqr = ", sqrFunc );
	
	ok( sqrFunc, "sqrFunc = function( x ) { return x.valueOf()*x.valueOf() }" );
	ok( sqr, "react( \"sqr = \", sqrFunc );" );
	
	ok( equivArr( react.leak( "rea = ", sqrFunc, "( x )" )._value, [ "(", sqrFunc, x ] ), "react( \"rea = \", sqrFunc, \"( x )\" )" );
	ok( objContent( rea._dep, [ x ] ), "react.leak( \"rea = \", sqrFunc, \"( x )\" )._dep" );
	
	ok( equivArr( react.leak( "rea = sqr(", 10, ")" )._value, [ "(", sqr, 10 ] ), "react( \"rea = sqr(\", 10, \")\" )" );
	ok( objContent( rea._dep, [ sqr ] ), "react.leak( \"rea = sqr(\", 10, \")\" )._dep" );
	
	ok( equivArr( react.leak( "rea = sqr( x )" )._value, [ "(", sqr, x ] ), "react( \"rea = sqr( x )\" )" );
	ok( objContent( rea._dep, [ sqr, x ] ), "react.leak( \"rea = sqr( x )\" )._dep" );
	debugger;
	react( sqrFunc, "~( x ); sqr~( 10 ); sqr~( x );" );
	
	react( "delete rea; delete sqr;" );
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
	strictEqual( react( opObj, "+=", 100 ), 106, "operator-assignment: react( opObj, \"+=\", 100 )" );
} );

test( "custom datatype", function() {
	//example custom datatype
	var Type = function( input ) {
		this.value = input;
	};
	
	Type.prototype = {
		value : null
	};
	
	ok( react( "Type = datatype", Type ), "react( \"Type = datatype\", Type )" );
	strictEqual( react( "Type( 1235813 )" ).value, 1235813, "non-reactive instance: react( \"Type( 1235813 )\" )" );
	
	strictEqual( react( "inst = Type( x+2 )" ).value, x.valueOf()+2, "reactive instance: react( \"inst = Type( x+2 )\" ).value" );
	strictEqual( react( "inst2 = Type( inst )" ).value, react( "inst" ), "reactive, depending instances: react( \"inst2 = Type( inst )\" ).value" );
	ok( react( "x += 1" ), "react( \"x += 1\" )" );
	strictEqual( react( "inst" ).value, x.valueOf()+2, "automatic update of reactive instance: react( \"inst\" ).value" );
	strictEqual( react( "inst2" ).value, react( "inst" ), "automatic update of depending reactive instance: react( \"inst2\" ).value" );
	
	//react( "Type~( x+2 ); Type~( inst );" );
	
	react( "delete inst2; delete inst;" );
} );

module( "Context sensitive variables" );

test( "simple function variable", function() {
	react( "ctxtVar = contextVariable", function( data ) {
			return ( this !== window ? "ctxt" : "" ) + ( data ? "data" : "" );
		} );
	
	ok( true, "context variable: react( \"ctxtVar = contextVariable\", function( data ) { return ( this !== window ? \"ctxt\" : \"\" ) + ( data ? \"data\" : \"\" ) } )" );
	
	strictEqual( react( "#ctxtVar" ), "", "react( \"#ctxtVar\" ) === \"\"" );
	strictEqual( react.context()( "#ctxtVar" ), "", "react.context()( \"#ctxtVar\" ) === \"\"" );
	strictEqual( react.context( {} )( "#ctxtVar" ), "ctxt", "react.context( {} )( \"#ctxtVar\" ) === \"ctxt\"" );
	strictEqual( react.context( {}, true )( "#ctxtVar" ), "ctxtdata", "react.context( {}, true )( \"#ctxtVar\" ) === \"ctxtdata\"" );
	strictEqual( react.context( null, true )( "#ctxtVar" ), "data", "react.context( null, true )( \"#ctxtVar\" ) === \"data\"" );
} );

test( "variable with value compound of literal and function variable", function() {
	react( "ctxtVar = contextVariable", function( data ) {
			return ( this !== window ? "ctxt" : "" ) + ( data ? "data" : "" );
		} ),
		rea = react.leak( "rea = 'r_'+ctxtVar" );
	
	ok( true, "context variable: react( \"ctxtVar = contextVariable\", function( data ) { return ( this !== window ? \"ctxt\" : \"\" ) + ( data ? \"data\" : \"\" ) } )" );
	ok ( rea, "var depending on a func var: rea = react.leak( \"rea = 'r_'+ctxtVar\" )" );
	
	strictEqual( react( "#rea" ), "r_", "react( \"#rea\" ) === \"r_\"" );
	strictEqual( react.context()( "#rea" ), "r_", "react.context()( \"#rea\" ) === \"r_\"" );
	strictEqual( react.context( {} )( "#rea" ), "r_ctxt", "react.context( {} )( \"#rea\" ) === \"r_ctxt\"" );
	strictEqual( react.context( {}, true )( "#rea" ), "r_ctxtdata", "react.context( {}, true )( \"#rea\" ) === \"r_ctxtdata\"" );
	strictEqual( react.context( null, true )( "#rea" ), "r_data", "react.context( null, true )( \"#rea\" ) === \"r_data\"" );
	
	ok( react( "rea -= ctxtVar" ), "react( \"rea -= ctxtVar\" )" );
	strictEqual( rea._ctxtEval, undefined, "rea is no longer a function variable." );
} );


module( "Where to put operator overloading?" );

/*
module( "react.eval" );

test( "evaluation without context", function() {
	var rct = react.leak( "no partOf", "x+t" ),
		ctxtVar  = react.leak( "ctxtVar = ", function( ctxt, data ) {
			return ctxt && data ? "ctxt+data" : ctxt ? "ctxt" : data ? "data" : "noCtxt";
		} ),
		evl = react.eval( "x+t" );
	
	ok( rct, "rct = react.leak( \"x+t\" )" );
	ok( ctxtVar, "func var: ctxtVar = react.leak( \"ctxtVar = \", function( ctxt, data ) { return ctxt && data ? \"ctxt+data\" : ctxt ? \"ctxt\" : data ? \"data\" : \"noCtxt\"; } )" );
	ok( evl !== undefined, "evl = react.eval( \"x+t\" )" );
	
	strictEqual( evl, rct.valueOf(), "evl === rct.valueOf()" );
	strictEqual( react.eval( "ctxtVar" ), "noCtxt", "react.eval( \"ctxtVar\" ) === \"noCtxt\"" );
	
	strictEqual( react.eval( "rea = x+t" ), x._value+t._value, "assignment: react.eval( \"rea = x+t\" )._value" );
} );

test( "evaluation within context", function() {
	var ctxtVar  = react.leak( "ctxtVar = ", function( ctxt, data ) {
			return ctxt && data ? "ctxt+data" : ctxt ? "ctxt" : data ? "data" : "noCtxt";
		} );
	
	ok( ctxtVar, "func var: ctxtVar = react.leak( \"ctxtVar = \", function( ctxt, data ) { return ctxt && data ? \"ctxt+data\" : ctxt ? \"ctxt\" : data ? \"data\" : \"noCtxt\"; } )" );
	
	strictEqual( react.eval.inCtxt( true, {}, "ctxtVar" ), "ctxt+data", "react.eval.inCtxt( true, {}, \"ctxtVar\" ) === \"ctxt+data\"" );
	strictEqual( react.eval.inCtxt( true, null, "ctxtVar" ), "ctxt", "react.eval.inCtxt( true, null, \"ctxtVar\" ) === \"ctxt\"" );
	strictEqual( react.eval.inCtxt( null, "ctxtVar" ), "noCtxt", "react.eval.inCtxt( null, \"ctxtVar\" ) === \"noCtxt\"" );
	raises( function() { react.eval.inCtxt( null, {}, "ctxtVar" ) }, "no context -> parsing from 2nd argument: react.eval.inCtxt( null, {}, \"ctxtVar\" ) -> exception" );
	raises( function() { react.eval.inCtxt( "ctxtVar" ) }, "nothing given at all: react.eval.inCtxt( \"ctxtVar\" ) -> exception" );
	ok( true, "besides custom datatypes, non-function variables do not care about context" );
} );

test( "assignment to variables", function() {
	
} );

test( "assignment to object properties", function() {
	var rea = react.leak( "rea = 5" ),
		obj = {};
	
	ok( rea, "rea = react.leak( \"rea = 5\" )" );
	ok( obj, "obj = {}" );
	ok( react( "p = 'prop'" ), "react( \"p = 'prop'\" )" );
	
	strictEqual( react.eval( obj, "[ p ] = 50+t" ), 51, "react.eval( obj, \".prop = 50\" )" );
	strictEqual( react.eval( obj, "[ p ]" ), 51, "react.eval( obj, \".prop\" )" );
	strictEqual( obj.prop, 51, "obj.prop === 50" );
	
	strictEqual( react.eval( obj, "[ p ] = rea" ), rea._value, "react.eval( obj, \".prop = rea\" )" );
	strictEqual( react.eval( obj, "[ p ]" ), rea._value, "react.eval( obj, \".prop\" )._value" );
	strictEqual( obj.prop, rea._value, "obj.prop === rea" );
	
	react( "delete rea; delete p;" );
} );

test( "function calls", function() {

} );


module( "react.Datatype" );

test( "non-reactive instantiation", function() {
	var withoutNew = datatype( "foo", false, 10 ),
		withNew = new datatype( "foo", false, 10 );
	
	ok( withoutNew, "withoutNew = datatype( \"foo\", false, 10 );" );
	ok( withoutNew instanceof datatype, "withoutNew is instance of datatype" );
	ok( !withoutNew._isReactive, "withoutNew is not reactive" );
	
	ok( withNew, "withNew = new datatype( \"foo\", false, 10 );" );
	ok( withNew instanceof datatype, "withNew is instance of datatype" );
	ok( !withNew._isReactive, "withNew is not reactive" );
} );

test( "reactive instantiation", function() {
	var	rdata1 = react.leak( "no partOf", "x+t" ),
		rdata2 = react.leak( "no partOf", "f" ),
		rea = datatype( rdata1, rdata2, 10 );
	
	ok( rea, "rea = datatype( react( \"x+t\" ), react( \"f\" ), 10 );" );
	ok( rea instanceof datatype, "rea is instance of datatype" );
	ok( rea._isReactive, "rea is reactive" );
	
	ok( objContent( rea._dep, [ rdata1, rdata2 ] ), "rea._dep" );
} );

test( "context sensitivity with default valueOf: basic data", function() {
	var def1 = defDatatype( "foo", false, 10 );
	
	ok( def1, "def1 = defDatatype( \"foo\", false, 10 )" );
	
	strictEqual( def1._evaled, null, "def1._evaled before .valueOf()" );
	strictEqual( def1._string, null, "def1._string before .toString()" );
	
	strictEqual( def1.valueOf(), undefined, "def1.valueOf()" );
	strictEqual( def1.toString(), "undefined", "def1.toString()" );
	
	strictEqual( def1._evaled, undefined, "def1._evaled after .valueOf()" );
	strictEqual( def1._string, "undefined", "def1._string after .toString()" );
} );

test( "context sensitivity with default valueOf: function data", function() {
	var def2 = defDatatype( function( ctxt ) { return ctxt ? "ctxt+foo" : "foo"; }, false, 10 );
	
	ok( def2, "def2 = defDatatype( function( ctxt ) { return ctxt ? \"ctxt+foo\" : \"foo\"; }, false, 10 )" );
	
	strictEqual( def2._evaled, null, "def2._evaled before .valueOf()" );
	strictEqual( def2._string, null, "def2._string before .toString()" );
	
	strictEqual( def2.valueOf(), undefined, "def2.valueOf()" );
	strictEqual( def2.toString(), "undefined", "def2.toString()" );
	
	strictEqual( def2._evaled, undefined, "def2._evaled after .valueOf()" );
	strictEqual( def2._string, "undefined", "def2._string after .toString()" );
} );

test( "context sensitivity with default valueOf: reactive func var data", function() {
	var ctxtVar  = react.leak( "ctxtVar = ", function( ctxt, data ) {
			return ctxt && data ? "ctxt+data" : ctxt ? "ctxt" : data ? "data" : "noCtxt";
		} );
	
	ok( ctxtVar, "func var: ctxtVar = react.leak( \"ctxtVar = \", function( ctxt, data ) { return ctxt && data ? \"ctxt+data\" : ctxt ? \"ctxt\" : data ? \"data\" : \"noCtxt\"; } )" );
	
	var def3 = defDatatype( ctxtVar, false, 10 );
	
	ok( def3, "def3 = defDatatype( ctxtVar, false, 10 )" );
	
	strictEqual( def3._evaled, null, "def3._evaled before .valueOf()" );
	strictEqual( def3._string, null, "def3._string before .toString()" );
	
	strictEqual( def3.valueOf(), undefined, "def3.valueOf()" );
	strictEqual( def3.toString(), "undefined", "def3.toString()" );
	
	strictEqual( def3._evaled, undefined, "def3._evaled after .valueOf()" );
	strictEqual( def3._string, "undefined", "def3._string after .toString()" );
} );

test( "context sensitivity with custom, no-context valueOf: basic data", function() {
	var noCtxt1 = datatype( "foo", false, 10 );
	
	ok( noCtxt1, "noCtxt1 = datatype( \"foo\", false, 10 )" );
	
	strictEqual( noCtxt1._evaled, null, "noCtxt1._evaled before .valueOf()" );
	strictEqual( noCtxt1._string, null, "noCtxt1._string before .toString()" );
	
	strictEqual( noCtxt1.valueOf(), "foofalse10", "noCtxt1.valueOf()" );
	strictEqual( noCtxt1.valueOf( true ), "foofalse10", "noCtxt1.valueOf( true )" );
	strictEqual( noCtxt1.toString(), "foo", "noCtxt1.toString()" );
	strictEqual( noCtxt1.toString( true ), "foo", "noCtxt1.toString( true )" );
	
	strictEqual( noCtxt1._evaled, "foofalse10", "noCtxt1._evaled after .valueOf()" );
	strictEqual( noCtxt1._string, "foo", "noCtxt1._string after .toString()" );
} );

test( "context sensitivity with custom, no-context valueOf: function data", function() {
	var noCtxt2 = datatype( function( ctxt ) { return ctxt ? "ctxt+foo" : "foo"; }, false, 10 );
	
	ok( noCtxt2, "noCtxt2 = datatype( function( ctxt ) { return ctxt ? \"ctxt+foo\" : \"foo\"; }, false, 10 )" );
	
	strictEqual( noCtxt2._evaled, null, "noCtxt2._evaled before .valueOf()" );
	strictEqual( noCtxt2._string, null, "noCtxt2._string before .toString()" );
	
	strictEqual( noCtxt2.valueOf(), "foofalse10", "noCtxt2.valueOf()" );
	strictEqual( noCtxt2.valueOf( true ), "foofalse10", "noCtxt2.valueOf( true )" );
	strictEqual( noCtxt2.toString(), "foo", "noCtxt2.toString()" );
	strictEqual( noCtxt2.toString( true ), "foo", "noCtxt2.toString( true )" );
	
	strictEqual( noCtxt2._evaled , "foofalse10", "noCtxt2._evaled after .valueOf()" );
	strictEqual( noCtxt2._string, "foo", "noCtxt2._string after .toString()" );
} );

test( "context sensitivity with custom, no-context valueOf: reactive func var data", function() {
	var ctxtVar  = react.leak( "ctxtVar = ", function( ctxt, data ) {
			return ctxt && data ? "ctxt+data" : ctxt ? "ctxt" : data ? "data" : "noCtxt";
		} );
	
	ok( ctxtVar, "func var: ctxtVar = react.leak( \"ctxtVar = \", function( ctxt, data ) { return ctxt && data ? \"ctxt+data\" : ctxt ? \"ctxt\" : data ? \"data\" : \"noCtxt\"; } )" );
	
	var noCtxt3 = datatype( ctxtVar, false, 10 );
	
	ok( noCtxt3, "noCtxt3 = datatype( ctxtVar, false, 10 )" );
	
	strictEqual( noCtxt3._evaled, null, "noCtxt3._evaled before .valueOf()" );
	strictEqual( noCtxt3._string, null, "noCtxt3._string before .toString()" );
	
	strictEqual( noCtxt3.valueOf(), "noCtxtfalse10", "noCtxt3.valueOf()" );
	strictEqual( noCtxt3.valueOf( true ), "noCtxtfalse10", "noCtxt3.valueOf( true )" );
	strictEqual( noCtxt3.toString(), "noCtxt", "noCtxt3.toString()" );
	strictEqual( noCtxt3.toString( true ), "noCtxt", "noCtxt3.toString( true )" );
	
	strictEqual( noCtxt3._evaled , "noCtxtfalse10", "noCtxt3._evaled after .valueOf()" );
	strictEqual( noCtxt3._string, "noCtxt", "noCtxt3._string after .toString()" );
} );

test( "context sensitivity with custom, context valueOf: basic data", function() {
	var ctxt1 = ctxtDatatype( "foo", false, 10 );
	
	ok( ctxt1, "ctxt1 = ctxtDatatype( \"foo\", false, 10 )" );
	
	strictEqual( ctxt1._evaled, null, "ctxt1._evaled before .valueOf()" );
	strictEqual( ctxt1._string, null, "ctxt1._string before .toString()" );
	
	strictEqual( ctxt1.valueOf(), "foofalse10", "ctxt1.valueOf()" );
	strictEqual( ctxt1.valueOf( true ), "typeCtxt+foofalse10", "ctxt1.valueOf( true )" );
	strictEqual( ctxt1.toString(), "foo", "ctxt1.toString()" );
	strictEqual( ctxt1.toString( true ), "typeCtxt+foo", "ctxt1.toString( true )" );
	
	strictEqual( ctxt1._evaled , null, "ctxt1._evaled after .valueOf()" );
	strictEqual( ctxt1._string , null, "ctxt1._string after .toString()" );
} );

test( "context sensitivity with custom, context valueOf: function data", function() {
	var ctxt2 = ctxtDatatype( function( ctxt ) { return ctxt ? "ctxt+foo" : "foo"; }, false, 10 );
	
	ok( ctxt2, "ctxt2 = ctxtDatatype( function( ctxt ) { return ctxt ? \"ctxt+foo\" : \"foo\"; }, false, 10 )" );
	
	strictEqual( ctxt2._evaled, null, "ctxt2._evaled before .valueOf()" );
	strictEqual( ctxt2._string, null, "ctxt2._string before .toString()" );
	
	strictEqual( ctxt2.valueOf(), "foofalse10", "ctxt2.valueOf()" );
	strictEqual( ctxt2.valueOf( true ), "typeCtxt+ctxt+foofalse10", "ctxt2.valueOf( true )" );
	strictEqual( ctxt2.toString(), "foo", "ctxt2.toString()" );
	strictEqual( ctxt2.toString( true ), "typeCtxt+ctxt+foo", "ctxt2.toString( true )" );
	
	strictEqual( ctxt2._evaled , null, "ctxt2._evaled after .valueOf()" );
	strictEqual( ctxt2._string , null, "ctxt2._string after .toString()" );
} );

test( "context sensitivity with custom, context valueOf: reactive func var data", function() {
	var ctxtVar  = react.leak( "ctxtVar = ", function( ctxt, data ) {
			return ctxt && data ? "ctxt+data" : ctxt ? "ctxt" : data ? "data" : "noCtxt";
		} );
	
	ok( ctxtVar, "func var: ctxtVar = react.leak( \"ctxtVar = \", function( ctxt, data ) { return ctxt && data ? \"ctxt+data\" : ctxt ? \"ctxt\" : data ? \"data\" : \"noCtxt\"; } )" );
	
	var ctxt3 = ctxtDatatype( ctxtVar, false, 10 );
	
	ok( ctxt3, "ctxt3 = ctxtDatatype( ctxtVar, false, 10 )" );
	
	strictEqual( ctxt3._evaled, null, "ctxt3._evaled before .valueOf()" );
	strictEqual( ctxt3._string, null, "ctxt3._string before .toString()" );
	
	strictEqual( ctxt3.valueOf(), "noCtxtfalse10", "ctxt3.valueOf()" );
	strictEqual( ctxt3.valueOf( true ), "typeCtxt+ctxtfalse10", "ctxt3.valueOf( true )" );
	strictEqual( ctxt3.toString(), "noCtxt", "ctxt3.toString()" );
	strictEqual( ctxt3.toString( true ), "typeCtxt+ctxt", "ctxt3.toString( true )" );
	
	strictEqual( ctxt3._evaled , null, "ctxt3._evaled after .valueOf()" );
	strictEqual( ctxt3._string , null, "ctxt3._string after .toString()" );
} );

test( "operator overloading", function() {
	var obj1 = datatype( "10", true, 20 ),
		obj2 = datatype( "5",  true, 10 );
	
	ok( obj1, "obj1 = datatype( \"10\", true, 20 )" );
	ok( obj2, "obj2 = datatype( \"5\",  true, 10 )" );
	
	strictEqual( react( obj1, "+", obj2 ), 30,  "overloaded, stand-alone operator: react( obj1, \"+\", obj2 )" );
	
	raises( function() { react( "!", obj1 ); }, "not overloaded, stand-alone prefix operator: react( \"!\", obj1 ) -> exception" );
	strictEqual(
		( function() {
			try {
				return react( "!", obj1 );
			} catch( e ) {
				return e.message;
			}
		}() ),
		"react.js | Operator prefix! not defined for operand.",
		"react( \"!\", obj1 )"
	);
	
	raises( function() { react( obj1, "*", obj2 ); }, "not overloaded, stand-alone infix operator: react( obj1, \"*\", obj2 ) -> exception" );
	strictEqual(
		( function() {
			try {
				return react( obj1, "*", obj2 );
			} catch( e ) {
				return e.message;
			}
		}() ),
		"react.js | Operator infix* not defined for operands.",
		"react( obj1, \"*\", obj2 )"
	);
	
	raises( function() { react( obj1, "-", obj2 ); }, "not overloaded, composed infix operator w\o needed operator * defined: react( obj1, \"-\", obj2 ) -> exception" );
	strictEqual(
		( function() {
			try {
				return react( obj1, "-", obj2 );
			} catch( e ) {
				return e.message;
			}
		}() ),
		"react.js | Operator infix* not defined for operands.",
		"react( obj1, \"-\", obj2 )"
	);
	
	raises( function() { react( "-", obj1 ); }, "not overloaded, composed prefix operator w\o needed operator * defined: react( \"-\", obj1 ) -> exception" );
	strictEqual(
		( function() {
			try {
				return react( "-", obj1 );
			} catch( e ) {
				return e.message;
			}
		}() ),
		"react.js | Operator infix* not defined for operands.",
		"react( \"-\", obj1 )"
	);
} );
*/


module( "react.Reactive" );
//TODO: add/remove dependencies

module( "Custom parser" );
//TODO


//react( "clean" );