import { BrightScriptLexer, CompositeKeywordTokenTypes, KeywordTokenTypes, Token, TokenType } from 'brightscript-parser';
export class BrightScriptFormatter {
    constructor() {

    }
    /**
     * The default number of spaces when indenting with spaces
     */
    private static DEFAULT_INDENT_SPACE_COUNT = 4;
    /**
     * Format the given input.
     * @param inputText the text to format
     * @param formattingOptions options specifying formatting preferences
     */
    public format(inputText: string, formattingOptions?: FormattingOptions) {
        let options = this.normalizeOptions(formattingOptions);
        let lexer = new BrightScriptLexer();
        let tokens = lexer.tokenize(inputText);

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
        let outputText = '';
        for (let token of tokens) {
            outputText += token.value;
        }
        return outputText;
    }

    /**
     * Remove all whitespace in the composite keyword tokens with a single space
     * @param tokens
     */
    private normalizeCompositeKeywords(tokens: Token[]) {
        let indexOffset = 0;
        for (let token of tokens) {
            token.startIndex += indexOffset;
            //is this a composite token
            if (CompositeKeywordTokenTypes.indexOf(token.tokenType) > -1) {
                let value = token.value;
                //remove all whitespace with a single space
                token.value.replace(/s+/g, ' ');
                let indexDifference = value.length - token.value.length;
                indexOffset -= indexDifference;
            }
        }
        return tokens;
    }

    private formatCompositeKeywords(tokens: Token[], options: FormattingOptions) {
        let indexOffset = 0;
        for (let token of tokens) {
            token.startIndex += indexOffset;
            //is this a composite token
            if (CompositeKeywordTokenTypes.indexOf(token.tokenType) > -1) {
                let parts = this.getCompositeKeywordParts(token);
                let tokenValue = token.value;
                if (options.compositeKeywords === 'combine') {
                    token.value = parts[0] + parts[1];
                } else {// if(options.compositeKeywords === 'split'){
                    token.value = parts[0] + ' ' + parts[1];
                }
                let offsetDifference = token.value.length - tokenValue.length;
                indexOffset += offsetDifference;
            }
        }
        return tokens;
    }

    private getCompositeKeywordParts(token: Token) {
        let lowerValue = token.value.toLowerCase();
        //split the parts of the token, but retain their case
        if (lowerValue.indexOf('end') === 0) {
            return [token.value.substring(0, 3), token.value.substring(3).trim()];
        } else { // if (lowerValue.indexOf('exit') === 0 || lowerValue.indexOf('else') === 0) {
            return [token.value.substring(0, 4), token.value.substring(4).trim()];
        }
    }

