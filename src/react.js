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
			
			if ( !arr1 || arr1.constructor !== Array || !arr2 || arr2.constructor !== Array ||
				 arr1.length !== arr2.length)
				return false;
			
			var i = arr1.length;
			while ( i-- ) {
				if ( arr1[ i ].constructor === Array ) {
					if ( equiv( arr1[ i ], arr2[ i ] ) )
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
			
			var doWithReactive = function( rea, f ) {
				var depId;
				
				if ( !rea )
					return true;
				
				if ( rea._isExprArray ) {
					for ( depId in rea._dep ) {
						if ( f.call( this, rea._dep[ depId ] ) === false )
							return false;
					}
				
				} else if ( rea._isVar && !rea._locked ) {
					if ( f.call( this, rea ) === false )
						return false;
				}
				
				return true;
			};
			
			//value array properties
			var makeExprArray = ( function() {
					var valueOf = function() {
							try {
								var op = this[ 0 ],
									idx,
									ret,
									cur,
									context;
								
								context = Array.prototype.slice.apply( this._context || arguments );
								idx = context.length;
								while( idx-- )
									context[ idx ] = context[ idx ].valueOf();
								
								idx = this.length;
								if ( idx === 2 ) {
									//unary
									if ( this[ 1 ]._isVar || this[ 1 ]._isExprArray || this[ 1 ]._isCall )
										cur = this[ 1 ].valueOf.apply( this[ 1 ], context );
									else
										cur = this[ 1 ];
									
									return operators[ op ].nudEval.call( this, cur, ret );
								}
								
								//binary with two or more operands
								while( idx--, idx > 0 ) {
									if ( this[ idx ]._isVar || this[ idx ]._isExprArray || this[ idx ]._isCall )
										cur = this[ idx ].valueOf.apply( this[ idx ], context );
									else
										cur = this[ idx ];
									
									ret = ( ret === undefined  ) ? cur : operators[ op ].ledEval.call( this, cur, ret );
								}
								
								return ret;
							
							} catch( e ) {
								error( "valArray.valueOf: " + e.message );
							}
						},
						toString = function() {
							try {
								var str = "",
									op = this[ 0 ];
								
								for ( var idx = 1, len = this.length; idx < len; idx++ ) {
									if ( !this[ idx ] ) {
										str += this[ idx ];
									
									} else if ( this[ idx ]._isExprArray ) {
										//replace + with - in case of negative number and summation
										if ( op === "+" && this[ idx ][ 0 ] === "*" && this[ idx ][ 1 ] < 0 ) {
											str = str.slice( 0, -op.length );
										}
										
										if ( ( op === "*" && this[ idx ][ 0 ] === "+" ) || op === "^" )
											str += "(";
										
										str += toString.call( this[ idx ] );
										
										if ( ( op === "*" && this[ idx ][ 0 ] === "+" ) || op === "^" )
											str += ")";
									
									} else {
										if ( op === "^" && idx > 2 && len > 3 )
											str = "(" + str;
										
										if ( idx === 1 && op === "*" && this[ idx ] === -1 ) {
											str += "-";
											continue;
										}
										
										if ( this[ idx ]._isVar ) {
											if ( this[ idx ]._isNamed )
												str += this[ idx ]._key;
											else
												str += "{" + this[ idx ].toString() + "}";
										
										} else {
											if ( typeof this[ idx ] === "number" && op === "+" && this[ idx ] < 0 ) {
												str = str.slice( 0, -op.length );
												str += "-" + Math.abs( this[ idx ] );
											} else {
												str += this[ idx ];
											}
										}
										
										if ( op === "^" && idx < len-1 && len > 3 )
											str += ")";
									}
									
									if ( idx > 1 ) {
										if ( op === "(" )
											str += " ) ";
										else if ( op === "[" )
											str += " ] ";
										else if ( op === "{" )
											str += " } ";
									}
									
									if ( idx < len-1 )
										str += " " + op + " ";
								}
								
								return str;
							
							} catch( e ) {
								error( "valArray.toString:" + e.message );
							}
						},
						_prevValueOf = function() {
							try {
								var op = this[ 0 ],
									len = this.length-1,
									ret,
									cur;
								
								if ( this.length === 2 ) {
									//unary
									if ( this[ 1 ]._isVar || this[ 1 ]._isExprArray || this[ 1 ]._isCall )
										cur = this[ 1 ]._prevValueOf.apply( this[ 1 ], arguments );
									else
										cur = this[ 1 ];
									
									return operators[ op ].nudEval.call( this, cur, ret );
								}
								
								//binary with two or more operands
								for ( var idx = this.length-1; idx > 0; idx-- ) {
									if ( this[ idx ]._isVar || this[ idx ]._isExprArray || this[ idx ]._isCall )
										cur = this[ idx ]._prevValueOf.apply( this[ idx ], arguments );
									else
										cur = this[ idx ];
									
									ret = ( ret === undefined  ) ? cur : operators[ op ].ledEval.call( this, cur, ret );
								}
								
								return ret;
							
							} catch( e ) {
								error( "valArray._prevValueOf: " + e.message );
							}
						},
						addDep = function() {
							//add new dependancies
							var i, l = arguments.length, arg, id;
							
							if ( l && this._dep === null )
								this._dep = Object.create( DepObj.prototype );
							
							for ( i = 0; i < l; i++ ) {
								arg = arguments[ i ];
								
								if ( !arg )
									continue;
								
								if ( arg instanceof DepObj ) {
									for ( id in arg ) {
										this._dep[ arg[ id ]._guid ] = arg[ id ];
									}
								
								} else if ( arg && ( arg._isVar || arg._isCall ) ) {
									this._dep[ arg._guid ] = arg;
								}
							}
							
							return this;
						},
						_checkDep = function( _dep ) {
							var i, l, id1, id2;
							
							if ( _dep.constructor === Array ) {
								_dep = _dep._dep;
								DEPLOOP : for ( id2 in _dep ) {
									for ( i = 1, l = this.length; i < l; i++ ) {
										if ( this[ i ] && this[ i ].constructor === Array ) {
											for ( id1 in this[ i ]._dep ) {
												if ( this[ i ]._dep[ id1 ] === _dep[ id2 ] )
													continue DEPLOOP;
											}
										
										} else {
											if ( this[ i ] === _dep[ id2 ] )
												continue DEPLOOP;
										}
									}
									
									delete this._dep[ id2 ];
								}
							
							} else {
								for ( i = 1, l = this.length; i < l; i++ ) {
									if ( this[ i ] && this[ i ].constructor === Array ) {
										for ( id1 in this[ i ]._dep ) {
											if ( this[ i ]._dep[ id1 ] === _dep ) {
												return;
											}
										}
									
									} else {
										if ( this[ i ] === _dep ) {
											return;
										}
									}
								}
								
								delete this._dep[ _dep._guid ];
							}
						},
						del = function() {
							var ret = true;
							//delete partOfs on dependencies side
							for ( id in this._dep ) {
								if ( this._dep[ id ]._partOf )
									ret = ret && delete this._dep[ id ]._partOf[ this._guid ];
							}
							
							return ret;
						},
						_makeVar = function() {
							delete this._checkDep;
							delete this.addDep;
							delete this._makeVar;
							delete this.makeCtxtArray;
						},
						inCtxt = function( ctxt ) {
							delete this._isValArray;
							this._isCtxtArray = true;
							this._context = ctxt;
							return this;
						};
					
					return function( arr ) {
						var i, l, id, arg;
						
						arr.valueOf 	 = valueOf;
						arr.toString     = toString;
						arr._prevValueOf = _prevValueOf;
						
						arr._makeVar		 = _makeVar;
						arr.inCtxt       = inCtxt;
						
						arr._isValArray  = true;
						arr._isExprArray = true;
						arr._dep		 = arr._dep || null;
						arr._checkDep 	 = _checkDep;
						arr.addDep		 = addDep;
						arr[ "delete" ]  = del;
						
						arr.addDep.apply( arr, Array.prototype.slice.call( arguments, 1 ) );
						
						if ( arr[ 0 ] === "." )
							arr._propAccess = true;
						
						return arr;
					};
				}() );
			
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
							this.first = expr.o[ expr.p ];
							this.second = undefined;
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
							this.first = expr.o[ expr.p ];
							this.second = undefined;
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
							this.first = undefined;
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
							this.first = expr.o[ expr.p ];
							this.second = undefined;
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
							this.first = undefined;
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
							this.first = expr.o[ expr.p ];
							this.second = undefined;
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
												
												if ( operand && operand._isValArray ) {
													//reactive value arrays are referenced externally, copy them
													operand = makeExprArray( operand.slice( 0 ), operand._dep );
													type = "arr";
												} else {
													type = !operand || type === "number" || type === "string" || type === "boolean" ? 
																"lit" :
															operand._isValArray ?
																"arr" :
															operand._isVar || operand._isCtxtArray || operand._isCall ?
																"ref" :
																"lit";
												}
												
												return op.nudEval[ type ].apply( this, arguments );
											};
							
							if ( type === "prefix" )
								op.nudEval = function( operand, undef, interpreter ) {
									//check for overloaded operators
									if ( operand && operand[ id ] )
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
												
												typeL = typeof left;
												if ( left && left._isValArray ) {
													//reactive value arrays are referenced externally, copy them
													left = makeExprArray( left.slice( 0 ), left._dep );
													typeL = "arr";
												} else {
													typeL = !left ? 
																"lit" :
															left._isValArray ?
																"arr" :
															left._isVar || left._isCtxtArray || left._isCall || ( left._value && left._value._isValArray ) ?
																"ref" :
																"lit";
												}
												
												typeR = typeof right;
												if ( right && right._isValArray ) {
													//reactive value arrays are referenced externally, copy them
													right = makeExprArray( right.slice( 0 ), right._dep );
													typeR = "arr";
												} else {
													typeR = !right ? 
																"lit" :
															right._isValArray ?
																"arr" :
															right._isVar || right._isCtxtArray || right._isCall || ( right._value && right._value._isValArray ) ?
																"ref" :
																"lit";
												}
												
												return op.ledEval[ typeL ][ typeR ].apply( this, arguments );
											};
							
							if ( type !== "assignment" )
								op.ledEval = function( left, right, interpreter ) {
									//check for overloaded operators
									if ( left && left[ id ] )
										return left[ id ].call( left, right );
									
									if ( right && right[ id ] )
										return right[ id ].call( right, left, true );
									
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
				
				if ( !vars._isVar && ( !vars._isValArray || vars[ 0 ] !== "," ) )
					error( "'except' has to be followed by a list of one or more variable names" );
				
				var varObj = {};
				if ( vars._isValArray ) {
					vars.shift();
					
					var i = vars.length;
					
					while ( i-- ) {
						if ( vars[ i ] )
							varObj[ vars[ i ]._key ] = vars[ i ];
					}
				
				} else if ( vars ) {
					varObj[ vars._key ] = vars;
				}
				
				return interpreter.nameTable.clean( varObj );
			} );
			
			operator( ",", "infix", 5, null, ( function() {
					var ret = {},
						func = function( left, right ) {
							return makeExprArray(
								[ ",", left, right ],
								left,
								right && right._isValArray ? right._dep : right
							);
						},
						funcArr = function( left, right ) {
							if ( right._isValArray && right[ 0 ] === "," ) {
								right.unshift( left );
								right.addDep( left._dep );
								
								return right;
							}
							
							return makeExprArray(
								[ ",", left, right ],
								left._dep,
								right && right._isValArray ? right._dep : right
							);
						},
						arrFunc = function( left, right ) {
							if ( left[ 0 ] === "," ) {
								if ( right._isValArray && right[ 0 ] === "," ) {
									right.splice( 0, 0, left.length, 0 );
									left.splice.apply( left, right );
									left.addDep( right._dep );
								} else {
									left.push( right );
									left.addDep( right );
								}
								
								return left;
							
							} else if ( right._isValArray && right[ 0 ] === "," ) {
								right.unshift( left );
								right.addDep( left._dep );
								
								return right;
							}
							
							return makeExprArray(
								[ ",", left, right ],
								left._dep,
								right && right._isValArray ? right._dep : right
							);
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
			
			var updateProp = function( path ) {
					var oldO, oldP,
						i = 2, l = path.length-1,
						ctxtProp,
						pathObj = reactPaths.search( path );
					
					//get old ctxt and old prop
					oldO = path[ 1 ]._prevValueOf ? path[ 1 ]._prevValueOf() : path[ 1 ];
					for ( i = 2; i<l; i++ )
						oldO = [ path[ i ]._prevValueOf ? path[ i ]._prevValueOf() : path[ i ] ];
					
					oldP = path[ l ]._prevValueOf ? path[ l ]._prevValueOf() : path[ l ];
					
					//restore value of old ctxt and prop
					revProps.rev( oldO, oldP, pathObj );
					
					//update object property value
					ctxtProp = reactPaths.inCtxtProp( path );
					revProps.set( ctxtProp.ctxt, ctxtProp.prop, pathObj );
				};
			
			var revProps = [];
				
				revProps.set = function( ctxt, prop, pathObj ) {
					//get new ctxt and prop
					var propIdx = this.search( ctxt, prop ),
						pathIdx,
						path = pathObj.path,
						val = pathObj.val,
						del = pathObj.del,
						rev = pathObj.rev,
						pathIdx,
						reactProp;
					
					//test for reactive value and make it literal
					if ( val && ( val._isVar || val._isExprArray ) )
						val = val.valueOf();
					
					if ( rev ) {
						if ( propIdx === undefined ) {
							reactProp = {
								ctxt : ctxt,
								prop : prop,
								backupDel : !(prop in ctxt),
								backup : ctxt[ prop ],
								val : val,
								del : del,
								reactPaths : [ path ]
							};
							
							this.push( reactProp );
						
						} else {
							reactProp = this[ propIdx ];
							
							//test, if path is known to this object property
							var pathIdx = reactProp.reactPaths.length;
							while ( pathIdx-- ) {
								if ( equiv( reactProp.reactPaths[ pathIdx ], path ) ) {
									break;
								}
							}
							
							//path has not been registered previously for this object property
							//add it
							if ( pathIdx < 0 )
								reactProp.reactPaths.push( path );
							
							//update value
							reactProp.val = val;
							reactProp.del = del;
						}
					}
					
					//update property
					if ( del )
						return delete ctxt[ prop ];
					else
						return ctxt[ prop ] = val;
				};
				
				revProps.rev = function( ctxt, prop, pathObj ) {
					var propIdx = revProps.search( ctxt, prop ),
						pathIdx,
						reactProp;
					
					if ( !pathObj.rev )
						return true;
					
					if ( propIdx === undefined )
						return false;
					
					reactProp = revProps[ propIdx ];
					
					//remove path
					pathIdx = reactProp.reactPaths.length;
					while ( pathIdx-- ) {
						if ( equiv( pathObj.path, reactProp.reactPaths[ pathIdx ] ) ) {
							reactProp.reactPaths.splice( pathIdx, 1 );
							break;
						}
					}
					
					//restore value
					if ( reactProp.reactPaths.length === 0 ) {
						if ( reactProp.backupDel )
							delete reactProp.ctxt[ reactProp.prop ];
						else
							reactProp.ctxt[ reactProp.prop ] = reactProp.backup;
						
						revProps.splice( propIdx, 1 );
					}
					
					return true;
				};
				
				revProps.search = function( ctxt, prop ) {
					for ( var i in this ) {
						if ( this[ i ].ctxt === ctxt && this[ i ].prop === prop )
							return i;
					}
					
					return undefined;
				};
				
			var reactPaths = [];
				
				reactPaths.inCtxtProp = function( path ) {
					var o = path[ 1 ].valueOf(),
						p,
						i = 2,
						l = path.length-1;
					
					while ( i<l )
						o = o[ path[ i++ ].valueOf() ];
					
					p = path[ i ].valueOf();
					
					return {
						ctxt : o,
						prop : p,
					};
				};
				
				reactPaths.search = function( path ) {
					var i = this.length;
					while ( i-- ) {
						if ( equiv( path, this[ i ].path ) ) {
							return this[ i ];
						}
					}
					
					return undefined;
				};
				
				reactPaths.set = function( path, val, del, rev ) {
					var pathObj,
						i = this.length;
					
					while ( i-- ) {
						if ( equiv( path, this[ i ].path ) ) {
							break;
						}
					}
					
					if ( i < 0 ) {
						//path is new; add it to list and bind handler
						pathObj = {
							path : path,
							val  : val,
							del  : del,
							rev  : rev
						};
						
						this.push( pathObj );
					
					} else {
						//path is known
						pathObj = this[ i ];
						
						//unbind value handlers
						if ( pathObj.val && ( pathObj.val._isVar || pathObj.val._isExprArray ) )
							FunctionCall.prototype.remove( updateProp, [ pathObj.path, pathObj.val ] );
						else
							FunctionCall.prototype.remove( updateProp, [ path ] );
						
						//update values
						pathObj.val = val;
						pathObj.del = del;
						pathObj.rev = rev;
					}
					
					//check, if new value is reactive
					if ( val && ( val._isVar || val._isExprArray ) )
						FunctionCall( updateProp, [ path, val ] );
					else
						FunctionCall( updateProp, [ path ] );
					
					return pathObj;
				};
				
				reactPaths.rmv = function( path ) {
					var i = this.length,
						key;
					
					while ( i-- ) {
						if ( equiv( path, this[ i ].path ) ) {
							var pathObj = this[ i ];
							
							if ( pathObj.val && ( pathObj.val._isVar || pathObj.val._isExprArray ) )
								FunctionCall.prototype.remove( updateProp, [ pathObj.path, pathObj.val ] );
							else
								FunctionCall.prototype.remove( updateProp, [ path ] );
							
							this.splice( i, 1 );
							
							return pathObj;
						}
					}
				};
			
			operator( "=", "assignment", 10, null, function( v, val, interpreter ) {
				if ( !v || ( !v._isVar && v.id !== "(id)" && !v._propAccess ) )
					error( "Bad lvalue: no variable or object property." );
				
				assignTo = null;	//extern variable to keep track of assignments
				
				if ( v._propAccess ) {
					//used for setting object properties
					var ctxtProp = reactPaths.inCtxtProp( v );
					
					//test literal object property path
					var i = v.length || 1;
					while( --i ) {
						if ( v[ i ] && ( v[ i ]._isVar || v[ i ]._isExprArray ) )
							break;
					}
					
					if ( i )	//complex path
						reactPaths.set( v, val, false, false );
					
					//test for reactive value
					if ( val && ( val._isVar || val._isExprArray ) ) {
						if ( !i )
							reactPaths.set( v, val, false, false );
						
						val = val.valueOf();
					} else if ( !i ) {
						reactPaths.rmv( v );
					}
					
					return ctxtProp.ctxt[ ctxtProp.prop ] = val;
				}
				
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
					expr.o.second = expr.o.first;
					
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
					expr.end = null;
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
					expr.o.second = expr.o.first;
					
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
				if ( !path || !path._propAccess )
					error( "Bad lvalue: no object property." );
				
				var ctxtProp = reactPaths.inCtxtProp(path );
				
				return revProps.set( ctxtProp.ctxt, ctxtProp.prop, reactPaths.set( path, val, false, true ) );
			} );
			
			operator( "?", "infix", 20, null, ( function() {
					var ret = {};
					
					//choice is always an array
					ret.lit = {};
					ret.lit.arr = function( cond, choice ) {
						return cond ? choice[1] : choice[2];
					};
					
					ret.ref = {};
					ret.ref.arr = function( cond, choice ) {
						return makeExprArray( [ "?", cond, choice ], cond, choice._dep );
					};
					
					ret.arr = {};
					ret.arr.arr = function( cond, choice ) {
						return makeExprArray( [ "?", cond, choice ], cond._dep, choice._dep );
					};
					
					return ret;
				}() )
			);
			
			operator( ":", "infixr", 21, null, ( function() {
					var ret = {};
					
					ret.lit = {};
					ret.lit.lit = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ] );
					};
					ret.lit.ref = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onFalse );
					};
					ret.lit.arr = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onFalse._dep );
					};
					
					ret.ref = {};
					ret.ref.lit = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue );
					};
					ret.ref.ref = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue, onFalse );
					};
					ret.ref.arr = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue, onFalse._dep );
					};
					
					ret.arr = {};
					ret.arr.lit = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue._dep );
					};
					ret.arr.ref = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue._dep, onFalse );
					};
					ret.arr.arr = function( onTrue, onFalse ) {
						return makeExprArray( [ ":", onTrue, onFalse ], onTrue._dep, onFalse._dep );
					};
					
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
							
							return makeExprArray( [ op, left, right ], right );
						},
						litarr : function( left, right ) {
							if ( left )
								return left;
							
							return makeExprArray( [ op, left, right ], right );
						}
					},
					"&&" : {
						bp : 30,
						litlit : function( lit1, lit2 ) {
							return lit1 && lit2;
						}
					}
				},
				function( op, opProps ) {
					operator( op, "infixr", opProps.bp, null, ( function() {
						var ret = {},
							
							compare = function( left, right ) {
								return makeExprArray( [ op, left, right ], left, right );
							},
							
							compareArr = function( left, right ) {
								if ( left.constructor === Array && left[ 0 ] === op ) {
									if ( right.constructor === Array && right[ 0 ] === op ) {
										//reuse right array
										right[ 0 ] = 0;
										right.unshift( left.length );
										
										//-> left.splice( left.length, 0, right[ 1 ], right[ 2 ], ... )
										Array.prototype.splice.apply( left, right );
										left.addDep( right._dep );
									
									} else {
										left.push( right );
										left.addDep( right );
									}
									
									return left;
								
								} else if ( right.constructor === Array && right[ 0 ] === op ) {
									right.splice( 1, 0, left );
									right.addDep( left );
									
									return right;
								} else {
									return makeExprArray(
										[ op, left, right ],
										left._isExprArray ? left._dep : left,
										right._isExprArray ? right._dep : right._dep
									);
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
						var ret = {},
							
							refref = function( left, right ) {
								return makeExprArray( [ op, left, right ], left, right );
							},
							refarr = function( left, right ) {
								return makeExprArray( [ op, left, right ], left, right._dep );
							},
							arrref = function( left, right ) {
								return makeExprArray( [ op, left, right ], left._dep, right );
							},
							arrarr = function( left, right ) {
								return makeExprArray( [ op, left, right ], left._dep, right._dep );
							},
						
							compare = {
								litref : refref,
								litarr : refarr,
								reflit : refref,
								refref : refref,
								refarr : refarr,
								arrlit : arrref,
								arrref : arrref,
								arrarr : arrarr
							};
						
						each( [ "lit", "ref", "arr" ], function( idxL, typeL ) {
							ret[ typeL ] = {};
							each( [ "lit", "ref", "arr" ], function( idxR, typeR ) {
								ret[ typeL ][ typeR ] = opProps[ typeL + typeR ] || compare[ typeL + typeR ];
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
								return makeExprArray(
									[ op, left, right ],
									left._isExprArray ? left._dep : left,
									right._isExprArray ? right._dep : right
								);
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
						
						if ( fst.constructor === Array && fst[ 0 ] === "^" && fst.length > 2 ) {
							base1 = fst[ 1 ];
							exp1  = fst.length > 3 ? ( fst.splice( 1, 1 ), fst ) : fst[ 2 ];
						} else {
							base1 = fst;
							exp1  = 1;
						}
						
						if ( snd.constructor === Array && snd[ 0 ] === "^" && snd.length > 2 ) {
							base2 = snd[ 1 ];
							exp2  = snd.length > 3 ? ( snd.splice( 1, 1 ), snd ) : snd[ 2 ];
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
								shared = tmp === 1 ? base1 : makeExprArray( [ "^", base1, tmp ], base1._isExprArray ? base1._dep : base1 );
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
								fst : typeof sel.fst[ 1 ] === "number" ? 2 : 1,
								snd : typeof sel.snd[ 1 ] === "number" ? 2 : 1
							}
						
						//gather shared factors from front and back
						for ( var dir in shared ) {
							while ( sel.fst !== 1 && sel.snd !== 1 ) {
								res = factorOut.call( this,
									( sel.fst && sel.fst[ 0 ] == "*" && sel.fst.length > 2 && 
									  sel.fst[ dir == "front" ? idx.fst : sel.fst.length-1 ]
									) || sel.fst,
									( sel.snd && sel.snd[ 0 ] == "*" && sel.snd.length > 2 && 
									  sel.snd[ dir == "front"  ? idx.snd : sel.snd.length-1 ]
									) || sel.snd
								);
								
								if ( res.shared === 1 )
									break;
								
								//add shared factor to output
								if ( shared[ dir ] === 1 ) {
									shared[ dir ] = res.shared;
								
								} else {
									if ( !shared[ dir ]._isValArray )
										shared[ dir ] = makeExprArray( [ "*", shared[ dir ] ], shared[ dir ] );
									
									shared[ dir ].push( res.shared );
									shared[ dir ].addDep( res.shared._isExprArray ? res.shared._dep : res.shared );
								}
								
								//reorganize fst/snd
								for ( var key in sel ) {
									if ( sel[ key ] && sel[ key ][ 0 ] == "*" && sel[ key ].length > 2 ) {
										if ( res[ key ] !== 1 ) {
											sel[ key ][ dir == "front" ? idx[ key ] : sel[ key ].length-1 ] = res[ key ];
										
										} else if ( sel[ key ].length > 3 ) {
											if ( dir == "front" )
												sel[ key ].splice( idx[ key ], 1 );
											else
												sel[ key ].pop();
											
											sel[ key ]._checkDep( sel[ key ] );
										
										} else { // sel[ key ].length === 3
											sel[ key ] = sel[ key ][ dir == "front" ? ( idx[ key ] === 2 ? 1 : 2 ) : 1 ];
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
							fst_num, snd_num,
							fst_idx, snd_idx,
							fst_len, snd_len,
							fst_isOpArray, snd_isOpArray;
						
						snd_isOpArray = snd && snd[ 0 ] === "+" && snd.length > 2;
						snd_len = ( snd_isOpArray && snd.length-1 ) || 2;
						snd_idx = 0;
						
						fst_isOpArray = fst && fst[ 0 ] === "+" && fst.length > 2;
						fst_len = ( fst_isOpArray && fst.length ) || 2;
						
						SNDLOOP : while ( snd_idx < snd_len && snd_sel !== snd ) {
							snd_sel = snd_isOpArray ? snd[ ++snd_idx ] : snd;
							snd_num = typeof snd_sel === "number";
							
							fst_idx = fst_len;
							while ( fst_idx > 1 && fst_sel !== fst ) {
								fst_sel = fst_isOpArray ? fst[ --fst_idx ] : fst;
								fst_num = typeof fst_sel === "number";
								
								if ( snd_num ) {
									if ( !fst_num )
										continue;
									
									fst_sel += snd_sel;
									
									if ( fst_isOpArray ) {
										if ( fst_sel !== 0 ) {
											fst[ fst_idx ] = fst_sel;
										
										} else {
											if ( fst.length > 3 ) {
												fst.splice( fst_idx, 1 );
											} else {
												fst = fst_idx === 2 ? fst[ 1 ] : fst[ 2 ];
												fst_isOpArray = false;
											}
										}
									
									} else {
										fst = fst_sel;
									}
									
									continue SNDLOOP;
								
								} else {
									if ( fst_num )
										continue;
									
									res = factorOutProducts.call( this, fst_sel, snd_sel );
									
									if ( res.front !== 1 || res.back !== 1 ) {
										var sum = operators[ "+" ].ledEval.call( this, res.fst, res.snd );
										
										if ( sum === 0 ) {
											if ( fst_isOpArray ) {
												if ( fst.length > 3 ) {
													fst.splice( fst_idx, 1 );
													fst._checkDep( fst_sel );
												} else {
													fst = fst_idx === 2 ? fst[ 1 ] : fst[ 2 ];
													fst_isOpArray = false;
												}
											
											} else {
												fst = 0;
											}
											
											continue SNDLOOP;
										
										} else if ( res.front !== 1 && res.back !== 1 ) {
											//shared front and back
											//reuse existing arrays
											if ( res.front._isValArray && res.front[ 0 ] === "*" ) {
												fst_sel = res.front;
												
												if ( sum._isValArray && sum[ 0 ] === "*" ) {
													sum.shift();
													fst_sel.push.apply( sum );
													fst_sel.addDep( sum._dep )
												} else {
													if ( sum._isValArray )
														fst_sel.push( sum );
													else
														fst_sel.splice( 1, 0, sum );
													
													fst_sel.addDep( sum )
												}
												
												if ( res.back._isValArray && res.back[ 0 ] === "*" ) {
													res.back.shift();
													fst_sel.push.apply( res.back );
													fst_sel.addDep( res.back._dep )
												} else {
													fst_sel.push( res.back );
													fst_sel.addDep( res.back )
												}
											
											} else if ( sum._isValArray && sum[ 0 ] === "*" ) {
												fst_sel = sum;
												
												fst_sel.splice( 1, 0, res.front );
												fst_sel.addDep( res.front )
												
												if ( res.back._isValArray && res.back[ 0 ] === "*" ) {
													res.back.shift();
													fst_sel.push.apply( res.back );
													fst_sel.addDep( res.back._dep )
												} else {
													fst_sel.push( res.back );
													fst_sel.addDep( res.back )
												}
											
											} else if ( res.back._isValArray && res.back[ 0 ] === "*" ) {
												fst_sel = res.back;
												
												fst_sel.splice( 1, 0, res.front, sum );
												fst_sel.addDep( res.front, sum )
											
											} else {
												fst_sel = makeExprArray(
													[ "*", sum._isValArray ? res.front : sum, sum._isValArray ? sum : res.front, res.back ],
													res.front._isExprArray ? res.front._dep : res.front,
													sum._isExprArray 	  ? sum._dep : sum,
													res.back._isExprArray  ? res.back._dep : res.back
												);
											}
										
										} else if ( res.front !== 1 ) {
											//shared front only
											//reuse existing arrays
											if ( res.front._isValArray && res.front[ 0 ] === "*" ) {
												fst_sel = res.front;
												
												if ( sum._isValArray && sum[ 0 ] === "*" ) {
													sum.shift();
													fst_sel.push.apply( sum );
													fst_sel.addDep( sum._dep )
												} else {
													if ( sum._isValArray )
														fst_sel.push( sum );
													else
														fst_sel.splice( 1, 0, sum );
													
													fst_sel.addDep( sum )
												}
											
											} else if ( sum._isValArray && sum[ 0 ] === "*" ) {
												fst_sel = sum;
												
												fst_sel.splice( 1, 0, res.front );
												fst_sel.addDep( res.front )
											
											} else {
												fst_sel = makeExprArray(
													[ "*", sum._isValArray ? res.front : sum, sum._isValArray ? sum : res.front ],
													res.front._isExprArray ? res.front._dep : res.front,
													sum._isExprArray 	  ? sum._dep : sum
												);
											}
										
										} else if ( res.back !== 1 ) {
											//shared back only
											//reuse existing arrays
											if ( sum._isValArray && sum[ 0 ] === "*" ) {
												fst_sel = sum;
												
												if ( res.back._isValArray && res.back[ 0 ] === "*" ) {
													res.back.shift();
													fst_sel.push.apply( res.back );
													fst_sel.addDep( res.back._dep )
												} else {
													fst_sel.push( res.back );
													fst_sel.addDep( res.back )
												}
											
											} else if ( res.back._isValArray && res.back[ 0 ] === "*" ) {
												fst_sel = res.back;
												
												fst_sel.splice( 1, 0, sum );
												fst_sel.addDep( sum )
											
											} else {
												fst_sel = makeExprArray(
													[ "*", sum, res.back ],
													sum._isExprArray 	 ? sum._dep : sum,
													res.back._isExprArray ? res.back._dep : res.back
												);
											}
										}
										
										if ( fst_isOpArray )
											fst[ fst_idx ] = fst_sel;
										else
											fst = fst_sel;
										
										continue SNDLOOP;
									}
								}
							}
							
							//fst does not share summand parts with snd_sel, so just append snd_sel
							if ( fst_isOpArray ) {
								fst.push( snd_sel );
								fst.addDep( snd_sel._isExprArray ? snd_sel._dep : snd_sel );
								fst_len += 1;
							
							} else if ( fst !== 0 ){
								fst = makeExprArray(
									[ "+", fst, snd_sel ],
									snd_sel._isExprArray ? snd_sel._dep : snd_sel,
									fst._isExprArray     ? fst._dep     : fst
								);
								fst_isOpArray = true;
								fst_len = 3;
							
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
						
						return makeExprArray( swap ? [ "+", lit, ref ] : [ "+", ref, lit ], ref );
					},
					ref : function( ref1, ref2 ) {
						if ( ref1 === ref2 )
							return makeExprArray( [ "*", 2, ref1 ], ref1 );
						
						return makeExprArray( [ "+", ref1, ref2 ], ref1, ref2 );
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
						
						if ( fst && fst._isValArray && fst[ 0 ] === "^" && fst.length > 2 ) {
							base1 = fst[ 1 ];
							exp1  = fst.length > 3 ? ( fst.splice( 1, 1 ), fst ) : fst[ 2 ];
						} else {
							base1 = fst;
							exp1  = 1;
						}
						
						if ( snd && snd._isValArray && snd[ 0 ] === "^" && snd.length > 2 ) {
							base2 = snd[ 1 ];
							exp2  = snd.length > 3 ? ( snd.splice( 1, 1 ), snd ) : snd[ 2 ];
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
						
						snd_isOpArray = snd && snd[ 0 ] === "*" && snd.length > 2;
						snd_len = ( snd_isOpArray && snd.length-1 ) || 2;
						snd_idx = 0;
						
						fst_isOpArray = fst && fst[ 0 ] === "*" && fst.length > 2;
						fst_len = ( fst_isOpArray && fst.length ) || 2;
						
						while ( snd_idx < snd_len && snd_sel !== snd ) {
							snd_sel = snd_isOpArray ? snd[ ++snd_idx ] : snd;
							snd_num = typeof snd_sel === "number";
							
							if ( snd_num ) {
								//checking first entry of fst for number is sufficient
								fst_idx = 1;
								fst_sel = fst_isOpArray ? fst[ fst_idx ] : fst;
								
								if ( typeof fst_sel === "number" ) {
									fst_sel *= snd_sel;
									
									if ( fst_isOpArray ) {
										if ( fst_sel !== 1 ) {
											fst[ fst_idx ] = fst_sel;
										
										} else {
											if ( fst.length > 3 ) {
												fst.splice( fst_idx, 1 );
											} else {
												fst = fst_idx === 2 ? fst[ 1 ] : fst[ 2 ];
												fst_isOpArray = false;
											}
										}
									
									} else {
										fst = fst_sel;
									}
								
								} else {
									if ( fst_isOpArray ) {
										fst.splice( 1, 0, snd_sel );
										fst_len += 1;
									
									} else {
										fst = makeExprArray(
											[ "*", snd_sel, fst ],
											fst._isExprArray     ? fst._dep     : fst
										);
										fst_isOpArray = true;
										fst_len = 3;
									}
								}
								
							} else {
								//comparing factors with last entry of fst is sufficient
								fst_idx = fst_len;
								fst_sel = fst_isOpArray ? fst[ --fst_idx ] : fst;
								
								res = factorOutPowers.call( this, fst_sel, snd_sel );
								
								if ( res.base ) {
									//part of product shared
									var pow = operators[ "^" ].ledEval.call( this, res.base, res.exp );
									
									if ( pow === 1 ) {
										if ( fst_isOpArray ) {
											if ( fst.length > 3 ) {
												fst.splice( fst_idx, 1 );
												fst._checkDep( fst_sel );
											} else {
												fst = fst_idx === 2 ? fst[ 1 ] : fst[ 2 ];
												fst_isOpArray = false;
											}
										
										} else {
											fst = 1;
										}
									
									} else {
										if ( fst_isOpArray )
											fst[ fst_idx ] = pow;
										else
											fst = pow;
									}
								
								} else {
									//fst does not share summand parts with snd_sel, so just append snd_sel
									if ( fst_isOpArray ) {
										fst.splice( fst_len, 0, snd_sel );
										fst.addDep( snd_sel._isExprArray ? snd_sel._dep : snd_sel );
										fst_len += 1;
									
									} else if ( fst !== 1 ) {
										fst = makeExprArray(
											[ "*", fst, snd_sel ],
											fst._isExprArray     ? fst._dep     : fst,
											snd_sel._isExprArray ? snd_sel._dep : snd_sel
										);
										fst_isOpArray = true;
										fst_len = 3;
									
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
						
						return makeExprArray( [ "*", lit, ref ], ref );
					},
					ref : function( ref1, ref2 ) {
						if ( ref1 === ref2 )
							return makeExprArray( [ "^", ref1, 2 ], ref1 );
						
						return makeExprArray( [ "*", ref1, ref2 ], ref1, ref2 );
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
						
						if ( left && left._isValArray && left[ 0 ] === "%" ) {
							if ( right && right._isValArray && right[ 0 ] === "%" ) {
								right.splice( 0, 1 );
								left.push.apply( left, right );
								left.addDep( right._dep );
								
							} else {
								left.push( right );
								left.addDep( right );
							}
							
							return left;
						}
						
						if ( right && right._isValArray && right[ 0 ] === "%" ) {
							right.splice( 1, 0, left );
							right.addDep( left );
							
							return right;
						}
						
						return makeExprArray( [ "%", left, right ],
							left  && left._isExprArray  ? left._dep  : left,
							right && right._isExprArray ? right._dep : right
						);
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
						
						if ( exp && exp._isValArray && exp[ 0 ] === "^" ) {
							exp.splice( 1, 0, base );
							exp.addDep( base._isExprArray ? base._dep : base );
							
							return exp;
						
						} else if ( typeof exp === "number" && base && base._isValArray &&
									base[ 0 ] === "^" && base.length === 3 &&
									typeof base[ 2 ] === "number" ) {
							base = makeExprArray( base.slice(), base._dep );
							base[ 2 ] *= exp;
							
							return base;
						}
						
						return makeExprArray(
							[ "^", base, exp ],
							base._isExprArray ? base._dep : base,
							exp._isExprArray  ? exp._dep  : exp
						);
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
					return makeExprArray( [ "!", ref ], ref );
				},
				
				arr : function( arr ) {
					if ( arr[ 0 ] === "!" && arr[ 1 ].constructor === Array && arr[ 1 ][ 0 ] === "!" )
						return arr[ 1 ];
					else
						return makeExprArray( [ "!", arr ], arr._dep );
				}
			} );
			
			operator( "+", "prefix", 90, null, {
				lit : function( lit ) {
					return +lit;
				},
				
				ref : function( ref ) {
					return makeExprArray( [ "+", ref ], ref );
				},
				
				arr : function( arr ) {
					if ( arr && arr._isValArray && arr[ 0 ] === "+" && arr.length === 2 )
						return arr;
					
					return makeExprArray( [ "+", arr ], arr._dep );
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
					return makeExprArray( [ "typeof", ref ], ref );
				},
				
				arr : function( arr ) {
					if ( arr && arr._isValArray && arr[ 0 ] === "typeof" )
						return "string";
					
					return makeExprArray( [ "typeof", arr ], arr._dep );
				}
			} );
			
			operator( "delete", "delete", 90, null, function( v, interpreter ) {
				if ( !v || ( !v._isVar && !v._isValArray && v.id !== "(id)" && !v._propAccess ) )
					error( "Bad lvalue: no variable or object property." );
				
				if ( v._propAccess ) {
					//used for deleting object properties
					var ctxtProp = reactPaths.inCtxtProp( v );
					
					//check for literal object property path
					var i = v.length || 1;
					while( --i ) {
						if ( v[ i ] && ( v[ i ]._isVar || v[ i ]._isExprArray ) )
							break;
					}
					
					if ( i )	//complex path
						reactPaths.set( v, undefined, true, false );
					
					return delete ctxtProp.ctxt[ ctxtProp.prop ];
				}
				
				if ( v._isValArray )
					return v[ "delete" ]();
				
				return interpreter.nameTable[ "delete" ]( v._key || v.value );
			} );
			
			operator( "~delete", "delete", 90, null, function( path ) {
				if ( !path || !path._propAccess )
					error( "Bad lvalue: no object property." );
				
				var ctxtProp = reactPaths.inCtxtProp( path );
				
				return revProps.set( ctxtProp.ctxt, ctxtProp.prop, reactPaths.set( path, undefined, true, true ) );
			} );
			
			operator( "~", "prefix", 90, null, function( path ) {
				if ( !path || !path._propAccess )
					error( "Bad lvalue: no reactive object property." );
				
				var ctxtProp = reactPaths.inCtxtProp( path );

				//find path
				var pathObj = reactPaths.rmv( path );
				
				if ( !pathObj ) //path was not registered
					return false;
				
				return revProps.rev( ctxtProp.ctxt, ctxtProp.prop, pathObj );
			} );
			
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
					this.second = undefined;
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
					
					if ( !v._isVar && !v._isExprArray )
						error( "{ must be preceeded by a variable or expression!" );
					
					if ( ctxt && ctxt._isValArray && ctxt[ 0 ] === "," ) {
						ctxt = ctxt.slice( 1 );
						
						idx = ctxt.length;
						while( idx-- ) {
							if ( ctxt[ idx ]._isExprArray )
								error( "context data must be a literal or variable!" );
						}
						
					} else if ( ctxt !== undefined ) {
						if ( ctxt._isExprArray )
							error( "context data must be a literal or variable!" );
						
						ctxt = [ ctxt ];
					}
					
					if ( ctxt )
						v = v.inCtxt( ctxt );
					
					return v;
				}
			);
			
			var arrFunc = function( func, args ) {
					if ( func.inverse ) {
						if ( args && args._isValArray && args[ 0 ] === "(" && args[ 1 ] === func.inverse )
							return args[ 2 ];
						
					} else if ( func.projection ) {
						if ( args && args._isValArray && args[ 0 ] === "(" && args[ 1 ] === func )
							return args;
					}
					
					return makeExprArray( [ "(", func, args ], args._isExprArray ? args._dep : args );
				};
			
			operator( "(", "call", 100, null, function( func, args ) {
				var argsArr, call;
				
				//create arguments array to bind
				if ( args && args._isValArray && args[ 0 ] === "," ) {
					argsArr = args.slice( 1 );
					delete argsArr._dep;
					
				} else {
					argsArr = args !== undefined ? [ args ] : args;
				}
				
				call = FunctionCall( func, argsArr, true );
				call instanceof FunctionCall && call._call();
				return call;
			} );
			
			operator( ":(", "call", 100, null, function( func, args ) {
				var argsArr;
				
				//create arguments array to bind
				if ( args && args._isValArray && args[ 0 ] === "," ) {
					argsArr = args.slice( 1 );
					delete argsArr._dep;
					
				} else {
					argsArr = args !== undefined ? [ args ] : args;
				}
				
				return FunctionCall( func, argsArr, true );
			} );
			
			operator( "~(", "call", 100, null, function( func, args ) {
				var argsArr;
				
				//create arguments array
				if ( args && args._isValArray && args[ 0 ] === "," ) {
					argsArr = args.slice( 1 );
					delete argsArr._dep;
					
				} else {
					argsArr = [ args ];
				}
				
				return FunctionCall.prototype.remove( func, argsArr );
			} );
			
			var objPropEval = {
				lit : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						if ( this.nextToken === "=" || this.nextToken === "~=" ||
							 this.prevToken === "delete" || this.prevToken === "~delete" || this.prevToken === "~" ||
							 this.nextToken === "(" || this.nextToken === ":(" || this.nextToken === "~(" )
							return makeExprArray( [ ".", obj, prop ] );
						
						return obj[ prop ];
					},
					ref :function( obj, prop ) {
						return makeExprArray( [ ".", obj, prop ], prop );
					},
					arr :function( obj, prop ) {
						return makeExprArray( [ ".", obj, prop ], prop._dep );
					}
				},
				ref : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						return makeExprArray( [ ".", obj, prop ], obj );
					},
					ref :function( obj, prop ) {
						return makeExprArray( [ ".", obj, prop ], obj, prop );
					},
					arr :function( obj, prop ) {
						return makeExprArray( [ ".", obj, prop ], obj, prop._dep );
					}
				},
				arr : {
					lit : function( obj, prop ) {
						if ( prop.id === "(id)" )
							prop = prop.value;
						
						if ( obj[ 0 ] === "." ) {
							obj.push( prop );
							return obj;
						}
						
						return makeExprArray( [ ".", obj, prop ], obj._dep );
					},
					ref :function( obj, prop ) {
						if ( obj[ 0 ] === "." ) {
							obj.addDep( prop ).push( prop );
							return obj;
						}
						
						return makeExprArray( [ ".", obj, prop ], obj._dep, prop );
					},
					arr :function( obj, prop ) {
						if ( obj[ 0 ] === "." ) {
							obj.addDep( prop._dep ).push( prop );
							return obj;
						}
						
						return makeExprArray( [ ".", obj, prop ], obj._dep, prop._dep );
					}
				}
			};
			
			operator( ".", "infix", 110, function( expr ) {
					this.first = expr.o[ expr.p ];
					this.second = undefined;
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
					this.second = undefined;
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
					this.first = undefined;
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
					if ( expr.o.assignment && !assignTo && expr.o.first )
						assignTo = expr.o.first.id === "(id)" ? expr.o.first.value : expr.o.first._key;
					
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
						if ( !expr.o.assignment && expr.o.first && expr.o.first._key === assignTo ) {
							if ( expr.o.first._value._isExprArray ) {
								var tmp = makeExprArray( expr.o.first._value.slice( 0 ), expr.o.first._value._dep );
								
								if ( "_context" in expr.o.first._value )
									tmp.inCtxt( expr.o.first._context );
								
								expr.o.first = tmp;
								
							} else {
								expr.o.first = expr.o.first._value;
							}
						}
						
						if ( expr.o.second && expr.o.second._key === assignTo ) {
							if ( expr.o.second._value._isExprArray ) {
								var tmp = makeExprArray( expr.o.second._value.slice( 0 ), expr.o.second._value._dep );
								
								if ( "_context" in expr.o.second._value )
									tmp.inCtxt( expr.o.second._context );
								
								expr.o.second = tmp;
								
							} else
								expr.o.second = expr.o.second._value;
						}
					}
					
					//evaluate expression
					parent.o[ parent.p ] = ( expr.o.nudEval || expr.o.ledEval ).call( expr, expr.o.first, expr.o.second, this );
					
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
						ret = {				//object to contain the top level expression, that is returned
							value : undefined
						},
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
							ret.value = undefined;
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
									ret.value = undefined;
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
									if ( expr.o[ expr.p ] === undefined && ( !expr.end || expr.end !== token.id ) ) {
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
											
											//the complete sequence has a right binding power equal to the lbp of the starting token
											expr.rbp = expr.o.lbp;
											expr.end = null;
											
											//get next token
											break;
										}
										
										expr = endExpr.call( this, expr, token );
										
										if ( expr.rbp === token.lbp ) {
											if ( expr.end ) {
												if ( expr.end !== token.id )
													error( "Expected " + expr.end + "." );
												
												//the complete sequence has a right binding power equal to the lbp of the starting token
												expr.rbp = expr.o.lbp;
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
			
			//Variable creation and properties
			var Variable = function( key, val ) {
					var v = this instanceof Variable ? this : Object.create( Variable.prototype );
					
					v._guid	  = Variable.prototype._guid++;
					v._dep 	  = null;
					v._partOf = {};
					
					v.set( val );
					
					if ( key ) {
						v._key = key;
						v._isNamed = true;
					
					} else {
						v._key = String( v._guid );
						v._isNamed = false;
					}
					
					return v;
				};
			
			Variable.prototype = {
				_guid   : 0,
				
				_value  : undefined,
				_dep    : null,
				_partOf : null,
				
				_isVar : true,
				
				valueOf : function() {
					try {
						var idx, context;
						
						if ( !this._context && arguments.length ) {
							if ( typeof this._value === "function" ) {
								context = [];
								idx = arguments.length;
								while( idx-- )
									context[ idx ] = arguments[ idx ].valueOf();
								
								return this._value.apply( null, context );
							
							} else if ( this._value && this._value.valueOf )
								return this._value.valueOf.apply( this._value, arguments );
							
							else
								return this._value;
						}
						
						if ( !this.hasOwnProperty( "_evaled" ) ) {
							if ( this._context ) {
								if ( typeof this._value === "function" ) {
									context = [];
									idx = this._context.length;
									while( idx-- )
										context[ idx ] = this._context[ idx ].valueOf();
									
									this._evaled = this._value.apply( null, context );
								
								} else if ( this._value && this._value.valueOf )
									this._evaled = this._value.valueOf.apply( this._value, this._context );
								
								else
									this._evaled = this._value;
							
							} else if ( this._value && this._value.valueOf )
								this._evaled = this._value.valueOf();
							
							else
								this._evaled = this._value;
						}
						
						return this._evaled;
					
					} catch( e ) {
						error( "Variable.valueOf: " + e.message );
					}
				},
				toString : function() {
					try {
						if ( !("_string" in this) ) {
							this._string = this._isNamed ? this._key + " = " : "";
						
							if ( this._value && this._value.toString )
								this._string += this._value.toString();
							else if ( typeof this._value === "function" )
								this._string += "function(){...}";
							else
								this._string += String( this._value );
						}
						
						return this._string;
					
					} catch( e ) {
						error( "Variable.toString: " + e.message );
					}
				},
				_prevValueOf : function( ctxt, data ) {
					return  "_prev" in this ? 
							( this._prev && this._prev._prevValueOf ?
								this._prev._prevValueOf( ctxt, data ) :
								this._prev ) :
							this._value && this._value._prevValueOf ?
								this._value._prevValueOf( ctxt, data ) :
								this._value;
				},
				
				invalidate : function( from ) {
					delete this._evaled;
					delete this._string;
					
					for ( var id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				set : function( val ) {
					var id;
					
					if ( val && this._value === val )
						return this;
					
					//save previous value temporarily, so invalidation has access to it, if necessary
					this._prev = this._value;
					
					//set new value
					this._value = val;
					
					//delete links from dependencies to this instance
					this._unlinkDeps();
					
					if ( val ) {
						//set new dependency
						if ( val && val._dep )
							this._dep = val._dep;
						else if ( val && val._isCall )
							this._dep = val;
						else
							delete this._dep;
						
						if ( val._isExprArray )
							val._makeVar();
						
						//set context
						if ( val._context ) {
							this._context = val._context;
							delete val._context;
						} else {
							delete this._context;
						}
					}
					
					//invalidate
					this.invalidate();
					
					//delete previous value
					delete this._prev;
					
					if ( !dontTrack )
						//link dependencies to this instance
						this._linkDeps();
					
					return this;
				},
				_linkDeps : function() {
					//set partOf on dependencies' side
					var id;
					
					if ( this._dep && this._dep._isCall ) {
						this._dep._partOf[ this._guid ] = this;
						this._dep.link();
					
					} else {
						for ( id in this._dep ) {
							this._dep[ id ]._partOf[ this._guid ] = this;
							
							if ( this._dep[ id ]._isCall )
								this._dep[ id ].link();
						}
					}
					
					this._linkCtxtDeps && this._linkCtxtDeps();
				},
				_linkCtxtDeps : function( v ) {
					//set partOf of context parts
					var ctxt = this._context,
						v = v || this,
						idx;
					
					if ( ctxt ) {
						idx = ctxt.length;
						while ( idx-- ) {
							if ( ctxt[ idx ]._isVar )
								ctxt[ idx ]._partOf[ v._guid ] = v;
						}
					}
					
					if ( v !== this || !this._value || !this._value._isValArray )
						return;
					
					idx = this._value.length;
					while ( idx-- ) {
						if ( this._value[ idx ]._isCtxtVar )
							this._value[ idx ]._linkCtxtDeps();
						else if ( this._value[ idx ]._isCtxtArray )
							this._linkCtxtDeps.call( this._value[ idx ], this );
					}
				},
				_unlinkDeps : function() {
					//delete partOf on dependencies' side
					var id;
					
					if ( this._dep && this._dep._isCall ) {
						if ( this._dep._partOf )
							delete this._dep._partOf[ this._guid ];
						
						this._dep.unlink();
					
					} else {
						for ( id in this._dep ) {
							if ( this._dep[ id ]._partOf )
								delete this._dep[ id ]._partOf[ this._guid ];
							
							if ( this._dep[ id ]._isCall )
								this._dep[ id ].unlink();
						}
					}
					
					this._unlinkCtxtDeps && this._unlinkCtxtDeps();
				},
				_unlinkCtxtDeps : function( v ) {
					//delete partOf of context parts
					var ctxt = this._context,
						v = v || this,
						idx;
					
					if ( ctxt ) {
						idx = ctxt.length
						while ( idx-- )
							if ( ctxt[ idx ]._isVar )
								delete ctxt[ idx ]._partOf[ v._guid ];
					}
					
					if ( v !== this || !this._value || !this._value._isValArray )
						return;
					
					idx = this._value.length;
					while ( idx-- ) {
						if ( this._value[ idx ]._isCtxtVar )
							this._value[ idx ]._unlinkCtxtDeps();
						else if ( this._value[ idx ]._isCtxtArray )
							this._unlinkCtxtDeps.call( this._value[ idx ], this );
					}
				},
				inCtxt : function( ctxt ) {
					if ( this._context )
						return this;
					
					var v = Object.create( this );
					
					v._guid = Variable.prototype._guid++;
					v._context = ctxt;
					v._isCtxtVar = true;
					
					return v;
				},
				"delete" : function() {
					var id;
					
					this._unlinkDeps();
					
					delete this._value;
					
					delete this._string;
					delete this._evaled;
					
					delete this._guid
					delete this._dep;
					delete this._partOf;
					
					return true;
				}
			};
			
			//function calls
			var FunctionCall = function( func, args, evalArgs ) {
					var funcIsLit, argsAreLits;
					
					//prepare function
					if ( func._isVar && func._locked )
						func = func._value;
					
					if ( typeof func === "function" )
						funcIsLit = true;
					
					//prepare arguments
					if ( args === undefined )
						args = [];
					else if ( args.constructor !== Array || args._isExprArray )
						args = [ args ];
					
					argIdx = args.length;
					argsAreLits = true;
					while ( argIdx-- ) {
						if ( args[ argIdx ]._isVar || args[ argIdx ]._isExprArray || args[ argIdx ]._isCall ) {
							argsAreLits = false;
							break;
						}
					}
					
					if ( funcIsLit && args[ 0 ] && args[ 0 ]._func && args[ 0 ]._func.inverse === func )
						return args[ 0 ]._args[ 0 ];
					
					if ( funcIsLit && argsAreLits )
						return func.apply( this, args );
					
					var c = this instanceof FunctionCall ? this : Object.create( FunctionCall.prototype );
					
					c._guid	= "#f" + FunctionCall.prototype._guid++;
					
					c._func = func;
					c._args = args;
					c._argLits = [];
					c._partOf = {};
					c._evalArgs = !!evalArgs;
					
					//don't track changes of function or arguments, if:
					// - tracking is explicitly turned of by dontTrack
					// - the function acts as a constructor
					if ( !dontTrack )
						c.link();
					
					return c;
				};
			
			FunctionCall.prototype = {
				_guid : 0,
				
				_func : null,
				_funcLit : null,
				_ctxtLit : null,
				_args : null,
				_argLits : null,
				
				_partOf : null,
				_evalArgs : false,
				_isCall : true,
				
				valueOf : function() {
					return "_evaled" in this ? this._evaled : this._call();
				},
				
				_call : function( update ) {
					var i, j, outOfDate;
					
					//check, if this._func depends on update
					outOfDate = false;
					if ( !this._funcLit ) {
						outOfDate = true;
					
					} else if ( this._func._isExprArray ) {
						for ( i in this._func._dep ) {
							if ( this._func._dep[ i ] === update ) {
								outOfDate = true;
								break;
							}
						}
					
					} else if ( this._func._isVar ) {
						if ( this._func === update )
							outOfDate = true;
					}
					
					//evaluate function to literal
					if ( outOfDate ) {
						if ( this._func && this._func._isExprArray ) {
							if ( this._func._propAccess ) {
								var j = 2,
									m = this._func.length-1;
								
								this._ctxtLit = this._func[ 1 ].valueOf();
								
								while ( j<m )
									this._ctxtLit = this._ctxtLit[ this._func[ j++ ].valueOf() ];
								
								this._funcLit = this._ctxtLit[ this._func[ j ].valueOf() ];
								
							} else {
								this._funcLit = this._func.valueOf();
							}
						
						} else if ( this._func && this._func._isVar ) {
							this._funcLit = this._func.valueOf();
						
						} else {
							this._funcLit = this._func;
						}
					}
					
					if ( !this._evalArgs ) {
						try {
							return this._funcLit.apply( this._ctxtLit || this, this._args );
						} catch( e ) {
							error( "A reactive function call causes problems: " + e.message );
						}
					}
					
					j = this._args.length;
					while ( j-- ) {
						//check, if this._args[ i ] depends on update
						outOfDate = false;
						if ( !( "j" in this._argLits ) ) {
							outOfDate = true;
						
						} else if ( this._args[ j ]._isExprArray ) {
							for ( i in this._args[ j ]._dep ) {
								if ( this._args[ j ]._dep[ i ] === update ) {
									outOfDate = true;
									break;
								}
							}
						
						} else if ( this._args[ j ]._isVar ) {
							if ( this._args[ j ] === update )
								outOfDate = true;
						
						}
						
						//and evaluate arguments to literals
						if ( outOfDate ) {
							if ( this._args[ j ]._isExprArray || this._args[ j ]._isVar )
								this._argLits[ j ] = this._args[ j ].valueOf();
							else
								this._argLits[ j ] = this._args[ j ];
						}
					}
					
					try {
						return this._evaled = this._funcLit.apply( this._ctxtLit || this, this._argLits );
					} catch( e ) {
						error( "A reactive function call causes problems: " + e.message );
					}
				},
				
				invalidate : function( from ) {
					this._call( from );
					
					for ( var id in this._partOf )
						this._partOf[ id ].invalidate( this );
					
					return this;
				},
				
				link : function() {
					var setPartOf = function( v ) {
						v._partOf[ this._guid ] = this;
					};
					
					//set partOf on functions side
					doWithReactive.call( this, this._func, setPartOf );
					
					//set partOf on arguments' side
					var i = this._args.length;
					while ( i-- )
						doWithReactive.call( this, this._args[ i ], setPartOf );
				},
				
				unlink : function() {
					var rmvPartOf = function( v ) {
						delete v._partOf[ this._guid ];
					};
					
					//remove partOf on functions side
					doWithReactive.call( this, this._func, rmvPartOf );
					
					//remove partOf on arguments' side
					if ( !this._args )
						return;
					
					var i = this._args.length;
					while ( i-- )
						doWithReactive.call( this, this._args[ i ], rmvPartOf );
				},
				
				remove : function( func, args ) {
					var call;
					
					//find handler to FunctionCall instance
					var checkCall = function( v ) {
						for ( var id in v._partOf ) {
							if ( id.charAt( 0 ) !== "#" || id.charAt( 1 ) !== "f" )
								continue;
							
							if ( equiv( func, v._partOf[ id ]._func ) &&
								 equiv( args, v._partOf[ id ]._args ) ) {
								call = v._partOf[ id ];
								return false;
							}
						}
						
						return true;
					};
					
					var callFound = !doWithReactive( func, checkCall );
					
					if ( !callFound ) {
						var argIdx = args.length;
						while ( argIdx-- )
							if ( callFound = !doWithReactive( args[ argIdx ], checkCall ) )
								break;
					}
					
					if ( !callFound )
						//error ( "Function call to remove does not exist!" );
						return false;
					
					call.unlink();
					
					delete call._func;
					delete call._funcLit;
					delete call._ctxtLit;
					delete call._args;
					delete call._argLits;
					delete call._partOf;
					
					return true;
				}
			};
			
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
						
						if ( this.table.hasOwnProperty( key ) && ( !vars || !(key in vars) ) && !v._locked && isEmptyObj( v._partOf ) ) {
							ret = ret && v[ "delete" ]();
							delete this.table[ key ];
							del = true;
						}
					}
					
					return del ? this.clean( vars ) : ret;
				},
				set : function( key, val, ctxt ) {
					if ( key in this.table ) {
						if ( this.table[ key ]._locked )
							error( "Bad lvalue: variable is immutable (constant)." );
						
						return this.table[ key ].set( val );
					}
					
					var v = Variable( key, val, ctxt );
					return this.table[ v._key ] = v;
				},
				"delete" : function( key ) {
					if ( key in this.table ) {
						if ( this.table[ key ]._locked )
							error( "Bad lvalue: variable is immutable (constant)." );
						
						for ( var id in this.table[ key ]._partOf )
							if ( this.table[ key ]._partOf.hasOwnProperty( id ) )
								error( "Cannot delete variable " + key + ". It is still used in: " + this.table[ key ]._partOf[ id ].toString() + "." );
						
						var ret = this.table[ key ][ "delete" ]();
						
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
								table[ key ] = Variable( key, consts[ key ] );
								table[ key ]._locked = true;
							}
						}
					}
					
					return NameTable( Object.create( table ) );
				},
				setupOps = function( ops, base ) {
					if ( !ops || !ops.length )
						return base || operators;
					
					var not = ops[ 0 ] === "not",
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
					
					var not = lits[ 0 ] === "not",
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
						var ret;
						
						ret = interpret.apply( props, arguments );
						
						if ( ret && ( ret._isVar || ret._isExprArray || ret._isCall ) )
							ret = ret.valueOf();
						
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
							
							if ( ret._isExprArray || ret._isCall )
								ret = props.nameTable.set( null, ret );
							
							dontTrack = false;
							
							return ret;
						
						} catch ( error ) {
							dontTrack = false;
							
							throw ( error );
						}
					}
					
					react.leak.nameTable = props.nameTable;
				}
				
				react.Interpreter = Interpreter;
				
				return react;
			};
		}() );
	
	//expose
	this.react = Interpreter( null, "math" );
}.call() );
