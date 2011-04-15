react.Vector = react.datatype(
	function( left, top ) {
		try {
			left = left && left.constructor === Array && !left._valueArray ? react.apply( this, left ) : left || 0;
			top  = top  && top.constructor  === Array && !top._valueArray  ? react.apply( this, top )  : top  || 0;
			
			this.left = left;
			this.top  = top;
			
			return this;
		
		} catch ( error ) {
			COVE.err.forward( "Vector", error );
		}
	},
	{
		//	2D vector of the form:
		//	left
		//	top
		//	 1
		
		constructor : Vector,
		
		left : 0,
		top  : 0,
		
		toString : function() {
			try {
				return "[ " + String( this.left ) + ", " + String( this.top ) + " ]";
			
			} catch( error ) {
				COVE.err.forward( "Vector.toString", error );
			}
		},
		
		toNumber : function() {
			try {
				return this.length();
			
			} catch( error ) {
				COVE.err.forward( "Vector.toNumber", error );
			}
		},
		
		toBoolean : function() {
			try {
				return !!this.toNumber();
			
			} catch( error ) {
				COVE.err.forward( "Vector.toBoolean", error );
			}
		},
		
		valueOf : function( ctxt, data ) {
			try {
				return ( this.left.valueOf || this.top.valueOf ) ?
					Vector(
						this.left.valueOf ? this.left.valueOf( ctxt, data ) : this.left,
						this.top.valueOf  ? this.top.valueOf( ctxt, data ) : this.top
					) :
					this;
			
			} catch( error ) {
				COVE.err.forward( "Vector.valueOf", error );
			}
		},
		
		length : function() {
			try {
				return lazy.react( "(", this.left, "*", this.left, "+", this.top, "*", this.top, ")^", 0.5 )
			
			} catch( error ) {
				COVE.err.forward( "Vector.length", error );
			}
		},
		
		angleTo : function( v ) {
			try {
				return lazy.react( "acos((", this, "*", v, ")/(", this.length(), "*", v.length(), ")) / pi * 180" );
				
			} catch( error ) {
				COVE.err.forward( "Vector.angleTo", error );
			}
		},
		
		scaleRotate : function( factor, angle ) {
			try {
				var cos = Math.cos( angle/180*Math.PI ),
					sin = Math.sin( angle/180*Math.PI );
				
				return Vector( lazy.react( factor, "*(", cos, "*", this.left, "-", sin, "*", this.top, ")" ),
							   lazy.react( factor, "*(", sin, "*", this.left, "+", cos, "*", this.top, ")" ) ) ;
				
			} catch( error ) {
				COVE.err.forward( "Vector.scaleRotate", error );
			}
		},
		
		"infix+" : function( v ) {
			try {
				return Vector(
					react( this.left, "+", v.left ),
					react( this.top,  "+", v.top )
				);
				
			} catch( error ) {
				COVE.err.forward( "Vector.+", error );
			}
		},
		
		"infix*" : function( v ) {
			try {
				if ( v.left !== undefined )	//dot product
					return react( this.left, "*", v.left, "+", this.top, "*", v.top );
				
				else	//scaling
					return Vector(
						react( this.left, "*", v ),
						react( this.top,  "*", v )
					);
			
			} catch( error ) {
				COVE.err.forward( "Vector.*", error );
			}
		},
		
		"infix^" : function( v, reversed ) {
			try	{
				if ( reversed )
					throw( "Potentiation is not commutative." );
			
				if ( typeof v !== "number" || !(v % 1) )
					throw( "Exponent of vector potentiation is no constant integer." );
				
				if ( v % 2 ) { //odd exponent
					v = Math.abs( v < 0 ? v++ : v );
					return this[ "*" ].infix( react( "(", this.left, "*", this.left, "+", this.top, "*", this.top, ")", "^", ( v - ( v % 2 ) ) / 2 /*amount of squares*/ ) );
				
				} else { //even exponent
					return react( "(", this.left, "*", this.left, "+", this.top, "*", this.top, ")", "^", ( v - ( v % 2 ) ) / 2 /*amount of squares*/ );
				}
			
			} catch( error ) {
				COVE.err.forward( "Vector.^", error );
			}
		}
	}
);

