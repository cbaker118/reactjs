react.js creates a single global variable named `react`. It points to a function.

#react()
`react()` is the function, where all the magic happens. Think of it as the interface to another programming language with independent scope. `react()` interacts with normal Javascript through its arguments, its return value and by reactive function calls and reactive object property assignments.


##Arguments
`react()` can handle any of Javascript's basic datatypes (null, boolean, number, string) and special values (`undefined`, `Infinity`, `NaN`) in string form or as Javascript literal. For example, the following are the same:

	react( "true" );
	react( true );

Javascript objects, including arrays, and functions are not supported in string form, but `react()` accepts them as literals:

	react( function( x ) { return x*x; } );
	react( { prop1 : "value1", prop2 : "value2" } );
	react( [ 10, -20, 30 ] );

Numbers begin with a figure or a dot and can use scientific notation:

	react( "5" );
	react( "0.5e2" ); 	//is the same as react( "0.5E2" )
	react( ".5" ); 		//is the same as react( "0.5" )

To pass a string, use a combination of double quote and single quote or escape the inner quotes:

	react( "'string'" );
	react( '"string"' );
	react( "\"string\"" );
	react( '\'string\'' );

Alphanumeric sequences that start with a character or an underscore, but are not marked with quotes are handled as identifiers, that can be used as variable names or property names of objects:
	
	react( "_id = 'variable'" );
	react( "obj =", {} );
	react( "obj.prop = 'value'" );

All arguments of non-string type are directly passed along to expression evaluation. Arguments of string type are parsed, their tokens are separately evaluated and then passed along to expression evaluation. Expression evaluation is not affected by a transition from one argument to the next one and handles the complete list of arguments as a constant stream of tokens. As an example, all these calls produce exactly the same result:
    
  	react( 10, "+", 5 );
	react( "10+5" );
	react( "10", "+5" );
	react( "10+", 5 );

##Return value
The result of the last expression is the return value of react():
	
	react( "x+z; 3+8" );
	//returns Javascript literal 11
	
	react( "x+y" );
	//returns the literal value of x plus the literal value of y
	
	react( "r = x+y" );
	//returns the literal value of r
	//(which is the same as one line above)
	
	react( "s =", {} );
	//returns the object literal

#Variables


##Declaration
Reactive variables are created just as in Javascript by giving a name followed by the assignment operator `=` and the value to assign. The assigned value can be anything, that can be passed to the `react()`-function. For instance:

	react( "number = 5" );
	react( "object =", { prop:"value" } );
	react( "hello = ", function( name ) {
		return "Hello " + name + "!";
	} );

It is neither necessary nor supported to put a `var` in front of the variables name. Variables are accessible across different calls of `react()`: They are global in the reactive scope. A later call of `react( "number" )` will result in returning `5`. All variables created inside `react()` are reactive, so they will react to changes of their value.

Of course, already existing reactive variables can be used to define a new one.

	react( "number = 10" );
	react( "number2 = number - 4.35" );

Variables need to be explicitly declared before they are used.

	react( "reactive = notDeclared + 5" );
	//exception: notDeclared has not been declared yet

##Change Propagation
Once a reactive variable is changed, this change propagates to all variables and expressions the changed variable is a part of.

	react( "soonChanged = undefined" );
	react( "reactive = soonChanged + 5" );
	react( "reactive2 = reactive * 10" );
	
	react( "soonChanged = 10" );
	//changes the value of reactive from "undefined5" to 15
	//and of reactive2 from NaN to 150

This is worth repeating in bold letters, because it explains the universal behaviour of any kind of reactive expression: **If a variable changes, all depending expressions are re-evaluated.**

Another example:

	react( "clouds = 99" );
	react( "cloudy = clouds >= 100" );
	//sets cloudy to false
	
	react( "weather = cloudy ? 'Could be better.' : 'Excellent.'" );
	//sets weather to 'Excellent.'
	
	react( "clouds += 1" );
	//sets cloudy to true, sets weather to 'Could be better.'

##Context variables
Variables can be context sensitive. That means, that a variable, although defined in a single way, can have different values in different contexts. A context variable is just a variable depending  on one single funciton literal or more function literals combined in an expression. By defining a context for an expression with the context operator `{}`, we tell react.js to handle the containing variables in the given context. Valid contexts are literals and variables, but not expressions.

	var f = function( WhoIam ) {
			return "My name is " + WhoIam + ".";
	    };
	
	react( "schizophrenic =", f );
	react( "schizophrenic{ 'David' }" );	//"My name is David."
	react( "schizophrenic{ 'Sophie' }" );	//"My name is Sophie."

Right now, the context variable behaves exactly like a function. The syntax of the context operator is no coincidence, since it just calls the function with the context as arguments. We can also pass a list of more contexts to the variable.

	var f = function( myName, myAge ) {
			return "I'm a " + myAge + " years old " + myName + ".";
	    };
	
	react( "confused =", f );
	react( "confused{ 'Bryan', 6 }" );	//"I'm a 6 years old Bryan."
	react( "confused{ 'Brian', 5 }" );	//"I'm a 5 years old Brian."

So, where is the advantage here? Contexts can be inherited! We need not tell each and every context variable in which context we like it to be evaluated as long as it has an ancestor with the desired context assigned.

	var son = function( familyName ) {
			return "Simon " + familyName;
	    },
	    father = function( familyName ) {
			return "Jack " + familyName;
	    };
	
	react( "simonSays = 'I\'m ' + ", son,
		" + ' and my father is ' + ", father );
	
	react( "simonSays{ 'Watson' }" );
	//"I'm Simon Watson and my father is Jack Watson"
	
	react( "simonSays{ 'Johnson' }" );
	//"I'm Simon Johnson and my father is Jack Johnson"

