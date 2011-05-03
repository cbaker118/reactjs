module( "Main function react()" );

test( "Arguments", function() {
	strictEqual( react( "true" ), react( true ), "react( \"true\" ) === react( true )" );
	
	var func = function( x ) { return x*x; };
	strictEqual( react( func ), func, "react( function( x ) { return x*x; } )" );
	
	var obj = { prop1 : 'value1', prop2 : 'value2' };
	strictEqual( react( obj ), obj, "react( { prop1 : 'value1', prop2 : 'value2' } )" );
	
	var arr = [ 10, 20, 30 ];
	strictEqual( react( arr ), arr, "react( [ 10, 20, 30 ] )" );
	
	strictEqual( react( "5" ), 5, "react( \"5\" )" );
	strictEqual( react( "0.5e2" ), react( "0.5E2" ), "react( \"0.5e2\" )" );
	strictEqual( react( ".5" ), react( "0.5" ), "react( \"0.5\" )" );
	
	strictEqual( react( "'string'" ), "string", "react( \"'string'\" )" );
	strictEqual( react( '"string"' ), "string", "react( '\"string\"' )" );
	strictEqual( react( "\"string\"" ), "string", "react( \"\\\"string\\\"\" )" );
	strictEqual( react( '\'string\'' ), "string", "react( '\\'string\\'' )" );
	
	strictEqual( react( "_id = 'variable'" ), "variable", "react( \"_id = 'variable'\" )" );
	strictEqual( react( "obj =", obj ), obj, "react( \"obj =\", obj )" );
	strictEqual( react( "obj.prop = 'value'" ), 'value', "react( \"obj.prop = 'value'\" )" );
	
	strictEqual( react( 10, "+", 5 ), react( "10+5" ), "react( 10, \"+\", 5 ) === react( \"10+5\" )" );
	strictEqual( react( "10+5" ), react( "10", "+5" ), "react( \"10+5\" ) === react( \"10\", \"+5\" )" );
	strictEqual( react( "10", "+5" ), react( "10+", 5 ), "react( \"10\", \"+5\" ) === react( \"10+\", 5 )" );
	strictEqual( react( "10+", 5 ), react( 10, "+", 5 ), "react( \"10+\", 5 ) === react( 10, \"+\", 5 )" );
	
	react( "clean" );
} );

test( "Return value", function() {
	react( "x = 1; y = 2" );
	var obj = {};
	
	strictEqual( react( "x+y; 3+8" ), 11, "react( \"x+y; 3+8\" )" );
	strictEqual( react( "x+y" ), 3, "react( \"x+y\" )" );
	strictEqual( react( "r = x+y" ), 3, "react( \"r = x+y\" )" );
	strictEqual( react( "s =", obj ), obj, "react( \"s =\", {} )" );
	
	react( "clean" );
} );


module( "Evaluation of expressions" );

test( "Operator assignments", function() {
	react( "r1 = 10; r2 = 10;" );
	react( "obj1 =", { prop : "head - body - " }, "; obj2 =", { prop : "head - body - " } );
	react( "obj3 =", { repl : "repl" }, "; obj4 =", { repl : "repl" } );
	react( "prop = 'repl'" );
	react( "bool1 = true; bool2 = true;" );
	react( "s = 2" );
	
	strictEqual( react( "r1 += 5" ), react( "r2 = r2+5" ), "react( \"r += 5\" ) === react( \"r = r+5\" )" );
	strictEqual( react( "obj1.prop += 'tail'" ), react( "obj2.prop = obj2.prop + 'tail'" ), "react( \"obj.prop += 'tail'\" ) === react( \"obj.prop = obj.prop + 'tail'\" )" );
	strictEqual( react( "-= r1" ), react( "r2 = -r2" ), "react( \"-= r\" ) === react( \"r = -r\" )" );
	strictEqual( react( "obj1.=prop" ), react( "obj2 = obj2.prop" ), "react( \"obj.=prop\" ) === react( \"obj = obj.prop\" )" );
	strictEqual( react( "obj3[= prop ]" ), react( "obj4 = obj4[ prop ]" ), "react( \"obj[= prop ]\" ) === react( \"obj = obj[ prop ]\" )" );
	strictEqual( react( "bool1 ?= 'true' : 'false'" ), react( "bool2 = bool2 ? 'true' : 'false'" ), "react( \"bool ?= 'true' : 'false'\" ) === react( \"bool = bool ? 'true' : 'false'\" )" );
	strictEqual( react( "(= r1*s+13 )*10" ), react( "( r2 = r2*s+13 )*10" ), "react( \"(= r*s+13 )*10\" ) === react( \"( r = r*s+13 )*10\" )" );
	strictEqual( react( "delete= r1" ), react( "r2 = delete r2" ), "react( \"delete= r\" ) === react( \"r = delete r\" )" );
	
	strictEqual( react( "r1 ==.= s" ), react( "r2 = r2 == s" ), "react( \"r ==.= s\" ) === react( \"r = r == s\" )" );
	strictEqual( react( "r1 >.= 10" ), react( "r2 = r2 > 10" ), "react( \"r >.= 10\" ) === react( \"r = r > 10\" )" );
	strictEqual( react( "r1 =.= 5" ), react( "r2 = r2 = 5" ), "react( \"r =.= 5\" ) === react( \"r = r = 5\" )" );
	
	react( "clean" );
} );