react.Matrix = react.datatype( 
	function( leftL, leftT, topL, topT, left, top ) {
		try {
			leftL = leftL.constructor === Array && !leftL._valueArray ? react.apply( this, leftL ) : leftL || 1;
			leftT = leftT.constructor === Array && !leftT._valueArray ? react.apply( this, leftT ) : leftT || 0;
			topL  = topL.constructor  === Array && !topL._valueArray  ? react.apply( this, topL )  : topL  || 0;
			topT  = topT.constructor  === Array && !topT._valueArray  ? react.apply( this, topT )  : topT  || 1;
			left  = left.constructor  === Array && !left._valueArray  ? react.apply( this, left )  : left  || 0;
			top   = top.constructor   === Array && !top._valueArray   ? react.apply( this, top )   : top   || 0;
			
			this.leftL = leftL;
			this.leftT = leftT;
			this.topL  = topL;
			this.topT  = topT;
			this.left  = left;
			this.top   = top;
			
			return this;
		
		} catch ( error ) {
			COVE.err.forward( "Matrix", error );
		}
	},
	{
		//	2D matrix of the form:
		//	leftL	topL	left
		//	leftT	topT	top
		//	 0		 0		 1
		
		constructor : Matrix,
		
		leftL : 1,
		leftT : 0,
		topL  : 0,
		topT  : 1,
		left  : 0,
		top   : 0,
		
		toString : function() {
			try {
				return "[ " + this.leftL + ", " + this.leftT + ", " + "0" + "; " +
							  this.topL  + ", " + this.topT  + ", " + "0" + "; " +
							  this.left  + ", " + this.top   + ", " + "1" + " ]";
			} catch( error ) {
				COVE.err.forward( "Matrix.toString", error );
			}
		},
		
		toNumber : function() {
			try {
				return this.det();
			
			} catch( error ) {
				COVE.err.forward( "Matrix.toNumber", error );
			}
		},
		
		toBoolean : function() {
			try {
				return !!this.toNumber();
			
			} catch( error ) {
				COVE.err.forward( "Matrix.toBoolean", error );
			}
		},
		
		valueOf : function( ctxt, data ) {
			try {
				return ( this.leftL.valueOf || this.leftT.valueOf ||
						 this.topL.valueOf  || this.topT.valueOf  ||
						 this.left.valueOf  || this.top.valueOf ) ?
						Matrix(
							this.leftL.valueOf ? this.leftL.valueOf( ctxt, data ) : this.leftL,
							this.leftT.valueOf ? this.leftT.valueOf( ctxt, data ) : this.leftT,
							this.topL.valueOf  ? this.topL.valueOf( ctxt, data )  : this.topL,
							this.topT.valueOf  ? this.topT.valueOf( ctxt, data )  : this.topT,
							this.left.valueOf  ? this.left.valueOf( ctxt, data )  : this.left,
							this.top.valueOf   ? this.top.valueOf( ctxt, data )   : this.top
						) :
						this;
			
			} catch( error ) {
				COVE.err.forward( "Vector.valueOf", error );
			}
		},
		
		det : function() {
			try {
				return lazy.react( this.leftL, "*", this.topT, "-", this.topL, "*", this.leftT );
			
			} catch( error ) {
				COVE.err.forward( "Matrix.det", error );
			}
		},
		
		trace : function() {
			try {
				return lazy.react( this.leftL, "+", this.topT );
			
			} catch( error ) {
				COVE.err.forward( "Matrix.trace", error );
			}
		},
		
		inverse : function() {
			try {
				var det = this.det();
				
				return Matrix(
					lazy.react( this.topT, "/", det ),
					lazy.react( "-", this.leftT, "/", det ),
					lazy.react( "-", this.topL, "/", det ),
					lazy.react( this.leftL, "/", det ),
					lazy.react( "(", this.topL, "*", this.top,   "-", this.left,  "*", this.topT, ")/", det ),
					lazy.react( "(", this.left, "*", this.leftT, "-", this.leftL, "*", this.top,  ")/", det )
				);
			
			} catch( error ) {
				COVE.err.forward( "Matrix.inverse", error );
			}
		},
		
		scaleRotate : function( factor, angle ) {
			try {
				var cos = Math.cos( angle/180*Math.PI ),
					sin = Math.sin( angle/180*Math.PI );
				
				return Matrix(
					lazy.react( factor, "*(", cos, "*", this.leftL, "-", sin, "*", this.leftT, ")" ),
					lazy.react( factor, "*(", sin, "*", this.leftL, "+", cos, "*", this.leftT, ")" ),
					lazy.react( factor, "*(", cos, "*", this.topL,  "-", sin, "*", this.topT,  ")" ),
					lazy.react( factor, "*(", sin, "*", this.topL,  "+", cos, "*", this.topT,  ")" ),
					lazy.react( factor, "*(", cos, "*", this.left,  "-", sin, "*", this.top,   ")" ),
					lazy.react( factor, "*(", sin, "*", this.left,  "+", cos, "*", this.top,   ")" )
				);
				
			} catch( error ) {
				COVE.err.forward( "Matrix.scaleRotate", error );
			}
		},
		
		basisLeft : function() {
			try {
				return Vector( this.leftL, this.leftT );
			
			} catch( error ) {
				COVE.err.forward( "Matrix.basisLeft", error );
			}
		},
		
		basisTop : function() {
			try {
				return Vector( this.topL, this.topT );
			
			} catch( error ) {
				COVE.err.forward( "Matrix.basisTop", error );
			}
		},
		
		basisOffset : function() {
			try {
				return Vector( this.left, this.top );
			
			} catch( error ) {
				COVE.err.forward( "Matrix.basisOffset", error );
			}
		},
		
		isUnity : function() {
			try {
				return this.leftL === 1 && this.leftT === 0 &&
					   this.topL  === 0 && this.topT  === 1 &&
					   this.left  === 0 && this.top   === 0;
			
			} catch( error ) {
				COVE.err.forward( "Matrix.isUnity", error );
			}
		},
		
		"infix+" : function( m ) {
			try {
				if ( m.leftL )
					//add matrix
					return Matrix(
						react( this.leftL, "+", m.leftL ),
						react( this.leftT, "+", m.leftT ),
						react( this.topL,  "+", m.topL ),
						react( this.topT,  "+", m.topT ),
						react( this.left,  "+", m.left ),
						react( this.top,   "+", m.top )
					);
				
				//add vector to offset
				return Matrix(
					this.leftL,
					this.leftT,
					this.topL,
					this.topT,
					react( this.left, "+", m.left ),
					react( this.top,  "+", m.top )
				);
			
			} catch( error ) {
				COVE.err.forward( "Matrix.infix+", error );
			}
		},
		
		"infix*" : function( m, reversed ) {
			try {
				if ( m.leftL ) {
					//multiplication with matrix
					if ( reversed )
						throw( "Matrix multiplication with another matrix is not commutative." );
						
					return Matrix(
						react( this.leftL, "*", m.leftL, "+", this.topL, "*", m.leftT ),
						react( this.leftT, "*", m.leftL, "+", this.topT, "*", m.leftT ),
						react( this.leftL, "*", m.topL,  "+", this.topL, "*", m.topT  ),
						react( this.leftT, "*", m.topL,  "+", this.topT, "*", m.topT  ),
						react( this.leftL, "*", m.left,  "+", this.topL, "*", m.top, "+", this.left ),
						react( this.leftT, "*", m.left,  "+", this.topT, "*", m.top, "+", this.top )
					);
				
				} else if ( m.left ) {
					//multiplication with vector
					if ( reversed )
						throw( "Matrix multiplication with vector is not commutative." );
					
					return Vector(
						react( this.leftL, "*", m.left, "+", this.topL, "*", m.top, "+", this.left ),
						react( this.leftT, "*", m.left, "+", this.topT, "*", m.top, "+", this.top )
					);
				
				} else {
					//multiplication with scalar
					return Matrix(
						react( this.leftL, "*", m ),
						react( this.leftT, "*", m ),
						react( this.topL,  "*", m ),
						react( this.topT,  "*", m ),
						react( this.left,  "*", m ),
						react( this.top,  "*", m )
					);
				}
			
			} catch( error ) {
				COVE.err.forward( "Matrix.infix*", error );
			}
		},
		
		"infix^" : function( s, reversed ) {
			try {
				if ( reversed )
					throw( "Potentiation is not commutative." );
				
				if ( typeof s !== "number" || !(s % 1) )
					throw( "Exponent of matrix potentiation is no integer." );
				
				var ret = this,
					abs = Math.abs( s );
				
				for ( var i = 1; i < abs; i++ )
					ret = ret[ "*" ].infix( this );
				
				if ( s < 0 )
					ret.inverse();
				
				return ret;
				
			} catch( error ) {
				COVE.err.forward( "Matrix.infix^", error );
			}
		}
	}
);