The inheritence can be nested to any degree. Functions in context variables, that are not refering to a context, are handled as normal function literals, which mostly returns useless values.

	var food = function( food ) {
			return food;
	    };
	
	react( "food = ", food );
	react( "diet  = food + ' for breakfast, ' + " +
			"food + ' for lunch and ' + " +
			"food + ' for supper'" );
	
	react( "jackiesDiet = diet{ 'yoghurt' }" );
	//"yoghurt for breakfast,
	// yoghurt for lunch and
	// yoghurt for supper"

	react( "tomsDiet = diet{ 'steak' }" );
	//"steak for breakfast,
	// steak for lunch and
	// steak for supper"

	react( "comilersDiet = diet" );
	//"function( food ){ [function body] } for breakfast,
	// function( food ){ [function body] } for lunch and
	// function( food ){ [function body] } for supper"

Context variables can also be given a custom context. This custom context is only valid inside the expression it was fixed, but is always used there. Especially, it is not overwritten by inherited contexts. Only expressions and variables can be assigned a custom context.

	var pattern = function( pattern ) {
			return pattern;
	    };
	
	react( "pattern =", pattern );
	react( "chameleon = 'A chameleon looks like ' + pattern +" +
		"' in front of ' + pattern + '.'" );
	
	react( "chameleon{ 'stones' }" );
	//"A chameleon looks like stones in front of stones."
	react( "chameleon{ 'sand' }" );
	//"A chameleon looks like sand in front of sand."
	
	react( "snake = 'A snake looks like ' + pattern{ 'a snake' } +" +
		"' in front of ' + pattern + '.'" );
	
	react( "snake{ 'stones' }" );
	//"A snake looks like a snake in front of stones."
	react( "snake{ 'sand' }" );
	//"A snake looks like a snake in front of sand."

##Evaluation
Evaluation is like taking a snapshot of a reactive variable by evaluating its current value to a constant literal. Thus, the result of an evaluation will no longer react to changes of its source.

Whenever reactive variables interact with native Javascript outside of `react()` they are evaluated to a literal. This concerns the following situations:

- Return value of `react()`: `react()` returns literals only. Especially, if the result of the last expression in a call of `react()` is reactive, it is evaluated to a literal.
- Arguments in reactive function calls: If a function is called with reactive variables as arguments, the literal values of these arguments are passed. The function is then executed in the scope of normal Javascript. Changes to one of the reactive arguments will call the function again with updated arguments.
- Reactive object property assignment: If a reactive variable is assigned to a property of a Javascript object, its literal value is assigned instead. Changes to the assigned reactive variable result in a new assignment of its updated literal value to the object property.

To manually evaluate a reactive variable to a literal value, use the `#` operator.
	
	react( "reactive = 20" );
	
	//assigns the constant value 20 to constant
	react( "constant = #reactive" );
	
	//will not update constant
	react( "reactive = 10" );

##Removal
Since `react()` has just one global scope that is never closed, variables will never be deleted automatically. Therefore, delete reactive variables, if they are no longer used. There are two ways to delete variables.



###delete
To delete single variables use the `delete` operator:

	react( "r = v + w" );
	react( "delete r; delete v; delete w" );

Variables in use cannot be deleted. Variables in use are those, which are directly used in a function call or object property assignment or are a part of another variable.
	
	react( "r = usedBy_r + v" )
	
	//would throw an exception, since usedBy_r is a
	//part of r
	//react( "delete usedBy_r" );
	
	react( "delete r" );
	//now usedBy_r can safely be deleted
	react( "delete usedBy_r" );

Another example:

	react( "usedIn_objProp = v + w" );
	react( "obj.prop = usedIn_objProp" );
	
	//would throw an exception, since usedIn_objProp
	//is linked to obj.prop
	//react( "delete usedIn_objProp" );
	
	//deregister usedIn_objProp from obj.prop
	react( "~obj.prop" );
	
	//now usedIn_objProp can safely be deleted
	react( "delete usedIn_objProp" );

###clean
There is no need to manually keep track of which variables are used and which ones are not. To delete all unused variables in one step use the `clean` statement.
	
	react( "clean" );
	
`clean` also deletes used variables, that became unused during the process of using `clean`.
	
	react( "r = w + v" );
	
	//deletes r and thus renders w and v unused,
	//which are deleted then, too.
	react( "clean" );

To delete all unused variables but with some exceptions, use `cleanExcept`:

	//nsiv : not so important variable
	//viv  : very important variable
	react( "nsiv1 = 'rubbish'; viv = 'secret'; nsiv2 = 'nonsense'" );
	
	//deletes nsiv1 and nsiv2, but not viv
	react( "cleanExcept viv" );

#Functions
Functions must be created in the scope of normal Javascript. Then, they can be passed to `react()`.

	var LetsDoIt = function( food, knowledge ) {
			/*magic*/ return product;
	    };
	
	//call the function directly in the scope of react.js
	react( LetsDoIt, "( 'Burger', 'Geometry' )" );

	//store the function in a reactive variable and call it
	react( "doItLater =", LetsDoIt );
	react( "doItLater( 'Steak', 42 )" );


##Basic call
If a function is stored in a variable, we can call this function by using the variable's name followed by the call operator `()`, just as in normal Javascript. But, if we change the function the variable is pointing to, our previous function call has been modified. Then, our basic reactive principle applies: **If a variable changes, all depending expressions are re-evaluated.** That means, that the function call will be applied again, but now using another function.

	react( "greet = ", function( name ) {
		return "Hello " + name + "!"
	} );
	react( "happyFace = greet( 'You' )" );	//"Hello You!"
	
	react( "greet = ", function( name ) {
		return "Hi " + name + "!"
	} );
	react( "happyFace" );					//"Hi You!"

The function call is also applied again, if a normal function is called with one or more reactive variables as arguments and these variables change at a later time:
    
	react( "language = 'Javascript'" );
	react( "Browser = ", function( lang ) {
		return "I speak " + lang + "!"
	}, "( language )" );
	
	react( "Browser" );		//"I speak Javascript!"
	react( "language = 'react.js'" );
	react( "Browser" );		//"I speak react.js!"

