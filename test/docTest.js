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
	var func = function( r ) {
		return r;
	};
	
	react( "r1 = 10; r2 = 10;" );
	react( "obj1 =", { prop : "head - body - " }, "; obj2 =", { prop : "head - body - " } );
	react( "obj3 =", { prop : "head - body - " }, "; obj4 =", { prop : "head - body - " } );
	react( "obj5 =", { repl : "repl" }, "; obj6 =", { repl : "repl" } );
	react( "prop = 'repl'" );
	react( "func1 =", func, "; func2 =", func );
	react( "arg = 10" );
	react( "bool1 = true; bool2 = true;" );
	react( "s = 2" );
	
	strictEqual( react( "r1 += 5" ), react( "r2 = r2+5" ), "react( \"r += 5\" ) === react( \"r = r+5\" )" );
	strictEqual( react( "obj1.prop += 'tail'" ), react( "obj2.prop = obj2.prop + 'tail'" ), "react( \"obj.prop += 'tail'\" ) === react( \"obj.prop = obj.prop + 'tail'\" )" );
	strictEqual( react( "-= r1" ), react( "r2 = -r2" ), "react( \"-= r\" ) === react( \"r = -r\" )" );
	
	strictEqual( react( "obj3.=prop" ), react( "obj4 = obj4.prop" ), "react( \"obj.=prop\" ) === react( \"obj = obj.prop\" )" );
	strictEqual( react( "obj5[= prop ]" ), react( "obj6 = obj6[ prop ]" ), "react( \"obj[= prop ]\" ) === react( \"obj = obj[ prop ]\" )" );
	strictEqual( react( "func1(= arg )" ), react( "func2 = func2( arg )" ), "react( \"func(= arg )\" ) === react( \"func2 = func2( arg )\" )" );
	
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
	strictEqual( react( "comilersDiet = diet" ), String( food ) + " for breakfast, " + String( food ) + " for lunch and " + String( food ) + " for supper", "react( \"comilersDiet = diet\" )" );
	
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
	
	react( "clean" );
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
	
	react( "clean" );
} );

test( "Deregistering function call", function() {
	//invitation example
	var niceInvitation = "",
	    soonRetired = function( lastWords ) {
			niceInvitation += lastWords;	
		};
	
	ok( soonRetired, "soonRetired = function( lastWords ) { niceInvitation += lastWords; }" );
	
	ok( react( "words = 'Visit me!'" ), "react( \"words = 'Visit me!'\" )" );
	ok( !react( soonRetired, "( words )" ), "!react( soonRetired, \"( words )\" )" );
	strictEqual( niceInvitation, "Visit me!", "niceInvitation" );
	
	ok( react( "words = ' At the beach!'" ), "react( \"words = ' At the beach!'\" )" );
	strictEqual( niceInvitation, "Visit me! At the beach!", "niceInvitation" );
	
	raises( function() { react( "~", soonRetired, "( words, ' But bring presents!' )" ) }, "trying to deregister with different arguments: react( \"~\", soonRetired, \"( words, ' But bring presents!' )\" ) -> exception" );
	ok( react( "words = ' Come soon!'" ), "react( \"words = ' Come soon!'\" )" );
	strictEqual( niceInvitation, "Visit me! At the beach! Come soon!", "niceInvitation" );
	
	ok( react( "~", soonRetired, "( words )" ), "successful deregistration with same arguments: react( \"~\", soonRetired, \"( words )\" )" );
	ok( react( "words = ' But bring presents!'" ), "react( \"words = ' But bring presents!'\" )" );
	strictEqual( niceInvitation, "Visit me! At the beach! Come soon!", "niceInvitation" );
	
	//cactus example
	react( "rainOnCactus =", function() {
		return "The cactus is still there!";
	} );
	
	ok( true, "react( \"rainOnCactus =\", function() { return \"The cactus is still there!\"; } );" );
	strictEqual( react( "cactus = rainOnCactus()" ), "The cactus is still there!", "react( \"cactus = rainOnCactus()\" )" );
	
	raises( function() { react( "~rainOnCactus()" ) }, "react( \"~rainOnCactus()\" ) -> exception" );
	strictEqual( react( "cactus" ), "The cactus is still there!", "react( \"cactus\" )" );
	
	ok( react( "delete cactus" ), "react( \"delete cactus\" )" );
	
	//swearing example
	var swearing = "",
	    swear = function( syllable ) {
			swearing += syllable;
	    };
	
	ok( swear, "swear = function( syllable ) { speack += syllable; }" );
	
	ok( react( "dirtyWord = 'DAMN!'" ), "react( \"dirtyWord = 'DAMN!'\" )" );
	react( swear, "( dirtyWord );", swear, "( dirtyWord )" );
	strictEqual( swearing, "DAMN!DAMN!", "swearing" );
	
	ok( react( "dirtyWord = 'SH*T!'" ), "react( \"dirtyWord = 'SH*T!'\" )" );
	strictEqual( swearing, "DAMN!DAMN!SH*T!SH*T!", "swearing" );
	
	ok( react( "~", swear, "( dirtyWord )" ), "react( \"~\", swear, \"( dirtyWord )\" )" );
	ok( react( "dirtyWord = 'F*CK!'" ), "react( \"dirtyWord = 'F*CK!'\" )" );
	strictEqual( swearing, "DAMN!DAMN!SH*T!SH*T!F*CK!", "swearing" );
	
	ok( react( "~", swear, "( dirtyWord )" ), "react( \"~\", swear, \"( dirtyWord )\" )" );
	ok( react( "dirtyWord = 'DAMN!'" ), "react( \"dirtyWord = 'DAMN!'\" )" );
	strictEqual( swearing, "DAMN!DAMN!SH*T!SH*T!F*CK!", "swearing" );
	
	react( "clean" );
} );

