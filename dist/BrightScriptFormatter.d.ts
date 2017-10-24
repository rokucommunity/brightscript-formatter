export declare class BrightScriptFormatter {
    constructor();
    /**
     * Format the given input.
     * @param inputText the text to format
     * @param formattingOptions options specifying formatting preferences
     */
    format(inputText: string, formattingOptions?: FormattingOptions): string;
    /**
     * Remove all whitespace in the composite keyword tokens with a single space
     * @param tokens
     */
    private normalizeCompositeKeywords(tokens);
    private breakCompositeKeywords(tokens);
    private formatKeywordCasing(tokens, options);
    private formatIndentation(tokens, options);
    /**
     * Get the tokens for the whole line starting at the given index
     * @param startIndex
     * @param tokens
     */
    private getLineTokens(startIndex, tokens);
    private normalizeOptions(options);
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
    keywordCasing?: 'lower' | 'upper' | 'title' | null;
    /**
     * When true, composite keywords (i.e. "elseif", "endwhile", etc...) are split into their alternatives ("else if", "end while")
     */
    breakCompositeKeywords?: boolean;
}