When calling a function with reactive arguments, the arguments will be evaluated to a literal before they are passed to the function. Inside the function, we are in normal Javascript scope again and nothing will behave reactively.

Of course, we can also call a function variable with reactive arguments.

	inGlobalJS;
	var inLocalJS,
	    whisper = function( msg ) {
			inLocalJS = msg;
	    },
	    shout = function( msg ) {
			inGlobalJS = msg;
	    };
	
	react( "announce =", shout );
	react( "inReactJS = announce === ", shout, " ? " +
		"'ENCRYPTED MESSAGE' : 'Atlantis is located at 3H4fD5G'" );
	react( "announce( inReactJS )" );
	alert( inGlobalJS );	//"ENCRYPTED MESSAGE"
	react( "announce =", whisper );
	alert( inLocalJS );		//"Atlantis is located at 3H4fD5G"

Notice, how we used the function to keep variables in native Javascript up-to-date.

Using reactive function calls, it is possible to listen to a variable and call an abitrary function on its change. This is like attaching a handler to kind of an "onchange event" of the reactive variable, but the other way round. We rather attach variables to a function.

It is a difference, if we call a function and make use of its return value or if we don't. This becomes clear, if we no longer want to call a function, when a variable it depends on changes. In the case, where we stored the return value in a variable, we can just delete or overwrite this variable with another value.

	var attentionWhore,
	    echo = function( sound ) {
			return attentionWhore = sound;
	    };
	
	react( "voice = 'Look at me!'" );
	react( "echo = ", echo, "( voice )" );
	alert( attentionWhore );	//"Look at me!"
	react( "echo" );			//"Look at me!"
	
	react( "voice = 'I deserve attention!'" );
	alert( attentionWhore );	//"I deserve attention!"
	react( "echo" );			//"I deserve attention!"
	
	react( "echo = 'No you don't'" );
	react( "voice = 'You are still there?'" );
	alert( attentionWhore );	//"I deserve attention!"
	react( "echo" );			//"No you don't"

But, if we haven't cared about the return value, we have no link to the function call. We have to deregister the function call manually as explained in the next section.

If you do not care about future updates and want to call a function just once with the current value of a reactive variable, force an evaluation to a literal of its otherwise reactive argument by using the `#` operator:

	var dontCare,
	    sadPerson = function( words ) {
			dontCare = words;	
	    };
	
	react( "beingNice = 'Wanna be left alone?'" );
	react( sadPerson, "( #beingNice )" );
	alert( dontCare );			//"Wanna be left alone?"
	react( "beingNice = 'Ok, no problem!'" );
	alert( dontCare );			//"Wanna be left alone?"

##Deregistering call
To prevent a function from continuosly calling itself on a corresponding variable change, apply a call with exactly the same arguments to the function preceeded by `~`:
	
	var niceInvitation = "",
	    soonRetired = function( lastWords ) {
		niceInvitation += lastWords;	
	};
	
	react( "words = 'Visit me!'" );
	react( soonRetired, "( words )" );
	alert( niceInvitation );	//"Visit me!"
	
	react( "words = ' At the beach!'" );
	alert( niceInvitation );	//"Visit me! At the beach!"
	
	//trying to deregister with different arguments
	// throws exception
	try {
		react( "~", soonRetired, "( words, ' But bring presents!' )" );
	} catch( e ) {}
	
	react( "words = ' Come soon!'" );
	alert( niceInvitation );	//"Visit me! At the beach! Come soon!"
	
	//successful deregistration with same arguments
	react( "~", soonRetired, "( words )" );
	react( "words = ' But bring presents!'" );
	alert( niceInvitation );	//"Visit me! At the beach! Come soon!"

If the deregistration is applied to an unknown function call, an exception is thrown. Deregistering just specific arguments of a call is not possible. Only complete calls can be deregistered. Furthermore, only function calls, that are not used in an expression, can be deregistered this way. Calls used in an expression are automatically deregistered, if the expression looses relevance (For example, the variable, the expression is a part of, is deleted.)!

	react( "rainOnCactus =", function() {
		return "The cactus is still there!";
	} );
	react( "cactus = rainOnCactus()" );
	//"The cactus is still there!"
	
	try { 
		//exception: call is used to define variable cactus
		react( "~rainOnCactus()" );
	} catch ( e ) {}
	
	react( "cactus" );
	//"The cactus is still there!"
	
	react( "delete cactus" );
	//also deregisters rainOnCactus()!
	
	react( "~rainOnCactus()" );
	//now, the function call is no longer known -> exception

Multiple identical calls are registered multiple times and one deregistering call will deregister a single one of them.

	var swearing = "",
	    swear = function( syllable ) {
			swearing += syllable;
	    };
	
	react( "dirtyWord = 'DAMN!'" );
	react( swear, "( dirtyWord );", swear, "( dirtyWord )" );
	alert( swearing );		// "DAMN!DAMN!"
	
	react( "dirtyWord = 'SH*T!'" );
	alert( swearing );		// "DAMN!DAMN!SH*T!SH*T!"
	
	react( "~", swear, "( dirtyWord )" );
	react( "dirtyWord = 'F*CK!'" );
	alert( swearing );		// "DAMN!DAMN!SH*T!SH*T!F*CK!"
	
	react( "~", swear, "( dirtyWord )" );
	react( "dirtyWord = 'DAMN!'" );
	alert( swearing );		// "DAMN!DAMN!SH*T!SH*T!F*CK!"

