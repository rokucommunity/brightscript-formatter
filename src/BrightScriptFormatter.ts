import { BrightScriptLexer, Token, TokenType } from 'brightscript-parser';
export class BrightScriptFormatter {
    constructor() {

    }
    /**
     * Format the given input.
     * @param inputText the text to format
     * @param formattingOptions options specifying formatting preferences
     */
    public format(inputText: string, formattingOptions?: FormattingOptions) {
        let options = this.normalizeOptions(formattingOptions);
        let lexer = new BrightScriptLexer();

        let indentTokens = [
            TokenType.sub,
            TokenType.for,
            TokenType.function,
            TokenType.if,
            TokenType.openCurlyBraceSymbol,
            TokenType.while
        ];
        let outdentTokens = [
            TokenType.closeCurlyBraceSymbol,
            TokenType.endFunction,
            TokenType.endIf,
            TokenType.endSub,
            TokenType.endWhile,
            TokenType.endFor,
            TokenType.next
        ];
        let interumTokens = [
            TokenType.else,
            TokenType.elseIf
        ];
        let tabCount = 0;

        let tokens = lexer.tokenize(inputText);
        let nextLineStartTokenIndex = 0;
        //the list of output tokens
        let outputTokens: Token[] = [];
        //set the loop to run for a max of double the number of tokens we found so we don't end up with an infinite loop
        outer: for (let outerLoopCounter = 0; outerLoopCounter <= tokens.length * 2; outerLoopCounter++) {
            let lineObj = this.getLineTokens(nextLineStartTokenIndex, tokens);

            nextLineStartTokenIndex = lineObj.stopIndex + 1;
            let lineTokens = lineObj.tokens;
            let thisTabCount = tabCount;

            for (let token of lineTokens) {
                //if this is an indentor token, 
                if (indentTokens.indexOf(token.tokenType) > -1) {
                    tabCount++;
                    //this is an outdentor token
                } else if (outdentTokens.indexOf(token.tokenType) > -1) {
                    tabCount--;
                    thisTabCount--;
                    //this is an interum token
                } else if (interumTokens.indexOf(token.tokenType) > -1) {
                    //these need outdented, but don't change the tabCount 
                    thisTabCount--;
                }
            }
            if (thisTabCount < 0 || tabCount < 0) {
                throw new Error('TabCount is less than zero for ' + JSON.stringify(lineTokens));
            }
            let leadingWhitespace: string;

            if (options.indentStyle === 'spaces') {
                let spaceCount = thisTabCount * 4;
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
        //join all tokens back together into a single string
        let outputText = '';
        for (let token of outputTokens) {
            outputText += token.value;
        }
        return outputText;
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
            indentSpaceCount: 4
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
    indentStyle: 'tabs' | 'spaces';
    /**
     * The number of spaces to use when indentStyle is 'spaces'. Default is 4
     */
    indentSpaceCount: number;

}