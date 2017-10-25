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
    });
});