module( "Reactive variables" );

test( "Declaration", function() {
	var func = function( name ) {
			return "Hello " + name + "!";
		},
		obj = { prop:"value" };
	
	strictEqual( react( "number = 5" ), 5, "react( \"number = 5\" )" );
	strictEqual( react( "object =", obj ), obj, "react( \"object =\", { prop:\"value\" } )" );
	strictEqual( react( "hello = ", func ), func, "react( \"hello = \", function( name ) { return \"Hello \" + name + \"!\"; } )" );
	
	strictEqual( react( "number = 10" ), 10, "react( \"number = 10\" )" );
	strictEqual( react( "number2 = number - 4.35" ), 10 - 4.35, "react( \"number2 = number - 4.35\" )" );
	
	raises( function() { react( "reactive = notDeclared + 5" ) }, "react( \"reactive = notDeclared + 5\" ) -> exception: notDeclared has not been declared yet" );
	
	react( "clean" );
} );

test( "Change Propagation", function() {
	//change propagation example
	strictEqual( react( "soonChanged = undefined" ), undefined, "react( \"soonChanged = undefined\" )" );
	ok( isNaN( react( "reactive = soonChanged + 5" ) ), "isNaN( react( \"reactive = soonChanged + 5\" ) )" );
	ok( isNaN( react( "reactive2 = reactive * 10" ) ), "isNaN( react( \"reactive2 = reactive * 10\" ) )" );
	strictEqual( react( "soonChanged = 10" ), 10, "react( \"soonChanged = 10\" )" );
	strictEqual( react( "reactive" ), 15, "react( \"reactive\" )" );
	strictEqual( react( "reactive2" ), 150, "react( \"reactive2\" )" );
	
	//weather example
	strictEqual( react( "clouds = 99" ), 99, "react( \"clouds = 99\" )" );
	strictEqual( react( "cloudy = clouds >= 100" ), false, "react( \"cloudy = clouds >= 100\" )" );
	strictEqual( react( "weather = cloudy ? 'Could be better.' : 'Excellent.'" ), "Excellent.", "react( \"weather = cloudy ? 'Could be better.' : 'Excellent.'\" )" );
	strictEqual( react( "clouds += 1" ), 100, "react( \"clouds += 1\" )" );
	strictEqual( react( "cloudy" ), true, "react( \"cloudy\" )" );
	strictEqual( react( "weather" ), "Could be better.", "react( \"weather\" )" );
	
	react( "clean" );
} );