test( "Registering function call", function() {
	//trip booking example
	var booked = false,
		bookTrip = function( salary ) {
			booked = !booked;
	    };
	
	ok( true, "bookTrip = function( salary ) { booked = true; }" );
	
	ok( react( "salary = 2000" ), "react( \"salary = 2000\" )" );
	ok( react( bookTrip, ":( salary )" ), "react( bookTrip, \":( salary )\" )" );
	strictEqual( booked, false, "booked" );
	ok( react( "salary = 2500" ), "react( \"salary = 2500\" )" );
	strictEqual( booked, true, "booked" );
	ok( react( "~", bookTrip, "( salary )" ), "react( \"~\", bookTrip, \"( salary )\" )" );
	ok( react( "salary = 3000" ), "react( \"salary = 3000\" )" );
	strictEqual( booked, true, "booked" );
	
	//asking out example
	var girl = "nobody",
		decide = function( girl1, girl2 ) {
			girl = "Zoey";
		};
	
	ok( true, "decide = function( girl1, girl2 ) { girl = girl1; }" );
	
	ok( react( "Zoey = 'nice'; Jessi = 'cool'" ), "react( \"Zoey = 'nice'; Jessi = 'cool'\" )" );
	ok( react( decide, ":( Zoey, Jessi )" ), "react( decide, \":( Zoey, Jessi )\" )" );
	strictEqual( girl, "nobody", "girl" );
	ok( react( "Jessi = 'cocky'" ), "react( \"Jessi = 'cocky'\" )" );
	strictEqual( girl, "Zoey", "girl" );
	ok( react( "~", decide, "( Zoey, Jessi )" ), "react( \"~\", decide, \"( Zoey, Jessi )\" )" );
	ok( react( "Jessi = 'apologetic'" ), "react( \"Jessi = 'apologetic'\" )" );
	strictEqual( girl, "Zoey", "girl" );
	
	react( "clean" );
} );


module( "Reactive variables and object properties" );

test( "Introduction", function() {
	var chameleon = {};
	
	ok( chameleon, "chameleon = {}" );
	ok( react( chameleon, ".pattern = 'branches'" ), "react( chameleon, \".pattern = 'branches'\" )" );
	
	var jaguar = {};
	ok( jaguar, "jaguar = {}" );
	ok( react( "jaguar =", jaguar ), "react( \"jaguar =\", jaguar )" );
	ok( react( "jaguar.colour = 'black'" ), "react( \"jaguar.colour = 'black'\" )" );
	
	react( "~", chameleon, ".pattern" );
	react( "~jaguar.colour" );
	
	var background = { pattern : 'leaves' };
	react( "chameleonPattern = ", background, ".pattern" );
	strictEqual( react( "chameleonPattern" ), 'leaves', "react( \"chameleonPattern\" )" );
	
	background.pattern = 'ground';
	strictEqual( react( "chameleonPattern" ), 'leaves', "react( \"chameleonPattern\" )" );
	
	react( background, ".pattern = 'stone'" );
	strictEqual( react( "chameleonPattern" ), 'stone', "react( \"chameleonPattern\" )" );
	
	react( "clean" );
} );

