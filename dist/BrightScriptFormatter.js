"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var brightscript_parser_1 = require("brightscript-parser");
var BrightScriptFormatter = /** @class */ (function () {
    function BrightScriptFormatter() {
    }
    /**
     * Format the given input.
     * @param inputText the text to format
     * @param formattingOptions options specifying formatting preferences
     */
    BrightScriptFormatter.prototype.format = function (inputText, formattingOptions) {
        var options = this.normalizeOptions(formattingOptions);
        var lexer = new brightscript_parser_1.BrightScriptLexer();
        var tokens = lexer.tokenize(inputText);
        //force all composite keywords to have 0 or 1 spaces in between, but no more than 1
        tokens = this.normalizeCompositeKeywords(tokens);
        if (options.compositeKeywords) {
            tokens = this.formatCompositeKeywords(tokens, options);
        }
        if (options.indentStyle) {
            tokens = this.formatIndentation(tokens, options);
        }
        if (options.keywordCase) {
            tokens = this.formatKeywordCasing(tokens, options);
        }
        //join all tokens back together into a single string
        var outputText = '';
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            outputText += token.value;
        }
        return outputText;
    };
    /**
     * Remove all whitespace in the composite keyword tokens with a single space
     * @param tokens
     */
    BrightScriptFormatter.prototype.normalizeCompositeKeywords = function (tokens) {
        var indexOffset = 0;
        for (var _i = 0, tokens_2 = tokens; _i < tokens_2.length; _i++) {
            var token = tokens_2[_i];
            token.startIndex += indexOffset;
            //is this a composite token
            if (brightscript_parser_1.CompositeKeywordTokenTypes.indexOf(token.tokenType) > -1) {
                var value = token.value;
                //remove all whitespace with a single space
                token.value.replace(/s+/g, ' ');
                var indexDifference = value.length - token.value.length;
                indexOffset -= indexDifference;
            }
        }
        return tokens;
    };
    BrightScriptFormatter.prototype.formatCompositeKeywords = function (tokens, options) {
        var indexOffset = 0;
        for (var _i = 0, tokens_3 = tokens; _i < tokens_3.length; _i++) {
            var token = tokens_3[_i];
            token.startIndex += indexOffset;
            //is this a composite token
            if (brightscript_parser_1.CompositeKeywordTokenTypes.indexOf(token.tokenType) > -1) {
                var parts = this.getCompositeKeywordParts(token);
                var tokenValue = token.value;
                if (options.compositeKeywords === 'combine') {
                    token.value = parts[0] + parts[1];
                }
                else {
                    token.value = parts[0] + ' ' + parts[1];
                }
                var offsetDifference = token.value.length - tokenValue.length;
                indexOffset += offsetDifference;
            }
        }
        return tokens;
    };
    BrightScriptFormatter.prototype.getCompositeKeywordParts = function (token) {
        var lowerValue = token.value.toLowerCase();
        //split the parts of the token, but retain their case
        if (lowerValue.indexOf('end') === 0) {
            return [token.value.substring(0, 3), token.value.substring(3).trim()];
        }
        else {
            return [token.value.substring(0, 4), token.value.substring(4).trim()];
        }
    };
    BrightScriptFormatter.prototype.formatKeywordCasing = function (tokens, options) {
        for (var _i = 0, tokens_4 = tokens; _i < tokens_4.length; _i++) {
            var token = tokens_4[_i];
            //if this token is a keyword
            if (brightscript_parser_1.KeywordTokenTypes.indexOf(token.tokenType) > -1) {
                switch (options.keywordCase) {
                    case 'lower':
                        token.value = token.value.toLowerCase();
                        break;
                    case 'upper':
                        token.value = token.value.toUpperCase();
                        break;
                    case 'title':
                        var lowerValue = token.value.toLowerCase();
                        if (brightscript_parser_1.CompositeKeywordTokenTypes.indexOf(token.tokenType) === -1) {
                            token.value = token.value.substring(0, 1).toUpperCase() + token.value.substring(1).toLowerCase();
                        }
                        else {
                            var spaceCharCount = (lowerValue.match(/\s+/) || []).length;
                            var firstWordLength = 0;
                            if (lowerValue.indexOf('end') === 0) {
                                firstWordLength = 3;
                            }
                            else {
                                firstWordLength = 4;
                            }
                            token.value =
                                //first character
                                token.value.substring(0, 1).toUpperCase() +
                                    //rest of first word
                                    token.value.substring(1, firstWordLength).toLowerCase() +
                                    //add back the whitespace
                                    token.value.substring(firstWordLength, firstWordLength + spaceCharCount) +
                                    //first character of second word
                                    token.value.substring(firstWordLength + spaceCharCount, firstWordLength + spaceCharCount + 1).toUpperCase() +
                                    //rest of second word
                                    token.value.substring(firstWordLength + spaceCharCount + 1).toLowerCase();
                        }
                }
            }
        }
        return tokens;
    };
    BrightScriptFormatter.prototype.formatIndentation = function (tokens, options) {
        var indentTokens = [
            brightscript_parser_1.TokenType.sub,
            brightscript_parser_1.TokenType.for,
            brightscript_parser_1.TokenType.function,
            brightscript_parser_1.TokenType.if,
            brightscript_parser_1.TokenType.openCurlyBraceSymbol,
            brightscript_parser_1.TokenType.openSquareBraceSymbol,
            brightscript_parser_1.TokenType.while
        ];
        var outdentTokens = [
            brightscript_parser_1.TokenType.closeCurlyBraceSymbol,
            brightscript_parser_1.TokenType.closeSquareBraceSymbol,
            brightscript_parser_1.TokenType.endFunction,
            brightscript_parser_1.TokenType.endIf,
            brightscript_parser_1.TokenType.endSub,
            brightscript_parser_1.TokenType.endWhile,
            brightscript_parser_1.TokenType.endFor,
            brightscript_parser_1.TokenType.next,
        ];
        var interumTokens = [
            brightscript_parser_1.TokenType.else,
            brightscript_parser_1.TokenType.elseIf
        ];
        var tabCount = 0;
        var nextLineStartTokenIndex = 0;
        //the list of output tokens
        var outputTokens = [];
        //set the loop to run for a max of double the number of tokens we found so we don't end up with an infinite loop
        outer: for (var outerLoopCounter = 0; outerLoopCounter <= tokens.length * 2; outerLoopCounter++) {
            var lineObj = this.getLineTokens(nextLineStartTokenIndex, tokens);
            nextLineStartTokenIndex = lineObj.stopIndex + 1;
            var lineTokens = lineObj.tokens;
            var thisTabCount = tabCount;
            var foundIndentorThisLine = false;
            //if this is a single-line if statement, do nothing with indentation
            if (this.isSingleLineIfStatement(lineTokens, tokens)) {
                // //if this line has a return statement, outdent
                // if (this.tokenIndexOf(TokenType.return, lineTokens) > -1) {
                //     tabCount--;
                // } else {
                //     //do nothing with single-line if statement indentation
                // }
            }
            else {
                for (var _i = 0, lineTokens_1 = lineTokens; _i < lineTokens_1.length; _i++) {
                    var token = lineTokens_1[_i];
                    //if this is an indentor token, 
                    if (indentTokens.indexOf(token.tokenType) > -1) {
                        tabCount++;
                        foundIndentorThisLine = true;
                        //this is an outdentor token
                    }
                    else if (outdentTokens.indexOf(token.tokenType) > -1) {
                        tabCount--;
                        if (foundIndentorThisLine === false) {
                            thisTabCount--;
                        }
                        //this is an interum token
                    }
                    else if (interumTokens.indexOf(token.tokenType) > -1) {
                        //these need outdented, but don't change the tabCount 
                        thisTabCount--;
                    }
                    //  else if (token.tokenType === TokenType.return && foundIndentorThisLine) {
                    //     //a return statement on the same line as an indentor means we don't want to indent
                    //     tabCount--;
                    // }
                }
            }
            //if the tab counts are less than zero, something is wrong. However, at least try to do formatting as best we can by resetting to 0
            thisTabCount = thisTabCount < 0 ? 0 : thisTabCount;
            tabCount = tabCount < 0 ? 0 : tabCount;
            var leadingWhitespace = void 0;
            if (options.indentStyle === 'spaces') {
                var indentSpaceCount = options.indentSpaceCount ? options.indentSpaceCount : BrightScriptFormatter.DEFAULT_INDENT_SPACE_COUNT;
                var spaceCount = thisTabCount * indentSpaceCount;
                leadingWhitespace = Array(spaceCount + 1).join(' ');
            }
            else {
                leadingWhitespace = Array(thisTabCount + 1).join('\t');
            }
            //create a whitespace token if there isn't one
            if (lineTokens[0] && lineTokens[0].tokenType !== brightscript_parser_1.TokenType.whitespace) {
                lineTokens.unshift({
                    startIndex: -1,
                    tokenType: brightscript_parser_1.TokenType.whitespace,
                    value: ''
                });
            }
            //replace the whitespace with the formatted whitespace
            lineTokens[0].value = leadingWhitespace;
            //add this list of tokens 
            outputTokens.push.apply(outputTokens, lineTokens);
            //if we have found the end of file
            if (lineTokens[lineTokens.length - 1].tokenType === brightscript_parser_1.TokenType.END_OF_FILE) {
                break outer;
            }
            /* istanbul ignore next */
            if (outerLoopCounter === tokens.length * 2) {
                throw new Error('Something went terribly wrong');
            }
        }
        return outputTokens;
    };
    BrightScriptFormatter.prototype.tokenIndexOf = function (tokenType, tokens) {
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token.tokenType === tokenType) {
                return i;
            }
        }
        return -1;
    };
    /**
     * Get the tokens for the whole line starting at the given index
     * @param startIndex
     * @param tokens
     */
    BrightScriptFormatter.prototype.getLineTokens = function (startIndex, tokens) {
        var outputTokens = [];
        var index = startIndex;
        for (index = startIndex; index < tokens.length; index++) {
            var token = tokens[index];
            outputTokens[outputTokens.length] = token;
            if (token.tokenType === brightscript_parser_1.TokenType.newline || token.tokenType === brightscript_parser_1.TokenType.END_OF_FILE) {
                break;
            }
        }
        return {
            startIndex: startIndex,
            stopIndex: index,
            tokens: outputTokens
        };
    };
    BrightScriptFormatter.prototype.normalizeOptions = function (options) {
        var fullOptions = {
            indentStyle: 'spaces',
            indentSpaceCount: BrightScriptFormatter.DEFAULT_INDENT_SPACE_COUNT,
            keywordCase: 'lower',
            compositeKeywords: 'split'
        };
        if (options) {
            for (var attrname in options) {
                fullOptions[attrname] = options[attrname];
            }
        }
        return fullOptions;
    };
    BrightScriptFormatter.prototype.isSingleLineIfStatement = function (lineTokens, allTokens) {
        var ifIndex = this.tokenIndexOf(brightscript_parser_1.TokenType.if, lineTokens);
        if (ifIndex === -1) {
            return false;
        }
        var thenIndex = this.tokenIndexOf(brightscript_parser_1.TokenType.then, lineTokens);
        var elseIndex = this.tokenIndexOf(brightscript_parser_1.TokenType.else, lineTokens);
        //if there's an else on this line, assume this is a one-line if statement
        if (elseIndex > -1) {
            return true;
        }
        //see if there is anything after the "then". If so, assume it's a one-line if statement
        for (var i = thenIndex + 1; i < lineTokens.length; i++) {
            var token = lineTokens[i];
            if (token.tokenType === brightscript_parser_1.TokenType.whitespace || token.tokenType === brightscript_parser_1.TokenType.newline) {
                //do nothing with whitespace and newlines
            }
            else {
                //we encountered a non whitespace and non newline token, so this line must be a single-line if statement
                return true;
            }
        }
        return false;
    };
    /**
     * The default number of spaces when indenting with spaces
     */
    BrightScriptFormatter.DEFAULT_INDENT_SPACE_COUNT = 4;
    return BrightScriptFormatter;
}());
exports.BrightScriptFormatter = BrightScriptFormatter;