##Registering call
When calling a function with a reactive argument, it is immediatly called. In case we just want to listen to changes of the reactive arguments, we want the function not to be called until these changes actually occur. To accomplish this, we have to use the registering function call `:()`.

	var bookTrip = function( salary ) {
			//choose date and location
			//pay money
			//anticipation
	    };
	
	react( "salary = 2000" );
	
	//would book the trip immediatly without having
	//the money yet!
	//react( bookTrip, "( salary )" );
	
	//registering call: books the trip, when salary
	//increases
	//(strictly speaking: when salary _changes_. But 
	//we are optimistic here!)
	react( bookTrip, ":( salary )" );
	
	//the day has come
	react( "salary = 2500" );
	
	//deregistering call: enough vacation for now
	react( "~", bookTrip, "( salary )" );
	
	//no trip this time
	react( "salary = 3000" );

In this way, we can call a function with more than one variable and it will listen to all of them. On calling itself again, it will always take the literal value of these variables.
	
	var decide = function( girl1, girl2 ) {
			askOut( girl1 > girl2 ? girl1 : girl2 );
	    };
	
	react( "Zoey = 'nice'; Jessi = 'cool'" );
	
	//registering call: the next impression of one of 
	//the girls will make all the difference 
	react( decide, ":( Zoey, Jessi )" );
	
	//decision time!
	react( "Jessi = 'cocky'" );
	
	//deregistering call: no 2nd chance
	react( "~", decide, "( Zoey, Jessi )" );
	
	//too late
	react( "Jessi = 'apologetic'" );

Like the deregistering function call, the registering function call only works for functions, which return value is not used in an expression.

#Object properties
Objects must be created in the scope of normal Javascript. Then, they can be passed to `react()`.

	//modify an object property directly
	var chameleon = {};
	react( chameleon, ".pattern = 'branches'" );
	
	//store object in variable and modify it then
	var jaguar = {};
	react( "jaguar =", jaguar );
	react( "jaguar.colour = 'black'" );

Object properties can be used in expressions like assignments to variables and are acting reactively as long as the property is changed inside of `react()`. The property path itself or its assigned value need not be reactive for this!

	var background = { pattern : 'leaves' };
	react( "chameleonPattern = ", background, ".pattern" );
	//sets chameleonPattern to 'leaves'
	
	background.pattern = 'ground';
	//does not affect chameleonPattern, which still has a value of 'leaves'
	
	react( background, ".pattern = 'stone'" );
	//sets chameleonPattern to 'stone'



##Basic assignment
If a reactive variable is assigned to an object property inside `react()`, changes of the reactive variable also propagate to the object property.

	var jaguar = {};
	react( "closeToPrey = false" );
	react( "action = closeToPrey ? 'attacking' : 'stalking'" );
	
	react( jaguar, ".action = action" );
	//sets jaguar.action to 'stalking'
	
	react( "closeToPrey = true" );
	//sets jaguar.action to 'attacking'

It is important not to access the property of the object outside `react()` as in the following example:

	var jaguar = { pattern : 'entirely black' };
	react( "pattern = 'tawny-yellow with black spots'" );
	react( jaguar.pattern, " = pattern" );
	//throws an exception

The problem is, that jaguar.pattern is evaluated first, before it is passed to `react()`. So, what we actually try here is assigning `pattern` to the literal `'entirely black'`. This makes no sense, of course.

It is also wrong to try to access jaguar inside the string part of the `react()` call.

	var jaguar = { pattern : 'entirely black' };
	react( "pattern = 'tawny-yellow with black spots'" );
	react( "jaguar.pattern = pattern" );
	//throws an exception

`jaguar` is not known to `react()` per se. Therefore, always make sure, to disconnect extern objects from the property to be modified by passing it as a separate argument to `react()`.

We could also store the object in a reactive variable.

	react( "jaguar =", { pattern : 'entirely black' } );
	react( "pattern = 'tawny-yellow with black spots'" );
	react( "jaguar.pattern = pattern" );
	//works fine and sets jaguar.pattern to
	//"tawny-yellow with black spots"

This leads us to what is going to happen, if we use reactive variables to define which object we are refering to in an assignment.

	var jaguar = { pattern : 'entirely black' },
	    leopard = { pattern : 'white-yellow with black spots' };
	
	react( "cat =", jaguar );
	react( "cat.pattern = 'tawny-yellow with black spots'" );
	//sets jaguar.pattern to 'tawny-yellow with black spots'
	
	react( "cat = ", leopard );
	//sets leopard.pattern to 'tawny-yellow with black spots'

Here, again, all is happening according to the principle: **expressions depending on reactive variables react to changes of these variables by re-evaluating themselves**.

The reactive dependency can occur also in the property part of the assignment, of course.

	var flat = {},
	    child = { paintAtHands : true };
	
	react( "child =", child );
	react( "child.inRoom = 'kitchen'" );
	
	react( flat, "[ child.inRoom ] = 'coloured'" );
	//paint the kitchen: flat.kitchen === 'coloured'
	
	react( "child.inRoom = 'living_room'" );
	//paint the living room: flat.living_room === 'coloured'
	
	react( "child.inRoom = 'bath'" );
	//paint the bath: flat.bath === 'coloured'
	
	react( "child.inRoom = 'bedroom'" );
	//paint the bedroom: flat.bedroom === 'coloured'

In the above example, we are kind of leaving a trail, that shows all places we have been with our assignment. We end up with an object, which all four properties 'kitchen', 'living_room', 'bath' and 'bedroom' are set to 'coloured'. This can get messy over time. Especially, if we just want to set a property temporarily, we have to revert the property manually after prop changes. The solution to this is to use the reversible assignment.

##Reversible assignment
To automatically revert a property to the value it had before a reactive assignment or deletion, use the reversible property assignment operator `~=`.

	var boys = {
			'Jack' : 'friend',
			'Brendan' : 'friend',
			'Floyd' : 'friend'
	    };
	
	react( "name = 'Brendan'" );
	react( boys, "[ name ] ~= 'boyfriend'" );
	//sets boys.Brendan to 'boyfriend'
	
	react( "name = 'Jack'" );	
	//sets boys.Jack to 'boyfriend',
	//reverts boys.Brendan to 'friend'
	
	react( "name = 'Floyd'" );
	//sets boys.Floyd to 'boyfriend',
	//reverts boys.Jack to 'friend'

