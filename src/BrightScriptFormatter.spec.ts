import { BrightScriptFormatter } from './BrightScriptFormatter';
describe('BrightScriptFormatter', () => {
    let formatter: BrightScriptFormatter;
    beforeEach(() => {
        formatter = new BrightScriptFormatter();
    });
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