test( "Basic assignment", function() {
	//hunting example
	var jaguar = {};
	ok( jaguar, "jaguar = {}" );
	ok( !react( "closeToPrey = false" ), "react( \"closeToPrey = false\" )" );
	ok( react( "action = closeToPrey ? 'attacking' : 'stalking'" ), "react( \"action = closeToPrey ? 'attacking' : 'stalking'\" )" );
	
	ok( react( jaguar, ".action = action" ), "react( jaguar, \".action = action\" )" );
	strictEqual( jaguar.action, 'stalking', "jaguar.action" );
	
	ok( react( "closeToPrey = true" ), "react( \"closeToPrey = true\" )" );
	strictEqual( jaguar.action, 'attacking', "jaguar.action" );
	
	react( "~", jaguar, ".action" );
	react( "clean" );
	
	//jaguar pattern exception example I
	var jaguar = { pattern : 'entirely black' };
	ok( jaguar, "jaguar = { pattern : 'entirely black' }" );
	ok( react( "pattern = 'tawny-yellow with black spots'" ), "react( \"pattern = 'tawny-yellow with black spots'\" )" );
	raises( function() { react( jaguar.pattern, " = pattern" ) }, "react( jaguar.pattern, \" = pattern\" )" );
	
	react( "clean" );
	
	//jaguar pattern exception example II
	var jaguar = { pattern : 'entirely black' };
	ok( jaguar, "jaguar = { pattern : 'entirely black' }" );
	ok( react( "pattern = 'tawny-yellow with black spots'" ), "react( \"pattern = 'tawny-yellow with black spots'\" )" );
	raises( function() { react( "jaguar.pattern = pattern" ) }, "react( \"jaguar.pattern = pattern\" )" );
	
	react( "clean" );
	
	//jaguar pattern object variable example
	ok( react( "jaguar =", jaguar = { pattern : 'entirely black' } ), "react( \"jaguar =\", { pattern : 'entirely black' } )" );
	ok( react( "pattern = 'tawny-yellow with black spots'" ), "react( \"pattern = 'tawny-yellow with black spots'\" )" );
	ok( react( "jaguar.pattern = pattern" ), "react( \"jaguar.pattern = pattern\" )" );
	strictEqual( jaguar.pattern, "tawny-yellow with black spots", "jaguar.pattern" );
	
	react( "~jaguar.pattern" );
	react( "clean" );
	
	//jaguar/leopard example
	var jaguar = { pattern : 'entirely black' },
	    leopard = { pattern : 'white-yellow with black spots' };
	
	ok( jaguar, "jaguar = { pattern : 'entirely black' }" );
	ok( leopard, "{ pattern : 'white-yellow with black spots' }" );
	
	ok( react( "cat =", jaguar ), "react( \"cat =\", jaguar )" );
	ok( react( "cat.pattern = 'tawny-yellow with black spots'" ), "react( \"cat.pattern = 'tawny-yellow with black spots'\" )" );
	strictEqual( jaguar.pattern, 'tawny-yellow with black spots', "jaguar.pattern" );
	
	ok( react( "cat = ", leopard ), "react( \"cat = \", leopard )" );
	strictEqual( leopard.pattern, 'tawny-yellow with black spots', "leopard.pattern" );
	
	react( "~cat.pattern" );
	react( "clean" );
	
	//child with paint example
	var flat = {},
	    child = { paintAtHands : true };
	
	ok( flat, "flat = {}" );
	ok( child, "child = { paintAtHands : true }" );
	
	ok( react( "child =", child ), "react( \"child =\", child )" );
	ok( react( "child.inRoom = 'kitchen'" ), "react( \"child.inRoom = 'kitchen'\" )" );
	ok( react( flat, "[ child.inRoom ] = 'coloured'" ), "react( flat, \"[ child.inRoom ] = 'coloured'\" )" );
	strictEqual( flat.kitchen, 'coloured', "flat.kitchen" );
	
	ok( react( "child.inRoom = 'living_room'" ), "react( \"child.inRoom = 'living_room'\" )" );
	strictEqual( flat.living_room, 'coloured', "flat.living_room" );
	
	ok( react( "child.inRoom = 'bath'" ), "react( \"child.inRoom = 'bath'\" )" );
	strictEqual( flat.bath, 'coloured', "flat.bath" );
	
	ok( react( "child.inRoom = 'bedroom'" ), "react( \"child.inRoom = 'bedroom'\" )" );
	strictEqual( flat.bedroom, 'coloured', "flat.bedroom" );
	
	react( "~", flat, "[ child.inRoom ]" );
	react( "~child.inRoom" );
	react( "clean" );
} );