##Deregistering updates
Both, `=` and `~=`, will cause the object property to update, when a corresponding reactive variable changes. We have to tell the object property explicitly, that we do not want it to react to changes any longer.

To deregister an object property from updating itself, use the `~` operator.

	var badListener = {};
	react( "bodypart = 'ear'" );
	react( badListener, "[ bodypart ] ~= 'voice'" );
	//sets badListener.ear to 'voice'
	
	react( "bodypart = 'mouth'" );
	//sets badListener.mouth to 'voice'
	//reverts badListener.ear
	
	react( "~", badListener, "[ bodypart ]" );
	react( "bodypart = 'ear'" );
	//badListener.ear does not care about this one

It is important to use exactly the same path to the object property as in the assignment. It does not matter, if dot or bracket notation is used for property access, if in bracket notation the property name is given in simple string form.

	var badListener = {};
	react( "bodypart = 'ear'" );
	react( badListener, "[ bodypart ] = 'Listen to me!'" );
	
	react( "~", badListener, ".bodypart" );
	//does not deregister the 
	//react( badListener, "[ bodypart ] = 'Listen to me'" ) expression
	
	react( "~", badListener, "[ bodypart ]" );
	//deregisters react( badListener, "[ bodypart ] = 'Listen to me'" )

Or, with the object being reactive:

	var badListener = { ear : false };
	react( "badListener = ", badListener );
	react( "badListener.ear ~= true" );
	
	react( "~", badListener, ".ear" );
	//does not deregister react( "badListener.ear = true" )
	 
	react( "~badListener[ 'ear' ]" );
	//deregisters react( "badListener.ear = true" ),
	//react( "~badListener.ear" ) would do as well

If the object property is used in an expression and we try to deregister it, an exception will be thrown. If the expression looses relevance, the property path will be deregistered automatically. This means, only object properties that have been assigned a value inside of `react()` can (and must!) be deregistered manually.

##Deletion
Deletion works completely along the lines of assignment. Therefore, here just two examples to demonstrate this:

	var autumnTree = {
			leaf2516 : 'orange',
			leaf5874 : 'red',
			leaf9435 : 'yellow'
	    };
	
	react( "leaf = 'leaf2516'" );
	react( "delete", autumnTree, "[ leaf ]" );
	//deletes leaf2516 from autumnTree
	
	react( "leaf = 'leaf5874'" );
	//deletes leaf5874 from autumnTree
	
	react( "~", autumnTree, "[ leaf ]" );
	//deregisters the deletion of leaves
	
	react( "leaf = 'leaf9435'" );
	//does not delete leaf9435 from autumnTree

Reversible delete:

	var lizard = { tail : 'long', feet : 'short' };
	react( "part = 'tail'" );
	react( "~delete", lizard, "[ part ]" );
	//deletes tail of lizard
	
	react( "part = 'feet'" );
	//restors the long tail of the lizard,
	//deletes feet from lizard
	
	react( "~", lizard, "[ part ]" );
	//reverts lizard.feet to 'short'
	//the lizard will no longer loose any bodyparts

#Custom objects
By taking care, that constructors can be called as normal functions without using `new`, react.js can also create new custom objects in a reactive way.

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
	react( "inst1 =", Type, "( x )" );
	//returns instance of Type with value 10
	
	react( "inst2 = inst1 + ", Type( 20 ) );
	//returns instance of Type with value 30
	
	react( "x = 20" );
	react( "inst1" );
	//returns instance of Type with value 20
	react( "inst2" );
	//returns instance of Type with value 40

If we had put our constructor `Type` into a reactive variable, for example, also called `Type` and created an instance with `react( "inst = Type( x )" )`, we could even change the type of the instance by changing the `Type` variable.

Since custom objects are nothing more than a constructor function creating a new object from a prototype object, everything already said about objects, object properties and functions in conjunction with reactive behaviour applies here, too.

#Expressions
Evaluation of expressions works as in native Javascript: From left to right and according to operator precedence. Semicolon insertion does not exist, so using the `;` operator to separate expressions is mandatory.



##Operators
This is a complete list of all operators that are defined within `react()`:

