

/*
 * Function to run all the tests (or specific set of tests if testNames is specified) based on the interaction model passed in
 * metadata: {}
 * interactionModel: {}
 * locale: ""
 * testNames: []
 * callback: function({ errors : [], warnings : [], tests : [] })
 * progressCallback: function(current, name, total)
 */
function validateInteractionModel(metadata, interactionModel, locale, testNames, callback, progressCallback){


    let tests = [];

    loadTests(tests);
    
    console.log(locale);
    console.log(metadata);
    console.log(interactionModel);

    let runningTests = [];
    if(!testNames){
        runningTests = runningTests.concat(tests);    
    }else{
        for(let i = 0; i < tests.length; i++){
            for(let j = 0; j < testNames.length; j++){
                let test = tests[i];
                let name = testNames[j];
                if(test.name === name){
                    runningTests.push(test);
                }
            }
        }
    }
    
    if(runningTests.length === 0){
        alert("Error, no tests selected.");
        console.log("Error, no tests selected.");
    }
    
    let result = {
        "errors" : [],
        "warnings" : [],
        "tests" : []
    };
    let count = 1;
    let total = (runningTests) ? runningTests.length : 0;
    
    
    let start = new Date().getTime();

    let checkQueue = function(){
        if(!runningTests || runningTests.length === 0){
            callback(result);
            console.log("returning results");
            return;
        }

        let test = runningTests.shift();
        if(!test){
            checkQueue();
            return;
        }

        start = new Date().getTime();
        console.log("Running test (" + count + "/" + total + "): " + test.name);
        progressCallback(count, total, test.name);
        count++
        try{
            setTimeout(function(){
                test.run(test, metadata, interactionModel, locale, parseResult);
            }, 1);
        }catch(e){
            result.errors.push({
                "name" : test.name + ": " + e,
                "items" : []
            });
            console.error(e.stack);
            checkQueue();
        }
        
    }
    
    let parseResult = function(test, errors, warnings){
        console.log("    took: " + (new Date().getTime() - start) +"ms");

        if(test){
            let passFail = "Pass";
            if(errors && errors.length > 0){
                passFail = "Fail";
            }else if(warnings && warnings.length > 0){
                passFail = "Warn";
            }
                  
            result.tests.push(test.name + " - " + passFail);
            
            if(errors && errors.length > 0){
                result.errors.push({
                    "name" : test.name,
                    "description" :  test.description,
                    "items" : errors
                });
            }
            
            if(errors && warnings.length > 0){
                result.warnings.push({
                    "name" : test.name,
                    "description" : test.description,
                    "items" : warnings
                });
            }
        }

        checkQueue();
    };
    
    checkQueue();
}