test( "Context sensitive variables", function() {
	/*
	//simple context example
	var f = function( WhoIam ) {
			return "My name is " + WhoIam + ".";
		};

	strictEqual( react( "schizophrenic =", f ), f, "react( \"schizophrenic =\", f )" );
	strictEqual( react( "schizophrenic{ 'David' }" ), "My name is David.", "react( \"schizophrenic{ 'David' }\" )" );
	strictEqual( react( "schizophrenic{ 'Sophie' }" ), "My name is Sophie.", "react( \"schizophrenic{ 'Sophie' }\" )" );
	
	//two contexts example
	var f = function( myName, myAge ) {
			return "I'm a " + myAge + " years old " + myName + ".";
		};
	
	strictEqual( react( "confused =", f ), f, "react( \"confused =\", f )" );
	strictEqual( react( "confused{ 'Bryan', 6 }" ), "I'm a 6 years old Bryan.", "react( \"confused{ 'Bryan', 6 }\" )" );
	strictEqual( react( "confused{ 'Brian', 5 }" ), "I'm a 5 years old Brian.", "react( \"confused{ 'Brian', 5 }\" )" );
	
	//simon says example
	var son = function( familyName ) {
			return "Simon " + familyName;
		},
		father = function( familyName ) {
			return "Jack " + familyName;
		};
	
	ok( true, "var son = function( familyName ) { return \"Simon \" + familyName; }" );
	ok( true, "var father = function( familyName ) { return \"Jack \" + familyName; }" );
	
	react( "simonSays = 'I\\'m ' + ", son, " + ' and my father is ' + ", father );
	ok( true, "react( \"simonSays = 'I\'m ' + \", son, \" + ' and my father is ' + \", father )" );
	strictEqual( react( "simonSays{ 'Watson' }" ), "I'm Simon Watson and my father is Jack Watson", "react( \"simonSays{ 'Watson' }\" )" );
	strictEqual( react( "simonSays{ 'Johnson' }" ), "I'm Simon Johnson and my father is Jack Johnson", "react( \"simonSays{ 'Johnson' }\" )" );
	
	//diet example
	var food = function( food ) {
		return food;
    };
	ok( true, "var food = function( food ) { return food; }" );
	strictEqual( react( "food = ", food ), food, "react( \"food = \", food )" );
	
	react( "diet = food + ' for breakfast, ' + food + ' for lunch and ' + food + ' for supper'" );
	ok( true, "react( \"diet = food + ' for breakfast, ' + food + ' for lunch and ' + food + ' for supper'\" )" );
	
	strictEqual( react( "jackiesDiet = diet{ 'yoghurt' }" ), "yoghurt for breakfast, yoghurt for lunch and yoghurt for supper", "react( \"jackiesDiet = diet{ 'yoghurt' }\" )" );
	strictEqual( react( "tomsDiet = diet{ 'steak' }" ), "steak for breakfast, steak for lunch and steak for supper", "react( \"tomsDiet = diet{ 'steak' }\" )" );
	strictEqual( react( "comilersDiet = diet" ), "function( food ){ [function body] } for breakfast, function( food ){ [function body] } for lunch and function( food ){ [function body] } for supper", "react( \"comilersDiet = diet\" )" );
	
	//custom context example
	var pattern = function( pattern ) {
			return pattern;
		};
	
	strictEqual( react( "pattern =", pattern ), pattern, "react( \"pattern =\", function( pattern ) { return pattern; }" );
	
	react( "chameleon = 'A chameleon looks like ' + pattern + ' in front of ' + pattern + '.'" );
	ok( true, "react( \"chameleon = 'A chameleon looks like ' + pattern + ' in front of ' + pattern + '.'\" )" );
	
	strictEqual( react( "chameleon{ 'stones' }" ), "A chameleon looks like stones in front of stones.", "react( \"chameleon{ 'stones' }\" )" );
	strictEqual( react( "chameleon{ 'sand' }" ), "A chameleon looks like sand in front of sand.", "react( \"chameleon{ 'sand' }\" )" );

	react( "snake = 'A snake looks like ' + pattern{ 'a snake' } + ' in front of ' + pattern + '.'" );
	ok( true, "react( \"snake = 'A snake looks like ' + pattern{ 'a snake' } + ' in front of ' + pattern + '.'\" )" );
	
	strictEqual( react( "snake{ 'stones' }" ), "A snake looks like a snake in front of stones.", "react( \"snake{ 'stones' }\" )" );
	strictEqual( react( "snake{ 'sand' }" ), "A snake looks like a snake in front of sand.", "react( \"snake{ 'sand' }\" )" );
	
	react( "clean" );
	*/
} );

test( "Evaluation to a literal", function() {
	strictEqual( react( "reactive = 20" ), 20, "react( \"reactive = 20\" )" );
	strictEqual( react( "constant = #reactive" ), 20, "react( \"constant = #reactive\" )" );
	strictEqual( react( "reactive = 10" ), 10, "react( \"reactive = 10\" )" );
	strictEqual( react( "constant" ), 20, "react( \"constant\" )" );
	
	react( "clean" );
} );