<table id="operators">
	<tr>
		<th>Operator</th>
		<th>Notation</th>
		<th>Operation</th>
		<th>Precedence</th>
	<tr>
	<tr>
		<td><code>;</code></td>
		<td>nullary</td>
		<td>separate two expression</td>
		<td>0</td>
	</tr>
	<tr>
		<td><code>clean</code></td>
		<td>nullary</td>
		<td>delete all unused variables</td>
		<td>0</td>
	</tr>
	<tr>
		<td><code>cleanExcept</code></td>
		<td>prefix</td>
		<td>delete all unused variables with exceptions</td>
		<td>10</td>
	</tr>
	<tr>
		<td><code>=</code></td>
		<td>infix</td>
		<td>permanent assignment to reactive variables or object properties</td>
		<td>10</td>
	</tr>
	<tr>
		<td><code>~=</code></td>
		<td>infix</td>
		<td>reversible assignment to object properties</td>
		<td>10</td>
	</tr>
	<tr>
		<td><code>?:</code></td>
		<td>ternary</td>
		<td>conditional operator</td>
		<td>20</td>
	</tr>
	<tr>
		<td><code>&&</code></td>
		<td>infix</td>
		<td>logical AND</td>
		<td>30</td>
	</tr>
	<tr>
		<td><code>||</code></td>
		<td>infix</td>
		<td>logical OR</td>
		<td>30</td>
	</tr>
	<tr>
		<td><code>==</code></td>
		<td>infix</td>
		<td>equal with type conversion</td>
		<td>40</td>
	</tr>
	<tr>
		<td><code>===</code></td>
		<td>infix</td>
		<td>strict equal</td>
		<td>40</td>
	</tr>
	<tr>
		<td><code>!=</code></td>
		<td>infix</td>
		<td>not equal with type conversion</td>
		<td>40</td>
	</tr>
	<tr>
		<td><code>!==</code></td>
		<td>infix</td>
		<td>not strict equal</td>
		<td>40</td>
	</tr>
	<tr>
		<td><code>></code></td>
		<td>infix</td>
		<td>greater than</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code><</code></td>
		<td>infix</td>
		<td>less than</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code>>=</code></td>
		<td>infix</td>
		<td>greater than or equal</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code><=</code></td>
		<td>infix</td>
		<td>less than or equal</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code>in</code></td>
		<td>infix</td>
		<td>check, if a property exists in an object</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code>instanceof</code></td>
		<td>infix</td>
		<td>check, if an object inherits from constructor.prototype</td>
		<td>50</td>
	</tr>
	<tr>
		<td><code>+</code></td>
		<td>infix</td>
		<td>addition</td>
		<td>60</td>
	</tr>
	<tr>
		<td><code>-</code></td>
		<td>infix</td>
		<td>subtraction</td>
		<td>60</td>
	</tr>
	<tr>
		<td><code>*</code></td>
		<td>infix</td>
		<td>multiplication</td>
		<td>70</td>
	</tr>
	<tr>
		<td><code>/</code></td>
		<td>infix</td>
		<td>division</td>
		<td>70</td>
	</tr>
	<tr>
		<td><code>%</code></td>
		<td>infix</td>
		<td>modulus</td>
		<td>70</td>
	</tr>
	<tr>
		<td><code>^</code></td>
		<td>infix</td>
		<td>exponentiation</td>
		<td>80</td>
	</tr>
	<tr>
		<td><code>!</code></td>
		<td>prefix</td>
		<td>logical NOT</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>+</code></td>
		<td>prefix</td>
		<td>conversion to number</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>-</code></td>
		<td>prefix</td>
		<td>negation</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>typeof</code></td>
		<td>prefix</td>
		<td>get type of operand</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>delete</code></td>
		<td>prefix</td>
		<td>permanent deletion of reactive variable or object property</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>~delete</code></td>
		<td>prefix</td>
		<td>reversible deletion of object property</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>~</code></td>
		<td>prefix</td>
		<td>deregister operator: remove reactive updates from object properties and function calls</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>#</code></td>
		<td>prefix</td>
		<td>get the literal value of a variable or an expression</td>
		<td>90</td>
	</tr>
	<tr>
		<td><code>{}</code></td>
		<td>infix</td>
		<td>setting a context</td>
		<td>100</td>
	</tr>
	<tr>
		<td><code>()</code></td>
		<td>infix</td>
		<td>function call</td>
		<td>100</td>
	</tr>
	<tr>
		<td><code>:()</code></td>
		<td>infix</td>
		<td>registering function call</td>
		<td>100</td>
	</tr>
	<tr>
		<td><code>.</code></td>
		<td>infix</td>
		<td>object property access</td>
		<td>110</td>
	</tr>
	<tr>
		<td><code>[]</code></td>
		<td>infix</td>
		<td>object property access</td>
		<td>110</td>
	</tr>
	<tr>
		<td><code>()</code></td>
		<td>prefix</td>
		<td>parenthesis</td>
		<td>120</td>
	</tr>
</table>

Redefined operators in comparision to Javascript:

- revert object property manipulation: `~` (bitwise NOT in Javascript)
- exponentiation: `^` (bitwise XOR in Javascript)

New operators:

- collective delete: `clean`, `cleanExcept`
- revertible object property manipulation: `~=`, `~delete`
- evaluation: `#`
- registering function call: `:()`
- context setting: `{}`

Not defined in `react()`, but in native Javascript, are:

- special operators: `var`, `new`, `void`, `,`
- increment/decrement operators: `++`, `--`
- bitwise operators: `<<`, `>>`, `>>>`, `&`, `|`

##New operators


###clean
Deletes all variables, that are not in use. Variables in use are those, which are directly used in a function call or object property assignment or are a part of another variable.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code>clean</code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td><code>true</code> on successfully deleting all unused variables, else <code>false</code></td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Removal" title="Reactive variables - Removal- clean">Reactive variables - Removal - clean</a></td>
    </tr>
</table>

###cleanExcept
Deletes all variables, that are not in use, except the listed ones. Variables in use are those, which are directly used in a function call or object property assignment or are a part of another variable.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code>cleanExcept <em>variable_name1[</em>, <em>variable_name2[</em>, ... <em>]]</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td><code>true</code> on successfully deleting all but given unused variables, else <code>false</code></td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Removal" title="Reactive variables - Removal - clean">Reactive variables - Removal - clean</a></td>
    </tr>
</table>

###~=
Does the same as a normal assignment to an object property, but offers the possibility to revert the object property to the value it had before the assignment.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code><em>objectPropertyExpression</em> ~= <em>expression</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td>value of <em>expression</em></td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Reversible assignment" title="Reactive variables and object properties - Reversible assignment">Reactive variables and object properties - Reversible assignment</a></td>
    </tr>
</table>

###~delete
Does the same as a normal deletion of an object property, but offers the possibility to revert the object property to the value it had before the deletion.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code>~delete <em>objectPropertyExpression</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td><code>false</code>, if property exists, but cannot be delete, else <code>true</code></td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Deletion" title="Reactive variables and object properties - Deletion">Reactive variables and object properties - Deletion</a></td>
    </tr>
</table>

####
Get the literal value of an expression.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code>#<em>expression</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td>result</td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Evaluation to a literal" title="Evaluation to a literal">Reactive variables - Evaluation to a literal<a></td>
    </tr>
