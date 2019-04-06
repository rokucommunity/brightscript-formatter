import { TokenType } from 'brightscript-parser';

/**
 * A set of formatting options used to determine how the file should be formatted.
 */
export interface FormattingOptions {
    /**
     * The type of indentation to use when indenting the beginning of lines.
     * Has no effect if `formatIndent` is false
     */
    indentStyle?: 'tabs' | 'spaces';
    /**
     * The number of spaces to use when indentStyle is 'spaces'. Default is 4.
     * Has no effect if `formatIndent` is false
     */
    indentSpaceCount?: number;
    /**
     * If true, the code is indented. If false, the existing indentation is left intact.
     */
    formatIndent?: boolean;
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
    /**
     * If true (the default), trailing white space is removed
     * If false, trailing white space is left intact
     */
    removeTrailingWhiteSpace?: boolean;
    /**
     * If true (the default), all whitespace between items is reduced to exactly 1 space character,
     * and certain keywords and operators are padded with whitespace (i.e. `1+1` becomes `1 + 1`)
     */
    formatInteriorWhitespace?: boolean;
    /**
     * Provides a way to override keyword case at the individual TokenType level
     */
    keywordCaseOverride?: { [id: string]: FormattingOptions['keywordCase'] };

    /**
     * An array of tokens that should have a space to its left and its right.
     * Depends on `formatInteriorWhitespace` being true
     */
    addSpacingTokensBoth?: (TokenType)[];
    /**
     * An array of tokens that should have a space to its left.
     * Depends on `formatInteriorWhitespace` being true
     */
    addSpacingTokensLeft?: (TokenType)[];
    /**
     * An array of tokens that should have a space to its right.
     * Provide an inner array for multi-tokens that must be found together ()
     * Depends on `formatInteriorWhitespace` being true
     */
    addSpacingTokensRight?: (TokenType)[];

    /**
     * An array of tokens that should not have any space to its left or its right.
     * Depends on `formatInteriorWhitespace` being true
     */
    removeSpacingTokensBoth?: (TokenType)[];
    /**
     * An array of tokens that should not have any space to its left.
     * Depends on `formatInteriorWhitespace` being true
     */
    removeSpacingTokensLeft?: (TokenType)[];
    /**
     * An array of tokens that should not have any space to its right.
     * Depends on `formatInteriorWhitespace` being true
     */
    removeSpacingTokensRight?: (TokenType)[];
}
