# brightscript-formatter
A code formatter for Roku's BrightScript language

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