test( "Reversible assignment", function() {
	var boys = {
			'Jack' : 'friend',
			'Brendan' : 'friend',
			'Floyd' : 'friend'
	    };
	
	ok( boys, "boys = { 'Jack' : 'friend', 'Brendan' : 'friend', 'Floyd' : 'friend' }" );
	
	ok( react( "name = 'Brendan'" ), "react( \"name = 'Brendan'\" )" );
	ok( react( boys, "[ name ] ~= 'boyfriend'" ), "react( boys, \"[ name ] ~= 'boyfriend'\" )" );
	strictEqual( boys.Brendan, 'boyfriend', "boys.Brendan" );
	
	ok( react( "name = 'Jack'" ), "react( \"name = 'Jack'\" )" );
	strictEqual( boys.Brendan, 'friend', "boys.Brendan" );
	strictEqual( boys.Jack, 'boyfriend', "boys.Jack" );
	
	ok( react( "name = 'Floyd'" ), "react( \"name = 'Floyd'\" )" );
	strictEqual( boys.Jack, 'friend', "boys.Jack" );
	strictEqual( boys.Floyd, 'boyfriend', "boys.Floyd" );
	
	react( "clean" );
} );

test( "Deregistering property updates", function() {
	//bad listener example I
	var badListener = {};
	
	ok( badListener, "badListener = {}" );
	ok( react( "bodypart = 'ear'" ), "react( \"bodypart = 'ear'\" )" );
	ok( react( badListener, "[ bodypart ] ~= 'voice'" ), "react( badListener, \"[ bodypart ] ~= 'voice'\" )" );
	strictEqual( badListener.ear, 'voice', "badListener.ear" );
	
	ok( react( "bodypart = 'mouth'" ), "react( \"bodypart = 'mouth'\" )" );
	strictEqual( badListener.mouth, 'voice', "badListener.mouth" );
	ok( !("ear" in badListener), "!(\"ear\" in badListener)" );
	
	ok( react( "~", badListener, "[ bodypart ]" ), "react( \"~\", badListener, \"[ bodypart ]\" )" );
	ok( react( "bodypart = 'ear'" ), "react( \"bodypart = 'ear'\" )" );
	ok( !("mouth" in badListener), "!(\"mouth\" in badListener)" );
	ok( !("ear" in badListener), "!(\"ear\" in badListener)" );
	
	react( "clean" );
	
	//bad listener example II
	var badListener = {};
	
	ok( badListener, "badListener = {}" );
	ok( react( "bodypart = 'earL'" ), "react( \"bodypart = 'earL'\" )" );
	ok( react( badListener, "[ bodypart ] = 'Listen to me!'" ), "react( badListener, \"[ bodypart ] = 'Listen to me!'\" );" );
	strictEqual( badListener.earL, "Listen to me!", "badListener.earL" );
	
	raises( function() { react( "~", badListener, ".bodypart" ) }, "react( \"~\", badListener, \".bodypart\" ) -> exception" );
	ok( react( "bodypart = 'earR'" ), "react( \"bodypart = 'earR'\" )" );
	strictEqual( badListener.earR, "Listen to me!", "badListener.earR" );
	
	react( "~", badListener, "[ bodypart ]" );
	ok( react( "bodypart = 'ears'" ), "react( \"bodypart = 'ears'\" )" );
	ok( !( "ears" in badListener ), "badListener.ears" );
	
	react( "clean" );
	
	//bad listener example III
	var badListener = { ear : false };
	
	ok( badListener, "badListener = { ear : false}" );
	ok( react( "badListener = ", badListener ), "react( \"badListener = \", badListener )" );
	ok( react( "badListener.ear ~= true" ), "react( \"badListener.ear = true\" )" );
	strictEqual( badListener.ear, true, "badListener.ear" );
	
	raises( function() { react( "~", badListener, ".ear" ) }, "react( \"~\", badListener, \".ear\" )" );
	strictEqual( badListener.ear, true, "badListener.ear" );
	
	ok( react( "~badListener[ 'ear' ]" ), "react( \"~badListener[ 'ear' ]\" )" );
	strictEqual( badListener.ear, false, "badListener.ear" );
	
	react( "clean" );
} );

