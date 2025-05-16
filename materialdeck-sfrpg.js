import { tokenAction } from "./actions/token.js";
import { otherAction } from "./actions/other.js";
import { combatTrackerAction } from "./actions/combatTracker.js";
import { Helpers } from "./helpers.js";

export const documentation = "https://materialfoundry.github.io/MaterialDeck_SFRPG/";

Hooks.once('MaterialDeck_Ready', () => {
    Helpers.itemRollMode = new game.materialDeck.Helpers.ModeSwitcher('description', 'mdUpdateItemRollMode');
    
    const moduleData = game.modules.get('materialdeck-sfrpg');

    game.materialDeck.registerSystem({
        systemId: 'sfrpg',
        moduleId: 'materialdeck-sfrpg',
        systemName: 'Starfinder',
        version: moduleData.version,
        manifest: moduleData.manifest,
        documentation, 
        actions: [
            tokenAction,
            otherAction,
            combatTrackerAction
        ]
    });
});