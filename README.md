# brightscript-formatter

A code formatter for Roku's BrightScript language


[![Build Status](https://travis-ci.org/TwitchBronBron/brightscript-formatter.svg?branch=master)](https://travis-ci.org/TwitchBronBron/brightscript-formatter)
[![Coverage Status](https://coveralls.io/repos/github/TwitchBronBron/brightscript-formatter/badge.svg?branch=master)](https://coveralls.io/github/TwitchBronBron/brightscript-formatter?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/TwitchBronBron/brightscript-formatter.svg)](https://greenkeeper.io/)
[![npm](https://img.shields.io/npm/v/brightscript-formatter.svg?branch=master)](https://www.npmjs.com/package/brightscript-formatter)

## Usage
```javascript
import { BrightScriptFormatter } from 'brightscript-formatter';

//create a new instance of the formatter
var formatter = new BrightscriptFormatter();

//retrieve the raw brightscript file contents (probably from fs.readFile)
var unformattedFileContents = getFileAsStringSomehow();

var formattingOptions = {};
//get a formatted version of the brightscript file
var formattedFileContents = formatter.format(unformattedFileContents, formattingOptions);

```

## Formatting Options

```

export interface FormattingOptions {
    /**
     * The type of indentation to use when indenting the beginning of lines.
     */
    indentStyle?: 'tabs' | 'spaces' | 'existing';
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
    /**
     * If true (the default), trailing white space is removed
     * If false, trailing white space is left intact
     */
    removeTrailingWhiteSpace?: boolean;
}

```
