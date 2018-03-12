import { TokenType } from 'brightscript-parser';
import { BrightScriptFormatter } from './BrightScriptFormatter';

describe('BrightScriptFormatter', () => {
    let formatter: BrightScriptFormatter;

    beforeEach(() => {
        formatter = new BrightScriptFormatter();
    });

    describe('getCompositeKeywordParts', () => {
        it('works', () => {
            let parts;
            parts = (formatter as any).getCompositeKeywordParts({ value: 'endif' });
            expect(parts[0]).toEqual('end');
            expect(parts[1]).toEqual('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'end if' });
            expect(parts[0]).toEqual('end');
            expect(parts[1]).toEqual('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'elseif' });
            expect(parts[0]).toEqual('else');
            expect(parts[1]).toEqual('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'else if' });
            expect(parts[0]).toEqual('else');
            expect(parts[1]).toEqual('if');
        });
    });

    describe('indentStyle', () => {
        it('does not change correctly formatted programs', () => {
            let program = `sub add(a,b)\n    return a+b\nend sub`;
            expect(formatter.format(program)).toEqual(program);
        });

        it('works when specified as undefined', () => {
            let program = `sub add(a,b)\n    return a+b\nend sub`;
            expect(formatter.format(program, { indentStyle: undefined })).toEqual(program);
        });

        it('formats sing tabs', () => {
            let program = `sub add(a,b)\n\treturn a+b\nend sub`;
            expect(formatter.format(program, { indentStyle: 'tabs' })).toEqual(program);
        });

        it('formats improperly formatted programs', () => {
            expect(formatter.format(`sub add()\nreturn a+b\nend sub`)).toEqual(`sub add()\n    return a+b\nend sub`);
            expect(formatter.format(`    sub add()\n        return a+b\n    end sub`)).toEqual(`sub add()\n    return a+b\nend sub`);
        });

        it('handles intermediate elseif', () => {
            expect(formatter.format(
                `sub add()\nif true then\na=1\nelse if true then\na=1\nend if\nend sub`)).toEqual(
                    `sub add()\n    if true then\n        a=1\n    else if true then\n        a=1\n    end if\nend sub`
                );
        });

        it('handles return token properly', () => {
            expect(formatter.format(
                `sub main()\n if msg.isScreenClosed() then return\n end sub`)
            ).toEqual(
                `sub main()\n    if msg.isScreenClosed() then return\nend sub`
            );

            expect(formatter.format(
                `sub main()\n if msg.isScreenClosed() then\n return\nend if\n end sub`)
            ).toEqual(
                `sub main()\n    if msg.isScreenClosed() then\n        return\n    end if\nend sub`
            );
        });

        it('handles line comments', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`)
            ).toEqual(
                `sub main()\n    'comment1\n    'comment2\nend sub`
            );
        });
    });

    describe('indentSpaceCount', () => {
        it('defaults to 4 spaces', () => {
            let formatted = formatter.format(`sub main()\n'comment1\n'comment2\nend sub`);
            expect(formatted.indexOf('    ')).toEqual(11);
        });

        it('allows overriding indentSpaceCount', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`
                , { indentSpaceCount: 2 }
            )).toEqual(
                `sub main()\n  'comment1\n  'comment2\nend sub`
            );
        });

        it('handles default when invalid provided', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`
                , { indentSpaceCount: undefined }
            )).toEqual(
                `sub main()\n    'comment1\n    'comment2\nend sub`
            );
        });
    });

    describe('special cases', () => {
        it('open close brace on same line', () => {
            let program = `function http_request()\n    scope = {request: request, port: port, url: url, immediatelyFailed: true}\nend function`;
            expect(formatter.format(program)).toEqual(program);
        });

        it('nested if statements', () => {
            let program = `if (a) then\n    doSomething()\nelse\n    if (b) then\n        doSomething()\n    end if\nend if`;
            expect(formatter.format(program)).toEqual(program);
        });

        it('method called "next"', () => {
            let program = `if true then\n    m.top.returnString = m.someArray.next()\nend if`;
            expect(formatter.format(program)).toEqual(program);
        });

        it('handles string multiple string literals on same line', () => {
            let program = `function test()\n    asdf = "asdf: " + anytostring(m.asdf["asdf"])\nend function`;
            expect(formatter.format(program)).toEqual(program);

            program = `if (m.externalAuth) then\n    jsonData["Access Type"] = "Accessible"\nelse\n    jsonData["Access Type"] = "Link Required"\nend if`;
            expect(formatter.format(program)).toEqual(program);

            program = `lineups_index["audio"] = CreateObject("roAssociativeArray")\nlineups_index["video"] = CreateObject("roAssociativeArray")\nci = 0`;
            expect(formatter.format(program)).toEqual(program);
        });
    });

    describe('keywordCase', () => {
        it('forces keywords to upper case', () => {
            expect(formatter.format(
                `sub add()\nif true then\na=1\nelseif true then\na=1\nendif\nendsub`,
                {
                    keywordCase: 'upper',
                    compositeKeywords: null
                }
            )).toEqual(
                `SUB add()\n    IF true THEN\n        a=1\n    ELSEIF true THEN\n        a=1\n    ENDIF\nENDSUB`,
            );
        });
        it('forces keywords to lower case', () => {
            expect(formatter.format(
                `SUB add()\n    IF true THEN\n        a=1\n    ELSEIF true THEN\n        a=1\n    ENDIF\nENDSUB`,
                {
                    keywordCase: 'lower',
                    compositeKeywords: null
                }
            )).toEqual(
                `sub add()\n    if true then\n        a=1\n    elseif true then\n        a=1\n    endif\nendsub`,
            );
        });

        it('formats title case', () => {
            expect(formatter.format(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    end if\nENDSUB`,
                {
                    keywordCase: 'title',
                    compositeKeywords: null
                }
            )).toEqual(
                `Sub add()\n    If true Then\n        a=1\n    ElseIf true Then\n        a=1\n    End If\nEndSub`,
            );
        });

        it('leaves casing alone', () => {
            expect(formatter.format(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    endif\nENDSUB`,
                {
                    keywordCase: null,
                    compositeKeywords: null
                }
            )).toEqual(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    endif\nENDSUB`,
            );
        });

    });

    describe('composite keywords', () => {
        it('joins together when specified', () => {
            expect(formatter.format(
                `if true then\n    break\nelse if true then\n    break\nend if`,
                {
                    keywordCase: 'lower',
                    compositeKeywords: 'combine'
                }
            )).toEqual(
                `if true then\n    break\nelseif true then\n    break\nendif`
            );
        });
    });

    describe('break composite keywords', () => {
        function format(text, tokenType) {
            let token = {
                value: text,
                tokenType,
                startIndex: 0
            };
            let tokens = (formatter as any).formatCompositeKeywords([token], { compositeKeywords: 'split' });
            return tokens[0].value;
        }

        it('adds spaces at proper locations when supposed to', () => {
            expect(format('endfunction', TokenType.endFunction)).toEqual('end function');
            expect(format('endif', TokenType.endFunction)).toEqual('end if');
            expect(format('endsub', TokenType.endFunction)).toEqual('end sub');
            expect(format('endwhile', TokenType.endFunction)).toEqual('end while');
            expect(format('exitwhile', TokenType.endFunction)).toEqual('exit while');
            expect(format('exitfor', TokenType.endFunction)).toEqual('exit for');
            expect(format('endfor', TokenType.endFunction)).toEqual('end for');
            expect(format('elseif', TokenType.endFunction)).toEqual('else if');

            expect(formatter.format(
                `sub add()\n    if true then\n        a=1\n    elseif true then\n        a=1\n    endif\nendsub`,
                {
                    compositeKeywords: 'split'
                }
            )).toEqual(
                `sub add()\n    if true then\n        a=1\n    else if true then\n        a=1\n    end if\nend sub`,
            );
        });

        it('honors case', () => {
            expect(format('endFUNCTION', TokenType.endFunction)).toEqual('end FUNCTION');
        });

        it('adjusts startIndex correctly', () => {
            let tokens = [{
                value: 'elseif',
                tokenType: TokenType.elseIf,
                startIndex: 0
            }, {
                value: ' ',
                tokenType: TokenType.whitespace,
                startIndex: 6
            }, {
                value: 'true',
                tokenType: TokenType.booleanLiteral,
                startIndex: 7
            }];
            tokens = (formatter as any).formatCompositeKeywords(tokens, { compositeKeywords: 'split' });
            expect(tokens[1].startIndex).toEqual(7);
            expect(tokens[2].startIndex).toEqual(8);
        });

        it('handles multi-line arrays', () => {
            let program = `function DoSomething()\ndata=[\n1,\n2\n]\nend function`;
            expect(formatter.format(program)).toEqual(`function DoSomething()\n    data=[\n        1,\n        2\n    ]\nend function`);
        });
    });
});