test( "Removal", function() {
	react( "usedBy_r = true; v = 'v'; w = 'w'" );
	
	//delete examples
	//first example
	ok( react( "r = v + w" ), "react( \"r = v + w\" )" );
	ok( react( "delete r; delete v; delete w" ), "react( \"delete r; delete v; delete w\" )" );
	
	//example on delete order
	react( "v = 'v'" );
	ok( react( "r = usedBy_r + v" ), "react( \"r = usedBy_r + v\" )" );
	raises( function() { react( "delete usedBy_r" ) }, "react( \"delete usedBy_r\" ) -> exception: usedBy_r is a part of r" );

	ok( react( "delete r" ), "react( \"delete r\" )" );
	strictEqual( react( "delete usedBy_r" ), true, "react( \"delete usedBy_r\" )" );
	
	//another example
	react( "v = 'v'; w = 'w'; obj =", {} );
	react( "usedIn_objProp = v + w" );
	react( "obj.prop = usedIn_objProp" );
	
	raises( function() { react( "delete usedIn_objProp" ) }, "react( \"delete usedIn_objProp\" ) -> exception: usedIn_objProp is linked to obj.prop" );
	ok( react( "~obj.prop" ), "react( \"~obj.prop\" )" );
	strictEqual( react( "delete usedIn_objProp" ), true, "react( \"delete usedIn_objProp\" )" );
	
	react( "cleanExcept v, w" );
	
	//clean example
	ok( react( "r = w + v" ), "react( \"r = w + v\" )" );
	ok( react( "clean" ), "react( \"clean\" )" );
	raises( function(){ react( "r" ) }, "react( \"r\" ) not defined" );
	raises( function(){ react( "w" ) }, "react( \"w\" ) not defined" );
	raises( function(){ react( "v" ) }, "react( \"v\" ) not defined" );
	
	//cleanExcept example
	ok( react( "nsiv1 = 'rubbish'; viv = 'secret'; nsiv2 = 'nonsense'" ), "react( \"nsiv1 = 'rubbish'; viv = 'secret'; nsiv2 = 'nonsense'\" )" );
	ok( react( "cleanExcept viv" ), "react( \"cleanExcept viv\" )" );
	
	raises( function(){ react( "nsiv1" ) }, "react( \"nsiv1\" ) not defined" );
	raises( function(){ react( "nsiv2" ) }, "react( \"nsiv2\" ) not defined" );
	strictEqual( react( "viv" ), "secret", "react( \"viv\" )" );
	
	react( "clean" );
} );


module( "Reactive variables and functions" );

test( "Introduction", function() {
	var LetsDoIt = function( food, knowledge ) {
			return food + " " + knowledge;
		};
	ok( true, "LetsDoIt = function( food, knowledge ) { return food + \" \" + knowledge; }" );
	
	//call the function directly in the scope of react.js
	strictEqual( react( LetsDoIt, "( 'Burger', 'Geometry' )" ), "Burger Geometry", "react( LetsDoIt, \"( 'Burger', 'Geometry' )\" )" );

	//store the function in a reactive variable and call it
	strictEqual( react( "doItLater =", LetsDoIt ), LetsDoIt, "react( \"doItLater =\", LetsDoIt )" );
	strictEqual( react( "doItLater( 'Steak', 42 )" ), "Steak 42", "react( \"doItLater( 'Steak', 42 )\" )" );
} );

