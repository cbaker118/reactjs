/* 
 * 
 * Copyright (c) 2011 Christopher Aue
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */

//react.js extends Javascript in the following ways:
//- Create objects, overload their operators and use them within react().
//- Save data in variables inside of react() and combine them with operators
//  without accessing the stored value before evaluation (reactive programming)

( function( undefined ) {
	if ( typeof Object.create !== "function" )
		Object.create = function( o ) {
			var F = function() {};
			F.prototype = o;
			return new F;
		};
	
	var equiv = function( arr1, arr2 ) {
			if ( arr1 === arr2 )
				return true;
			
			if ( arr2 && arr2._value &&
				 arr1 && arr1._value && arr1._value.constructor === Array )
				return equiv( arr1._value, arr2._value ) ? true : false;
			
			if ( !arr1 || arr1.constructor !== Array || !arr2 || arr2.constructor !== Array ||
				 arr1.length !== arr2.length)
				return false;
			
			var i = arr1.length;
			while ( i-- ) {
				if ( arr1[ i ] && arr1[ i ].constructor === Array ) {
					if ( equiv( arr1[ i ], arr2[ i ] ) )
						continue;
					else
						return false;
				} else if ( arr2[ i ] && arr2[ i ]._value &&
							arr1[ i ] && arr1[ i ]._value && arr1[ i ]._value.constructor === Array ) {
					if ( equiv( arr1[ i ]._value, arr2[ i ]._value ) )
						continue;
					else
						return false;
				} else if ( arr1[ i ] !== arr2[ i ] ) {
					return false;
				}
			}
			
			return true;
		},
		each = function( obj, func ) {
			var id, len;
			
			if ( obj.constructor === Array ) {
				for ( id = 0, len = obj.length; id < len; id++ )
					func( id, obj[ id ] );
			
			} else {
				for ( id in obj )
					if ( obj.hasOwnProperty( id ) )
						func( id, obj[ id ] );
			}
		},
		isEmptyObj = function( obj ) {
			if ( typeof obj !== "object" || obj === null || obj.constructor === Array )
				return false;
			
			for ( var key in obj )
				if ( key in obj )
					return false;
			
			return true;
		},
		countProps = function( obj, own ) {
			var n = 0;
			
			for ( var key in obj )
				if ( own ? obj.hasOwnProperty( key ) : key in obj )
					n++;
			
			return n;
		};
	
	var error = function( msg ) {
			throw new Error( "react.js | " + msg );
		};
	
	var Interpreter = ( function() {
			//streamlined pratt parser - derived from http://javascript.crockford.com/tdop/tdop.html
			//expression evaluation directly included into the parse process
			
			var dontTrack = false;
			
			var DepObj = function(){};
			DepObj.prototype = {};
			
			//token parsing and evaluation
			var operators = {},		//table holding defined operators

				itself = function( expr ) {
					expr.o[ expr.p ] = this;
					return expr;
				},
				
				nudUndef = function() {
					error( "Token " + this.value + " is undefined." );
				},
				
				ledUndef = function ( left ) {
					error( "Token \"" + this.value + "\" is no infix operator." );
				},
				
				opType = {
					infix : function( s, bp, led ) {
						s.led = led || function ( expr ) {
							expr.p in expr.o && ( this.first = expr.o[ expr.p ] );
							//this.second = undefined;
							this.ledEval = operators[ this.id ].ledEval;
							expr.o[ expr.p ] = this;
							
							return {
								o : this,
								p : "second",
								rbp : bp,
								end : null,
								parent : expr,
								prevToken : expr.o.id
							};
						};
						return s;
					},
					
					infixr : function( s, bp, led ) {
						s.led = led || function ( expr ) {
							expr.p in expr.o && ( this.first = expr.o[ expr.p ] );
							//this.second = undefined;
							this.ledEval = operators[ this.id ].ledEval;
							expr.o[ expr.p ] = this;
							
							return {
								o : this,
								p : "second",
								rbp : bp-2,
								end : null,
								parent : expr,
								prevToken : expr.o.id
							};
						};
						return s;
					},

					prefix : function( s, bp, nud ) {
						s.nud = nud || function ( expr ) {
							//this.first = undefined;
							this.nudEval = operators[ this.id ].nudEval;
							expr.o[ expr.p ] = this;
							
							return {
								o : this,
								p : "first",
								rbp : bp,
								end : null,
								parent : expr,
								prevToken : expr.o.id
							};
						};
						return s;
					},
					
					assignment : function( s, bp, led ) {
						return opType.infixr( s, bp, led || function ( expr ) {
							expr.p in expr.o && ( this.first = expr.o[ expr.p ] );
							//this.second = undefined;
							this.assignment = true;
							this.ledEval = operators[ this.id ].ledEval;
							expr.o[ expr.p ] = this; 
							
							if ( this.first )
								assignTo = this.first.id === "(id)" ? this.first.value : this.first._key;
							
							return {
								o : this,
								p : "second",
								rbp : bp-2,
								end : null,
								parent : expr,
								prevToken : expr.o.id
							};
						} );
					},
					
					"delete" : function( s, bp, nud ) {
						return opType.prefix( s, bp, nud || function ( expr ) {
							//this.first = undefined;
							this.assignment = true;
							this.nudEval = operators[ this.id ].nudEval;
							expr.o[ expr.p ] = this;
							
							return {
								o : this,
								p : "first",
								rbp : this.lbp,
								end : null,
								parent : expr,
								prevToken : expr.o.id
							};
						} );
					},
					
					call : function( s, bp, led ) {
						return opType.infix( s, bp, led || function( expr ) {
							expr.p in expr.o && ( this.first = expr.o[ expr.p ] );
							//this.second = undefined;
							this.call = true;
							this.ledEval = operators[ this.id ].ledEval;
							expr.o[ expr.p ] = this;
							
							return {
								o : this,
								p : "second",
								rbp : 0,
								end : ")",
								parent : expr,
								prevToken : expr.o.id
							};
						} );
					}
				},
			
				operator = function( id, type, bp, interpret, eval, composed ) {
					var op = operators[ id ],
						stdFunc;
					
					bp = bp || 0;
					if ( !op ) {
						op = {};
						op.id = op.value = id;
						op.lbp = bp;
						operators[ id ] = op;
					}
					
					if ( type ) 
						opType[ type ]( op, bp, interpret );
					
					if ( eval ) {
						if ( type === "prefix" || type === "delete" ) {
							id = "prefix"+id;
							stdFunc = typeof eval === "function" ?
											eval :
											function( operand ) {
												var type = typeof operand;
												
												type = !operand ? 
														"lit" :
													operand instanceof Expression && !operand._inCtxt ?
														"arr" :
													operand instanceof Reactive || ( operand._isFunc && delete operand._isFunc ) ?
														"ref" :
														"lit";
												
												return op.nudEval[ type ].apply( this, arguments );
											};
							
							if ( type === "prefix" )
								op.nudEval = function( operand, undef, interpreter ) {
									//check for overloaded operators
									if ( operand && !( operand instanceof Variable ) && operand[ id ] )
										return operand[ id ].call( operand );
									
									//standard operator behavior
									return stdFunc.call( this, operand, interpreter );
								};
							else
								op.nudEval = function( operand, undef, interpreter ) {
									//standard operator behavior
									return stdFunc.call( this, operand, interpreter );
								};
							
							//append lit, ref and arr functions to base eval function
							if ( typeof eval === "object" )
								each( eval, function( key, value ) { op.nudEval[ key ] = value; } );
						
						} else {
							id = "infix"+id;
							stdFunc = typeof eval === "function" ?
											eval :
											function( left, right ) {
												var typeL, typeR;
												
												typeL = !left ? 
														"lit" :
													left instanceof Expression && !left._inCtxt ?
														"arr" :
													left instanceof Reactive || ( left._isFunc && delete left._isFunc) ?
														"ref" :
														"lit";
												
												typeR = !right ? 
														"lit" :
													right instanceof Expression && !right._inCtxt ?
														"arr" :
													right instanceof Reactive || ( right._isFunc && delete right._isFunc) ?
														"ref" :
														"lit";
												
												return op.ledEval[ typeL ][ typeR ].apply( this, arguments );
											};
							
							if ( type !== "assignment" )
								op.ledEval = function( left, right, interpreter ) {
									//check for overloaded operators
									if ( left && !(left instanceof Variable) && right && !(right instanceof Variable) ) {
										if ( left[ id ] )
											return left[ id ].call( left, right );
										
										if ( right[ id ] )
											return right[ id ].call( right, left, true );
									}
									
									//standard operator behavior
									return stdFunc.call( this, left, right, interpreter );
								};
							else
								op.ledEval = stdFunc;

							
							//append lit, ref and arr functions to base eval function
							if ( typeof eval === "object" )
								each( eval, function( key, value ) { op.ledEval[ key ] = value; } );
						}
					}
					
					return op;
				};
			
			//define operators
			var opTypes = [ "lit", "ref", "arr" ];
			operator( ";" );
			operator( ")" );		
			operator( "]" );
			operator( "}" );
			
			operator( "clean", "prefix", 0, null, function( undef, interpreter ) {
				return interpreter.nameTable.clean();
			} );
			
			operator( "cleanExcept", "prefix", 4, null, function( vars, interpreter ) {
				if ( vars === undefined )
					return interpreter.nameTable.clean();
				
				if ( !(vars instanceof Variable) && ( !vars instanceof Expression || vars._value.op !== "," ) )
					error( "'cleanExcept' has to be followed by a list of one or more variable names" );
				
				var varObj = {};
				if ( vars instanceof Expression ) {
					var i = vars._value.length;
					
					while ( i-- ) {
						if ( vars._value[ i ] )
							varObj[ vars._value[ i ]._key ] = vars._value[ i ];
					}
				
				} else if ( vars ) {
					varObj[ vars._key ] = vars;
				}
				
				return interpreter.nameTable.clean( varObj );
			} );
			
			operator( ",", "infix", 5, null, ( function() {
					var ret = {},
						func = function( left, right ) {
							return Expression( ",", [ left, right ] );
						},
						funcArr = function( left, right ) {
							if ( right instanceof Expression && right._value.op === "," ) {
								right.unshift( left );
								
								return right;
							}
							
							return Expression( ",", [ left, right ] );
						},
						arrFunc = function( left, right ) {
							if ( left._value.op === "," ) {
								if ( right instanceof Expression && right._value.op === "," ) {
									right.splice( 0, 0, left._value.length, 0 );
									left.splice.apply( left, right );
								} else {
									left.push( right );
								}
								
								return left;
							
							} else if ( right instanceof Expression && right._value.op === "," ) {
								right.unshift( left );
								
								return right;
							}
							
							return Expression( ",", [ left, right ] );
						};
					
					each( [ "lit", "ref" ], function( idxL, typeL ) {
						ret[ typeL ] = {};
						each( [ "lit", "ref" ], function( idxR, typeR ) {
							ret[ typeL ][ typeR ] = func;
						} );
						ret[ typeL ].arr = funcArr;
					} );
					
					ret.arr = {};
					each( [ "lit", "ref", "arr" ], function( idx, type ) {
						ret.arr[ type ] = arrFunc;
					} );
					
					return ret;
				}() )
			);
			
			operator( "=", "assignment", 10, null, function( v, val, interpreter ) {
				var isPropAccess = v instanceof Expression && v._value.op === ".",
					isVar  = !isPropAccess && v instanceof Variable,
					isPath = !isVar && v instanceof PropPath;
				
				if ( !v || ( !isVar && !isPath && v.id !== "(id)" && !isPropAccess ) )
					error( "Bad lvalue: no variable or object property." );
				
				assignTo = null;	//extern variable to keep track of assignments
				
				if ( isPropAccess )
					return PropPath( v, false, val, false )._evaled.value;
				else if ( isPath )
					return v.set( false, val, false )._evaled.value;
				
				return interpreter.nameTable.set( v._key || v.value, val );
			} );
			
			operator( "(op=)", "infixr", 10, function( expr ) {
					var op, token;
					
					op = operators[ "=" ];
					token = {
						nud 	: op.nud || nudUndef,
						led 	: op.led || ledUndef,
						ledEval : op.ledEval,
						lbp 	: op.lbp,
						value 	: "=",
						id 		: "=",
						arity 	: "operator"
					};
					expr = token.led( expr );
					"first" in expr.o && ( expr.o.second = expr.o.first );
					
					op = operators[ this.value ];
					token = {
						nud 	: op.nud || nudUndef,
						led 	: op.led || ledUndef,
						ledEval : op.ledEval,
						lbp 	: op.lbp,
						value 	: this.value,
						id 		: this.value,
						arity 	: "operator"
					};
					expr = token.led( expr );
					
					op = operators[ "(" ];
					token = {
						nud 	: op.nud || nudUndef,
						led 	: op.led || ledUndef,
						nudEval : op.nudEval,
						lbp 	: op.lbp,
						value 	: "(",
						id 		: "(",
						arity 	: "operator"
					};
					expr = token.nud( expr );
					expr.end = expr.parent.end;
					expr.rbp = 10;
					
					return expr;
				},
				null
			);
			
			operator( "(op=)", "prefix", 10, function( expr ) {
					var op, token;
					
					if ( this.value === "(" ) {
						op = operators[ this.value ];
						token = {
							nud 	: op.nud || nudUndef,
							led 	: op.led || ledUndef,
							nudEval : op.nudEval,
							lbp 	: op.lbp,
							value 	: this.value,
							id 		: this.value,
							arity 	: "operator"
						};
						expr = token.nud( expr );
					}
					
					op = operators[ "=" ];
					token = {
						nud 	: op.nud || nudUndef,
						led 	: op.led || ledUndef,
						ledEval : op.ledEval,
						lbp 	: op.lbp,
						value 	: "=",
						id 		: "=",
						arity 	: "operator"
					};
					expr = token.led( expr );
					"first" in expr.o && ( expr.o.second = expr.o.first );
					
					if ( this.value !== "(" ) {
						op = operators[ this.value ];
						token = {
							nud 	: op.nud || nudUndef,
							led 	: op.led || ledUndef,
							nudEval : op.nudEval,
							lbp 	: op.lbp,
							value 	: this.value,
							id 		: this.value,
							arity 	: "operator"
						};
						expr = token.nud( expr );
					}
					
					return expr;
				},
				null
			);
			
			operator( "~=", "assignment", 10, null, function( path, val ) {
				var isPath = path instanceof PropPath,
					isPropAccess = !isPath && path instanceof Expression && path._value.op === ".";
				
				if ( !path || ( !isPropAccess && !isPath ) )
					error( "Bad lvalue: no object property." );
				
				if ( isPropAccess )
					return PropPath( path, true, val, false )._evaled.value;
				else 
					return path.set( true, val, false )._evaled.value;
			} );
			
			operator( "?", "infix", 20, null, ( function() {
					var ret = {};
					
					//choice is always an array
					ret.lit = {};
					ret.lit.arr = function( cond, choice ) {
						return cond ? choice._value[ 0 ] : choice._value[ 1 ];
					};
					
					ret.ref = {};
					ret.arr = {};
					ret.ref.arr = ret.arr.arr = function( cond, choice ) {
						return Expression( "?", [ cond, choice ] );
					};
					
					return ret;
				}() )
			);
			
			operator( ":", "infixr", 21, null, ( function() {
					var ret = {},
						
						func = function( onTrue, onFalse ) {
							return Expression( ":", [ onTrue, onFalse ] );
						};
					
					each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
						ret[ typeL ] = {};
						each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
							ret[ typeL ][ typeR ] = func;
						} );
					} );
					
					return ret;
				}() )
			);
			
			each(
				{
					"||" : {
						bp : 30,
						litlit : function( lit1, lit2 ) {
							return lit1 || lit2;
						},
						litref : function( left, right ) {
							if ( left )
								return left;
							
							return Expression( op, [ left, right ] );
						},
						litarr : function( left, right ) {
							if ( left )
								return left;
							
							return Expression( op, [ left, right ] );
						}
					},
					"&&" : {
						bp : 30,
						litlit : function( lit1, lit2 ) {
							return lit1 && lit2;
						},
						litref : function( left, right ) {
							if ( left )
								return right;
							
							return Expression( op, [ left, right ] );
						},
						litarr : function( left, right ) {
							if ( left )
								return right;
							
							return Expression( op, [ left, right ] );
						}
					}
				},
				function( op, opProps ) {
					operator( op, "infixr", opProps.bp, null, ( function() {
						var ret = {},
							
							compare = function( left, right ) {
								return Expression( op, [ left, right ] );
							},
							
							compareArr = function( left, right ) {
								if ( left instanceof Expression && left._value.op === op ) {
									if ( right instanceof Expression && right._value.op === op ) {
										//reuse right array
										right.unshift( left._value.length, 0 );
										
										//-> left.splice( left._value.length, 0, right[ 1 ], right[ 2 ], ... )
										Array.prototype.splice.apply( left._value, right._value );
									
									} else {
										left.push( right );
									}
									
									return left;
								
								} else if ( right instanceof Expression && right._value.op === op ) {
									right.unshift( left );
									
									return right;
								
								} else {
									return Expression( op, [ left, right ] );
								}
							};
						
						each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
							ret[ typeL ] = {};
							each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
								if ( opProps[ typeL + typeR ] )
									ret[ typeL ][ typeR ] = opProps[ typeL + typeR ];
								
								else if ( typeL !== "arr" && typeR !== "arr" )
									ret[ typeL ][ typeR ] = compare;
								
								else
									ret[ typeL ][ typeR ] = compareArr;
							} );
						} );
						
						return ret;
					}() ) );
				}
			);
			
			each(
				{
					"==" : {
						bp : 40,
						litlit : function( lit1, lit2 ) {
							return lit1 == lit2;
						}
					},
					"===" : {
						bp : 40,
						litlit : function( lit1, lit2 ) {
							return lit1 === lit2;
						}
					},
					"<" : {
						bp : 50,
						litlit : function( lit1, lit2 ) {
							return lit1 < lit2;
						}
					},
					">" : {
						bp : 50,
						litlit : function( lit1, lit2 ) {
							return lit1 > lit2;
						}
					}
				},
				function( op, opProps ) {
					operator( op, "infixr", opProps.bp, null, ( function() {
						var ret = {};
						
						each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
							ret[ typeL ] = {};
							each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
								ret[ typeL ][ typeR ] = opProps[ typeL + typeR ] || function( left, right ) {
									return Expression( op, [ left, right ] );
								};
							} );
						} );
						
						return ret;
					}() ) );
				}
			);
			
			operator( "!=", "infixr", 40, null, function( left, right ) {
				return operators[ "!" ].nudEval.call( this, operators[ "==" ].ledEval.call( this, left, right ) );
			}, true );
			
			operator( "!==", "infixr", 40, null, function( left, right ) {
				return operators[ "!" ].nudEval.call( this, operators[ "===" ].ledEval.call( this, left, right ) );
			}, true );
			
			operator( "<=", "infixr", 50, null, function( left, right ) {
				return operators[ "||" ].ledEval.call( this, operators[ "<" ].ledEval.call( this, left, right ), operators[ "==" ].ledEval.call( this, left, right ) );
			}, true );
			
			operator( ">=", "infixr", 50, null, function( left, right ) {
				return operators[ "||" ].ledEval.call( this, operators[ ">" ].ledEval.call( this, left, right ), operators[ "==" ].ledEval.call( this, left, right ) );
			}, true );
			
			each(
				{
					"in" : function( left, right ) {
						return left in right;
					},
					"instanceof" : function( left, right ) {
						return left instanceof right;
					}
				},
				function( op, litlit ) {
					operator( op, "infixr", 50, null, ( function() {
						var ret = {},
							
							func = function( left, right ) {
								return Expression( op, [ left, right ] );
							};
						
						each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
							ret[ typeL ] = {};
							each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
								ret[ typeL ][ typeR ] = func;
							} );
						} );
						
						ret.lit.lit = litlit;
						
						return ret;
					}() ) );
				}
			);
			
			operator( "+", "infix", 60, null, ( function() {
				var ret = {},
					
					factorOut = function( fst, snd ) {
						var shared = 1,
							base1, base2,
							exp1, exp2;
						
						if ( fst instanceof Expression && fst._value.op === "^" && fst._value.length > 1 ) {
							base1 = fst._value[ 0 ];
							exp1  = fst._value.length > 2 ? ( fst.shift(), fst ) : fst._value[ 1 ];
						} else {
							base1 = fst;
							exp1  = 1;
						}
						
						if ( snd instanceof Expression && snd._value.op === "^" && snd._value.length > 1 ) {
							base2 = snd._value[ 0 ];
							exp2  = snd._value.length > 2 ? ( snd.shift(), snd ) : snd._value[ 1 ];
						} else {
							base2 = snd;
							exp2  = 1;
						}
						
						if ( base1 === base2 && typeof base1 !== "number" && typeof base2 !== "number" ) {
							if ( exp1 === exp2 ) {
								shared = fst;
								fst = snd = 1;
							} else if ( typeof exp1 === "number" && typeof exp2 === "number" &&
										( ( exp1 < 0 && exp2 < 0 ) || ( exp1 > 0 && exp2 > 0 ) ) ) {
								var tmp = Math.abs( exp1 ) < Math.abs( exp2 ) ? exp1 : exp2;
								shared = tmp === 1 ? base1 : Expression( "^", [ base1, tmp ] );
								tmp = operators[ "^" ].ledEval.call( this, shared, -1 );
								fst = operators[ "*" ].ledEval.call( this, fst, tmp );
								snd = operators[ "*" ].ledEval.call( this, snd, tmp );
							}
						} // else no shared factor, return input values
						
						return {
							shared : shared,
							fst : fst,
							snd : snd
						};
					},
					
					factorOutProducts = function( fst, snd ) {
						var res,
							shared = {
								front : 1,
								back  : 1
							},
							sel = {
								fst : fst,
								snd : snd
							},
							idx = {
								fst : fst !== undefined && typeof fst._value[ 0 ] === "number" ? 1 : 0,
								snd : snd !== undefined && typeof snd._value[ 0 ] === "number" ? 1 : 0
							}
						
						//gather shared factors from front and back
						for ( var dir in shared ) {
							while ( sel.fst !== 1 && sel.snd !== 1 ) {
								res = factorOut.call( this,
									( sel.fst && sel.fst._value && sel.fst._value.op === "*" && sel.fst._value.length > 1 && 
									  sel.fst._value[ dir == "front" ? idx.fst : sel.fst._value.length-1 ]
									) || sel.fst,
									( sel.snd && sel.snd._value && sel.snd._value.op === "*" && sel.snd._value.length > 1 && 
									  sel.snd._value[ dir == "front"  ? idx.snd : sel.snd._value.length-1 ]
									) || sel.snd
								);
								
								if ( res.shared === 1 )
									break;
								
								//add shared factor to output
								if ( shared[ dir ] === 1 ) {
									shared[ dir ] = res.shared;
								
								} else {
									if ( !(shared[ dir ] instanceof Expression) )
										shared[ dir ] = Expression( "*", [ shared[ dir ] ] );
									
									shared[ dir ].push( res.shared );
								}
								
								//reorganize fst/snd
								for ( var key in sel ) {
									if ( sel[ key ] && sel[ key ]._value.op === "*" && sel[ key ]._value.length > 1 ) {
										if ( res[ key ] !== 1 ) {
											sel[ key ]._value[ dir == "front" ? idx[ key ] : sel[ key ]._value.length-1 ] = res[ key ];
										
										} else if ( sel[ key ]._value.length > 2 ) {
											if ( dir == "front" )
												sel[ key ].splice( idx[ key ], 1 );
											else
												sel[ key ].pop();
										
										} else { // sel[ key ]._value.length === 2
											sel[ key ] = sel[ key ]._value[ dir == "front" ? ( idx[ key ] === 1 ? 0 : 1 ) : 0 ];
										}
									
									} else {
										sel[ key ] = res[ key ];
									}
								}
							}
						}
						
						return {
							front : shared.front,
							back  : shared.back,
							fst   : sel.fst,
							snd   : sel.snd
						};
					},
				
					addSums = function( fst, snd ) {
						var res,
							fst_sel, snd_sel,
							fst_lit, snd_lit,
							fst_num, snd_num,
							fst_idx, snd_idx,
							fst_len, snd_len,
							fst_isOpArray, snd_isOpArray;
						
						snd_isOpArray = snd && snd._value && snd._value.op === "+" && snd._value.length > 1;
						snd_len = ( snd_isOpArray && snd._value.length ) || 1;
						snd_idx = 0;
						
						fst_isOpArray = fst && fst._value && fst._value.op === "+" && fst._value.length > 1;
						fst_len = ( fst_isOpArray && fst._value.length ) || 1;
						
						SNDLOOP : while ( snd_idx < snd_len && snd_sel !== snd ) {
							snd_sel = snd_isOpArray ? snd._value[ snd_idx++ ] : snd;
							snd_lit = typeof snd_sel;
							snd_num = snd_lit === "number";
							snd_lit = snd_num || snd_lit === "string";
							
							//do not factor out, if we are dealing with two
							//opArrays or one is opArray and the other a ref
							if ( ( !fst_isOpArray && snd_sel !== fst ) || snd_num || ( !snd_isOpArray && snd instanceof Expression ) ) {
								fst_idx = fst_len;
								while ( fst_idx >= 0 && fst_sel !== fst ) {
									fst_sel = fst_isOpArray ? fst._value[ --fst_idx ] : fst;
									fst_lit = typeof fst_sel;
									fst_lit = fst_lit === "number" || fst_lit === "string";
									
									if ( snd_lit ) {
										if ( !fst_lit )
											continue;
										
										fst_sel += snd_sel;
										
										if ( fst_isOpArray ) {
											if ( fst_sel !== 0 ) {
												fst.splice( fst_idx, 1, fst_sel );
											
											} else {
												if ( fst._value.length > 2 ) {
													fst.splice( fst_idx, 1 );
												} else {
													fst = fst_idx === 1 ? fst._value[ 0 ] : fst._value[ 1 ];
													fst_isOpArray = false;
												}
											}
										
										} else {
											fst = fst_sel;
										}
										
										continue SNDLOOP;
									
									} else {
										if ( fst_lit )
											continue;
										
										res = factorOutProducts.call( this, fst_sel, snd_sel );
										
										if ( res.front !== 1 || res.back !== 1 ) {
											var sum = operators[ "+" ].ledEval.call( this, res.fst, res.snd );
											
											if ( sum === 0 ) {
												if ( fst_isOpArray ) {
													if ( fst._value.length > 2 ) {
														fst.splice( fst_idx, 1 );
													} else {
														fst = fst_idx === 1 ? fst._value[ 0 ] : fst._value[ 1 ];
														fst_isOpArray = false;
													}
												
												} else {
													fst = 0;
												}
												
												continue SNDLOOP;
											
											} else if ( res.front !== 1 && res.back !== 1 ) {
												//shared front and back
												//reuse existing arrays
												if ( res.front instanceof Expression && res.front._value.op === "*" ) {
													fst_sel = res.front;
													
													if ( sum instanceof Expression && sum._value.op === "*" ) {
														fst_sel.push.apply( sum );
													} else {
														if ( sum instanceof Expression )
															fst_sel.push( sum );
														else
															fst_sel.unshift( sum );
													}
													
													if ( res.back instanceof Expression && res.back._value.op === "*" ) {
														fst_sel.push.apply( res.back );
													} else {
														fst_sel.push( res.back );
													}
												
												} else if ( sum instanceof Expression && sum._value.op === "*" ) {
													fst_sel = sum;
													
													fst_sel.unshift( res.front );
													
													if ( res.back instanceof Expression && res.back._value.op === "*" ) {
														fst_sel.push.apply( res.back );
													} else {
														fst_sel.push( res.back );
													}
												
												} else if ( res.back instanceof Expression && res.back._value.op === "*" ) {
													fst_sel = res.back;
													
													fst_sel.unshift( res.front, sum );
												
												} else {
													fst_sel = Expression( "*", [ sum instanceof Expression ? res.front : sum, sum instanceof Expression ? sum : res.front, res.back ] );
												}
											
											} else if ( res.front !== 1 ) {
												//shared front only
												//reuse existing arrays
												if ( res.front instanceof Expression && res.front._value.op === "*" ) {
													fst_sel = res.front;
													
													if ( sum instanceof Expression && sum._value.op === "*" ) {
														fst_sel.push.apply( sum );
													} else {
														if ( sum instanceof Expression )
															fst_sel.push( sum );
														else
															fst_sel.unshift( sum );
													}
												
												} else if ( sum instanceof Expression && sum._value.op === "*" ) {
													fst_sel = sum;
													
													fst_sel.unshift( res.front );
												
												} else {
													fst_sel = Expression( "*", [ sum instanceof Expression ? res.front : sum, sum instanceof Expression ? sum : res.front ] );
												}
											
											} else if ( res.back !== 1 ) {
												//shared back only
												//reuse existing arrays
												if ( sum instanceof Expression && sum._value.op === "*" ) {
													fst_sel = sum;
													
													if ( res.back instanceof Expression && res.back._value.op === "*" ) {
														fst_sel.push.apply( res.back );
													} else {
														fst_sel.push( res.back );
													}
												
												} else if ( res.back instanceof Expression && res.back._value.op === "*" ) {
													fst_sel = res.back;
													
													fst_sel.unshift( sum );
												
												} else {
													fst_sel = Expression( "*", [ sum, res.back ] );
												}
											}
											
											if ( fst_isOpArray ) {
												fst.splice( fst_idx, 1, fst_sel );
											} else
												fst = fst_sel;
											
											continue SNDLOOP;
										}
									}
								}
							}
							
							//fst does not share summand parts with snd_sel, so just append snd_sel
							if ( fst_isOpArray ) {
								fst.push( snd_sel );
								fst_len += 1;
							
							} else if ( fst !== 0 ){
								fst = Expression( "+", [ fst, snd_sel ] );
								fst_isOpArray = true;
								fst_len = 2;
							
							} else {
								fst = snd_sel;
							}
						}
						
						return fst;
					};
				
				ret.lit = {
					lit : function( lit1, lit2 ) {
						return lit1 + lit2;
					},
					ref : function( lit, ref ) {
						return ret.ref.lit.call( this, ref, lit, true );
					},
					arr : function( lit, arr ) {
						return ret.arr.lit.call( this, arr, lit, true );
					}
				};
				
				ret.ref = {
					lit : function( ref, lit, swap ) {
						if ( typeof swap !== "boolean" )
							swap = undefined;
						
						if ( lit === 0 )
							return ref;
						
						if ( lit === Infinity || lit === -Infinity )
							return lit;
						
						return Expression( "+", swap ? [ lit, ref ] : [ ref, lit ] );
					},
					ref : function( ref1, ref2 ) {
						return Expression( "+", [ ref1, ref2 ] );
					},
					arr : function( ref, arr, swap ) {
						if ( typeof swap !== "boolean" )
							swap = undefined;
						
						return addSums.call( this, swap ? arr : ref, swap ? ref : arr );
					}
				};
				
				ret.arr = {
					lit : function( arr, lit, swap ) {
						if ( typeof swap !== "boolean" )
							swap = undefined;
						
						if ( lit === 0 )
							return arr;
						
						if ( lit === Infinity || lit === -Infinity )
							return lit;
						
						return addSums.call( this, swap ? lit : arr, swap ? arr : lit );

					},
					ref : function( arr, ref ) {
						return ret.ref.arr.call( this, ref, arr, true );
					},
					arr : function( arr1, arr2 ) {
						return addSums.call( this, arr1, arr2 );
					}
				};
				
				return ret;
			}() ) );
			
			operator( "-", "infix", 60, null, function( left, right ) {		// left + (-1)*right
				return operators[ "+" ].ledEval.call( this, left, operators[ "*" ].ledEval.call( this, -1, right ) );
			}, true );
			
			operator( "*", "infix", 70, null, ( function() {
				var ret = {},
					
					factorOutPowers = function( fst, snd ) {
						var base = false,
							exp = false,
							base1, base2,
							exp1, exp2;
						
						if ( fst && fst instanceof Expression && fst._value.op === "^" && fst._value.length > 1 ) {
							base1 = fst._value[ 0 ];
							exp1  = fst._value.length > 2 ? ( fst.shift(), fst ) : fst._value[ 1 ];
						} else {
							base1 = fst;
							exp1  = 1;
						}
						
						if ( snd && snd instanceof Expression && snd._value.op === "^" && snd._value.length > 1 ) {
							base2 = snd._value[ 0 ];
							exp2  = snd._value.length > 2 ? ( snd.shift(), snd ) : snd._value[ 1 ];
						} else {
							base2 = snd;
							exp2  = 1;
						}
						
						if ( base1 === base2 ) {
							base = base1;
							exp = operators[ "+" ].ledEval.call( this, exp1, exp2 );
						} else if ( exp1 !== 1 && exp1 === exp2 ) {
							base = operators[ "*" ].ledEval.call( this, base1, base2 );
							exp = exp1;
						}
						
						return {
							base : base,
							exp : exp
						};
					},
					
					mulPows = function( fst, snd ) {
						var res,
							fst_sel, snd_sel,
							fst_num, snd_num,
							fst_idx, snd_idx,
							fst_len, snd_len,
							fst_isOpArray, snd_isOpArray;
						
						snd_isOpArray = snd && snd._value && snd._value.op === "*" && snd._value.length > 1;
						snd_len = ( snd_isOpArray && snd._value.length ) || 1;
						snd_idx = 0;
						
						fst_isOpArray = fst && fst._value && fst._value.op === "*" && fst._value.length > 1;
						fst_len = ( fst_isOpArray && fst._value.length ) || 1;
						
						while ( snd_idx < snd_len && snd_sel !== snd ) {
							snd_sel = snd_isOpArray ? snd._value[ snd_idx++ ] : snd;
							snd_num = typeof snd_sel === "number";
							
							if ( snd_num ) {
								//checking first entry of fst for number is sufficient
								fst_idx = 0;
								fst_sel = fst_isOpArray ? fst._value[ fst_idx ] : fst;
								
								if ( typeof fst_sel === "number" ) {
									fst_sel *= snd_sel;
									
									if ( fst_isOpArray ) {
										if ( fst_sel !== 1 ) {
											fst.splice( fst_idx, 1, fst_sel );
										
										} else {
											if ( fst._value.length > 2 ) {
												fst.splice( fst_idx, 1 );
											} else {
												fst = fst_idx === 1 ? fst._value[ 0 ] : fst._value[ 1 ];
												fst_isOpArray = false;
											}
										}
									
									} else {
										fst = fst_sel;
									}
								
								} else {
									if ( fst_isOpArray ) {
										fst.unshift( snd_sel );
										fst_len += 1;
									
									} else {
										fst = Expression( "*", [ snd_sel, fst ] );
										fst_isOpArray = true;
										fst_len = 2;
									}
								}
								
							} else {
								//comparing factors with last entry of fst is sufficient
								fst_idx = fst_len;
								fst_sel = fst_isOpArray ? fst._value[ --fst_idx ] : fst;
								
								res = factorOutPowers.call( this, fst_sel, snd_sel );
								
								if ( res.base ) {
									//part of product shared
									var pow = operators[ "^" ].ledEval.call( this, res.base, res.exp );
									
									if ( pow === 1 ) {
										if ( fst_isOpArray ) {
											if ( fst._value.length > 2 ) {
												fst.splice( fst_idx, 1 );
											} else {
												fst = fst_idx === 1 ? fst._value[ 0 ] : fst._value[ 1 ];
												fst_isOpArray = false;
											}
										
										} else {
											fst = 1;
										}
									
									} else {
										if ( fst_isOpArray )
											fst.splice( fst_idx, 1, pow );
										else
											fst = pow;
									}
								
								} else {
									//fst does not share summand parts with snd_sel, so just append snd_sel
									if ( fst_isOpArray ) {
										fst.splice( fst_len, 0, snd_sel );
										fst_len += 1;
									
									} else if ( fst !== 1 ) {
										fst = Expression( "*", [ fst, snd_sel ] );
										fst_isOpArray = true;
										fst_len = 2;
									
									} else {
										fst = snd_sel;
									}
								}
							}
						}
						
						return fst;
					};
					
				ret.lit = {
					lit : function( lit1, lit2 ) {
						return lit1 * lit2;
					},
					ref : function( lit, ref ) {
						return ret.ref.lit.call( this, ref, lit );
					},
					arr : function( lit, arr ) {
						return ret.arr.lit.call( this, arr, lit );
					}
				};
				
				ret.ref = {
					lit : function( ref, lit ) {
						if ( lit === 0 || lit === Infinity || lit === -Infinity )
							return lit;
						
						if ( lit === 1 )
							return ref;
						
						return Expression( "*", [ lit, ref ] );
					},
					ref : function( ref1, ref2 ) {
						if ( ref1 === ref2 )
							return Expression( "^", [ ref1, 2 ] );
						
						return Expression( "*", [ ref1, ref2 ] );
					},
					arr : function( ref, arr, swap ) {
						if ( typeof swap !== "boolean" )
							swap = undefined;
						
						return mulPows.call( this, swap ? arr : ref, swap ? ref : arr );
					}
				};
				
				ret.arr = {
					lit : function( arr, lit, swap ) {
						if ( typeof swap !== "boolean" )
							swap = undefined;
						
						if ( lit === 0 )
							return 0;
						
						if ( lit === 1 )
							return arr;
						
						if ( lit === Infinity || lit === -Infinity )
							return lit;
						
						return mulPows.call( this, swap ? lit : arr, swap ? arr : lit );

					},
					ref : function( arr, ref ) {
						return ret.ref.arr.call( this, ref, arr, true );
					},
					arr : function( arr1, arr2 ) {
						return mulPows.call( this, arr1, arr2 );
					}
				};
				
				return ret;
			}() ) );
			
			operator( "/", "infix", 70, null, function( left, right ) {		// left * right^(-1)
				return operators[ "*" ].ledEval.call( this, left, operators[ "^" ].ledEval.call( this, right, -1 ) );
			}, true );
			
			operator( "%", "infix", 70, null, ( function() {
				var ret = {},
					
					mod = function( left, right ) {
						if ( left === 0 )
							return 0;
						
						if ( left === right )
							return 0;
						
						if ( right === 0 )
							return NaN;
						
						if ( right === 1 )
							return 0;
						
						if ( left && left instanceof Expression && left._value.op === "%" ) {
							if ( right && right instanceof Expression && right._value.op === "%" ) {
								left.push.apply( left, right._value );
								
							} else {
								left.push( right );
							}
							
							return left;
						}
						
						if ( right && right instanceof Expression && right._value.op === "%" ) {
							right.unshift( left );
							
							return right;
						}
						
						return Expression( "%", [ left, right ] );
					};
				
				each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
					ret[ typeL ] = {};
					each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
						ret[ typeL ][ typeR ] = mod;
					} );
				} );
				
				ret.lit.lit = function( lit1, lit2 ) {
					return lit1 % lit2;
				};
				
				return ret;
			}() ) );
			
			operator( "^", "infixr", 80, null, ( function() {
				var ret = {},
					
					pow = function( base, exp ) {
						if ( exp === 0 )
							return 1;		//defines 0^0 := 1
						
						if ( exp === 1 )
							return base;
						
						if ( base === 0 )
							return 0;
							
						if ( base === 1 )
							return 1;
						
						if ( exp && exp instanceof Expression && exp._value.op === "^" ) {
							exp.unshift( base );
							
							return exp;
						
						} else if ( typeof exp === "number" && base && base instanceof Expression &&
									base._value.op === "^" && base._value.length === 2 &&
									typeof base._value[ 1 ] === "number" ) {
							base = Expression( "^", base._value.slice() );
							base._value[ 1 ] *= exp;
							
							return base;
						}
						
						return Expression( "^", [ base, exp ] );
					};
				
				each( [ "lit", "ref", "arr" ], function( idxB, typeB ) {
					ret[ typeB ] = {};
					each( [ "lit", "ref", "arr" ], function( idxE, typeE ) {
						ret[ typeB ][ typeE ] = pow;
					} );
				} );
				
				ret.lit.lit = function( base, exp ) {
					return exp === -1 ? 1/base : Math.pow( base, exp );
				};
				
				return ret;
			}() ) );
			
			operator( "!", "prefix", 90, null, {
				lit : function( lit ) {
					return !lit;
				},
				
				ref : function( ref ) {
					return Expression( "!", [ ref ] );
				},
				
				arr : function( arr ) {
					if ( arr._value.op === "!" && arr._value[ 0 ] instanceof Expression && arr._value[ 0 ]._value.op === "!" )
						return arr._value[ 0 ];
					else
						return Expression( "!", [ arr ] );
				}
			} );
			
			operator( "+", "prefix", 90, null, {
				lit : function( lit ) {
					return +lit;
				},
				
				ref : function( ref ) {
					return Expression( "+", [ ref ] );
				},
				
				arr : function( arr ) {
					if ( arr && arr instanceof Expression && arr._value.op === "+" && arr._value.length === 1 )
						return arr;
					
					return Expression( "+", [ arr ] );
				}
			} );
			
			operator( "-", "prefix", 90, null, function( operand ) {	//-1 * operand
				return operators[ "*" ].ledEval.call( this, -1, operand );
			}, true );
			
			operator( "typeof", "prefix", 90, null, {
				lit : function( lit ) {
					return typeof lit;
				},
				
				ref : function( ref ) {
					return Expression( "typeof", [ ref ] );
				},
				
				arr : function( arr ) {
					if ( arr && arr instanceof Expression && arr._value.op === "typeof" )
						return "string";
					
					return Expression( "typeof", [ arr ] );
				}
			} );
			
			operator( "delete", "delete", 90, null, function( v, interpreter ) {
				var isExpr = v instanceof Expression && v._value,
					isPropAccess = isExpr && v._value.op === ".",
					isVar  = !isExpr && v instanceof Variable && v._value,
					isPath = !isVar && v instanceof PropPath;
				
				if ( !v || ( !isVar && !isPath && !isExpr && v.id !== "(id)" ) )
					error( "Bad lvalue: no variable or object property." );
				
				if ( isPropAccess )
					return !!PropPath( v, false, undefined, true );
				else if ( isExpr )
					return v.remove();
				else if ( isPath )
					return !!v.set( false, undefined, true );
				
				return interpreter.nameTable.remove( v._key || v.value );
			} );
			
			operator( "~delete", "delete", 90, null, function( path ) {
				var isPath = path instanceof PropPath,
					isPropAccess = !isPath && path instanceof Expression && path._value.op === ".";
				
				if ( !path || ( !isPropAccess && !isPath ) )
					error( "Bad lvalue: no object property." );
				
				if ( isPropAccess )
					return !!PropPath( path, true, undefined, true );
				else
					return !!path.set( true, undefined, true );
			} );
			
			operator( "~", "prefix", 90, function ( expr ) {
					//this.first = undefined;
					this.nudEval = operators[ this.id ].nudEval;
					expr.o[ expr.p ] = this;
					
					deregister = true;
					
					return {
						o : this,
						p : "first",
						rbp : this.lbp,
						end : null,
						parent : expr,
						prevToken : expr.o.id
					};
				},
				function( v ) {
					if ( !v || !(v instanceof PropPath) && !(v instanceof FunctionCall) )
						error( "Bad lvalue: no reactive object property or function call." );
					
					deregister = false;
					
					return v.remove();
				}
			);
			
			operator( "#", "prefix", 90, null, {
				lit : function( lit ) {
					return lit;
				},
				
				ref : function( ref ) {
					return ref.valueOf();
				},
				
				arr : function( arr ) {
					return arr.valueOf();
				}
			} );
			
			operator( "{", "infix", 100, function( expr ) {
					this.first = expr.o[ expr.p ];
					//this.second = undefined;
					this.ledEval = operators[ "{" ].ledEval;
					expr.o[ expr.p ] = this;
					
					return {
						o : this,
						p : "second",
						rbp : 0,
						end : "}",
						parent : expr,
						prevToken : expr.o.id
					};
				},
				function( v, ctxt ) {
					var idx;
					
					if ( !(v instanceof Variable) && !(v instanceof Expression) && !v._isFunc )
						error( "{ must be preceeded by a variable, expression of function!" );
					
					if ( ctxt && ctxt instanceof Expression && ctxt._value.op === "," ) {
						idx = ctxt._value.length;
						while( idx-- ) {
							if ( ctxt._value[ idx ] instanceof Expression )
								error( "context data must be a literal or variable!" );
						}
						
					} else if ( ctxt !== undefined ) {
						if ( ctxt instanceof Expression )
							error( "context data must be a literal or variable!" );
					}
					
					if ( ctxt ) {
						if ( v._isFunc )
							v._context = ctxt;
						else
							v = v.inCtxt( ctxt );
					}
					
					return v;
				}
			);
			
			operator( "(", "call", 100, null, function( func, args ) {
				var call, funcIsLit, argsAreLits;
				
				//prepare function
				if ( func instanceof Variable && func._isConst )
					func = func._value.value;
				
				if ( typeof func === "function" )
					funcIsLit = true;
				else if ( !(func instanceof Reactive) )
					error( "Invalid function expression in function call!" );
				
				//prepare arguments
				if ( funcIsLit && !(args instanceof Reactive) )
					return func( args );
				
				if ( deregister )
					return FunctionCall.prototype._search( func, args );
				
				if ( args instanceof Expression && args._value.op === "," ) {
					argIdx = args._value.length;
					argsAreLits = true;
					while ( argIdx-- ) {
						if ( args._value[ argIdx ] instanceof Reactive ) {
							argsAreLits = false;
							break;
						}
					}
					
					//literal function and arguments
					if ( funcIsLit && argsAreLits )
						return func.apply( this, args._value );
				}
				
				//function applied on its inverse function
				if ( funcIsLit && args instanceof FunctionCall ) {
					if ( args._value.func.inverse === func )
						return args._value.args;
					else if ( args._value.func.projection && args._value.func === func )
						return args;
				}
				
				call = FunctionCall( func, args, true );
				call._call();
				return call;
			} );
			
			operator( ":(", "call", 100, null, function( func, args ) {
				var funcIsLit, argsAreLits;
				
				//prepare function
				if ( func instanceof Variable && func._isConst )
					func = func._value;
				
				if ( typeof func === "function" )
					funcIsLit = true;
				else if ( !(func instanceof Reactive) )
					error( "Invalid function expression in function call!" );
				
				//prepare arguments
				if ( funcIsLit && !(args instanceof Reactive) )
					return;
				
				if ( deregister )
					return FunctionCall.prototype._search( func, args );
				
				if ( args instanceof Expression && args._value.op === "," ) {
					argIdx = args._value.length;
					argsAreLits = true;
					while ( argIdx-- ) {
						if ( args._value[ argIdx ] instanceof Reactive ) {
							argsAreLits = false;
							break;
						}
					}
					
					//literal function and arguments
					if ( funcIsLit && argsAreLits )
						return;
				}
				
				return FunctionCall( func, args, true ) ? true : false;
			} );
			
			var objPropEval = {
				lit : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						var path = [ obj, prop ];
						path = PropPath.prototype._search( path );
						if ( path )
							return path;
						
						if ( this.nextToken === "=" || this.nextToken === "~=" ||
							 this.nextToken === "(" || this.nextToken === ":(" || this.nextToken === "~(" ||
							 ( ( this.prevToken === "delete" || this.prevToken === "~delete" || this.prevToken === "~" ) &&
							 ( this.nextToken !== "." && this.nextToken !== "[" ) ) )
							return Expression( ".", [ obj, prop ] );
						
						return obj[ prop ];
					},
					ref : function( obj, prop ) {
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					},
					arr : function( obj, prop ) {
						if ( prop._value.op === "." )
							prop = PropPath.prototype._search( prop._value ) || prop;
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					}
				},
				ref : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					},
					ref : function( obj, prop ) {
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					},
					arr : function( obj, prop ) {
						if ( prop._value.op === "." )
							prop = PropPath.prototype._search( prop._value ) || prop;
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					}
				},
				arr : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						if ( obj._value.op === "." ) {
							obj = PropPath.prototype._search( obj._value ) || obj;
							
							if ( obj instanceof Expression )
								return obj.push( prop ), obj;
						}
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					},
					ref : function( obj, prop ) {
						if ( obj._value.op === "." ) {
							obj = PropPath.prototype._search( obj._value ) || obj;
							
							if ( obj instanceof Expression )
								return obj.push( prop ), obj;
						}
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					},
					arr : function( obj, prop ) {
						if ( prop._value.op === "." )
							prop = PropPath.prototype._search( prop._value ) || prop;
						
						if ( obj._value.op === "." ) {
							obj = PropPath.prototype._search( obj._value ) || obj;
							
							if ( obj instanceof Expression )
								return obj.push( prop ), obj;
						}
						
						var path = [ obj, prop ];
						
						return PropPath.prototype._search( path ) || Expression( ".", path );
					}
				}
			};
			
			operator( ".", "infix", 110, function( expr ) {
					this.first = expr.o[ expr.p ];
					//this.second = undefined;
					this.dotPropAccess = true;
					this.ledEval = operators[ "." ].ledEval;
					expr.o[ expr.p ] = this;
					
					return {
						o : this,
						p : "second",
						rbp : this.lbp,
						end : null,
						parent : expr,
						prevToken : expr.o.id
					};
				},
				objPropEval
			);
			
			operator( "[", "infix", 110, function( expr ) {
					this.first = expr.o[ expr.p ];
					//this.second = undefined;
					this.ledEval = operators[ "[" ].ledEval;
					expr.o[ expr.p ] = this;
					
					return {
						o : this,
						p : "second",
						rbp : 0,
						end : "]",
						parent : expr,
						prevToken : expr.o.id
					};
				},
				objPropEval
			);
			
			operator( "(", "prefix", 120, function( expr ) {
					//this.first = undefined;
					this.nudEval = operators[ "(" ].nudEval;
					expr.o[ expr.p ] = this;
					
					return {
						o : this,
						p : "first",
						rbp : 0,
						end : ")",
						parent : expr
					};
				},
				function( content ) {
					return content;
				}
			);
			
			//interpret function
			var assignTo = null,
				deregister = false,
				opParts = {			//parts, a multiple-character operator is allowed to be composed of
					"=" : true,
					"!" : true,
					"<" : true,
					">" : true,
					"&" : true,
					"|" : true,
					"+" : true,
					"-" : true,
					"*" : true,
					"/" : true,
					"%" : true,
					"^" : true,
					"#" : true,
					"~" : true,
					"?" : true,
					"." : true,
					"°" : true,
					"(" : true,
					")" : true,
					"[" : true,
					"]" : true
				},
				endExpr = function( expr, token ) {
					var parent = expr.parent;
					
					//fix of assignTo for operator assignment with double assignment
					if ( expr.o.assignment && !assignTo && expr.o.first ) {
						if ( expr.o.first === expr.o.second && expr.o.first instanceof Expression )
							//setting anonymous variable, which actually is an expression...
							return parent.o[ parent.p ] = expr.o.first;
						
						assignTo = expr.o.first.id === "(id)" ? expr.o.first.value : expr.o.first._key;
					}
					
					expr.nextToken = !token || !token.lbp ? undefined : token.id;
					
					//get variable objects
					//Since variables cannot be deleted, while they are still referenced,
					//the pointer to the object stays the same as long as needed.
					if ( !expr.o.dotPropAccess && expr.o.second && expr.o.second.id === "(id)" ) {
						if ( !( expr.o.second.value in this.nameTable.table ) )
							error( expr.o.second.value + " is not defined." );
						
						expr.o.second = this.nameTable.table[ expr.o.second.value ];
					}
					
					if ( !expr.o.assignment && ( expr.o.call || expr.o.id !== "(" ) && expr.o.first && expr.o.first.id === "(id)" ) {
						if ( !( expr.o.first.value in this.nameTable.table ) ) {
							if ( expr.o.id !== "{" || expr.nextToken !== "=" )
								error( expr.o.first.value + " is not defined." );
						} else {						
							expr.o.first = this.nameTable.table[ expr.o.first.value ];
						}
					}
					
					//use the value of a variable in case of assigning to the same variable
					if ( assignTo ) {
						if ( !expr.o.assignment && expr.o.first && expr.o.first._key === assignTo )
							expr.o.first = expr.o.first._value.value;
						
						if ( expr.o.second && expr.o.second._key === assignTo )
							expr.o.second = expr.o.second._value.value;
					}
					
					if ( typeof expr.o.first === "function" )
						expr.o.first._isFunc = true;
					
					if ( typeof expr.o.second === "function" )
						expr.o.second._isFunc = true;
					
					//evaluate expression
					parent.o[ parent.p ] = ( expr.o.nudEval || expr.o.ledEval ).call( expr, expr.o.first, expr.o.second, this );
					
					if ( expr.o.first && expr.o.first._isFunc )
						delete expr.o.first._isFunc;
					
					if ( expr.o.second && expr.o.second._isFunc )
						delete expr.o.second._isFunc;
					
					return parent;
				},
				processLiteral = function( token, expr ) {
					//put literal into expression
					if ( expr.o[ expr.p ] === undefined ) {
						//begin expression
						expr.o[ expr.p ] = token;
						
						if ( expr.parent && !expr.parent.o.first && expr.parent.o.assignment && expr.o[ expr.p ] !== undefined ) {
							//FIXME: hack for prefix assignment
							//not nice, but works
							if ( !expr.parent.o.first && expr.parent.o.assignment ) {
								assignTo = expr.o[ expr.p ].id === "(id)" ? expr.o[ expr.p ].value : expr.o[ expr.p ]._key;
								expr.parent.o.first = expr.o[ expr.p ];
							} else if ( expr.parent.o.id === "(" && !expr.o.first && expr.o.assignment ) {
								assignTo = expr.o[ expr.p ].id === "(id)" ? expr.o[ expr.p ].value : expr.o[ expr.p ]._key;
								expr.o.first = expr.o[ expr.p ];
							}
						}
						
					} else {
						//end expression
						while ( expr.rbp >= 0 ) {
							expr = endExpr.call( this, expr, token );
							
							if ( expr.rbp === 0 ) {
								expr = endExpr.call( this, expr, token );
								break;
							}
						}
					}
					
					return expr;
				},
				
				interpret = function() {
					var i,					//current position in s
						c,					//currently subatomInput character
						t,					//current token string
						token,				//current token
						expr,				//current expression working on
						ret = {},			//object to contain the top level expression, that is returned
						newExpr = true,
						assignOp = false;
					
					//initialize top-level expression
					expr = {
						o : ret,
						p : "value",
						rbp : 0,
						end : null,
						parent : null
					};
					
					for ( var argIdx = 0, argsLen = arguments.length; argIdx < argsLen; argIdx++ ) {
						var s = arguments[ argIdx ];
						
						if ( newExpr && !expr.parent ) {
							if ( ret.value instanceof Expression )
								ret.value.unlink();
							
							delete ret.value;
							newExpr = false;
						}
						
						if ( typeof s !== "string" ) {
							if ( !this.litTable[ "obj" ] )
								error( "Bad Token: External objects not allowed." );
							
							expr = processLiteral.call( this, s, expr );
							newExpr = false;
						
						} else {
							i = 0;
							c = s.charAt( i++ );
							while ( c ) {
								//ignore whitespaces
								while ( c && c <= " " )
									c = s.charAt( i++ );
								
								if ( !c )
									break;
								
								if ( newExpr && !expr.parent ) {
									if ( ret.value instanceof Expression )
										ret.value.unlink();
									
									delete ret.value;
									newExpr = false;
								}
								
								var isNum = ( expr.o[ expr.p ] === undefined && c === "." ) || c >= "0" && c <= "9",
									isStr = c === "\"" || c === "'",
									isIdOrOp = ( c >= "a" && c <= "z" ) || ( c >= "A" && c <= "Z" ) || c === "_";
								
								//match literal
								if ( isNum || isStr ) {
									//match number
									if ( isNum ) {
										if ( !this.litTable[ "number" ] )
											error( "Bad Token: Numbers not allowed." );
										
										t = c;
										c = s.charAt( i++ );
										
										var decPoint = t !== "." ? false : true,
											exp = false;
										
										while ( c ) {
											//find digits
											if ( c >= "0" && c <= "9" ) {
												t += c;
												c = s.charAt( i++ );
											
											//find one decimal point in the numbers base
											} else if ( c === "." ) {
												if ( decPoint || exp )
													error( "Bad Token: Invalid number." );
												
												decPoint = true;
												
												t += c;
												c = s.charAt( i++ );
											
											//find one exponent with a possible sign
											} else if ( c === "e" || c === "E" ) {
												if ( exp )
													error( "Bad Token: Invalid number." );
												
												exp = true;
												t += c;
												c = s.charAt( i++ );
												
												if ( c === "+" || c === "-" ) {
													t += c;
													c = s.charAt( i++ );
												}
											
											} else if ( !( ( c >= "a" && c <= "z" ) ||
														   ( c >= "A" && c <= "Z" ) ) ) {
												break;
											} else {
												error( "Bad Token: Invalid number." );
											}
										}
										
										t = +t;
									
									//match string
									} else {
										if ( !this.litTable[ "string" ] )
											error( "Bad Token: Strings not allowed." );
										
										var q = c;
										//do not include the leading quote
										c = s.charAt( i++ );
										
										t = "";
										while ( c !== q ) {
											//look for escapement
											if ( c === "\\" ) {
												c = s.charAt( i++ );
												if ( !c )
													error( "Bad Token: Unterminated string." );
												
												switch ( c ) {
													case 'b':
														c = '\b';
														break;
													case 'f':
														c = '\f';
														break;
													case 'n':
														c = '\n';
														break;
													case 'r':
														c = '\r';
														break;
													case 't':
														c = '\t';
														break;
													case 'u':
														var uCode = "";
														for ( var i = 0; i < 4; i++ ) {
															c = s.charAt( i++ );
															if ( !c )
																error( "Bad Token: Unterminated string." );
															
															uCode += c;
														}
														c = String.fromCharCode( parseInt( uCode, 16 ) );
														break;
												}
											}
											
											t += c;
											c = s.charAt( i++ );
											
											if ( !c )
												error( "Bad Token: Unterminated string." );
										}				
										
										//select character after the closing quote
										c = s.charAt( i++ );
									}
									
									expr = processLiteral.call( this, t, expr );
								
								//match identifier or operator
								} else {
									//match identifier or possibly operator
									if ( isIdOrOp ) {
										t = "";
										
										while ( ( c >= "a" && c <= "z" ) || ( c >= "A" && c <= "Z" ) ||
												( c >= "0" && c <= "9" ) || c === "_" ) {
											t += c;
											c = s.charAt( i++ );
										}
										
										//intercept literals
										if ( t === "true" && this.litTable[ "boolean" ] ) {
											expr = processLiteral.call( this, true, expr );
											continue;
										} else if ( t === "false" && this.litTable[ "boolean" ] ) {
											expr = processLiteral.call( this, false, expr );
											continue;
										} else if ( t === "null" && this.litTable[ "null" ] ) {
											expr = processLiteral.call( this, null, expr );
											continue;
										} else if ( t === "undefined" ) {
											expr = processLiteral.call( this, undefined, expr );
											continue;
										} else if ( t === "NaN" ) {
											expr = processLiteral.call( this, NaN, expr );
											continue;
										} else if ( t === "Infinity" ) {
											expr = processLiteral.call( this, Infinity, expr );
											continue;
										}
									
									//match operator
									} else {
										t = c;
										c = s.charAt( i++ );
										
										while ( opParts[ c ] && this.opTable[ t+c ] ) {
											t += c;
											c = s.charAt( i++ );
										}
										
										//make exception for "~delete" operator and look ahead
										if ( t === "~" ) {
											var j = i,
												b = c;
											
											if ( b === "d" ) {
												b = s.charAt( j++ );
												if ( b === "e" ) {
													b = s.charAt( j++ );
													if ( b === "l" ) {
														b = s.charAt( j++ );
														if ( b === "e" ) {
															b = s.charAt( j++ );
															if ( b === "t" ) {
																b = s.charAt( j++ );
																if ( b === "e" ) {
																	b = s.charAt( j++ );
																	t += "delete";
																	i = j;
																	c = b;
																}
															}
														}
													}
												}
											}
										}
									}
									
									if ( this.opTable[ t ] ) {
										//token is operator
										var assign = false;
										if ( c === "=" ) {
											assign = true;
											c = s.charAt( i++ );
										
										} else if ( c === "." && s.charAt( i ) === "=" ) {
											c = s.charAt( i+1 );
											i += 2;
											assign = true;
										}
										
										if ( assign ) {
											token = {
												nud 	: this.opTable[ "(op=)" ].nud || nudUndef,
												led 	: this.opTable[ "(op=)" ].led || ledUndef,
												lbp 	: this.opTable[ "(op=)" ].lbp,
												value 	: t,
												id 		: "(op=)",
												arity 	: "operator"
											};
										
										} else {
											token = {
												nud 	: this.opTable[ t ].nud || nudUndef,
												led 	: this.opTable[ t ].led || ledUndef,
												lbp 	: this.opTable[ t ].lbp,
												value 	: t,
												id 		: t,
												arity 	: "operator"
											};
										}
									
									} else if ( !isIdOrOp ) {
										error( "Bad Token: Operator not supported: " + t + "." );
										
									} else {
										//token is a variable or constant name
										if ( !this.litTable[ "id" ] )
											error( "Bad Token: Identifiers not allowed." );
										
										token = {
											nud   : itself,
											led   : ledUndef,
											lbp   : 0,
											value : t,
											id    : "(id)",
											arity : "id"
										};
									}
									
									//put token into expression
									if ( !( expr.p in expr.o ) && expr.rbp !== Infinity && ( !expr.end || expr.end !== token.id ) ) {
										//dont do this for ending tokens
										expr = token.nud( expr );
										
										if ( expr.parent && expr.o[ expr.p ] ) {
											//FIXME: hack for prefix assignment
											//not nice, but works
											if ( !expr.parent.o.first && expr.parent.o.assignment ) {
												assignTo = expr.o[ expr.p ].id === "(id)" ? expr.o[ expr.p ].value : expr.o[ expr.p ]._key;;
												expr.parent.o.first = expr.o[ expr.p ];
											} else if ( expr.parent.o.id === "(" && !expr.o.first && expr.o.assignment ) {
												assignTo = expr.o[ expr.p ].id === "(id)" ? expr.o[ expr.p ].value : expr.o[ expr.p ]._key;;
												expr.o.first = expr.o[ expr.p ];
											}
										}
										continue;
									}
									
									//end expression
									while ( expr.rbp >= token.lbp ) {
										if ( expr.end ) {
											if ( expr.end !== token.id )
												error( "Expected " + expr.end + "." );
											
											//the complete sequence has a right binding power equal to kind of inifity
											//and will be evaluated directly after the next token had been identified.
											expr.rbp = Infinity;
											expr.end = null;
											
											//get next token
											break;
										}
										
										expr = endExpr.call( this, expr, token );
										
										if ( expr.rbp === token.lbp ) {
											if ( expr.end ) {
												if ( expr.end !== token.id )
													error( "Expected " + expr.end + "." );
												
												//the complete sequence has a right binding power equal to kind of inifity
												//and will be evaluated directly after the next token had been identified.
												expr.rbp = Infinity;
												expr.end = null;
												
												//get next token
												break;
											}
											
											if ( expr.parent )
												expr = endExpr.call( this, expr, token );
											else
												newExpr = true;
											
											break;
										}
									}
									
									//extend expression
									if ( expr.rbp < token.lbp )
										expr = token.led( expr );
									
									token = undefined;
								}
							}
						}
					}
					
					//end top-level expression
					while ( expr.parent )
						expr = endExpr.call( this, expr, token );
					
					//finetune return value
					if ( ret.value ) {
						if ( ret.value.id === "(id)" ) {
							if ( !( ret.value.value in this.nameTable.table ) )
								error( ret.value.value + " is not defined." );
							
							ret.value = this.nameTable.table[ ret.value.value ];
						}
					}
					
					//return top-level expression
					return ret.value;
				};
			
			var Reactive = function( proto ) {
					var r = Object.create( Reactive.prototype );
					
					if ( proto )
						r._proto  = proto;
					
					for ( var id in proto )
						if ( proto.hasOwnProperty( id ) )
							r[ id ] = proto[ id ];
					
					return r;
				};
			
			var linkId = function( id, rmvList ) {
					if ( !this._value.hasOwnProperty( id ) )
						return;
					
					if ( !(this._value[ id ] instanceof Reactive) )
						return;
					
					this._value[ id ]._partOf[ this._guid ] = this;
					rmvList && delete rmvList[ this._value[ id ]._guid ];
					
					if ( this._value[ id ] instanceof Expression )
						this._value[ id ].link( undefined, rmvList );
				},
				unlinkId = function( id, rmvList ) {
					if ( !this._value.hasOwnProperty( id ) )
						return;
					
					if ( !(this._value[ id ] instanceof Reactive) )
						return;
					
					this._value[ id ]._partOf && delete this._value[ id ]._partOf[ this._guid ];
					
					if ( this._value[ id ] instanceof Expression )
						this._value[ id ].unlink( undefined, rmvList );
					else if ( this._value[ id ] instanceof PropPath &&
							  isEmptyObj( this._value[ id ]._partOf ) &&
							  !("value" in this._value[ id ]._value) )
						rmvList ? (rmvList[ this._value[ id ]._guid ] = this._value[ id ]) : this._value[ id ].remove();
					else if ( this._value[ id ] instanceof FunctionCall &&
							  isEmptyObj( this._value[ id ]._partOf ) )
						rmvList ? (rmvList[ this._value[ id ]._guid ] = this._value[ id ]) : this._value[ id ].remove();
				};
			
			Reactive.prototype = {
				_guid : 0,
				_proto : null,
				
				_partOf : null,
				_value  : null,
				_evaled : null,
				
				link : function( id, rmvList ) {
					if ( this instanceof Expression )
						this.linked = true;
					
					if ( id )
						return linkId.call( this, id, rmvList );
					
					for ( id in this._value )
						linkId.call( this, id, rmvList );
				},
				unlink : function( id, rmvList ) {
					if ( id )
						return unlinkId.call( this, id, rmvList );
					
					if ( this instanceof Expression )
						delete this.linked;
					
					for ( id in this._value )
						unlinkId.call( this, id, rmvList );
				},
				remove : function() {
					delete this._guid;
					delete this._partOf;
					delete this._evaled;
					delete this._value;
				}
			};
			
			//Variable creation and properties
			var Variable = function( key, val, isConst ) {
					var v = this instanceof Variable ? this : Object.create( Variable.prototype );
					
					v._guid	  = Reactive.prototype._guid++;
					v._partOf = {};
					v._evaled = {};
					v._value  = {};
					
					v.set( val );
					
					if ( key ) {
						v._key = key;
						v._isNamed = true;
					
					} else {
						v._key = String( v._guid );
					}
					
					if ( isConst )
						v._isConst = true;
					
					return v;
				};
			
			Variable.prototype = Reactive( {
				_key	 : "unnamed",
				_isNamed : false,
				_isConst : false,
				_inCtxt  : false,
				
				valueOf : function() {
					try {
						var idx, context,
							value  = this._value.value,
							evaled = this._evaled;
						
						if ( !this._value.context && arguments.length ) {
							if ( typeof value === "function" ) {
								context = [];
								idx = arguments.length;
								while( idx-- )
									context[ idx ] = arguments[ idx ].valueOf();
								
								return value.apply( null, context );
							
							} else if ( value && value.valueOf )
								return value.valueOf.apply( value, arguments );
							
							else
								return value;
						}
						
						if ( !evaled.hasOwnProperty( "value" ) ) {
							if ( this._value.context ) {
								if ( this._value.context instanceof Expression && this._value.context._value.op === "," ) {
									context = [];
									idx = this._value.context._value.length;
									while( idx-- )
										context[ idx ] = this._value.context._value[ idx ].valueOf();
								
								} else {
									context = [ this._value.context.valueOf() ];
								}
								
								if ( typeof value === "function" )
									evaled.value = value.apply( null, context );
								else if ( value && value.valueOf )
									evaled.value = value.valueOf.apply( value, context );
								else
									evaled.value = value;
							
							} else if ( value && value.valueOf )
								evaled.value = value.valueOf();
							
							else
								evaled.value = value;
						}
						
						return evaled.value;
					
					} catch( e ) {
						error( "Variable.valueOf: " + e.message );
					}
				},
				toString : function() {
					var value  = this._value.value,
						evaled = this._evaled;
					
					try {
						if ( evaled.hasOwnProperty( "string" ) )
							return evaled.string;
						
						evaled.string = this._isNamed ? this._key + " = " : "";
						
						if ( this._inCtxt )
							evaled.string += "( ";
						
						if ( typeof value === "function" )
							evaled.string += "function(){...}";
						else if ( value && value.toString )
							evaled.string += value.toString();
						else
							evaled.string += String( value );
						
						if ( this._inCtxt )
							evaled.string += " ){ " + String( this._value.context ) + " }";
						
						return evaled.string;
						
					} catch( e ) {
						error( "Variable.toString: " + e.message );
					}
				},
				
				invalidate : function( from ) {
					delete this._evaled.value;
					delete this._evaled.string;
					
					for ( var id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				set : function( val ) {
					//remove context in advance
					if ( "context" in this._value ) {
						delete this._value.context;
						this.unlink( "context" );
					}
					
					//new value is current value
					//adjust context, if at all
					if ( val && this._value === val ) {
						if ( val._isFunc && val._context ) {
							this._value.context = val._context;
							this.link( "context" );
							delete val._context;
						}
						
						return this;
					}
					
					//delete links from value to this instance
					var rmvList = {};
					this.unlink( undefined, rmvList );
					
					//set new value
					this._value.value = val;
					
					//link value to this instance
					!dontTrack && this.link( undefined, rmvList );
					
					for ( var id in rmvList )
						rmvList[ id ].remove();
					
					//context variable?
					if ( val && val._isFunc ) {
						delete val._isFunc;
						
						if ( val._context ) {
							this._value.context = val._context;
							this.link( "context" );
							delete val._context;
						}
					}
					
					this.invalidate();
					
					return this;
				},
				inCtxt : function( ctxt ) {
					if ( this._value.context )
						return this;
					
					var v = Object.create( this );
					
					v._guid = Reactive.prototype._guid++;
					v._value = Object.create( this._value );
					v._value.context = ctxt;
					v._evaled = {};
					v._inCtxt = true;
					
					return v;
				},
				remove : function() {
					this.unlink();
					delete this._key;
					delete this._isNamed;
					delete this._isConst;
					
					Reactive.prototype.remove.call( this );
					
					return true;
				}
			} );
			
			//expressions
			var Expression = function( op, array ) {
				var v = this instanceof Expression ? this : Object.create( Expression.prototype );
				
				v._guid	  = Reactive.prototype._guid++;
				v._partOf = {};
				v._evaled = {};
				v._value  = array;
				v._value.op = op;
				
				return v;
			};
			
			Expression.prototype = Reactive( {
				_inCtxt : false,
				_linked : false,
				
				valueOf : function() {
					try {
						var value = this._value,
							op = value.op,
							idx,
							ret,
							cur,
							context;
						
						context = Array.prototype.slice.apply( value.context || arguments );
						idx = context.length;
						while( idx-- )
							context[ idx ] = context[ idx ].valueOf();
						
						idx = value.length;
						if ( idx === 1 ) {
							//unary
							if ( value[ 0 ] instanceof Reactive )
								cur = value[ 0 ].valueOf.apply( value[ 0 ], context );
							else if ( context.length && typeof value[ 0 ] === "function" )
								cur = value[ 0 ].apply( value[ 0 ], context );
							else
								cur = value[ 0 ];
							
							return operators[ op ].nudEval.call( this, cur, ret );
						}
						
						//binary with two or more operands
						while( idx-- ) {
							if ( value[ idx ] instanceof Reactive )
								cur = value[ idx ].valueOf.apply( value[ idx ], context );
							else if ( context.length && typeof value[ idx ] === "function" )
								cur = value[ idx ].apply( value[ idx ], context );
							else
								cur = value[ idx ];
							
							ret = ( ret === undefined  ) ? cur : operators[ op ].ledEval.call( this, cur, ret );
						}
						
						return ret;
					
					} catch( e ) {
						error( "Expression.valueOf: " + e.message );
					}
				},
				toString : function() {
					try {
						if ( this._evaled.hasOwnProperty( "string" ) )
							return this._evaled.string;
						
						var str = "",
							value = this._value;
							op = value.op;
						
						for ( var idx = 0, len = value.length; idx < len; idx++ ) {
							if ( !value[ idx ] ) {
								str += value[ idx ];
							
							} else if ( value[ idx ] instanceof Expression ) {
								//replace + with - in case of negative number and summation
								if ( op === "+" && value[ idx ]._value.op === "*" && value[ idx ]._value[ 0 ] < 0 ) {
									str = str.slice( 0, -op.length );
								}
								
								if ( ( op === "*" && value[ idx ]._value.op === "+" ) || op === "^" )
									str += "(";
								
								str += value[ idx ].toString();
								
								if ( ( op === "*" && value[ idx ]._value.op === "+" ) || op === "^" )
									str += ")";
							
							} else {
								if ( op === "^" && idx > 1 && len > 2 )
									str = "(" + str;
								
								if ( idx === 0 && op === "*" && value[ idx ] === -1 ) {
									str += "-";
									continue;
								}
								
								if ( value[ idx ] instanceof Variable ) {
									if ( value[ idx ]._isNamed )
										str += value[ idx ]._key;
									else
										str += "{" + value[ idx ].toString() + "}";
								
								} else {
									if ( typeof value[ idx ] === "number" && op === "+" && value[ idx ] < 0 ) {
										str = str.slice( 0, -op.length );
										str += "-" + Math.abs( value[ idx ] );
									} else {
										str += value[ idx ];
									}
								}
								
								if ( op === "^" && idx < len-1 && len > 2 )
									str += ")";
							}
							
							if ( idx > 0 ) {
								if ( op === "(" )
									str += " ) ";
								else if ( op === "[" )
									str += " ] ";
								else if ( op === "{" )
									str += " } ";
							}
							
							if ( idx < len-1 ) {
								if ( op !== "." )
									str += " ";
								
								str += op;
								
								if ( op !== "." )
									str += " ";
							}
						}
						
						return this._evaled.string = str;
					
					} catch( e ) {
						error( "Expression.toString:" + e.message );
					}
				},
				
				invalidate : function( from ) {
					delete this._evaled.value;
					delete this._evaled.string;
					
					for ( var id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				push : function() {
					var l = this._value.length,
						newL = Array.prototype.push.apply( this._value, arguments );
					
					this.linked && this.linkEntries( l, newL-1 );
					this.invalidate();
					
					return newL;
				},
				pop : function() {
					this.linked && this.unlinkEntries( this._value.length-1 );
					this.invalidate();
					
					return Array.prototype.pop.apply( this._value, arguments );
				},
				shift : function() {
					this.linked && this.unlinkEntries( 0 );
					this.invalidate();
					
					return Array.prototype.shift.apply( this._value, arguments );
				},
				unshift : function() {
					var l = Array.prototype.unshift.apply( this._value, arguments );
					
					this.linked && this.linkEntries( 0, arguments.length-1 );
					this.invalidate();
					
					return l;
				},
				splice : function( idx, del ) {
					this.linked && this.unlinkEntries( idx, idx+del );
					
					var entries = Array.prototype.splice.apply( this._value, arguments );
					
					if ( arguments.length > 2 )
						this.linked && this.linkEntries( idx, idx+arguments.length-3 );
					
					this.invalidate();
					
					return entries;
				},
				linkEntries : function( from, i ) {
					if ( arguments.length === 1 )
						i = from;
					
					while ( i >= from )
						this.link( i-- );
				},
				unlinkEntries : function( from, i ) {
					if ( arguments.length === 1 )
						i = from;
					
					while ( i >= from )
						this.unlink( i-- );
				},
				
				inCtxt : function( ctxt ) {
					if ( this._value.context )
						return this;
					
					var v = Object.create( this );
					
					v._guid = Reactive.prototype._guid++;
					v._value = Object.create( this._value );
					v._value.context = ctxt;
					v._inCtxt = true;
					
					return v;
				},
				remove : function() {
					this.unlink();
					delete this._inCtxt;
					
					Reactive.prototype.remove.call( this );
				}
			} );
			
			//function calls
			var FunctionCall = function( func, args, evalArgs ) {
					var idx, c;
					
					//look if function call has already been registered
					if ( c = FunctionCall.prototype._search( func, args ) ) {
						c._calls += 1;
						return c;
					}
					
					//unknown call
					c = this instanceof FunctionCall ? this : Object.create( FunctionCall.prototype );
					
					c._guid = Reactive.prototype._guid++;
					!dontTrack && ( FunctionCall.prototype._calls[ c._guid ] = c );
					
					c._partOf = {};
					
					//manage object property paths
					if ( func instanceof Expression && func._value.op === "." )
						func = PropPath.prototype._search( func._value ) || PropPath( func );
					
					if ( args instanceof Expression ) {
						if ( args._value.op === "." ) {
							args = PropPath.prototype._search( args._value ) || PropPath( args );
						
						} else if ( args._value.op === "," ) {
							idx = args._value.length;
							while ( idx-- ) {
								if ( args._value[ idx ] instanceof Expression && args._value[ idx ]._value.op === "." )
									args._value[ idx ] = PropPath.prototype._search( args._value[ idx ]._value ) || PropPath( args._value[ idx ] );
							}
						}
					}
					
					c._value  = {
						func : func,
						args : args
					};
					c._evaled = {};
					
					c._evalArgs = !!evalArgs;
					c._calls = 1;
					
					//don't track changes of function or arguments,
					//if tracking is explicitly turned of by dontTrack
					!dontTrack && c.link();
					
					return c;
				};
			
			FunctionCall.prototype = Reactive( {
				_evalArgs : false,
				_calls    : {},
				
				_search : function( func, args ) {
					for ( var id in FunctionCall.prototype._calls )
						if ( equiv( func, FunctionCall.prototype._calls[ id ]._value.func ) &&
							 equiv( args, FunctionCall.prototype._calls[ id ]._value.args ) )
							return FunctionCall.prototype._calls[ id ];
					
					return undefined;
				},
				
				valueOf : function() {
					return "value" in this._evaled ? this._evaled.value : this._call();
				},
				toString : function() {
					if ( "string" in this._evaled )
						return this._evaled.string;
					
					return this._evaled.string =
						typeof this._value.func === "function" ?
							"function(){...}" :
							String( this._value.func ) + 
						"( " + String( this._value.args ) + " )";
				},
				
				invalidate : function( from ) {
					var evaled = this._evaled,
						value  = this._value,
						func   = this._value.func,
						args   = this._value.args;
					
					//check, if func depends on from
					if ( !evaled.func || func === from ) {
						if ( func instanceof Expression && func._value.op === "." ) {
							if ( func.length === 2 ) {
								evaled.ctxt = func._value[ 0 ].valueOf();
								evaled.func = evaled.ctxt[ func._value[ 1 ].valueOf() ];
							} else {
								debugger;
								var prop = func._value.pop();
								evaled.ctxt = func.valueOf();
								evaled.func._value = evaled.ctxt[ prop.valueOf() ];
								func._value.push( prop );
							}
							
						} else if ( func instanceof PropPath ) {
							evaled.ctxt = func._evaled.ctxt;
							evaled.func = func.valueOf();
						
						} else {						
							evaled.func = func.valueOf();
							evaled.ctxt = null;
						}
					}
					
					if ( this._evalArgs ) {
						//check, if args depends on from
						if ( !evaled.args || args === from ) {
							if ( args instanceof Expression && args._value.op === "," ) {
								evaled.args = Array.prototype.slice.call( args._value );
								
								var i = evaled.args.length;
								while ( i-- )
									evaled.args[ i ] = evaled.args[ i ] && evaled.args[ i ].valueOf();
							
							} else {
								evaled.args = args && args.valueOf();
							}
						}
					} else {
						evaled.args = args;
					}
					
					this._call();
					
					for ( var id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				_call : function() {
					var evaled = this._evaled,
						value  = this._value;
					
					try {
						if ( !evaled.func ) {
							this.invalidate();
							return evaled.value;
						}
						
						var i = this._calls;
						if ( value.args instanceof Expression && value.args._value.op === "," )
							while ( i-- ) 
								evaled.value = evaled.func.apply( evaled.ctxt || window, evaled.args );
						else
							while ( i-- ) 
								evaled.value = evaled.func.call( evaled.ctxt || window, evaled.args );
						
						return evaled.value;
					
					} catch( e ) {
						error( "A reactive function call causes problems: " + e.message );
					}
				},
				remove : function() {
					if ( this._calls-1 < countProps( this._partOf, true ) ) {
						for ( var id in this._partOf )
							error( "Cannot deregister function call. It is still used in " + String( this._partOf[ id ] ) + "!" );
					}
					
					if ( this._calls -= 1 )
						return true;
					
					this.unlink();
					delete FunctionCall.prototype._calls[ this._guid ];
					
					Reactive.prototype.remove.call( this );
					
					return true;
				}
			} );
			
			var PropPath = function( path, rev, val, del ) {
				var p = this instanceof PropPath ? this : Object.create( PropPath.prototype );
				
				p._guid = Reactive.prototype._guid++;
				!dontTrack && ( PropPath.prototype._paths[ p._guid ] = p );
				
				var i, l = path._value.length-1;
				p._partOf = {};
				p._value  = {
					path : path
				};
				
				!dontTrack && p.link( "path" );
				
				p._evaled = {
					ctxt : path._value[ 0 ].valueOf(),
					prop : path._value[ l ].valueOf()
				};
				
				for ( i = 2; i<l; i++ )
					p._evaled.ctxt = p._evaled.ctxt[ path._value[ i ].valueOf() ];
				
				if ( arguments.length > 1 )
					p.set( rev, val, del );
				
				return p;
			};
			
			PropPath.prototype = Reactive( {
				_paths : {},
				
				_search : function( path ) {
					for ( var id in PropPath.prototype._paths )
						if ( equiv( path, PropPath.prototype._paths[ id ]._value.path._value ) )
							return PropPath.prototype._paths[ id ];
					
					return undefined;
				},
				
				valueOf : function() {
					return this._evaled.ctxt[ this._evaled.prop ];
				},
				toString : function() {
				
				},
				
				invalidate : function( from ) {
					var id, pathUpdate = false;
					
					if ( from !== undefined ) {
						if ( from === this._value.path )
							this._updatePath();
						else
							this._updateValue();
					}
					
					for ( id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				set : function( rev, val, del ) {
					var evaled = this._evaled,
						value  = this._value;
					
					this.unlink( "value" );
					
					value.value = val;
					
					!dontTrack && this.link( "value" );
					
					evaled.value = val && val.valueOf();
					value.del = del;
					
					if ( rev && !value.rev ) {
						value.backupVal = evaled.ctxt[ evaled.prop ];
						value.backupDel = evaled.prop in evaled.ctxt ? false : true;
					}
					
					value.rev = rev;
					
					//set new object property value
					if ( value.del )
						delete evaled.ctxt[ evaled.prop ];
					else
						evaled.ctxt[ evaled.prop ] = evaled.value;
					
					this.invalidate();
					
					return this;
				},
				_updatePath : function() {
					var evaled = this._evaled,
						value  = this._value,
						path   = this._value.path._value;
					
					//revert value of old path, if marked so
					if ( value.rev ) {
						if ( value.backupDel )
							delete evaled.ctxt[ evaled.prop ];
						else
							evaled.ctxt[ evaled.prop ] = value.backupVal;
					}
					
					//get new obj and prop
					var i, l = path.length-1;
					evaled.ctxt = path[ 0 ].valueOf();
					evaled.prop = path[ l ].valueOf();
					
					if ( typeof evaled.ctxt !== "object" )
						error( "Invalid property path: " + String( value.path ) + "!" );
					
					for ( i = 2; i<l; i++ ) {
						evaled.ctxt = evaled.ctxt[ path[ i ].valueOf() ];
						
						if ( typeof evaled.ctxt !== "object" )
							error( "Invalid property path " + String( value.path ) + "!" );
					}
					
					//get new backup values
					value.backupVal = evaled.ctxt[ evaled.prop ];
					value.backupDel = evaled.prop in evaled.ctxt ? false : true;
					
					//set object property value
					if ( "value" in value ) {
						if ( value.del )
							delete evaled.ctxt[ evaled.prop ];
						else
							evaled.ctxt[ evaled.prop ] = evaled.value;
					}
				},
				_updateValue : function() {
					var evaled = this._evaled,
						value  = this._value;
					
					evaled.value = value.value.valueOf();
					
					//set new object property value
					if ( value.del )
						delete evaled.ctxt[ evaled.prop ];
					else
						evaled.ctxt[ evaled.prop ] = evaled.value;
				},
				remove : function() {
					var evaled = this._evaled,
						value  = this._value;
					
					//revert value of old path, if marked so
					if ( value.rev ) {
						if ( value.backupDel )
							delete evaled.ctxt[ evaled.prop ];
						else
							evaled.ctxt[ evaled.prop ] = value.backupVal;
					}
					
					this.unlink();
					delete PropPath.prototype._paths[ this._guid ];
					
					Reactive.prototype.remove.call( this );
					
					return true;
				}
			} );
			
			//name table of interpreter
			var NameTable = function( base ) {
					var t;
					if ( this instanceof NameTable )
						t = this;
					else
						t = Object.create( NameTable.prototype );
					
					t.table = base;
					
					return t;
				};
			
			NameTable.prototype = {
				table  : null,
				clean : function( vars ) {
					var ret = true,
						del = false,
						key,
						v;
					
					for ( key in this.table ) {
						v = this.table[ key ];
						
						if ( this.table.hasOwnProperty( key ) && ( !vars || !(key in vars) ) && !v._isConst && isEmptyObj( v._partOf ) ) {
							ret = ret && v.remove();
							delete this.table[ key ];
							del = true;
						}
					}
					
					return del ? this.clean( vars ) : ret;
				},
				set : function( key, val ) {
					if ( key in this.table ) {
						if ( this.table[ key ]._isConst )
							error( "Bad lvalue: variable is immutable (constant)." );
						
						return this.table[ key ].set( val );
					}
					
					var v = Variable( key, val );
					return this.table[ v._key ] = v;
				},
				remove : function( key ) {
					if ( key in this.table ) {
						if ( this.table[ key ]._isConst )
							error( "Bad lvalue: variable is immutable (constant)." );
						
						for ( var id in this.table[ key ]._partOf )
							if ( this.table[ key ]._partOf.hasOwnProperty( id ) ) {
								var partOf = this.table[ key ]._partOf[ id ];
								
								while ( partOf instanceof Expression ) {
									for ( id in partOf._partOf )
										partOf = partOf._partOf[ id ];
								}
								
								error( "Cannot delete variable " + key + ". It is still used in: " + partOf.toString() + "." );
							}
						
						var ret = this.table[ key ].remove();
						
						delete this.table[ key ];
						
						return ret;
					}
					
					return true;
				}
			};
			
			//initializing interpreter
			var mathModule = ( function() {
					var ret = {
						pi		: Math.PI,
						e		: Math.E,
						ln2		: Math.LN2,
						ln10	: Math.LN10,
						log2e	: Math.LOG2E,
						log10e	: Math.LOG10E,
						sqrt2	: Math.SQRT2,
						sqrt1_2	: Math.SQRT1_2,
						abs 	: Math.abs,
						sgn 	: function( n ) {
									return n > 0 ? 1 : n < 0 ? -1 : 0;
								},
						floor 	: Math.floor,
						ceil 	: Math.ceil,
						round 	: Math.round,
						exp 	: Math.exp,
						log 	: Math.log,
						sin 	: Math.sin,
						asin 	: Math.asin,
						cos 	: Math.cos,
						acos 	: Math.acos,
						tan 	: Math.tan,
						atan 	: Math.atan
					};
					
					ret.abs.projection = ret.sgn.projection =
					ret.floor.projection = ret.ceil.projection =
					ret.round.projection = true;
					
					ret.exp.inverse = ret.log;
					ret.log.inverse = ret.exp;
					ret.sin.inverse = ret.asin;
					ret.asin.inverse = ret.sin;
					ret.cos.inverse = ret.acos;
					ret.acos.inverse = ret.cos;
					ret.tan.inverse = ret.atan;
					ret.atan.inverse = ret.tan;
					
					return ret;
				}() );
			
			var setupVars = function( consts, base, parseFunc ) {
					var table = base ? Object.create( base ) : {};
					
					if ( consts ) {
						consts = consts === "math" ? mathModule : consts;
						
						for ( var key in consts ) {
							if ( consts.hasOwnProperty( key ) ) {
								table[ key ] = Variable( key, consts[ key ], true );
							}
						}
					}
					
					return NameTable( Object.create( table ) );
				},
				setupOps = function( ops, base ) {
					if ( !ops || !ops.length )
						return base || operators;
					
					var not = ops.op === "not",
						ret = base ? Object.create( base ) : not ? Object.create( operators ) : {};
					
					for ( var idx = not ? 1 : 0, len = ops.length; idx < len; idx++ ) {
						if ( not ) {
							ret[ ops[ idx ] ] = undefined;
							if ( ops[ idx ] === "=" ) {
								ret[ "(op=)" ] = undefined;
								ret[ "delete" ] = undefined;
							}
						
						} else {
							ret[ ops[ idx ] ] = operators[ ops[ idx ] ];
							if ( ops[ idx ] === "=" ) {
								ret[ "(op=)" ] = operators[ "(op=)" ];
								ret[ "delete" ] = operators[ "delete" ];
							}
						}
					}
					
					return ret;
				},
				setupLits = function( lits, base ) {
					if ( !lits || !lits.length )
						return base || {
							"null" : true,
							"boolean" : true,
							number : true,
							string : true,
							"obj" : true,
							"id" : true
						};
					
					var not = lits.op === "not",
						ret = Object.create( base ) || {};
					
					for ( var idx = 0; idx < lits.length; idx++ ) {
						if ( not )
							ret[ lits[ idx ] ] = undefined;
						else
							ret[ lits[ idx ] ] = true;
					}
					
					return ret;
				};
			
			return function Interpreter( template, consts, litTable, opTable ) {
				var react = function() {
						var ret, tmp;
						
						ret = tmp = interpret.apply( props, arguments );
						
						if ( ret && ret instanceof Reactive )
							ret = ret.valueOf();
						
						if ( tmp instanceof Expression )
							tmp.unlink();
						
						return ret;
					},
					props = {
						litTable  : setupLits( litTable, template && template.litTable ),
						opTable   : setupOps( opTable, template && template.opTable ),
						nameTable : setupVars( consts, template && template.nameTable, react )
					};
				
				if ( template === "debugger" ) {
					delete template;
					
					react.leak = function() {
						try {
							var ret;
							
							if ( arguments[ 0 ] === "no partOf" ) {
								dontTrack = true;
								arguments = Array.prototype.slice.call( arguments, 1 );
							}
							
							ret = interpret.apply( props, arguments );
							
							if ( ret instanceof Expression && !dontTrack )
								ret = props.nameTable.set( ret.guid, ret );
							
							dontTrack = false;
							
							return ret;
						
						} catch ( error ) {
							dontTrack = false;
							
							throw ( error );
						}
					}
					
					react.leak.nameTable	= props.nameTable;
					react.leak.Variable		= Variable;
					react.leak.Expression	= Expression;
					react.leak.FunctionCall = FunctionCall;
					react.leak.PropPath		= PropPath;
				}
				
				react.Interpreter = Interpreter;
				
				return react;
			};
		}() );
	
	//expose
	this.react = Interpreter( null, "math" );
}.call() );