test( "Deletion", function() {
	//autumn tree example
	var autumnTree = {
			leaf2516 : 'orange',
			leaf5874 : 'red',
			leaf9435 : 'yellow'
		};
	
	ok( autumnTree, "autumnTree = { leaf2516 : 'orange', leaf5874 : 'red', leaf9435 : 'yellow' }" );
	
	ok( react( "leaf = 'leaf2516'" ), "react( \"leaf = 'leaf2516'\" )" );
	ok( react( "delete", autumnTree, "[ leaf ]" ), "react( \"delete\", autumnTree, \"[ leaf ]\" )" );
	ok( !("leaf2516" in autumnTree), "!(\"leaf2516\" in autumnTree)" );
	
	ok( react( "leaf = 'leaf5874'" ), "react( \"leaf = 'leaf5874'\" )" );
	ok( !("leaf5874" in autumnTree), "!(\"leaf5874\" in autumnTree)" );
	
	ok( react( "~", autumnTree, "[ leaf ]" ), "react( \"~\", autumnTree, \"[ leaf ]\" )" );
	
	react( "leaf = 'leaf9435'" );
	ok( "leaf9435" in autumnTree, "!(\"leaf9435\" in autumnTree)" );
	
	react( "clean" );
	
	//lizard example
	var lizard = { tail : 'long', feet : 'short' };
	
	ok( lizard, "lizard = { tail : 'long', feet : 'short' }" );
	
	ok( react( "part = 'tail'" ), "react( \"part = 'tail'\" )" );
	ok( react( "~delete", lizard, "[ part ]" ), "react( \"~delete\", lizard, \"[ part ]\" )" );
	ok( !("tail" in lizard), "!(\"tail\" in lizard)" );
	
	ok( react( "part = 'feet'" ), "react( \"part = 'feet'\" )" );
	strictEqual( lizard.tail, "long", "lizard.tail" );
	ok( !("feet" in lizard), "!(\"feet\" in lizard)" );
	
	react( "~", lizard, "[ part ]" );
	strictEqual( lizard.feet, "short", "lizard.feet" );
	ok( react( "part = 'tail'" ), "react( \"part = 'tail'\" )" );
	strictEqual( lizard.tail, "long", "lizard.tail" );
	
	react( "clean" );
} );


module( "Objects" );

test( "Operator overloading", function() {
	//commutative example
	var obj1 = {
			value : 10,
			"infix+" : function( r ) {
				return { value : this.value + r.value };
			},
			"prefix-" : function() {
				return { value : -this.value };
			}
	    },
	    obj2 = {
			value : 20
	    };
    
	strictEqual( react( obj1, "+", obj2 ).value, 30, "react( obj1, \"+\", obj2 )" );
	strictEqual( react( "-", obj1 ).value, -10, "react( \"-\", obj1 ).value" );
	strictEqual( react( obj2, "+", obj1 ).value, 30, "react( obj2, \"+\", obj1 )" );
	
	//no commutative example
	var obj1 = {
			value : 10,
			"infix^" : function( r, swapped ) {
				if ( swapped )
					throw( "Exponentation is not commutative!" );
				
				return { value : Math.pow( this.value, r.value ) };
			}
	    },
	    obj2 = {
			value : 2
	    };
	
	strictEqual( react( obj1, "^", obj2 ).value, 100, "react( obj1, \"^\", obj2 ).value" );
	raises( function() { react( obj2, "^", obj1 ).value }, "^ does not commute: react( obj2, \"^\", obj1 ) -> exception" );
	
	//reactive overloading example
	var obj1 = {
			value : 10,
			"infix+" : function( r) {
				return { value : this.value + r.value };
			},
			"prefix-" : function() {
				return { value : -this.value };
			}
	    },
	    obj2 = {
			value : 20
	    },
	    obj3 = {
			value : 50
	    };
	
	react( "left =", obj1, "; right =", obj2 );
	strictEqual( react( "res = left + right" ).value, 30, "react( \"res = left + right\" )" );
	ok( react( "right =", obj3 ), "react( \"right =\", obj3 )" );
	strictEqual( react( "res" ).value, 60, "react( \"res\" )" );
} );

test( "Custom objects", function() {
	var Type = function( value ) {
			if ( !(this instanceof Type) )
				return new Type( value );
			
			this.value = value;
	    };
    
	Type.prototype = {
		"infix+" : function( obj2 ) {
			return Type( this.value + obj2.value );
		}
	};
    
	react( "x = 10" );
	var inst1 = react( "inst1 =", Type, "( x )" );
	strictEqual( inst1.value, 10, "inst1.value" );
	ok( inst1 instanceof Type, "inst1 instanceof Type" );
	
	var inst2 = react( "inst2 = inst1 + ", Type( 20 ) );
	strictEqual( inst2.value, 30, "inst2.value" );
	ok( inst2 instanceof Type, "inst2 instanceof Type" );
	
	react( "x = 20" );
	inst1 = react( "inst1" );
	strictEqual( inst1.value, 20, "inst1.value" );
	ok( inst1 instanceof Type, "inst1 instanceof Type" );
	inst2 = react( "inst2" );
	strictEqual( inst2.value, 40, "inst2.value" );
	ok( inst2 instanceof Type, "inst2 instanceof Type" );
} );