test( "Basic reactive function call", function() {
	//Hello example
	react( "greet = ", function( name ) {
		return "Hello " + name + "!"
	} );
	ok( true, "react( \"greet = \", function( name ) { return \"Hello \" + name + \"!\"	} )" );
	strictEqual( react( "happyFace = greet( 'You' )" ), "Hello You!", "react( \"happyFace = greet( 'You' )\" )" );

	react( "greet = ", function( name ) {
		return "Hi " + name + "!"
	} );
	ok( true, "react( \"greet = \", function( name ) { return \"Hi \" + name + \"!\" } )" );
	strictEqual( react( "happyFace" ), "Hi You!", "react( \"happyFace\" )" );
	
	//language example
	ok( react( "language = 'Javascript'" ), "react( \"language = 'Javascript'\" )" );
	ok( react( "Browser = ", function( lang ) { return "I speak " + lang + "!" }, "( language )" ), "react( \"Browser = \", function( lang ) { return \"I speak \" + lang + \"!\" }, \"( language )\" )" );
	strictEqual( react( "Browser" ), "I speak Javascript!", "react( \"Browser\" )" );
	ok( react( "language = 'react.js'" ), "react( \"language = 'react.js'\" )" );
	strictEqual( react( "Browser" ), "I speak react.js!", "react( \"Browser\" )" );
	
	//encrypted message example
	var inGlobalJS, inLocalJS,
	    whisper = function( msg ) {
			inLocalJS = msg;
	    },
	    shout = function( msg ) {
			inGlobalJS = msg;
	    };
	
	ok( true, "whisper = function( msg ) { inLocalJS = msg; }" );
	ok( true, "shout = function( msg ) { inGlobalJS = msg; }" );
	
	ok( react( "announce =", shout ), "react( \"announce =\", shout )" );
	react( "inReactJS = announce === ", shout, " ? " +
		"'ENCRYPTED MESSAGE' : 'Atlantis is located at 3H4fD5G'" );
	ok( true, "react( \"inReactJS = announce === \", shout, \" ? 'ENCRYPTED MESSAGE' : 'Atlantis is located at 3H4fD5G'\" )" );
	ok( !react( "announce( inReactJS )" ), "react( \"announce( inReactJS )\" )" );
	strictEqual( inGlobalJS, "ENCRYPTED MESSAGE", "inGlobalJS" );
	ok( react( "announce =", whisper ), "react( \"announce =\", whisper )" );
	strictEqual( inLocalJS, "Atlantis is located at 3H4fD5G", "inLocalJS" );
	
	//attention whore example
	var attentionWhore,
	    echo = function( sound ) {
			return attentionWhore = sound;
	    };
	
	ok( true, "echo = function( sound ) { return attentionWhore = sound; }" );
	
	ok( react( "voice = 'Look at me!'" ), "react( \"voice = 'Look at me!'\" )" );
	ok( react( "echo = ", echo, "( voice )" ), "react( \"echo = \", echo, \"( voice )\" )" );
	strictEqual( attentionWhore, "Look at me!", "attentionWhore" );
	strictEqual( react( "echo" ), "Look at me!", "react( \"echo\" )" );
	
	ok( react( "voice = 'I deserve attention!'" ), "react( \"voice = 'I deserve attention!'\" )" );
	strictEqual( attentionWhore, "I deserve attention!", "attentionWhore" );
	strictEqual( react( "echo" ), "I deserve attention!", "react( \"echo\" )" );
	
	ok( react( "echo = 'No you don\\'t'" ), "react( \"echo = 'No you don\\'t'\" )" );
	ok( react( "voice = 'You are still there?'" ), "react( \"voice = 'You are still there?'\" )" );
	strictEqual( attentionWhore, "I deserve attention!", "attentionWhore" );
	strictEqual( react( "echo" ), "No you don't", "react( \"echo\" )" );
	
	//don't care example
	var dontCare,
	    sadPerson = function( words ) {
			dontCare = words;	
	    };
	
	ok( true, "sadPerson = function( words ) { dontCare = words; }" );
	
	ok( react( "beingNice = 'Wanna be left alone?'" ), "react( \"beingNice = 'Wanna be left alone?'\" );" );
	ok( !react( sadPerson, "( #beingNice )" ), "react( sadPerson, \"( #beingNice )\" )" );
	strictEqual( dontCare, "Wanna be left alone?", "dontCare" );
	ok( react( "beingNice = 'Ok, no problem!'" ), "react( \"beingNice = 'Ok, no problem!'\" )" );
	strictEqual( dontCare, "Wanna be left alone?", "dontCare" );
} );

test( "Deregistering function call", function() {

} );

test( "Registering function call", function() {

} );


module( "Reactive variables and object properties" );

test( "Introduction", function() {

} );

test( "Basic assignment", function() {

} );

test( "Reversible assignment", function() {

} );

test( "Deregistering property updates", function() {

} );

test( "Deletion", function() {

} );


module( "Objects" );

test( "Operator overloading", function() {

} );

test( "Custom objects", function() {

} );