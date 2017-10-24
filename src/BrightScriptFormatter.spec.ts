import { TokenType } from 'brightscript-parser';
import { BrightScriptFormatter } from './BrightScriptFormatter';

describe('BrightScriptFormatter', () => {
    let formatter: BrightScriptFormatter;

    beforeEach(() => {
        formatter = new BrightScriptFormatter();
    });

    describe('indentStyle', () => {
        it('does not change correctly formatted programs', () => {
            let program = `sub add(a,b)\n    return a+b\nendsub`;
            expect(formatter.format(program)).toEqual(program);
        });

        it('formats improperly formatted programs', () => {
            expect(formatter.format(`sub add()\nreturn a+b\nendsub`)).toEqual(`sub add()\n    return a+b\nendsub`);
            expect(formatter.format(`    sub add()\n        return a+b\n    endsub`)).toEqual(`sub add()\n    return a+b\nendsub`);
        });

        it('handles intermediate elseif', () => {
            expect(formatter.format(
                `sub add()\nif true then\na=1\nelseif true then\na=1\nendif\nendsub`)).toEqual(
                `sub add()\n    if true then\n        a=1\n    elseif true then\n        a=1\n    endif\nendsub`
                );
        });
    });

    describe('keywordCasing', () => {
        it('forces keywords to upper case', () => {
            expect(formatter.format(
                `sub add()\nif true then\na=1\nelseif true then\na=1\nendif\nendsub`,
                {
                    keywordCasing: 'upper'
                }
            )).toEqual(
                `SUB add()\n    IF true THEN\n        a=1\n    ELSEIF true THEN\n        a=1\n    ENDIF\nENDSUB`,
            );
        });
        it('forces keywords to lower case', () => {
            expect(formatter.format(
                `SUB add()\n    IF true THEN\n        a=1\n    ELSEIF true THEN\n        a=1\n    ENDIF\nENDSUB`,
                {
                    keywordCasing: 'lower'
                }
            )).toEqual(
                `sub add()\n    if true then\n        a=1\n    elseif true then\n        a=1\n    endif\nendsub`,
            );
        });

        it('formats title case', () => {
            expect(formatter.format(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    end if\nENDSUB`,
                {
                    keywordCasing: 'title',
                    breakCompositeKeywords: false
                }
            )).toEqual(
                `Sub add()\n    If true Then\n        a=1\n    ElseIf true Then\n        a=1\n    End If\nEndSub`,
            );
        });


        it('leaves casing alone', () => {
            expect(formatter.format(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    endif\nENDSUB`,
                {
                    keywordCasing: null
                }
            )).toEqual(
                `sub add()\n    IF true then\n        a=1\n    ELSEIF true THEN\n        a=1\n    endif\nENDSUB`,
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
            let tokens = (formatter as any).breakCompositeKeywords([token]);
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
                    breakCompositeKeywords: true
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
            tokens = (formatter as any).breakCompositeKeywords(tokens);
            expect(tokens[1].startIndex).toEqual(7);
            expect(tokens[2].startIndex).toEqual(8);
        });
    });
});