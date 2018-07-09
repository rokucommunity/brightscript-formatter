import { BrightScriptLexer, TokenType } from 'brightscript-parser';
import { BrightScriptFormatter } from './BrightScriptFormatter';
import { expect } from 'chai';

describe('BrightScriptFormatter', () => {
    let formatter: BrightScriptFormatter;

    beforeEach(() => {
        formatter = new BrightScriptFormatter();
    });

    describe('getCompositeKeywordParts', () => {
        it('works', () => {
            let parts;
            parts = (formatter as any).getCompositeKeywordParts({ value: 'endif' });
            expect(parts[0]).to.equal('end');
            expect(parts[1]).to.equal('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'end if' });
            expect(parts[0]).to.equal('end');
            expect(parts[1]).to.equal('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'elseif' });
            expect(parts[0]).to.equal('else');
            expect(parts[1]).to.equal('if');

            parts = (formatter as any).getCompositeKeywordParts({ value: 'else if' });
            expect(parts[0]).to.equal('else');
            expect(parts[1]).to.equal('if');
        });
    });

    describe('indentStyle', () => {
        it('does not change correctly formatted programs', () => {
            let program = `sub add(a,b)\n    return a+b\nend sub`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('skips indentation when indentStyle:undefined', () => {
            let program = `    sub add(a,b)\nreturn a+b\n    end sub`;
            expect(formatter.format(program, { indentStyle: undefined })).to.equal(program);
        });

        it('formats sing tabs', () => {
            let program = `sub add(a,b)\n\treturn a+b\nend sub`;
            expect(formatter.format(program, { indentStyle: 'tabs' })).to.equal(program);
        });

        it('formats improperly formatted programs', () => {
            expect(formatter.format(`sub add()\nreturn a+b\nend sub`)).to.equal(`sub add()\n    return a+b\nend sub`);
            expect(formatter.format(`    sub add()\n        return a+b\n    end sub`)).to.equal(`sub add()\n    return a+b\nend sub`);
        });

        it('handles intermediate elseif', () => {
            expect(formatter.format(
                `sub add()\nif true then\na=1\nelse if true then\na=1\nend if\nend sub`)).to.equal(
                    `sub add()\n    if true then\n        a=1\n    else if true then\n        a=1\n    end if\nend sub`
                );
        });

        it('handles return token properly', () => {
            expect(formatter.format(
                `sub main()\n if msg.isScreenClosed() then return\n end sub`)
            ).to.equal(
                `sub main()\n    if msg.isScreenClosed() then return\nend sub`
            );

            expect(formatter.format(
                `sub main()\n if msg.isScreenClosed() then\n return\nend if\n end sub`)
            ).to.equal(
                `sub main()\n    if msg.isScreenClosed() then\n        return\n    end if\nend sub`
            );
        });

        it('handles line comments', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`)
            ).to.equal(
                `sub main()\n    'comment1\n    'comment2\nend sub`
            );
        });
    });

    describe('indentSpaceCount', () => {
        it('defaults to 4 spaces', () => {
            let formatted = formatter.format(`sub main()\n'comment1\n'comment2\nend sub`);
            expect(formatted.indexOf('    ')).to.equal(11);
        });

        it('allows overriding indentSpaceCount', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`
                , { indentSpaceCount: 2 }
            )).to.equal(
                `sub main()\n  'comment1\n  'comment2\nend sub`
            );
        });

        it('handles default when invalid provided', () => {
            expect(formatter.format(
                `sub main()\n'comment1\n'comment2\nend sub`
                , { indentSpaceCount: undefined }
            )).to.equal(
                `sub main()\n    'comment1\n    'comment2\nend sub`
            );
        });
    });

    describe('special cases', () => {
        it('open close brace on same line', () => {
            let program = `function http_request()\n    scope = {request: request, port: port, url: url, immediatelyFailed: true}\nend function`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('nested if statements', () => {
            let program = `if (a) then\n    doSomething()\nelse\n    if (b) then\n        doSomething()\n    end if\nend if`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('method called "next"', () => {
            let program = `if true then\n    m.top.returnString = m.someArray.next()\nend if`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('handles string multiple string literals on same line', () => {
            let program = `function test()\n    asdf = "asdf: " + anytostring(m.asdf["asdf"])\nend function`;
            expect(formatter.format(program)).to.equal(program);

            program = `if (m.externalAuth) then\n    jsonData["Access Type"] = "Accessible"\nelse\n    jsonData["Access Type"] = "Link Required"\nend if`;
            expect(formatter.format(program)).to.equal(program);

            program = `lineups_index["audio"] = CreateObject("roAssociativeArray")\nlineups_index["video"] = CreateObject("roAssociativeArray")\nci = 0`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('handles single-line if-then statements', () => {
            let program = `sub test()\n    if true then break\nend sub`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('handles single-line if-then-else statements', () => {
            let program = `sub test()\n    if true then break else break\nend sub`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('handles resetting outdent when gone into the negative', () => {
            let program = `sub test()\n    if true then\n        doSomething()\n    end if\nend if\nend sub\nsub test2()\n    doSomething()\nend sub`;
            expect(formatter.format(program)).to.equal(program);
        });

        it('it works with identifiers that start with rem', () => {
            expect(formatter.format(
                `    if (removeFoo <> invalid) then\n        lineups["video"].push(invalid)`
            )).to.equal(
                `if (removeFoo <> invalid) then\n    lineups["video"].push(invalid)`
            );
        });

        //this does not work yet. 
        it.skip('works with if statements that do not have a "then" after them', () => {
            let program = `if (request.AsyncGetToString())\n    scope.immediatelyFailed = false\nelse\n    scope.immediatelyFailed = true\nend if`;
            expect(formatter.format(program)).to.equal(program);
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
            )).to.equal(
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
            )).to.equal(
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
            )).to.equal(
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
            )).to.equal(
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
            )).to.equal(
                `if true then\n    break\nelseif true then\n    break\nendif`
            );
        });
    });

    describe('removeTrailingWhitespace', () => {
        it('removes trailing spaces by default', () => {
            expect(formatter.format(`name = "bob" `)).to.equal(`name = "bob"`);
        });
        it('removes trailing tabs by default', () => {
            expect(formatter.format(`name = "bob"\t`)).to.equal(`name = "bob"`);
        });
        it('removes both tabs and spaces in same line', () => {
            expect(formatter.format(`name = "bob"\t `)).to.equal(`name = "bob"`);
            expect(formatter.format(`name = "bob" \t`)).to.equal(`name = "bob"`);
        });
        it('removes whitespace from end of comment', () => {
            expect(formatter.format(`'comment `)).to.equal(`'comment`);
            expect(formatter.format(`'comment\t`)).to.equal(`'comment`);
            expect(formatter.format(`'comment \t`)).to.equal(`'comment`);
            expect(formatter.format(`'comment\t `)).to.equal(`'comment`);
        });
        it('handles multi-line prorgams', () => {
            expect(formatter.format(`name = "bob"\t \nage=22 `)).to.equal(`name = "bob"\nage=22`);
        });
        it('leaves normal programs alone', () => {
            expect(formatter.format(`name = "bob"\nage=22 `)).to.equal(`name = "bob"\nage=22`);
        });
        it('skips formatting when the option is set to false', () => {
            expect(formatter.format(`name = "bob" `, { removeTrailingWhiteSpace: false })).to.equal(`name = "bob" `);

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
            expect(format('endfunction', TokenType.endFunction)).to.equal('end function');
            expect(format('endif', TokenType.endFunction)).to.equal('end if');
            expect(format('endsub', TokenType.endFunction)).to.equal('end sub');
            expect(format('endwhile', TokenType.endFunction)).to.equal('end while');
            expect(format('exitwhile', TokenType.endFunction)).to.equal('exit while');
            expect(format('exitfor', TokenType.endFunction)).to.equal('exit for');
            expect(format('endfor', TokenType.endFunction)).to.equal('end for');
            expect(format('elseif', TokenType.endFunction)).to.equal('else if');

            expect(formatter.format(
                `sub add()\n    if true then\n        a=1\n    elseif true then\n        a=1\n    endif\nendsub`,
                {
                    compositeKeywords: 'split'
                }
            )).to.equal(
                `sub add()\n    if true then\n        a=1\n    else if true then\n        a=1\n    end if\nend sub`,
            );
        });

        it('honors case', () => {
            expect(format('endFUNCTION', TokenType.endFunction)).to.equal('end FUNCTION');
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
            expect(tokens[1].startIndex).to.equal(7);
            expect(tokens[2].startIndex).to.equal(8);
        });

        it('handles multi-line arrays', () => {
            let program = `function DoSomething()\ndata=[\n1,\n2\n]\nend function`;
            expect(formatter.format(program)).to.equal(`function DoSomething()\n    data=[\n        1,\n        2\n    ]\nend function`);
        });
    });
});