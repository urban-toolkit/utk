export abstract class InteractionChannel {
    /**
     * Loads blablabla
     * @param {Function} myString blabla
     * @return { any } bla
     */

    protected static modifyGrammarVisibility: Function;

    public static setModifyGrammarVisibility(modifyGrammar: Function): void {
        this.modifyGrammarVisibility = modifyGrammar;
    }

    public static getModifyGrammarVisibility(): Function{
        return this.modifyGrammarVisibility;
    }
}
