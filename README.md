# brightscript-formatter

A code formatter for Roku's BrightScript language


[![Build Status](https://travis-ci.org/TwitchBronBron/brightscript-formatter.svg?branch=master)](https://travis-ci.org/TwitchBronBron/brightscript-formatter)
[![Coverage Status](https://coveralls.io/repos/github/TwitchBronBron/brightscript-formatter/badge.svg?branch=master)](https://coveralls.io/github/TwitchBronBron/brightscript-formatter?branch=master)

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
Click [here](https://github.com/TwitchBronBron/brightscript-formatter/blob/master/src/BrightScriptFormatter.ts#L265) to view all of the formatting options