    private formatKeywordCasing(tokens: Token[], options: FormattingOptions) {
        for (let token of tokens) {
            //if this token is a keyword
            if (KeywordTokenTypes.indexOf(token.tokenType) > -1) {
                switch (options.keywordCase) {
                    case 'lower':
                        token.value = token.value.toLowerCase();
                        break;
                    case 'upper':
                        token.value = token.value.toUpperCase();
                        break;
                    case 'title':
                        let lowerValue = token.value.toLowerCase();
                        if (CompositeKeywordTokenTypes.indexOf(token.tokenType) === -1) {
                            token.value = token.value.substring(0, 1).toUpperCase() + token.value.substring(1).toLowerCase();
                        } else {
                            let spaceCharCount = (lowerValue.match(/\s+/) || []).length;
                            let firstWordLength: number = 0;
                            if (lowerValue.indexOf('end') === 0) {
                                firstWordLength = 3;
                            } else { //if (lowerValue.indexOf('exit') > -1 || lowerValue.indexOf('else') > -1) 
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
    }

    private formatIndentation(tokens: Token[], options: FormattingOptions) {
        let indentTokens = [
            TokenType.sub,
            TokenType.for,
            TokenType.function,
            TokenType.if,
            TokenType.openCurlyBraceSymbol,
            TokenType.openSquareBraceSymbol,
            TokenType.while
        ];
        let outdentTokens = [
            TokenType.closeCurlyBraceSymbol,
            TokenType.closeSquareBraceSymbol,
            TokenType.endFunction,
            TokenType.endIf,
            TokenType.endSub,
            TokenType.endWhile,
            TokenType.endFor,
            TokenType.next,
        ];
        let interumTokens = [
            TokenType.else,
            TokenType.elseIf
        ];
        let tabCount = 0;

        let nextLineStartTokenIndex = 0;
        //the list of output tokens
        let outputTokens: Token[] = [];
        //set the loop to run for a max of double the number of tokens we found so we don't end up with an infinite loop
        outer: for (let outerLoopCounter = 0; outerLoopCounter <= tokens.length * 2; outerLoopCounter++) {
            let lineObj = this.getLineTokens(nextLineStartTokenIndex, tokens);

            nextLineStartTokenIndex = lineObj.stopIndex + 1;
            let lineTokens = lineObj.tokens;
            let thisTabCount = tabCount;
            let foundIndentorThisLine = false;
            for (let token of lineTokens) {
                //if this is an indentor token, 
                if (indentTokens.indexOf(token.tokenType) > -1) {
                    tabCount++;
                    foundIndentorThisLine = true;
                    //this is an outdentor token
                } else if (outdentTokens.indexOf(token.tokenType) > -1) {
                    tabCount--;
                    if (foundIndentorThisLine === false) {
                        thisTabCount--;
                    }
                    //this is an interum token
                } else if (interumTokens.indexOf(token.tokenType) > -1) {
                    //these need outdented, but don't change the tabCount 
                    thisTabCount--;
                } else if (token.tokenType === TokenType.return && foundIndentorThisLine) {
                    //a return statement on the same line as an indentor means we don't want to indent
                    tabCount--;
                }
            }
            if (thisTabCount < 0 || tabCount < 0) {
                throw new Error('TabCount is less than zero for ' + JSON.stringify(lineTokens));
            }
            let leadingWhitespace: string;

            if (options.indentStyle === 'spaces') {
                let indentSpaceCount = options.indentSpaceCount ? options.indentSpaceCount : BrightScriptFormatter.DEFAULT_INDENT_SPACE_COUNT;
                let spaceCount = thisTabCount * indentSpaceCount;
                leadingWhitespace = Array(spaceCount + 1).join(' ');
            } else {
                leadingWhitespace = Array(thisTabCount + 1).join('\t');
            }
            //create a whitespace token if there isn't one
            if (lineTokens[0] && lineTokens[0].tokenType !== TokenType.whitespace) {
                lineTokens.unshift({
                    startIndex: -1,
                    tokenType: TokenType.whitespace,
                    value: ''
                });
            }

            //replace the whitespace with the formatted whitespace
            lineTokens[0].value = leadingWhitespace;

            //add this list of tokens 
            outputTokens.push.apply(outputTokens, lineTokens);
            //if we have found the end of file
            if (lineTokens[lineTokens.length - 1].tokenType === TokenType.END_OF_FILE) {
                break outer;
            }
            if (outerLoopCounter === tokens.length * 2) {
                throw new Error('Something went terribly wrong');
            }
        }
        return outputTokens;
    }

    /**
     * Get the tokens for the whole line starting at the given index
     * @param startIndex
     * @param tokens 
     */
    private getLineTokens(startIndex: number, tokens: Token[]) {
        let outputTokens: Token[] = [];
        let index = startIndex;
        for (index = startIndex; index < tokens.length; index++) {
            let token = tokens[index];
            outputTokens[outputTokens.length] = token;

            if (token.tokenType === TokenType.newline || token.tokenType === TokenType.END_OF_FILE) {
                break;
            }
        }
        return {
            startIndex,
            stopIndex: index,
            tokens: outputTokens
        };
    }

    private normalizeOptions(options: FormattingOptions | undefined) {
        let fullOptions: FormattingOptions = {
            indentStyle: 'spaces',
            indentSpaceCount: BrightScriptFormatter.DEFAULT_INDENT_SPACE_COUNT,
            keywordCase: 'lower',
            compositeKeywords: 'split'
        };
        if (options) {
            for (let attrname in options) {
                fullOptions[attrname] = options[attrname];
            }
        }
        return fullOptions;
    }
}

/**
 * A set of formatting options used to determine how the file should be formatted.
 */
export interface FormattingOptions {
    /**
     * The type of indentation to use when indenting the beginning of lines.
     */
    indentStyle?: 'tabs' | 'spaces' | null;
    /**
     * The number of spaces to use when indentStyle is 'spaces'. Default is 4
     */
    indentSpaceCount?: number;
    /**
     * Replaces all keywords with the upper or lower case settings specified. 
     * If set to null, they are not modified at all.
     */
    keywordCase?: 'lower' | 'upper' | 'title' | null;
    /**
     * Forces all composite keywords (i.e. "elseif", "endwhile", etc...) to be consistent. 
     * If 'split', they are split into their alternatives ("else if", "end while").
     * If 'combine', they are combined ("elseif", "endwhile").
     * If null, they are not modified.
     */
    compositeKeywords?: 'split' | 'combine' | null;
}