</table>

###{}
Set a context for an expression.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code><em>expression</em>{ context1<em>[,</em> context2<em>[,</em> ... <em>]]</em> }</code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td>expression in given context</td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Context variables" title="Context variables">Reactive variables - Context variables<a></td>
    </tr>
</table>

###:()
Tells react.js to call the function expression with the given arguments, if the function expression or the arguments change in the future. In contrast to a normal function call `()`, the function is not called directly.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code><em>functionExpression</em>:( <em>[argument1[</em>, <em>argument2[</em>, ... <em>]]]</em> )</code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td>true, if the function call was successfully registered, else false</td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Registering function call" title="Reactive variables and functions - Registering function call">Reactive variables and functions - Registering function call</a></td>
    </tr>
</table>

##Redefined operators


###delete
Concerning deletion of variables: Works as in Javascript, but returns an exception, if the variable cannot be deleted instead of `false`. Since `react()` does not have local variables declared with a `var` statement, `delete` is used to delete reactive variables in general.

More: <a href="#Removal" title="Reactive variables - Removal">Reactive variables - Removal - delete</a>

###~
Liberates object properties and function calls from reacting to future changes of the reactive variables they depend on. It also reverts the value of object properties, that were set by `~=` or `~delete`.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code>~[<em>objectPropertyExpression</em>|<em>functionCallExpression</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td><code>true</code>, if object property/function call was registered and has been successfully deregistered, else throws an exception</td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td>see <a href="#Deregistering property updates" title="Reactive variables and object properties - Deregistering property updates">Reactive variables and object properties - Deregistering property updates</a></br>
see <a href="#Deregistering function call" title="Reactive variables and function calls - Deregistering function call">Reactive variables and function calls - Deregistering function call</a></td>
    </tr>
</table>

###^
Exponentation. Does the same as `Math.pow()` in native Javascript.

<table class="opdef_table">
    <tr>
        <td>Syntax:</td>
        <td><code><em>expression</em> ^ <em>expression</em></code></td>
    </tr>
    <tr>
        <td>Returns:</td>
        <td>result</td>
    </tr>
    <tr>
        <td>Example(s):</td>
        <td><code>react( "base=10; exp=-2; pow=base^exp" );	//sets pow to 0.1</code></td>
    </tr>
</table>

##Operator assignments
Every single operator, even the assignment operator itself (although it does not make much sense), can be used in conjunction with an assignment. This is true for infix operators as well as prefix operators:

<div class="specialCode">
<table>
    <tr>
        <td><code>react( "r += 5" );</code></td>
        <td>≡</td>
        <td><code>react( "r = r+5" );</code></td>
    </tr>
    <tr>
        <td><code>react( "obj.prop += 'tail'" );</code></td>
        <td>≡</td>
        <td><code>react( "obj.prop = obj.prop + 'tail'" );</code></td>
    </tr>
    <tr>
        <td><code>react( "-= r" );</code></td>
        <td>≡</td>
        <td><code>react( "r = -r" );</code></td>
    </tr>
    <tr>
        <td><code>react( "obj.=prop" );</code></td>
        <td>≡</td>
        <td><code>react( "obj = obj.prop" );</code></td>
    </tr>
    <tr>
        <td><code>react( "obj[= prop ]" );</code></td>
        <td>≡</td>
        <td><code>react( "obj = obj[ prop ]" );</code></td>
    </tr>
    <tr>
        <td><code>react( "func(= r )" );</code></td>
        <td>≡</td>
        <td><code>react( "func = func( r )" );</code></td>
    </tr>
    <tr>
        <td><code>react( "bool ?= 'true' : 'false'" );</code></td>
        <td>≡</td>
        <td><code>react( "bool = bool ? 'true' : 'false'" );</code></td>
    </tr>
    <tr>
        <td><code>react( "(= r*s+13 )*10" );</code></td>
        <td>≡</td>
        <td><code>react( "( r = r*s+13 )*10" );</code></td>
    </tr>
    <tr>
        <td><code>react( "delete= r" );</code></td>
        <td>≡</td>
        <td><code>react( "r = delete r" );</code></td>
    </tr>
</table>
</div>

There are some unusual cases above, for example object property access with assignment. The general evaluation rule is:
	
- infix-assignment: Assign the result of the operation without the `=` to the variable left to the operator assignment.
- prefix-assignment: Assign the result of the operation without the `=` to the variable right to the operator assignment.

Some operator assignments may lead to ambiguities. `react( "r === s" )` (strict equal operator) could mean `react( "r = r == s" )` by applying the above rule, `react( "r >= 10" )` could be meant as `react( "r = r > 10" )`. To separate those ambiguities, the base operation can be disconnected from the following `=` with a `.` to signal operator assignment.

<div class="specialCode">
<table>
    <tr>
        <td><code>react( "r ==.= s" );</code></td>
        <td>≡</td>
        <td><code>react( "r = r == s" );</code></td>
    </tr>
    <tr>
        <td><code>react( "r >.= 10" );</code></td>
        <td>≡</td>
        <td><code>react( "r = r > 10" );</code></td>
    </tr>
    <tr>
        <td><code>react( "r =.= 5" );</code></td>
        <td>≡</td>
        <td><code>react( "r = r = 5" );</code></td>
    </tr>
</table>
</div>

##Operator overloading
All operators defined in `react()` except `=`, `~=`, `delete`, `~delete`, `~`, `cleanExcept`, `#` and `?:` can be overloaded and used in the context of a native Javascript object. Custom operators are not supported.

To overload an operator, give the object a method with a name of the form *prefix(op)* for a prefix version of an operator or *infix(op)* for an infix version of an operator, where *(op)* is replaced by the operator's symbol. The object itself can be referenced by `this` inside the operator methods. Infix operator methods will be passed the right operand of the operation as first argument.

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
    
	obj3 = react( obj1, "+", obj2 );	//{ value : 30 }
	obj4 = react( "-", obj1 );			//{ value : -10 }

For commutative infix operators, it is possible to swap `obj1` and `obj2` to get the same result:

	obj5 = react( obj2, "+", obj1 );	//also { value : 30 }

As a start, `react()` treats all infix operators as commutative. If the left operand does not have the appropriate operator overloaded, but the right one does, the right's operator method is used. So, in the calculation of `obj5`, instead of `obj2 + obj1`, in effect, `obj1 + obj2` is calculated.

But, some operators are not commutative. If `react()` swaps the operands to make the operation possible, it will pass `true` as second argument to the operator evaluation method. In case, we want to prohibit commutative usage of our operator, we can check this second argument.

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
	
	obj3 = react( obj1, "^", obj2 );	//{ value : 100 }
	obj4 = react( obj2, "^", obj1 );     
	//throws an exception: "Exponentation is not commutative!"

Of course, if we would give `obj2` an *infix^* method, too, `obj4` would evaluate fine.

Operator overloading is completly detached from the reactive part of react.js, but can also be used with reactive variables and all their preferences.

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
	react( "res = left + right" );		//{ value : 30 }
	react( "right =", obj3 );
	react( "res" );						//{ value : 60 }

There are some operators in `react()`, that are not defined by themselves, but are a combination of other operators. All assignment operators like `+=` are such operators. That means, that by defining the inifx+ operator, one gets the `+=` operator for free. But there are further operators composed of others. A complete list of such operators is:

<table id="composedOperators">
	<tr>
		<th>Operator</th>
		<th>Definition</th>
	</tr>
	<tr>
		<td><code>left != right</code></td>
		<td><code>!(left == right)</code></td>
	</tr>
	<tr>
		<td><code>left !== right</code></td>
		<td><code>!(left === right)</code></td>
	</tr>
	<tr>
		<td><code>left <= right</code></td>
		<td><code>(left == right || left < right)</code></td>
	</tr>
	<tr>
		<td><code>left >= right</code></td>
		<td><code>(left == right || left > right)</code></td>
	</tr>
	<tr>
		<td><code>left - right</code></td>
		<td><code>left + (-1)*right</code></td>
	</tr>
	<tr>
		<td><code>left / right</code></td>
		<td><code>left * right^(-1)</code></td>
	</tr>
	<tr>
		<td><code>-operand</code></td>
		<td><code>(-1)*operand</code></td>
	</tr>
</table>

So, if all operators used in the *Definition* column are defined, the composed operator is, too. Of course, the composed operator can still be overloaded with its own definition like all other operators.

#Predefined values
These constants and functions are implemented into an react.js and can directly be used inside `react()`.


##Constants
<table
	<tr>
		<th>Constant</th>
		<th>Value</th>
	</tr>
	<tr>
		<td><code>pi</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Pi" title="Pi">3.141592653589793<a></td>
	</tr>
	<tr>
		<td><code>e</code></td>
		<td><a href="http://en.wikipedia.org/wiki/E_%28mathematical_constant%29" title="Euler's Number">2.718281828459045</td>
	</tr>
	<tr>
		<td><code>ln2</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Natural_logarithm" title="Natural logarithm">0.6931471805599453</a></td>
	</tr>
	<tr>
		<td><code>ln10</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Natural_logarithm" title="Natural logarithm">2.302585092994046</a></td>
	</tr>
	<tr>
		<td><code>log2e</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Logarithm" title="Logarithm">1.4426950408889634</a></td>
	</tr>
	<tr>
		<td><code>log10e</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Logarithm" title="Logarithm">0.4342944819032518</a></td>
	</tr>
	<tr>
		<td><code>sqrt2</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Square_root" title="Square root">1.4142135623730951</a></td>
	</tr>
	<tr>
		<td><code>sqrt1_2</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Square_root" title="Square root">0.7071067811865476</a></td>
	</tr>
</table>

##Functions
<table
	<tr>
		<th>Function</th>
		<th>Definition</th>
	<tr>
	<tr>
		<td><code>sin(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent" title="Sine">trigonometric sine</a></td>
	</tr>
	<tr>
		<td><code>cos(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent" title="Cosine">trigonometric cosine</a></td>
	</tr>
	<tr>
		<td><code>tan(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent" title="Tangent">trigonometric tangent</a></td>
	</tr>
	<tr>
		<td><code>asin(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Inverse_trigonometric_functions" title="Arcsine">trigonometric arc sine</a></td>
	</tr>
	<tr>
		<td><code>acos(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Inverse_trigonometric_functions" title="Arccosine">trigonometric arc cosine</a></td>
	</tr>
	<tr>
		<td><code>atan(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Inverse_trigonometric_functions" title="Arctangent">trigonometric arc tangent</a></td>
	</tr>
	<tr>
		<td><code>exp(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Exponential_function" title="Exponential function">exponential function</a></td>
	</tr>
	<tr>
		<td><code>log(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Natural_logarithm" title="Natural logarithm">natural logarithm</a></td>
	</tr>
	<tr>
		<td><code>abs(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Absolute_value" title="Absolute value">absolute value function</a></td>
	</tr>
	<tr>
		<td><code>sgn(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Signum_function" title="Signum function">signum function</a></td>
	</tr>
	<tr>
		<td><code>floor(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Rounding_function#Rounding_to_integer" title="Floor function">round down function</a></td>
	</tr>
	<tr>
		<td><code>ceil(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Rounding_function#Rounding_to_integer" title="Ceiling function">round up function</a></td>
	</tr>
	<tr>
		<td><code>round(x)</code></td>
		<td><a href="http://en.wikipedia.org/wiki/Rounding_function#Rounding_to_integer" title="Rounding function">round to nearest integer function</a></td>
	</tr>
</table>