function loadTests(tests){

    /*
     * Test to check whether the the interaction_model item exists.
     */
    tests.push({
        "name" : "Interaction Model Present",
        "description" : "Test to check whether the the interaction model exists in the data passed to the validator.",
        "run" : function(test, metadata, interactionModel, locale, callback){
        
            let errors = [];
            let warnings = [];
            if(!interactionModel){
                errors.push("Interaction Model is Not Present");
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether the intent schema exists and whether there are more than 0.
     * Warns: < 5 Intents
     */
    tests.push({
        "name" : "Intent Schema Present",
        "description" : "Test to check whether the intent schema exists and whether there are more than 0. Warns: < 5 Intents",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!interactionModel.intents){
                errors.push("Intents is Null");
            }else if(interactionModel.intents.constructor !== Array || interactionModel.intents.length === 0){
                errors.push("No Intents Defined in Intent Schema");
            }else if(interactionModel.intents.length < 5){
                warnings.push("Less than 5 Intents defined in Intent Schema");
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether the sample utterances exist and whether there are more than 0.
     * Warns: < 5 Sample Utterances
     */
    tests.push({
        "name" : "Sample Utterances Present",
        "description" : "Test to check whether the sample utterances exist and whether there are more than 0. Warns: < 5 Sample Utterances",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!interactionModel.utterances){
                errors.push("sampleUtterances is Null");
            }else if(interactionModel.utterances.constructor !== Array || interactionModel.utterances.length === 0){
                errors.push("No Sample Utterances Defined in Sample Utterances");
            }else if(interactionModel.utterances.length < 5){
                warnings.push("Less than 5 Utterances defined in Sample Utterances");
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether the slots exist.
     */
    tests.push({
        "name" : "Slots Present",
        "description" : "Test to check whether the slots data exist.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!interactionModel.slots || interactionModel.slots.constructor !== Array){
                errors.push("Slots is Null");
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Intents contains AMAZON.CancelIntent, AMAZON.HelpIntent, AMAZON.StopIntent
     */
    tests.push({
        "name" : "Built In Intents Present",
        "description" : "Test to check whether Intents contains AMAZON.CancelIntent, AMAZON.HelpIntent, AMAZON.StopIntent" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#providing-help'>DOCUMENTATION</a>" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#stopping-and-canceling'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            let intents = getHashOfIntents(interactionModel);
            
            if(!intents["AMAZON.CancelIntent"]){
                errors.push("AMAZON.CancelIntent is not present");
            }
            if(!intents["AMAZON.HelpIntent"]){
                errors.push("AMAZON.HelpIntent is not present");
            }
            if(!intents["AMAZON.StopIntent"]){
                errors.push("AMAZON.StopIntent is not present");
            }
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether the sample utterances all refer to an existing intent.
     */
    tests.push({
        "name" : "Utterances Reference Intents",
        "description" : "Test to check whether the sample utterances all refer to an existing Intent.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            
            let intents = getHashOfIntents(interactionModel);
            let utterances = getHashOfUtterances(interactionModel);
            
            for(let prop in utterances){
                if(!utterances.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                if(!intents[prop]){
                    errors.push("Intent '" + prop + "' not found");
                }
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether all Intents have sample utterances. 
     * Warn: < 5 Sample Utterances per Intent
     */
    tests.push({
        "name" : "Intents Have Utterances",
        "description" : "Test to check whether all Intents have sample utterances. Warn: < 5 Sample Utterances per Intent",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let intents = getHashOfIntents(interactionModel);
            let utterances = getHashOfUtterances(interactionModel);
            
            for(let prop in intents){
                if(!intents.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                if(!utterances[prop]){
                    if(prop.indexOf("AMAZON.") !== 0){
                        //not a built-in intent
                        errors.push("Intent '" + prop + "' has no Sample Utterances");
                    }
                }else if(utterances[prop].length < 5){
                    if(prop.indexOf("AMAZON.") !== 0){
                        //not a built-in intent
                        warnings.push("Intent '" + prop + "' has < 5 Sample Utterances");
                    }
                }
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether all required Slots (as referenced in Intents) are defined
     */
    tests.push({
        "name" : "All Intent Slots Are Defined",
        "description" : "Test to check whether all required Slots (as referenced in Intents) are defined",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let slots = getHashOfSlots(interactionModel);
            let intents = getHashOfIntents(interactionModel);
            
            for(let prop in intents){
                if(!intents.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let intent = intents[prop];
                let intentSlots = intent.slots;
                if(intentSlots){
                    for(let i = 0; i < intentSlots.length; i++){
                        let slot = intentSlots[i];
                        if(slot.type.indexOf("AMAZON.") === 0){
                            //built in slot, ignore
                            continue;
                        }
                        if(!slots[slot.type]){
                            errors.push("Intent '" + prop + "' has undefined Slot Type '" + slot.type +"'");
                        }
                    }
                }
            }        
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether all required Slots (as referenced in Utterances) are defined in Intents
     */
    tests.push({
        "name" : "All Utterance Slots Defined In Intent",
        "description" : "Test to check whether all required Slots (as referenced in Utterances) are defined in Intents",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let regexp = /([^{]*?)\w(?=\})/gmi;
            
            let intents = getHashOfIntents(interactionModel);
            let utterances = getHashOfUtterances(interactionModel);
            for(let prop in utterances){
                if(!utterances.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let intentUtterances = utterances[prop];
                let intent = intents[prop];
                
                //if we have no utterances for this intent
                if(!intentUtterances){
                    continue;
                }
                
                for(let x = 0; x < intentUtterances.length; x++){
                    let utterance = intentUtterances[x];
                    //if it's using the old slot format, continue, it's caught in another test
                    if(utterance.indexOf("|")){
                        continue;
                    }
                    let matches = utterance.match(regexp);
                                    
                    //no matches found in this intent for the regex
                    if(!matches){
                        continue;
                    }
                    for(let i = 0; i < matches.length; i++){
                        let match = matches[i];
                        if(intent && intent.slots){
                            let found = false;
                            for(let j = 0; j < intent.slots.length; j++){
                                let slot = intent.slots[j];
                                if(slot.name === match){
                                    found = true;
                                    break;
                                }
                            }
                            if(!found){
                                errors.push("Intent '" + prop + "' missing Slot '" + match + " in Utterance '" + utterance +"'");
                            }
                        }
                    }
                }
            }
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether all Slots have at least one value.
     * Warn: <2 values
     */
    tests.push({
        "name" : "All Slots Have Values",
        "description" : "Test to check whether all Slots have at least one value." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#custom-slot-type-values'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let slots = getHashOfSlots(interactionModel);
            for(let prop in slots){
                if(!slots.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let slot = slots[prop];
                if(!slot.values || slot.values.constructor !== Array || slot.values.length < 1){
                    errors.push("Slot '" + slot.type + "' has no Values");
                }else if(slot.values.length < 2){
                    warnings.push("Slot '" + slot.type + "' has < 2 Values");
                }
            }
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether an individual Slot's Values have a variety of word lengths.
     * Warn: Delta < 2 words
     */
    tests.push({
        "name" : "Slot Values Have Length Variety",
        "description" : "Test to check whether an individual Slot's Values have a variety of word lengths. Warn: Delta < 2 words" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#custom-slot-type-values'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let slots = getHashOfSlots(interactionModel);
            for(let prop in slots){
                if(!slots.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let slot = slots[prop];
                let min = 0;
                let max = 0;
                if(slot.values && slot.values.constructor === Array){
                
                    for(let i = 0; i < slot.values.length; i++){
                        let length = slot.values[i].split(" ").length;
                        min = Math.min(min, length);
                        max = Math.max(max, length);
                    }
                }
                if(max - min < 2){
                    warnings.push("Slot '" + prop + "' has word length delta < 2 words");
                }
            }
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether an individual Intent's Utterances have a variety of word lengths.
     * Warn: Delta < 5 words
     */
    tests.push({
        "name" : "Intent Utterances Have Length Variety",
        "description" : "Test to check whether an individual Intent's Utterances have a variety of word lengths. Warn: Delta < 5 words" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#variety-of-sample-utterances'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let utterances = getHashOfUtterances(interactionModel);
            for(let prop in utterances){
                if(!utterances.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let intentUtterances = utterances[prop];
                let min = 0;
                let max = 0;
                if(intentUtterances && intentUtterances.constructor === Array){
                    for(let i = 0; i < intentUtterances.length; i++){
                        let length = intentUtterances[i].split(" ").length;
                        min = Math.min(min, length);
                        max = Math.max(max, length);
                    }
                }
                if(max - min < 2){
                    warnings.push("Intent '" + prop + "' has Utterance word length delta < 5 words");
                }
            }
            
            callback(test, errors, warnings);
        }
    });


    /*
     * Test to check whether a custom slot has only supported characters.
     */
    tests.push({
        "name" : "Unsupported Characters In Slot",
        "description" : "Test to check whether a custom slot has only supported characters." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#custom-slot-type-values'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let regexp = /[^a-zA-Z\d\s\.\'ßäëïöü]/gi;
                    
            let slots = getHashOfSlots(interactionModel);
            for(let prop in slots){
                if(!slots.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let slot = slots[prop];
                if(slot.values && slot.values.constructor === Array){
                    for(let i = 0; i < slot.values.length; i++){
                        let value = slot.values[i];
                        let matches = value.match(regexp);
                        if(matches && matches.length > 0){
                            warnings.push("Slot '" + slot.name + "' Value should be alphanumeric except for contractions, possessive nouns, and acronyms: '" + value + "'");
                        }
                    }
                }
                
            }        
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether a particular Intent Slot is used more than once in an Utterance.
     */
    tests.push({
        "name" : "No Duplicate Slots In Utterances",
        "description" : "Test to check whether a particular Intent Slot is used more than once in an Utterance." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#variety-of-sample-utterances'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let regexp = /([^{]*?)\w(?=\})/gmi;
            
            for(let i = 0; i < interactionModel.utterances.length; i++){
                let utterance = interactionModel.utterances[i];
                let matches = utterance.match(regexp);
                let cache = {};
                if(matches){
                    for(let j = 0; j < matches.length; j++){
                        let key = matches[j];
                        if(cache[key]){
                            errors.push("Duplicate Slot in Utterance: " + utterance);
                            break;
                        }
                        cache[key] = true;
                    }
                }
            }        
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether a an utterance starts with one of the connector words.
     */
    tests.push({
        "name" : "Utterance Starts With Connector Word - Reduces Accuracy",
        "description" : "Test to check whether a an utterance starts with one of the connector words.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let utterances = getHashOfUtterances(interactionModel);
            let intents = getHashOfIntents(interactionModel);
     
            //go through each one of the intents, check if they match in utterances based on the calculations above
            for(let intentProp in intents){
                if(!intents.hasOwnProperty(intentProp)){ continue; } //property is from prototype, skip
                let intent = intents[intentProp];
                let intentUtterances = utterances[intentProp];
                if(intentUtterances){
                    for(let i = 0; i < intentUtterances.length; i++){
                        if(getConnectorWordRegex(locale).test(intentUtterances[i])){
                            warnings.push("Utterance '" + intentUtterances[i] + "' starts with a connector word");
                        }
                    }
                }
                
            }

            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether all Sample Utterances are unique.
     * By nature this test is very slow, since it intelligently tries all the permutations.
     */
    
     tests.push({
         "name" : "Sample Utterances Are Unique",
         "description" : "Test to check whether all Sample Utterances are unique. By nature this test is very slow, since it intelligently tries all the permutations.",
         "run" : function(test, metadata, interactionModel, locale, callback){
            
             let errors = [];
             let warnings = [];
     
             let utterances = getHashOfUtterances(interactionModel);
             let intents = getHashOfIntents(interactionModel);
             
             //pre-calculate our Slot overlap beforehand, avoid extra calculations
             let associationMap = getAssociationMap(interactionModel);
     
             let conflictMap = {};
             
             let replaceexp = /[^a-zA-Zßäëïöü\d\.\'\}\{\_]/;
             
             let errorHash = {};
             let warningHash = {};
     
             //go through each one of the intents, check if they match in utterances based on the calculations above
             for(let intentProp in intents){
                 if(!intents.hasOwnProperty(intentProp)){ continue; } //property is from prototype, skip
                 let intent = intents[intentProp];
                 let intentSlots = intent.slots;
                 let intentUtterances = utterances[intentProp];
                 if(intentUtterances){
                     for(let i = 0; i < intentUtterances.length; i++){
                         let utterance = intentUtterances[i];
                         
                         let replacedUtterance = utterance;
                         //if we have intent slots, replace all the SlotNames with SlotTypes
                         if(intentSlots){
                             for(let j = 0; j < intentSlots.length; j++){
                                 let slot = intentSlots[j];
                                 replacedUtterance = replacedUtterance.replaceAll("{" + slot.name + "}","{" + slot.type + "}");
                             }
                         }
                         
                         let utterancesToCheck = [];
                         //Recursively add all the checks we need to do
                         addUtteranceChecks(intentProp, "", replacedUtterance, utterancesToCheck, associationMap);
                         
                         for(let j = 0; j < utterancesToCheck.length; j++){
                             let utteranceToCheck = utterancesToCheck[j].utterance;
                             utteranceToCheck = utteranceToCheck.replaceAll(replaceexp, "");
                             utteranceToCheck = utteranceToCheck.toLowerCase();
                             
                             if(conflictMap[utteranceToCheck]){
                                 let conflict = conflictMap[utteranceToCheck];
                                 let error = "Intent '" + intentProp +"' Utterance '" + utterance + "' has collision with Intent '" + conflict.intent +"' Utterance '" + conflict.utterance + "'";
                                    if(intentProp !== conflict.intent){
                                        if(!errorHash[error]){
                                           errorHash[error] = 0;
                                        }
                                        errorHash[error] = errorHash[error] + 1;
                                    }else{
                                         if(!warningHash[error]){
                                           warningHash[error] = 0;
                                        }
                                        warningHash[error] = warningHash[error] + 1;
                                    }
                                 continue;
                                
                             }else{
                                 //add the value before we start swapping out slots
                                 conflictMap[utteranceToCheck] = {
                                     "intent" : intentProp,
                                     "utterance" : utterance
                                 };
                             }
                         }
                       
                     }
                 }
                 
             }
             
             for(let error in errorHash){
                 if(!errorHash.hasOwnProperty(error)){ continue; } //property is from prototype, skip
                 errors.push(error + " (" + errorHash[error]+")");
             }
             
             for(let warning in warningHash){
                 if(!warningHash.hasOwnProperty(warning)){ continue; } //property is from prototype, skip
                 warnings.push(warning + " (" + warningHash[warning]+")");
             }                   
             
             callback(test, errors, warnings);
         }
     });

    function getAssociationMap(interactionModel){
        let associationMap = {};
        for(let i = 0; i < interactionModel.slots.length - 1; i++){
            let slot1Values = interactionModel.slots[i].values;
            slot1Values.sort();
            for(let j = i + 1; j < interactionModel.slots.length; j++){
                let matched = false;
                
                let slot2Values = interactionModel.slots[j].values;
                slot2Values.sort();
                let pointer1 = 0, pointer2 = 0;
                while(pointer1 < slot1Values.length && pointer2 < slot2Values.length){
                    let compareValue = slot1Values[pointer1].toLowerCase()
                           .localeCompare(slot2Values[pointer2].toLowerCase());
                    
                    if(compareValue === 0){
                        matched = true;
                        break;
                    }else if(compareValue === -1){
                        pointer1++;
                    }else if(compareValue === 1){
                        pointer2++;
                    }
                }
                
                if(matched){
                    let key1 = interactionModel.slots[i].type;
                    let key2 = interactionModel.slots[j].type;
                    if(!associationMap[key1]){
                        associationMap[key1] = [];
                    }
                    if(!associationMap[key2]){
                        associationMap[key2] = [];
                    }
                    //we had an overlapping value so we need to make sure we equate the two
                    associationMap[key1].push(key2);
                    associationMap[key2].push(key1);
                }
            }
        }
            
        return associationMap;
    }

    //our recursive method that creates all required permutations of matched items created above
    function addUtteranceChecks(intent, utteranceStart, utteranceEnd, utterancesToCheck, associationMap, matches){
       
        if(!matches){
            let regexp = /([^{]*?)\w(?=\})/gmi;
            matches = utteranceEnd.match(regexp);
        }
        //base case, if we have nothing else to replace, put it into our array
        if(!matches || matches.length === 0){
            utterancesToCheck.push({
                "intent" : intent,
                "utterance" : utteranceStart + utteranceEnd
            });
            //console.log(utteranceStart + utteranceEnd);
            return;
        }
        
        let match = matches[0];
        let replacements = associationMap[match];
        let childMatches = matches.slice(1, matches.length);
        
        if(replacements){
            let location = utteranceEnd.indexOf("{"+match+"}");
            let front = utteranceStart + utteranceEnd.substring(0, location);
            let back = utteranceEnd.substring(location + match.length + 2, utteranceEnd.length);
            //if we have items to replace
            for(let j = 0; j < replacements.length; j++){
                let replacement = replacements[j];
                addUtteranceChecks(intent, front, "{" + replacement + "}" + back, utterancesToCheck, associationMap, childMatches);
            }
        }else{
            //else move to our next replace field
            addUtteranceChecks(intent, utteranceStart, utteranceEnd, utterancesToCheck, associationMap, childMatches);
        }


    }




    /*
     * Test to check whether all Slots are used in an Intent.
     */
    tests.push({
        "name" : "Slot Used In Intent",
        "description" : "Test to check whether all Slots are used in an Intent.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let slots = getHashOfSlots(interactionModel);
            let intents = getHashOfIntents(interactionModel);
            
            for(let slotType in slots){
                if(!slots.hasOwnProperty(slotType)){ continue; } //property is from prototype, skip
                let found = false;
                
                for(let intentProp in intents){
                    if(!intents.hasOwnProperty(intentProp)){ continue; } //property is from prototype, skip
                    let intent = intents[intentProp];
                    if(intent.slots){
                        for(let i = 0; i < intent.slots.length; i++){
                            let slot = intent.slots[i];
                            if(slotType === slot.type){
                                found = true;
                            }
                        }
                    }
                    if(found){
                        break;
                    }
                }
                
                if(!found){
                    errors.push("Slot '" + slotType + "' never used in Intents");
                }
            }
            
            
            callback(test, errors, warnings);
        }
    });



    /*
     * Test to check whether all Slots defined in the Intent Schema are used in at least one Sample Utterance.
     */
    tests.push({
        "name" : "Intents Use All Slots",
        "description" : "Test to check whether all Slots defined in the Intent Schema are used in at least one Sample Utterance.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            
            let intents = getHashOfIntents(interactionModel);
            let utterances = getHashOfUtterances(interactionModel);
            for(let prop in intents){
                if(!intents.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let intent = intents[prop];
                let intentSlots = intent.slots;
                if(!intentSlots){
                    //no slots for this intent
                    continue;
                }
                for(let i = 0; i < intentSlots.length; i++){
                    let slotName = intentSlots[i].name;
                    let intentUtterances = utterances[prop];
                    let found = false;
                    if(intentUtterances){
                        for(let j = 0; j < intentUtterances.length; j++){
                            let utterance = intentUtterances[j];
                            if(utterance.indexOf("{" + slotName + "}") !== -1){
                                found = true;
                                break;
                            }
                        }
                    }
                    if(!found){
                        errors.push("Intent '" + prop + "' never uses Slot '" + slotName + "'");
                    }
                }
            }
            callback(test, errors, warnings);
        }
    });



    /*
     * Test to check whether abbreviations are spelled out, this will not catch all abbreviatons
     * and for that reason this is just a warning to raise a red flag to review.
     * Checks for 2 capital letters next to each other or a capital letter followed by a period not followed by a space
     */
    tests.push({
        "name" : "Utterances Abbreviations Are Formatted For Voice e.g.: 'TV' > 'T. V.'",
        "description" : "Test to check whether abbreviations are spelled out, this will not catch all abbreviatons and for that reason this is just a warning to raise a red flag to review. Checks for 2 capital letters next to each other or a capital letter followed by a period not followed by a space" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#writing-conventions-for-sample-utterances'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let regex = /[A-Z]{2,}|[A-Z]{1,}\.\w{1,}/;

            let utterances = getHashOfUtterances(interactionModel);
            for(let prop in utterances){
                if(!utterances.hasOwnProperty(prop)){ continue; } //property is from prototype, skip
                let intentUtterances = utterances[prop];
                for(let i = 0; i < intentUtterances.length; i++){
                    let utterance = intentUtterances[i];
                    //remove our {SLOT} in case they conflict
                    let testUtterance = utterance.replace(/\{\w+\}/gi, '');
                    let matches = testUtterance.match(regex);    
                    if(matches && matches.length > 0){
                        warnings.push("Utterance '" + utterance + "' abbreviations should be formatted for voice.");
                    }
                }
            }

            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether utterances only contain valid characters
     */
    tests.push({
        "name" : "Utterances Contain Only Valid Characters",
        "description" : "Test to check whether utterances only contain valid characters" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-voice-interface-and-user-experience-testing#writing-conventions-for-sample-utterances'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let regex = getUtteranceValidCharactersRegex(locale);

            let utterances = interactionModel.utterances;
            for(let i = 0; i < utterances.length; i++){
                let utterance = utterances[i];
                let matches = utterance.match(regex);   

                if(matches && matches.length > 0){
                    console.log(locale);
                    console.log(matches);
                    console.log(regex);
                    errors.push("Utterance '" + utterance + "' contains invalid characters.");
                }
            }

            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Example Utterances use the deprecated {...|...} slot format. 
     */
    tests.push({
        "name" : "Does Not Use Deprecated Slot Format",
        "description" : "Test to check whether Example Utterances use the deprecated {...|...} slot format.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            
            let errors = [];
            let warnings = [];
            let regex = /\{[^}]*\|[^}]*\}/;

            let utterances = interactionModel.utterances;
            for(let i = 0; i < utterances.length; i++){
                let utterance = utterances[i];
                let matches = utterance.match(regex);    
                if(matches && matches.length > 0){
                    errors.push("Utterance '" + utterance + "' uses a deprecated slot format.");
                }
            }

            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Skill Metadata exists.
     */
    tests.push({
        "name" : "Skill Metadata Does Not Exist",
        "description" : "Test to check whether Skill Metadata exists.",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                warnings.push("Skill metadata was not found in object.");
            }
            callback(test, errors, warnings);
        }
    });


    /*
     * Test to check whether at least one  Example Utterances/Recommended Phrases is present.
     * Errors if < 1
     * Warns if < 3
     */
    tests.push({
        "name" : "Example Phrases Exist",
        "description" : "Test to check whether at least one  Example Utterances/Recommended Phrases is present. Errors if < 1. Warns if < 3 " +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
           
            if(metadata.examplePhrases){
                for(let i = metadata.examplePhrases.length - 1; i >= 0; i--){
                    let phrase = metadata.examplePhrases[i];
                    if(!phrase || phrase.length < 1){
                        if(locale.examplePhrases){
                            locale.examplePhrases.splice(i, 1);
                        }
                    }
                }
            }
            if(!metadata.examplePhrases || metadata.examplePhrases.length < 1){
                errors.push("Missing example phrases");
            }else if(metadata.examplePhrases.length < 3){
                warnings.push("Less than 3 example phrases");
            }
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether the locale invocation names are less than 3 words in length
     * Warn: invocation length > 3
     */
    tests.push({
        "name" : "Invocation Name Three Words or Less",
        "description" : "Test to check whether the locale invocation names are less than 3 words in length. Warn: invocation length > 3",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }

     
            let invocationName = metadata.invocationName;
            if(invocationName){
                let split = invocationName.split(" ");
                if(split.length > 3){
                    warnings.push(prop + " invocation name '" + invocationName + "' > 3 words in length");
                }
            }else{
                errors.push(prop + " invocation name not present");
            }
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether first Example Utterance/Recommended Phrase has both the wake word and invocation name.
     */
    tests.push({
        "name" : "First Example Phrases has Wake Word and Invocation Name",
        "description" : "Test to check whether first Example Utterance/Recommended Phrase has both the wake word and invocation name." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
           
          
            let invocationName = metadata.invocationName;
            
            if(invocationName && metadata.examplePhrases){
                invocationName = normalizeUtterance(invocationName);
                let invokeRegex = new RegExp("(" + invocationName + ")[^\\w]|(" + invocationName + ")$", 'gi');
                let examplePhrase = metadata.examplePhrases[0];
                examplePhrase = normalizeUtterance(examplePhrase);
                if(!examplePhrase.match(getWakeWordRegex(locale)) || !examplePhrase.match(invokeRegex)){
                    errors.push("First example phrase: '" + examplePhrase + " ' does not contain both the wakeword and the invocation name");
                }
            }else if(!invocationName){
                errors.push("Invocation name does not exist");
            }
           

            
            callback(test, errors, warnings);
        }
    });


    /*
     * Test to check whether Example Utterances/Recommended Phrases included in Sample Utterances.
     */
    tests.push({
        "name" : "Example Phrases In Sample Utterances - No Check Against Amazon.*",
        "description" : "Test to check whether Example Utterances/Recommended Phrases included in Sample Utterances." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }

            let utterances = getSlotReplacedArrayOfUtterances(interactionModel);
            let slots = getHashOfSlots(interactionModel);
            utterances.sort();

            if(metadata.examplePhrases && metadata.examplePhrases.length > 0){
                let invocationName = metadata.invocationName.toLowerCase();
                for(let i = 0; i < metadata.examplePhrases.length; i++){
                    let examplePhrase = metadata.examplePhrases[i];
                    if(!examplePhrase){
                        continue;
                    }
                    //find the location of the invocation name, if there
                    let index = examplePhrase.toLowerCase().indexOf(invocationName);
                    examplePhrase = examplePhrase.substring((index > -1) ? index + invocationName.length : 0,  examplePhrase.length).trim();
                    if(!isUtteranceInUtteranceList(examplePhrase, utterances, slots, locale)){
                        //console.error("Example: " + examplePhrase);
                        errors.push("Example phrase '" + examplePhrase + "'' not found in utterances");
                    }
                }
            } 
            

            callback(test, errors, warnings);
        }
    });


    /*
     * Check to see if a given utterance is represented in the utterance list
     */
    function isUtteranceInUtteranceList(utterance, utteranceList, slots, locale){
        utterance = normalizeUtterance(utterance);
        utterance = utterance.replace(getConnectorWordRegex(locale), '').trim();

        //because example phrases can have dashes, but not utterances
        utterance = utterance.replace("-"," ");

        //console.log(locale+ ": " +utterance);
        if(utterance.length === 0){
            return true;
        }

        for(let i = 0; i < utteranceList.length; i++){
            let current = normalizeUtterance(utteranceList[i]);
            let x = 0, y = 0;
            while(x <= utterance.length && y <= current.length){
                if(x === utterance.length && y === current.length){
                    return true;
                }
                let utteranceLetter = utterance[x];
                let currentLetter = current[y];
                if(currentLetter === "{"){
                    let count = 0;
                    let slot = "";
                    while(currentLetter !== "}"){
                        count++;
                        currentLetter = current[y + count];
                        if(currentLetter !== "}"){
                            slot += currentLetter;
                        }
                    }
                    count++;
                    if(!slots[slot]){
                        console.error("SLOT: '" + slot +"' has no values.");
                        break;
                    }
                    let slotValues = slots[slot].values.sort();
                    
                    let maxLength = 0;
                    for(let j = 0; j < slotValues.length; j++){
                        let currentSlot = normalizeUtterance(slotValues[j]);
                        let part = utterance.substring(x, utterance.length);
                        part = part.toLowerCase();
                        currentSlot = currentSlot.toLowerCase();
                        if(part.startsWith(currentSlot)){
                            maxLength = Math.max(maxLength, currentSlot.length);
                        }

                    }

                    if(maxLength === 0){
                        break;
                    }

                    x += maxLength;
                    y += count;
                    continue;
                }

                
                if(!utteranceLetter || !currentLetter || utteranceLetter.toLowerCase() !== currentLetter.toLowerCase()){
                    break;
                }

                x++;
                y++;
            }
        
        }
        return false;
    }


    /*
     * Test to check whether Example Utterances/Recommended Phrases are composed of valid characters.
     */
    tests.push({
        "name" : "Example Phrases are Composed of Valid Characters",
        "description" : "Test to check whether Example Utterances/Recommended Phrases are composed of valid characters." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
            let regex = getExamplePhraseValidCharactersRegex(locale);
       
            if(metadata.examplePhrases){
                for(let i = metadata.examplePhrases.length - 1; i >= 0; i--){
                    let phrase = metadata.examplePhrases[i];
                    if(!phrase || phrase.length < 1){
                        metadata.examplePhrases.splice(i, 1);
                    }else{
                        let matches = phrase.match(regex);
                        if(matches){
                            errors.push("Example phrase '" + phrase + "' contains invalid characters");
                        }
                    }
                }
            }
                
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Example Utterances/Recommended Phrases end with punctuation.
     */
    tests.push({
        "name" : "Example Phrases End with Punctuation",
        "description" : "Test to check whether Example Utterances/Recommended Phrases end with punctuation." +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
            
            if(metadata.examplePhrases){
                for(let i = metadata.examplePhrases.length - 1; i >= 0; i--){
                    let phrase = metadata.examplePhrases[i];
                    if(!phrase || phrase.length < 1){
                        metadata.examplePhrases.splice(i, 1);
                    }else{
                        let regex = /[.?]$/gm;
                        let matches = phrase.match(regex);
                        if(!matches){
                            errors.push("Example phrase '" + phrase + "' must end with a period or question mark");
                        }
                    }
                }
            }
                
            
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Example Utterances/Recommended Phrases do not contain "Alexa/Amazon/Computer/Echo enable."
     */
    tests.push({
        "name" : "Example Phrases Does Not Enable Skill",
        "description" : "Test to check whether Example Utterances/Recommended Phrases do not contain 'Alexa/Amazon/Computer/Echo enable.'" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#review-and-test-example-phrases'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
            let regex = /^(Alexa|Echo|Computer|Amazon|)\s{0,}enable/gmi;
            
            if(metadata.examplePhrases){
                for(let i = metadata.examplePhrases.length - 1; i >= 0; i--){
                    let phrase = metadata.examplePhrases[i];
                    if(!phrase || phrase.length < 1){
                        metadata.examplePhrases.splice(i, 1);
                    }else{
                        let matches = phrase.match(regex);
                        if(matches){
                            errors.push("Example phrase '" + phrase + "' must not enable a skill");
                        }
                    }
                }
            }
                
            
            callback(test, errors, warnings);
        }
    });


    /*
     * Test to check whether Short skill description (Summary) exists and has content for every single enabled locale
     * Warns if under 20 length
     */
    tests.push({
        "name" : "Short Skill Description (Summary) Exists",
        "description" : "Test to check whether Short skill description (Summary) exists and has content for every single enabled locale. Warns if under 20 length" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#skill-description'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
           
            if(!metadata.summary){
                errors.push("Does not have a short skill description (summary)"); 
            }else if(metadata.summary.length < 20){
                warnings.push("Short skill description (summary) is short"); 
            }
        
            callback(test, errors, warnings);
        }
    });

    /*
     * Test to check whether Long skill description (Description) exists and has content for every single enabled locale
     * Warns if under 40 length
     */
    tests.push({
        "name" : "Long Skill Description (Description) Exists",
        "description" : "Test to check whether Long skill description (Description) exists and has content for every single enabled locale. Warns if under 40 length" +
        "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#skill-description'>DOCUMENTATION</a>",
        "run" : function(test, metadata, interactionModel, locale, callback){
            let errors = [];
            let warnings = [];
            if(!metadata){
                console.warn("Metadata does not exist.");
                callback(null);
                return;
            }
          
            if(!metadata.description){
                errors.push("Does not have a long skill description (description)"); 
            }else if(metadata.description.length < 40){
                warnings.push("Long skill description (description) is short"); 
            }
            
            callback(test, errors, warnings);
        }
    });

    if(typeof GM_xmlhttpRequest !== 'undefined'){
        /*
         * Test to check whether Privacy Policy field is enabled and whether the URL resolves successfully for every single enabled locale
         * Warns if no Privacy Policy
         */
        tests.push({
            "name" : "Privacy Policy Exists and Resolves Successfully - Required For Account Linking",
            "description" : "Test to check whether Privacy Policy field is enabled and whether the URL resolves successfully for every single enabled locale. Warns if no Privacy Policy" +
            "<a href='https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-functional-testing#skill-description'>DOCUMENTATION</a>",
            "run" : function(test, metadata, interactionModel, locale, callback){
                let errors = [];
                let warnings = [];
                if(!metadata){
                    console.warn("Metadata does not exist.");
                    callback(null);
                    return;
                }
                let required = metadata.accountLinkingInfo.supportsLinking;
                let queue = [];
                
                if(!metadata.privacyPolicyUrl){
                    if(required){
                        errors.push("Does not have a privacy policy - required for account linking"); 
                    }else{
                        warnings.push("Does not have a privacy policy"); 
                    }
                }else{
                    queue.push(metadata.privacyPolicyUrl);
                }
                

                let checkQueue = function(){
                    if(queue.length === 0){
                        callback(test, errors, warnings);
                        return;
                    }
                    let url = queue.pop();
                    getRequestResolves(url, function(resolved, err){
                        if(err){
                            errors.push(url + " for Privacy Policy returned with error: " + err);
                        }
                        checkQueue();
                    });
                }
                checkQueue();
            }
        });

        /*
         * Test to check whether Terms of Service field is enabled and whether the URL resolves successfully for every single enabled locale
         * Warns if no TOS
         */
        tests.push({
            "name" : "Terms of Service Exists and Resolves Successfully",
            "description" : "Test to check whether Terms of Service field is enabled and whether the URL resolves successfully for every single enabled locale. Warns if no TOS",
            "run" : function(test, metadata, interactionModel, locale, callback){
                let errors = [];
                let warnings = [];
                if(!metadata){
                    console.warn("Metadata does not exist.");
                    callback(null);
                    return;
                }
               
                let queue = [];
             
                if(!metadata.termsOfUseUrl){
                    warnings.push("Does not have a terms of service"); 
                }else{
                    queue.push(metadata.termsOfUseUrl);
                }
                

                let checkQueue = function(){
                    if(queue.length === 0){
                        callback(test, errors, warnings);
                        return;
                    }
                    let url = queue.pop();
                    getRequestResolves(url, function(resolved, err){
                        if(err){
                            errors.push(url + " for Terms of Service returned with error: " + err);
                        }
                        checkQueue();
                    });
                }
                checkQueue();
            }
        });

        /*
         * Test to check for URLs in the full description and whether the URL resolves successfully for every single enabled locale
         */
        tests.push({
            "name" : "Full Description URLs Resolve",
            "description" : "Test to check for URLs in the full description and whether the URL resolves successfully for every single enabled locale",
            "run" : function(test, metadata, interactionModel, locale, callback){
                let errors = [];
                let warnings = [];
                if(!metadata){
                    console.warn("Metadata does not exist.");
                    callback(null);
                    return;
                }
                let regex = /(ftp:\/\/|www\.|https?:\/\/){1}[a-zA-Z0-9u00a1-\uffff0-]{2,}\.[a-zA-Z0-9u00a1-\uffff0-]{2,}(\S*)/gi;
                
                let queue = [];
              
                if(metadata.description){
                    let matches = metadata.description.match(regex);
                    if(matches){
                        for(let i = 0; i < matches.length; i++){
                            queue.push(matches[i]);
                        }
                    }
                }
                

                let checkQueue = function(){
                    if(!queue || queue.length === 0){
                        callback(test, errors, warnings);
                        return;
                    }
                    let url = queue.pop();
                    getRequestResolves(url, function(resolved, err){
                        console.log("returned");
                        if(err){
                            console.log("added error");
                            errors.push(url + " in description returned with error: " + err);
                            console.log("added error post");
                        }
                        checkQueue();
                    });
                }
                checkQueue();
            }
        });
    }
}
